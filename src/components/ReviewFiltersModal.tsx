// Show Review Mode filter values and keyboard controls in a compact modal
//
// (c) Copyright 2026 Liminal HQ, Scott Morris
// SPDX-License-Identifier: MIT

import React from 'react';
import { Box, Text } from 'ink';
import { ReviewViewState } from '../review/types.js';
import { Theme } from '../themes.js';
import { Modal } from './Modal.js';

interface ReviewFiltersModalProps {
	theme: Theme;
	state: ReviewViewState;
}

const formatMinSize = (bytes?: number): string => {
	if (!bytes) return 'off';
	if (bytes >= 1024 * 1024 * 1024) return `${Math.round(bytes / (1024 * 1024 * 1024))} GiB`;
	if (bytes >= 1024 * 1024) return `${Math.round(bytes / (1024 * 1024))} MiB`;
	if (bytes >= 1024) return `${Math.round(bytes / 1024)} KiB`;
	return `${bytes} B`;
};

const scopeLabel = (scope: ReviewViewState['filters']['scope']): string => {
	if (scope === 'files') return 'Files';
	if (scope === 'directories') return 'Directories';
	return 'Both';
};

export const ReviewFiltersModal: React.FC<ReviewFiltersModalProps> = ({ theme, state }) => {
	const { filters } = state;
	const activeAge = filters.ageBuckets.length > 0 ? filters.ageBuckets.join(', ') : 'off';
	const activeExtensions = filters.extensions.length > 0 ? filters.extensions.join(', ') : 'off';
	const activeTypes = filters.inferredTypes.length > 0 ? filters.inferredTypes.join(', ') : 'off';
	const activeSources = filters.sourceRoots.length > 0 ? filters.sourceRoots.join(', ') : 'all';

	return (
		<Modal theme={theme} title="Review Filters" hint="Close: Esc or f" width={78} height={20}>
			<Box flexDirection="column">
				<Text color={theme.colours.text}>Scope: {scopeLabel(filters.scope)}</Text>
				<Text color={theme.colours.text}>
					Hidden: {filters.includeHidden ? 'included' : 'excluded'}
				</Text>
				<Text color={theme.colours.text}>Media-only: {filters.mediaOnly ? 'on' : 'off'}</Text>
				<Text color={theme.colours.text}>Minimum size: {formatMinSize(filters.minSizeBytes)}</Text>
				<Text color={theme.colours.text}>Age bucket: {activeAge}</Text>
				<Text color={theme.colours.text} wrap="truncate-end">
					Extensions: {activeExtensions}
				</Text>
				<Text color={theme.colours.text} wrap="truncate-end">
					Types: {activeTypes}
				</Text>
				<Text color={theme.colours.text} wrap="truncate-end">
					Path prefix: {filters.pathPrefix?.trim() ? filters.pathPrefix : 'off'}
				</Text>
				<Text color={theme.colours.text} wrap="truncate-end">
					Sources: {activeSources}
				</Text>

				<Box marginTop={1} flexDirection="column">
					<Text color={theme.colours.muted}>Quick controls:</Text>
					<Text color={theme.colours.muted}>m preset | g group | u scope | . hidden</Text>
					<Text color={theme.colours.muted}>
						M media-only | z min size | a age bucket | x reset
					</Text>
				</Box>
			</Box>
		</Modal>
	);
};
