// Sort Review Mode entries with stable fallback ordering
//
// (c) Copyright 2026 Liminal HQ, Scott Morris
// SPDX-License-Identifier: MIT

import type { ReviewEntry, ReviewSortField, ReviewSortOrder } from './types.js';

const compareStrings = (a: string, b: string): number => a.localeCompare(b);

const compareNumbers = (a: number, b: number): number => {
	if (a === b) return 0;
	return a < b ? -1 : 1;
};

const getDateValue = (value: Date | undefined): number => {
	if (!value || Number.isNaN(value.getTime())) return Number.NEGATIVE_INFINITY;
	return value.getTime();
};

const getPrimaryComparison = (a: ReviewEntry, b: ReviewEntry, sortBy: ReviewSortField): number => {
	switch (sortBy) {
		case 'size':
			return compareNumbers(a.size, b.size);
		case 'modified':
			return compareNumbers(getDateValue(a.modifiedAt), getDateValue(b.modifiedAt));
		case 'created':
			return compareNumbers(getDateValue(a.createdAt), getDateValue(b.createdAt));
		case 'path':
			return compareStrings(a.path, b.path);
		case 'type': {
			const aType = `${a.inferredType}:${a.extension}`;
			const bType = `${b.inferredType}:${b.extension}`;
			return compareStrings(aType, bType);
		}
		case 'count':
			return compareNumbers(a.fileCount, b.fileCount);
		case 'percent':
			return compareNumbers(a.percentOfRoot, b.percentOfRoot);
		default:
			return 0;
	}
};

export const sortReviewEntries = (
	entries: ReviewEntry[],
	sortBy: ReviewSortField,
	sortOrder: ReviewSortOrder,
): ReviewEntry[] => {
	const sorted = entries
		.map((entry, index) => ({ entry, index }))
		.sort((left, right) => {
			const primary = getPrimaryComparison(left.entry, right.entry, sortBy);
			if (primary !== 0) {
				return sortOrder === 'asc' ? primary : -primary;
			}

			const fallbackPath = compareStrings(left.entry.path, right.entry.path);
			if (fallbackPath !== 0) return fallbackPath;

			return compareNumbers(left.index, right.index);
		});

	return sorted.map((value) => value.entry);
};
