export interface Theme {
  name: string;
  colors: {
    text: string;
    selectedText: string;
    background: string;
    highlight: string;
    bar: string;
    header: string;
    footer: string;
    size: string;
    percentage: string;
  };
}

export const themes: Record<string, Theme> = {
  default: {
    name: 'default',
    colors: {
      text: 'white',
      selectedText: 'black',
      background: 'black',
      highlight: 'cyan',
      bar: 'green',
      header: 'yellow',
      footer: 'white',
      size: 'yellow',
      percentage: 'white',
    },
  },
  dracula: {
    name: 'dracula',
    colors: {
      text: '#f8f8f2',
      selectedText: '#282a36',
      background: '#282a36',
      highlight: '#bd93f9', // Purple
      bar: '#ff79c6', // Pink
      header: '#f1fa8c', // Yellow
      footer: '#6272a4', // Comment
      size: '#8be9fd', // Cyan
      percentage: '#ffb86c', // Orange
    },
  },
};

export const getTheme = (name: string): Theme => {
  return themes[name.toLowerCase()] || themes.default;
};
