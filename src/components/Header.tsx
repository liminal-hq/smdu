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
      borderColor={theme.colours.header}
      paddingX={1}
      width="100%"
    >
      <Text color={theme.colours.header} bold>
        {path}
      </Text>
    </Box>
  );
};
