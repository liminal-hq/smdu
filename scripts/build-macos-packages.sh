#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

VERSION=""
ARCH_INPUT=""
BINARY_PATH=""
MAN_PAGE_PATH="${REPO_ROOT}/man/smdu.1"
OUTPUT_PREFIX=""

usage() {
	cat <<USAGE
Usage: scripts/build-macos-packages.sh [options]

Options:
  --version <version>         Package version (default: package.json version)
  --arch <x64|arm64>          Target architecture (required)
  --binary <path>             Built binary path (default: dist/smdu)
  --man-page <path>           Man page source path (default: man/smdu.1)
  --output-prefix <prefix>    Output file prefix (default: dist/smdu-v<version>-macos-<arch>)
  -h, --help                  Show this help
USAGE
}

resolve_version() {
	node -p "JSON.parse(require('fs').readFileSync('${REPO_ROOT}/package.json', 'utf8')).version"
}

normalise_arch() {
	case "$1" in
		x64 | amd64 | x86_64)
			echo "x64"
			;;
		arm64 | aarch64)
			echo "arm64"
			;;
		*)
			echo "Unsupported architecture: $1" >&2
			exit 1
			;;
	esac
}

while [[ $# -gt 0 ]]; do
	case "$1" in
		--version)
			VERSION="$2"
			shift 2
			;;
		--arch)
			ARCH_INPUT="$2"
			shift 2
			;;
		--binary)
			BINARY_PATH="$2"
			shift 2
			;;
		--man-page)
			MAN_PAGE_PATH="$2"
			shift 2
			;;
		--output-prefix)
			OUTPUT_PREFIX="$2"
			shift 2
			;;
		-h | --help)
			usage
			exit 0
			;;
		*)
			echo "Unknown option: $1" >&2
			usage
			exit 1
			;;
	esac
done

if [[ -z "${VERSION}" ]]; then
	VERSION="$(resolve_version)"
fi

if [[ -z "${ARCH_INPUT}" ]]; then
	echo "--arch is required (x64 or arm64)" >&2
	exit 1
fi

ARCH="$(normalise_arch "${ARCH_INPUT}")"

if [[ -z "${BINARY_PATH}" ]]; then
	BINARY_PATH="${REPO_ROOT}/dist/smdu"
fi

if [[ -z "${OUTPUT_PREFIX}" ]]; then
	OUTPUT_PREFIX="${REPO_ROOT}/dist/smdu-v${VERSION}-macos-${ARCH}"
fi

if [[ ! -f "${BINARY_PATH}" ]]; then
	echo "Built binary not found at ${BINARY_PATH}" >&2
	exit 1
fi

if [[ ! -f "${MAN_PAGE_PATH}" ]]; then
	echo "Man page source not found at ${MAN_PAGE_PATH}" >&2
	exit 1
fi

mkdir -p "$(dirname "${OUTPUT_PREFIX}")"

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "${TMP_DIR}"' EXIT

PAYLOAD_DIR="${TMP_DIR}/payload"
mkdir -p "${PAYLOAD_DIR}"

install -m 0755 "${BINARY_PATH}" "${PAYLOAD_DIR}/smdu"
gzip -c "${MAN_PAGE_PATH}" > "${PAYLOAD_DIR}/smdu.1.gz"

ARCHIVE_OUTPUT="${OUTPUT_PREFIX}.tar.gz"
tar -C "${PAYLOAD_DIR}" -czf "${ARCHIVE_OUTPUT}" smdu smdu.1.gz
sha256sum "${ARCHIVE_OUTPUT}" > "${ARCHIVE_OUTPUT}.sha256"

echo "Built ${ARCHIVE_OUTPUT}"
