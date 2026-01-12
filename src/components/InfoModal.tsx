import React, { useEffect, useMemo, useState } from 'react';
import { Box, Text, useStdout } from 'ink';
import fs from 'fs';
import os from 'os';
import { fileTypeFromFile } from 'file-type';
import { format, formatDistanceToNow } from 'date-fns';
import { filesize } from 'filesize';
import { Theme } from '../themes.js';
import { FileNode } from '../scanner.js';
import { Modal } from './Modal.js';

interface InfoModalProps {
  theme: Theme;
  node: FileNode;
}

interface InfoDetails {
  stats: fs.Stats;
  typeLabel: string;
}

const formatPermissions = (mode: number): { octal: string; rwx: string } => {
  const trimmed = mode & 0o777;
  const octal = trimmed.toString(8).padStart(3, '0');
  let rwx = '';
  const flags = ['r', 'w', 'x'];
  for (const shift of [6, 3, 0]) {
    const triad = (trimmed >> shift) & 0o7;
    for (let index = 0; index < 3; index += 1) {
      rwx += (triad & (0o4 >> index)) ? flags[index] : '-';
    }
  }
  return { octal, rwx };
};

const formatDate = (date: Date): string => {
  return `${format(date, 'yyyy-MM-dd HH:mm')} (${formatDistanceToNow(date, { addSuffix: true })})`;
};

const getOwnerLabel = (uid: number): string => {
  if (typeof process.getuid !== 'function') {
    return uid.toString();
  }
  try {
    if (uid === process.getuid()) {
      return `${os.userInfo().username} (${uid})`;
    }
  } catch {
    return uid.toString();
  }
  return uid.toString();
};

const getGroupLabel = (gid: number): string => {
  if (typeof process.getgid !== 'function') {
    return gid.toString();
  }
  if (gid === process.getgid()) {
    return `${gid} (current)`;
  }
  return gid.toString();
};

const calculateDirectoryStats = (node: FileNode): { directCount: number; totalCount: number; depth: number } => {
  const directCount = node.children?.length ?? 0;
  let totalCount = 0;
  let depth = 0;

  const walk = (current: FileNode, currentDepth: number) => {
    depth = Math.max(depth, currentDepth);
    if (!current.children) return;
    for (const child of current.children) {
      totalCount += 1;
      walk(child, currentDepth + 1);
    }
  };

  walk(node, 0);
  return { directCount, totalCount, depth };
};

export const InfoModal: React.FC<InfoModalProps> = ({ theme, node }) => {
  const { stdout } = useStdout();
  const totalColumns = stdout?.columns ?? process.stdout.columns ?? 80;
  const totalRows = stdout?.rows ?? process.stdout.rows ?? 24;
  const modalWidth = Math.min(76, Math.max(44, totalColumns - 6));
  const modalHeight = Math.min(22, Math.max(12, totalRows - 6));
  const labelWidth = Math.max(16, Math.floor(modalWidth * 0.34));
  const valueWidth = Math.max(20, modalWidth - labelWidth - 4);

  const [details, setDetails] = useState<InfoDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const loadDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const stats = await fs.promises.lstat(node.path);
        let typeLabel = 'Unknown';
        if (stats.isSymbolicLink()) {
          typeLabel = 'Symbolic link';
        } else if (stats.isDirectory()) {
          typeLabel = 'Directory';
        } else {
          try {
            const fileType = await fileTypeFromFile(node.path);
            if (fileType) {
              typeLabel = `${fileType.mime} (${fileType.ext})`;
            }
          } catch {
            typeLabel = 'Unknown';
          }
        }
        if (!cancelled) {
          setDetails({ stats, typeLabel });
          setLoading(false);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message ?? 'Unable to load file details.');
          setLoading(false);
        }
      }
    };

    loadDetails();
    return () => {
      cancelled = true;
    };
  }, [node.path]);

  const rows = useMemo(() => {
    if (!details) return [];
    const sizeBytes = node.isDirectory ? node.size : details.stats.size;
    const sizeIec = filesize(sizeBytes, { base: 2, standard: 'iec' });
    const sizeSi = filesize(sizeBytes, { base: 10, standard: 'si' });
    const sizeRaw = sizeBytes.toLocaleString('en-CA');
    const permissions = formatPermissions(details.stats.mode);
    const owner = getOwnerLabel(details.stats.uid);
    const group = getGroupLabel(details.stats.gid);
    const dateRows = [
      { label: 'Created', value: formatDate(details.stats.birthtime) },
      { label: 'Modified', value: formatDate(details.stats.mtime) },
      { label: 'Accessed', value: formatDate(details.stats.atime) },
    ];

    const baseRows = [
      { label: 'Path', value: node.path },
      { label: 'Type', value: details.typeLabel },
      { label: 'Size', value: `${sizeRaw} B | ${sizeSi} (SI) | ${sizeIec} (IEC)` },
      { label: 'Permissions', value: `${permissions.octal} (${permissions.rwx})` },
      { label: 'Owner/Group', value: `${owner} / ${group}` },
      ...dateRows,
    ];

    if (node.isDirectory) {
      const { directCount, totalCount, depth } = calculateDirectoryStats(node);
      baseRows.splice(3, 0, {
        label: 'Items',
        value: `${directCount} direct | ${totalCount} total`,
      });
      baseRows.splice(4, 0, {
        label: 'Depth',
        value: depth.toString(),
      });
    }

    return baseRows;
  }, [details, node]);

  return (
    <Modal
      theme={theme}
      title="Information"
      hint="Close: i or Esc"
      width={modalWidth}
      height={modalHeight}
    >
      {loading ? (
        <Text color={theme.colours.text}>Loading details...</Text>
      ) : error ? (
        <Text color="red">{error}</Text>
      ) : (
        rows.map((row) => (
          <Box key={row.label} width="100%">
            <Box width={labelWidth}>
              <Text color={theme.colours.text} wrap="truncate-end">{row.label}</Text>
            </Box>
            <Box width={valueWidth}>
              <Text color={theme.colours.size} wrap="truncate-end">{row.value}</Text>
            </Box>
          </Box>
        ))
      )}
    </Modal>
  );
};
