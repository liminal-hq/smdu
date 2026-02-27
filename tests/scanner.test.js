// Unit tests for scanner traversal and metadata capture behaviour
//
// (c) Copyright 2026 Liminal HQ, Scott Morris
// SPDX-License-Identifier: MIT

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
// Use generic to type the mock functions correctly
const mockLstat = jest.fn();
const mockReaddir = jest.fn();
const mockReadlink = jest.fn();
// Mock fs module
jest.unstable_mockModule('fs', () => ({
	default: {
		promises: {
			lstat: mockLstat,
			readdir: mockReaddir,
			readlink: mockReadlink,
		},
	},
	promises: {
		lstat: mockLstat,
		readdir: mockReaddir,
		readlink: mockReadlink,
	},
}));
// Import the module under test dynamically AFTER mocking
const { scanDirectory } = await import('../src/scanner.js');
describe('scanDirectory', () => {
	const mockDate = new Date();
	const createStats = ({ isDirectory, isSymbolicLink = false, size }) => ({
		isDirectory: () => isDirectory,
		isSymbolicLink: () => isSymbolicLink,
		size,
		mode: 0o644,
		birthtime: mockDate,
		mtime: mockDate,
	});
	beforeEach(() => {
		mockLstat.mockReset();
		mockReaddir.mockReset();
		mockReadlink.mockReset();
	});
	it('should scan a file correctly', async () => {
		mockLstat.mockResolvedValue(createStats({ isDirectory: false, size: 100 }));
		const node = await scanDirectory('/test/file.txt');
		expect(node.name).toBe('file.txt');
		expect(node.path).toBe('/test/file.txt');
		expect(node.size).toBe(100);
		expect(node.isDirectory).toBe(false);
		expect(node.isSymbolicLink).toBe(false);
		expect(node.isHidden).toBe(false);
		expect(node.children).toBeUndefined();
	});
	it('should mark dotfiles as hidden', async () => {
		mockLstat.mockResolvedValue(createStats({ isDirectory: false, size: 50 }));
		const node = await scanDirectory('/test/.env');
		expect(node.name).toBe('.env');
		expect(node.isHidden).toBe(true);
	});
	it('should scan a directory with children correctly', async () => {
		// Mock for root dir
		mockLstat.mockImplementation(async (p) => {
			if (p === '/test') {
				return createStats({ isDirectory: true, size: 0 });
			} else if (p === '/test/file1.txt') {
				return createStats({ isDirectory: false, size: 500 });
			}
			return {};
		});
		mockReaddir.mockResolvedValue(['file1.txt']);
		const node = await scanDirectory('/test');
		expect(node.name).toBe('test');
		expect(node.isDirectory).toBe(true);
		expect(node.children).toHaveLength(1);
		expect(node.children[0].name).toBe('file1.txt');
		expect(node.size).toBe(500);
	});
	it('should handle permission errors in directory access', async () => {
		mockLstat.mockResolvedValue(createStats({ isDirectory: true, size: 0 }));
		mockReaddir.mockRejectedValue(new Error('EACCES'));
		const node = await scanDirectory('/test/locked');
		expect(node.isDirectory).toBe(true);
		expect(node.children).toEqual([]);
		expect(node.size).toBe(0);
	});
	it('should capture symbolic link destination metadata', async () => {
		mockLstat.mockResolvedValue(createStats({ isDirectory: false, isSymbolicLink: true, size: 12 }));
		mockReadlink.mockResolvedValue('../target.txt');
		const node = await scanDirectory('/test/link.txt');
		expect(node.isSymbolicLink).toBe(true);
		expect(node.linkTarget).toBe('../target.txt');
		expect(node.isBrokenSymbolicLink).toBe(false);
	});
	it('should mark broken symbolic links', async () => {
		mockLstat.mockResolvedValue(createStats({ isDirectory: false, isSymbolicLink: true, size: 12 }));
		mockReadlink.mockRejectedValue(new Error('ENOENT'));
		const node = await scanDirectory('/test/broken-link.txt');
		expect(node.isSymbolicLink).toBe(true);
		expect(node.isBrokenSymbolicLink).toBe(true);
		expect(node.linkTarget).toBeUndefined();
		expect(node.linkError).toContain('ENOENT');
	});
});
