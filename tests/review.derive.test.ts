// Unit tests for Review Mode entry derivation and age bucket logic
//
// (c) Copyright 2026 Liminal HQ, Scott Morris
// SPDX-License-Identifier: MIT

import { describe, expect, it } from '@jest/globals';
import type { FileNode } from '../src/scanner.js';
import {
	countDirectoryDescendants,
	deriveReviewEntries,
	getAgeBucket,
	isEffectivelyHidden,
} from '../src/review/derive.js';

const makeNode = (
	name: string,
	overrides: Partial<FileNode> = {},
	children: FileNode[] = [],
): FileNode => {
	const isDirectory = overrides.isDirectory ?? children.length > 0;
	const node: FileNode = {
		name,
		path: overrides.path ?? `/${name}`,
		size: overrides.size ?? 0,
		fileCount: overrides.fileCount ?? (isDirectory ? 0 : 1),
		isDirectory,
		isHidden: overrides.isHidden ?? name.startsWith('.'),
		children: isDirectory ? children : undefined,
		mtime: overrides.mtime ?? new Date('2026-03-01T00:00:00Z'),
		birthtime: overrides.birthtime,
		parent: overrides.parent,
	};
	for (const child of children) {
		child.parent = node;
	}
	return { ...node, ...overrides };
};

describe('review derive', () => {
	it('derives flattened descendants and tracks hidden ancestry', () => {
		const cacheFile = makeNode('cache.bin', {
			path: '/root/.cache/cache.bin',
			size: 25,
			isDirectory: false,
			isHidden: false,
		});
		const hiddenDir = makeNode('.cache', { path: '/root/.cache', size: 25, isHidden: true }, [
			cacheFile,
		]);
		const visibleFile = makeNode('movie.mkv', {
			path: '/root/movie.mkv',
			size: 100,
			isDirectory: false,
			isHidden: false,
		});
		const root = makeNode('root', { path: '/root', size: 125, isDirectory: true }, [
			hiddenDir,
			visibleFile,
		]);

		const entries = deriveReviewEntries(root, { now: new Date('2026-03-09T12:00:00Z') });

		expect(entries).toHaveLength(3);
		const hiddenDirEntry = entries.find((entry) => entry.path === '/root/.cache');
		expect(hiddenDirEntry?.isEffectivelyHidden).toBe(true);
		const cacheFileEntry = entries.find((entry) => entry.path === '/root/.cache/cache.bin');
		expect(cacheFileEntry?.isHiddenByAncestry).toBe(true);
		expect(cacheFileEntry?.isEffectivelyHidden).toBe(true);
		expect(isEffectivelyHidden(cacheFile)).toBe(true);
	});

	it('assigns non-overlapping age buckets', () => {
		const now = new Date('2026-03-09T12:00:00Z');
		expect(getAgeBucket(new Date('2026-03-09T11:45:00Z'), now)).toBe('today');
		expect(getAgeBucket(new Date('2026-03-07T12:00:00Z'), now)).toBe('week');
		expect(getAgeBucket(new Date('2026-02-20T12:00:00Z'), now)).toBe('month');
		expect(getAgeBucket(new Date('2025-12-20T12:00:00Z'), now)).toBe('older-1m');
		expect(getAgeBucket(new Date('2025-10-01T12:00:00Z'), now)).toBe('older-3m');
		expect(getAgeBucket(new Date('2025-06-15T12:00:00Z'), now)).toBe('older-6m');
		expect(getAgeBucket(new Date('2024-01-01T12:00:00Z'), now)).toBe('older-1y');
	});

	it('counts descendant files and directories for directories', () => {
		const leaf = makeNode('leaf.txt', { path: '/root/a/leaf.txt', size: 1, isDirectory: false });
		const nested = makeNode('a', { path: '/root/a', size: 1, isDirectory: true }, [leaf]);
		const sibling = makeNode('b.txt', { path: '/root/b.txt', size: 1, isDirectory: false });
		const root = makeNode('root', { path: '/root', size: 2, isDirectory: true }, [nested, sibling]);

		expect(countDirectoryDescendants(root)).toEqual({ fileCount: 2, directoryCount: 1 });
		expect(countDirectoryDescendants(sibling)).toEqual({ fileCount: 1, directoryCount: 0 });
	});
});
