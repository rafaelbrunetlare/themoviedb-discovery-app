import type { Meta, StoryObj } from '@storybook/react-vite';
import AverageDurationWidget from './AverageDurationWidget';

const meta = {
  title: 'Widgets/Durée moyenne',
  component: AverageDurationWidget,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof AverageDurationWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Nominal: Story = {
  args: {
    status: 'success',
    averageDuration: 107,
  },
};

export const Chargement: Story = {
  args: {
    status: 'loading',
  },
};

export const AucuneDonnee: Story = {
  args: {
    status: 'empty',
  },
};

export const Erreur: Story = {
  args: {
    status: 'error',
  },
};
