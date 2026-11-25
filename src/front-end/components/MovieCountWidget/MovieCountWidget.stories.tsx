import type { Meta, StoryObj } from '@storybook/react-vite';
import MovieCountWidget from './MovieCountWidget';

const meta = {
  title: 'Widgets/Films en base',
  component: MovieCountWidget,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof MovieCountWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Chargement: Story = {
  args: {
    status: 'loading',
  },
};

export const FilmsDisponibles: Story = {
  args: {
    status: 'success',
    count: 248,
  },
};

export const BaseVide: Story = {
  args: {
    status: 'success',
    count: 0,
  },
};

export const Erreur: Story = {
  args: {
    status: 'error',
  },
};
