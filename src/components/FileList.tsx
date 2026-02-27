// Render the file list table with sizing, bars, and type-aware entry colouring
//
// (c) Copyright 2026 Liminal HQ, Scott Morris
// SPDX-License-Identifier: MIT

import React, { useEffect, useMemo, useState } from 'react';
import { Box, Text, useStdout } from 'ink';
import { Theme } from '../themes.js';
import { FileNode } from '../scanner.js';
import { ViewMode } from '../state.js';
import { filesize } from 'filesize';
import path from 'path';
import { FILE_TYPE_LEGEND, getFileTypeCategory } from '../fileTypeColours.js';

interface FileListProps {
	files: FileNode[];
	selectedIndex: number;
	maxSize: number; // Size of the largest file in the list, for bar calculation
	totalSize: number; // Total size of all files in the directory for percentage calculation
	theme: Theme;
	units: 'iec' | 'si';
	viewMode: ViewMode;
	rootPath: string;
	scanRootPath: string;
	fileTypeColoursEnabled: boolean;
	showLegend: boolean;
	heatmapEnabled: boolean;
	availableColumns?: number;
	extraBottomRows?: number;
}

const APP_HEADER_ROWS = 2;
const APP_FOOTER_ROWS = 2;
const MIN_NAME_COL = 16;
const SIZE_COL = 12;
const PERCENT_COL = 7;
const MIN_GRAPH_COL = 8;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const hslToHex = (h: number, s: number, l: number): string => {
	const normalisedS = clamp(s, 0, 100) / 100;
	const normalisedL = clamp(l, 0, 100) / 100;
	const chroma = (1 - Math.abs(2 * normalisedL - 1)) * normalisedS;
	const hueSegment = (((h % 360) + 360) % 360) / 60;
	const secondComponent = chroma * (1 - Math.abs((hueSegment % 2) - 1));
	let red = 0;
	let green = 0;
	let blue = 0;

	if (hueSegment >= 0 && hueSegment < 1) {
		red = chroma;
		green = secondComponent;
	} else if (hueSegment >= 1 && hueSegment < 2) {
		red = secondComponent;
		green = chroma;
	} else if (hueSegment >= 2 && hueSegment < 3) {
		green = chroma;
		blue = secondComponent;
	} else if (hueSegment >= 3 && hueSegment < 4) {
		green = secondComponent;
		blue = chroma;
	} else if (hueSegment >= 4 && hueSegment < 5) {
		red = secondComponent;
		blue = chroma;
	} else if (hueSegment >= 5 && hueSegment < 6) {
		red = chroma;
		blue = secondComponent;
	}

	const match = normalisedL - chroma / 2;
	const toHex = (value: number) => {
		const scaled = Math.round((value + match) * 255);
		return scaled.toString(16).padStart(2, '0');
	};

	return `#${toHex(red)}${toHex(green)}${toHex(blue)}`;
};

const getHeatmapColour = (ratio: number): string => {
	const clamped = clamp(ratio, 0, 1);
	const hue = 120 - 120 * clamped;
	return hslToHex(hue, 80, 50);
};

interface EntryColourInput {
	file: FileNode;
	theme: Theme;
	fileTypeColoursEnabled: boolean;
	fileTypeCategory: ReturnType<typeof getFileTypeCategory>;
}

export const getEntryColour = ({
	file,
	theme,
	fileTypeColoursEnabled,
	fileTypeCategory,
}: EntryColourInput): string => {
	if (!fileTypeColoursEnabled) return theme.colours.text;
	if (file.isDirectory) return 'cyan';
	if (file.isSymbolicLink && file.isBrokenSymbolicLink) return '#ff9f1a';
	if (file.isSymbolicLink) return 'blue';
	if (fileTypeCategory === 'scripts') {
		const isExecutable = typeof file.mode === 'number' ? (file.mode & 0o111) !== 0 : false;
		return isExecutable ? theme.colours.fileTypes.scripts : theme.colours.muted;
	}
	if (fileTypeCategory) return theme.colours.fileTypes[fileTypeCategory];
	return theme.colours.text;
};

export const FileList: React.FC<FileListProps> = ({
	files,
	selectedIndex,
	maxSize,
	totalSize,
	theme,
	units,
	viewMode,
	rootPath,
	scanRootPath,
	fileTypeColoursEnabled,
	showLegend,
	heatmapEnabled,
	availableColumns,
	extraBottomRows = 0,
}) => {
	const { stdout } = useStdout();
	const [totalRows, setTotalRows] = useState(() => stdout?.rows ?? process.stdout.rows ?? 24);
	const totalColumns = availableColumns ?? stdout?.columns ?? process.stdout.columns ?? 80;
	const showLegendRow = showLegend && fileTypeColoursEnabled;
	const listHeaderRows = showLegendRow ? 3 : 2;
	const reservedRows = APP_HEADER_ROWS + listHeaderRows + APP_FOOTER_ROWS + extraBottomRows;

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

	const windowSize = Math.max(1, totalRows - reservedRows);
	const columnLayout = useMemo(() => {
		const contentColumns = Math.max(0, totalColumns - 2); // paddingX=1
		// We need gaps: Name <gap> Size <gap> Percent <gap> Graph
		// Gaps = 3 (if graph shown) or 2.
		// Let's reserve 3 chars for gaps if graph shown, else 2.
		const gapCount = 3; // Name-Size, Size-Percent, Percent-Graph (or usage)

		const availableForContent = Math.max(0, contentColumns - gapCount);
		const fixedColumns = SIZE_COL + PERCENT_COL;
		const remaining = Math.max(0, availableForContent - fixedColumns);

		let graphColumns = Math.max(MIN_GRAPH_COL, Math.floor(remaining * 0.35));
		let nameColumns = Math.max(MIN_NAME_COL, remaining - graphColumns);

		if (nameColumns + graphColumns > remaining) {
			graphColumns = Math.max(MIN_GRAPH_COL, remaining - MIN_NAME_COL);
			nameColumns = Math.max(MIN_NAME_COL, remaining - graphColumns);
		}

		if (remaining < MIN_NAME_COL + MIN_GRAPH_COL) {
			graphColumns = Math.max(0, remaining - MIN_NAME_COL);
			nameColumns = remaining - graphColumns;
		}

		const showGraph = graphColumns >= 6;
		const barWidth = Math.max(0, graphColumns - 2);

		return {
			nameColumns: Math.max(1, nameColumns),
			sizeColumns: SIZE_COL,
			percentColumns: PERCENT_COL,
			graphColumns,
			barWidth,
			showGraph,
			gapCount: showGraph ? 3 : 2,
		};
	}, [totalColumns]);

	let start = 0;
	if (selectedIndex >= windowSize / 2) {
		start = selectedIndex - Math.floor(windowSize / 2);
	}
	if (start + windowSize > files.length) {
		start = Math.max(0, files.length - windowSize);
	}

	const visibleFiles = files.slice(start, start + windowSize);

	// Construct segmented divider with explicit gaps matching layout
	const getDivider = () => {
		let line = '';
		// Left padding
		line += '-';

		line += '-'.repeat(columnLayout.nameColumns);
		line += ' '; // Gap Name-Size

		line += '-'.repeat(columnLayout.sizeColumns);
		line += ' '; // Gap Size-Percent

		line += '-'.repeat(columnLayout.percentColumns);

		if (columnLayout.showGraph) {
			line += ' '; // Gap Percent-Graph
			line += '-'.repeat(columnLayout.graphColumns);
		}

		// Since we calculated columns based on total - gaps - padding,
		// the sum should fit. But strictly, we used availableForContent.
		// availableForContent = total - 2 - gapCount.
		// line length = 1 + name + 1 + size + 1 + percent + 1 + graph + 1 ??
		// No, padding right is accounted for?
		// Let's just return the line. Ink handles overflow if any, but we aimed for exact fit.

		return line;
	};

	const divider = getDivider();

	return (
		<Box flexDirection="column" width="100%">
			<Box paddingX={1} flexDirection="column">
				<Box>
					<Box width={columnLayout.nameColumns}>
						<Text color={theme.colours.muted}>{viewMode === 'flat' ? 'Path' : 'Name'}</Text>
					</Box>
					<Box width={1} />
					<Box width={columnLayout.sizeColumns} justifyContent="flex-end">
						<Text color={theme.colours.muted}>Size</Text>
					</Box>
					<Box width={1} />
					<Box width={columnLayout.percentColumns} justifyContent="flex-end">
						<Text color={theme.colours.muted}>{columnLayout.showGraph ? '' : 'Usage'}</Text>
					</Box>
					{columnLayout.showGraph ? (
						<>
							<Box width={1} />
							<Box width={columnLayout.graphColumns}>
								<Text color={theme.colours.muted}>Usage</Text>
							</Box>
						</>
					) : null}
				</Box>
				{showLegendRow ? (
					<Box width="100%">
						<Text wrap="truncate-end" color={theme.colours.muted}>
							Legend:{' '}
							{FILE_TYPE_LEGEND.map((entry, entryIndex) => (
								<Text key={entry.category} color={theme.colours.fileTypes[entry.category]}>
									{entry.label}
									{entryIndex < FILE_TYPE_LEGEND.length - 1 ? '  ' : ''}
								</Text>
							))}
						</Text>
					</Box>
				) : null}
			</Box>
			<Text color={theme.colours.line}>{divider}</Text>
			{files.length === 0 ? (
				<Box paddingX={1} paddingTop={1} justifyContent="center">
					<Text color={theme.colours.muted} italic>
						This directory is empty.
					</Text>
				</Box>
			) : null}
			{visibleFiles.map((file, index) => {
				const globalIndex = start + index;
				const isSelected = globalIndex === selectedIndex;

				// Percentage is relative to the directory total size
				const percentage = totalSize > 0 ? (file.size / totalSize) * 100 : 0;

				// Bar is relative to the largest item in the directory
				const barRatio = maxSize > 0 ? file.size / maxSize : 0;
				const barFilled = Math.round(barRatio * columnLayout.barWidth);
				const barEmpty = Math.max(0, columnLayout.barWidth - barFilled);

				const heatmapColour = getHeatmapColour(barRatio);
				const barFilledStr = '#'.repeat(barFilled);
				const barEmptyStr = '.'.repeat(barEmpty);

				const basePath = viewMode === 'flat' ? scanRootPath : rootPath;
				const relativePath = path.relative(basePath, file.path) || file.name;
				const pathSegments = relativePath.split(path.sep).filter(Boolean);
				const depth = Math.max(0, pathSegments.length - 1);
				const indent = viewMode === 'tree' ? '  '.repeat(depth) : '';
				const baseName = viewMode === 'flat' ? relativePath : file.name;
				const displayName = file.isDirectory ? `${baseName}/` : baseName;
				const entryLabel = `${indent}${file.isDirectory ? '/' : ' '} ${displayName}`;
				const fileTypeCategory = getFileTypeCategory(file.name, file.isDirectory);
				const entryColour = getEntryColour({
					file,
					theme,
					fileTypeColoursEnabled,
					fileTypeCategory,
				});

				return (
					<Box key={file.path} width="100%">
						<Box width="100%" paddingX={1}>
							<Box width={columnLayout.nameColumns}>
								<Text
									backgroundColor={isSelected ? theme.colours.highlight : undefined}
									color={isSelected ? theme.colours.selectedText : entryColour}
									wrap="truncate-end"
								>
									{entryLabel}
								</Text>
							</Box>

							<Box width={1} />

							<Box width={columnLayout.sizeColumns} justifyContent="flex-end">
								<Text
									backgroundColor={isSelected ? theme.colours.highlight : undefined}
									color={isSelected ? theme.colours.selectedText : theme.colours.size}
								>
									{filesize(
										file.size,
										units === 'si' ? { base: 10, standard: 'si' } : { base: 2, standard: 'iec' },
									)}
								</Text>
							</Box>

							<Box width={1} />

							<Box width={columnLayout.percentColumns} justifyContent="flex-end">
								<Text
									backgroundColor={isSelected ? theme.colours.highlight : undefined}
									color={isSelected ? theme.colours.selectedText : theme.colours.percentage}
								>
									{percentage.toFixed(1)}%
								</Text>
							</Box>

							{columnLayout.showGraph ? (
								<>
									<Box width={1} />
									<Box width={columnLayout.graphColumns}>
										<Text
											backgroundColor={isSelected ? theme.colours.highlight : undefined}
											color={isSelected ? theme.colours.selectedText : theme.colours.line}
										>
											[
										</Text>
										<Text
											backgroundColor={isSelected ? theme.colours.highlight : undefined}
											color={
												heatmapEnabled
													? heatmapColour
													: isSelected
														? theme.colours.selectedText
														: theme.colours.bar
											}
										>
											{barFilledStr}
										</Text>
										<Text
											backgroundColor={isSelected ? theme.colours.highlight : undefined}
											color={theme.colours.barEmpty}
										>
											{barEmptyStr}
										</Text>
										<Text
											backgroundColor={isSelected ? theme.colours.highlight : undefined}
											color={isSelected ? theme.colours.selectedText : theme.colours.line}
										>
											]
										</Text>
									</Box>
								</>
							) : null}
						</Box>
					</Box>
				);
			})}
		</Box>
	);
};
