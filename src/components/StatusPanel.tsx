import React from 'react';
import { Box, Text } from 'ink';
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
}) => {
  const sortLabel = sortBy === 'name' ? 'Name' : 'Size';
  const orderLabel = sortOrder === 'asc' ? 'asc' : 'desc';
  const viewLabel = viewMode === 'tree' ? 'Tree' : 'Flat';
  const hiddenLabel = showHiddenFiles ? 'On' : 'Off';
  const heatmapLabel = heatmapEnabled ? 'On' : 'Off';
  const legendLabel = fileTypeColoursEnabled ? (showLegend ? 'On' : 'Off') : 'N/A';

  const statusItems = [
    `Sort: ${sortLabel} (${orderLabel})`,
    `View: ${viewLabel}`,
    `Hidden: ${hiddenLabel}`,
    `Heatmap: ${heatmapLabel}`,
    `Legend: ${legendLabel}`,
  ];

  const hintItems = [
    'Panel: p',
    'Legend: L',
    'Heatmap: H',
    'Settings: S',
    'Help: ?',
    'Info: i',
    'Quit: q/Esc',
  ];

  return (
    <Box
      borderStyle="single"
      borderColor={theme.colours.footer}
      paddingX={1}
      paddingY={0}
      flexDirection="column"
      width="100%"
    >
      <Text color={theme.colours.header} bold>Status</Text>
      <Box flexDirection="column" marginTop={1}>
        {statusItems.map((item) => (
          <Text key={item} color={theme.colours.text} wrap="truncate-end">
            {item}
          </Text>
        ))}
      </Box>
      <Box flexDirection="column" marginTop={1}>
        <Text color={theme.colours.header} bold>Keys</Text>
        {hintItems.map((item) => (
          <Text key={item} color={theme.colours.size} wrap="truncate-end">
            {item}
          </Text>
        ))}
      </Box>
    </Box>
  );
};
