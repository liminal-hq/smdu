#!/usr/bin/env bash
# Update release-facing version references before tagging a new smdu release
#
# (c) Copyright 2026 Liminal HQ, Scott Morris
# SPDX-License-Identifier: MIT

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

RED=""
GREEN=""
YELLOW=""
BLUE=""
BOLD=""
RESET=""

if [[ -t 1 ]]; then
	RED="$(printf '\033[31m')"
	GREEN="$(printf '\033[32m')"
	YELLOW="$(printf '\033[33m')"
	BLUE="$(printf '\033[34m')"
	BOLD="$(printf '\033[1m')"
	RESET="$(printf '\033[0m')"
fi

usage() {
	cat <<'USAGE'
Usage:
  scripts/prepare-release-version.sh --current-version
  scripts/prepare-release-version.sh --version <version> [--branch <name>] [--dry-run]

Options:
  --current-version     Print the current workspace version and exit
  --version <version>   New release version, with or without a leading `v`
  --branch <name>       Branch to create before updating files
  --dry-run             Show planned changes without writing files
  -h, --help            Show this help

This script updates release-facing version references and prepares the repo for
review before a release tag is created on `main`.

Examples:
  scripts/prepare-release-version.sh --current-version
  scripts/prepare-release-version.sh --version 0.0.5
  scripts/prepare-release-version.sh --version 0.0.5 --branch chore/my-release-branch
  scripts/prepare-release-version.sh --version 0.0.5 --dry-run
USAGE
}

info() {
	printf '%b\n' "${BLUE}${1}${RESET}"
}

success() {
	printf '%b\n' "${GREEN}${1}${RESET}"
}

warn() {
	printf '%b\n' "${YELLOW}${1}${RESET}"
}

fail() {
	printf '%b\n' "${RED}${1}${RESET}" >&2
	exit 1
}

usage_error() {
	printf '%b\n\n' "${RED}${1}${RESET}" >&2
	usage >&2
	exit 1
}

require_clean_repo() {
	if ! git -C "${REPO_ROOT}" diff --quiet || ! git -C "${REPO_ROOT}" diff --cached --quiet; then
		fail "Working tree has tracked changes. Commit or stash them before running this script."
	fi
}

current_branch() {
	git -C "${REPO_ROOT}" branch --show-current
}

current_workspace_version() {
	node -e "process.stdout.write(JSON.parse(require('fs').readFileSync('${REPO_ROOT}/package.json','utf8')).version)"
}

man_page_date() {
	local month_names=(January February March April May June July August September October November December)
	local month_num
	month_num="$(date +%-m)"
	printf '%s %s' "${month_names[$((month_num - 1))]}" "$(date +%Y)"
}

replace_in_file() {
	local file="$1"
	local from="$2"
	local to="$3"

	perl -0pi -e "s/\\Q${from}\\E/${to}/g" "${file}"
}

VERSION_INPUT=""
BRANCH_INPUT=""
SHOW_CURRENT_VERSION=false
DRY_RUN=false

while [[ $# -gt 0 ]]; do
	case "$1" in
		--current-version)
			SHOW_CURRENT_VERSION=true
			shift
			;;
		--version)
			if [[ $# -lt 2 || -z "${2:-}" ]]; then
				usage_error "Missing value for --version"
			fi
			VERSION_INPUT="${2}"
			shift 2
			;;
		--branch)
			if [[ $# -lt 2 || -z "${2:-}" ]]; then
				usage_error "Missing value for --branch"
			fi
			BRANCH_INPUT="${2}"
			shift 2
			;;
		--dry-run)
			DRY_RUN=true
			shift
			;;
		-h|--help)
			usage
			exit 0
			;;
		*)
			usage_error "Unknown option: $1"
			;;
	esac
done

if [[ "${SHOW_CURRENT_VERSION}" == true ]]; then
	if [[ -n "${VERSION_INPUT}" || -n "${BRANCH_INPUT}" || "${DRY_RUN}" == true ]]; then
		usage_error "--current-version cannot be combined with other options"
	fi

	CURRENT_VERSION="$(current_workspace_version)"
	if [[ -z "${CURRENT_VERSION}" ]]; then
		fail "Could not determine the current workspace version from package.json"
	fi

	printf '%s\n' "${CURRENT_VERSION}"
	exit 0
fi

if [[ -z "${VERSION_INPUT}" ]]; then
	usage_error "Missing required option: --version or --current-version"
fi

if [[ ! "${VERSION_INPUT}" =~ ^v?[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
	usage_error "Version must look like 0.0.5 or v0.0.5"
fi

require_clean_repo

CURRENT_VERSION="$(current_workspace_version)"
if [[ -z "${CURRENT_VERSION}" ]]; then
	fail "Could not determine the current workspace version from package.json"
fi

NEW_VERSION="${VERSION_INPUT#v}"
NEW_TAG="v${NEW_VERSION}"
TARGET_BRANCH="${BRANCH_INPUT:-chore/release-${NEW_TAG}}"
MAN_DATE="$(man_page_date)"

if [[ "${CURRENT_VERSION}" == "${NEW_VERSION}" ]]; then
	fail "Version is already ${NEW_VERSION}"
fi

FILES=(
	"${REPO_ROOT}/package.json"
	"${REPO_ROOT}/man/smdu.1"
)

info "${BOLD}Preparing release version bump${RESET}"
printf '  from %b%s%b to %b%s%b\n' "${YELLOW}" "${CURRENT_VERSION}" "${RESET}" "${GREEN}" "${NEW_VERSION}" "${RESET}"
printf '  on branch %b%s%b\n' "${GREEN}" "${TARGET_BRANCH}" "${RESET}"

for file in "${FILES[@]}"; do
	if [[ ! -f "${file}" ]]; then
		fail "Expected file not found: ${file}"
	fi
done

if [[ "${DRY_RUN}" == true ]]; then
	warn "Dry run only. No files will be changed."
	printf '  would create or reuse branch %s\n' "${TARGET_BRANCH}"
	for file in "${FILES[@]}"; do
		printf '  would update %s\n' "${file#${REPO_ROOT}/}"
	done
	printf '  man page date would become %b%s%b\n' "${GREEN}" "${MAN_DATE}" "${RESET}"
	exit 0
fi

CURRENT_BRANCH_NAME="$(current_branch)"
if [[ "${CURRENT_BRANCH_NAME}" != "${TARGET_BRANCH}" ]]; then
	if git -C "${REPO_ROOT}" show-ref --verify --quiet "refs/heads/${TARGET_BRANCH}"; then
		fail "Branch already exists locally: ${TARGET_BRANCH}"
	fi

	info "Creating branch ${TARGET_BRANCH}"
	git -C "${REPO_ROOT}" checkout -b "${TARGET_BRANCH}" >/dev/null
fi

# package.json — update the version field
replace_in_file "${REPO_ROOT}/package.json" "\"version\": \"${CURRENT_VERSION}\"" "\"version\": \"${NEW_VERSION}\""

# man/smdu.1 — update the .TH header (version and date)
OLD_TH="$(grep '^\.TH ' "${REPO_ROOT}/man/smdu.1")"
NEW_TH=".TH SMDU 1 \"${MAN_DATE}\" \"${NEW_VERSION}\" \"User Commands\""
replace_in_file "${REPO_ROOT}/man/smdu.1" "${OLD_TH}" "${NEW_TH}"

success "Updated release version references in:"
for file in "${FILES[@]}"; do
	printf '  %b- %s%b\n' "${GREEN}" "${file#${REPO_ROOT}/}" "${RESET}"
done

printf '\n'
warn "Next steps:"
printf '  1. review the diff\n'
printf '  2. run %bpnpm build && pnpm test%b\n' "${BOLD}" "${RESET}"
printf '  3. create release notes at %bdocs/releases/%s.md%b\n' "${BOLD}" "${NEW_TAG}" "${RESET}"
printf '  4. commit and open a PR from %b%s%b\n' "${BOLD}" "${TARGET_BRANCH}" "${RESET}"
printf '  5. merge the PR to main\n'
printf '  6. create tag %b%s%b on main\n' "${BOLD}" "${NEW_TAG}" "${RESET}"
