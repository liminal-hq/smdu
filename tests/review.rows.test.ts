// Unit tests for Review Mode visible row construction
//
// (c) Copyright 2026 Liminal HQ, Scott Morris
// SPDX-License-Identifier: MIT

import { describe, expect, it } from '@jest/globals';
import type { ReviewEntry, ReviewGroup } from '../src/review/types.js';
import { buildVisibleReviewRows } from '../src/review/rows.js';

const entry = (path: string): ReviewEntry => ({
	id: path,
	node: {} as ReviewEntry['node'],
	path,
	parentPath: '/root',
	basename: path.split('/').pop() ?? path,
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
});

const group = (key: string, entries: ReviewEntry[]): ReviewGroup => ({
	key,
	label: key,
	entries,
	totalSize: entries.reduce((sum, current) => sum + current.size, 0),
	itemCount: entries.length,
	fileCount: entries.length,
	directoryCount: 0,
	percentOfRoot: 0,
});

describe('review rows', () => {
	it('returns entry rows directly for the all-results pseudo-group', () => {
		const groups = [group('__all__', [entry('/root/a.txt'), entry('/root/b.txt')])];
		const rows = buildVisibleReviewRows(groups, {});

		expect(rows).toHaveLength(2);
		expect(rows.every((row) => row.kind === 'entry')).toBe(true);
	});

	it('includes group headers and respects expansion state', () => {
		const groups = [
			group('type:.txt', [entry('/root/a.txt')]),
			group('type:.mkv', [entry('/root/movie.mkv')]),
		];
		const rows = buildVisibleReviewRows(groups, { 'type:.txt': true, 'type:.mkv': false });

		expect(rows).toHaveLength(3);
		expect(rows[0].kind).toBe('group');
		expect(rows[1].kind).toBe('entry');
		expect(rows[2].kind).toBe('group');
	});
});
