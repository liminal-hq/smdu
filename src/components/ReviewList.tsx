// Render Review Mode rows with grouped summaries and ranked entry columns
//
// (c) Copyright 2026 Liminal HQ, Scott Morris
// SPDX-License-Identifier: MIT

import React, { useEffect, useMemo, useState } from 'react';
import { Box, Text, useStdout } from 'ink';
import path from 'path';
import { filesize } from 'filesize';
import { Theme } from '../themes.js';
import { ReviewVisibleRow } from '../review/types.js';
import { sanitize } from '../utils/sanitize.js';

interface ReviewListProps {
	rows: ReviewVisibleRow[];
	selectedIndex: number;
	theme: Theme;
	units: 'iec' | 'si';
	rootPath: string;
	availableColumns?: number;
	extraTopRows?: number;
	extraBottomRows?: number;
}

const APP_HEADER_ROWS = 2;
const APP_FOOTER_ROWS = 2;

const PATH_COL_MIN = 18;
const SIZE_COL = 11;
const AGE_COL = 8;
const TYPE_COL = 10;
const PERCENT_COL = 6;
const COUNT_COL = 12;

const formatAge = (date: Date | undefined): string => {
	if (!date || Number.isNaN(date.getTime())) return 'n/a';
	const diffMs = Date.now() - date.getTime();
	if (diffMs < 0) return 'future';
	const diffMinutes = Math.floor(diffMs / (60 * 1000));
	if (diffMinutes < 1) return 'now';
	if (diffMinutes < 60) return `${diffMinutes}m`;
	const diffHours = Math.floor(diffMinutes / 60);
	if (diffHours < 24) return `${diffHours}h`;
	const diffDays = Math.floor(diffHours / 24);
	if (diffDays < 31) return `${diffDays}d`;
	const diffMonths = Math.floor(diffDays / 30);
	if (diffMonths < 12) return `${diffMonths}mo`;
	return `${Math.floor(diffMonths / 12)}y`;
};

const formatCount = (row: ReviewVisibleRow): string => {
	if (row.kind === 'group') {
		return `${row.group.itemCount.toLocaleString('en-CA')} items`;
	}
	if (row.entry.kind === 'directory') {
		return `F${row.entry.fileCount}/D${row.entry.directoryCount}`;
	}
	return row.entry.fileCount.toLocaleString('en-CA');
};

const formatType = (row: ReviewVisibleRow): string => {
	if (row.kind === 'group') return 'group';
	if (row.entry.kind === 'directory') return 'directory';
	if (row.entry.extension) return row.entry.extension;
	return row.entry.inferredType || 'file';
};

export const ReviewList: React.FC<ReviewListProps> = ({
	rows,
	selectedIndex,
	theme,
	units,
	rootPath,
	availableColumns,
	extraTopRows = 0,
	extraBottomRows = 0,
}) => {
	const { stdout } = useStdout();
	const [totalRows, setTotalRows] = useState(() => stdout?.rows ?? process.stdout.rows ?? 24);
	const totalColumns = availableColumns ?? stdout?.columns ?? process.stdout.columns ?? 80;

	useEffect(() => {
		const updateRows = () => {
			setTotalRows(stdout?.rows ?? process.stdout.rows ?? 24);
		};

		updateRows();
		const immediateTimer = setTimeout(updateRows, 0);
		const settleTimer = setTimeout(updateRows, 100);
		stdout?.on('resize', updateRows);
		return () => {
			stdout?.off('resize', updateRows);
			clearTimeout(immediateTimer);
			clearTimeout(settleTimer);
		};
	}, [stdout]);

	const reservedRows = APP_HEADER_ROWS + APP_FOOTER_ROWS + extraTopRows + extraBottomRows + 2;
	const windowSize = Math.max(1, totalRows - reservedRows);

	const columnLayout = useMemo(() => {
		const contentColumns = Math.max(0, totalColumns - 2);
		const fixed = SIZE_COL + AGE_COL + TYPE_COL + PERCENT_COL + COUNT_COL + 5;
		const pathColumns = Math.max(PATH_COL_MIN, contentColumns - fixed);
		return {
			pathColumns,
			sizeColumns: SIZE_COL,
			ageColumns: AGE_COL,
			typeColumns: TYPE_COL,
			percentColumns: PERCENT_COL,
			countColumns: COUNT_COL,
		};
	}, [totalColumns]);

	let start = 0;
	if (selectedIndex >= windowSize / 2) {
		start = selectedIndex - Math.floor(windowSize / 2);
	}
	if (start + windowSize > rows.length) {
		start = Math.max(0, rows.length - windowSize);
	}

	const visibleRows = rows.slice(start, start + windowSize);
	const divider = '-'.repeat(Math.max(0, totalColumns));

	return (
		<Box flexDirection="column" width="100%">
			<Box paddingX={1}>
				<Box width={columnLayout.pathColumns}>
					<Text color={theme.colours.muted}>Path</Text>
				</Box>
				<Box width={1} />
				<Box width={columnLayout.sizeColumns} justifyContent="flex-end">
					<Text color={theme.colours.muted}>Size</Text>
				</Box>
				<Box width={1} />
				<Box width={columnLayout.ageColumns} justifyContent="flex-end">
					<Text color={theme.colours.muted}>Age</Text>
				</Box>
				<Box width={1} />
				<Box width={columnLayout.typeColumns}>
					<Text color={theme.colours.muted}>Type</Text>
				</Box>
				<Box width={1} />
				<Box width={columnLayout.percentColumns} justifyContent="flex-end">
					<Text color={theme.colours.muted}>%</Text>
				</Box>
				<Box width={1} />
				<Box width={columnLayout.countColumns} justifyContent="flex-end">
					<Text color={theme.colours.muted}>Count</Text>
				</Box>
			</Box>
			<Text color={theme.colours.line}>{divider}</Text>
			{rows.length === 0 ? (
				<Box paddingX={1} paddingTop={1} flexDirection="column" alignItems="center">
					<Text color={theme.colours.muted} italic>
						No review results for current filters.
					</Text>
				</Box>
			) : null}
			{visibleRows.map((row, index) => {
				const globalIndex = start + index;
				const isSelected = globalIndex === selectedIndex;
				const bg = isSelected ? theme.colours.highlight : undefined;
				const fg = isSelected ? theme.colours.selectedText : theme.colours.text;
				const size = row.kind === 'group' ? row.group.totalSize : row.entry.size;
				const age = row.kind === 'group' ? '-' : formatAge(row.entry.modifiedAt);
				const percent =
					row.kind === 'group' ? row.group.percentOfRoot : row.entry.percentOfRoot;
				const count = formatCount(row);
				const type = formatType(row);
				const label =
					row.kind === 'group'
						? `▾ ${row.group.label}`
						: sanitize(path.relative(rootPath, row.entry.path) || row.entry.basename);

				return (
					<Box key={row.kind === 'group' ? row.group.key : row.entry.id} paddingX={1} width="100%">
						<Box width={columnLayout.pathColumns}>
							<Text backgroundColor={bg} color={row.kind === 'group' && !isSelected ? theme.colours.accent : fg} wrap="truncate-end">
								{label}
							</Text>
						</Box>
						<Box width={1} />
						<Box width={columnLayout.sizeColumns} justifyContent="flex-end">
							<Text backgroundColor={bg} color={fg}>
								{filesize(size, units === 'si' ? { base: 10, standard: 'si' } : { base: 2, standard: 'iec' })}
							</Text>
						</Box>
						<Box width={1} />
						<Box width={columnLayout.ageColumns} justifyContent="flex-end">
							<Text backgroundColor={bg} color={fg}>
								{age}
							</Text>
						</Box>
						<Box width={1} />
						<Box width={columnLayout.typeColumns}>
							<Text backgroundColor={bg} color={fg} wrap="truncate-end">
								{type}
							</Text>
						</Box>
						<Box width={1} />
						<Box width={columnLayout.percentColumns} justifyContent="flex-end">
							<Text backgroundColor={bg} color={fg}>
								{percent.toFixed(1)}
							</Text>
						</Box>
						<Box width={1} />
						<Box width={columnLayout.countColumns} justifyContent="flex-end">
							<Text backgroundColor={bg} color={fg} wrap="truncate-end">
								{count}
							</Text>
						</Box>
					</Box>
				);
			})}
		</Box>
	);
};
