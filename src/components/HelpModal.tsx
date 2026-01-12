import React from 'react';
import { Box, Text, useStdout } from 'ink';
import { Theme } from '../themes.js';
import { HELP_ITEMS } from '../keys.js';
import { Modal } from './Modal.js';

interface HelpModalProps {
  theme: Theme;
}

export const HelpModal: React.FC<HelpModalProps> = ({ theme }) => {
  const { stdout } = useStdout();
  const totalColumns = stdout?.columns ?? process.stdout.columns ?? 80;
  const totalRows = stdout?.rows ?? process.stdout.rows ?? 24;
  const modalWidth = Math.min(72, Math.max(40, totalColumns - 6));
  const modalHeight = Math.min(18, Math.max(10, totalRows - 6));
  const labelWidth = Math.max(18, Math.floor(modalWidth * 0.55));
  const keyWidth = Math.max(12, modalWidth - labelWidth - 4);

  return (
    <Modal
      theme={theme}
      title="Help"
      hint="Close: ? or Esc"
      width={modalWidth}
      height={modalHeight}
    >
      {HELP_ITEMS.filter((item) => item.label !== 'Help').map((item) => (
        <Box key={item.label} width="100%">
          <Box width={labelWidth}>
            <Text color={theme.colours.muted} wrap="truncate-end">{item.label}</Text>
          </Box>
          <Box width={keyWidth}>
            <Text color={theme.colours.accent} wrap="truncate-end">{item.keys}</Text>
          </Box>
        </Box>
      ))}
    </Modal>
  );
};
