import React, { useEffect, useState } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import { Header } from './components/Header.js';
import { Footer } from './components/Footer.js';
import { FileList } from './components/FileList.js';
import { ConfirmDelete } from './components/ConfirmDelete.js';
import { Settings } from './components/Settings.js';
import { useFileSystem } from './state.js';
import { getTheme } from './themes.js';
import { getThemeFromConfig, setThemeInConfig, getUnitsFromConfig, setUnitsInConfig } from './config.js';
import { scanDirectory, FileNode } from './scanner.js';
import { ACTIONS, checkInput } from './keys.js';
import path from 'path';

interface AppProps {
  startPath: string;
  themeName?: string; // Flag overrides config
  units?: string; // Flag overrides config
}

enum ViewState {
  FileList = 'filelist',
  Settings = 'settings',
}

export const App: React.FC<AppProps> = ({ startPath, themeName: initialThemeName, units: initialUnits }) => {
  const { exit } = useApp();

  // Determine initial theme: CLI arg > Config > Default
  const configTheme = getThemeFromConfig();
  const [currentThemeName, setCurrentThemeName] = useState(initialThemeName !== 'default' ? initialThemeName : configTheme);
  const theme = getTheme(currentThemeName || 'default');

  // Determine initial units
  const configUnits = getUnitsFromConfig();
  const [currentUnits, setCurrentUnits] = useState<'iec' | 'si'>(
    (initialUnits === 'iec' || initialUnits === 'si') ? initialUnits : configUnits
  );

  const [view, setView] = useState<ViewState>(ViewState.FileList);
  const [loading, setLoading] = useState(true);
  const [rootNode, setRootNode] = useState<FileNode | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    currentNode,
    files,
    selectionIndex,
    moveSelection,
    enterDirectory,
    goUp,
    toggleSort,
    deleteSelected,
  } = useFileSystem(rootNode);

  useEffect(() => {
    const runScan = async () => {
      try {
        const absolutePath = path.resolve(startPath);
        const root = await scanDirectory(absolutePath);
        setRootNode(root);
        setLoading(false);
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    };
    runScan();
  }, [startPath]);

  useInput((input, key) => {
    if (loading) return;

    // If Settings is active, input is handled by Settings component usually,
    // but here we are mounting components conditionally.
    // However, useInput runs even if component is not rendering? No, only mounted components.
    // But App is always mounted. So we must gate input based on View.
    if (view === ViewState.Settings) return;

    if (showConfirmDelete) {
      if (checkInput(input, key, ACTIONS.CONFIRM)) {
        deleteSelected();
        setShowConfirmDelete(false);
      } else {
        setShowConfirmDelete(false);
      }
      return;
    }

    if (checkInput(input, key, ACTIONS.SETTINGS)) {
      setView(ViewState.Settings);
      return;
    }

    if (checkInput(input, key, ACTIONS.QUIT)) {
      exit();
      return;
    }

    if (checkInput(input, key, ACTIONS.MOVE_UP)) {
      moveSelection(-1);
    }

    if (checkInput(input, key, ACTIONS.MOVE_DOWN)) {
      moveSelection(1);
    }

    if (checkInput(input, key, ACTIONS.MOVE_RIGHT)) {
      enterDirectory();
    }

    if (checkInput(input, key, ACTIONS.MOVE_LEFT)) {
      goUp();
    }

    if (checkInput(input, key, ACTIONS.DELETE)) {
        if (files[selectionIndex]) {
            setShowConfirmDelete(true);
        }
    }

    if (checkInput(input, key, ACTIONS.SORT_NAME)) toggleSort('name');
    if (checkInput(input, key, ACTIONS.SORT_SIZE)) toggleSort('size');
  });

  if (error) {
    return <Text color="red">Error: {error}</Text>;
  }

  if (loading || !currentNode) {
    return <Text color={theme.colours.text}>Scanning {startPath}...</Text>;
  }

  if (view === ViewState.Settings) {
    return (
      <Settings
        currentTheme={currentThemeName || 'default'}
        currentUnits={currentUnits}
        theme={theme}
        onSelectTheme={(name) => {
          setCurrentThemeName(name);
          setThemeInConfig(name);
        }}
        onSelectUnits={(units) => {
          setCurrentUnits(units);
          setUnitsInConfig(units);
        }}
        onBack={() => setView(ViewState.FileList)}
      />
    );
  }

  if (showConfirmDelete) {
      const selectedFile = files[selectionIndex];
      return (
          <Box flexDirection="column" height="100%">
              <Header path={currentNode.path} theme={theme} />
              <Box flexGrow={1} justifyContent="center" alignItems="center">
                  <ConfirmDelete fileName={selectedFile?.name || 'item'} theme={theme} />
              </Box>
              <Footer totalSize={currentNode.size} itemCount={files.length} theme={theme} />
          </Box>
      );
  }

  const maxSize = files.reduce((max, f) => Math.max(max, f.size), 0);

  return (
    <Box flexDirection="column" height="100%">
      <Header path={currentNode.path} theme={theme} />

      <Box flexGrow={1} overflowY="hidden">
        <FileList
            files={files}
            selectedIndex={selectionIndex}
            maxSize={maxSize}
            theme={theme}
            units={currentUnits}
        />
      </Box>

      <Footer totalSize={currentNode.size} itemCount={files.length} theme={theme} />
    </Box>
  );
};
