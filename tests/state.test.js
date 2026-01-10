/**
 * @jest-environment jsdom
 */
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
// Mock fs
const mockRm = jest.fn();
jest.unstable_mockModule('fs', () => ({
    default: {
        promises: {
            rm: mockRm,
        },
    },
    promises: {
        rm: mockRm,
    }
}));
// Import dynamically after mocking
const { useFileSystem } = await import('../src/state.js');
const { FileNode } = await import('../src/scanner.js');
// Helper to create nodes
const createNode = (name, size, isDirectory, children = []) => {
    const node = {
        name,
        path: `/${name}`,
        size,
        isDirectory,
        children,
        mtime: new Date(),
        parent: undefined,
    };
    children.forEach(c => c.parent = node);
    return node;
};
describe('useFileSystem', () => {
    let root;
    beforeEach(() => {
        jest.clearAllMocks();
        const file1 = createNode('file1.txt', 100, false);
        const file2 = createNode('file2.txt', 200, false);
        const dir1 = createNode('dir1', 300, true, [createNode('subfile.txt', 50, false)]);
        root = createNode('root', 600, true, [file1, file2, dir1]);
    });
    it('should initialize with correct default state', () => {
        const { result } = renderHook(() => useFileSystem(root));
        expect(result.current.currentNode).toBe(root);
        expect(result.current.selectionIndex).toBe(0);
        expect(result.current.files).toHaveLength(2);
        expect(result.current.files[0].name).toBe('dir1'); // 300
    });
    it('should move selection', () => {
        const { result } = renderHook(() => useFileSystem(root));
        act(() => {
            result.current.moveSelection(1);
        });
        expect(result.current.selectionIndex).toBe(1);
    });
    it('should sort by name', () => {
        const { result } = renderHook(() => useFileSystem(root));
        act(() => {
            result.current.toggleSort('name');
        });
        expect(result.current.sortBy).toBe('name');
        // Default to desc, so file2.txt > file1.txt > dir1 (tree order)
        expect(result.current.files[0].name).toBe('file2.txt');
    });
    it('should enter directory and go up', () => {
        const { result } = renderHook(() => useFileSystem(root));
        act(() => {
            result.current.enterDirectory();
        });
        expect(result.current.currentNode?.name).toBe('dir1');
        act(() => {
            result.current.goUp();
        });
        expect(result.current.currentNode?.name).toBe('root');
    });
    it('should delete selected item and update size upwards', async () => {
        const { result } = renderHook(() => useFileSystem(root));
        // root children: dir1 (300), file2 (200), file1 (100)
        // Select file2 (index 1)
        act(() => {
            result.current.moveSelection(1);
        });
        expect(result.current.files[result.current.selectionIndex].name).toBe('file2.txt');
        // Mock rm success
        mockRm.mockResolvedValue(undefined);
        await act(async () => {
            await result.current.deleteSelected();
        });
        expect(mockRm).toHaveBeenCalledWith('/file2.txt', { recursive: true, force: true });
        expect(result.current.files).toHaveLength(3);
        expect(result.current.files.find((f) => f.name === 'file2.txt')).toBeUndefined();
        // Size should update for currentNode (root)
        expect(result.current.currentNode?.size).toBe(400); // 600 - 200
    });
});
