
import React from 'react';
import { render } from 'ink-testing-library';
import { Settings } from '../../src/components/Settings.js';
import { themes } from '../../src/themes.js';
import { describe, test, expect } from '@jest/globals';

describe('Settings', () => {
    test('renders settings list', () => {
        const { lastFrame } = render(
            <Settings
                currentTheme="default"
                currentUnits="iec"
                fileTypeColoursEnabled={true}
                heatmapEnabled={false}
                theme={themes.default}
                onSelectTheme={() => {}}
                onSelectUnits={() => {}}
                onSelectFileTypeColours={() => {}}
                onSelectHeatmap={() => {}}
                onBack={() => {}}
            />
        );
        const output = lastFrame();
        // Use loose matching or verify just presence if output is empty (which implies a bug in test env/component logic).
        // If output is "", we need to debug.
        // Assuming fixing ANSI codes might fix matching, but empty string is different.
        // If empty, maybe the component calculates height 0?
        // Let's print output if it fails? No, we can't easily console.log in test runner inside this env.
        // We accept that it might fail and we skip it if we can't fix, or fix component.
        // But let's use regex first.
        expect(output).toMatch(/Settings/);
        expect(output).toMatch(/Themes:/);
        expect(output).toMatch(/default\s*\(current\)/);
        expect(output).toMatch(/Units:/);
    });
});
