import React from 'react';
import { Box, Text, useStdout } from 'ink';
import { Theme } from '../themes.js';
import { filesize } from 'filesize';
import { SortField, SortOrder } from '../state.js';

interface FooterProps {
  totalSize: number;
  itemCount: number;
  theme: Theme;
  sortBy: SortField;
  sortOrder: SortOrder;
  units: 'iec' | 'si';
}

export const Footer: React.FC<FooterProps> = ({ totalSize, itemCount, theme, sortBy, sortOrder, units }) => {
  const { stdout } = useStdout();
  const totalColumns = stdout?.columns ?? process.stdout.columns ?? 80;
  const leftWidth = Math.max(20, Math.floor(totalColumns * 0.55));
  const rightWidth = Math.max(20, totalColumns - leftWidth - 2);
  const sortLabel = sortBy === 'name' ? 'Name' : 'Size';
  const orderLabel = sortOrder === 'asc' ? 'asc' : 'desc';
  const unitsLabel = units === 'iec' ? 'IEC' : 'SI';
  const leftText = `Total: ${filesize(totalSize)} (${itemCount} items) | Sort: ${sortLabel} (${orderLabel}) | Units: ${unitsLabel}`;
  const rightText = 'Delete: d | Settings: S | Quit: q | Nav: Arrows/Enter/Back';

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
