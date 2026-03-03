#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

VERSION=""
ARCH_INPUT=""
BINARY_PATH=""
MAN_PAGE_PATH="${REPO_ROOT}/man/smdu.1"
OUTPUT_PREFIX=""
FORMAT="all"

usage() {
	cat <<USAGE
Usage: scripts/build-linux-packages.sh [options]

Options:
  --version <version>         Package version (default: package.json version)
  --arch <x64|arm64>          Target architecture (default: host architecture)
  --binary <path>             Built binary path (default: dist/smdu)
  --man-page <path>           Man page source path (default: man/smdu.1)
  --output-prefix <prefix>    Output file prefix (default: dist/smdu-v<version>-linux-<arch>)
  --format <all|deb|rpm>      Package format to build (default: all)
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
		--format)
			FORMAT="$2"
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
	ARCH_INPUT="$(uname -m)"
fi

ARCH="$(normalise_arch "${ARCH_INPUT}")"

if [[ -z "${BINARY_PATH}" ]]; then
	BINARY_PATH="${REPO_ROOT}/dist/smdu"
fi

if [[ -z "${OUTPUT_PREFIX}" ]]; then
	OUTPUT_PREFIX="${REPO_ROOT}/dist/smdu-v${VERSION}-linux-${ARCH}"
fi

case "${FORMAT}" in
	all | deb | rpm)
		;;
	*)
		echo "Unsupported format: ${FORMAT}" >&2
		exit 1
		;;
esac

if [[ ! -f "${BINARY_PATH}" ]]; then
	echo "Built binary not found at ${BINARY_PATH}" >&2
	exit 1
fi

if [[ ! -f "${MAN_PAGE_PATH}" ]]; then
	echo "Man page source not found at ${MAN_PAGE_PATH}" >&2
	exit 1
fi

DEB_ARCH=""
RPM_ARCH=""
case "${ARCH}" in
	x64)
		DEB_ARCH="amd64"
		RPM_ARCH="x86_64"
		;;
	arm64)
		DEB_ARCH="arm64"
		RPM_ARCH="aarch64"
		;;
esac

mkdir -p "$(dirname "${OUTPUT_PREFIX}")"

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "${TMP_DIR}"' EXIT

MAN_PAGE_GZ="${TMP_DIR}/smdu.1.gz"
gzip -c "${MAN_PAGE_PATH}" > "${MAN_PAGE_GZ}"

VERSION_NO_V="${VERSION#v}"

build_deb() {
	local deb_root="${TMP_DIR}/deb-root"
	mkdir -p "${deb_root}/DEBIAN" "${deb_root}/usr/bin" "${deb_root}/usr/share/man/man1"

	install -m 0755 "${BINARY_PATH}" "${deb_root}/usr/bin/smdu"
	install -m 0644 "${MAN_PAGE_GZ}" "${deb_root}/usr/share/man/man1/smdu.1.gz"

	cat > "${deb_root}/DEBIAN/control" <<CONTROL
Package: smdu
Version: ${VERSION_NO_V}
Section: utils
Priority: optional
Architecture: ${DEB_ARCH}
Maintainer: Scott Morris <scott.moris@gmail.com>
Description: See My Disk Usage - A clone of ncdu
 SMDU is a terminal disk usage analyser inspired by ncdu.
CONTROL

	cat > "${deb_root}/DEBIAN/postinst" <<'POSTINST'
#!/bin/sh
set -e
if command -v mandb >/dev/null 2>&1; then
	mandb -q >/dev/null 2>&1 || true
fi
POSTINST

	cat > "${deb_root}/DEBIAN/postrm" <<'POSTRM'
#!/bin/sh
set -e
if command -v mandb >/dev/null 2>&1; then
	mandb -q >/dev/null 2>&1 || true
fi
POSTRM

	chmod 0755 "${deb_root}/DEBIAN/postinst" "${deb_root}/DEBIAN/postrm"

	local deb_output="${OUTPUT_PREFIX}.deb"
	dpkg-deb --build "${deb_root}" "${deb_output}"
	sha256sum "${deb_output}" > "${deb_output}.sha256"
	echo "Built ${deb_output}"
}

build_rpm() {
	if ! command -v rpmbuild >/dev/null 2>&1; then
		echo "rpmbuild is required to create RPM packages" >&2
		exit 1
	fi

	local rpm_root="${TMP_DIR}/rpm"
	mkdir -p "${rpm_root}/BUILD" "${rpm_root}/BUILDROOT" "${rpm_root}/RPMS" "${rpm_root}/SOURCES" "${rpm_root}/SPECS" "${rpm_root}/SRPMS"

	install -m 0755 "${BINARY_PATH}" "${rpm_root}/SOURCES/smdu"
	install -m 0644 "${MAN_PAGE_GZ}" "${rpm_root}/SOURCES/smdu.1.gz"

	cat > "${rpm_root}/SPECS/smdu.spec" <<SPEC
Name:           smdu
Version:        ${VERSION_NO_V}
Release:        1%{?dist}
Summary:        See My Disk Usage - A clone of ncdu
License:        MIT
URL:            https://github.com/ScottMorris/smdu
BuildArch:      ${RPM_ARCH}

%description
SMDU is a terminal disk usage analyser inspired by ncdu.

%install
mkdir -p %{buildroot}/usr/bin %{buildroot}/usr/share/man/man1
install -m 0755 %{_sourcedir}/smdu %{buildroot}/usr/bin/smdu
install -m 0644 %{_sourcedir}/smdu.1.gz %{buildroot}/usr/share/man/man1/smdu.1.gz

%post
if command -v mandb >/dev/null 2>&1; then
	mandb -q >/dev/null 2>&1 || true
fi

%postun
if command -v mandb >/dev/null 2>&1; then
	mandb -q >/dev/null 2>&1 || true
fi

%files
/usr/bin/smdu
/usr/share/man/man1/smdu.1.gz

%changelog
* $(date '+%a %b %d %Y') Scott Morris <scott.moris@gmail.com> - ${VERSION_NO_V}-1
- Add Linux RPM package for smdu binary and man page.
SPEC

	rpmbuild \
		--define "_topdir ${rpm_root}" \
		--define "__os_install_post %{nil}" \
		--target "${RPM_ARCH}" \
		-bb "${rpm_root}/SPECS/smdu.spec"

	local rpm_built
	rpm_built="$(find "${rpm_root}/RPMS" -type f -name '*.rpm' | head -n 1)"
	if [[ -z "${rpm_built}" ]]; then
		echo "RPM build succeeded but no RPM file was produced" >&2
		exit 1
	fi

	local rpm_output="${OUTPUT_PREFIX}.rpm"
	cp "${rpm_built}" "${rpm_output}"
	sha256sum "${rpm_output}" > "${rpm_output}.sha256"
	echo "Built ${rpm_output}"
}

if [[ "${FORMAT}" == "all" || "${FORMAT}" == "deb" ]]; then
	build_deb
fi

if [[ "${FORMAT}" == "all" || "${FORMAT}" == "rpm" ]]; then
	build_rpm
fi
