import React from 'react';
import { render } from 'ink-testing-library';
import { StatusBanner } from '../../src/components/StatusBanner.js';
import { themes } from '../../src/themes.js';
import { Text } from 'ink';
import { describe, test, expect } from '@jest/globals';

describe('StatusBanner', () => {
	test('renders children content', () => {
		const { lastFrame } = render(
			<StatusBanner theme={themes.default}>
				<Text>Banner Content</Text>
			</StatusBanner>
		);
		const output = lastFrame();
		expect(output).toContain('Banner Content');
	});

	test('renders divider line', () => {
		const { lastFrame } = render(
			<StatusBanner theme={themes.default}>
				<Text>Content</Text>
			</StatusBanner>
		);
		const output = lastFrame();
		// The divider is a line of dashes
		expect(output).toMatch(/-+/);
	});
});
