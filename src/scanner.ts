import fs from 'fs';
import path from 'path';

export interface FileNode {
	name: string;
	path: string;
	size: number;
	isDirectory: boolean;
	isHidden: boolean;
	children?: FileNode[];
	parent?: FileNode;
	mtime: Date;
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

// Simple p-limit implementation to avoid adding dependencies
const pLimit = (concurrency: number) => {
	const queue: (() => Promise<void>)[] = [];
	let activeCount = 0;

	const next = () => {
		activeCount--;
		if (queue.length > 0) {
			const job = queue.shift();
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
				queue.push(job);
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
		isDirectory: stats.isDirectory(),
		isHidden: isHiddenName(name),
		mtime: stats.mtime,
		parent,
	};
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
