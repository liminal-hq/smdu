// Filter derived Review Mode entries by scope, type, age, size, and visibility
//
// (c) Copyright 2026 Liminal HQ, Scott Morris
// SPDX-License-Identifier: MIT

import { getFileTypeCategory } from '../fileTypeColours.js';
import type { ReviewAgeBucket, ReviewEntry, ReviewFilters, ReviewScope } from './types.js';

const normaliseExtension = (value: string): string => {
	const trimmed = value.trim().toLowerCase();
	if (!trimmed) return '';
	return trimmed.startsWith('.') ? trimmed : `.${trimmed}`;
};

export const matchesScope = (entry: ReviewEntry, scope: ReviewScope): boolean => {
	if (scope === 'both') return true;
	if (scope === 'files') return entry.kind === 'file';
	return entry.kind === 'directory';
};

export const matchesMinSize = (entry: ReviewEntry, minSizeBytes?: number): boolean => {
	if (typeof minSizeBytes !== 'number' || Number.isNaN(minSizeBytes)) return true;
	return entry.size >= minSizeBytes;
};

export const matchesAgeBuckets = (entry: ReviewEntry, ageBuckets: ReviewAgeBucket[]): boolean => {
	if (ageBuckets.length === 0) return true;
	if (!entry.ageBucket) return false;
	return ageBuckets.includes(entry.ageBucket);
};

export const matchesExtensions = (entry: ReviewEntry, extensions: string[]): boolean => {
	if (extensions.length === 0) return true;
	if (entry.kind !== 'file') return false;
	const normalised = new Set(
		extensions.map(normaliseExtension).filter((value) => value.length > 0),
	);
	if (normalised.size === 0) return true;
	return normalised.has(entry.extension);
};

export const matchesType = (entry: ReviewEntry, inferredTypes: string[]): boolean => {
	if (inferredTypes.length === 0) return true;
	const wanted = new Set(
		inferredTypes.map((value) => value.trim().toLowerCase()).filter((value) => value.length > 0),
	);
	if (wanted.size === 0) return true;
	return wanted.has(entry.inferredType.toLowerCase());
};

export const matchesPathPrefix = (entry: ReviewEntry, pathPrefix?: string): boolean => {
	if (!pathPrefix || pathPrefix.trim().length === 0) return true;
	return entry.path.startsWith(pathPrefix.trim());
};

export const matchesHidden = (entry: ReviewEntry, includeHidden: boolean): boolean => {
	if (includeHidden) return true;
	return !entry.isEffectivelyHidden;
};

export const matchesMediaOnly = (entry: ReviewEntry, mediaOnly: boolean): boolean => {
	if (!mediaOnly) return true;
	if (entry.kind !== 'file') return false;
	const sampleName = entry.extension ? `sample${entry.extension}` : entry.basename;
	return getFileTypeCategory(sampleName, false) === 'media';
};

export const matchesSourceRoots = (entry: ReviewEntry, sourceRoots: string[]): boolean => {
	if (sourceRoots.length === 0) return true;
	return sourceRoots.includes(entry.sourceRoot);
};

export const filterReviewEntries = (
	entries: ReviewEntry[],
	filters: ReviewFilters,
): ReviewEntry[] => {
	return entries.filter((entry) => {
		if (!matchesScope(entry, filters.scope)) return false;
		if (!matchesMinSize(entry, filters.minSizeBytes)) return false;
		if (!matchesAgeBuckets(entry, filters.ageBuckets)) return false;
		if (!matchesExtensions(entry, filters.extensions)) return false;
		if (!matchesType(entry, filters.inferredTypes)) return false;
		if (!matchesPathPrefix(entry, filters.pathPrefix)) return false;
		if (!matchesHidden(entry, filters.includeHidden)) return false;
		if (!matchesMediaOnly(entry, filters.mediaOnly)) return false;
		if (!matchesSourceRoots(entry, filters.sourceRoots)) return false;
		return true;
	});
};
