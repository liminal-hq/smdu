import React from 'react';
import { Box, Text, useStdout } from 'ink';
import { Theme } from '../themes.js';

interface StatusBannerProps {
  theme: Theme;
  children: React.ReactNode;
}

export const StatusBanner: React.FC<StatusBannerProps> = ({ theme, children }) => {
  const { stdout } = useStdout();
  const totalColumns = stdout?.columns ?? process.stdout.columns ?? 80;
  const divider = '-'.repeat(Math.max(0, totalColumns));

  return (
    <Box flexDirection="column" width="100%">
      <Text color={theme.colours.line}>{divider}</Text>
      <Box paddingX={1} flexDirection="column">
        {children}
      </Box>
    </Box>
  );
};
