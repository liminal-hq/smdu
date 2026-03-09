// Manage filesystem navigation state for flat, tree, and review modes
//
// (c) Copyright 2026 Liminal HQ, Scott Morris
// SPDX-License-Identifier: MIT

import { useEffect, useState, useCallback, useMemo } from 'react';
import { FileNode } from './scanner.js';
import fs from 'fs';
import path from 'path';
import { createDefaultReviewFilters, createDefaultReviewState } from './review/defaults.js';
import { deriveReviewEntries } from './review/derive.js';
import { filterReviewEntries } from './review/filter.js';
import { groupReviewEntries } from './review/group.js';
import { applyPreset, cycleReviewPresetId } from './review/presets.js';
import { buildVisibleReviewRows } from './review/rows.js';
import { sortReviewEntries } from './review/sort.js';
import {
	ReviewEntry,
	ReviewGroupField,
	ReviewScope,
	ReviewSortField,
	ReviewViewState,
	ReviewVisibleRow,
} from './review/types.js';

export type SortField = 'name' | 'size' | 'count';
export type SortOrder = 'asc' | 'desc';
export type ViewMode = 'tree' | 'flat' | 'review';

export interface FileSystemState {
	currentPath: string;
	currentNode: FileNode | null;
	selectionIndex: number;
	sortBy: SortField;
	sortOrder: SortOrder;
	viewMode: ViewMode;
	files: FileNode[];
}

const REVIEW_SORT_ORDER: ReviewSortField[] = [
	'size',
	'modified',
	'created',
	'path',
	'type',
	'count',
	'percent',
];

const REVIEW_GROUP_ORDER: ReviewGroupField[] = ['none', 'type', 'parent', 'age', 'source'];
const REVIEW_SCOPE_ORDER: ReviewScope[] = ['files', 'directories', 'both'];
const REVIEW_MIN_SIZE_ORDER: Array<number | undefined> = [
	undefined,
	100 * 1024 * 1024,
	1024 * 1024 * 1024,
	4 * 1024 * 1024 * 1024,
	10 * 1024 * 1024 * 1024,
];
const REVIEW_AGE_FILTER_ORDER: Array<ReviewViewState['filters']['ageBuckets']> = [
	[],
	['today'],
	['week'],
	['month'],
	['older-1m'],
	['older-3m'],
	['older-6m'],
	['older-1y'],
];

export const findNodeByPath = (root: FileNode, targetPath: string): FileNode | null => {
	if (root.path === targetPath) return root;

	if (!targetPath.startsWith(root.path)) return null;

	const relative = path.relative(root.path, targetPath);
	if (relative === '') return root;
	if (relative.startsWith('..')) return null;

	const segments = relative.split(path.sep);
	let currentNode = root;

	for (const segment of segments) {
		if (!currentNode.children) return null;

		let foundChild: FileNode | undefined;
		for (const child of currentNode.children) {
			if (child.name === segment) {
				foundChild = child;
				break;
			}
		}

		if (foundChild) {
			currentNode = foundChild;
		} else {
			return null;
		}
	}

	return currentNode;
};

export const useFileSystem = (initialNode: FileNode | null, showHiddenFiles = false) => {
	const [currentNode, setCurrentNode] = useState<FileNode | null>(initialNode);
	const [selectionIndex, setSelectionIndex] = useState(0);
	const [sortBy, setSortBy] = useState<SortField>('size');
	const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
	const [viewMode, setViewMode] = useState<ViewMode>('flat');
	const [error, setError] = useState<string | null>(null);
	const [reviewStateByRoot, setReviewStateByRoot] = useState<Record<string, ReviewViewState>>({});
	const [entryPointPath, setEntryPointPath] = useState<string | null>(null);
	const [pendingBrowseSelectionPath, setPendingBrowseSelectionPath] = useState<string | null>(null);

	useEffect(() => {
		if (!initialNode) {
			if (currentNode) {
				setCurrentNode(null);
			}
			setSelectionIndex(0);
			return;
		}
		if (!currentNode) {
			setCurrentNode(initialNode);
			return;
		}

		const updatedNode = findNodeByPath(initialNode, currentNode.path);
		if (updatedNode && updatedNode !== currentNode) {
			setCurrentNode(updatedNode);
		}
	}, [currentNode, initialNode]);

	useEffect(() => {
		if (!currentNode) return;
		setReviewStateByRoot((prev) => {
			if (prev[currentNode.path]) return prev;
			return {
				...prev,
				[currentNode.path]: createDefaultReviewState(showHiddenFiles),
			};
		});
	}, [currentNode, showHiddenFiles]);

	const updateReviewState = useCallback(
		(updater: (state: ReviewViewState) => ReviewViewState) => {
			if (!currentNode) return;
			const rootPath = currentNode.path;
			setReviewStateByRoot((prev) => {
				const existing = prev[rootPath] ?? createDefaultReviewState(showHiddenFiles);
				const next = updater(existing);
				if (next === existing) return prev;
				return {
					...prev,
					[rootPath]: next,
				};
			});
		},
		[currentNode, showHiddenFiles],
	);

	const activeReviewState = useMemo<ReviewViewState>(() => {
		if (!currentNode) return createDefaultReviewState(showHiddenFiles);
		return reviewStateByRoot[currentNode.path] ?? createDefaultReviewState(showHiddenFiles);
	}, [currentNode, reviewStateByRoot, showHiddenFiles]);

	const compareNodes = useCallback(
		(a: FileNode, b: FileNode) => {
			let comparison = 0;
			if (sortBy === 'name') {
				comparison = a.name.localeCompare(b.name);
			} else if (sortBy === 'count') {
				comparison = (a.fileCount || 0) - (b.fileCount || 0);
			} else {
				comparison = a.size - b.size;
			}
			return sortOrder === 'asc' ? comparison : -comparison;
		},
		[sortBy, sortOrder],
	);

	const flattenTree = useCallback(
		(node: FileNode): FileNode[] => {
			if (!node.children) return [];
			const collected: FileNode[] = [];
			const stack: Array<{ children: FileNode[]; index: number }> = [
				{
					children: [...node.children]
						.filter((child) => showHiddenFiles || !child.isHidden)
						.sort(compareNodes),
					index: 0,
				},
			];

			while (stack.length > 0) {
				const frame = stack[stack.length - 1];
				if (frame.index >= frame.children.length) {
					stack.pop();
					continue;
				}

				const child = frame.children[frame.index++];
				collected.push(child);

				if (child.isDirectory && child.children && child.children.length > 0) {
					const visibleChildren = showHiddenFiles
						? child.children
						: child.children.filter((entry) => !entry.isHidden);
					if (visibleChildren.length > 0) {
						stack.push({ children: [...visibleChildren].sort(compareNodes), index: 0 });
					}
				}
			}

			return collected;
		},
		[compareNodes, showHiddenFiles],
	);

	const files = useMemo(() => {
		if (!currentNode) return [];

		if (viewMode === 'flat') {
			const list = currentNode.children ? [...currentNode.children] : [];
			const visible = showHiddenFiles ? list : list.filter((entry) => !entry.isHidden);
			return visible.sort(compareNodes);
		}

		if (viewMode === 'tree') {
			return flattenTree(currentNode);
		}

		return [];
	}, [currentNode, viewMode, flattenTree, compareNodes, showHiddenFiles]);

	const reviewEntries = useMemo(() => {
		if (!currentNode) return [];
		return deriveReviewEntries(currentNode, {
			sourceRoot: initialNode?.path ?? currentNode.path,
		});
	}, [currentNode, initialNode?.path]);

	const reviewFilteredEntries = useMemo(
		() => filterReviewEntries(reviewEntries, activeReviewState.filters),
		[activeReviewState.filters, reviewEntries],
	);

	const reviewSortedEntries = useMemo(
		() =>
			sortReviewEntries(
				reviewFilteredEntries,
				activeReviewState.sortBy,
				activeReviewState.sortOrder,
			),
		[activeReviewState.sortBy, activeReviewState.sortOrder, reviewFilteredEntries],
	);

	const reviewGroups = useMemo(
		() => groupReviewEntries(reviewSortedEntries, activeReviewState.groupBy, currentNode?.size ?? 0),
		[activeReviewState.groupBy, currentNode?.size, reviewSortedEntries],
	);

	const reviewVisibleRows = useMemo(
		() => buildVisibleReviewRows(reviewGroups, activeReviewState.expandedGroups),
		[activeReviewState.expandedGroups, reviewGroups],
	);

	const reviewSelectionIndex = activeReviewState.selectionIndex;
	const reviewSelectedRow = reviewVisibleRows[reviewSelectionIndex];
	const reviewSelectedEntry = reviewSelectedRow?.kind === 'entry' ? reviewSelectedRow.entry : undefined;
	const selectedNode = viewMode === 'review' ? reviewSelectedEntry?.node : files[selectionIndex];
	const effectiveSelectionIndex = viewMode === 'review' ? reviewSelectionIndex : selectionIndex;

	useEffect(() => {
		if (!currentNode || viewMode !== 'review') return;
		const maxIndex = Math.max(0, reviewVisibleRows.length - 1);
		if (activeReviewState.selectionIndex <= maxIndex) return;

		updateReviewState((state) => ({
			...state,
			selectionIndex: maxIndex,
		}));
	}, [
		activeReviewState.selectionIndex,
		currentNode,
		reviewVisibleRows.length,
		updateReviewState,
		viewMode,
	]);

	useEffect(() => {
		if (!pendingBrowseSelectionPath || viewMode === 'review') return;
		const index = files.findIndex((entry) => entry.path === pendingBrowseSelectionPath);
		if (index >= 0) {
			setSelectionIndex(index);
		}
		setPendingBrowseSelectionPath(null);
	}, [files, pendingBrowseSelectionPath, viewMode]);

	const moveSelection = useCallback(
		(delta: number) => {
			if (viewMode === 'review') {
				updateReviewState((state) => {
					const next = state.selectionIndex + delta;
					if (next < 0) {
						return { ...state, selectionIndex: 0 };
					}
					if (next >= reviewVisibleRows.length) {
						return {
							...state,
							selectionIndex: Math.max(0, reviewVisibleRows.length - 1),
						};
					}
					return {
						...state,
						selectionIndex: next,
					};
				});
				return;
			}

			setSelectionIndex((prev) => {
				const next = prev + delta;
				if (next < 0) return 0;
				if (next >= files.length) return Math.max(0, files.length - 1);
				return next;
			});
		},
		[files.length, reviewVisibleRows.length, updateReviewState, viewMode],
	);

	const enterDirectory = useCallback(() => {
		if (viewMode === 'review') {
			if (!reviewSelectedRow) return;

			if (reviewSelectedRow.kind === 'group') {
				const groupKey = reviewSelectedRow.group.key;
				updateReviewState((state) => ({
					...state,
					expandedGroups: {
						...state.expandedGroups,
						[groupKey]: !(state.expandedGroups[groupKey] ?? true),
					},
				}));
				return;
			}

			if (reviewSelectedRow.entry.kind === 'directory') {
				setCurrentNode(reviewSelectedRow.entry.node);
			}
			return;
		}

		const selectedFile = files[selectionIndex];
		if (selectedFile && selectedFile.isDirectory) {
			setCurrentNode(selectedFile);
			setSelectionIndex(0);
		}
	}, [files, reviewSelectedRow, selectionIndex, updateReviewState, viewMode]);

	const goUp = useCallback(() => {
		if (currentNode?.parent) {
			setCurrentNode(currentNode.parent);
			setSelectionIndex(0);
		}
	}, [currentNode]);

	const toggleSort = useCallback(
		(field: SortField) => {
			if (sortBy === field) {
				setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
			} else {
				setSortBy(field);
				setSortOrder('desc');
			}
		},
		[sortBy],
	);

	const setReviewSort = useCallback(
		(field: ReviewSortField) => {
			updateReviewState((state) => {
				if (state.sortBy === field) {
					return {
						...state,
						sortOrder: state.sortOrder === 'asc' ? 'desc' : 'asc',
					};
				}

				const defaultOrder = field === 'path' || field === 'type' ? 'asc' : 'desc';
				return {
					...state,
					sortBy: field,
					sortOrder: defaultOrder,
				};
			});
		},
		[updateReviewState],
	);

	const cycleReviewSort = useCallback(() => {
		updateReviewState((state) => {
			const currentIndex = REVIEW_SORT_ORDER.indexOf(state.sortBy);
			const nextIndex =
				currentIndex >= 0 ? (currentIndex + 1) % REVIEW_SORT_ORDER.length : 0;
			const nextSortBy = REVIEW_SORT_ORDER[nextIndex];
			const defaultOrder = nextSortBy === 'path' || nextSortBy === 'type' ? 'asc' : 'desc';
			return {
				...state,
				sortBy: nextSortBy,
				sortOrder: defaultOrder,
			};
		});
	}, [updateReviewState]);

	const setReviewGroup = useCallback(
		(groupBy: ReviewGroupField) => {
			updateReviewState((state) => ({
				...state,
				groupBy,
				selectionIndex: 0,
			}));
		},
		[updateReviewState],
	);

	const cycleReviewGroup = useCallback(() => {
		updateReviewState((state) => {
			const currentIndex = REVIEW_GROUP_ORDER.indexOf(state.groupBy);
			const nextIndex =
				currentIndex >= 0 ? (currentIndex + 1) % REVIEW_GROUP_ORDER.length : 0;
			return {
				...state,
				groupBy: REVIEW_GROUP_ORDER[nextIndex],
				selectionIndex: 0,
			};
		});
	}, [updateReviewState]);

	const cycleReviewScope = useCallback(() => {
		updateReviewState((state) => {
			const currentIndex = REVIEW_SCOPE_ORDER.indexOf(state.filters.scope);
			const nextIndex =
				currentIndex >= 0 ? (currentIndex + 1) % REVIEW_SCOPE_ORDER.length : 0;
			return {
				...state,
				filters: {
					...state.filters,
					scope: REVIEW_SCOPE_ORDER[nextIndex],
				},
				selectionIndex: 0,
			};
		});
	}, [updateReviewState]);

	const cycleReviewPreset = useCallback(() => {
		updateReviewState((state) => applyPreset(state, cycleReviewPresetId(state.presetId, 1)));
	}, [updateReviewState]);

	const setReviewPreset = useCallback(
		(presetId: string) => {
			updateReviewState((state) => applyPreset(state, presetId));
		},
		[updateReviewState],
	);

	const updateReviewFilters = useCallback(
		(updater: (filters: ReviewViewState['filters']) => ReviewViewState['filters']) => {
			updateReviewState((state) => ({
				...state,
				filters: updater(state.filters),
				selectionIndex: 0,
			}));
		},
		[updateReviewState],
	);

	const cycleReviewMinSize = useCallback(() => {
		updateReviewFilters((filters) => {
			const currentIndex = REVIEW_MIN_SIZE_ORDER.findIndex((value) => value === filters.minSizeBytes);
			const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % REVIEW_MIN_SIZE_ORDER.length : 0;
			return {
				...filters,
				minSizeBytes: REVIEW_MIN_SIZE_ORDER[nextIndex],
			};
		});
	}, [updateReviewFilters]);

	const cycleReviewAgeBucket = useCallback(() => {
		updateReviewFilters((filters) => {
			const currentIndex = REVIEW_AGE_FILTER_ORDER.findIndex(
				(value) => value.length === filters.ageBuckets.length && value.every((bucket) => filters.ageBuckets.includes(bucket)),
			);
			const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % REVIEW_AGE_FILTER_ORDER.length : 0;
			return {
				...filters,
				ageBuckets: REVIEW_AGE_FILTER_ORDER[nextIndex],
			};
		});
	}, [updateReviewFilters]);

	const toggleReviewMediaOnly = useCallback(() => {
		updateReviewFilters((filters) => ({
			...filters,
			mediaOnly: !filters.mediaOnly,
		}));
	}, [updateReviewFilters]);

	const toggleReviewIncludeHidden = useCallback(() => {
		updateReviewFilters((filters) => ({
			...filters,
			includeHidden: !filters.includeHidden,
		}));
	}, [updateReviewFilters]);

	const resetReviewFilters = useCallback(() => {
		updateReviewFilters((filters) => {
			const defaults = createDefaultReviewFilters(filters.includeHidden);
			return {
				...defaults,
				scope: filters.scope,
				includeHidden: filters.includeHidden,
			};
		});
	}, [updateReviewFilters]);

	const toggleReviewGroupExpanded = useCallback(
		(groupKey?: string) => {
			let key = groupKey;
			if (!key && reviewSelectedRow?.kind === 'group') {
				key = reviewSelectedRow.group.key;
			}
			if (!key) return;

			updateReviewState((state) => ({
				...state,
				expandedGroups: {
					...state.expandedGroups,
					[key]: !(state.expandedGroups[key] ?? true),
				},
			}));
		},
		[reviewSelectedRow, updateReviewState],
	);

	const toggleViewMode = useCallback(() => {
		const order: ViewMode[] = ['flat', 'tree', 'review'];
		setViewMode((prev) => {
			const index = order.indexOf(prev);
			const next = order[(index + 1) % order.length];
			return next ?? 'flat';
		});
		setSelectionIndex(0);
	}, []);

	const updateStatsUpwards = (node: FileNode, sizeDelta: number, countDelta: number) => {
		let curr: FileNode | undefined = node;
		while (curr) {
			curr.size += sizeDelta;
			curr.fileCount += countDelta;
			curr = curr.parent;
		}
	};

	const deleteSelected = useCallback(async (): Promise<FileNode | null> => {
		if (!currentNode) return null;

		const fileToDelete = selectedNode;
		if (!fileToDelete) return null;

		try {
			await fs.promises.rm(fileToDelete.path, { recursive: true, force: true });

			const parentNode = fileToDelete.parent ?? currentNode;
			if (!parentNode.children) return null;

			const index = parentNode.children.indexOf(fileToDelete);
			if (index > -1) {
				parentNode.children.splice(index, 1);
			}

			const sizeDiff = -fileToDelete.size;
			const countDiff = -(fileToDelete.fileCount || 0);
			updateStatsUpwards(parentNode, sizeDiff, countDiff);

			setCurrentNode({ ...currentNode });

			if (entryPointPath === fileToDelete.path) {
				setEntryPointPath(null);
			}

			setSelectionIndex((prev) => Math.max(0, Math.min(prev, files.length - 2)));
			return fileToDelete;
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			setError(`Failed to delete: ${message}`);
		}

		return null;
	}, [currentNode, entryPointPath, files.length, selectedNode]);

	const openSelectedInView = useCallback(
		(targetView: 'flat' | 'tree') => {
			if (viewMode !== 'review' || !reviewSelectedEntry || !currentNode) return;
			const destinationNode = reviewSelectedEntry.node.parent ?? currentNode;
			setCurrentNode(destinationNode);
			setViewMode(targetView);
			setPendingBrowseSelectionPath(reviewSelectedEntry.path);
			setEntryPointPath(reviewSelectedEntry.path);
		},
		[currentNode, reviewSelectedEntry, viewMode],
	);

	const openSelectedInFlat = useCallback(() => {
		openSelectedInView('flat');
	}, [openSelectedInView]);

	const openSelectedInTree = useCallback(() => {
		openSelectedInView('tree');
	}, [openSelectedInView]);

	useEffect(() => {
		setSelectionIndex((prev) => {
			if (files.length === 0) return 0;
			return Math.min(prev, files.length - 1);
		});
	}, [files.length]);

	return {
		currentNode,
		files,
		selectionIndex: effectiveSelectionIndex,
		sortBy,
		sortOrder,
		viewMode,
		error,
		moveSelection,
		enterDirectory,
		goUp,
		toggleSort,
		toggleViewMode,
		deleteSelected,
		selectedNode,
		entryPointPath,
		setEntryPointPath,
		reviewState: activeReviewState,
		reviewEntries: reviewSortedEntries,
		reviewGroups,
		reviewVisibleRows,
		reviewSelectedRow,
		reviewSelectedEntry,
		setReviewSort,
		cycleReviewSort,
		setReviewGroup,
		cycleReviewGroup,
		cycleReviewScope,
		cycleReviewPreset,
		setReviewPreset,
		updateReviewFilters,
		cycleReviewMinSize,
		cycleReviewAgeBucket,
		toggleReviewMediaOnly,
		toggleReviewIncludeHidden,
		resetReviewFilters,
		toggleReviewGroupExpanded,
		openSelectedInFlat,
		openSelectedInTree,
	};
};
