import React from 'react';
import { Box } from 'ink';
import { Theme } from '../themes.js';

interface StatusBannerProps {
  theme: Theme;
  children: React.ReactNode;
}

export const StatusBanner: React.FC<StatusBannerProps> = ({ theme, children }) => (
  <Box
    paddingX={1}
    paddingY={0}
    borderStyle="round"
    borderColor={theme.colours.footer}
    flexDirection="column"
    width="100%"
  >
    {children}
  </Box>
);
