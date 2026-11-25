import type { Meta, StoryObj } from '@storybook/react-vite';
import MoviesDashboardPage from './MoviesDashboardPage';

const meta = {
  title: 'Pages/Tableau de bord des films',
  component: MoviesDashboardPage,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof MoviesDashboardPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SansWidgets: Story = {};

export const ThemeSombre: Story = {
  globals: {
    theme: 'dark',
  },
};
