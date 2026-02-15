import React from 'react';
import { render } from 'ink-testing-library';
import { StatusPanel } from '../../src/components/StatusPanel.js';
import { themes } from '../../src/themes.js';
import { describe, test, expect } from '@jest/globals';

describe('StatusPanel', () => {
	test('renders status information correctly', () => {
		const { lastFrame } = render(
			<StatusPanel
				theme={themes.default}
				sortBy="size"
				sortOrder="desc"
				viewMode="tree"
				showHiddenFiles={true}
				heatmapEnabled={false}
				fileTypeColoursEnabled={true}
				showLegend={false}
				units="iec"
				width={40}
				height={10}
			/>,
		);
		const output = lastFrame();

		expect(output).toContain('Status');
		expect(output).toContain('Sort: Size (desc)');
		expect(output).toContain('View: Tree');
		expect(output).toContain('Units: IEC');
		expect(output).toContain('Hidden [.]: On');
		expect(output).toContain('Heatmap [H]: Off');
		expect(output).toContain('Legend [L]: Off');
	});

	test('renders different props correctly', () => {
		const { lastFrame } = render(
			<StatusPanel
				theme={themes.default}
				sortBy="name"
				sortOrder="asc"
				viewMode="flat"
				showHiddenFiles={false}
				heatmapEnabled={true}
				fileTypeColoursEnabled={false}
				showLegend={false}
				units="si"
				width={40}
				height={10}
			/>,
		);
		const output = lastFrame();

		expect(output).toContain('Sort: Name (asc)');
		expect(output).toContain('View: Flat');
		expect(output).toContain('Units: SI');
		expect(output).toContain('Hidden [.]: Off');
		expect(output).toContain('Heatmap [H]: On');
		expect(output).toContain('Legend [L]: N/A');
	});
});
