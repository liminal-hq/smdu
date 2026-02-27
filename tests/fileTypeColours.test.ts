// Unit tests for file type category mapping rules
//
// (c) Copyright 2026 Liminal HQ, Scott Morris
// SPDX-License-Identifier: MIT

import { describe, expect, test } from '@jest/globals';
import { getFileTypeCategory } from '../src/fileTypeColours.js';

describe('getFileTypeCategory', () => {
	test('maps common disk image extensions to diskImages', () => {
		expect(getFileTypeCategory('ubuntu.iso', false)).toBe('diskImages');
		expect(getFileTypeCategory('disk.img', false)).toBe('diskImages');
		expect(getFileTypeCategory('installer.dmg', false)).toBe('diskImages');
		expect(getFileTypeCategory('vm.vhdx', false)).toBe('diskImages');
		expect(getFileTypeCategory('machine.vmdk', false)).toBe('diskImages');
		expect(getFileTypeCategory('snapshot.qcow2', false)).toBe('diskImages');
	});

	test('maps text, script, and executable/library extensions to dedicated categories', () => {
		expect(getFileTypeCategory('notes.txt', false)).toBe('text');
		expect(getFileTypeCategory('deploy.sh', false)).toBe('scripts');
		expect(getFileTypeCategory('runner.appimage', false)).toBe('executables');
		expect(getFileTypeCategory('libcrypto.so', false)).toBe('executables');
	});

	test('does not categorise directories by extension', () => {
		expect(getFileTypeCategory('images.iso', true)).toBeNull();
	});
});
