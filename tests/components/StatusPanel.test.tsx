// Component tests for status panel content, type display, and count behaviour
//
// (c) Copyright 2026 Liminal HQ, Scott Morris
// SPDX-License-Identifier: MIT

import React from 'react';
import { render } from 'ink-testing-library';
import {
	StatusPanel,
	getTypeDisplay,
	getSelectedDirectoryFileCounts,
} from '../../src/components/StatusPanel.js';
import { themes } from '../../src/themes.js';
import { describe, test, expect } from '@jest/globals';
import type { FileNode } from '../../src/scanner.js';

const mockDate = new Date('2026-02-27T12:00:00Z');

const createSelectedFile = (size: number): FileNode => ({
	name: 'example.txt',
	path: '/tmp/example.txt',
	size,
	isDirectory: false,
	isSymbolicLink: false,
	isHidden: false,
	mode: 0o100755,
	birthtime: mockDate,
	mtime: mockDate,
	parent: {
		name: 'tmp',
		path: '/tmp',
		size: 1000,
		isDirectory: true,
		isSymbolicLink: false,
		isHidden: false,
		mode: 0o040755,
		birthtime: mockDate,
		mtime: mockDate,
	},
});

const createSelectedDirectory = (): FileNode => {
	const nestedFile: FileNode = {
		name: 'leaf.txt',
		path: '/tmp/dir/a/leaf.txt',
		size: 20,
		isDirectory: false,
		isSymbolicLink: false,
		isHidden: false,
		mode: 0o100644,
		birthtime: mockDate,
		mtime: mockDate,
	};
	const nestedDir: FileNode = {
		name: 'a',
		path: '/tmp/dir/a',
		size: 40,
		isDirectory: true,
		isSymbolicLink: false,
		isHidden: false,
		mode: 0o040755,
		birthtime: mockDate,
		mtime: mockDate,
		children: [nestedFile],
	};
	const rootDir: FileNode = {
		name: 'dir',
		path: '/tmp/dir',
		size: 100,
		isDirectory: true,
		isSymbolicLink: false,
		isHidden: false,
		mode: 0o040755,
		birthtime: mockDate,
		mtime: mockDate,
		children: [
			nestedDir,
			{
				name: 'file1.txt',
				path: '/tmp/dir/file1.txt',
				size: 10,
				isDirectory: false,
				isSymbolicLink: false,
				isHidden: false,
				mode: 0o100644,
				birthtime: mockDate,
				mtime: mockDate,
			},
		],
	};
	nestedFile.parent = nestedDir;
	nestedDir.parent = rootDir;
	for (const child of rootDir.children ?? []) {
		child.parent = rootDir;
	}
	return rootDir;
};

describe('StatusPanel', () => {
	test('renders status information correctly', () => {
		const { lastFrame } = render(
			<StatusPanel
				theme={themes.default}
				sortBy="size"
				sortOrder="desc"
				viewMode="tree"
				showHiddenFiles={true}
				heatmapEnabled={false}
				fileTypeColoursEnabled={true}
				showLegend={false}
				units="iec"
				width={120}
				height={10}
			/>,
		);
		const output = lastFrame();

		expect(output).toContain('Status');
		expect(output).toContain('Sort: Size (desc)');
		expect(output).toContain('View: Tree');
		expect(output).toContain('Units: IEC');
		expect(output).toContain('Hidden: On');
		expect(output).toContain('Heatmap: Off');
		expect(output).toContain('Legend: Off');
	});

	test('renders different props correctly', () => {
		const { lastFrame } = render(
			<StatusPanel
				theme={themes.default}
				sortBy="name"
				sortOrder="asc"
				viewMode="flat"
				showHiddenFiles={false}
				heatmapEnabled={true}
				fileTypeColoursEnabled={false}
				showLegend={false}
				units="si"
				width={120}
				height={10}
			/>,
		);
		const output = lastFrame();

		expect(output).toContain('Sort: Name (asc)');
		expect(output).toContain('View: Flat');
		expect(output).toContain('Units: SI');
		expect(output).toContain('Hidden: Off');
		expect(output).toContain('Heatmap: On');
		expect(output).toContain('Legend: N/A');
	});

	test('renders selected file properties with impact badge and permissions', () => {
		const selectedFile = createSelectedFile(300);
		const { lastFrame } = render(
			<StatusPanel
				theme={themes.default}
				sortBy="size"
				sortOrder="desc"
				viewMode="tree"
				showHiddenFiles={false}
				heatmapEnabled={true}
				fileTypeColoursEnabled={true}
				showLegend={true}
				units="iec"
				selectedFile={selectedFile}
				selectedFileMode={0o100755}
				selectedFileBirthtime={mockDate}
				selectedFileMtime={mockDate}
				width={44}
				height={18}
			/>,
		);
		const output = lastFrame();

		expect(output).toContain('Selected');
		expect(output).toContain('Impact: Heavy');
		expect(output).toContain('Type: file: Text (.txt)');
		expect(output).toContain('Dirs: N/A | Files: N/A');
		expect(output).toContain('Perms');
		expect(output).toContain('-rwxr-xr-x');
		expect(output).toContain('Created');
		expect(output).toContain('Modified');
		expect(output.indexOf('Created')).toBeLessThan(output.indexOf('Modified'));
	});

	test('shows updating and created fallback state', () => {
		const selectedFile = createSelectedFile(20);
		const { lastFrame } = render(
			<StatusPanel
				theme={themes.default}
				sortBy="name"
				sortOrder="asc"
				viewMode="flat"
				showHiddenFiles={false}
				heatmapEnabled={false}
				fileTypeColoursEnabled={true}
				showLegend={false}
				units="si"
				selectedFile={selectedFile}
				selectedFileMode={0o100644}
				selectedFileMtime={mockDate}
				metadataLoading={true}
				width={44}
				height={18}
			/>,
		);
		const output = lastFrame();

		expect(output).toContain('Updating...');
		expect(output).toContain('Created');
		expect(output).toContain('N/A');
		expect(output).toContain('Impact: Tiny');
	});

	test('matches type value colour to file category colour when available', () => {
		const selectedFile = createSelectedFile(20);
		const typeDisplay = getTypeDisplay(selectedFile, themes.default, true);

		expect(typeDisplay.label).toBe('file: Text (.txt)');
		expect(typeDisplay.colour).toBe(themes.default.colours.fileTypes.text);
	});

	test('uses muted colour for non-executable scripts in type display', () => {
		const scriptFile = {
			...createSelectedFile(20),
			name: 'build.sh',
			path: '/tmp/build.sh',
			mode: 0o100644,
		};
		const typeDisplay = getTypeDisplay(scriptFile, themes.default, true);

		expect(typeDisplay.label).toBe('file: Scripts (.sh)');
		expect(typeDisplay.colour).toBe(themes.default.colours.muted);
	});

	test('shows nested directory and file totals for selected directories', () => {
		const selectedDir = createSelectedDirectory();
		const { lastFrame } = render(
			<StatusPanel
				theme={themes.default}
				sortBy="name"
				sortOrder="asc"
				viewMode="tree"
				showHiddenFiles={false}
				heatmapEnabled={true}
				fileTypeColoursEnabled={true}
				showLegend={false}
				units="iec"
				selectedFile={selectedDir}
				selectedFileMode={0o040755}
				selectedFileBirthtime={mockDate}
				selectedFileMtime={mockDate}
				width={60}
				height={18}
			/>,
		);
		const output = lastFrame();

		expect(output).toContain('Dirs: 1 | Files: 2');
	});

	test('returns N/A counts for non-directory selections', () => {
		const counts = getSelectedDirectoryFileCounts(createSelectedFile(30));

		expect(counts.directories).toBeNull();
		expect(counts.files).toBeNull();
	});
});
