import type { Preview } from '@storybook/react';
import '../src/styles.module.scss';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      options: {
        light: { name: 'Light', value: '#ffffff' },
        dark: { name: 'Dark', value: '#1a1a1a' },
      },
    },
  },
  initialGlobals: {
    backgrounds: { value: 'light' },
    viewport: { value: 'reset' },
    measureEnabled: false,
    outline: false,
  },
};

export default preview;
