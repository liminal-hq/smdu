import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// Use generic to type the mock functions correctly
const mockLstat = jest.fn();
const mockReaddir = jest.fn();

// Mock fs module
jest.unstable_mockModule('fs', () => ({
	default: {
		promises: {
			lstat: mockLstat,
			readdir: mockReaddir,
		},
	},
	promises: {
		lstat: mockLstat,
		readdir: mockReaddir,
	},
}));

// Import the module under test dynamically AFTER mocking
const { scanDirectory } = await import('../src/scanner.js');

describe('scanDirectory', () => {
	const mockDate = new Date();

	beforeEach(() => {
		mockLstat.mockReset();
		mockReaddir.mockReset();
	});

	it('should scan a file correctly', async () => {
		mockLstat.mockResolvedValue({
			isDirectory: () => false,
			size: 100,
			mtime: mockDate,
		});

		const node = await scanDirectory('/test/file.txt');

		expect(node.name).toBe('file.txt');
		expect(node.path).toBe('/test/file.txt');
		expect(node.size).toBe(100);
		expect(node.isDirectory).toBe(false);
		expect(node.isHidden).toBe(false);
		expect(node.children).toBeUndefined();
	});

	it('should mark dotfiles as hidden', async () => {
		mockLstat.mockResolvedValue({
			isDirectory: () => false,
			size: 50,
			mtime: mockDate,
		});

		const node = await scanDirectory('/test/.env');

		expect(node.name).toBe('.env');
		expect(node.isHidden).toBe(true);
	});

	it('should scan a directory with children correctly', async () => {
		// Mock for root dir
		mockLstat.mockImplementation(async (p: string) => {
			if (p === '/test') {
				return {
					isDirectory: () => true,
					size: 0,
					mtime: mockDate,
				};
			} else if (p === '/test/file1.txt') {
				return {
					isDirectory: () => false,
					size: 500,
					mtime: mockDate,
				};
			}
			return {};
		});

		mockReaddir.mockResolvedValue(['file1.txt']);

		const node = await scanDirectory('/test');

		expect(node.name).toBe('test');
		expect(node.isDirectory).toBe(true);
		expect(node.children).toHaveLength(1);
		expect(node.children![0].name).toBe('file1.txt');
		expect(node.size).toBe(500);
	});

	it('should handle permission errors in directory access', async () => {
		mockLstat.mockResolvedValue({
			isDirectory: () => true,
			size: 0,
			mtime: mockDate,
		});

		mockReaddir.mockRejectedValue(new Error('EACCES'));

		const node = await scanDirectory('/test/locked');

		expect(node.isDirectory).toBe(true);
		expect(node.children).toEqual([]);
		expect(node.size).toBe(0);
	});
});
