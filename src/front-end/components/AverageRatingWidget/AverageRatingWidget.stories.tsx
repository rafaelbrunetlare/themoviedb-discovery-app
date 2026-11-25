import type { Meta, StoryObj } from '@storybook/react-vite';
import AverageRatingWidget from './AverageRatingWidget';

const meta = {
  title: 'Widgets/Note moyenne',
  component: AverageRatingWidget,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof AverageRatingWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Nominale: Story = {
  args: {
    status: 'success',
    averageRating: 6.78,
    method: 'simple',
  },
};

export const NotePonderee: Story = {
  args: {
    status: 'success',
    averageRating: 6.91,
    method: 'weighted',
  },
};

export const Chargement: Story = {
  args: {
    status: 'loading',
  },
};

export const SansNotes: Story = {
  args: {
    status: 'empty',
  },
};

export const Erreur: Story = {
  args: {
    status: 'error',
  },
};
