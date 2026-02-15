import path from 'path';

export type FileTypeCategory = 'media' | 'documents' | 'code' | 'archives' | 'system';

export interface FileTypeLegendItem {
	category: FileTypeCategory;
	label: string;
}

export const FILE_TYPE_LEGEND: FileTypeLegendItem[] = [
	{ category: 'media', label: 'Media' },
	{ category: 'documents', label: 'Documents' },
	{ category: 'code', label: 'Code' },
	{ category: 'archives', label: 'Archives' },
	{ category: 'system', label: 'System/Config' },
];

const MULTI_PART_EXTENSIONS = ['.tar.gz', '.tar.bz2', '.tar.xz', '.tar.zst'];

const FILE_TYPE_EXTENSIONS: Record<FileTypeCategory, string[]> = {
	media: [
		'png',
		'jpg',
		'jpeg',
		'gif',
		'svg',
		'webp',
		'bmp',
		'tif',
		'tiff',
		'heic',
		'heif',
		'ico',
		'mp3',
		'wav',
		'flac',
		'aac',
		'ogg',
		'm4a',
		'aiff',
		'wma',
		'mp4',
		'mkv',
		'avi',
		'mov',
		'webm',
		'wmv',
		'm4v',
		'mpeg',
		'mpg',
	],
	documents: [
		'pdf',
		'doc',
		'docx',
		'txt',
		'rtf',
		'md',
		'markdown',
		'odt',
		'xls',
		'xlsx',
		'csv',
		'tsv',
		'ppt',
		'pptx',
		'key',
		'pages',
		'numbers',
		'epub',
	],
	code: [
		'js',
		'jsx',
		'ts',
		'tsx',
		'py',
		'go',
		'rs',
		'java',
		'c',
		'cpp',
		'h',
		'hpp',
		'cs',
		'php',
		'rb',
		'swift',
		'kt',
		'scala',
		'sh',
		'bash',
		'zsh',
		'fish',
		'ps1',
		'html',
		'css',
		'scss',
		'sass',
		'less',
		'json',
		'yml',
		'yaml',
		'toml',
		'xml',
		'sql',
		'graphql',
		'gql',
		'vue',
		'svelte',
	],
	archives: [
		'zip',
		'tar',
		'tar.gz',
		'tar.bz2',
		'tar.xz',
		'tar.zst',
		'gz',
		'tgz',
		'bz2',
		'tbz2',
		'xz',
		'7z',
		'rar',
		'zst',
	],
	system: [
		'log',
		'conf',
		'config',
		'ini',
		'cfg',
		'env',
		'bak',
		'tmp',
		'temp',
		'lock',
		'pid',
		'service',
	],
};

const extensionToCategory = new Map<string, FileTypeCategory>();
for (const [category, extensions] of Object.entries(FILE_TYPE_EXTENSIONS) as Array<
	[FileTypeCategory, string[]]
>) {
	for (const extension of extensions) {
		extensionToCategory.set(extension, category);
	}
}

const getExtension = (fileName: string): string | null => {
	const lowerName = fileName.toLowerCase();
	for (const multiPart of MULTI_PART_EXTENSIONS) {
		if (lowerName.endsWith(multiPart)) {
			return multiPart.slice(1);
		}
	}

	const ext = path.extname(lowerName);
	if (!ext) return null;
	return ext.slice(1);
};

export const getFileTypeCategory = (
	fileName: string,
	isDirectory: boolean,
): FileTypeCategory | null => {
	if (isDirectory) return null;
	const baseName = path.basename(fileName.toLowerCase());
	if (baseName.startsWith('.') && baseName.length > 1) {
		return 'system';
	}

	const extension = getExtension(baseName);
	if (!extension) return null;
	return extensionToCategory.get(extension) ?? null;
};
