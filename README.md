# SMDU (See My Disk Usage)

SMDU is a modern, terminal-based disk usage analyser inspired by `ncdu`, built with TypeScript and Ink.

## Features

- **Fast Scanning:** Efficiently scans directories to visualize disk usage.
- **Interactive UI:** Navigate through your file system with ease.
- **Visual Feedback:** Size bars and percentages help identify large files quickly.
- **Theming:** Includes built-in themes (Default, Classic, Dracula) with a sleek default palette.
- **Fullscreen TUI:** Uses the alternate screen buffer by default to keep scrollback intact after exit.
- **Adaptive Layout:** Columns adjust to terminal size and keep totals and units visible.
- **Status Panel:** Right-side panel with sort/view/unit/toggle summary in the header plus selected-file properties (including directory/file counts, size impact, permissions, created/modified timestamps) with freshness updates (toggle with `p`).
- **Live Scan Feedback:** Shows the current scan location with running totals.
- **Incremental Scan Results:** File list updates as directories finish, with a partial scan indicator and live scan stats above the footer.
- **File Type Colours:** Colour-codes files by category (including `Text`, `Scripts`, `Executables/Libraries`, `Disk Images`, and `Archives`) with an optional legend.
- **Heatmap Size Bars:** Green-to-red gradient for size bars (toggle with `H`).
- **Hidden Files Toggle:** Show or hide dotfiles with `.`.
- **Header:** Shows the current path with a subtle divider and a right-aligned `smdu v<version>` label.
- **Planned:** List view (name-only entries).
- **View Modes:** Flat (ncdu-style, default) and Tree.
- **Help Modal:** Press `?` to view keybindings.
- **Information Panel:** Press `i` to view extended details for the selected item, including symlink destination state.
- **Directory/Link Type Cues:** Directories and symbolic links use dedicated colours in the file browser when file type colours are enabled.
- **Focus Timer:** Press `T` to start a 5/10/15/30 minute focus timer with session stats and a completion bell.
- **Cross-Platform:** Works on Linux, macOS, and Windows (best on POSIX).

## Installation

```bash
# Clone the repository
git clone https://github.com/ScottMorris/smdu.git
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

- `--theme <name>`: Choose a theme (default, classic, dracula). This overrides the configuration file.
- `--units <units>`: Display units (iec, si). This overrides the configuration file.
- `--no-fullscreen`: Disable the alternate screen buffer.
- `--help`: Show help.
- `-v, --version`: Show version.

## Configuration

SMDU stores configuration using the system's standard configuration directory (e.g., `~/.config/smdu/config.json` on Linux).

Settings available:

- `theme`: The selected UI theme.
- `units`: The display units (`iec` or `si`).
- `fileTypeColoursEnabled`: Enable file type colours in the list.
- `heatmapEnabled`: Enable heatmap colours for size bars (default on).
- `showHiddenFiles`: Show hidden files by default (dotfiles only; Windows hidden attributes are not detected, default on).

## Keybindings

- **Up / Down / k / j**: Move selection.
- **Right / Enter / l**: Enter directory.
- **Left / Backspace / h**: Go up a directory.
- **d**: Delete selected file/directory.
- **S**: Open Settings.
- **i**: Toggle the information panel for the selected item.
- **n**: Sort by name.
- **s**: Sort by size.
- **C**: Sort by file count.
- **v**: Toggle view mode (flat/tree).
- **.**: Toggle hidden files.
- **L**: Toggle the file type legend.
- **H**: Toggle heatmap size bars.
- **p**: Toggle the status panel.
- **T**: Start a focus timer (cycles 5/10/15/30 minutes).
- **t**: Toggle focus timer display (shows the timer pane even when idle).
- **c**: Cancel the focus timer.
- **R**: Rescan the current directory.
- **?**: Toggle help.
- **q / Esc**: Quit (during scan, cancels).

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

MIT
