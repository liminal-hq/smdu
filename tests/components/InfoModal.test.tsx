import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import React from 'react';
import { render } from 'ink-testing-library';
import type { FileNode } from '../../src/scanner.js';

const mockLstat = jest.fn();
const mockReadlink = jest.fn();
const mockFileTypeFromFile = jest.fn();

jest.unstable_mockModule('fs', () => ({
	default: {
		promises: {
			lstat: mockLstat,
			readlink: mockReadlink,
		},
	},
	promises: {
		lstat: mockLstat,
		readlink: mockReadlink,
	},
}));

jest.unstable_mockModule('file-type', () => ({
	fileTypeFromFile: mockFileTypeFromFile,
}));

// Mock Modal to avoid ink-testing-library issues with nested absolute positioning
jest.unstable_mockModule('../../src/components/Modal.js', () => import('../__mocks__/Modal.js'));

const { InfoModal } = await import('../../src/components/InfoModal.js');
const { themes } = await import('../../src/themes.js');

const mockDate = new Date('2023-01-01T12:00:00Z');

describe('InfoModal', () => {
	beforeEach(() => {
		mockLstat.mockReset();
		mockReadlink.mockReset();
		mockFileTypeFromFile.mockReset();
	});

	test('renders directory details', async () => {
		mockLstat.mockResolvedValue({
			isDirectory: () => true,
			isSymbolicLink: () => false,
			size: 4096,
			mode: 0o755,
			uid: 1000,
			gid: 1000,
			birthtime: mockDate,
			mtime: mockDate,
			atime: mockDate,
		});

		const node: FileNode = {
			name: 'dir1',
			path: '/path/to/dir1',
			size: 10240,
			isDirectory: true,
			isHidden: false,
			mtime: mockDate,
			children: [
				{
					name: 'file1',
					path: '/path/to/dir1/file1',
					size: 100,
					isDirectory: false,
					isHidden: false,
					mtime: mockDate,
					parent: undefined,
				},
			],
		};
		node.children?.forEach((child) => {
			child.parent = node;
		});

		const { lastFrame } = render(<InfoModal theme={themes.default} node={node} />);

		// Wait for async loading
		let output = lastFrame();
		for (let i = 0; i < 20; i++) {
			output = lastFrame();
			if (output && output.includes('Directory')) break;
			await new Promise((resolve) => setTimeout(resolve, 50));
		}

		expect(output).toBeDefined();
		expect(output).toContain('Information');
		expect(output).toContain('/path/to/dir1');
		expect(output).toContain('Directory');
		expect(output).toContain('1 direct | 1 total');
		expect(output).toContain('rwxr-xr-x');
	});

	test('renders file details', async () => {
		mockLstat.mockResolvedValue({
			isDirectory: () => false,
			isSymbolicLink: () => false,
			size: 512,
			mode: 0o644,
			uid: 1000,
			gid: 1000,
			birthtime: mockDate,
			mtime: mockDate,
			atime: mockDate,
		});

		mockFileTypeFromFile.mockResolvedValue({
			ext: 'png',
			mime: 'image/png',
		});

		const node: FileNode = {
			name: 'image.png',
			path: '/path/to/image.png',
			size: 512,
			isDirectory: false,
			isHidden: false,
			mtime: mockDate,
		};

		const { lastFrame } = render(<InfoModal theme={themes.default} node={node} />);

		let output = lastFrame();
		for (let i = 0; i < 20; i++) {
			output = lastFrame();
			if (output && output.includes('image/png (png)')) break;
			await new Promise((resolve) => setTimeout(resolve, 50));
		}

		expect(output).toBeDefined();
		expect(output).toContain('image/png (png)');
		expect(output).toContain('rw-r--r--');
	});

	test('renders symbolic link destination details', async () => {
		mockLstat.mockResolvedValue({
			isDirectory: () => false,
			isSymbolicLink: () => true,
			size: 32,
			mode: 0o120777,
			uid: 1000,
			gid: 1000,
			birthtime: mockDate,
			mtime: mockDate,
			atime: mockDate,
		});
		mockReadlink.mockResolvedValue('/var/log/app.log');

		const node: FileNode = {
			name: 'app.log',
			path: '/tmp/app.log',
			size: 32,
			isDirectory: false,
			isSymbolicLink: true,
			isHidden: false,
			mtime: mockDate,
		};

		const { lastFrame } = render(<InfoModal theme={themes.default} node={node} />);

		let output = lastFrame();
		for (let i = 0; i < 20; i++) {
			output = lastFrame();
			if (output && output.includes('Destination')) break;
			await new Promise((resolve) => setTimeout(resolve, 50));
		}

		expect(output).toContain('Symbolic link');
		expect(output).toContain('Destination');
		expect(output).toContain('/var/log/app.log');
	});

	test('renders unresolved symbolic link state', async () => {
		mockLstat.mockResolvedValue({
			isDirectory: () => false,
			isSymbolicLink: () => true,
			size: 32,
			mode: 0o120777,
			uid: 1000,
			gid: 1000,
			birthtime: mockDate,
			mtime: mockDate,
			atime: mockDate,
		});
		mockReadlink.mockRejectedValue(new Error('ENOENT'));

		const node: FileNode = {
			name: 'broken.log',
			path: '/tmp/broken.log',
			size: 32,
			isDirectory: false,
			isSymbolicLink: true,
			isHidden: false,
			mtime: mockDate,
		};

		const { lastFrame } = render(<InfoModal theme={themes.default} node={node} />);

		let output = lastFrame();
		for (let i = 0; i < 20; i++) {
			output = lastFrame();
			if (output && output.includes('Destination')) break;
			await new Promise((resolve) => setTimeout(resolve, 50));
		}

		expect(output).toContain('Destination');
		expect(output).toContain('unresolved (ENOENT)');
	});
});
