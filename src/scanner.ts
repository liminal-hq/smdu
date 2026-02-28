// Scan filesystem paths into a file tree with size and metadata details
//
// (c) Copyright 2026 Liminal HQ, Scott Morris
// SPDX-License-Identifier: MIT

import fs from 'fs';
import path from 'path';

export interface FileNode {
	name: string;
	path: string;
	size: number;
	fileCount: number;
	isDirectory: boolean;
	isSymbolicLink?: boolean;
	isBrokenSymbolicLink?: boolean;
	isHidden: boolean;
	children?: FileNode[];
	parent?: FileNode;
	mode?: number;
	birthtime?: Date;
	mtime: Date;
	linkTarget?: string;
	linkError?: string;
}

export interface ScanProgress {
	currentPath: string;
	directories: number;
	files: number;
	bytes: number;
	errors: number;
}

export type ScanProgressCallback = (progress: ScanProgress) => void;
export type ScanPartialCallback = (root: FileNode) => void;

export class ScanCancelledError extends Error {
	constructor() {
		super('Scan cancelled');
		this.name = 'ScanCancelledError';
	}
}

const isHiddenName = (name: string): boolean => {
	if (name === '.' || name === '..') return false;
	return name.startsWith('.');
};

interface QueueNode {
	value: () => Promise<void>;
	next?: QueueNode;
}

// Simple p-limit implementation to avoid adding dependencies.
// ⚡ Bolt Optimisation: Uses an O(1) linked-list queue rather than an O(n) array-based
// queue.shift() to eliminate severe performance degradation when recursively scanning
// massive directory trees with thousands of queued fs operations.
const pLimit = (concurrency: number) => {
	let head: QueueNode | undefined = undefined;
	let tail: QueueNode | undefined = undefined;
	let activeCount = 0;

	const next = () => {
		activeCount--;
		if (head) {
			const job = head.value;
			head = head.next;
			if (!head) {
				tail = undefined;
			}
			if (job) {
				activeCount++;
				job();
			}
		}
	};

	const run = <T>(fn: () => Promise<T>): Promise<T> => {
		return new Promise((resolve, reject) => {
			const job = async () => {
				try {
					const result = await fn();
					resolve(result);
				} catch (err) {
					reject(err);
				} finally {
					next();
				}
			};

			if (activeCount < concurrency) {
				activeCount++;
				job();
			} else {
				const node: QueueNode = { value: job };
				if (tail) {
					tail.next = node;
					tail = node;
				} else {
					head = tail = node;
				}
			}
		});
	};

	return run;
};

// Limit concurrency to avoid "too many open files" errors and improve performance
const limit = pLimit(64);

const scanDirectoryInternal = async (
	dirPath: string,
	parent?: FileNode,
	onProgress?: ScanProgressCallback,
	progress?: ScanProgress,
	signal?: AbortSignal,
	onPartial?: ScanPartialCallback,
	root?: FileNode,
): Promise<FileNode> => {
	if (signal?.aborted) {
		throw new ScanCancelledError();
	}

	const stats = await limit(() => fs.promises.lstat(dirPath));
	const name = path.basename(dirPath) || dirPath;
	const activeProgress: ScanProgress = progress ?? {
		currentPath: dirPath,
		directories: 0,
		files: 0,
		bytes: 0,
		errors: 0,
	};

	const node: FileNode = {
		name,
		path: dirPath,
		size: stats.size,
		fileCount: stats.isDirectory() ? 0 : 1,
		isDirectory: stats.isDirectory(),
		isSymbolicLink: stats.isSymbolicLink(),
		isBrokenSymbolicLink: false,
		isHidden: isHiddenName(name),
		mode: stats.mode,
		birthtime: stats.birthtime,
		mtime: stats.mtime,
		parent,
	};
	if (node.isSymbolicLink) {
		try {
			node.linkTarget = await limit(() => fs.promises.readlink(dirPath));
		} catch (error) {
			node.isBrokenSymbolicLink = true;
			node.linkError = error instanceof Error ? error.message : String(error);
		}
	}
	const activeRoot = root ?? node;

	activeProgress.currentPath = dirPath;
	if (node.isDirectory) {
		activeProgress.directories += 1;
	} else {
		activeProgress.files += 1;
		activeProgress.bytes += stats.size;
	}
	onProgress?.({ ...activeProgress });
	if (!root) {
		onPartial?.(activeRoot);
	}

	if (node.isDirectory) {
		try {
			const entries = await limit(() => fs.promises.readdir(dirPath));
			const children: FileNode[] = [];
			node.children = children;
			node.size = 0;

			await Promise.all(
				entries.map(async (entry) => {
					if (signal?.aborted) {
						throw new ScanCancelledError();
					}
					const child = await scanDirectoryInternal(
						path.join(dirPath, entry),
						node,
						onProgress,
						activeProgress,
						signal,
						onPartial,
						activeRoot,
					);
					children.push(child);
					node.size += child.size;
					node.fileCount += child.fileCount || 0;
					onPartial?.(activeRoot);
				}),
			);
		} catch (error) {
			if (error instanceof ScanCancelledError) {
				throw error;
			}
			// Handle permission errors or other access issues gracefully
			// console.error(`Could not read directory ${dirPath}:`, error);
			node.children = [];
			activeProgress.errors += 1;
			activeProgress.currentPath = dirPath;
			onProgress?.({ ...activeProgress });
			onPartial?.(activeRoot);
		}
	}

	return node;
};

export async function scanDirectory(
	dirPath: string,
	parent?: FileNode,
	onProgress?: ScanProgressCallback,
	progress?: ScanProgress,
	signal?: AbortSignal,
	onPartial?: ScanPartialCallback,
): Promise<FileNode> {
	return scanDirectoryInternal(dirPath, parent, onProgress, progress, signal, onPartial);
}
