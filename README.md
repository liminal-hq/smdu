# SMDU (See My Disk Usage)

SMDU is a modern, terminal-based disk usage analyser inspired by `ncdu`, built with TypeScript and Ink.

## Features

-   **Fast Scanning:** Efficiently scans directories to visualize disk usage.
-   **Interactive UI:** Navigate through your file system with ease.
-   **Visual Feedback:** Size bars and percentages help identify large files quickly.
-   **Theming:** Includes built-in themes (Default, Dracula).
-   **Fullscreen TUI:** Uses the alternate screen buffer by default to keep scrollback intact after exit.
-   **Adaptive Layout:** Columns adjust to terminal size and keep totals and units visible.
-   **Live Scan Feedback:** Shows the current scan location with running totals.
-   **Incremental Scan Results:** File list updates as directories finish, with a partial scan indicator.
-   **File Type Colours:** Colour-codes files by category with an optional legend.
-   **Hidden Files Toggle:** Show or hide dotfiles with `.`.
-   **Planned:** List view (name-only entries).
-   **View Modes:** Flat (ncdu-style, default) and Tree.
-   **Planned:** List view (name-only entries).
-   **Help Modal:** Press `?` to view keybindings.
-   **Information Panel:** Press `i` to view details for the selected item.
-   **Cross-Platform:** Works on Linux, macOS, and Windows (best on POSIX).

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/smdu.git
cd smdu

# Install dependencies
pnpm install

# Build the project
pnpm build

# Link globally (optional)
pnpm link --global
```

## Usage

Run `smdu` in any directory:

```bash
smdu
```

Or specify a path:

```bash
smdu /var/log
```

### Options

-   `--theme <name>`: Choose a theme (default, dracula). This overrides the configuration file.
-   `--units <units>`: Display units (iec, si). This overrides the configuration file.
-   `--no-fullscreen`: Disable the alternate screen buffer.
-   `--help`: Show help.
-   `--version`: Show version.

## Configuration

SMDU stores configuration using the system's standard configuration directory (e.g., `~/.config/smdu/config.json` on Linux).

Settings available:
- `theme`: The selected UI theme.
- `units`: The display units (`iec` or `si`).
- `fileTypeColoursEnabled`: Enable file type colours in the list.
- `showHiddenFiles`: Show hidden files by default (dotfiles only on Windows, default on).

## Keybindings

-   **Up / Down / k / j**: Move selection.
-   **Right / Enter / l**: Enter directory.
-   **Left / Backspace / h**: Go up a directory.
-   **d**: Delete selected file/directory.
-   **S**: Open Settings.
-   **i**: Toggle the information panel for the selected item.
-   **n**: Sort by name.
-   **s**: Sort by size.
-   **v**: Toggle view mode (flat/tree).
-   **.**: Toggle hidden files.
-   **L**: Toggle the file type legend.
-   **?**: Toggle help.
-   **q / Esc**: Quit (during scan, cancels).

## Development

To start the project in development mode:

1.  **Install dependencies**:
    ```bash
    pnpm install
    ```

2.  **Start the TypeScript compiler in watch mode** (in a separate terminal):
    ```bash
    pnpm run watch
    ```

3.  **Run the application**:
    ```bash
    pnpm start
    # or to scan a specific directory
    pnpm start -- /path/to/scan
    ```

    Note: `pnpm start` runs `node dist/cli.js`, so you need to have the code built (which `pnpm run watch` does automatically).

4.  **Run tests**:
    ```bash
    pnpm test
    ```

## License

GPL-3.0
