
import React from 'react';
import { render } from 'ink-testing-library';
import { Modal } from '../../src/components/Modal.js';
import { themes } from '../../src/themes.js';
import { Text } from 'ink';
import { describe, test, expect } from '@jest/globals';

describe('Modal', () => {
    test('renders title and content', () => {
        const { lastFrame } = render(
            <Modal theme={themes.default} title="Test Modal">
                <Text>Content</Text>
            </Modal>
        );
        const output = lastFrame();
        expect(output).toMatch(/Test Modal/);
        expect(output).toMatch(/Content/);
    });

    test('renders hint correctly', () => {
        const { lastFrame } = render(
            <Modal theme={themes.default} title="Title" hint="Press X">
                <Text>Content</Text>
            </Modal>
        );
        const output = lastFrame();
        expect(output).toMatch(/Press X/);
    });

    test('renders trigger key hint correctly', () => {
        const { lastFrame } = render(
            <Modal theme={themes.default} title="Title" triggerKey="M">
                <Text>Content</Text>
            </Modal>
        );
        const output = lastFrame();
        expect(output).toMatch(/Close:.*Esc.*or.*M/);
    });
});
