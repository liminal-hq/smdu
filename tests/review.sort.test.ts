// Unit tests for Review Mode sorting and fallback ordering
//
// (c) Copyright 2026 Liminal HQ, Scott Morris
// SPDX-License-Identifier: MIT

import { describe, expect, it } from '@jest/globals';
import type { FileNode } from '../src/scanner.js';
import { sortReviewEntries } from '../src/review/sort.js';
import type { ReviewEntry } from '../src/review/types.js';

const nodeStub: FileNode = {
	name: 'stub',
	path: '/stub',
	size: 1,
	fileCount: 1,
	isDirectory: false,
	isHidden: false,
	mtime: new Date('2026-01-01T00:00:00Z'),
};

const makeEntry = (pathValue: string, overrides: Partial<ReviewEntry> = {}): ReviewEntry => ({
	id: pathValue,
	node: nodeStub,
	path: pathValue,
	parentPath: '/root',
	basename: pathValue.split('/').pop() ?? 'entry',
	kind: 'file',
	size: 1,
	percentOfRoot: 1,
	modifiedAt: new Date('2026-01-01T00:00:00Z'),
	createdAt: new Date('2026-01-01T00:00:00Z'),
	extension: '.txt',
	inferredType: 'text',
	fileCount: 1,
	directoryCount: 0,
	sourceRoot: '/root',
	depthFromRoot: 1,
	isHidden: false,
	isHiddenByAncestry: false,
	isEffectivelyHidden: false,
	ageBucket: 'month',
	...overrides,
});

describe('review sort', () => {
	it('sorts by size descending', () => {
		const entries = [
			makeEntry('/root/a.txt', { size: 2 }),
			makeEntry('/root/b.txt', { size: 20 }),
			makeEntry('/root/c.txt', { size: 10 }),
		];

		const sorted = sortReviewEntries(entries, 'size', 'desc');
		expect(sorted.map((entry) => entry.path)).toEqual([
			'/root/b.txt',
			'/root/c.txt',
			'/root/a.txt',
		]);
	});

	it('uses stable fallback path ordering when primary values tie', () => {
		const entries = [
			makeEntry('/root/z.txt', { fileCount: 1 }),
			makeEntry('/root/a.txt', { fileCount: 1 }),
			makeEntry('/root/m.txt', { fileCount: 1 }),
		];

		const sorted = sortReviewEntries(entries, 'count', 'desc');
		expect(sorted.map((entry) => entry.path)).toEqual([
			'/root/a.txt',
			'/root/m.txt',
			'/root/z.txt',
		]);
	});

	it('sorts created dates with predictable handling for missing values', () => {
		const entries = [
			makeEntry('/root/old.txt', { createdAt: new Date('2020-01-01T00:00:00Z') }),
			makeEntry('/root/new.txt', { createdAt: new Date('2025-01-01T00:00:00Z') }),
			makeEntry('/root/missing.txt', { createdAt: undefined }),
		];

		const sortedAsc = sortReviewEntries(entries, 'created', 'asc');
		expect(sortedAsc.map((entry) => entry.path)).toEqual([
			'/root/missing.txt',
			'/root/old.txt',
			'/root/new.txt',
		]);
	});
});
