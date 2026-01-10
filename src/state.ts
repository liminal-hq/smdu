import { useState, useCallback, useMemo } from 'react';
import { FileNode } from './scanner.js';
import fs from 'fs';

export type SortField = 'name' | 'size';
export type SortOrder = 'asc' | 'desc';

export interface FileSystemState {
  currentPath: string;
  currentNode: FileNode | null;
  selectionIndex: number;
  sortBy: SortField;
  sortOrder: SortOrder;
  files: FileNode[];
}

export const useFileSystem = (initialNode: FileNode | null) => {
  const [currentNode, setCurrentNode] = useState<FileNode | null>(initialNode);
  const [selectionIndex, setSelectionIndex] = useState(0);
  const [sortBy, setSortBy] = useState<SortField>('size');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [error, setError] = useState<string | null>(null);

  if (initialNode && !currentNode) {
    setCurrentNode(initialNode);
  }

  const files = useMemo(() => {
    if (!currentNode || !currentNode.children) return [];

    const sorted = [...currentNode.children].sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else {
        comparison = a.size - b.size;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [currentNode, sortBy, sortOrder]);

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

        // State update - Mutate in place to preserve tree consistency
        const index = currentNode.children.indexOf(fileToDelete);
        if (index > -1) {
            currentNode.children.splice(index, 1);
        }

        // Propagate size change
        const sizeDiff = -fileToDelete.size;
        updateSizeUpwards(currentNode, sizeDiff);

        // Force re-render by creating a shallow copy
        setCurrentNode({ ...currentNode });

        if (selectionIndex >= currentNode.children.length) {
            setSelectionIndex(Math.max(0, currentNode.children.length - 1));
        }
      } catch (err: any) {
        setError(`Failed to delete: ${err.message}`);
      }

  }, [currentNode, files, selectionIndex]);

  return {
    currentNode,
    files,
    selectionIndex,
    sortBy,
    sortOrder,
    error,
    moveSelection,
    enterDirectory,
    goUp,
    toggleSort,
    deleteSelected
  };
};
