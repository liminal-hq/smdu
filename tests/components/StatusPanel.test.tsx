import React from 'react';
import { render } from 'ink-testing-library';
import { StatusPanel } from '../../src/components/StatusPanel.js';
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
				width={40}
				height={10}
			/>,
		);
		const output = lastFrame();

		expect(output).toContain('Status');
		expect(output).toContain('Sort: Size (desc)');
		expect(output).toContain('View: Tree');
		expect(output).toContain('Units: IEC');
		expect(output).toContain('Hidden [.]: On');
		expect(output).toContain('Heatmap [H]: Off');
		expect(output).toContain('Legend [L]: Off');
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
				width={40}
				height={10}
			/>,
		);
		const output = lastFrame();

		expect(output).toContain('Sort: Name (asc)');
		expect(output).toContain('View: Flat');
		expect(output).toContain('Units: SI');
		expect(output).toContain('Hidden [.]: Off');
		expect(output).toContain('Heatmap [H]: On');
		expect(output).toContain('Legend [L]: N/A');
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
		expect(output).toContain('Perms');
		expect(output).toContain('-rwxr-xr-x');
		expect(output).toContain('Created');
		expect(output).toContain('Modified');
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
});
