import React from 'react';
import { Box, Text, useStdout } from 'ink';
import { Theme } from '../themes.js';
import { SortField, SortOrder, ViewMode } from '../state.js';

interface StatusPanelProps {
  theme: Theme;
  sortBy: SortField;
  sortOrder: SortOrder;
  viewMode: ViewMode;
  showHiddenFiles: boolean;
  heatmapEnabled: boolean;
  fileTypeColoursEnabled: boolean;
  showLegend: boolean;
  units: 'iec' | 'si';
  width?: number;
  height?: number;
}

export const StatusPanel: React.FC<StatusPanelProps> = ({
  theme,
  sortBy,
  sortOrder,
  viewMode,
  showHiddenFiles,
  heatmapEnabled,
  fileTypeColoursEnabled,
  showLegend,
  units,
  width,
  height,
}) => {
  const { stdout } = useStdout();
  const panelWidth = Math.max(10, width ?? stdout?.columns ?? process.stdout.columns ?? 30);
  const panelHeight = Math.max(3, height ?? stdout?.rows ?? process.stdout.rows ?? 10);
  const contentWidth = Math.max(0, panelWidth - 2);
  const sortLabel = sortBy === 'name' ? 'Name' : 'Size';
  const orderLabel = sortOrder === 'asc' ? 'asc' : 'desc';
  const viewLabel = viewMode === 'tree' ? 'Tree' : 'Flat';
  const hiddenLabel = showHiddenFiles ? 'On' : 'Off';
  const heatmapLabel = heatmapEnabled ? 'On' : 'Off';
  const legendLabel = fileTypeColoursEnabled ? (showLegend ? 'On' : 'Off') : 'N/A';
  const unitsLabel = units === 'iec' ? 'IEC' : 'SI';

  const statusItems = [
    `Sort: ${sortLabel} (${orderLabel})`,
    `View: ${viewLabel}`,
    `Units: ${unitsLabel}`,
    `Hidden [.]: ${hiddenLabel}`,
    `Heatmap [H]: ${heatmapLabel}`,
    `Legend [L]: ${legendLabel}`,
  ];

  const title = ' Status ';
  const trimmedTitle = title.length > contentWidth ? title.slice(0, contentWidth) : title;
  const topLine = `┌${trimmedTitle}${'─'.repeat(Math.max(0, contentWidth - trimmedTitle.length))}┐`;
  const bottomLine = `└${'─'.repeat(contentWidth)}┘`;
  const contentLines = statusItems.map((item) => {
    const trimmed = item.length > contentWidth ? item.slice(0, contentWidth) : item;
    return `│${trimmed}${' '.repeat(Math.max(0, contentWidth - trimmed.length))}│`;
  });
  const emptyLine = `│${' '.repeat(contentWidth)}│`;
  const innerHeight = Math.max(0, panelHeight - 2);
  const paddedLines = contentLines.length >= innerHeight
    ? contentLines.slice(0, innerHeight)
    : [...contentLines, ...Array(innerHeight - contentLines.length).fill(emptyLine)];

  return (
    <Box flexDirection="column" width="100%" height={panelHeight}>
      <Text color={theme.colours.footer}>{topLine}</Text>
      {paddedLines.map((line, index) => (
        <Text key={`${line}-${index}`} color={theme.colours.text}>
          {line}
        </Text>
      ))}
      <Text color={theme.colours.footer}>{bottomLine}</Text>
    </Box>
  );
};
