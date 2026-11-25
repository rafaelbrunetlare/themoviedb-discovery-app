import type { Preview } from '@storybook/react-vite';
import '../src/front-end/global.css';
import '../src/front-end/app.css';

const preview = {
  globalTypes: {
    theme: {
      description: 'Thème de la prévisualisation',
      toolbar: {
        title: 'Thème',
        icon: 'circlehollow',
        items: [
          { value: 'light', title: 'Clair' },
          { value: 'dark', title: 'Sombre' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: 'light',
  },
  decorators: [
    (Story, context) => {
      document.documentElement.dataset.theme =
        context.globals.theme === 'dark' ? 'dark' : 'light';
      return <Story />;
    },
  ],
} satisfies Preview;

export default preview;
