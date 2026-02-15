import { jest, describe, test, expect } from '@jest/globals';
import React from 'react';
import { render } from 'ink-testing-library';

// Mock Modal to avoid ink-testing-library issues with nested absolute positioning
jest.unstable_mockModule('../../src/components/Modal.js', () => import('../__mocks__/Modal.js'));

const { HelpModal } = await import('../../src/components/HelpModal.js');
const { themes } = await import('../../src/themes.js');

describe('HelpModal', () => {
	test('renders help sections', async () => {
		const { lastFrame } = render(<HelpModal theme={themes.default} />);

		let output = lastFrame();
		if (!output) {
			await new Promise(r => setTimeout(r, 100));
			output = lastFrame();
		}

		expect(output).toBeDefined();
		expect(output).toContain('Navigation');
		expect(output).toContain('View & Display');
		// Actions might be scrolled out of view on default terminal size
	});

	test('renders key bindings', async () => {
		const { lastFrame } = render(<HelpModal theme={themes.default} />);
		let output = lastFrame();
		if (!output) {
			await new Promise(r => setTimeout(r, 100));
			output = lastFrame();
		}

		expect(output).toBeDefined();
		expect(output).toContain('k/Up'); // Partial match is fine
		expect(output).toContain('Right');
	});

	test('renders scroll hint', async () => {
		const { lastFrame } = render(<HelpModal theme={themes.default} />);
		let output = lastFrame();
		if (!output) {
			await new Promise(r => setTimeout(r, 100));
			output = lastFrame();
		}
		expect(output).toBeDefined();
		expect(output).toContain('Use Arrow keys to scroll');
	});
});
