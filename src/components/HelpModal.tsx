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
	const contentRows = Math.max(5, modalHeight - 8);
	const labelWidth = Math.max(18, Math.floor(modalWidth * 0.55));
	const keyWidth = Math.max(12, modalWidth - labelWidth - 4);

	// Group items
	const sections = useMemo(() => {
		const navigation = ['Move selection', 'Enter directory', 'Go up', 'Quit'];
		const view = [
			'Sort by name',
			'Sort by size',
			'Toggle view mode',
			'Toggle hidden files',
			'Toggle legend',
			'Toggle heatmap',
			'Toggle status panel',
			'Rescan',
		];
		const actions = ['Delete item', 'Information panel', 'Settings'];
		const timer = ['Start focus timer', 'Toggle focus timer display', 'Cancel focus timer'];
		// Catch-all for others
		const categorized = new Set([...navigation, ...view, ...actions, ...timer]);

		const getItems = (labels: string[]) => HELP_ITEMS.filter((item) => labels.includes(item.label));
		const others = HELP_ITEMS.filter(
			(item) => !categorized.has(item.label) && item.label !== 'Help',
		);

		return [
			{ title: 'Navigation', items: getItems(navigation) },
			{ title: 'View & Display', items: getItems(view) },
			{ title: 'Actions', items: getItems(actions) },
			{ title: 'Timer', items: getItems(timer) },
			{ title: 'Other', items: others },
		].filter((s) => s.items.length > 0);
	}, []);

	// Flatten for rendering AND selection mapping
	type IndexedItem = { label: string; keys: string; index: number };

	// Selectable items only
	const items = useMemo(() => {
		const list: IndexedItem[] = [];
		let idx = 0;
		sections.forEach((s) => {
			s.items.forEach((item) => {
				list.push({ ...item, index: idx++ });
			});
		});
		return list;
	}, [sections]);

	// Render rows (headers, spacers, items)
	type Row =
		| { kind: 'header'; title: string }
		| { kind: 'spacer' }
		| { kind: 'item'; label: string; keys: string; index: number };

	const rows = useMemo(() => {
		const r: Row[] = [];
		let itemIdx = 0;
		sections.forEach((section) => {
			if (r.length > 0) r.push({ kind: 'spacer' });
			r.push({ kind: 'header', title: section.title });
			section.items.forEach((item) => {
				r.push({ kind: 'item', label: item.label, keys: item.keys, index: itemIdx++ });
			});
		});
		return r;
	}, [sections]);

	// Map logical index (0..items.length-1) to row index (0..rows.length-1)
	const rowIndexMap = useMemo(() => {
		const map = new Map<number, number>();
		rows.forEach((row, rIdx) => {
			if (row.kind === 'item') {
				map.set(row.index, rIdx);
			}
		});
		return map;
	}, [rows]);

	const { selectedIndex } = useScrollableList({
		itemsCount: items.length,
		height: contentRows,
		onClose: onBack,
		triggerAction: ACTIONS.HELP,
	});

	const selectedRowIndex = rowIndexMap.get(selectedIndex) ?? 0;
	const visualOffsetRef = React.useRef(0);
	const safeContentRows = Math.max(1, contentRows);

	if (selectedRowIndex < visualOffsetRef.current) {
		visualOffsetRef.current = selectedRowIndex;
	} else if (selectedRowIndex >= visualOffsetRef.current + safeContentRows) {
		visualOffsetRef.current = selectedRowIndex - safeContentRows + 1;
	}

	const maxVisualScroll = Math.max(0, rows.length - safeContentRows);
	visualOffsetRef.current = Math.min(visualOffsetRef.current, maxVisualScroll);

	const visibleRows = rows.slice(
		visualOffsetRef.current,
		visualOffsetRef.current + safeContentRows,
	);

	// Sticky header logic removed to strictly fix item index issues
	let displayRows = visibleRows;

	// Fill with spacers if needed
	if (displayRows.length < safeContentRows) {
		const filler = Array.from({ length: safeContentRows - displayRows.length }, () => ({
			kind: 'spacer' as const,
		}));
		displayRows = [...displayRows, ...filler];
	}

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
				{displayRows.map((row, index) => {
					// Unique key: row kind + index in render slice + content
					const uniqueKey = `${row.kind}-${index}-${'title' in row ? row.title : 'label' in row ? row.label : 'sp'}`;

					if (row.kind === 'header') {
						return (
							<Box key={uniqueKey} width="100%" height={1} flexShrink={0}>
								<Text color={theme.colours.muted} underline bold>
									{row.title}:
								</Text>
								<Text>{''.padEnd(modalWidth - 4 - (row.title.length + 1), ' ')}</Text>
							</Box>
						);
					}
					if (row.kind === 'spacer') {
						return (
							<Box key={uniqueKey} height={1} flexShrink={0}>
								<Text>{''.padEnd(modalWidth - 4, ' ')}</Text>
							</Box>
						);
					}

					const isSelected = 'index' in row && row.index === selectedIndex;
					return (
						<Box key={uniqueKey} width="100%" height={1} flexShrink={0}>
							<Box width={2}>
								<Text color={isSelected ? theme.colours.accent : theme.colours.muted}>
									{isSelected ? '> ' : '  '}
								</Text>
							</Box>
							<Box width={labelWidth - 2}>
								<Text
									color={isSelected ? theme.colours.accent : theme.colours.muted}
									wrap="truncate-end"
								>
									{('label' in row ? row.label : '').padEnd(labelWidth - 2, ' ')}
								</Text>
							</Box>
							<Box width={keyWidth}>
								<Text
									color={isSelected ? theme.colours.accent : theme.colours.text}
									wrap="truncate-end"
								>
									{('keys' in row ? row.keys : '').padEnd(keyWidth, ' ')}
								</Text>
							</Box>
						</Box>
					);
				})}
			</Box>
			<Box marginTop={1}>
				<Text color={theme.colours.muted}>Use Arrow keys to scroll.</Text>
			</Box>
		</Modal>
	);
};
