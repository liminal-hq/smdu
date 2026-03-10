// Main Ink application container for scan state, navigation, and overlays
//
// (c) Copyright 2026 Liminal HQ, Scott Morris
// SPDX-License-Identifier: MIT

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Box, Text, useInput, useApp, useStdout } from 'ink';
import { Header } from './components/Header.js';
import { Footer } from './components/Footer.js';
import { FileList } from './components/FileList.js';
import { ConfirmDelete } from './components/ConfirmDelete.js';
import { Settings } from './components/Settings.js';
import { HelpModal } from './components/HelpModal.js';
import { InfoModal } from './components/InfoModal.js';
import { ScanStatus } from './components/ScanStatus.js';
import { StatusPanel } from './components/StatusPanel.js';
import { TimerStatus } from './components/TimerStatus.js';
import { ReviewList } from './components/ReviewList.js';
import { ReviewToolbar } from './components/ReviewToolbar.js';
import { ReviewFiltersModal } from './components/ReviewFiltersModal.js';
import { useFileSystem } from './state.js';
import { getTheme } from './themes.js';
import {
	getThemeFromConfig,
	setThemeInConfig,
	getUnitsFromConfig,
	setUnitsInConfig,
	getFileTypeColoursEnabledFromConfig,
	setFileTypeColoursEnabledInConfig,
	getShowHiddenFilesFromConfig,
	setShowHiddenFilesInConfig,
	getHeatmapEnabledFromConfig,
	setHeatmapEnabledInConfig,
} from './config.js';
import { scanDirectory, FileNode, ScanProgress, ScanCancelledError } from './scanner.js';
import { ACTIONS, checkInput } from './keys.js';
import path from 'path';
import fs from 'fs';
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

interface SelectedFileMetadata {
	mode?: number;
	birthtime?: Date;
	mtime?: Date;
	isSymbolicLink?: boolean;
	isBrokenSymbolicLink?: boolean;
	linkTarget?: string;
	linkError?: string;
}

const TIMER_MINUTES = [5, 10, 15, 30];

export const App: React.FC<AppProps> = ({
	startPath,
	themeName: initialThemeName,
	units: initialUnits,
}) => {
	const { exit } = useApp();
	const { stdout } = useStdout();
	const [totalRows, setTotalRows] = useState(() => stdout?.rows ?? process.stdout.rows ?? 24);
	const [totalColumns, setTotalColumns] = useState(
		() => stdout?.columns ?? process.stdout.columns ?? 80,
	);

	// Determine initial theme: CLI arg > Config > Default
	const configTheme = getThemeFromConfig();
	const [currentThemeName, setCurrentThemeName] = useState(initialThemeName ?? configTheme);
	const theme = getTheme(currentThemeName || 'default');

	// Determine initial units
	const configUnits = getUnitsFromConfig();
	const [currentUnits, setCurrentUnits] = useState<'iec' | 'si'>(
		initialUnits === 'iec' || initialUnits === 'si' ? initialUnits : configUnits,
	);
	const configFileTypeColoursEnabled = getFileTypeColoursEnabledFromConfig();
	const [fileTypeColoursEnabled, setFileTypeColoursEnabled] = useState(
		configFileTypeColoursEnabled,
	);
	const configShowHiddenFiles = getShowHiddenFilesFromConfig();
	const [showHiddenFiles, setShowHiddenFiles] = useState(configShowHiddenFiles);
	const configHeatmapEnabled = getHeatmapEnabledFromConfig();
	const [heatmapEnabled, setHeatmapEnabled] = useState(configHeatmapEnabled);

	const [view, setView] = useState<ViewState>(ViewState.FileList);
	const [loading, setLoading] = useState(true);
	const [isScanning, setIsScanning] = useState(true);
	const [rootNode, setRootNode] = useState<FileNode | null>(null);
	const [showConfirmDelete, setShowConfirmDelete] = useState(false);
	const [showHelp, setShowHelp] = useState(false);
	const [showInfo, setShowInfo] = useState(false);
	const [showReviewFilters, setShowReviewFilters] = useState(false);
	const [showLegend, setShowLegend] = useState(false);
	const [showStatusPanel, setShowStatusPanel] = useState(false);
	const [showTimerStatus, setShowTimerStatus] = useState(false);
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
	const rootNodeRef = useRef<FileNode | null>(null);
	const pendingRootRef = useRef<FileNode | null>(null);
	const partialUpdateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const timerAlertedRef = useRef(false);

	const [, setTimerIndex] = useState(-1);
	const [timerState, setTimerState] = useState({
		status: 'idle' as 'idle' | 'running' | 'completed',
		durationSeconds: 0,
		remainingSeconds: 0,
		endsAt: 0,
	});
	const [timerStats, setTimerStats] = useState({
		deletedItems: 0,
		freedBytes: 0,
	});
	const [selectedFileMetadata, setSelectedFileMetadata] = useState<SelectedFileMetadata | null>(
		null,
	);
	const [selectedFileMetadataLoading, setSelectedFileMetadataLoading] = useState(false);

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
		selectedNode,
		entryPointPath,
		reviewState,
		reviewEntries,
		reviewVisibleRows,
		cycleReviewPreset,
		cycleReviewGroup,
		cycleReviewScope,
		cycleReviewMinSize,
		cycleReviewAgeBucket,
		toggleReviewMediaOnly,
		toggleReviewIncludeHidden,
		resetReviewFilters,
		toggleReviewGroupExpanded,
		openSelectedInFlat,
		openSelectedInTree,
		cycleReviewSort,
	} = useFileSystem(rootNode, showHiddenFiles);

	const formatSize = useCallback(
		(bytes: number) => {
			return currentUnits === 'si'
				? filesize(bytes, { base: 10, standard: 'si', output: 'string' })
				: filesize(bytes, { base: 2, standard: 'iec', output: 'string' });
		},
		[currentUnits],
	);

	const updateRootNode = useCallback((root: FileNode) => {
		rootNodeRef.current = root;
		setRootNode({ ...root });
	}, []);

	const startTimer = useCallback((durationMinutes: number) => {
		const durationSeconds = durationMinutes * 60;
		setTimerState({
			status: 'running',
			durationSeconds,
			remainingSeconds: durationSeconds,
			endsAt: Date.now() + durationSeconds * 1000,
		});
		setTimerStats({
			deletedItems: 0,
			freedBytes: 0,
		});
		timerAlertedRef.current = false;
		setShowTimerStatus(true);
	}, []);

	const handleScanProgress = useCallback((progress: ScanProgress) => {
		const now = Date.now();
		if (now - lastProgressUpdateRef.current < 80) return;
		lastProgressUpdateRef.current = now;
		setScanStatus({ ...progress });
	}, []);

	const handlePartialUpdate = useCallback(
		(root: FileNode) => {
			if (!rootNodeRef.current) {
				setLoading(false);
				updateRootNode(root);
				return;
			}

			pendingRootRef.current = root;
			if (partialUpdateTimerRef.current) return;

			partialUpdateTimerRef.current = setTimeout(() => {
				if (pendingRootRef.current) {
					updateRootNode(pendingRootRef.current);
				}
				partialUpdateTimerRef.current = null;
			}, 100);
		},
		[updateRootNode],
	);

	const scanRef = useCallback(() => {
		const runScan = async () => {
			try {
				const absolutePath = path.resolve(startPath);
				const controller = new AbortController();
				scanAbortRef.current = controller;
				setIsScanning(true);
				setLoading(true);
				rootNodeRef.current = null;
				setRootNode(null); // Release memory of old tree immediately
				// Allow a small delay for state update and potential GC
				await new Promise((resolve) => setTimeout(resolve, 50));
				const progressState: ScanProgress = {
					currentPath: absolutePath,
					directories: 0,
					files: 0,
					bytes: 0,
					errors: 0,
				};
				setScanStatus(progressState);
				const root = await scanDirectory(
					absolutePath,
					undefined,
					handleScanProgress,
					progressState,
					controller.signal,
					handlePartialUpdate,
				);
				if (partialUpdateTimerRef.current) {
					clearTimeout(partialUpdateTimerRef.current);
					partialUpdateTimerRef.current = null;
				}
				pendingRootRef.current = null;
				updateRootNode(root);
				setLoading(false);
				setIsScanning(false);
			} catch (err) {
				if (err instanceof ScanCancelledError) {
					setLoading(false);
					setIsScanning(false);
					exit();
					return;
				}
				const message = err instanceof Error ? err.message : String(err);
				setError(message);
				setLoading(false);
				setIsScanning(false);
			}
		};
		runScan();
	}, [startPath, exit, handleScanProgress, handlePartialUpdate, updateRootNode]);

	useEffect(() => {
		scanRef();
		return () => {
			scanAbortRef.current?.abort();
			if (partialUpdateTimerRef.current) {
				clearTimeout(partialUpdateTimerRef.current);
				partialUpdateTimerRef.current = null;
			}
		};
	}, [scanRef]);

	useEffect(() => {
		if (!isScanning) return;
		const timer = setInterval(() => {
			setSpinnerIndex((prev) => (prev + 1) % spinnerFrames.length);
		}, 120);

		return () => clearInterval(timer);
	}, [isScanning]);

	useEffect(() => {
		if (timerState.status !== 'running') return;
		const tick = () => {
			const remainingSeconds = Math.max(0, Math.ceil((timerState.endsAt - Date.now()) / 1000));
			setTimerState((prev) => {
				if (prev.status !== 'running') return prev;
				if (remainingSeconds <= 0) {
					return {
						...prev,
						status: 'completed',
						remainingSeconds: 0,
					};
				}
				return {
					...prev,
					remainingSeconds,
				};
			});
		};
		tick();
		const timer = setInterval(tick, 1000);
		return () => clearInterval(timer);
	}, [timerState.endsAt, timerState.status]);

	useEffect(() => {
		if (timerState.status !== 'completed' || timerAlertedRef.current) return;
		if (process.stdout.isTTY) {
			process.stdout.write('\u0007');
		}
		timerAlertedRef.current = true;
	}, [timerState.status]);

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

	const selectedFile = selectedNode;

	useEffect(() => {
		if (!selectedFile) {
			setSelectedFileMetadata(null);
			setSelectedFileMetadataLoading(false);
			return;
		}
		let cancelled = false;
		const loadMetadata = async () => {
			setSelectedFileMetadataLoading(true);
			const fallbackMetadata: SelectedFileMetadata = {
				mode: selectedFile.mode,
				birthtime: selectedFile.birthtime,
				mtime: selectedFile.mtime,
				isSymbolicLink: selectedFile.isSymbolicLink,
				isBrokenSymbolicLink: selectedFile.isBrokenSymbolicLink,
				linkTarget: selectedFile.linkTarget,
				linkError: selectedFile.linkError,
			};
			try {
				const stats = await fs.promises.lstat(selectedFile.path);
				let linkTarget = selectedFile.linkTarget;
				let linkError = selectedFile.linkError;
				let isBrokenSymbolicLink = Boolean(selectedFile.isBrokenSymbolicLink);
				if (stats.isSymbolicLink()) {
					try {
						linkTarget = await fs.promises.readlink(selectedFile.path);
						linkError = undefined;
						isBrokenSymbolicLink = false;
					} catch (error) {
						isBrokenSymbolicLink = true;
						linkTarget = undefined;
						linkError = error instanceof Error ? error.message : String(error);
					}
				}
				if (!cancelled) {
					setSelectedFileMetadata({
						mode: stats.mode,
						birthtime: stats.birthtime,
						mtime: stats.mtime,
						isSymbolicLink: stats.isSymbolicLink(),
						isBrokenSymbolicLink,
						linkTarget,
						linkError,
					});
				}
			} catch {
				if (!cancelled) {
					setSelectedFileMetadata(fallbackMetadata);
				}
			} finally {
				if (!cancelled) {
					setSelectedFileMetadataLoading(false);
				}
			}
		};
		void loadMetadata();
		return () => {
			cancelled = true;
		};
	}, [selectedFile]);

	useInput((input, key) => {
		if (showHelp) {
			if (checkInput(input, key, ACTIONS.HELP) || key.escape) {
				setShowHelp(false);
			}
			return;
		}

		if (showInfo) {
			if (checkInput(input, key, ACTIONS.INFO) || key.escape) {
				setShowInfo(false);
			}
			return;
		}

		if (showReviewFilters) {
			if (checkInput(input, key, ACTIONS.REVIEW_FILTERS) || key.escape) {
				setShowReviewFilters(false);
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
				void deleteSelected().then((deletedNode) => {
					if (!deletedNode) return;
					if (timerState.status === 'running') {
						setTimerStats((prev) => ({
							deletedItems: prev.deletedItems + 1,
							freedBytes: prev.freedBytes + deletedNode.size,
						}));
					}
				});
				setShowConfirmDelete(false);
			} else {
				setShowConfirmDelete(false);
			}
			return;
		}

		if (checkInput(input, key, ACTIONS.INFO)) {
			if (selectedFile) {
				setShowInfo(true);
			}
			return;
		}

		if (viewMode === 'review' && checkInput(input, key, ACTIONS.REVIEW_FILTERS)) {
			setShowReviewFilters(true);
			return;
		}

		if (checkInput(input, key, ACTIONS.LEGEND)) {
			setShowLegend((prev) => !prev);
			return;
		}

		if (checkInput(input, key, ACTIONS.HEATMAP)) {
			setHeatmapEnabled((prev) => {
				const next = !prev;
				setHeatmapEnabledInConfig(next);
				return next;
			});
			return;
		}

		if (checkInput(input, key, ACTIONS.STATUS_PANEL)) {
			setShowStatusPanel((prev) => !prev);
			return;
		}

		if (checkInput(input, key, ACTIONS.TIMER_TOGGLE)) {
			setShowTimerStatus((prev) => !prev);
			return;
		}

		if (checkInput(input, key, ACTIONS.TIMER_CANCEL)) {
			if (timerState.status !== 'idle') {
				setTimerState({
					status: 'idle',
					durationSeconds: 0,
					remainingSeconds: 0,
					endsAt: 0,
				});
				setTimerIndex(-1);
				setTimerStats({
					deletedItems: 0,
					freedBytes: 0,
				});
				timerAlertedRef.current = false;
			}
			return;
		}

		if (checkInput(input, key, ACTIONS.SETTINGS)) {
			setView(ViewState.Settings);
			return;
		}

		if (checkInput(input, key, ACTIONS.TIMER)) {
			setTimerIndex((prev) => {
				const nextIndex = (prev + 1) % TIMER_MINUTES.length;
				startTimer(TIMER_MINUTES[nextIndex]);
				return nextIndex;
			});
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
			if (selectedFile) {
				setShowConfirmDelete(true);
			}
		}

		if (viewMode === 'review') {
			if (
				checkInput(input, key, ACTIONS.SORT_NAME) ||
				checkInput(input, key, ACTIONS.SORT_SIZE) ||
				checkInput(input, key, ACTIONS.SORT_COUNT)
			) {
				cycleReviewSort();
			}
		} else {
			if (checkInput(input, key, ACTIONS.SORT_NAME)) toggleSort('name');
			if (checkInput(input, key, ACTIONS.SORT_SIZE)) toggleSort('size');
			if (checkInput(input, key, ACTIONS.SORT_COUNT)) toggleSort('count');
		}
		if (checkInput(input, key, ACTIONS.VIEW_MODE)) toggleViewMode();
		if (checkInput(input, key, ACTIONS.TOGGLE_HIDDEN)) {
			if (viewMode === 'review') {
				toggleReviewIncludeHidden();
			} else {
				setShowHiddenFiles((prev) => {
					const next = !prev;
					setShowHiddenFilesInConfig(next);
					return next;
				});
			}
		}

		if (viewMode === 'review' && checkInput(input, key, ACTIONS.REVIEW_PRESET_NEXT)) {
			cycleReviewPreset();
		}

		if (viewMode === 'review' && checkInput(input, key, ACTIONS.REVIEW_GROUP_NEXT)) {
			cycleReviewGroup();
		}

		if (viewMode === 'review' && checkInput(input, key, ACTIONS.REVIEW_GROUP_TOGGLE)) {
			toggleReviewGroupExpanded();
		}

		if (viewMode === 'review' && checkInput(input, key, ACTIONS.REVIEW_SCOPE_CYCLE)) {
			cycleReviewScope();
		}

		if (viewMode === 'review' && checkInput(input, key, ACTIONS.REVIEW_MIN_SIZE_CYCLE)) {
			cycleReviewMinSize();
		}

		if (viewMode === 'review' && checkInput(input, key, ACTIONS.REVIEW_AGE_BUCKET_CYCLE)) {
			cycleReviewAgeBucket();
		}

		if (viewMode === 'review' && checkInput(input, key, ACTIONS.REVIEW_MEDIA_TOGGLE)) {
			toggleReviewMediaOnly();
		}

		if (viewMode === 'review' && checkInput(input, key, ACTIONS.OPEN_IN_FLAT)) {
			openSelectedInFlat();
		}

		if (viewMode === 'review' && checkInput(input, key, ACTIONS.OPEN_IN_TREE)) {
			openSelectedInTree();
		}

		if (viewMode === 'review' && checkInput(input, key, ACTIONS.RESET_REVIEW_FILTERS)) {
			resetReviewFilters();
		}
		if (checkInput(input, key, ACTIONS.RESCAN)) {
			if (!isScanning) {
				scanRef();
			}
			return;
		}
	});

	const helpOverlay = showHelp ? <HelpModal theme={theme} /> : null;
	const infoOverlay =
		showInfo && selectedFile ? <InfoModal theme={theme} node={selectedFile} /> : null;
	const reviewFiltersOverlay =
		showReviewFilters && viewMode === 'review' ? (
			<ReviewFiltersModal theme={theme} state={reviewState} />
		) : null;
	const settingsOverlay =
		view === ViewState.Settings ? (
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
				fileTypeColoursEnabled={fileTypeColoursEnabled}
				onSelectFileTypeColours={(enabled) => {
					setFileTypeColoursEnabled(enabled);
					setFileTypeColoursEnabledInConfig(enabled);
				}}
				heatmapEnabled={heatmapEnabled}
				onSelectHeatmap={(enabled) => {
					setHeatmapEnabled(enabled);
					setHeatmapEnabledInConfig(enabled);
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

	if (!currentNode) {
		const sizeLabel = formatSize(scanStatus.bytes);
		const divider = '-'.repeat(Math.max(0, totalColumns));

		return (
			<Box height={totalRows} width="100%" flexDirection="column">
				<Header path={startPath} theme={theme} viewMode={viewMode} />
				<Box flexGrow={1} flexDirection="column">
					<Text color={theme.colours.line}>{divider}</Text>
					<Box flexDirection="column" paddingX={1} paddingY={1}>
						<Text color={theme.colours.text}>
							Scanning {startPath}... {spinnerFrames[spinnerIndex]}
						</Text>
						<Text color={theme.colours.muted} wrap="truncate-end">
							Current: {scanStatus.currentPath}
						</Text>
						<Text color={theme.colours.text}>
							Progress: {scanStatus.directories} directories, {scanStatus.files} files, {sizeLabel}
						</Text>
						{scanStatus.errors > 0 ? <Text color="yellow">Errors: {scanStatus.errors}</Text> : null}
					</Box>
				</Box>

				<Footer
					totalSize={scanStatus.bytes}
					itemCount={scanStatus.files}
					theme={theme}
					units={currentUnits}
					isScanning={loading || isScanning}
					mode="default"
				/>
				{helpOverlay}
				{infoOverlay}
				{reviewFiltersOverlay}
				{settingsOverlay}
			</Box>
		);
	}

	if (showConfirmDelete) {
		const selectedFile = selectedNode;
		return (
			<Box flexDirection="column" height={totalRows} width="100%">
				<Header path={currentNode.path} theme={theme} viewMode={viewMode} />
				<Box flexGrow={1} justifyContent="center" alignItems="center">
					<ConfirmDelete
						fileName={selectedFile?.name || 'item'}
						formattedSize={formatSize(selectedFile?.size || 0)}
						isDirectory={selectedFile?.isDirectory || false}
						theme={theme}
					/>
				</Box>
				<Footer
					totalSize={currentNode.size}
					itemCount={viewMode === 'review' ? reviewEntries.length : files.length}
					theme={theme}
					units={currentUnits}
					isScanning={isScanning}
					mode={viewMode === 'review' ? 'review' : 'default'}
				/>
				{helpOverlay}
				{infoOverlay}
				{reviewFiltersOverlay}
				{settingsOverlay}
			</Box>
		);
	}

	const scanErrorsLabel = scanStatus.errors > 0 ? ` | Errors: ${scanStatus.errors}` : '';
	const scanSummary = `Scan: ${scanStatus.directories} directories, ${scanStatus.files} files, ${formatSize(scanStatus.bytes)}${scanErrorsLabel}`;
	const scanIndicator = isScanning ? (
		<ScanStatus
			theme={theme}
			summary={scanSummary}
			currentPath={scanStatus.currentPath}
			spinnerFrame={spinnerFrames[spinnerIndex]}
		/>
	) : null;
	const timerIndicator = showTimerStatus ? (
		<TimerStatus
			theme={theme}
			status={timerState.status}
			remainingSeconds={timerState.remainingSeconds}
			durationSeconds={timerState.durationSeconds}
			deletedItems={timerStats.deletedItems}
			freedBytes={timerStats.freedBytes}
			formatSize={formatSize}
		/>
	) : null;
	const statusIndicator = timerIndicator ?? scanIndicator;
	const STATUS_INDICATOR_ROWS = 3;
	const statusIndicatorRows = statusIndicator ? STATUS_INDICATOR_ROWS : 0;

	const maxSize = files.reduce((max, f) => Math.max(max, f.size), 0);
	const maxCount = files.reduce((max, f) => Math.max(max, f.fileCount || 0), 0);
	const currentItemCount = viewMode === 'review' ? reviewEntries.length : files.length;
	const headerRows = 2;
	const footerRows = 2;
	const panelWidth = showStatusPanel
		? Math.max(26, Math.min(38, Math.floor(totalColumns * 0.32)))
		: 0;
	const listWidth = showStatusPanel ? Math.max(20, totalColumns - panelWidth) : totalColumns;
	const panelHeight = Math.max(3, totalRows - headerRows - footerRows - statusIndicatorRows);
	const effectiveSelectedFile = selectedFile ?? undefined;
	return (
		<Box flexDirection="column" height={totalRows} width="100%">
			<Header path={currentNode.path} theme={theme} viewMode={viewMode} />

			<Box flexGrow={1} overflowY="hidden">
				<Box flexDirection="row" width="100%">
					<Box width={showStatusPanel ? listWidth : '100%'}>
						{viewMode === 'review' ? (
							<Box flexDirection="column">
								<ReviewToolbar
									theme={theme}
									state={reviewState}
									resultCount={reviewEntries.length}
								/>
								<ReviewList
									rows={reviewVisibleRows}
									selectedIndex={selectionIndex}
									theme={theme}
									units={currentUnits}
									rootPath={currentNode.path}
									fileTypeColoursEnabled={fileTypeColoursEnabled}
									availableColumns={showStatusPanel ? listWidth : undefined}
									extraTopRows={2}
									extraBottomRows={statusIndicatorRows}
								/>
							</Box>
						) : (
							<FileList
								files={files}
								selectedIndex={selectionIndex}
								maxSize={maxSize}
								totalSize={currentNode.size}
								maxCount={maxCount}
								totalCount={currentNode.fileCount || 0}
								sortBy={sortBy}
								theme={theme}
								units={currentUnits}
								viewMode={viewMode}
								rootPath={currentNode.path}
								scanRootPath={rootNode?.path ?? currentNode.path}
								fileTypeColoursEnabled={fileTypeColoursEnabled}
								showLegend={showLegend}
								heatmapEnabled={heatmapEnabled}
								entryPointPath={entryPointPath}
								availableColumns={showStatusPanel ? listWidth : undefined}
								extraBottomRows={statusIndicatorRows}
							/>
						)}
					</Box>
					{showStatusPanel ? (
						<Box width={panelWidth}>
							<StatusPanel
								theme={theme}
								sortBy={sortBy}
								sortOrder={sortOrder}
								viewMode={viewMode}
								showHiddenFiles={showHiddenFiles}
								heatmapEnabled={heatmapEnabled}
								fileTypeColoursEnabled={fileTypeColoursEnabled}
								showLegend={showLegend}
								units={currentUnits}
								selectedFile={effectiveSelectedFile}
								selectedFileMode={selectedFileMetadata?.mode}
								selectedFileBirthtime={selectedFileMetadata?.birthtime}
								selectedFileMtime={selectedFileMetadata?.mtime}
								metadataLoading={selectedFileMetadataLoading}
								width={panelWidth}
								height={panelHeight}
							/>
						</Box>
					) : null}
				</Box>
			</Box>

			{statusIndicator}

			<Footer
				totalSize={currentNode.size}
				itemCount={currentItemCount}
				theme={theme}
				units={currentUnits}
				isScanning={isScanning}
				mode={
					showHelp
						? 'help'
						: showInfo
							? 'info'
							: view === ViewState.Settings
								? 'settings'
								: viewMode === 'review'
									? 'review'
									: 'default'
				}
			/>
			{helpOverlay}
			{infoOverlay}
			{reviewFiltersOverlay}
			{settingsOverlay}
		</Box>
	);
};
