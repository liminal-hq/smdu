// Derive flattened Review Mode entries from scanned filesystem nodes
//
// (c) Copyright 2026 Liminal HQ, Scott Morris
// SPDX-License-Identifier: MIT

import path from 'path';
import { getFileTypeCategory } from '../fileTypeColours.js';
import type { FileNode } from '../scanner.js';
import type { ReviewAgeBucket, ReviewEntry } from './types.js';

export interface DeriveReviewOptions {
	sourceRoot?: string;
	now?: Date;
	includeRoot?: boolean;
}

interface CreateReviewEntryOptions {
	now: Date;
	depthFromRoot: number;
	hiddenByAncestry: boolean;
	directoryCountMap: Map<FileNode, { fileCount: number; directoryCount: number }>;
}

const addDays = (value: Date, days: number): Date => {
	const next = new Date(value);
	next.setDate(next.getDate() + days);
	return next;
};

const addMonths = (value: Date, months: number): Date => {
	const next = new Date(value);
	next.setMonth(next.getMonth() + months);
	return next;
};

const addYears = (value: Date, years: number): Date => {
	const next = new Date(value);
	next.setFullYear(next.getFullYear() + years);
	return next;
};

const buildDirectoryCountMap = (
	root: FileNode,
): Map<FileNode, { fileCount: number; directoryCount: number }> => {
	const counts = new Map<FileNode, { fileCount: number; directoryCount: number }>();
	const stack: Array<{ node: FileNode; visited: boolean }> = [{ node: root, visited: false }];

	while (stack.length > 0) {
		const frame = stack.pop();
		if (!frame) continue;

		if (!frame.visited) {
			stack.push({ node: frame.node, visited: true });
			for (const child of frame.node.children ?? []) {
				stack.push({ node: child, visited: false });
			}
			continue;
		}

		if (!frame.node.isDirectory) {
			counts.set(frame.node, { fileCount: 1, directoryCount: 0 });
			continue;
		}

		let fileCount = 0;
		let directoryCount = 0;
		for (const child of frame.node.children ?? []) {
			const childCounts = counts.get(child) ?? {
				fileCount: child.isDirectory ? 0 : 1,
				directoryCount: 0,
			};
			fileCount += childCounts.fileCount;
			if (child.isDirectory) {
				directoryCount += 1 + childCounts.directoryCount;
			}
		}

		counts.set(frame.node, { fileCount, directoryCount });
	}

	return counts;
};

export function countDirectoryDescendants(node: FileNode): { fileCount: number; directoryCount: number } {
	if (!node.isDirectory) {
		return { fileCount: 1, directoryCount: 0 };
	}

	let fileCount = 0;
	let directoryCount = 0;
	const stack = [...(node.children ?? [])];

	while (stack.length > 0) {
		const current = stack.pop();
		if (!current) continue;
		if (current.isDirectory) {
			directoryCount += 1;
			for (const child of current.children ?? []) {
				stack.push(child);
			}
		} else {
			fileCount += 1;
		}
	}

	return { fileCount, directoryCount };
}

export function isEffectivelyHidden(node: FileNode): boolean {
	if (node.isHidden) return true;

	let current = node.parent;
	while (current) {
		if (current.isHidden) return true;
		current = current.parent;
	}

	return false;
}

export function getExtension(name: string): string {
	return path.extname(name).toLowerCase();
}

export function inferReviewType(node: FileNode): string {
	if (node.isDirectory) return 'directory';
	const category = getFileTypeCategory(node.name, false);
	if (category) return category;
	const extension = getExtension(node.name);
	if (!extension) return 'file';
	return extension.slice(1);
}

export function getAgeBucket(date: Date | undefined, now: Date): ReviewAgeBucket | undefined {
	if (!date || Number.isNaN(date.getTime())) return undefined;

	const oneDayAgo = addDays(now, -1);
	const sevenDaysAgo = addDays(now, -7);
	const oneMonthAgo = addMonths(now, -1);
	const threeMonthsAgo = addMonths(now, -3);
	const sixMonthsAgo = addMonths(now, -6);
	const oneYearAgo = addYears(now, -1);

	if (date >= oneDayAgo) return 'today';
	if (date >= sevenDaysAgo) return 'week';
	if (date >= oneMonthAgo) return 'month';
	if (date >= threeMonthsAgo) return 'older-1m';
	if (date >= sixMonthsAgo) return 'older-3m';
	if (date >= oneYearAgo) return 'older-6m';
	return 'older-1y';
}

export function createReviewEntry(
	node: FileNode,
	root: FileNode,
	sourceRoot: string,
	options?: Partial<CreateReviewEntryOptions>,
): ReviewEntry {
	const now = options?.now ?? new Date();
	const depthFromRoot = options?.depthFromRoot ?? 0;
	const hiddenByAncestry = options?.hiddenByAncestry ?? false;
	const directoryCountMap = options?.directoryCountMap ?? new Map<FileNode, { fileCount: number; directoryCount: number }>();

	const counts = directoryCountMap.get(node) ??
		(node.isDirectory
			? countDirectoryDescendants(node)
			: {
					fileCount: 1,
					directoryCount: 0,
				});

	const effectiveHidden = node.isHidden || hiddenByAncestry;
	const modifiedAt = node.mtime;
	const createdAt = node.birthtime;

	return {
		id: node.path,
		node,
		path: node.path,
		parentPath: node.parent?.path ?? path.dirname(node.path),
		basename: node.name,
		kind: node.isDirectory ? 'directory' : 'file',
		size: node.size,
		percentOfRoot: root.size > 0 ? (node.size / root.size) * 100 : 0,
		modifiedAt,
		createdAt,
		extension: getExtension(node.name),
		inferredType: inferReviewType(node),
		fileCount: counts.fileCount,
		directoryCount: counts.directoryCount,
		sourceRoot,
		depthFromRoot,
		isHidden: node.isHidden,
		isHiddenByAncestry: hiddenByAncestry,
		isEffectivelyHidden: effectiveHidden,
		ageBucket: getAgeBucket(modifiedAt, now),
	};
}

export function deriveReviewEntries(root: FileNode, options: DeriveReviewOptions = {}): ReviewEntry[] {
	const now = options.now ?? new Date();
	const sourceRoot = options.sourceRoot ?? root.path;
	const includeRoot = options.includeRoot ?? false;
	const entries: ReviewEntry[] = [];
	const directoryCountMap = buildDirectoryCountMap(root);

	type StackItem = {
		node: FileNode;
		depthFromRoot: number;
		hiddenByAncestry: boolean;
	};

	const stack: StackItem[] = [];

	if (includeRoot) {
		stack.push({ node: root, depthFromRoot: 0, hiddenByAncestry: false });
	} else {
		const children = root.children ?? [];
		for (let i = children.length - 1; i >= 0; i -= 1) {
			stack.push({ node: children[i], depthFromRoot: 1, hiddenByAncestry: false });
		}
	}

	while (stack.length > 0) {
		const current = stack.pop();
		if (!current) continue;

		entries.push(
			createReviewEntry(current.node, root, sourceRoot, {
				now,
				depthFromRoot: current.depthFromRoot,
				hiddenByAncestry: current.hiddenByAncestry,
				directoryCountMap,
			}),
		);

		const nextHiddenByAncestry = current.hiddenByAncestry || current.node.isHidden;
		const children = current.node.children ?? [];
		for (let i = children.length - 1; i >= 0; i -= 1) {
			stack.push({
				node: children[i],
				depthFromRoot: current.depthFromRoot + 1,
				hiddenByAncestry: nextHiddenByAncestry,
			});
		}
	}

	return entries;
}
