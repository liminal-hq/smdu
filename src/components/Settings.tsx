import React from 'react';
import { Box, Text, useInput } from 'ink';
import { Theme, themes } from '../themes.js';

interface SettingsProps {
  currentTheme: string;
  onSelectTheme: (themeName: string) => void;
  onBack: () => void;
  theme: Theme;
}

export const Settings: React.FC<SettingsProps> = ({
  currentTheme,
  onSelectTheme,
  onBack,
  theme,
}) => {
  const themeNames = Object.keys(themes);
  const [selectedIndex, setSelectedIndex] = React.useState(
    themeNames.indexOf(currentTheme) >= 0 ? themeNames.indexOf(currentTheme) : 0
  );

  useInput((input, key) => {
    if (key.upArrow || input === 'k') {
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : themeNames.length - 1));
    }
    if (key.downArrow || input === 'j') {
      setSelectedIndex((prev) => (prev < themeNames.length - 1 ? prev + 1 : 0));
    }
    if (key.return || input === ' ') {
      onSelectTheme(themeNames[selectedIndex]);
    }
    if (key.escape || input === 'q' || input === 'h' || key.leftArrow) {
      onBack();
    }
  });

  return (
    <Box flexDirection="column" padding={1} borderStyle="single" borderColor={theme.colours.header}>
      <Text bold underline color={theme.colours.header}>
        Settings - Select Theme
      </Text>
      <Box flexDirection="column" marginTop={1}>
        {themeNames.map((name, index) => {
          const isSelected = index === selectedIndex;
          const isActive = name === currentTheme;

          return (
            <Box key={name}>
              <Text color={isSelected ? theme.colours.highlight : theme.colours.text}>
                {isSelected ? '> ' : '  '}
                {name} {isActive ? '(current)' : ''}
              </Text>
            </Box>
          );
        })}
      </Box>
      <Box marginTop={1}>
        <Text color={theme.colours.footer}>
          Press Enter to select, Esc to go back.
        </Text>
      </Box>
    </Box>
  );
};
