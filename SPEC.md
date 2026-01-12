# SMDU (See My Disk Usage) Specification

## Overview
SMDU is a TUI disk usage analyser inspired by `ncdu`. It is built with TypeScript, React, and Ink.

## Features
- **Directory Scanning:** Recursively scans directories to calculate file sizes.
- **Visual Interface:** Displays a file tree with size bars and percentages.
- **Navigation:** Navigate through directories using arrow keys (Up/Down to move, Right/Enter to enter, Left/Backspace to go up).
- **Sorting:** Sort files by name or size.
- **View Modes:** Toggle between flat (ncdu-style, default) and tree. List mode (name-only entries) is planned but currently disabled.
- **Help Modal:** Display keybindings with `?`.
- **Information Panel:** Display details for the selected item with `i`.
- **Deletion:** Delete files or directories with a confirmation modal.
- **Theming:** Support for multiple colour themes (Default, Dracula).
- **Settings:** Persistent configuration for themes and units.
- **Fullscreen:** Uses the alternate screen buffer by default; `--no-fullscreen` opts out.
- **Adaptive Layout:** Column widths and the graph adjust to terminal size.
- **Feedback:** Footer shows totals and units; live scan feedback shows the current path and counts.

## Architecture

### Tech Stack
- **Language:** TypeScript
- **Runtime:** Node.js
- **UI Framework:** Ink (React for CLI)
- **State Management:** React Hooks / Internal State
- **Testing:** Jest, Ink Testing Library

### Modules

1.  **Scanner (`src/scanner.ts`)**
    -   Function `scanDirectory(path: string, parent?: FileNode, onProgress?: ScanProgressCallback, progress?: ScanProgress): Promise<FileNode>`
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
    -   Scan feedback:
        ```typescript
        interface ScanProgress {
          currentPath: string;
          directories: number;
          files: number;
          bytes: number;
          errors: number;
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
    -   `InfoModal`: Modal for file and directory details.
    -   `Settings`: Screen for selecting themes.

4.  **Configuration (`src/config.ts`)**
    -   Uses `conf` to store settings (theme, units).

5.  **Theming (`src/themes.ts`)**
    -   Interface `Theme` with properties for `text`, `highlight`, `bar`, `background`.
    -   Context provider to supply the theme to components.

## UI/UX
-   **Header:** `/home/user/projects/smdu` (Yellow/Bold) with sort and view mode indicators.
-   **Help:** `?` opens the keybinding modal.
-   **Info Panel:** `i` opens the information panel for the selected item.
-   **Scan:** `q` cancels the scan and exits.
-   **List:**
    -   `[--#-------]  80%  src/` (Selected item highlighted)
    -   `[----------]  20%  package.json`
    -   Tree mode indents nested items.
    -   Flat mode shows full relative paths (ncdu-style).
-   **Footer:** `Total: 101.21 MiB (15 items) | Sort: Size (desc) | Units: IEC | Delete: d | Settings: S | Quit: q | Navigation: Arrows`

## Theming
-   **Default:** Standard terminal colours (Green bars, White text).
-   **Dracula:** Purple/Pink accents, dark background optimised.

## Testing Strategy
-   Unit tests for `scanner` logic (mocking `fs`).
-   Component tests using `ink-testing-library` to assert output strings.
