import fs from 'fs';
import path from 'path';

export interface FileNode {
  name: string;
  path: string;
  size: number;
  isDirectory: boolean;
  children?: FileNode[];
  parent?: FileNode;
  mtime: Date;
}

export async function scanDirectory(
  dirPath: string,
  parent?: FileNode
): Promise<FileNode> {
  const stats = await fs.promises.lstat(dirPath);
  const name = path.basename(dirPath) || dirPath;

  const node: FileNode = {
    name,
    path: dirPath,
    size: stats.size,
    isDirectory: stats.isDirectory(),
    mtime: stats.mtime,
    parent,
  };

  if (node.isDirectory) {
    try {
      const entries = await fs.promises.readdir(dirPath);
      const childrenPromises = entries.map((entry) =>
        scanDirectory(path.join(dirPath, entry), node)
      );
      node.children = await Promise.all(childrenPromises);

      // Accumulate size from children
      node.size = node.children.reduce((acc, child) => acc + child.size, 0);
    } catch (error) {
      // Handle permission errors or other access issues gracefully
      // console.error(`Could not read directory ${dirPath}:`, error);
      node.children = [];
    }
  }

  return node;
}
