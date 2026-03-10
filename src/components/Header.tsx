import React from 'react';
import { Box, Text, useStdout } from 'ink';
import { Theme } from '../themes.js';
import { ViewMode } from '../state.js';
import { VERSION } from '../version.js';
import { sanitize } from '../utils/sanitize.js';

interface HeaderProps {
	path: string;
	theme: Theme;
	width?: number;
	viewMode?: ViewMode;
}

export const Header: React.FC<HeaderProps> = ({ path, theme, width, viewMode }) => {
	const { stdout } = useStdout();
	const totalColumns = width ?? stdout?.columns ?? process.stdout.columns ?? 80;
	const divider = '-'.repeat(Math.max(0, totalColumns));
	const versionSuffix = VERSION === 'unknown' ? '' : ` v${VERSION}`;
	const title = `smdu${versionSuffix}`;

	const viewModeLabel =
		viewMode === 'tree'
			? '[Tree]'
			: viewMode === 'flat'
				? '[Flat]'
				: viewMode === 'review'
					? '[Review]'
					: '';

	return (
		<Box flexDirection="column" width={width ?? '100%'}>
			<Box paddingX={1}>
				<Box flexGrow={1}>
					{viewMode && (
						<Text color={theme.colours.muted} bold>
							{viewModeLabel}{' '}
						</Text>
					)}
					<Text color={theme.colours.text} wrap="truncate-end">
						{sanitize(path)}
					</Text>
				</Box>
				<Text color={theme.colours.muted} bold>
					{title}
				</Text>
			</Box>
			<Text color={theme.colours.line}>{divider}</Text>
		</Box>
	);
};
