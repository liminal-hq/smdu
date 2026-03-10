// Unit tests for Review Mode preset application behaviour
//
// (c) Copyright 2026 Liminal HQ, Scott Morris
// SPDX-License-Identifier: MIT

import { describe, expect, it } from '@jest/globals';
import { applyPreset } from '../src/review/presets.js';
import type { ReviewViewState } from '../src/review/types.js';

const makeState = (overrides: Partial<ReviewViewState> = {}): ReviewViewState => ({
	presetId: 'media-review',
	sortBy: 'size',
	sortOrder: 'desc',
	groupBy: 'type',
	filters: {
		scope: 'files',
		minSizeBytes: 1024,
		ageBuckets: ['older-3m'],
		extensions: ['mkv'],
		inferredTypes: ['media'],
		pathPrefix: '/root/media',
		mediaOnly: true,
		includeHidden: true,
		sourceRoots: ['/root'],
	},
	selectionIndex: 7,
	expandedGroups: { media: true },
	...overrides,
});

describe('review presets', () => {
	it('applies preset filters from a clean baseline', () => {
		const state = makeState();
		const next = applyPreset(state, 'largest-files');

		expect(next.presetId).toBe('largest-files');
		expect(next.sortBy).toBe('size');
		expect(next.sortOrder).toBe('desc');
		expect(next.groupBy).toBe('none');
		expect(next.selectionIndex).toBe(0);
		expect(next.filters.scope).toBe('files');
		expect(next.filters.mediaOnly).toBe(false);
		expect(next.filters.minSizeBytes).toBeUndefined();
		expect(next.filters.ageBuckets).toEqual([]);
		expect(next.filters.extensions).toEqual([]);
		expect(next.filters.inferredTypes).toEqual([]);
		expect(next.filters.pathPrefix).toBeUndefined();
		expect(next.filters.sourceRoots).toEqual([]);
	});

	it('preserves includeHidden while cycling presets', () => {
		const state = makeState({
			filters: {
				...makeState().filters,
				includeHidden: false,
				mediaOnly: false,
				minSizeBytes: 10 * 1024 * 1024,
			},
		});
		const next = applyPreset(state, 'media-review');

		expect(next.filters.includeHidden).toBe(false);
		expect(next.filters.mediaOnly).toBe(true);
		expect(next.filters.minSizeBytes).toBeUndefined();
		expect(next.filters.scope).toBe('files');
	});
});
