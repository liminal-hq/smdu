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
  heatmapEnabled: boolean;
  availableColumns?: number;
  extraBottomRows?: number;
}

const APP_HEADER_ROWS = 2;
const APP_FOOTER_ROWS = 2;
const MIN_NAME_COL = 16;
const SIZE_COL = 12;
const PERCENT_COL = 7;
const MIN_GRAPH_COL = 8;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const hslToHex = (h: number, s: number, l: number): string => {
  const normalisedS = clamp(s, 0, 100) / 100;
  const normalisedL = clamp(l, 0, 100) / 100;
  const chroma = (1 - Math.abs(2 * normalisedL - 1)) * normalisedS;
  const hueSegment = (((h % 360) + 360) % 360) / 60;
  const secondComponent = chroma * (1 - Math.abs((hueSegment % 2) - 1));
  let red = 0;
  let green = 0;
  let blue = 0;

  if (hueSegment >= 0 && hueSegment < 1) {
    red = chroma;
    green = secondComponent;
  } else if (hueSegment >= 1 && hueSegment < 2) {
    red = secondComponent;
    green = chroma;
  } else if (hueSegment >= 2 && hueSegment < 3) {
    green = chroma;
    blue = secondComponent;
  } else if (hueSegment >= 3 && hueSegment < 4) {
    green = secondComponent;
    blue = chroma;
  } else if (hueSegment >= 4 && hueSegment < 5) {
    red = secondComponent;
    blue = chroma;
  } else if (hueSegment >= 5 && hueSegment < 6) {
    red = chroma;
    blue = secondComponent;
  }

  const match = normalisedL - chroma / 2;
  const toHex = (value: number) => {
    const scaled = Math.round((value + match) * 255);
    return scaled.toString(16).padStart(2, '0');
  };

  return `#${toHex(red)}${toHex(green)}${toHex(blue)}`;
};

const getHeatmapColour = (ratio: number): string => {
  const clamped = clamp(ratio, 0, 1);
  const hue = 120 - 120 * clamped;
  return hslToHex(hue, 80, 50);
};

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
  heatmapEnabled,
  availableColumns,
  extraBottomRows = 0,
}) => {
  const { stdout } = useStdout();
  const [totalRows, setTotalRows] = useState(() => stdout?.rows ?? process.stdout.rows ?? 24);
  const totalColumns = availableColumns ?? stdout?.columns ?? process.stdout.columns ?? 80;
  const showLegendRow = showLegend && fileTypeColoursEnabled;
  const listHeaderRows = showLegendRow ? 3 : 2;
  const reservedRows = APP_HEADER_ROWS + listHeaderRows + APP_FOOTER_ROWS + extraBottomRows;

  useEffect(() => {
    const updateRows = () => {
      setTotalRows(stdout?.rows ?? process.stdout.rows ?? 24);
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

  // Construct segmented divider
  const getDivider = () => {
    const dash = '-';
    // paddingX=1 means 1 char on left, so first break is at nameColumns + 1
    // But text is inside padding... wait.
    // The columns are INSIDE the padding.
    // So relative to the `Text` output (which has no padding itself, but is inside `Box`... no the Text is OUTSIDE Box padding)
    // `Text` here is independent: `<Text color={theme.colours.line}>{divider}</Text>`
    // So we need to account for the 1 char padding of the headers above.

    // Header layout:
    // PADDING(1) | Name | Size | Percent | Graph

    const pad = '-'; // Character to use for padding area? Or space? Divider usually dashes.
    // If we use breaks, usually spaces?
    // "Can there be breaks in the ---- row... to show delination"
    // So spaces at boundaries.

    let line = '';
    // Left padding
    line += '-';

    // Name column
    line += '-'.repeat(Math.max(0, columnLayout.nameColumns));

    // Break?
    line += ' '; // Break between Name and Size

    // Size column
    line += '-'.repeat(Math.max(0, columnLayout.sizeColumns));

    // Break
    line += ' ';

    // Percent
    line += '-'.repeat(Math.max(0, columnLayout.percentColumns));

    if (columnLayout.showGraph) {
        line += ' ';
        line += '-'.repeat(Math.max(0, columnLayout.graphColumns));
    }

    // Right padding (approximate if full width match needed)
    // The above calculation might exceed totalColumns or be less due to flexibility.
    // Layout calc uses `remaining` logic.
    // name + graph + size + percent = contentColumns.
    // So sum matches totalColumns - 2.
    // We added spaces. We need to subtract dashes to make room for spaces?
    // User wants alignment. Headers are flexed? No, specific widths.
    // <Box width={...}>

    // So if I add spaces, I need to reduce dashes?
    // No, the columns have specific widths.
    // If headers are:
    // <Box width={nameCol}>...</Box><Box width={sizeCol}>...</Box>
    // They are adjacent.
    // So the break should be BETWEEN them.
    // But there is no space between them in the header layout currently.
    // "Break in the ---- row".
    // If I put a space in the divider, it implies a vertical separator, but header text has no gap?
    // Header text is just separate boxes.
    // If I put a gap in divider, it visually separates columns.
    // But if columns are tight, the gap might eat into column space?
    // Wait, the divider is just a visual line.
    // If I replace the char at boundary with ' ', it works.

    // Boundary 1: 1 + nameColumns
    // Boundary 2: 1 + nameColumns + sizeColumns
    // etc.

    const fullLine = '-'.repeat(totalColumns);
    const chars = fullLine.split('');

    let cursor = 1; // Left padding

    cursor += columnLayout.nameColumns;
    if (cursor < chars.length) chars[cursor] = ' '; // Break? Or cursor-1?
    // If column is width N, it occupies index 1 to 1+N-1.
    // Next column starts at 1+N.
    // So break should be at 1+N? No, that's the start of next column.
    // Usually break is between?
    // If headers are flush, break might look weird if it erases a char under a letter.
    // But usually headers align left/right.

    // Let's try putting space at `cursor` (start of Size col) reduces Size divider?
    // Or maybe `cursor - 1`?
    // User said "delination between the columns".
    // I'll put space at the boundary indices.

    chars[cursor] = ' '; // Between Name and Size?
    // Wait, if Name is "Filename......", and Size is "....10KB", they touch.
    // A space at `cursor` overwrites the first dash of Size column.
    // That seems fine.

    cursor += columnLayout.sizeColumns;
    if (cursor < chars.length) chars[cursor] = ' ';

    cursor += columnLayout.percentColumns;
    if (columnLayout.showGraph && cursor < chars.length) chars[cursor] = ' ';

    return chars.join('');
  };

  const divider = getDivider();

  return (
    <Box flexDirection="column" width="100%">
      <Box paddingX={1} flexDirection="column">
        <Box>
          <Box width={columnLayout.nameColumns}>
            <Text color={theme.colours.muted}>{viewMode === 'flat' ? 'Path' : 'Name'}</Text>
          </Box>
          <Box width={columnLayout.sizeColumns} justifyContent="flex-end">
            <Text color={theme.colours.muted}>Size</Text>
          </Box>
          <Box width={columnLayout.percentColumns} justifyContent="flex-end">
            <Text color={theme.colours.muted}>{columnLayout.showGraph ? '' : 'Usage'}</Text>
          </Box>
          {columnLayout.showGraph ? (
            <Box width={columnLayout.graphColumns}>
              <Text color={theme.colours.muted}>Usage</Text>
            </Box>
          ) : null}
        </Box>
        {showLegendRow ? (
          <Box width="100%">
            <Text wrap="truncate-end" color={theme.colours.muted}>
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
      <Text color={theme.colours.line}>{divider}</Text>
      {visibleFiles.map((file, index) => {
        const globalIndex = start + index;
        const isSelected = globalIndex === selectedIndex;
        const percentage = maxSize > 0 ? (file.size / maxSize) * 100 : 0;
        const barFilled = Math.round((percentage / 100) * columnLayout.barWidth);
        const barEmpty = Math.max(0, columnLayout.barWidth - barFilled);
        const heatmapColour = getHeatmapColour(maxSize > 0 ? file.size / maxSize : 0);
        const barColour = heatmapEnabled ? heatmapColour : theme.colours.bar;
        const barFilledStr = '#'.repeat(barFilled);
        const barEmptyStr = '.'.repeat(barEmpty);

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
                    color={isSelected ? theme.colours.selectedText : theme.colours.line}
                  >
                    [
                  </Text>
                  <Text
                    backgroundColor={isSelected ? theme.colours.highlight : undefined}
                    color={
                      heatmapEnabled
                        ? heatmapColour
                        : isSelected
                        ? theme.colours.selectedText
                        : theme.colours.bar
                    }
                  >
                    {barFilledStr}
                  </Text>
                  <Text
                    backgroundColor={isSelected ? theme.colours.highlight : undefined}
                    color={theme.colours.barEmpty}
                  >
                    {barEmptyStr}
                  </Text>
                  <Text
                    backgroundColor={isSelected ? theme.colours.highlight : undefined}
                    color={isSelected ? theme.colours.selectedText : theme.colours.line}
                  >
                    ]
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
