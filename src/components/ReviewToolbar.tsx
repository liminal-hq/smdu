// Render compact Review Mode controls and active state indicators
//
// (c) Copyright 2026 Liminal HQ, Scott Morris
// SPDX-License-Identifier: MIT

import React from 'react';
import { Box, Text } from 'ink';
import { Theme } from '../themes.js';
import { getReviewPresetById } from '../review/presets.js';
import { ReviewSortField, ReviewViewState } from '../review/types.js';

interface ReviewToolbarProps {
	theme: Theme;
	state: ReviewViewState;
	resultCount: number;
}

const SORT_LABELS: Record<ReviewSortField, string> = {
	size: 'Size',
	modified: 'Modified',
	created: 'Created',
	path: 'Path',
	type: 'Type',
	count: 'Count',
	percent: '%',
};

const formatMinSize = (bytes?: number): string => {
	if (!bytes) return 'off';
	if (bytes >= 1024 * 1024 * 1024) return `${Math.round(bytes / (1024 * 1024 * 1024))} GiB`;
	if (bytes >= 1024 * 1024) return `${Math.round(bytes / (1024 * 1024))} MiB`;
	if (bytes >= 1024) return `${Math.round(bytes / 1024)} KiB`;
	return `${bytes} B`;
};

export const ReviewToolbar: React.FC<ReviewToolbarProps> = ({ theme, state, resultCount }) => {
	const presetLabel = getReviewPresetById(state.presetId)?.label ?? state.presetId;
	const groupLabel = state.groupBy === 'none' ? 'None' : state.groupBy;
	const scopeLabel =
		state.filters.scope === 'files'
			? 'Files'
			: state.filters.scope === 'directories'
				? 'Directories'
				: 'Both';
	const hiddenLabel = state.filters.includeHidden ? 'On' : 'Off';
	const mediaLabel = state.filters.mediaOnly ? 'On' : 'Off';
	const minSizeLabel = formatMinSize(state.filters.minSizeBytes);
	const ageLabel = state.filters.ageBuckets.length > 0 ? state.filters.ageBuckets.join(',') : 'off';

	return (
		<Box paddingX={1} flexDirection="column">
			<Text color={theme.colours.muted} wrap="truncate-end">
				Preset: <Text color={theme.colours.text}>{presetLabel}</Text> | Scope:{' '}
				<Text color={theme.colours.text}>{scopeLabel}</Text> | Sort:{' '}
				<Text color={theme.colours.text}>
					{SORT_LABELS[state.sortBy]} {state.sortOrder}
				</Text>{' '}
				| Group: <Text color={theme.colours.text}>{groupLabel}</Text> | Results:{' '}
				<Text color={theme.colours.text}>{resultCount.toLocaleString('en-CA')}</Text>
			</Text>
			<Text color={theme.colours.muted} wrap="truncate-end">
				Filters: hidden=<Text color={theme.colours.text}>{hiddenLabel}</Text> media=
				<Text color={theme.colours.text}>{mediaLabel}</Text> min=
				<Text color={theme.colours.text}>{minSizeLabel}</Text> age=
				<Text color={theme.colours.text}>{ageLabel}</Text>
			</Text>
		</Box>
	);
};
