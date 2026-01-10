import React from 'react';
import { Box, Text } from 'ink';
import { Theme } from '../themes.js';
import { FileNode } from '../scanner.js';
import { filesize } from 'filesize';

interface FileListProps {
  files: FileNode[];
  selectedIndex: number;
  maxSize: number; // Size of the largest file in the list, for bar calculation
  theme: Theme;
}

const BAR_WIDTH = 20;

export const FileList: React.FC<FileListProps> = ({
  files,
  selectedIndex,
  maxSize,
  theme,
}) => {
  const WINDOW_SIZE = process.stdout.rows ? process.stdout.rows - 7 : 20;

  let start = 0;
  if (selectedIndex >= WINDOW_SIZE / 2) {
      start = selectedIndex - Math.floor(WINDOW_SIZE / 2);
  }
  if (start + WINDOW_SIZE > files.length) {
      start = Math.max(0, files.length - WINDOW_SIZE);
  }

  const visibleFiles = files.slice(start, start + WINDOW_SIZE);

  return (
    <Box flexDirection="column" width="100%">
      <Box paddingX={1} borderStyle="single">
          <Box width="50%"><Text underline>Name</Text></Box>
          <Box width="15%"><Text underline>Size</Text></Box>
          <Box width="10%"><Text underline>%</Text></Box>
          <Box><Text underline>Graph</Text></Box>
      </Box>
      {visibleFiles.map((file, index) => {
        const globalIndex = start + index;
        const isSelected = globalIndex === selectedIndex;
        const percentage = maxSize > 0 ? (file.size / maxSize) * 100 : 0;
        const barFilled = Math.round((percentage / 100) * BAR_WIDTH);
        const barEmpty = BAR_WIDTH - barFilled;

        const barStr = '#'.repeat(barFilled) + '-'.repeat(barEmpty);

        return (
          <Box key={file.path} width="100%">
            <Box
              width="100%"
              paddingX={1}
            >
              <Box width="50%">
                <Text
                    backgroundColor={isSelected ? theme.colours.highlight : undefined}
                    color={isSelected ? theme.colours.selectedText : theme.colours.text}
                    wrap="truncate-end"
                >
                  {file.isDirectory ? '/' : ' '} {file.name}
                </Text>
              </Box>

              <Box width="15%">
                  <Text
                    backgroundColor={isSelected ? theme.colours.highlight : undefined}
                    color={isSelected ? theme.colours.selectedText : theme.colours.size}
                  >
                    {filesize(file.size)}
                  </Text>
              </Box>

              <Box width="10%">
                  <Text
                    backgroundColor={isSelected ? theme.colours.highlight : undefined}
                    color={isSelected ? theme.colours.selectedText : theme.colours.percentage}
                  >
                    {percentage.toFixed(1)}%
                  </Text>
              </Box>

              <Box>
                <Text
                    backgroundColor={isSelected ? theme.colours.highlight : undefined}
                    color={isSelected ? theme.colours.selectedText : theme.colours.bar}
                >
                    [{barStr}]
                </Text>
              </Box>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};
