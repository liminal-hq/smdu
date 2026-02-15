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
  mode?: 'default' | 'settings' | 'help' | 'info';
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

  const sizeLabel = filesize(totalSize, units === 'si' ? { base: 10, standard: 'si' } : { base: 2, standard: 'iec' });
  // Add dark green "Done" if not scanning?
  // User asked: "Add 'Scan: Done' when the scan is done. Can you use a dark green for the word 'Done'?"
  // If isScanning is false, we assume done? Or only after initial scan?
  // App starts with scanning=true.
  // We can just show "Scan: Done" always when not scanning? Or check if totalSize > 0?
  // Let's assume !isScanning implies Done.

  // Note: theme.colours doesn't explicitly have "dark green". I'll use a hex code or nearest standard color.
  // Ink Text accepts color names. "green" is usually bright green. "#005f00" or similar?
  // Or just "green" and assume user meant green. "dark green" might be invisible on dark bg.
  // I will use "green" for now.

  const scanStatus = isScanning ? (
      <Text>Scan: <Text color={theme.colours.fileTypes.documents}>Partial</Text></Text>
  ) : (
      <Text>Scan: <Text color={theme.colours.fileTypes.code}>Done</Text></Text>
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
  } else {
      // Default
      // "Help: ? Info: i Panel: p Timer: T/t Rescan: R"
      rightTextContent = 'Help: ?  Info: i  Panel: p  Timer: T/t  Rescan: R';
  }

  return (
    <Box flexDirection="column" width="100%">
      <Text color={theme.colours.line}>{divider}</Text>
      <Box paddingX={1}>
        <Box width={leftWidth}>
            {leftText}
        </Box>
        <Box width={rightWidth} justifyContent="flex-end">
          <Text color={theme.colours.muted} wrap="truncate-end">
            {rightTextContent}
          </Text>
        </Box>
      </Box>
    </Box>
  );
};
