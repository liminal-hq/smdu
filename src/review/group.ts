// Group Review Mode entries and compute group-level summary metrics
//
// (c) Copyright 2026 Liminal HQ, Scott Morris
// SPDX-License-Identifier: MIT

import type { ReviewAgeBucket, ReviewEntry, ReviewGroup, ReviewGroupField } from './types.js';

const AGE_LABELS: Record<ReviewAgeBucket, string> = {
	today: 'Today',
	week: 'This Week',
	month: 'This Month',
	'older-1m': 'Older Than 1 Month',
	'older-3m': 'Older Than 3 Months',
	'older-6m': 'Older Than 6 Months',
	'older-1y': 'Older Than 1 Year',
};

const getTypeLabel = (entry: ReviewEntry): string => {
	if (entry.kind === 'directory') return 'Directories';
	if (entry.extension) return entry.extension;
	if (entry.inferredType) return entry.inferredType;
	return 'No Type';
};

const getGroupKeyAndLabel = (
	entry: ReviewEntry,
	groupBy: ReviewGroupField,
): { key: string; label: string } => {
	switch (groupBy) {
		case 'type': {
			const label = getTypeLabel(entry);
			return { key: `type:${label}`, label };
		}
		case 'parent': {
			return { key: `parent:${entry.parentPath}`, label: entry.parentPath };
		}
		case 'age': {
			const label = entry.ageBucket ? AGE_LABELS[entry.ageBucket] : 'Unknown Age';
			return { key: `age:${entry.ageBucket ?? 'unknown'}`, label };
		}
		case 'source': {
			return { key: `source:${entry.sourceRoot}`, label: entry.sourceRoot };
		}
		case 'none':
		default:
			return { key: '__all__', label: 'All Results' };
	}
};

export const groupReviewEntries = (
	entries: ReviewEntry[],
	groupBy: ReviewGroupField,
	rootSize: number,
): ReviewGroup[] => {
	if (groupBy === 'none') {
		const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);
		const fileCount = entries.filter((entry) => entry.kind === 'file').length;
		const directoryCount = entries.filter((entry) => entry.kind === 'directory').length;
		return [
			{
				key: '__all__',
				label: 'All Results',
				entries,
				totalSize,
				itemCount: entries.length,
				fileCount,
				directoryCount,
				percentOfRoot: rootSize > 0 ? (totalSize / rootSize) * 100 : 0,
			},
		];
	}

	const map = new Map<string, ReviewGroup>();
	for (const entry of entries) {
		const { key, label } = getGroupKeyAndLabel(entry, groupBy);
		const existing = map.get(key);
		if (existing) {
			existing.entries.push(entry);
			existing.totalSize += entry.size;
			existing.itemCount += 1;
			if (entry.kind === 'file') {
				existing.fileCount += 1;
			} else {
				existing.directoryCount += 1;
			}
			continue;
		}

		map.set(key, {
			key,
			label,
			entries: [entry],
			totalSize: entry.size,
			itemCount: 1,
			fileCount: entry.kind === 'file' ? 1 : 0,
			directoryCount: entry.kind === 'directory' ? 1 : 0,
			percentOfRoot: 0,
		});
	}

	const groups = Array.from(map.values());
	for (const group of groups) {
		group.percentOfRoot = rootSize > 0 ? (group.totalSize / rootSize) * 100 : 0;
	}

	return groups;
};
