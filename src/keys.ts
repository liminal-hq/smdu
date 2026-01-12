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
  VIEW_MODE: { input: ['v'] },
  TOGGLE_HIDDEN: { input: ['.'] },
  TIMER: { input: ['T'] },
  TIMER_TOGGLE: { input: ['t'] },
  TIMER_CANCEL: { input: ['c'] },
  HELP: { input: ['?'] },
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
  { label: 'Toggle view mode', keys: formatActions(['VIEW_MODE']) },
  { label: 'Toggle hidden files', keys: formatActions(['TOGGLE_HIDDEN']) },
  { label: 'Start focus timer', keys: formatActions(['TIMER']) },
  { label: 'Toggle focus timer display', keys: formatActions(['TIMER_TOGGLE']) },
  { label: 'Cancel focus timer', keys: formatActions(['TIMER_CANCEL']) },
  { label: 'Delete item', keys: formatActions(['DELETE']) },
  { label: 'Settings', keys: formatActions(['SETTINGS']) },
  { label: 'Information panel', keys: formatActions(['INFO']) },
  { label: 'Toggle legend', keys: formatActions(['LEGEND']) },
  { label: 'Toggle heatmap', keys: formatActions(['HEATMAP']) },
  { label: 'Toggle status panel', keys: formatActions(['STATUS_PANEL']) },
  { label: 'Help', keys: formatActions(['HELP']) },
  { label: 'Quit', keys: formatActions(['QUIT']) },
];
