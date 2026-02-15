import React from 'react';
import { Text } from 'ink';
import { Theme } from '../themes.js';
import { StatusBanner } from './StatusBanner.js';

type TimerStatusState = 'idle' | 'running' | 'completed';

interface TimerStatusProps {
	theme: Theme;
	status: TimerStatusState;
	remainingSeconds: number;
	durationSeconds: number;
	deletedItems: number;
	freedBytes: number;
	formatSize: (bytes: number) => string;
}

const formatClock = (seconds: number) => {
	const minutes = Math.floor(seconds / 60);
	const secs = Math.max(0, seconds % 60);
	return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export const TimerStatus: React.FC<TimerStatusProps> = ({
	theme,
	status,
	remainingSeconds,
	durationSeconds,
	deletedItems,
	freedBytes,
	formatSize,
}) => {
	const timerLine =
		status === 'completed'
			? 'Time is up! Great work staying focussed.'
			: status === 'running'
				? `Timer: ${formatClock(remainingSeconds)} remaining of ${formatClock(durationSeconds)}`
				: 'Timer: Inactive. Press T to start.';
	const statsLine =
		status === 'idle'
			? 'Session: No activity yet.'
			: `Session: Freed ${formatSize(freedBytes)} across ${deletedItems} item${deletedItems === 1 ? '' : 's'}.`;

	return (
		<StatusBanner theme={theme}>
			<Text color={theme.colours.text}>{timerLine}</Text>
			<Text color={theme.colours.muted}>{statsLine}</Text>
		</StatusBanner>
	);
};
