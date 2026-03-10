import React from 'react';
import { Box, Text, useStdout } from 'ink';
import { Theme } from '../themes.js';
import { filesize } from 'filesize';

interface FooterProps {
	totalSize: number;
	itemCount: number;
	theme: Theme;
	units: 'iec' | 'si';
	isScanning?: boolean;
	mode?: 'default' | 'review' | 'settings' | 'help' | 'info';
}

export const Footer: React.FC<FooterProps> = ({
	totalSize,
	itemCount,
	theme,
	units,
	isScanning = false,
	mode = 'default',
}) => {
	const { stdout } = useStdout();
	const totalColumns = stdout?.columns ?? process.stdout.columns ?? 80;
	const leftWidth = Math.max(20, Math.floor(totalColumns * 0.45));
	const rightWidth = Math.max(20, totalColumns - leftWidth - 2);
	const divider = '-'.repeat(Math.max(0, totalColumns));

	const sizeLabel = filesize(
		totalSize,
		units === 'si' ? { base: 10, standard: 'si' } : { base: 2, standard: 'iec' },
	);
	const scanStatus = isScanning ? (
		<Text>
			Scan: <Text color={theme.colours.scanStatus.scanning}>Partial</Text>
		</Text>
	) : (
		<Text>
			Scan: <Text color={theme.colours.scanStatus.done}>Done</Text>
		</Text>
	);

	const leftText = (
		<Text color={theme.colours.text}>
			Total: {sizeLabel} ({itemCount} items) | {scanStatus}
		</Text>
	);

	let rightTextContent = '';

	if (isScanning) {
		rightTextContent = 'Quit: q';
	} else if (mode === 'settings') {
		rightTextContent = `Select: Enter  Close: Esc or ${mode === 'settings' ? 'S' : ''}`;
	} else if (mode === 'help') {
		rightTextContent = 'Close: Esc or ?';
	} else if (mode === 'info') {
		rightTextContent = 'Close: Esc or i';
	} else if (mode === 'review') {
		rightTextContent = 'Review: m g u f . M z a o/O x';
	} else {
		// Default
		// "Help: ? Info: i Panel: p Timer: T/t Rescan: R"
		rightTextContent = 'Help: ?  Info: i  Panel: p  Timer: T/t  Rescan: R';
	}

	return (
		<Box flexDirection="column" width="100%">
			<Text color={theme.colours.line}>{divider}</Text>
			<Box paddingX={1}>
				<Box width={leftWidth}>{leftText}</Box>
				<Box width={rightWidth} justifyContent="flex-end">
					<Text color={theme.colours.muted} wrap="truncate-end">
						{rightTextContent}
					</Text>
				</Box>
			</Box>
		</Box>
	);
};
