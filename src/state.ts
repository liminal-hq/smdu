import { useEffect, useState, useCallback, useMemo } from 'react';
import { FileNode } from './scanner.js';
import fs from 'fs';

export type SortField = 'name' | 'size';
export type SortOrder = 'asc' | 'desc';
export type ViewMode = 'tree' | 'flat';

export interface FileSystemState {
  currentPath: string;
  currentNode: FileNode | null;
  selectionIndex: number;
  sortBy: SortField;
  sortOrder: SortOrder;
  viewMode: ViewMode;
  files: FileNode[];
}

export const useFileSystem = (initialNode: FileNode | null, showHiddenFiles = false) => {
  const [currentNode, setCurrentNode] = useState<FileNode | null>(initialNode);
  const [selectionIndex, setSelectionIndex] = useState(0);
  const [sortBy, setSortBy] = useState<SortField>('size');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [viewMode, setViewMode] = useState<ViewMode>('flat');
  const [error, setError] = useState<string | null>(null);

  if (initialNode && !currentNode) {
    setCurrentNode(initialNode);
  }

  const compareNodes = useCallback((a: FileNode, b: FileNode) => {
    let comparison = 0;
    if (sortBy === 'name') {
      comparison = a.name.localeCompare(b.name);
    } else {
      comparison = a.size - b.size;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  }, [sortBy, sortOrder]);

  const flattenTree = useCallback((node: FileNode): FileNode[] => {
    if (!node.children) return [];
    const collected: FileNode[] = [];
    const stack: Array<{ children: FileNode[]; index: number }> = [
      {
        children: [...node.children]
          .filter((child) => showHiddenFiles || !child.isHidden)
          .sort(compareNodes),
        index: 0,
      },
    ];

    while (stack.length > 0) {
      const frame = stack[stack.length - 1];
      if (frame.index >= frame.children.length) {
        stack.pop();
        continue;
      }

      const child = frame.children[frame.index++];
      collected.push(child);

      if (child.isDirectory && child.children && child.children.length > 0) {
        const visibleChildren = showHiddenFiles
          ? child.children
          : child.children.filter((entry) => !entry.isHidden);
        if (visibleChildren.length > 0) {
          stack.push({ children: [...visibleChildren].sort(compareNodes), index: 0 });
        }
      }
    }

    return collected;
  }, [compareNodes, showHiddenFiles]);

  const files = useMemo(() => {
    if (!currentNode) return [];

    if (viewMode === 'flat') {
      const list = currentNode.children ? [...currentNode.children] : [];
      const visible = showHiddenFiles ? list : list.filter((entry) => !entry.isHidden);
      return visible.sort(compareNodes);
    }

    if (viewMode === 'tree') {
      return flattenTree(currentNode);
    }
    return [];
  }, [currentNode, sortBy, sortOrder, viewMode, flattenTree, compareNodes, showHiddenFiles]);

  const moveSelection = useCallback((delta: number) => {
    setSelectionIndex((prev) => {
      const next = prev + delta;
      if (next < 0) return 0;
      if (next >= files.length) return Math.max(0, files.length - 1);
      return next;
    });
  }, [files.length]);

  const enterDirectory = useCallback(() => {
    const selectedFile = files[selectionIndex];
    if (selectedFile && selectedFile.isDirectory) {
      setCurrentNode(selectedFile);
      setSelectionIndex(0);
    }
  }, [files, selectionIndex]);

  const goUp = useCallback(() => {
    if (currentNode?.parent) {
      setCurrentNode(currentNode.parent);
      setSelectionIndex(0);
    }
  }, [currentNode]);

  const toggleSort = useCallback((field: SortField) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  }, [sortBy]);

  const toggleViewMode = useCallback(() => {
    const order: ViewMode[] = ['flat', 'tree'];
    setViewMode((prev) => {
      const index = order.indexOf(prev);
      const next = order[(index + 1) % order.length];
      return next ?? 'flat';
    });
    setSelectionIndex(0);
  }, []);

  const updateSizeUpwards = (node: FileNode, delta: number) => {
    let curr: FileNode | undefined = node;
    while (curr) {
      curr.size += delta;
      curr = curr.parent;
    }
  };

  const deleteSelected = useCallback(async () => {
      if (!currentNode || !currentNode.children) return;

      const fileToDelete = files[selectionIndex];
      if (!fileToDelete) return;

      try {
        // Actual deletion
        await fs.promises.rm(fileToDelete.path, { recursive: true, force: true });

        const parentNode = fileToDelete.parent ?? currentNode;
        if (!parentNode.children) return;

        // State update - Mutate in place to preserve tree consistency
        const index = parentNode.children.indexOf(fileToDelete);
        if (index > -1) {
            parentNode.children.splice(index, 1);
        }

        // Propagate size change
        const sizeDiff = -fileToDelete.size;
        updateSizeUpwards(parentNode, sizeDiff);

        // Force re-render by creating a shallow copy
        setCurrentNode({ ...currentNode });

        setSelectionIndex((prev) => Math.max(0, Math.min(prev, files.length - 2)));
      } catch (err: any) {
        setError(`Failed to delete: ${err.message}`);
      }

  }, [currentNode, files, selectionIndex]);

  useEffect(() => {
    setSelectionIndex((prev) => {
      if (files.length === 0) return 0;
      return Math.min(prev, files.length - 1);
    });
  }, [files.length]);

  return {
    currentNode,
    files,
    selectionIndex,
    sortBy,
    sortOrder,
    viewMode,
    error,
    moveSelection,
    enterDirectory,
    goUp,
    toggleSort,
    toggleViewMode,
    deleteSelected
  };
};
