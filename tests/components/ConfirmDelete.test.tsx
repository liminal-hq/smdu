import React from 'react';
import { render } from 'ink-testing-library';
import { ConfirmDelete } from '../../src/components/ConfirmDelete.js';
import { themes } from '../../src/themes.js';
import { describe, test, expect } from '@jest/globals';

describe('ConfirmDelete', () => {
	test('renders confirmation message with file name', () => {
		const { lastFrame } = render(<ConfirmDelete fileName="test-file.txt" theme={themes.default} />);
		const output = lastFrame();
		expect(output).toContain('Delete test-file.txt?');
	});

	test('renders instruction to confirm or cancel', () => {
		const { lastFrame } = render(<ConfirmDelete fileName="test-file.txt" theme={themes.default} />);
		const output = lastFrame();
		expect(output).toContain('Press y to confirm');
		expect(output).toContain('or any other key to cancel');
	});
});
