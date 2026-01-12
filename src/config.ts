import Conf from 'conf';

export interface ConfigSchema {
  theme: string;
  units: 'iec' | 'si';
  fileTypeColoursEnabled: boolean;
  showHiddenFiles: boolean;
}

// Create a new configuration instance
// 'smdu' project name will be used for storage path
const config = new Conf<ConfigSchema>({
  projectName: 'smdu',
  defaults: {
    theme: 'default',
    units: 'iec',
    fileTypeColoursEnabled: true,
    showHiddenFiles: false,
  },
});

export const getThemeFromConfig = (): string => {
  return config.get('theme');
};

export const setThemeInConfig = (theme: string): void => {
  config.set('theme', theme);
};

export const getUnitsFromConfig = (): 'iec' | 'si' => {
  return config.get('units');
};

export const setUnitsInConfig = (units: 'iec' | 'si'): void => {
  config.set('units', units);
};

export const getFileTypeColoursEnabledFromConfig = (): boolean => {
  return config.get('fileTypeColoursEnabled');
};

export const setFileTypeColoursEnabledInConfig = (enabled: boolean): void => {
  config.set('fileTypeColoursEnabled', enabled);
};

export const getShowHiddenFilesFromConfig = (): boolean => {
  return config.get('showHiddenFiles');
};

export const setShowHiddenFilesInConfig = (enabled: boolean): void => {
  config.set('showHiddenFiles', enabled);
};

export const getConfigPath = (): string => {
  return config.path;
};
