import React from 'react';
import { Box, Text, useStdout } from 'ink';
import { Theme } from '../themes.js';
import { filesize } from 'filesize';

interface FooterProps {
  totalSize: number;
  itemCount: number;
  theme: Theme;
  units: 'iec' | 'si';
}

export const Footer: React.FC<FooterProps> = ({ totalSize, itemCount, theme, units }) => {
  const { stdout } = useStdout();
  const totalColumns = stdout?.columns ?? process.stdout.columns ?? 80;
  const leftWidth = Math.max(20, Math.floor(totalColumns * 0.55));
  const rightWidth = Math.max(20, totalColumns - leftWidth - 2);
  const unitsLabel = units === 'iec' ? 'IEC' : 'SI';
  const sizeLabel = filesize(totalSize, units === 'si' ? { base: 10, standard: 'si' } : { base: 2, standard: 'iec' });
  const leftText = `Total: ${sizeLabel} (${itemCount} items) | Units: ${unitsLabel}`;
  const rightText = 'Help: ?';

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
