import React from 'react';
import { render } from 'ink-testing-library';
import { FileList } from '../../src/components/FileList.js';
import { Theme } from '../../src/themes.js';
import { FileNode } from '../../src/scanner.js';
import { describe, it, expect } from '@jest/globals';

const mockTheme: Theme = {
  name: 'test',
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
      documents: 'yellow',
      code: 'green',
      archives: 'blue',
      system: 'gray',
    },
  },
};

const mockFiles: FileNode[] = [
  {
    name: 'dir1',
    path: '/root/dir1',
    size: 1000,
    isDirectory: true,
    mtime: new Date(),
  },
  {
    name: 'file1.txt',
    path: '/root/file1.txt',
    size: 500,
    isDirectory: false,
    mtime: new Date(),
  },
];

describe('FileList', () => {
  it('renders list of files correctly', () => {
    const { lastFrame } = render(
      <FileList
        files={mockFiles}
        selectedIndex={0}
        maxSize={1000}
        theme={mockTheme}
        units="iec"
        viewMode="tree"
        rootPath="/root"
        scanRootPath="/root"
        fileTypeColoursEnabled={true}
        showLegend={false}
        heatmapEnabled={false}
      />
    );

    const output = lastFrame();
    expect(output).toContain('dir1');
    expect(output).toContain('file1.txt');
    expect(output).toContain('100.0%'); // dir1
    expect(output).toContain('50.0%'); // file1
  });
});
