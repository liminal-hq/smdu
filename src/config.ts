import Conf from 'conf';

export interface ConfigSchema {
  theme: string;
}

// Create a new configuration instance
// 'smdu' project name will be used for storage path
const config = new Conf<ConfigSchema>({
  projectName: 'smdu',
  defaults: {
    theme: 'default',
  },
});

export const getThemeFromConfig = (): string => {
  return config.get('theme');
};

export const setThemeInConfig = (theme: string): void => {
  config.set('theme', theme);
};

export const getConfigPath = (): string => {
  return config.path;
};
