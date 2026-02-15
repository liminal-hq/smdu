import React from 'react';
import { render } from 'ink-testing-library';
import { Header } from '../../src/components/Header.js';
import { themes } from '../../src/themes.js';
import { VERSION } from '../../src/version.js';
import { describe, test, expect } from '@jest/globals';

describe('Header', () => {
	test('renders path and title', () => {
		const { lastFrame } = render(<Header path="/tmp" theme={themes.default} />);
		const output = lastFrame();
		expect(output).toContain('/tmp');
		expect(output).toContain('smdu');
		if (VERSION !== 'unknown') {
			expect(output).toContain(`v${VERSION}`);
		}
	});

	test('renders view mode indicator', () => {
		const { lastFrame } = render(<Header path="/tmp" theme={themes.default} viewMode="tree" />);
		const output = lastFrame();
		expect(output).toContain('[Tree]');
	});

	test('renders flat view mode indicator', () => {
		const { lastFrame } = render(<Header path="/tmp" theme={themes.default} viewMode="flat" />);
		const output = lastFrame();
		expect(output).toContain('[Flat]');
	});
});
