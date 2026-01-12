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
export type ScanPartialCallback = (root: FileNode) => void;

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

const scanDirectoryInternal = async (
  dirPath: string,
  parent?: FileNode,
  onProgress?: ScanProgressCallback,
  progress?: ScanProgress,
  signal?: AbortSignal,
  onPartial?: ScanPartialCallback,
  root?: FileNode
): Promise<FileNode> => {
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
  const activeRoot = root ?? node;

  activeProgress.currentPath = dirPath;
  if (node.isDirectory) {
    activeProgress.directories += 1;
  } else {
    activeProgress.files += 1;
    activeProgress.bytes += stats.size;
  }
  onProgress?.({ ...activeProgress });
  if (!root) {
    onPartial?.(activeRoot);
  }

  if (node.isDirectory) {
    try {
      const entries = await fs.promises.readdir(dirPath);
      const children: FileNode[] = [];
      node.size = 0;
      for (const entry of entries) {
        if (signal?.aborted) {
          throw new ScanCancelledError();
        }
        const child = await scanDirectoryInternal(
          path.join(dirPath, entry),
          node,
          onProgress,
          activeProgress,
          signal,
          onPartial,
          activeRoot
        );
        children.push(child);
        node.size += child.size;
        onPartial?.(activeRoot);
      }
      node.children = children;
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
      onPartial?.(activeRoot);
    }
  }

  return node;
};

export async function scanDirectory(
  dirPath: string,
  parent?: FileNode,
  onProgress?: ScanProgressCallback,
  progress?: ScanProgress,
  signal?: AbortSignal,
  onPartial?: ScanPartialCallback
): Promise<FileNode> {
  return scanDirectoryInternal(dirPath, parent, onProgress, progress, signal, onPartial);
}
