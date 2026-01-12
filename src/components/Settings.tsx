import React from 'react';
import { Box, Text, useInput, useStdout } from 'ink';
import { Theme, themeNames } from '../themes.js';
import { ACTIONS, checkInput } from '../keys.js';
import { Modal } from './Modal.js';

interface SettingsProps {
  currentTheme: string;
  currentUnits: 'iec' | 'si';
  fileTypeColoursEnabled: boolean;
  heatmapEnabled: boolean;
  onSelectTheme: (themeName: string) => void;
  onSelectUnits: (units: 'iec' | 'si') => void;
  onSelectFileTypeColours: (enabled: boolean) => void;
  onSelectHeatmap: (enabled: boolean) => void;
  onBack: () => void;
  theme: Theme;
}

type SettingItem =
  | { type: 'theme'; value: string }
  | { type: 'units'; value: string }
  | { type: 'fileTypeColours'; value: 'on' | 'off' }
  | { type: 'heatmap'; value: 'on' | 'off' };

export const Settings: React.FC<SettingsProps> = ({
  currentTheme,
  currentUnits,
  fileTypeColoursEnabled,
  heatmapEnabled,
  onSelectTheme,
  onSelectUnits,
  onSelectFileTypeColours,
  onSelectHeatmap,
  onBack,
  theme,
}) => {
  const { stdout } = useStdout();
  const totalRows = stdout?.rows ?? process.stdout.rows ?? 24;
  const modalHeight = Math.min(18, Math.max(10, totalRows - 6));
  const contentRows = Math.max(3, modalHeight - 6);
  const listRows = Math.max(1, contentRows - 1);
  const items: SettingItem[] = [
    ...themeNames.map((themeName) => ({ type: 'theme' as const, value: themeName })),
    { type: 'units' as const, value: 'iec' },
    { type: 'units' as const, value: 'si' },
    { type: 'fileTypeColours' as const, value: 'on' },
    { type: 'fileTypeColours' as const, value: 'off' },
    { type: 'heatmap' as const, value: 'on' },
    { type: 'heatmap' as const, value: 'off' },
  ];

  const [selectedIndex, setSelectedIndex] = React.useState(0);

  // Set initial selection logic if needed, but 0 is fine.

  useInput((input, key) => {
    if (checkInput(input, key, ACTIONS.MOVE_UP)) {
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
    }
    if (checkInput(input, key, ACTIONS.MOVE_DOWN)) {
      setSelectedIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
    }
    if (checkInput(input, key, ACTIONS.SELECT)) {
      const item = items[selectedIndex];
      if (item.type === 'theme') {
        onSelectTheme(item.value);
      } else if (item.type === 'units') {
        onSelectUnits(item.value as 'iec' | 'si');
      } else if (item.type === 'fileTypeColours') {
        onSelectFileTypeColours(item.value === 'on');
      } else if (item.type === 'heatmap') {
        onSelectHeatmap(item.value === 'on');
      }
    }
    if (checkInput(input, key, ACTIONS.QUIT) || checkInput(input, key, ACTIONS.MOVE_LEFT)) {
      onBack();
    }
  });

  type IndexedItem = { item: SettingItem; index: number };
  const indexedItems: IndexedItem[] = items.map((item, index) => ({ item, index }));
  const themeItems = indexedItems.filter(({ item }) => item.type === 'theme');
  const unitItems = indexedItems.filter(({ item }) => item.type === 'units');
  const fileTypeItems = indexedItems.filter(({ item }) => item.type === 'fileTypeColours');
  const heatmapItems = indexedItems.filter(({ item }) => item.type === 'heatmap');

  type Row =
    | { kind: 'heading'; label: string }
    | { kind: 'spacer' }
    | { kind: 'item'; label: string; isActive: boolean; index: number };

  const toItemRow = (item: SettingItem, index: number): Row => {
    if (item.type === 'theme') {
      return {
        kind: 'item',
        label: item.value,
        isActive: item.value === currentTheme,
        index,
      };
    }
    if (item.type === 'units') {
      return {
        kind: 'item',
        label: item.value === 'iec' ? 'IEC (KiB, GiB)' : 'SI (kB, GB)',
        isActive: item.value === currentUnits,
        index,
      };
    }
    if (item.type === 'fileTypeColours') {
      return {
        kind: 'item',
        label: item.value === 'on' ? 'On' : 'Off',
        isActive: (item.value === 'on') === fileTypeColoursEnabled,
        index,
      };
    }
    return {
      kind: 'item',
      label: item.value === 'on' ? 'On' : 'Off',
      isActive: (item.value === 'on') === heatmapEnabled,
      index,
    };
  };

  const sections: Array<{ title: string; items: IndexedItem[] }> = [
    { title: 'Themes', items: themeItems },
    { title: 'Units', items: unitItems },
    { title: 'File type colours', items: fileTypeItems },
    { title: 'Heatmap colours', items: heatmapItems },
  ];

  const rows: Row[] = [];
  sections.forEach((section) => {
    if (section.items.length === 0) return;
    if (rows.length > 0) {
      rows.push({ kind: 'spacer' });
    }
    rows.push({ kind: 'heading', label: `${section.title}:` });
    section.items.forEach(({ item, index }) => {
      rows.push(toItemRow(item, index));
    });
  });

  const selectedRowIndex = Math.max(0, rows.findIndex(
    (row) => row.kind === 'item' && row.index === selectedIndex
  ));
  const maxVisibleRows = Math.max(1, listRows);
  const maxStart = Math.max(0, rows.length - maxVisibleRows);
  let start = rows.length <= maxVisibleRows
    ? 0
    : Math.min(
      Math.max(0, selectedRowIndex - Math.floor(maxVisibleRows / 2)),
      maxStart
    );
  let end = Math.min(rows.length, start + maxVisibleRows);
  let visibleRows = rows.slice(start, end);

  while (visibleRows.length > 0 && visibleRows[0].kind === 'spacer') {
    start = Math.min(rows.length, start + 1);
    end = Math.min(rows.length, end + 1);
    visibleRows = rows.slice(start, end);
  }

  let stickyHeading: Row | null = null;
  if (visibleRows[0]?.kind !== 'heading') {
    for (let index = start; index >= 0; index -= 1) {
      if (rows[index]?.kind === 'heading') {
        stickyHeading = rows[index];
        break;
      }
    }
  }

  let displayRows = visibleRows;
  if (stickyHeading) {
    displayRows = [stickyHeading, ...visibleRows.slice(0, maxVisibleRows - 1)];
  }

  if (displayRows.length < maxVisibleRows) {
    const filler = Array.from({ length: maxVisibleRows - displayRows.length }, () => ({ kind: 'spacer' as const }));
    displayRows = [...displayRows, ...filler];
  }

  return (
    <Modal theme={theme} title="Settings" hint="Close: Esc or Left" height={modalHeight}>
      <Box flexDirection="column" height={listRows}>
        {displayRows.map((row, rowIndex) => {
          const key = `${row.kind}-${rowIndex}-${'label' in row ? row.label : ''}`;
          if (row.kind === 'spacer') {
            return (
              <Text key={key}> </Text>
            );
          }
          if (row.kind === 'heading') {
            return (
              <Text key={key} color={theme.colours.muted} underline>
                {row.label}
              </Text>
            );
          }

          const isSelected = row.index === selectedIndex;
          return (
            <Box key={key}>
              <Text color={isSelected ? theme.colours.accent : theme.colours.text}>
                {isSelected ? '> ' : '  '}
                {row.label} {row.isActive ? '(current)' : ''}
              </Text>
            </Box>
          );
        })}
      </Box>

      <Box marginTop={1}>
        <Text color={theme.colours.muted}>
          Press Enter to select.
        </Text>
      </Box>
    </Modal>
  );
};
