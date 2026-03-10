import { Key } from 'ink';

export interface ActionDefinition {
	input?: string[];
	key?: Array<keyof Key>;
}

export interface HelpItem {
	label: string;
	keys: string;
}

export const ACTIONS: Record<string, ActionDefinition> = {
	MOVE_UP: { input: ['k'], key: ['upArrow'] },
	MOVE_DOWN: { input: ['j'], key: ['downArrow'] },
	MOVE_LEFT: { input: ['h'], key: ['leftArrow', 'backspace'] }, // Backspace acts as "Go Up/Back"
	MOVE_RIGHT: { input: ['l'], key: ['rightArrow', 'return'] }, // Return acts as "Enter"
	ENTER: { key: ['return'] }, // Specific "Enter" action if needed distinct from MOVE_RIGHT
	BACK: { key: ['escape', 'backspace'] }, // Specific back action?
	DELETE: { input: ['d'] },
	SETTINGS: { input: ['S'] },
	QUIT: { input: ['q'], key: ['escape'] },
	CONFIRM: { input: ['y'] },
	INFO: { input: ['i'] },
	LEGEND: { input: ['L'] },
	HEATMAP: { input: ['H'] },
	STATUS_PANEL: { input: ['p'] },
	SORT_NAME: { input: ['n'] },
	SORT_SIZE: { input: ['s'] },
	SORT_COUNT: { input: ['C'] },
	VIEW_MODE: { input: ['v'] },
	TOGGLE_HIDDEN: { input: ['.'] },
	REVIEW_FILTERS: { input: ['f'] },
	REVIEW_PRESET_NEXT: { input: ['m'] },
	REVIEW_GROUP_NEXT: { input: ['g'] },
	REVIEW_GROUP_TOGGLE: { input: ['G'] },
	REVIEW_SCOPE_CYCLE: { input: ['u'] },
	REVIEW_MIN_SIZE_CYCLE: { input: ['z'] },
	REVIEW_AGE_BUCKET_CYCLE: { input: ['a'] },
	REVIEW_MEDIA_TOGGLE: { input: ['M'] },
	OPEN_IN_FLAT: { input: ['o'] },
	OPEN_IN_TREE: { input: ['O'] },
	RESET_REVIEW_FILTERS: { input: ['x'] },
	TIMER: { input: ['T'] },
	TIMER_TOGGLE: { input: ['t'] },
	TIMER_CANCEL: { input: ['c'] },
	HELP: { input: ['?'] },
	RESCAN: { input: ['R'] },
	SELECT: { input: [' '], key: ['return'] }, // For settings selection
};

const KEY_LABELS: Partial<Record<keyof Key, string>> = {
	upArrow: 'Up',
	downArrow: 'Down',
	leftArrow: 'Left',
	rightArrow: 'Right',
	return: 'Enter',
	backspace: 'Backspace',
	escape: 'Esc',
};

export const checkInput = (input: string, key: Key, action: ActionDefinition): boolean => {
	if (action.input && action.input.includes(input)) return true;
	if (action.key) {
		for (const k of action.key) {
			if (key[k]) return true;
		}
	}
	return false;
};

const formatActionTokens = (action: ActionDefinition): string[] => {
	const tokens: string[] = [];
	if (action.input) {
		for (const entry of action.input) {
			tokens.push(entry === ' ' ? 'Space' : entry);
		}
	}
	if (action.key) {
		for (const entry of action.key) {
			tokens.push(KEY_LABELS[entry] ?? entry);
		}
	}
	return tokens;
};

const formatActions = (actionNames: Array<keyof typeof ACTIONS>): string => {
	const tokens = actionNames.flatMap((name) => formatActionTokens(ACTIONS[name]));
	return Array.from(new Set(tokens)).join('/');
};

export const HELP_ITEMS: HelpItem[] = [
	{ label: 'Move selection', keys: formatActions(['MOVE_UP', 'MOVE_DOWN']) },
	{ label: 'Enter directory', keys: formatActions(['MOVE_RIGHT']) },
	{ label: 'Go up', keys: formatActions(['MOVE_LEFT']) },
	{ label: 'Sort by name', keys: formatActions(['SORT_NAME']) },
	{ label: 'Sort by size', keys: formatActions(['SORT_SIZE']) },
	{ label: 'Sort by count', keys: formatActions(['SORT_COUNT']) },
	{ label: 'Toggle view mode', keys: formatActions(['VIEW_MODE']) },
	{ label: 'Toggle hidden files', keys: formatActions(['TOGGLE_HIDDEN']) },
	{ label: 'Review filters', keys: formatActions(['REVIEW_FILTERS']) },
	{ label: 'Review next preset', keys: formatActions(['REVIEW_PRESET_NEXT']) },
	{ label: 'Review next group', keys: formatActions(['REVIEW_GROUP_NEXT']) },
	{ label: 'Review toggle group', keys: formatActions(['REVIEW_GROUP_TOGGLE']) },
	{ label: 'Review cycle scope', keys: formatActions(['REVIEW_SCOPE_CYCLE']) },
	{ label: 'Review cycle min size', keys: formatActions(['REVIEW_MIN_SIZE_CYCLE']) },
	{ label: 'Review cycle age', keys: formatActions(['REVIEW_AGE_BUCKET_CYCLE']) },
	{ label: 'Review toggle media-only', keys: formatActions(['REVIEW_MEDIA_TOGGLE']) },
	{ label: 'Open selected in flat', keys: formatActions(['OPEN_IN_FLAT']) },
	{ label: 'Open selected in tree', keys: formatActions(['OPEN_IN_TREE']) },
	{ label: 'Review reset filters', keys: formatActions(['RESET_REVIEW_FILTERS']) },
	{ label: 'Start focus timer', keys: formatActions(['TIMER']) },
	{
		label: 'Toggle focus timer display',
		keys: formatActions(['TIMER_TOGGLE']),
	},
	{ label: 'Cancel focus timer', keys: formatActions(['TIMER_CANCEL']) },
	{ label: 'Delete item', keys: formatActions(['DELETE']) },
	{ label: 'Settings', keys: formatActions(['SETTINGS']) },
	{ label: 'Information panel', keys: formatActions(['INFO']) },
	{ label: 'Toggle legend', keys: formatActions(['LEGEND']) },
	{ label: 'Toggle heatmap', keys: formatActions(['HEATMAP']) },
	{ label: 'Toggle status panel', keys: formatActions(['STATUS_PANEL']) },
	{ label: 'Help', keys: formatActions(['HELP']) },
	{ label: 'Rescan', keys: formatActions(['RESCAN']) },
	{ label: 'Quit', keys: formatActions(['QUIT']) },
];
