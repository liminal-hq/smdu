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
  const sizeLabel = filesize(totalSize, units === 'si' ? { base: 10, standard: 'si' } : { base: 2, standard: 'iec' });
  const scanLabel = isScanning ? ' | Scan: Partial' : '';
  const leftText = `Total: ${sizeLabel} (${itemCount} items)${scanLabel}`;
  const rightText = 'Help: ? | Info: i | Panel: p | Timer: T';

  return (
    <Box
      borderStyle="single"
      borderColor={theme.colours.footer}
      paddingX={1}
      width="100%"
    >
      <Box width={leftWidth}>
        <Text color={theme.colours.footer} wrap="truncate-end">
          {leftText}
        </Text>
      </Box>
      <Box width={rightWidth} justifyContent="flex-end">
        <Text color={theme.colours.footer} wrap="truncate-end">
          {rightText}
        </Text>
      </Box>
    </Box>
  );
};
