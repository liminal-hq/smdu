export interface Theme {
  name: string;
  colours: {
    text: string;
    selectedText: string;
    background: string;
    highlight: string;
    bar: string;
    header: string;
    footer: string;
    size: string;
    percentage: string;
    fileTypes: {
      media: string;
      documents: string;
      code: string;
      archives: string;
      system: string;
    };
  };
}

export const themes: Record<string, Theme> = {
  default: {
    name: 'default',
    colours: {
      text: 'white',
      selectedText: 'black',
      background: 'black',
      highlight: 'cyan',
      bar: 'green',
      header: 'yellow',
      footer: 'white',
      size: 'yellow',
      percentage: 'white',
      fileTypes: {
        media: 'red',
        documents: 'yellow',
        code: 'green',
        archives: 'blue',
        system: 'gray',
      },
    },
  },
  dracula: {
    name: 'dracula',
    colours: {
      text: '#f8f8f2',
      selectedText: '#282a36',
      background: '#282a36',
      highlight: '#bd93f9', // Purple
      bar: '#ff79c6', // Pink
      header: '#f1fa8c', // Yellow
      footer: '#6272a4', // Comment
      size: '#8be9fd', // Cyan
      percentage: '#ffb86c', // Orange
      fileTypes: {
        media: '#ff5555', // Red
        documents: '#f1fa8c', // Yellow
        code: '#50fa7b', // Green
        archives: '#8be9fd', // Cyan
        system: '#6272a4', // Comment
      },
    },
  },
};

export const getTheme = (name: string): Theme => {
  return themes[name.toLowerCase()] || themes.default;
};
