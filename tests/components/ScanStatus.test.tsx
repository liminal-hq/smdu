import React from 'react';
import { render } from 'ink-testing-library';
import { ScanStatus } from '../../src/components/ScanStatus.js';
import { themes } from '../../src/themes.js';
import { describe, test, expect } from '@jest/globals';

describe('ScanStatus', () => {
	test('renders progress summary and spinner', () => {
		const summary = '10 directories, 50 files, 1.2 MB';
		const { lastFrame } = render(
			<ScanStatus
				theme={themes.default}
				summary={summary}
				currentPath="/test/path"
				spinnerFrame="|"
			/>,
		);
		const output = lastFrame();

		expect(output).toContain(summary);
		expect(output).toContain('|');
		expect(output).toContain('Current: /test/path');
	});
});
