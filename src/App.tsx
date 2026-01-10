import React, { useEffect, useState } from 'react';
import { Box, Text, useInput, useApp, useStdout } from 'ink';
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
  const { stdout } = useStdout();
  const [totalRows, setTotalRows] = useState(() => stdout?.rows ?? process.stdout.rows ?? 24);

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
  const [spinnerIndex, setSpinnerIndex] = useState(0);
  const spinnerFrames = ['|', '/', '-', '\\'];

  const {
    currentNode,
    files,
    selectionIndex,
    sortBy,
    sortOrder,
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

  useEffect(() => {
    if (!loading) return;
    const timer = setInterval(() => {
      setSpinnerIndex((prev) => (prev + 1) % spinnerFrames.length);
    }, 120);

    return () => clearInterval(timer);
  }, [loading]);

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
    return (
      <Box height={totalRows} width="100%">
        <Text color="red">Error: {error}</Text>
      </Box>
    );
  }

  if (loading || !currentNode) {
    return (
      <Box height={totalRows} width="100%">
        <Text color={theme.colours.text}>
          Scanning {startPath}... {spinnerFrames[spinnerIndex]}
        </Text>
      </Box>
    );
  }

  if (view === ViewState.Settings) {
    return (
      <Box height={totalRows} width="100%" justifyContent="center" alignItems="flex-start">
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
      </Box>
    );
  }

  if (showConfirmDelete) {
      const selectedFile = files[selectionIndex];
      return (
          <Box flexDirection="column" height={totalRows} width="100%">
              <Header path={currentNode.path} theme={theme} />
              <Box flexGrow={1} justifyContent="center" alignItems="center">
                  <ConfirmDelete fileName={selectedFile?.name || 'item'} theme={theme} />
              </Box>
              <Footer
                totalSize={currentNode.size}
                itemCount={files.length}
                theme={theme}
                sortBy={sortBy}
                sortOrder={sortOrder}
                units={currentUnits}
              />
          </Box>
      );
  }

  const maxSize = files.reduce((max, f) => Math.max(max, f.size), 0);

  return (
    <Box flexDirection="column" height={totalRows} width="100%">
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

      <Footer
        totalSize={currentNode.size}
        itemCount={files.length}
        theme={theme}
        sortBy={sortBy}
        sortOrder={sortOrder}
        units={currentUnits}
      />
    </Box>
  );
};
