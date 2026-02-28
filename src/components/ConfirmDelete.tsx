import React from 'react';
import { Box, Text } from 'ink';
import { Theme } from '../themes.js';
import { sanitize } from '../utils/sanitize.js';

interface ConfirmDeleteProps {
	fileName: string;
	formattedSize?: string;
	isDirectory?: boolean;
	theme: Theme;
}

export const ConfirmDelete: React.FC<ConfirmDeleteProps> = ({
	fileName,
	formattedSize,
	isDirectory,
	theme,
}) => {
	const typeLabel = isDirectory ? 'directory' : 'file';
	const sizeLabel = formattedSize ? ` (${formattedSize})` : '';

	return (
		<Box
			borderStyle="single"
			borderColor="red"
			flexDirection="column"
			padding={1}
			alignSelf="center"
		>
			<Text color="red" bold>
				Delete {typeLabel} '{sanitize(fileName)}'{sizeLabel}?
			</Text>
			<Box marginTop={1}>
				<Text color={theme.colours.text}>
					Press{' '}
					<Text bold color="red">
						y
					</Text>{' '}
					to confirm, or any other key to cancel.
				</Text>
			</Box>
		</Box>
	);
};
