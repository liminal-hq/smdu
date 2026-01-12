import React, { useEffect, useMemo, useState } from 'react';
import { Box, Text, useStdout } from 'ink';
import { Theme } from '../themes.js';
import { FileNode } from '../scanner.js';
import { ViewMode } from '../state.js';
import { filesize } from 'filesize';
import path from 'path';
import { FILE_TYPE_LEGEND, getFileTypeCategory } from '../fileTypeColours.js';

interface FileListProps {
  files: FileNode[];
  selectedIndex: number;
  maxSize: number; // Size of the largest file in the list, for bar calculation
  theme: Theme;
  units: 'iec' | 'si';
  viewMode: ViewMode;
  rootPath: string;
  scanRootPath: string;
  fileTypeColoursEnabled: boolean;
  showLegend: boolean;
  extraBottomRows?: number;
}

const APP_HEADER_ROWS = 3;
const APP_FOOTER_ROWS = 3;
const MIN_NAME_COL = 16;
const SIZE_COL = 12;
const PERCENT_COL = 7;
const MIN_GRAPH_COL = 8;

export const FileList: React.FC<FileListProps> = ({
  files,
  selectedIndex,
  maxSize,
  theme,
  units,
  viewMode,
  rootPath,
  scanRootPath,
  fileTypeColoursEnabled,
  showLegend,
  extraBottomRows = 0,
}) => {
  const { stdout } = useStdout();
  const [totalRows, setTotalRows] = useState(() => stdout?.rows ?? process.stdout.rows ?? 24);
  const [totalColumns, setTotalColumns] = useState(() => stdout?.columns ?? process.stdout.columns ?? 80);
  const showLegendRow = showLegend && fileTypeColoursEnabled;
  const listHeaderRows = showLegendRow ? 4 : 3;
  const reservedRows = APP_HEADER_ROWS + listHeaderRows + APP_FOOTER_ROWS + extraBottomRows;

  useEffect(() => {
    const updateRows = () => {
      setTotalRows(stdout?.rows ?? process.stdout.rows ?? 24);
      setTotalColumns(stdout?.columns ?? process.stdout.columns ?? 80);
    };

    updateRows();
    const immediateTimer = setTimeout(updateRows, 0);
    const settleTimer = setTimeout(updateRows, 100);
    stdout?.on('resize', updateRows);

    return () => {
      stdout?.off('resize', updateRows);
      clearTimeout(immediateTimer);
      clearTimeout(settleTimer);
    };
  }, [stdout]);

  const windowSize = Math.max(1, totalRows - reservedRows);
  const columnLayout = useMemo(() => {
    const contentColumns = Math.max(0, totalColumns - 2); // paddingX=1
    const fixedColumns = SIZE_COL + PERCENT_COL;
    const remaining = Math.max(0, contentColumns - fixedColumns);

    let graphColumns = Math.max(MIN_GRAPH_COL, Math.floor(remaining * 0.35));
    let nameColumns = Math.max(MIN_NAME_COL, remaining - graphColumns);

    if (nameColumns + graphColumns > remaining) {
      graphColumns = Math.max(MIN_GRAPH_COL, remaining - MIN_NAME_COL);
      nameColumns = Math.max(MIN_NAME_COL, remaining - graphColumns);
    }

    if (remaining < MIN_NAME_COL + MIN_GRAPH_COL) {
      graphColumns = Math.max(0, remaining - MIN_NAME_COL);
      nameColumns = remaining - graphColumns;
    }

    const showGraph = graphColumns >= 6;
    const barWidth = Math.max(0, graphColumns - 2);

    return {
      nameColumns: Math.max(1, nameColumns),
      sizeColumns: SIZE_COL,
      percentColumns: PERCENT_COL,
      graphColumns,
      barWidth,
      showGraph,
    };
  }, [totalColumns]);

  let start = 0;
  if (selectedIndex >= windowSize / 2) {
      start = selectedIndex - Math.floor(windowSize / 2);
  }
  if (start + windowSize > files.length) {
      start = Math.max(0, files.length - windowSize);
  }

  const visibleFiles = files.slice(start, start + windowSize);

  return (
    <Box flexDirection="column" width="100%">
      <Box paddingX={1} borderStyle="single" flexDirection="column">
        <Box>
          <Box width={columnLayout.nameColumns}>
            <Text underline>{viewMode === 'flat' ? 'Path' : 'Name'}</Text>
          </Box>
          <Box width={columnLayout.sizeColumns}><Text underline>Size</Text></Box>
          <Box width={columnLayout.percentColumns}><Text underline>%</Text></Box>
          {columnLayout.showGraph ? (
            <Box width={columnLayout.graphColumns}><Text underline>Graph</Text></Box>
          ) : null}
        </Box>
        {showLegendRow ? (
          <Box width="100%">
            <Text wrap="truncate-end" color={theme.colours.text}>
              Legend:{' '}
              {FILE_TYPE_LEGEND.map((entry, entryIndex) => (
                <Text key={entry.category} color={theme.colours.fileTypes[entry.category]}>
                  {entry.label}{entryIndex < FILE_TYPE_LEGEND.length - 1 ? '  ' : ''}
                </Text>
              ))}
            </Text>
          </Box>
        ) : null}
      </Box>
      {visibleFiles.map((file, index) => {
        const globalIndex = start + index;
        const isSelected = globalIndex === selectedIndex;
        const percentage = maxSize > 0 ? (file.size / maxSize) * 100 : 0;
        const barFilled = Math.round((percentage / 100) * columnLayout.barWidth);
        const barEmpty = Math.max(0, columnLayout.barWidth - barFilled);

        const barStr = '#'.repeat(barFilled) + '-'.repeat(barEmpty);

        const basePath = viewMode === 'flat' ? scanRootPath : rootPath;
        const relativePath = path.relative(basePath, file.path) || file.name;
        const pathSegments = relativePath.split(path.sep).filter(Boolean);
        const depth = Math.max(0, pathSegments.length - 1);
        const indent = viewMode === 'tree'
          ? '  '.repeat(depth)
          : '';
        const baseName = viewMode === 'flat' ? relativePath : file.name;
        const displayName = file.isDirectory
          ? `${baseName}/`
          : baseName;
        const entryLabel = `${indent}${file.isDirectory ? '/' : ' '} ${displayName}`;
        const fileTypeCategory = getFileTypeCategory(file.name, file.isDirectory);
        const entryColour = (fileTypeColoursEnabled && fileTypeCategory)
          ? theme.colours.fileTypes[fileTypeCategory]
          : theme.colours.text;

        return (
          <Box key={file.path} width="100%">
            <Box
              width="100%"
              paddingX={1}
            >
              <Box width={columnLayout.nameColumns}>
                <Text
                    backgroundColor={isSelected ? theme.colours.highlight : undefined}
                    color={isSelected ? theme.colours.selectedText : entryColour}
                    wrap="truncate-end"
                >
                  {entryLabel}
                </Text>
              </Box>

              <Box width={columnLayout.sizeColumns} justifyContent="flex-end">
                  <Text
                    backgroundColor={isSelected ? theme.colours.highlight : undefined}
                    color={isSelected ? theme.colours.selectedText : theme.colours.size}
                  >
                    {filesize(file.size, units === 'si' ? { base: 10, standard: 'si' } : { base: 2, standard: 'iec' })}
                  </Text>
              </Box>

              <Box width={columnLayout.percentColumns} justifyContent="flex-end">
                  <Text
                    backgroundColor={isSelected ? theme.colours.highlight : undefined}
                    color={isSelected ? theme.colours.selectedText : theme.colours.percentage}
                  >
                    {percentage.toFixed(1)}%
                  </Text>
              </Box>

              {columnLayout.showGraph ? (
                <Box width={columnLayout.graphColumns}>
                  <Text
                      backgroundColor={isSelected ? theme.colours.highlight : undefined}
                      color={isSelected ? theme.colours.selectedText : theme.colours.bar}
                  >
                      [{barStr}]
                  </Text>
                </Box>
              ) : null}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};
