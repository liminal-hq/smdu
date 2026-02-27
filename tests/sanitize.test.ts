// Unit tests for sanitization utility
//
// (c) Copyright 2026 Liminal HQ, Scott Morris
// SPDX-License-Identifier: MIT

import { describe, it, expect } from '@jest/globals';
import { stripAnsi, sanitize } from '../src/utils/sanitize.js';

describe('stripAnsi', () => {
	it('should remove ANSI color codes', () => {
		const input = '\u001b[31mRed\u001b[0m';
		expect(stripAnsi(input)).toBe('Red');
	});

	it('should remove cursor movement codes', () => {
		const input = 'Hello\u001b[1AWorld';
		expect(stripAnsi(input)).toBe('HelloWorld');
	});

	it('should handle multiple codes', () => {
		const input = '\u001b[31mRed\u001b[0m and \u001b[32mGreen\u001b[0m';
		expect(stripAnsi(input)).toBe('Red and Green');
	});

	it('should return plain text unchanged', () => {
		const input = 'Plain text';
		expect(stripAnsi(input)).toBe('Plain text');
	});
});

describe('sanitize', () => {
	it('should remove ANSI codes', () => {
		const input = '\u001b[31mRed\u001b[0m';
		expect(sanitize(input)).toBe('Red');
	});

	it('should remove control characters (e.g. backspace, bell)', () => {
		// \x07 is bell, \x08 is backspace
		const input = 'Hello\x07\x08World';
		expect(sanitize(input)).toBe('HelloWorld');
	});

	it('should handle mixed input', () => {
		const input = '\u001b[31mRed\u001b[0m\x07Text';
		expect(sanitize(input)).toBe('RedText');
	});

	it('should return empty string for null/undefined input', () => {
		// @ts-expect-error Testing JS runtime behavior
		expect(sanitize(null)).toBe('');
		// @ts-expect-error Testing JS runtime behavior
		expect(sanitize(undefined)).toBe('');
	});
});
