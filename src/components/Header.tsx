import React from 'react';
import { Box, Text, useStdout } from 'ink';
import { Theme } from '../themes.js';
interface HeaderProps {
  path: string;
  theme: Theme;
  width?: number;
}

export const Header: React.FC<HeaderProps> = ({ path, theme, width }) => {
  const { stdout } = useStdout();
  const totalColumns = width ?? stdout?.columns ?? process.stdout.columns ?? 80;
  const divider = '-'.repeat(Math.max(0, totalColumns));
  const title = 'smdu';

  return (
    <Box flexDirection="column" width={width ?? '100%'}>
      <Box paddingX={1}>
        <Box flexGrow={1}>
          <Text color={theme.colours.text} wrap="truncate-end">
            {path}
          </Text>
        </Box>
        <Text color={theme.colours.muted} bold>
          {title}
        </Text>
      </Box>
      <Text color={theme.colours.line}>{divider}</Text>
    </Box>
  );
};
