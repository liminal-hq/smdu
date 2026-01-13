
import React from 'react';
import { render } from 'ink-testing-library';
import { Footer } from '../../src/components/Footer.js';
import { themes } from '../../src/themes.js';
import { describe, test, expect } from '@jest/globals';

describe('Footer', () => {
    test('renders default mode correctly', () => {
        const { lastFrame } = render(
            <Footer
                totalSize={1024}
                itemCount={10}
                theme={themes.default}
                units="iec"
                isScanning={false}
                mode="default"
            />
        );
        const output = lastFrame();
        expect(output).toMatch(/1(\.0)?.*KiB/);
        expect(output).toMatch(/\(10.*items\)/);
        expect(output).toMatch(/Help:.* \?/);
        expect(output).toMatch(/Rescan:.*R/);
    });

    test('renders settings mode correctly', () => {
        const { lastFrame } = render(
            <Footer
                totalSize={1024}
                itemCount={10}
                theme={themes.default}
                units="iec"
                isScanning={false}
                mode="settings"
            />
        );
        const output = lastFrame();
        expect(output).toMatch(/Select:.*Enter/);
        expect(output).toMatch(/Close:.*Esc.*or.*S/);
    });

    test('renders scanning state correctly', () => {
        const { lastFrame } = render(
            <Footer
                totalSize={0}
                itemCount={0}
                theme={themes.default}
                units="iec"
                isScanning={true}
            />
        );
        const output = lastFrame();
        expect(output).toMatch(/Scan:.*Partial/);
        expect(output).toMatch(/Quit:\s*q/);
    });

    test('renders done state correctly', () => {
        const { lastFrame } = render(
            <Footer
                totalSize={1024}
                itemCount={10}
                theme={themes.default}
                units="iec"
                isScanning={false}
            />
        );
        const output = lastFrame();
        expect(output).toMatch(/Scan:.*Done/);
    });
});
