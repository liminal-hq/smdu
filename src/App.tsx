import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Box, Text, useInput, useApp, useStdout } from 'ink';
import { Header } from './components/Header.js';
import { Footer } from './components/Footer.js';
import { FileList } from './components/FileList.js';
import { ConfirmDelete } from './components/ConfirmDelete.js';
import { Settings } from './components/Settings.js';
import { HelpModal } from './components/HelpModal.js';
import { useFileSystem } from './state.js';
import { getTheme } from './themes.js';
import { getThemeFromConfig, setThemeInConfig, getUnitsFromConfig, setUnitsInConfig } from './config.js';
import { scanDirectory, FileNode, ScanProgress, ScanCancelledError } from './scanner.js';
import { ACTIONS, checkInput } from './keys.js';
import path from 'path';
import { filesize } from 'filesize';

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
  const [showHelp, setShowHelp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [spinnerIndex, setSpinnerIndex] = useState(0);
  const spinnerFrames = ['|', '/', '-', '\\'];
  const [scanStatus, setScanStatus] = useState<ScanProgress>({
    currentPath: startPath,
    directories: 0,
    files: 0,
    bytes: 0,
    errors: 0,
  });
  const lastProgressUpdateRef = useRef(0);
  const scanAbortRef = useRef<AbortController | null>(null);

  const {
    currentNode,
    files,
    selectionIndex,
    sortBy,
    sortOrder,
    viewMode,
    moveSelection,
    enterDirectory,
    goUp,
    toggleSort,
    toggleViewMode,
    deleteSelected,
  } = useFileSystem(rootNode);

  const handleScanProgress = useCallback((progress: ScanProgress) => {
    const now = Date.now();
    if (now - lastProgressUpdateRef.current < 80) return;
    lastProgressUpdateRef.current = now;
    setScanStatus({ ...progress });
  }, []);

  useEffect(() => {
    const runScan = async () => {
      try {
        const absolutePath = path.resolve(startPath);
        const controller = new AbortController();
        scanAbortRef.current = controller;
        const progressState: ScanProgress = {
          currentPath: absolutePath,
          directories: 0,
          files: 0,
          bytes: 0,
          errors: 0,
        };
        setScanStatus(progressState);
        const root = await scanDirectory(absolutePath, undefined, handleScanProgress, progressState, controller.signal);
        setRootNode(root);
        setLoading(false);
      } catch (err: any) {
        if (err instanceof ScanCancelledError) {
          setLoading(false);
          exit();
          return;
        }
        setError(err.message);
        setLoading(false);
      }
    };
    runScan();
    return () => {
      scanAbortRef.current?.abort();
    };
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
    if (showHelp) {
      if (checkInput(input, key, ACTIONS.HELP) || key.escape) {
        setShowHelp(false);
      }
      return;
    }

    if (checkInput(input, key, ACTIONS.HELP)) {
      setShowHelp(true);
      return;
    }

    if (loading) {
      if (checkInput(input, key, ACTIONS.QUIT)) {
        scanAbortRef.current?.abort();
        exit();
      }
      return;
    }

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
    if (checkInput(input, key, ACTIONS.VIEW_MODE)) toggleViewMode();
  });

  const helpOverlay = showHelp ? <HelpModal theme={theme} /> : null;
  const settingsOverlay = view === ViewState.Settings ? (
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
  ) : null;

  if (error) {
    return (
      <Box height={totalRows} width="100%">
        <Text color="red">Error: {error}</Text>
      </Box>
    );
  }

  if (loading || !currentNode) {
    const sizeLabel = currentUnits === 'si'
      ? filesize(scanStatus.bytes, { base: 10, standard: 'si', output: 'string' })
      : filesize(scanStatus.bytes, { base: 2, standard: 'iec', output: 'string' });

    return (
      <Box height={totalRows} width="100%" flexDirection="column">
        <Header
          path={startPath}
          theme={theme}
          sortBy={sortBy}
          sortOrder={sortOrder}
          viewMode={viewMode}
        />
        <Box flexGrow={1} paddingX={1} paddingY={1} borderStyle="single">
          <Box flexDirection="column">
            <Text color={theme.colours.text}>
              Scanning {startPath}... {spinnerFrames[spinnerIndex]}
            </Text>
            <Text color={theme.colours.text} wrap="truncate-end">
              Current: {scanStatus.currentPath}
            </Text>
            <Text color={theme.colours.text}>
              Progress: {scanStatus.directories} directories, {scanStatus.files} files, {sizeLabel}
            </Text>
            {scanStatus.errors > 0 ? (
              <Text color="yellow">Errors: {scanStatus.errors}</Text>
            ) : null}
          </Box>
        </Box>
        <Footer
          totalSize={scanStatus.bytes}
          itemCount={scanStatus.files}
          theme={theme}
          units={currentUnits}
        />
        {helpOverlay}
        {settingsOverlay}
      </Box>
    );
  }

  if (showConfirmDelete) {
      const selectedFile = files[selectionIndex];
      return (
          <Box flexDirection="column" height={totalRows} width="100%">
              <Header
                path={currentNode.path}
                theme={theme}
                sortBy={sortBy}
                sortOrder={sortOrder}
                viewMode={viewMode}
              />
              <Box flexGrow={1} justifyContent="center" alignItems="center">
                  <ConfirmDelete fileName={selectedFile?.name || 'item'} theme={theme} />
              </Box>
              <Footer
                totalSize={currentNode.size}
                itemCount={files.length}
                theme={theme}
                units={currentUnits}
              />
              {helpOverlay}
              {settingsOverlay}
          </Box>
      );
  }

  const maxSize = files.reduce((max, f) => Math.max(max, f.size), 0);
  return (
    <Box flexDirection="column" height={totalRows} width="100%">
      <Header
        path={currentNode.path}
        theme={theme}
        sortBy={sortBy}
        sortOrder={sortOrder}
        viewMode={viewMode}
      />

      <Box flexGrow={1} overflowY="hidden">
        <FileList
            files={files}
            selectedIndex={selectionIndex}
            maxSize={maxSize}
            theme={theme}
            units={currentUnits}
            viewMode={viewMode}
            rootPath={currentNode.path}
            scanRootPath={rootNode?.path ?? currentNode.path}
        />
      </Box>

      <Footer
        totalSize={currentNode.size}
        itemCount={files.length}
        theme={theme}
        units={currentUnits}
      />
      {helpOverlay}
      {settingsOverlay}
    </Box>
  );
};
