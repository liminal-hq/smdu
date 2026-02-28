// Unit tests for path-based node lookup in the filesystem state tree
//
// (c) Copyright 2026 Liminal HQ, Scott Morris
// SPDX-License-Identifier: MIT

import { describe, it, expect, beforeEach } from '@jest/globals';
import { findNodeByPath } from '../src/state.js';
import { FileNode } from '../src/scanner.js';
import path from 'path';

// Helper to create nodes
const createNode = (
	name: string,
	size: number,
	isDirectory: boolean,
	children: FileNode[] = [],
	parentPath: string = '',
): FileNode => {
	// Construct path carefully.
	let nodePath: string;
	if (parentPath === '') {
		nodePath = name === 'root' ? '/root' : `/${name}`;
	} else {
		nodePath = path.join(parentPath, name);
	}

	const node: FileNode = {
		name,
		path: nodePath,
		size,
		isDirectory,
		isHidden: name.startsWith('.'),
		children: isDirectory ? children : undefined,
		mtime: new Date(),
		parent: undefined,
	};
	children.forEach((c) => (c.parent = node));
	return node;
};

describe('findNodeByPath', () => {
	let root: FileNode;

	beforeEach(() => {
		// Structure:
		// /root
		//   dir1
		//     subfile.txt
		//   file1.txt
		const subfile = createNode('subfile.txt', 50, false, [], '/root/dir1');
		const dir1 = createNode('dir1', 300, true, [subfile], '/root');
		const file1 = createNode('file1.txt', 100, false, [], '/root');
		root = createNode('root', 600, true, [file1, dir1]);
	});

	it('should return null if target path is not inside root', () => {
		expect(findNodeByPath(root, '/outside/file')).toBeNull();
	});

	it('should return null if target path is partial match of root prefix but not child', () => {
		// e.g. root is /root, target is /root_sibling
		expect(findNodeByPath(root, '/root_sibling')).toBeNull();
	});

	it('should return root if target path matches root path', () => {
		expect(findNodeByPath(root, '/root')).toBe(root);
	});

	it('should find a direct child', () => {
		// Need to find the correct child reference to compare
		// but finding by path is what we are testing.
		const found = findNodeByPath(root, '/root/file1.txt');
		expect(found).toBeDefined();
		expect(found?.name).toBe('file1.txt');
	});

	it('should find a nested descendant', () => {
		const found = findNodeByPath(root, '/root/dir1/subfile.txt');
		expect(found).toBeDefined();
		expect(found?.name).toBe('subfile.txt');
	});

	it('should return null if path segment does not exist', () => {
		expect(findNodeByPath(root, '/root/nonexistent')).toBeNull();
	});

	it('should return null if path segment exists but is not on the path', () => {
		expect(findNodeByPath(root, '/root/dir1/nonexistent.txt')).toBeNull();
	});

	it('should return null if intermediate path segment is not found', () => {
		expect(findNodeByPath(root, '/root/missing_dir/subfile.txt')).toBeNull();
	});

	it('should match correctly', () => {
		const found = findNodeByPath(root, '/root/dir1');
		expect(found).toBeDefined();
		expect(found?.name).toBe('dir1');
	});
});
