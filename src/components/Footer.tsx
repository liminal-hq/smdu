import React from 'react';
import { Box, Text } from 'ink';
import { Theme } from '../themes.js';
import { FileNode } from '../scanner.js';
import { filesize } from 'filesize';

interface FooterProps {
  totalSize: number;
  itemCount: number;
  theme: Theme;
}

export const Footer: React.FC<FooterProps> = ({ totalSize, itemCount, theme }) => {
  return (
    <Box
      borderStyle="single"
      borderColor={theme.colours.footer}
      paddingX={1}
      width="100%"
      justifyContent="space-between"
    >
      <Box>
        <Text color={theme.colours.footer}>
          Total: {filesize(totalSize)} ({itemCount} items)
        </Text>
      </Box>
      <Box>
        <Text color={theme.colours.footer}>
          Delete: d | Settings: S | Quit: q | Nav: Arrows/Enter/Back
        </Text>
      </Box>
    </Box>
  );
};
