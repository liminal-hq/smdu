import { Key } from 'ink';

export interface ActionDefinition {
  input?: string[];
  key?: Array<keyof Key>;
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
  SORT_NAME: { input: ['n'] },
  SORT_SIZE: { input: ['s'] },
  SELECT: { input: [' '], key: ['return'] }, // For settings selection
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
