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
  const contentWidth = Math.max(20, totalColumns - 2);
  const title = 'smdu';
  const titleLabel = ` ${title} `;

  return (
    <Box
      borderStyle="single"
      borderColor={theme.colours.header}
      paddingX={1}
      width={width ?? '100%'}
    >
      <Box position="absolute" marginTop={-1} width="100%" justifyContent="center">
        <Text color={theme.colours.header} bold>
          {titleLabel}
        </Text>
      </Box>
      <Box width={contentWidth}>
        <Text color={theme.colours.header} bold wrap="truncate-end">
          {path}
        </Text>
      </Box>
    </Box>
  );
};
