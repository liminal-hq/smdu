# SMDU (See My Disk Usage)

SMDU is a modern, terminal-based disk usage analyzer inspired by `ncdu`, built with TypeScript and Ink.

## Features

-   **Fast Scanning:** Efficiently scans directories to visualize disk usage.
-   **Interactive UI:** Navigate through your file system with ease.
-   **Visual Feedback:** Size bars and percentages help identify large files quickly.
-   **Theming:** Includes built-in themes (Default, Dracula).
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

-   `--theme <name>`: Choose a theme (default, dracula).
-   `--help`: Show help.
-   `--version`: Show version.

## Keybindings

-   **Up / Down / k / j**: Move selection.
-   **Right / Enter / l**: Enter directory.
-   **Left / Backspace / h**: Go up a directory.
-   **d**: Delete selected file/directory.
-   **q / Esc**: Quit.

## Development

```bash
# Run in watch mode
pnpm run watch

# Run tests
pnpm test
```

## License

ISC
