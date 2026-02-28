// Utility to sanitize strings for safe terminal display
//
// (c) Copyright 2026 Liminal HQ, Scott Morris
// SPDX-License-Identifier: MIT

// Regex to match ANSI escape codes
// Source: https://github.com/chalk/ansi-regex/blob/main/index.js
const ansiRegex = new RegExp(
	[
		'[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)',
		'(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))',
	].join('|'),
	'g',
);

/**
 * Removes ANSI escape codes from a string.
 */
export const stripAnsi = (str: string): string => {
	if (typeof str !== 'string') {
		return str;
	}
	return str.replace(ansiRegex, '');
};

/**
 * Sanitizes a string for display in the terminal.
 * Removes ANSI escape codes and other control characters that could disrupt the UI.
 */
export const sanitize = (str: string): string => {
	if (!str) return '';
	// First strip ANSI codes
	let cleaned = stripAnsi(str);
	// Remove other non-printable control characters (except newlines/tabs if needed, but for filenames usually we want to strip them)
	// eslint-disable-next-line no-control-regex
	cleaned = cleaned.replace(/[\x00-\x09\x0B-\x1F\x7F]/g, '');
	return cleaned;
};
