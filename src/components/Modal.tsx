import React from 'react';
import { Box, Text, useStdout } from 'ink';
import { Theme } from '../themes.js';

interface ModalProps {
  theme: Theme;
  title: string;
  hint?: string;
  width?: number;
  height?: number;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  theme,
  title,
  hint,
  width,
  height,
  children,
}) => {
  const { stdout } = useStdout();
  const totalColumns = stdout?.columns ?? process.stdout.columns ?? 80;
  const totalRows = stdout?.rows ?? process.stdout.rows ?? 24;
  const modalWidth = width ?? Math.min(72, Math.max(40, totalColumns - 6));
  const modalHeight = height ?? Math.min(18, Math.max(10, totalRows - 6));

  return (
    <Box
      position="absolute"
      width="100%"
      height={totalRows}
      justifyContent="center"
      alignItems="center"
    >
      <Box
        borderStyle="double"
        borderColor={theme.colours.header}
        paddingX={2}
        paddingY={1}
        width={modalWidth}
        height={modalHeight}
        flexDirection="column"
        backgroundColor={theme.colours.background}
      >
        <Box justifyContent="space-between">
          <Text color={theme.colours.header} bold>{title}</Text>
          {hint ? <Text color={theme.colours.text}>{hint}</Text> : null}
        </Box>
        <Box flexDirection="column" marginTop={1} flexGrow={1}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};
