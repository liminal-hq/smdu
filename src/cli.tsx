#!/usr/bin/env node
// CLI entrypoint that parses options and renders the Ink app
//
// (c) Copyright 2026 Liminal HQ, Scott Morris
// SPDX-License-Identifier: MIT

import React from 'react';
import { render } from 'ink';
import { Command } from 'commander';
import { App } from './App.js';
import { VERSION } from './version.js';

const program = new Command();

program
	.name('smdu')
	.description('See My Disk Usage - A clone of ncdu')
	.version(VERSION, '-v, --version')
	.argument('[paths...]', 'Path to scan')
	.option('-t, --theme <theme>', 'Theme (default, classic, dracula)')
	.option('-u, --units <units>', 'Display units (iec, si)')
	.option('--no-fullscreen', 'Do not use alternate screen buffer')
	.action((paths: string[], options) => {
		const pathStr = paths.length > 0 ? paths[0] : process.cwd();

		if (paths.length > 1) {
			console.error(
				'Error: smdu only supports scanning one path at a time.\n' +
					`Received ${paths.length} paths: ${paths.join(', ')}\n\n` +
					'If you used a glob (e.g. smdu cat*), the shell expanded it into multiple arguments.\n' +
					'Quote the path to pass it literally: smdu "cat*"\n\n' +
					'Multi-path scanning is tracked in https://github.com/liminal-hq/smdu/issues/95',
			);
			process.exitCode = 1;
			return;
		}

		const useFullscreen = options.fullscreen !== false;
		const hasTty = process.stdout.isTTY;
		const shouldUseAltBuffer = useFullscreen && hasTty;

		if (shouldUseAltBuffer) {
			process.stdout.write('\u001b[?1049h');
		}

		const handleSuspend = () => {
			if (shouldUseAltBuffer) {
				process.stdout.write('\u001b[?1049l');
			}
			process.stdin.setRawMode?.(false);
			process.kill(process.pid, 'SIGTSTP');
		};

		process.on('SIGCONT', () => {
			process.stdin.setRawMode?.(true);
			process.stdin.resume();
			if (shouldUseAltBuffer) {
				process.stdout.write('\u001b[?1049h');
			}
		});

		const instance = render(
			<App
				startPath={pathStr}
				themeName={options.theme}
				units={options.units}
				onSuspend={handleSuspend}
			/>,
		);

		if (shouldUseAltBuffer) {
			const restoreAltBuffer = () => {
				process.stdout.write('\u001b[?1049l');
			};

			instance.waitUntilExit().then(restoreAltBuffer);
			process.once('exit', restoreAltBuffer);
		}
	});

program.parse(process.argv);
