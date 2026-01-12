import React from 'react';
import { Box, Text, useInput } from 'ink';
import { Theme, themes } from '../themes.js';
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
  const themeNames = Object.keys(themes);
  const items: SettingItem[] = [
    ...themeNames.map(t => ({ type: 'theme' as const, value: t })),
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

  return (
    <Modal theme={theme} title="Settings" hint="Close: Esc or Left">
      <Box flexDirection="column">
        <Text color={theme.colours.header} underline>Themes:</Text>
        {items.filter(i => i.type === 'theme').map((item) => {
          const index = items.indexOf(item);
          const isSelected = index === selectedIndex;
          const isActive = item.value === currentTheme;
          return (
            <Box key={item.value}>
              <Text color={isSelected ? theme.colours.highlight : theme.colours.text}>
                {isSelected ? '> ' : '  '}
                {item.value} {isActive ? '(current)' : ''}
              </Text>
            </Box>
          );
        })}
      </Box>

      <Box marginTop={1} flexDirection="column">
        <Text color={theme.colours.header} underline>Units:</Text>
        {items.filter(i => i.type === 'units').map((item) => {
          const index = items.indexOf(item);
          const isSelected = index === selectedIndex;
          const isActive = item.value === currentUnits;
          const label = item.value === 'iec' ? 'IEC (KiB, GiB)' : 'SI (kB, GB)';
          return (
            <Box key={item.value}>
              <Text color={isSelected ? theme.colours.highlight : theme.colours.text}>
                {isSelected ? '> ' : '  '}
                {label} {isActive ? '(current)' : ''}
              </Text>
            </Box>
          );
        })}
      </Box>

      <Box marginTop={1} flexDirection="column">
        <Text color={theme.colours.header} underline>File type colours:</Text>
        {items.filter(i => i.type === 'fileTypeColours').map((item) => {
          const index = items.indexOf(item);
          const isSelected = index === selectedIndex;
          const isActive = (item.value === 'on') === fileTypeColoursEnabled;
          const label = item.value === 'on' ? 'On' : 'Off';
          return (
            <Box key={item.value}>
              <Text color={isSelected ? theme.colours.highlight : theme.colours.text}>
                {isSelected ? '> ' : '  '}
                {label} {isActive ? '(current)' : ''}
              </Text>
            </Box>
          );
        })}
      </Box>

      <Box marginTop={1} flexDirection="column">
        <Text color={theme.colours.header} underline>Heatmap colours:</Text>
        {items.filter(i => i.type === 'heatmap').map((item) => {
          const index = items.indexOf(item);
          const isSelected = index === selectedIndex;
          const isActive = (item.value === 'on') === heatmapEnabled;
          const label = item.value === 'on' ? 'On' : 'Off';
          return (
            <Box key={item.value}>
              <Text color={isSelected ? theme.colours.highlight : theme.colours.text}>
                {isSelected ? '> ' : '  '}
                {label} {isActive ? '(current)' : ''}
              </Text>
            </Box>
          );
        })}
      </Box>

      <Box marginTop={1}>
        <Text color={theme.colours.footer}>
          Press Enter to select.
        </Text>
      </Box>
    </Modal>
  );
};
