# SMDU (See My Disk Usage) Specification

## Overview
SMDU is a TUI disk usage analyzer inspired by `ncdu`. It is built with TypeScript, React, and Ink.

## Features
- **Directory Scanning:** Recursively scans directories to calculate file sizes.
- **Visual Interface:** Displays a file tree with size bars and percentages.
- **Navigation:** Navigate through directories using arrow keys (Up/Down to move, Right/Enter to enter, Left/Backspace to go up).
- **Sorting:** Sort files by name or size.
- **Deletion:** Delete files or directories with a confirmation modal.
- **Theming:** Support for multiple colour themes (Default, Dracula).

## Architecture

### Tech Stack
- **Language:** TypeScript
- **Runtime:** Node.js
- **UI Framework:** Ink (React for CLI)
- **State Management:** React Hooks / Internal State
- **Testing:** Jest, Ink Testing Library

### Modules

1.  **Scanner (`src/scanner.ts`)**
    -   Function `scanDirectory(path: string): Promise<FileNode>`
    -   Returns a tree structure:
        ```typescript
        interface FileNode {
          name: string;
          path: string;
          size: number;
          isDirectory: boolean;
          children?: FileNode[];
          parent?: FileNode; // Optional, helpful for navigation
        }
        ```

2.  **State Management (`src/state.ts` or Hooks)**
    -   `useFileSystem`: Manages the current directory node and full tree.
    -   `useSelection`: Manages the cursor position in the list.
    -   `useSort`: Manages sort order (Name ASC/DESC, Size ASC/DESC).

3.  **UI Components (`src/components/`)**
    -   `App`: Main container.
    -   `Header`: Displays current path.
    -   `FileList`: Renders the list of files/folders.
        -   Calculates bars relative to the largest item in the directory.
    -   `Footer`: Shows key hints and total size.
    -   `ConfirmDelete`: Modal for deletion.

4.  **Theming (`src/themes.ts`)**
    -   Interface `Theme` with properties for `text`, `highlight`, `bar`, `background`.
    -   Context provider to supply the theme to components.

## UI/UX
-   **Header:** `/home/user/projects/smdu` (Yellow/Bold)
-   **List:**
    -   `[--#-------]  80%  src/` (Selected item highlighted)
    -   `[----------]  20%  package.json`
-   **Footer:** `Delete: d | Quit: q | Navigation: Arrows`

## Theming
-   **Default:** Standard terminal colours (Green bars, White text).
-   **Dracula:** Purple/Pink accents, dark background optimized.

## Testing Strategy
-   Unit tests for `scanner` logic (mocking `fs`).
-   Component tests using `ink-testing-library` to assert output strings.
