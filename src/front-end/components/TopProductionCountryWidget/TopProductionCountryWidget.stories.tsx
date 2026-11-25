import type { Meta, StoryObj } from '@storybook/react-vite';
import TopProductionCountryWidget from './TopProductionCountryWidget';

const meta = {
  title: 'Widgets/Pays le plus représenté',
  component: TopProductionCountryWidget,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof TopProductionCountryWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Nominal: Story = {
  args: {
    status: 'success',
    countryName: 'United States of America',
    movieCount: 725,
  },
};

export const NomLong: Story = {
  args: {
    status: 'success',
    countryName: 'The Democratic Republic of São Tomé and Príncipe',
    movieCount: 3,
  },
};

export const Chargement: Story = {
  args: {
    status: 'loading',
  },
};

export const AucunPaysConnu: Story = {
  args: {
    status: 'empty',
  },
};

export const Erreur: Story = {
  args: {
    status: 'error',
  },
};
