// Unit tests for Review Mode grouping and summary metrics
//
// (c) Copyright 2026 Liminal HQ, Scott Morris
// SPDX-License-Identifier: MIT

import { describe, expect, it } from '@jest/globals';
import type { FileNode } from '../src/scanner.js';
import { groupReviewEntries } from '../src/review/group.js';
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
	size: 100,
	percentOfRoot: 10,
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

describe('review group', () => {
	it('groups by type with item counts and percentages', () => {
		const entries = [
			makeEntry('/root/a.mkv', { extension: '.mkv', inferredType: 'media', size: 400 }),
			makeEntry('/root/b.mp4', { extension: '.mp4', inferredType: 'media', size: 200 }),
			makeEntry('/root/readme.txt', { extension: '.txt', inferredType: 'text', size: 100 }),
		];

		const groups = groupReviewEntries(entries, 'type', 1000);
		expect(groups).toHaveLength(3);
		const mediaGroup = groups.find((group) => group.label === '.mkv');
		expect(mediaGroup?.itemCount).toBe(1);
		expect(mediaGroup?.percentOfRoot).toBeCloseTo(40, 1);
	});

	it('groups by source and preserves totals', () => {
		const entries = [
			makeEntry('/a/file1', { sourceRoot: '/a', size: 300 }),
			makeEntry('/a/file2', { sourceRoot: '/a', size: 200 }),
			makeEntry('/b/file3', { sourceRoot: '/b', size: 100 }),
		];
		const groups = groupReviewEntries(entries, 'source', 1000);

		expect(groups).toHaveLength(2);
		const sourceA = groups.find((group) => group.label === '/a');
		expect(sourceA?.totalSize).toBe(500);
		expect(sourceA?.itemCount).toBe(2);
		expect(sourceA?.percentOfRoot).toBeCloseTo(50, 1);
	});

	it('returns a single all-results group when grouping is none', () => {
		const entries = [makeEntry('/root/one.txt', { size: 10 }), makeEntry('/root/two.txt', { size: 20 })];
		const groups = groupReviewEntries(entries, 'none', 100);
		expect(groups).toHaveLength(1);
		expect(groups[0].key).toBe('__all__');
		expect(groups[0].itemCount).toBe(2);
		expect(groups[0].percentOfRoot).toBeCloseTo(30, 1);
	});
});
