import React from 'react';
import { Box, Text } from 'ink';
import { Theme } from '../themes.js';

interface HeaderProps {
  path: string;
  theme: Theme;
}

export const Header: React.FC<HeaderProps> = ({ path, theme }) => {
  return (
    <Box
      borderStyle="single"
      borderColor={theme.colors.header}
      paddingX={1}
      width="100%"
    >
      <Text color={theme.colors.header} bold>
        {path}
      </Text>
    </Box>
  );
};
