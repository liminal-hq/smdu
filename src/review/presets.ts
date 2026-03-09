// Define and apply built-in Review Mode presets
//
// (c) Copyright 2026 Liminal HQ, Scott Morris
// SPDX-License-Identifier: MIT

import type { ReviewPreset, ReviewViewState } from './types.js';

export const REVIEW_PRESETS: ReviewPreset[] = [
	{
		id: 'largest-files',
		label: 'Largest Files',
		sortBy: 'size',
		sortOrder: 'desc',
		groupBy: 'none',
		filters: {
			scope: 'files',
		},
	},
	{
		id: 'largest-directories',
		label: 'Largest Directories',
		sortBy: 'size',
		sortOrder: 'desc',
		groupBy: 'none',
		filters: {
			scope: 'directories',
		},
	},
	{
		id: 'oldest-large-files',
		label: 'Oldest Large Files',
		sortBy: 'modified',
		sortOrder: 'asc',
		groupBy: 'none',
		filters: {
			scope: 'files',
			minSizeBytes: 1024 * 1024 * 1024,
		},
	},
	{
		id: 'recent-growth',
		label: 'Recent Growth',
		sortBy: 'modified',
		sortOrder: 'desc',
		groupBy: 'none',
		filters: {
			scope: 'files',
		},
	},
	{
		id: 'by-type',
		label: 'By Type',
		sortBy: 'type',
		sortOrder: 'asc',
		groupBy: 'type',
		filters: {
			scope: 'files',
		},
	},
	{
		id: 'media-review',
		label: 'Media Review',
		sortBy: 'size',
		sortOrder: 'desc',
		groupBy: 'type',
		filters: {
			scope: 'files',
			mediaOnly: true,
		},
	},
];

export const DEFAULT_REVIEW_PRESET_ID = 'largest-files';

export const getReviewPresetById = (presetId: string): ReviewPreset | undefined =>
	REVIEW_PRESETS.find((preset) => preset.id === presetId);

export const cycleReviewPresetId = (presetId: string, direction: 1 | -1): string => {
	if (REVIEW_PRESETS.length === 0) return presetId;
	const index = REVIEW_PRESETS.findIndex((preset) => preset.id === presetId);
	const current = index >= 0 ? index : 0;
	const next = (current + direction + REVIEW_PRESETS.length) % REVIEW_PRESETS.length;
	return REVIEW_PRESETS[next].id;
};

export const applyPreset = (state: ReviewViewState, presetId: string): ReviewViewState => {
	const preset = getReviewPresetById(presetId);
	if (!preset) return state;

	return {
		...state,
		presetId: preset.id,
		sortBy: preset.sortBy,
		sortOrder: preset.sortOrder,
		groupBy: preset.groupBy,
		filters: {
			...state.filters,
			...preset.filters,
		},
		selectionIndex: 0,
	};
};
