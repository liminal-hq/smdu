import React from 'react';
import { Box, Text, useStdout } from 'ink';
import { Theme } from '../themes.js';
interface HeaderProps {
  path: string;
  theme: Theme;
}

export const Header: React.FC<HeaderProps> = ({ path, theme }) => {
  const { stdout } = useStdout();
  const totalColumns = stdout?.columns ?? process.stdout.columns ?? 80;
  const contentWidth = Math.max(20, totalColumns - 2);

  return (
    <Box
      borderStyle="single"
      borderColor={theme.colours.header}
      paddingX={1}
      width="100%"
    >
      <Box width={contentWidth}>
        <Text color={theme.colours.header} bold wrap="truncate-end">
          {path}
        </Text>
      </Box>
    </Box>
  );
};
