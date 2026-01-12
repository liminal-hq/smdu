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
}

export const Footer: React.FC<FooterProps> = ({
  totalSize,
  itemCount,
  theme,
  units,
  isScanning = false,
}) => {
  const { stdout } = useStdout();
  const totalColumns = stdout?.columns ?? process.stdout.columns ?? 80;
  const leftWidth = Math.max(20, Math.floor(totalColumns * 0.55));
  const rightWidth = Math.max(20, totalColumns - leftWidth - 2);
  const divider = '-'.repeat(Math.max(0, totalColumns));
  const sizeLabel = filesize(totalSize, units === 'si' ? { base: 10, standard: 'si' } : { base: 2, standard: 'iec' });
  const scanLabel = isScanning ? ' | Scan: Partial' : '';
  const leftText = `Total: ${sizeLabel} (${itemCount} items)${scanLabel}`;
  const rightText = 'Help: ?  Info: i  Panel: p  Timer: T';

  return (
    <Box flexDirection="column" width="100%">
      <Text color={theme.colours.line}>{divider}</Text>
      <Box paddingX={1}>
        <Box width={leftWidth}>
          <Text color={theme.colours.text} wrap="truncate-end">
            {leftText}
          </Text>
        </Box>
        <Box width={rightWidth} justifyContent="flex-end">
          <Text color={theme.colours.muted} wrap="truncate-end">
            {rightText}
          </Text>
        </Box>
      </Box>
    </Box>
  );
};
