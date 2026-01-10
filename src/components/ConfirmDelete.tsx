import React from 'react';
import { Box, Text } from 'ink';
import { Theme } from '../themes.js';

interface ConfirmDeleteProps {
  fileName: string;
  theme: Theme;
}

export const ConfirmDelete: React.FC<ConfirmDeleteProps> = ({ fileName, theme }) => {
  return (
    <Box
      borderStyle="double"
      borderColor="red"
      flexDirection="column"
      padding={1}
      alignSelf="center"
    >
      <Text color="red" bold>
        Delete {fileName}?
      </Text>
      <Box marginTop={1}>
        <Text color={theme.colours.text}>
          Press <Text bold color="red">y</Text> to confirm, or any other key to cancel.
        </Text>
      </Box>
    </Box>
  );
};
