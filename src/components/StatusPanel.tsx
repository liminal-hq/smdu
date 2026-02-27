// Render the right-side status panel with selected-item properties and state summary
//
// (c) Copyright 2026 Liminal HQ, Scott Morris
// SPDX-License-Identifier: MIT

import React from 'react';
import { Box, Text, useStdout } from 'ink';
import { Theme } from '../themes.js';
import { SortField, SortOrder, ViewMode } from '../state.js';
import { FileNode } from '../scanner.js';
import { getFileTypeCategory, FILE_TYPE_LEGEND } from '../fileTypeColours.js';
import path from 'path';

interface StatusPanelProps {
	theme: Theme;
	sortBy: SortField;
	sortOrder: SortOrder;
	viewMode: ViewMode;
	showHiddenFiles: boolean;
	heatmapEnabled: boolean;
	fileTypeColoursEnabled: boolean;
	showLegend: boolean;
	units: 'iec' | 'si';
	selectedFile?: FileNode;
	selectedFileMode?: number;
	selectedFileBirthtime?: Date;
	selectedFileMtime?: Date;
	metadataLoading?: boolean;
	width?: number;
	height?: number;
}

interface TypeDisplay {
	label: string;
	colour: string;
}

interface DirectoryFileCounts {
	directories: number | null;
	files: number | null;
}

const truncate = (value: string, maxWidth: number): string => {
	if (maxWidth <= 0) return '';
	if (value.length <= maxWidth) return value;
	if (maxWidth <= 3) return '.'.repeat(maxWidth);
	return `${value.slice(0, maxWidth - 3)}...`;
};

const formatDate = (date?: Date): string => {
	if (!date || Number.isNaN(date.getTime())) return 'N/A';
	const year = date.getFullYear().toString().padStart(4, '0');
	const month = (date.getMonth() + 1).toString().padStart(2, '0');
	const day = date.getDate().toString().padStart(2, '0');
	const hours = date.getHours().toString().padStart(2, '0');
	const minutes = date.getMinutes().toString().padStart(2, '0');
	const seconds = date.getSeconds().toString().padStart(2, '0');
	return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

const formatPermissions = (mode?: number): string => {
	if (typeof mode !== 'number') return 'N/A';
	const fileType =
		(mode & 0o170000) === 0o040000 ? 'd' : (mode & 0o170000) === 0o120000 ? 'l' : '-';
	const permBits = mode & 0o777;
	const setuid = (mode & 0o4000) !== 0;
	const setgid = (mode & 0o2000) !== 0;
	const sticky = (mode & 0o1000) !== 0;
	const triad = (shift: number, special?: 'setuid' | 'setgid' | 'sticky'): string => {
		const bits = (permBits >> shift) & 0o7;
		const read = bits & 0o4 ? 'r' : '-';
		const write = bits & 0o2 ? 'w' : '-';
		const exec = bits & 0o1 ? 'x' : '-';
		if (special === 'setuid' && setuid) return `${read}${write}${exec === 'x' ? 's' : 'S'}`;
		if (special === 'setgid' && setgid) return `${read}${write}${exec === 'x' ? 's' : 'S'}`;
		if (special === 'sticky' && sticky) return `${read}${write}${exec === 'x' ? 't' : 'T'}`;
		return `${read}${write}${exec}`;
	};

	return `${fileType}${triad(6, 'setuid')}${triad(3, 'setgid')}${triad(0, 'sticky')}`;
};

const getSizeImpact = (size: number, totalSize: number): 'Tiny' | 'Medium' | 'Heavy' => {
	if (totalSize <= 0) return 'Tiny';
	const percentage = (size / totalSize) * 100;
	if (percentage >= 20) return 'Heavy';
	if (percentage >= 5) return 'Medium';
	return 'Tiny';
};

const getPermissionColour = (char: string, theme: Theme): string => {
	if (char === 'r') return 'green';
	if (char === 'w') return 'yellow';
	if (char === 'x') return 'red';
	if (char === 's' || char === 'S') return 'magenta';
	if (char === 't' || char === 'T') return '#ff9f1a';
	if (char === 'd') return 'cyan';
	if (char === 'l') return 'blue';
	return theme.colours.muted;
};

export const getTypeDisplay = (
	file: FileNode | undefined,
	theme: Theme,
	fileTypeColoursEnabled: boolean,
): TypeDisplay => {
	if (!file) {
		return { label: 'None', colour: theme.colours.text };
	}
	if (file.isDirectory) {
		return {
			label: 'directory',
			colour: fileTypeColoursEnabled ? 'cyan' : theme.colours.text,
		};
	}
	if (file.isSymbolicLink) {
		if (!fileTypeColoursEnabled) {
			return {
				label: file.isBrokenSymbolicLink ? 'link (broken)' : 'link',
				colour: theme.colours.text,
			};
		}
		return {
			label: file.isBrokenSymbolicLink ? 'link (broken)' : 'link',
			colour: file.isBrokenSymbolicLink ? '#ff9f1a' : 'blue',
		};
	}

	const category = getFileTypeCategory(file.name, false);
	const extension = path.extname(file.name).replace('.', '').toLowerCase();
	if (!category) {
		return {
			label: extension ? `file (.${extension})` : 'file',
			colour: theme.colours.text,
		};
	}

	const categoryLabel =
		FILE_TYPE_LEGEND.find((entry) => entry.category === category)?.label ?? category;
	const categoryColour =
		category === 'scripts'
			? typeof file.mode === 'number' && (file.mode & 0o111) !== 0
				? theme.colours.fileTypes.scripts
				: theme.colours.muted
			: theme.colours.fileTypes[category];
	return {
		label: extension ? `file: ${categoryLabel} (.${extension})` : `file: ${categoryLabel}`,
		colour: fileTypeColoursEnabled ? categoryColour : theme.colours.text,
	};
};

export const getSelectedDirectoryFileCounts = (file: FileNode | undefined): DirectoryFileCounts => {
	if (!file || !file.isDirectory) {
		return { directories: null, files: null };
	}
	let directories = 0;
	let files = 0;
	const stack = [...(file.children ?? [])];
	while (stack.length > 0) {
		const current = stack.pop();
		if (!current) continue;
		if (current.isDirectory) {
			directories += 1;
			if (current.children && current.children.length > 0) {
				stack.push(...current.children);
			}
		} else {
			files += 1;
		}
	}
	return { directories, files };
};

export const StatusPanel: React.FC<StatusPanelProps> = ({
	theme,
	sortBy,
	sortOrder,
	viewMode,
	showHiddenFiles,
	heatmapEnabled,
	fileTypeColoursEnabled,
	showLegend,
	units,
	selectedFile,
	selectedFileMode,
	selectedFileBirthtime,
	selectedFileMtime,
	metadataLoading = false,
	width,
	height,
}) => {
	const { stdout } = useStdout();
	const panelWidth = Math.max(10, width ?? stdout?.columns ?? process.stdout.columns ?? 30);
	const panelHeight = Math.max(3, height ?? stdout?.rows ?? process.stdout.rows ?? 10);
	const contentWidth = Math.max(0, panelWidth - 2);
	const sortLabel = sortBy === 'name' ? 'Name' : 'Size';
	const orderLabel = sortOrder === 'asc' ? 'asc' : 'desc';
	const viewLabel = viewMode === 'tree' ? 'Tree' : 'Flat';
	const hiddenLabel = showHiddenFiles ? 'On' : 'Off';
	const heatmapLabel = heatmapEnabled ? 'On' : 'Off';
	const legendLabel = fileTypeColoursEnabled ? (showLegend ? 'On' : 'Off') : 'N/A';
	const unitsLabel = units === 'iec' ? 'IEC' : 'SI';
	const propertiesLabelWidth = 10;
	const selectedFileSize = selectedFile?.size ?? 0;
	const selectedFileParentSize = selectedFile?.parent?.size ?? selectedFileSize;
	const sizeImpact = getSizeImpact(selectedFileSize, selectedFileParentSize);
	const sizeImpactColour =
		sizeImpact === 'Heavy' ? 'red' : sizeImpact === 'Medium' ? 'yellow' : 'green';
	const permissions = formatPermissions(selectedFileMode);

	const title = 'Status';
	const headerMeta = `Sort: ${sortLabel} (${orderLabel}) | View: ${viewLabel} | Units: ${unitsLabel} | Hidden: ${hiddenLabel} | Heatmap: ${heatmapLabel} | Legend: ${legendLabel}`;
	const titlePrefix = `${title} | `;
	const headerMetaWidth = Math.max(0, contentWidth - titlePrefix.length);
	const headerMetaText = truncate(headerMeta, headerMetaWidth);
	const divider = '-'.repeat(Math.max(0, panelWidth));
	const properties: Array<{ label: string; value: string; priority: number }> = [
		{
			label: 'Size',
			value: selectedFile ? `${selectedFile.size.toLocaleString('en-CA')} B` : 'N/A',
			priority: 1,
		},
		{ label: 'Created', value: formatDate(selectedFileBirthtime), priority: 2 },
		{ label: 'Modified', value: formatDate(selectedFileMtime), priority: 3 },
		{ label: 'Perms', value: permissions, priority: 4 },
	];
	const propertyRows = [...properties]
		.sort((a, b) => a.priority - b.priority)
		.map((property) => {
			const maxValueWidth = Math.max(0, contentWidth - propertiesLabelWidth - 2);
			return {
				label: property.label,
				value: truncate(property.value, maxValueWidth),
			};
		});
	const fixedRows = selectedFile ? 4 : 1;
	const innerHeight = Math.max(0, panelHeight - 2);
	const propertyBudget = Math.max(0, innerHeight - fixedRows);
	const visiblePropertyRows = propertyRows.slice(0, propertyBudget);
	const hiddenPropertyCount = propertyRows.length - visiblePropertyRows.length;
	const showHiddenPropertiesRow = hiddenPropertyCount > 0 && propertyBudget > 0;
	const emptyRows = Math.max(
		0,
		innerHeight - fixedRows - visiblePropertyRows.length - (showHiddenPropertiesRow ? 1 : 0),
	);
	const typeDisplay = getTypeDisplay(selectedFile, theme, fileTypeColoursEnabled);
	const selectedCounts = getSelectedDirectoryFileCounts(selectedFile);
	const directoriesLabel =
		selectedCounts.directories === null
			? 'N/A'
			: selectedCounts.directories.toLocaleString('en-CA');
	const filesLabel =
		selectedCounts.files === null ? 'N/A' : selectedCounts.files.toLocaleString('en-CA');

	return (
		<Box flexDirection="column" width="100%" height={panelHeight}>
			<Box paddingX={1}>
				<Text color={theme.colours.muted} bold wrap="truncate-end">
					{titlePrefix}
					<Text color={theme.colours.text}>{headerMetaText}</Text>
				</Text>
			</Box>
			<Text color={theme.colours.line}>{divider}</Text>
			{selectedFile && innerHeight > 0 ? (
				<>
					<Box paddingX={1}>
						<Text color={theme.colours.muted} bold>
							Selected
						</Text>
					</Box>
					<Box paddingX={1}>
						<Text color={theme.colours.muted}>
							Dirs: {directoriesLabel} | Files: {filesLabel}
						</Text>
					</Box>
					<Box paddingX={1}>
						<Text color={theme.colours.muted}>Type: </Text>
						<Text color={typeDisplay.colour}>{typeDisplay.label}</Text>
					</Box>
					<Box paddingX={1}>
						<Text color={theme.colours.muted}>Impact: </Text>
						<Text color={sizeImpactColour}>{sizeImpact}</Text>
						{metadataLoading ? <Text color={theme.colours.muted}> | Updating...</Text> : null}
					</Box>
					{visiblePropertyRows.map((row) => (
						<Box key={row.label} paddingX={1}>
							<Text color={theme.colours.muted}>{row.label.padEnd(propertiesLabelWidth, ' ')}</Text>
							<Text color={theme.colours.muted}>: </Text>
							{row.label === 'Perms' ? (
								<Text>
									{Array.from(row.value).map((char, index) => (
										<Text key={`perm-${char}-${index}`} color={getPermissionColour(char, theme)}>
											{char}
										</Text>
									))}
								</Text>
							) : (
								<Text color={theme.colours.text}>{row.value}</Text>
							)}
						</Box>
					))}
					{showHiddenPropertiesRow ? (
						<Box paddingX={1}>
							<Text color={theme.colours.muted}>+{hiddenPropertyCount} more</Text>
						</Box>
					) : null}
					{Array.from({ length: emptyRows }).map((_, index) => (
						<Box key={`empty-${index}`} paddingX={1}>
							<Text color={theme.colours.text}>{' '.repeat(contentWidth)}</Text>
						</Box>
					))}
				</>
			) : null}
		</Box>
	);
};
