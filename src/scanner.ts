import fs from 'fs';
import path from 'path';

export interface FileNode {
  name: string;
  path: string;
  size: number;
  isDirectory: boolean;
  isHidden: boolean;
  children?: FileNode[];
  parent?: FileNode;
  mtime: Date;
}

export interface ScanProgress {
  currentPath: string;
  directories: number;
  files: number;
  bytes: number;
  errors: number;
}

export type ScanProgressCallback = (progress: ScanProgress) => void;

export class ScanCancelledError extends Error {
  constructor() {
    super('Scan cancelled');
    this.name = 'ScanCancelledError';
  }
}

const isHiddenName = (name: string): boolean => {
  if (name === '.' || name === '..') return false;
  return name.startsWith('.');
};

export async function scanDirectory(
  dirPath: string,
  parent?: FileNode,
  onProgress?: ScanProgressCallback,
  progress?: ScanProgress,
  signal?: AbortSignal
): Promise<FileNode> {
  if (signal?.aborted) {
    throw new ScanCancelledError();
  }

  const stats = await fs.promises.lstat(dirPath);
  const name = path.basename(dirPath) || dirPath;
  const activeProgress: ScanProgress = progress ?? {
    currentPath: dirPath,
    directories: 0,
    files: 0,
    bytes: 0,
    errors: 0,
  };

  const node: FileNode = {
    name,
    path: dirPath,
    size: stats.size,
    isDirectory: stats.isDirectory(),
    isHidden: isHiddenName(name),
    mtime: stats.mtime,
    parent,
  };

  activeProgress.currentPath = dirPath;
  if (node.isDirectory) {
    activeProgress.directories += 1;
  } else {
    activeProgress.files += 1;
    activeProgress.bytes += stats.size;
  }
  onProgress?.({ ...activeProgress });

  if (node.isDirectory) {
    try {
      const entries = await fs.promises.readdir(dirPath);
      const children: FileNode[] = [];
      for (const entry of entries) {
        if (signal?.aborted) {
          throw new ScanCancelledError();
        }
        const child = await scanDirectory(path.join(dirPath, entry), node, onProgress, activeProgress, signal);
        children.push(child);
      }
      node.children = children;

      // Accumulate size from children
      node.size = node.children.reduce((acc, child) => acc + child.size, 0);
    } catch (error) {
      if (error instanceof ScanCancelledError) {
        throw error;
      }
      // Handle permission errors or other access issues gracefully
      // console.error(`Could not read directory ${dirPath}:`, error);
      node.children = [];
      activeProgress.errors += 1;
      activeProgress.currentPath = dirPath;
      onProgress?.({ ...activeProgress });
    }
  }

  return node;
}
