// Define Review Mode types for derived entries, filters, grouping, and state
//
// (c) Copyright 2026 Liminal HQ, Scott Morris
// SPDX-License-Identifier: MIT

import type { FileNode } from '../scanner.js';

export type ReviewScope = 'files' | 'directories' | 'both';

export type ReviewSortField =
	| 'size'
	| 'modified'
	| 'created'
	| 'path'
	| 'type'
	| 'count'
	| 'percent';

export type ReviewSortOrder = 'asc' | 'desc';

export type ReviewGroupField = 'none' | 'type' | 'parent' | 'age' | 'source';

export type ReviewAgeBucket =
	| 'today'
	| 'week'
	| 'month'
	| 'older-1m'
	| 'older-3m'
	| 'older-6m'
	| 'older-1y';

export interface ReviewFilters {
	scope: ReviewScope;
	minSizeBytes?: number;
	ageBuckets: ReviewAgeBucket[];
	extensions: string[];
	inferredTypes: string[];
	pathPrefix?: string;
	mediaOnly: boolean;
	includeHidden: boolean;
	sourceRoots: string[];
}

export interface ReviewPreset {
	id: string;
	label: string;
	sortBy: ReviewSortField;
	sortOrder: ReviewSortOrder;
	groupBy: ReviewGroupField;
	filters: Partial<ReviewFilters>;
}

export interface ReviewEntry {
	id: string;
	node: FileNode;
	path: string;
	parentPath: string;
	basename: string;
	kind: 'file' | 'directory';
	size: number;
	percentOfRoot: number;
	modifiedAt?: Date;
	createdAt?: Date;
	extension: string;
	inferredType: string;
	fileCount: number;
	directoryCount: number;
	sourceRoot: string;
	depthFromRoot: number;
	isHidden: boolean;
	isHiddenByAncestry: boolean;
	isEffectivelyHidden: boolean;
	ageBucket?: ReviewAgeBucket;
}

export interface ReviewGroup {
	key: string;
	label: string;
	entries: ReviewEntry[];
	totalSize: number;
	itemCount: number;
	fileCount: number;
	directoryCount: number;
	percentOfRoot: number;
}

export interface ReviewViewState {
	presetId: string;
	sortBy: ReviewSortField;
	sortOrder: ReviewSortOrder;
	groupBy: ReviewGroupField;
	filters: ReviewFilters;
	selectionIndex: number;
	expandedGroups: Record<string, boolean>;
}

export type ReviewVisibleRow =
	| { kind: 'group'; group: ReviewGroup }
	| { kind: 'entry'; groupKey?: string; entry: ReviewEntry };
