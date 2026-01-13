import React, { useMemo } from 'react';
import { Box, Text, useStdout } from 'ink';
import { Theme, themeNames } from '../themes.js';
import { ACTIONS } from '../keys.js';
import { Modal } from './Modal.js';
import { useScrollableList } from '../hooks/useScrollableList.js';

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
  const modalHeight = Math.min(20, Math.max(12, totalRows - 4));
  const contentRows = Math.max(5, modalHeight - 6);

  const items = useMemo<SettingItem[]>(() => [
    ...themeNames.map((themeName) => ({ type: 'theme' as const, value: themeName })),
    { type: 'units' as const, value: 'iec' },
    { type: 'units' as const, value: 'si' },
    { type: 'fileTypeColours' as const, value: 'on' },
    { type: 'fileTypeColours' as const, value: 'off' },
    { type: 'heatmap' as const, value: 'on' },
    { type: 'heatmap' as const, value: 'off' },
  ], []);

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
      // Add empty line spacer
      rows.push({ kind: 'spacer' });
    }
    rows.push({ kind: 'heading', label: `${section.title}:` });
    section.items.forEach(({ item, index }) => {
      rows.push(toItemRow(item, index));
    });
  });

  // Map rows back to selectable indices
  // We need to know which row corresponds to which items index to handle scrolling correctly
  // Scrollable logic works on `items` index (0 to N-1). We need to map `selectedIndex` to `rowIndex`.

  const rowIndexMap = useMemo(() => {
    const map = new Map<number, number>();
    rows.forEach((row, rIndex) => {
        if (row.kind === 'item') {
            map.set(row.index, rIndex);
        }
    });
    return map;
  }, [rows]);

  const { selectedIndex, scrollOffset } = useScrollableList({
      itemsCount: items.length,
      height: contentRows,
      onClose: onBack,
      triggerAction: ACTIONS.SETTINGS,
      onSelect: (idx) => {
        const item = items[idx];
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
  });

  // Calculate visual start/end based on selectedIndex mapped to row index context...
  // Wait, useScrollableList manages scrollOffset based on *items*, not *rows* (including headers).
  // If we want to scroll the whole visual list including headers, we should treat the 'rows' as the scrollable items,
  // but only allow selecting the 'item' rows.
  // This is slightly more complex.
  // Let's stick to the previous simple logic where we ensure the selected item is in view, but using the hook.
  // Actually, the hook assumes a uniform list of selectable items.
  // Since we have headers, if we just use the hook for `selectedIndex` (logical index),
  // we might have headers off-screen or jumpy scrolling.
  // Given the complexity, maybe I should modify the hook to handle 'visual' indices vs 'logical' indices?
  // Or just reimplement the scrolling logic locally for Settings since it has headers/spacers.
  // The user asked to "Use shared scrolling logic... implementation plan said hook".
  // Let's define `itemsCount` as `rows.length` and handle `onSelect` only for valid rows.
  // But `itemsCount` in the hook drives `selectedIndex`. If `selectedIndex` lands on a header, that's bad.
  // I will make `useScrollableList` generic enough? No, standard list behavior is usually simple.

  // Alternative: Keep simple scrolling from before but cleaner, OR adapt the hook.
  // Let's use the hook for `selectedIndex` (logical items) and compute `visualOffset` manually as before,
  // basically just replacing the `useInput` and `offset` state part.
  // But the hook computes `scrollOffset` for logical items.

  // Let's adapt: logical index is what we care about for selection.
  // Visual scrolling should ensure the *row* corresponding to `selectedIndex` is visible.

  const selectedRowIndex = rowIndexMap.get(selectedIndex) ?? 0;

  // We need to calculate the view window.
  // Let's use a local ref for visual offset, driven by selectedRowIndex.

  // Wait, I can just use the same logic as before for visual offset, but use the hook for navigation/key handling.
  // The hook gives `selectedIndex`.

  const safeContentRows = Math.max(1, contentRows);

  // Logic from previous implementation, wrapped in a useMemo or just render-time calc
  // We need to persist visual offset.
  // Since this is a specialized list (with headers), the generic hook might be slightly limiting if it enforces scrollOffset.
  // I'll ignore the hook's `scrollOffset` and compute my own visual offset based on `selectedIndex` from hook.

  // BUT the hook handles `PageUp/Down`? The hook I wrote in `useScrollableList.ts` only handles Arrow keys.
  // So it's fine.

  // I need to use state for visualOffset to avoid it resetting or jumping weirdly?
  // Actually, deriving it from selectedRowIndex is deterministic if we just want "keep in view".

  // Let's create a Helper to keep `selectedRowIndex` in view.
  // We CANNOT access `ref` during render to read previous value easily without `useRef`.
  // So I'll use a `useRef` to store `visualOffset`.

  // Note: I cannot use `useRef` inside the render function body for conditional logic in a way that violates rules, but here it is fine.

  // However, I need to force re-render if I change the ref? No, `selectedIndex` change triggers re-render.
  // Inside render, I update the ref if needed.

  const visualOffsetRef = React.useRef(0);

  if (selectedRowIndex < visualOffsetRef.current) {
      visualOffsetRef.current = selectedRowIndex;
  } else if (selectedRowIndex >= visualOffsetRef.current + safeContentRows) {
      visualOffsetRef.current = selectedRowIndex - safeContentRows + 1;
  }

  const maxVisualScroll = Math.max(0, rows.length - safeContentRows);
  visualOffsetRef.current = Math.min(visualOffsetRef.current, maxVisualScroll);

  const visibleRows = rows.slice(visualOffsetRef.current, visualOffsetRef.current + safeContentRows);

  let stickyHeading: Row | null = null;
  if (visibleRows[0]?.kind !== 'heading') {
    for (let index = visualOffsetRef.current; index >= 0; index -= 1) {
      if (rows[index]?.kind === 'heading') {
        stickyHeading = rows[index];
        break;
      }
    }
  }

  let displayRows = visibleRows;
  if (stickyHeading) {
    displayRows = [stickyHeading, ...visibleRows.slice(0, safeContentRows - 1)];
  }

  // Fill with spacers if needed
  if (displayRows.length < safeContentRows) {
      const filler = Array.from({ length: safeContentRows - displayRows.length }, () => ({ kind: 'spacer' as const }));
      displayRows = [...displayRows, ...filler];
  }

  return (
    <Modal theme={theme} title="Settings" hint="" triggerKey="S" height={modalHeight}>
      <Box flexDirection="column" height={safeContentRows}>
        {displayRows.map((row, rowIndex) => {
          const key = `${row.kind}-${rowIndex}-${'label' in row ? row.label : ''}`;
          if (row.kind === 'spacer') {
            return (
              <Box key={key} height={1} />
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

