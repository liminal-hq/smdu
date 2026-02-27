// Define built-in UI themes and colour tokens for terminal rendering
//
// (c) Copyright 2026 Liminal HQ, Scott Morris
// SPDX-License-Identifier: MIT

export interface Theme {
	name: string;
	colours: {
		text: string;
		selectedText: string;
		background: string;
		highlight: string;
		bar: string;
		barEmpty: string;
		header: string;
		footer: string;
		size: string;
		percentage: string;
		muted: string;
		line: string;
		accent: string;
		fileTypes: {
			media: string;
			text: string;
			documents: string;
			code: string;
			scripts: string;
			executables: string;
			archives: string;
			diskImages: string;
			system: string;
		};
		scanStatus: {
			scanning: string;
			done: string;
		};
	};
}

export const themes: Record<string, Theme> = {
	default: {
		name: 'default',
		colours: {
			text: '#d2d8e1',
			selectedText: '#e6ebf2',
			background: '#1b1f24',
			highlight: '#2a3340',
			bar: '#2ec66a',
			barEmpty: '#3b434f',
			header: '#9aa4b2',
			footer: '#9aa4b2',
			size: '#d5dbe4',
			percentage: '#7c8796',
			muted: '#7c8796',
			line: '#2e3540',
			accent: '#5aa2ff',
			fileTypes: {
				media: '#ffb454',
				text: '#b0f2c2',
				documents: '#ffd166',
				code: '#7dd3fc',
				scripts: '#86efac',
				executables: '#fca5a5',
				archives: '#c4a7e7',
				diskImages: '#f38ba8',
				system: '#94a3b8',
			},
			scanStatus: {
				scanning: '#ffd166',
				done: '#2ec66a',
			},
		},
	},
	classic: {
		name: 'classic',
		colours: {
			text: 'white',
			selectedText: 'black',
			background: 'black',
			highlight: 'cyan',
			bar: 'green',
			barEmpty: 'gray',
			header: 'yellow',
			footer: 'white',
			size: 'yellow',
			percentage: 'white',
			muted: 'gray',
			line: 'gray',
			accent: 'cyan',
			fileTypes: {
				media: 'red',
				text: 'white',
				documents: 'yellow',
				code: 'green',
				scripts: 'green',
				executables: 'red',
				archives: 'blue',
				diskImages: 'magenta',
				system: 'gray',
			},
			scanStatus: {
				scanning: 'yellow',
				done: 'green',
			},
		},
	},
	dracula: {
		name: 'dracula',
		colours: {
			text: '#f8f8f2',
			selectedText: '#282a36',
			background: '#282a36',
			highlight: '#bd93f9', // Purple
			bar: '#ff79c6', // Pink
			barEmpty: '#44475a',
			header: '#f1fa8c', // Yellow
			footer: '#6272a4', // Comment
			size: '#8be9fd', // Cyan
			percentage: '#ffb86c', // Orange
			muted: '#6272a4', // Comment
			line: '#44475a',
			accent: '#8be9fd',
			fileTypes: {
				media: '#ff5555', // Red
				text: '#f8f8f2', // Foreground
				documents: '#f1fa8c', // Yellow
				code: '#50fa7b', // Green
				scripts: '#50fa7b', // Green
				executables: '#ff5555', // Red
				archives: '#8be9fd', // Cyan
				diskImages: '#ff79c6', // Pink
				system: '#6272a4', // Comment
			},
			scanStatus: {
				scanning: '#f1fa8c', // Yellow
				done: '#50fa7b', // Green
			},
		},
	},
};

const baseThemeOrder = ['default', 'classic', 'dracula'];

export const themeNames = [
	...baseThemeOrder,
	...Object.keys(themes).filter((name) => !baseThemeOrder.includes(name)),
];

export const getTheme = (name: string): Theme => {
	return themes[name.toLowerCase()] || themes.default;
};
