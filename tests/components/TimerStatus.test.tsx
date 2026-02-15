import React from 'react';
import { render } from 'ink-testing-library';
import { TimerStatus } from '../../src/components/TimerStatus.js';
import { themes } from '../../src/themes.js';
import { describe, test, expect } from '@jest/globals';

describe('TimerStatus', () => {
	const formatSize = (bytes: number) => `${bytes} B`;

	test('renders idle state', () => {
		const { lastFrame } = render(
			<TimerStatus
				theme={themes.default}
				status="idle"
				remainingSeconds={0}
				durationSeconds={0}
				deletedItems={0}
				freedBytes={0}
				formatSize={formatSize}
			/>
		);
		const output = lastFrame();
		expect(output).toContain('Timer: Inactive');
		expect(output).toContain('Press T to start');
		expect(output).toContain('Session: No activity yet');
	});

	test('renders running state', () => {
		const { lastFrame } = render(
			<TimerStatus
				theme={themes.default}
				status="running"
				remainingSeconds={299} // 4:59
				durationSeconds={300} // 5:00
				deletedItems={2}
				freedBytes={1024}
				formatSize={formatSize}
			/>
		);
		const output = lastFrame();
		expect(output).toContain('Timer: 04:59 remaining of 05:00');
		expect(output).toContain('Session: Freed 1024 B across 2 items');
	});

	test('renders completed state', () => {
		const { lastFrame } = render(
			<TimerStatus
				theme={themes.default}
				status="completed"
				remainingSeconds={0}
				durationSeconds={300}
				deletedItems={5}
				freedBytes={2048}
				formatSize={formatSize}
			/>
		);
		const output = lastFrame();
		expect(output).toContain('Time is up!');
		expect(output).toContain('Great work staying focussed');
		expect(output).toContain('Freed 2048 B across 5 items');
	});
});
