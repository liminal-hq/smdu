import React from 'react';
import { Box, Text } from 'ink';
import { Theme } from '../themes.js';

interface ScanStatusProps {
  theme: Theme;
  summary: string;
  currentPath: string;
  spinnerFrame: string;
}

export const ScanStatus: React.FC<ScanStatusProps> = ({
  theme,
  summary,
  currentPath,
  spinnerFrame,
}) => (
  <Box
    paddingX={1}
    paddingY={0}
    borderStyle="round"
    borderColor={theme.colours.footer}
    flexDirection="column"
    width="100%"
  >
    <Text color={theme.colours.text}>
      {summary} {spinnerFrame}
    </Text>
    <Text color={theme.colours.text} wrap="truncate-end">
      Current: {currentPath}
    </Text>
  </Box>
);
