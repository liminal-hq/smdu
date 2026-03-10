// Provide default Review Mode state and filter values
//
// (c) Copyright 2026 Liminal HQ, Scott Morris
// SPDX-License-Identifier: MIT

import { applyPreset, DEFAULT_REVIEW_PRESET_ID, REVIEW_PRESETS } from './presets.js';
import type { ReviewFilters, ReviewViewState } from './types.js';

export const createDefaultReviewFilters = (includeHidden: boolean): ReviewFilters => ({
	scope: 'files',
	minSizeBytes: undefined,
	ageBuckets: [],
	extensions: [],
	inferredTypes: [],
	pathPrefix: undefined,
	mediaOnly: false,
	includeHidden,
	sourceRoots: [],
});

export const createDefaultReviewState = (includeHidden: boolean): ReviewViewState => {
	const base: ReviewViewState = {
		presetId: DEFAULT_REVIEW_PRESET_ID,
		sortBy: 'size',
		sortOrder: 'desc',
		groupBy: 'none',
		filters: createDefaultReviewFilters(includeHidden),
		selectionIndex: 0,
		expandedGroups: {},
	};

	return applyPreset(base, DEFAULT_REVIEW_PRESET_ID);
};

export const getDefaultReviewPreset = () =>
	REVIEW_PRESETS.find((preset) => preset.id === DEFAULT_REVIEW_PRESET_ID) ?? REVIEW_PRESETS[0];
