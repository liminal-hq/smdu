#!/bin/bash
set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MAN_DIR="${HOME}/.local/share/man/man1"
MAN_PAGE_SOURCE="${REPO_ROOT}/man/smdu.1"

echo "Installing smdu man page..."

if ! command -v man &> /dev/null; then
    echo "Warning: 'man' command not found. You may need to install man-db or similar package to view the manual."
fi

if [ ! -f "$MAN_PAGE_SOURCE" ]; then
  echo "Error: Man page source not found at $MAN_PAGE_SOURCE"
  exit 1
fi

mkdir -p "$MAN_DIR"

# Gzip and install
gzip -c "$MAN_PAGE_SOURCE" > "$MAN_DIR/smdu.1.gz"

echo "Successfully installed smdu.1.gz to $MAN_DIR"
echo ""
echo "Ensure ~/.local/share/man is in your MANPATH or standard search paths."
echo "You can test it by running: man smdu"
