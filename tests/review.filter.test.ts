// Unit tests for Review Mode entry filtering behaviour
//
// (c) Copyright 2026 Liminal HQ, Scott Morris
// SPDX-License-Identifier: MIT

import { describe, expect, it } from '@jest/globals';
import type { FileNode } from '../src/scanner.js';
import { filterReviewEntries } from '../src/review/filter.js';
import type { ReviewEntry, ReviewFilters } from '../src/review/types.js';

const nodeStub: FileNode = {
	name: 'stub',
	path: '/stub',
	size: 1,
	fileCount: 1,
	isDirectory: false,
	isHidden: false,
	mtime: new Date('2026-03-01T00:00:00Z'),
};

const makeEntry = (overrides: Partial<ReviewEntry>): ReviewEntry => ({
	id: overrides.path ?? '/root/stub.txt',
	node: nodeStub,
	path: '/root/stub.txt',
	parentPath: '/root',
	basename: 'stub.txt',
	kind: 'file',
	size: 1024,
	percentOfRoot: 10,
	modifiedAt: new Date('2026-03-01T00:00:00Z'),
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

const defaultFilters: ReviewFilters = {
	scope: 'both',
	minSizeBytes: undefined,
	ageBuckets: [],
	extensions: [],
	inferredTypes: [],
	pathPrefix: undefined,
	mediaOnly: false,
	includeHidden: true,
	sourceRoots: [],
};

describe('review filter', () => {
	it('filters by scope and minimum size', () => {
		const entries = [
			makeEntry({ path: '/root/file.txt', kind: 'file', size: 100 }),
			makeEntry({ path: '/root/dir', kind: 'directory', size: 5000, fileCount: 10 }),
		];

		const filtered = filterReviewEntries(entries, {
			...defaultFilters,
			scope: 'directories',
			minSizeBytes: 1000,
		});

		expect(filtered).toHaveLength(1);
		expect(filtered[0].kind).toBe('directory');
	});

	it('filters hidden entries by effective hidden state', () => {
		const entries = [
			makeEntry({ path: '/root/visible.txt', isEffectivelyHidden: false }),
			makeEntry({ path: '/root/.cache/file.bin', extension: '.bin', isEffectivelyHidden: true }),
		];

		const filtered = filterReviewEntries(entries, {
			...defaultFilters,
			includeHidden: false,
		});

		expect(filtered).toHaveLength(1);
		expect(filtered[0].path).toBe('/root/visible.txt');
	});

	it('filters by age, extension, type, path prefix, source, and media-only', () => {
		const entries = [
			makeEntry({
				path: '/root/media/movie.mkv',
				extension: '.mkv',
				inferredType: 'media',
				ageBucket: 'older-3m',
				sourceRoot: '/root',
			}),
			makeEntry({
				path: '/other/media/clip.mp4',
				extension: '.mp4',
				inferredType: 'media',
				ageBucket: 'older-3m',
				sourceRoot: '/other',
			}),
			makeEntry({
				path: '/root/docs/readme.txt',
				extension: '.txt',
				inferredType: 'text',
				ageBucket: 'month',
				sourceRoot: '/root',
			}),
		];

		const filtered = filterReviewEntries(entries, {
			...defaultFilters,
			ageBuckets: ['older-3m'],
			extensions: ['mkv'],
			inferredTypes: ['media'],
			pathPrefix: '/root/media',
			mediaOnly: true,
			sourceRoots: ['/root'],
		});

		expect(filtered).toHaveLength(1);
		expect(filtered[0].path).toBe('/root/media/movie.mkv');
	});
});
