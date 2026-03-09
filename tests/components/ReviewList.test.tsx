// Component tests for ReviewList rendering in grouped and empty states
//
// (c) Copyright 2026 Liminal HQ, Scott Morris
// SPDX-License-Identifier: MIT

import React from 'react';
import { describe, expect, test } from '@jest/globals';
import { render } from 'ink-testing-library';
import { themes } from '../../src/themes.js';
import { ReviewList } from '../../src/components/ReviewList.js';
import type { FileNode } from '../../src/scanner.js';
import type { ReviewVisibleRow } from '../../src/review/types.js';

const nodeStub: FileNode = {
	name: 'movie.mkv',
	path: '/root/movie.mkv',
	size: 10,
	fileCount: 1,
	isDirectory: false,
	isHidden: false,
	mtime: new Date('2026-03-08T12:00:00Z'),
};

const rows: ReviewVisibleRow[] = [
	{
		kind: 'group',
		group: {
			key: 'type:.mkv',
			label: '.mkv',
			entries: [],
			totalSize: 10,
			itemCount: 1,
			fileCount: 1,
			directoryCount: 0,
			percentOfRoot: 50,
		},
	},
	{
		kind: 'entry',
		groupKey: 'type:.mkv',
		entry: {
			id: '/root/movie.mkv',
			node: nodeStub,
			path: '/root/movie.mkv',
			parentPath: '/root',
			basename: 'movie.mkv',
			kind: 'file',
			size: 10,
			percentOfRoot: 50,
			modifiedAt: new Date('2026-03-08T12:00:00Z'),
			createdAt: new Date('2026-03-01T12:00:00Z'),
			extension: '.mkv',
			inferredType: 'media',
			fileCount: 1,
			directoryCount: 0,
			sourceRoot: '/root',
			depthFromRoot: 1,
			isHidden: false,
			isHiddenByAncestry: false,
			isEffectivelyHidden: false,
			ageBucket: 'today',
		},
	},
];

describe('ReviewList', () => {
	test('renders grouped rows', () => {
		const { lastFrame } = render(
			<ReviewList
				rows={rows}
				selectedIndex={0}
				theme={themes.default}
				units="iec"
				rootPath="/root"
			/>,
		);
		const output = lastFrame();
		expect(output).toContain('Path');
		expect(output).toContain('.mkv');
		expect(output).toContain('movie.mkv');
	});

	test('renders empty state', () => {
		const { lastFrame } = render(
			<ReviewList
				rows={[]}
				selectedIndex={0}
				theme={themes.default}
				units="iec"
				rootPath="/root"
			/>,
		);
		const output = lastFrame();
		expect(output).toContain('No review results for current filters.');
	});
});
