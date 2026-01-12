export interface Theme {
  name: string;
  colours: {
    text: string;
    selectedText: string;
    background: string;
    highlight: string;
    bar: string;
    barEmpty: string;
    header: string;
    footer: string;
    size: string;
    percentage: string;
    muted: string;
    line: string;
    accent: string;
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
      text: '#d2d8e1',
      selectedText: '#e6ebf2',
      background: '#1b1f24',
      highlight: '#2a3340',
      bar: '#2ec66a',
      barEmpty: '#3b434f',
      header: '#9aa4b2',
      footer: '#9aa4b2',
      size: '#d5dbe4',
      percentage: '#7c8796',
      muted: '#7c8796',
      line: '#2e3540',
      accent: '#5aa2ff',
      fileTypes: {
        media: '#ffb454',
        documents: '#ffd166',
        code: '#7dd3fc',
        archives: '#c4a7e7',
        system: '#94a3b8',
      },
    },
  },
  classic: {
    name: 'classic',
    colours: {
      text: 'white',
      selectedText: 'black',
      background: 'black',
      highlight: 'cyan',
      bar: 'green',
      barEmpty: 'gray',
      header: 'yellow',
      footer: 'white',
      size: 'yellow',
      percentage: 'white',
      muted: 'gray',
      line: 'gray',
      accent: 'cyan',
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
      barEmpty: '#44475a',
      header: '#f1fa8c', // Yellow
      footer: '#6272a4', // Comment
      size: '#8be9fd', // Cyan
      percentage: '#ffb86c', // Orange
      muted: '#6272a4', // Comment
      line: '#44475a',
      accent: '#8be9fd',
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
