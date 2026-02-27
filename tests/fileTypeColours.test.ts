// Unit tests for file type category mapping rules
//
// (c) Copyright 2026 Liminal HQ, Scott Morris
// SPDX-License-Identifier: MIT

import { describe, expect, test } from '@jest/globals';
import { getFileTypeCategory } from '../src/fileTypeColours.js';

describe('getFileTypeCategory', () => {
	test('maps common disk image extensions to archives', () => {
		expect(getFileTypeCategory('ubuntu.iso', false)).toBe('archives');
		expect(getFileTypeCategory('disk.img', false)).toBe('archives');
		expect(getFileTypeCategory('installer.dmg', false)).toBe('archives');
		expect(getFileTypeCategory('vm.vhdx', false)).toBe('archives');
		expect(getFileTypeCategory('machine.vmdk', false)).toBe('archives');
		expect(getFileTypeCategory('snapshot.qcow2', false)).toBe('archives');
	});

	test('does not categorise directories by extension', () => {
		expect(getFileTypeCategory('images.iso', true)).toBeNull();
	});
});
