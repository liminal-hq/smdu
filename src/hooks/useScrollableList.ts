import { useState, useCallback } from 'react';
import { useInput } from 'ink';
import { ACTIONS, checkInput, ActionDefinition } from '../keys.js';

interface UseScrollableListProps {
	itemsCount: number;
	height: number;
	onSelect?: (index: number) => void;
	onClose?: () => void;
	triggerAction?: ActionDefinition; // e.g., ACTIONS.SETTINGS or ACTIONS.HELP
}

export const useScrollableList = ({
	itemsCount,
	height,
	onSelect,
	onClose,
	triggerAction,
}: UseScrollableListProps) => {
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [scrollOffset, setScrollOffset] = useState(0);

	const moveSelection = useCallback(
		(direction: number) => {
			setSelectedIndex((prev) => {
				const next = prev + direction;
				if (next < 0) return itemsCount - 1;
				if (next >= itemsCount) return 0;
				return next;
			});
		},
		[itemsCount],
	);

	useInput((input, key) => {
		if (checkInput(input, key, ACTIONS.MOVE_UP)) {
			moveSelection(-1);
		} else if (checkInput(input, key, ACTIONS.MOVE_DOWN)) {
			moveSelection(1);
		} else if (checkInput(input, key, ACTIONS.SELECT) && onSelect) {
			onSelect(selectedIndex);
		} else if (
			checkInput(input, key, ACTIONS.QUIT) ||
			checkInput(input, key, ACTIONS.MOVE_LEFT) ||
			(triggerAction && checkInput(input, key, triggerAction))
		) {
			onClose?.();
		}
	});

	// Calculate visible range
	// Ensure selectedIndex is always visible
	if (selectedIndex < scrollOffset) {
		setScrollOffset(selectedIndex);
	} else if (selectedIndex >= scrollOffset + height) {
		setScrollOffset(selectedIndex - height + 1);
	}

	// Ensure scrollOffset doesn't go out of bounds
	// (e.g. if itemsCount changed or height changed)
	const maxOffset = Math.max(0, itemsCount - height);
	const safeOffset = Math.min(scrollOffset, maxOffset);
	if (safeOffset !== scrollOffset) {
		setScrollOffset(safeOffset);
	}

	return {
		selectedIndex,
		scrollOffset: safeOffset,
		visibleRange: {
			start: safeOffset,
			end: Math.min(itemsCount, safeOffset + height),
		},
	};
};
