import React, { useMemo } from 'react';
import { Box, Text, useStdout } from 'ink';
import { Theme } from '../themes.js';
import { ACTIONS, HELP_ITEMS } from '../keys.js';
import { Modal } from './Modal.js';
import { useScrollableList } from '../hooks/useScrollableList.js';

interface HelpModalProps {
  theme: Theme;
  onBack?: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ theme, onBack }) => {
  const { stdout } = useStdout();
  const totalColumns = stdout?.columns ?? process.stdout.columns ?? 80;
  const totalRows = stdout?.rows ?? process.stdout.rows ?? 24;
  const modalWidth = Math.min(72, Math.max(40, totalColumns - 6));
  const modalHeight = Math.min(22, Math.max(12, totalRows - 4));
  const contentRows = Math.max(5, modalHeight - 6);
  const labelWidth = Math.max(18, Math.floor(modalWidth * 0.55));
  const keyWidth = Math.max(12, modalWidth - labelWidth - 4);

  // Group items
  const sections = useMemo(() => {
    const navigation = ['Move selection', 'Enter directory', 'Go up', 'Quit'];
    const view = ['Sort by name', 'Sort by size', 'Toggle view mode', 'Toggle hidden files', 'Toggle legend', 'Toggle heatmap', 'Toggle status panel', 'Rescan'];
    const actions = ['Delete item', 'Information panel', 'Settings'];
    const timer = ['Start focus timer', 'Toggle focus timer display', 'Cancel focus timer'];
    // Catch-all for others
    const categorized = new Set([...navigation, ...view, ...actions, ...timer]);

    const getItems = (labels: string[]) => HELP_ITEMS.filter(item => labels.includes(item.label));
    const others = HELP_ITEMS.filter(item => !categorized.has(item.label) && item.label !== 'Help');

    return [
      { title: 'Navigation', items: getItems(navigation) },
      { title: 'View & Display', items: getItems(view) },
      { title: 'Actions', items: getItems(actions) },
      { title: 'Timer', items: getItems(timer) },
      { title: 'Other', items: others },
    ].filter(s => s.items.length > 0);
  }, []);

  // Flatten for scrolling
  type FlatItem =
    | { kind: 'header', title: string }
    | { kind: 'item', label: string, keys: string };

  const flatList = useMemo(() => {
    const list: FlatItem[] = [];
    sections.forEach(section => {
      // Small optimization: don't add spacer at very top
      if (list.length > 0) list.push({ kind: 'item', label: '', keys: '' }); // spacer
      list.push({ kind: 'header', title: section.title });
      section.items.forEach(item => {
        list.push({ kind: 'item', label: item.label, keys: item.keys });
      });
    });
    return list;
  }, [sections]);

  // We only want to scroll through actual items for selection?
  // Unlike Settings, Help is read-only. We just want to scroll the VIEW.
  // The useScrollableList is built for selection.
  // But we can use it to drive the scroll offset.
  // We can treat every line as a selectable item (even headers) just to allow scrolling through everything.

  const { selectedIndex } = useScrollableList({
      itemsCount: flatList.length,
      height: contentRows,
      onClose: onBack,
      triggerAction: ACTIONS.HELP,
  });

  // Calculate visual offset to keep selectedIndex in view
  const visualOffsetRef = React.useRef(0);
  const safeContentRows = Math.max(1, contentRows);

  if (selectedIndex < visualOffsetRef.current) {
      visualOffsetRef.current = selectedIndex;
  } else if (selectedIndex >= visualOffsetRef.current + safeContentRows) {
      visualOffsetRef.current = selectedIndex - safeContentRows + 1;
  }

  const maxVisualScroll = Math.max(0, flatList.length - safeContentRows);
  visualOffsetRef.current = Math.min(visualOffsetRef.current, maxVisualScroll);

  const visibleItems = flatList.slice(visualOffsetRef.current, visualOffsetRef.current + safeContentRows);

  return (
    <Modal
      theme={theme}
      title="Help"
      hint=""
      triggerKey="?"
      width={modalWidth}
      height={modalHeight}
    >
      <Box flexDirection="column" height={safeContentRows}>
        {visibleItems.map((item, index) => {
          // Use a key relative to visual slice to ensure stability or just unique content
          const uniqueKey = `${item.kind}-${index}-${'title' in item ? item.title : item.label}`;

          if (item.kind === 'header') {
             return (
                 <Text key={uniqueKey} color={theme.colours.muted} underline bold>
                     {item.title}:
                 </Text>
             );
          }

          if (item.label === '') {
              return <Text key={uniqueKey}> </Text>;
          }

          // Use selectedIndex to highlight current line?
          // For a passive help modal, highlighting isn't strictly necessary but helps show where you are.
          const globalIndex = visualOffsetRef.current + index;
          const isSelected = globalIndex === selectedIndex;

          return (
            <Box key={uniqueKey} width="100%">
              <Box width={labelWidth}>
                <Text color={isSelected ? theme.colours.accent : theme.colours.muted} wrap="truncate-end">
                    {isSelected ? '> ' : '  '}
                    {item.label}
                </Text>
              </Box>
              <Box width={keyWidth}>
                <Text color={isSelected ? theme.colours.accent : theme.colours.text} wrap="truncate-end">
                    {item.keys}
                </Text>
              </Box>
            </Box>
          );
        })}
      </Box>
       <Box marginTop={1}>
        <Text color={theme.colours.muted}>
          Use Arrow keys to scroll.
        </Text>
      </Box>
    </Modal>
  );
};
