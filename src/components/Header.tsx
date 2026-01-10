import React from 'react';
import { Box, Text, useStdout } from 'ink';
import { Theme } from '../themes.js';
import { SortField, SortOrder, ViewMode } from '../state.js';

interface HeaderProps {
  path: string;
  theme: Theme;
  sortBy: SortField;
  sortOrder: SortOrder;
  viewMode: ViewMode;
}

export const Header: React.FC<HeaderProps> = ({ path, theme, sortBy, sortOrder, viewMode }) => {
  const { stdout } = useStdout();
  const totalColumns = stdout?.columns ?? process.stdout.columns ?? 80;
  const leftWidth = Math.max(20, Math.floor(totalColumns * 0.6));
  const rightWidth = Math.max(20, totalColumns - leftWidth - 2);
  const sortLabel = sortBy === 'name' ? 'Name' : 'Size';
  const orderLabel = sortOrder === 'asc' ? 'asc' : 'desc';
  const viewLabel = viewMode === 'tree'
    ? 'Tree'
    : 'Flat';
  const rightText = `Sort: ${sortLabel} (${orderLabel}) | View: ${viewLabel}`;

  return (
    <Box
      borderStyle="single"
      borderColor={theme.colours.header}
      paddingX={1}
      width="100%"
    >
      <Box width={leftWidth}>
        <Text color={theme.colours.header} bold wrap="truncate-end">
          {path}
        </Text>
      </Box>
      <Box width={rightWidth} justifyContent="flex-end">
        <Text color={theme.colours.header} wrap="truncate-end">
          {rightText}
        </Text>
      </Box>
    </Box>
  );
};
