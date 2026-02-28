import React from 'react';
import { render } from 'ink-testing-library';
import { ConfirmDelete } from '../../src/components/ConfirmDelete.js';
import { themes } from '../../src/themes.js';
import { describe, test, expect } from '@jest/globals';

describe('ConfirmDelete', () => {
	test('renders confirmation message with file name', () => {
		const { lastFrame } = render(<ConfirmDelete fileName="test-file.txt" theme={themes.default} />);
		const output = lastFrame();
		// Default to 'file' if no type specified
		expect(output).toContain("Delete file 'test-file.txt'?");
	});

	test('renders confirmation message with directory type', () => {
		const { lastFrame } = render(
			<ConfirmDelete fileName="node_modules" isDirectory={true} theme={themes.default} />,
		);
		const output = lastFrame();
		expect(output).toContain("Delete directory 'node_modules'?");
	});

	test('renders confirmation message with size', () => {
		const { lastFrame } = render(
			<ConfirmDelete fileName="large-file.iso" formattedSize="4.2 GB" theme={themes.default} />,
		);
		const output = lastFrame();
		expect(output).toContain("Delete file 'large-file.iso' (4.2 GB)?");
	});

	test('sanitizes escape sequences in the file name', () => {
		const { lastFrame } = render(
			<ConfirmDelete fileName={'\u001b[31mbad.txt\u001b[0m'} theme={themes.default} />,
		);
		const output = lastFrame();
		expect(output).toContain("Delete file 'bad.txt'?");
		expect(output).not.toContain('\u001b[31m');
	});

	test('renders instruction to confirm or cancel', () => {
		const { lastFrame } = render(<ConfirmDelete fileName="test-file.txt" theme={themes.default} />);
		const output = lastFrame();
		expect(output).toContain('Press y to confirm');
		expect(output).toContain('or any other key to cancel');
	});
});
