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
	.argument('[path]', 'Path to scan', process.cwd())
	.option('-t, --theme <theme>', 'Theme (default, classic, dracula)')
	.option('-u, --units <units>', 'Display units (iec, si)')
	.option('--no-fullscreen', 'Do not use alternate screen buffer')
	.action((pathStr, options) => {
		// When argument is optional and has default, pathStr is the value.
		// If user provides a path, it's in pathStr.
		// If not, it's process.cwd().

		const useFullscreen = options.fullscreen !== false;
		const hasTty = process.stdout.isTTY;
		const shouldUseAltBuffer = useFullscreen && hasTty;

		if (shouldUseAltBuffer) {
			process.stdout.write('\u001b[?1049h');
		}

		const instance = render(
			<App startPath={pathStr} themeName={options.theme} units={options.units} />,
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
