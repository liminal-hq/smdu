import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import React from 'react';
import { render } from 'ink-testing-library';

// Mock scanner
const mockScanDirectory = jest.fn();
jest.unstable_mockModule('../src/scanner.js', () => ({
	scanDirectory: mockScanDirectory,
	ScanCancelledError: class extends Error {},
}));

// Mock config
const mockConfig = {
	getThemeFromConfig: jest.fn(() => 'default'),
	setThemeInConfig: jest.fn(),
	getUnitsFromConfig: jest.fn(() => 'iec'),
	setUnitsInConfig: jest.fn(),
	getFileTypeColoursEnabledFromConfig: jest.fn(() => true),
	setFileTypeColoursEnabledInConfig: jest.fn(),
	getShowHiddenFilesFromConfig: jest.fn(() => false),
	setShowHiddenFilesInConfig: jest.fn(),
	getHeatmapEnabledFromConfig: jest.fn(() => false),
	setHeatmapEnabledInConfig: jest.fn(),
};
jest.unstable_mockModule('../src/config.js', () => mockConfig);

// Mock fs for deletion
const mockRm = jest.fn();
jest.unstable_mockModule('fs', () => ({
	default: {
		promises: {
			rm: mockRm,
		},
	},
	promises: {
		rm: mockRm,
	},
}));

// Mock Modal to avoid absolute positioning issues (reuse logic from HelpModal/InfoModal tests)
jest.unstable_mockModule('../src/components/Modal.js', () => import('./__mocks__/Modal.js'));

const { App } = await import('../src/App.js');

describe('App Integration', () => {
	const mockRootNode = {
		name: 'root',
		path: '/root',
		size: 1000,
		isDirectory: true,
		isHidden: false,
		children: [
			{
				name: 'dir1',
				path: '/root/dir1',
				size: 500,
				isDirectory: true,
				isHidden: false,
				parent: undefined, // Fix circular ref later
				children: [],
			},
			{
				name: 'file1.txt',
				path: '/root/file1.txt',
				size: 300,
				isDirectory: false,
				isHidden: false,
				parent: undefined,
			},
			{
				name: 'file2.log',
				path: '/root/file2.log',
				size: 200,
				isDirectory: false,
				isHidden: false,
				parent: undefined,
			},
		],
	};
	// Fix parent refs
	mockRootNode.children.forEach((c) => (c.parent = mockRootNode as any));

	beforeEach(() => {
		jest.clearAllMocks();
		mockScanDirectory.mockImplementation(
			async (path, parent, onProgress, progress, signal, onPartial) => {
				// Simulate immediate result
				return mockRootNode;
			},
		);
	});

	test('renders file list after scan', async () => {
		const { lastFrame } = render(<App startPath="/root" />);

		let output = lastFrame();
		// Wait for scan to complete (App uses useEffect)
		for (let i = 0; i < 20; i++) {
			output = lastFrame();
			if (output && output.includes('dir1')) break;
			await new Promise((r) => setTimeout(r, 50));
		}

		expect(output).toContain('dir1');
		expect(output).toContain('file1.txt');
		expect(output).toContain('file2.log');
	});

	// Skipped due to input simulation issues with updated ink-testing-library
	test.skip('navigates selection', async () => {
		const { lastFrame, stdin } = render(<App startPath="/root" />);

		// Wait for load
		await new Promise((r) => setTimeout(r, 100)); // Simplified wait

		// Initial selection is index 0 (dir1 - checking sorting, dir1 is 500, file1 is 300. Sort by size desc default? yes)
		// Default sort: Size Desc.
		// dir1 (500) -> file1 (300) -> file2 (200).

		// dir1 is at top. Enter it.
		stdin.write('l'); // Right arrow / Enter
		await new Promise((r) => setTimeout(r, 50));

		const output2 = lastFrame();
		// Should show empty dir message or content of dir1 (empty in mock)
		expect(output2).toContain('This directory is empty');
	});

	// Skipped due to input simulation issues with updated ink-testing-library
	test.skip('deletes a file', async () => {
		const { lastFrame, stdin } = render(<App startPath="/root" />);
		await new Promise((r) => setTimeout(r, 100));

		// Move to file1.txt (index 1)
		stdin.write('j');
		await new Promise((r) => setTimeout(r, 50));

		// Delete
		stdin.write('d');
		await new Promise((r) => setTimeout(r, 50));

		let output = lastFrame();
		expect(output).toContain('Delete file1.txt?');

		// Confirm
		mockRm.mockResolvedValue(undefined);
		stdin.write('y');
		await new Promise((r) => setTimeout(r, 50));

		output = lastFrame();
		// file1.txt should be gone
		expect(output).not.toContain('file1.txt');
		expect(mockRm).toHaveBeenCalled();
	});
});
