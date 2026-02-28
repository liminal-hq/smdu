import React from 'react';
import { Text } from 'ink';
import { Theme } from '../themes.js';
import { StatusBanner } from './StatusBanner.js';
import { sanitize } from '../utils/sanitize.js';

interface ScanStatusProps {
	theme: Theme;
	summary: string;
	currentPath: string;
	spinnerFrame: string;
}

export const ScanStatus: React.FC<ScanStatusProps> = ({
	theme,
	summary,
	currentPath,
	spinnerFrame,
}) => (
	<StatusBanner theme={theme}>
		<Text color={theme.colours.muted}>
			{sanitize(summary)} {spinnerFrame}
		</Text>
		<Text color={theme.colours.text} wrap="truncate-end">
			Current: {sanitize(currentPath)}
		</Text>
	</StatusBanner>
);
