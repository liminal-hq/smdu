#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import meow from 'meow';
import { App } from './App.js';

const cli = meow(
  `
	Usage
	  $ smdu [path]

	Options
	  --theme, -t  Theme (default, dracula)

	Examples
	  $ smdu /var/log
	  $ smdu --theme=dracula
`,
  {
    importMeta: import.meta,
    flags: {
      theme: {
        type: 'string',
        shortFlag: 't',
        default: 'default',
      },
    },
  }
);

const startPath = cli.input[0] || process.cwd();

render(<App startPath={startPath} themeName={cli.flags.theme} />);
