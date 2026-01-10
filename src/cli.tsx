#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import { Command } from 'commander';
import { App } from './App.js';

const program = new Command();

program
  .name('smdu')
  .description('See My Disk Usage - A clone of ncdu')
  .version('1.0.0')
  .argument('[path]', 'Path to scan', process.cwd())
  .option('-t, --theme <theme>', 'Theme (default, dracula)')
  .option('-u, --units <units>', 'Display units (iec, si)')
  .action((pathStr, options) => {
    // When argument is optional and has default, pathStr is the value.
    // If user provides a path, it's in pathStr.
    // If not, it's process.cwd().

    render(<App startPath={pathStr} themeName={options.theme} units={options.units} />);
  });

program.parse(process.argv);
