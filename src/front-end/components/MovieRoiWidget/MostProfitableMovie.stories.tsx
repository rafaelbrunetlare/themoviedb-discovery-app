import type { Meta, StoryObj } from '@storybook/react-vite';
import storyPoster from '../MoviePoster/assets/story-movie-poster.svg';
import MovieRoiWidget from './MovieRoiWidget';

const meta = {
  title: 'Widgets/Film le plus rentable',
  component: MovieRoiWidget,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof MovieRoiWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Nominal: Story = {
  args: {
    kind: 'most-profitable',
    status: 'success',
    movie: {
      title: 'The Grand Adventure',
      releaseYear: 2024,
      posterUrl: storyPoster,
      roiPercent: 69667.36,
    },
  },
};

export const AfficheAbsente: Story = {
  args: {
    kind: 'most-profitable',
    status: 'success',
    movie: {
      title: 'The Grand Adventure',
      releaseYear: 2024,
      posterUrl: null,
      roiPercent: 69667.36,
    },
  },
};

export const ValeurInconnue: Story = {
  args: {
    kind: 'most-profitable',
    status: 'success',
    movie: {
      title: 'The Grand Adventure',
      releaseYear: 2024,
      posterUrl: storyPoster,
      roiPercent: null,
    },
  },
};

export const AucunFilmEligible: Story = {
  args: {
    kind: 'most-profitable',
    status: 'empty',
  },
};

export const Chargement: Story = {
  args: {
    kind: 'most-profitable',
    status: 'loading',
  },
};

export const Erreur: Story = {
  args: {
    kind: 'most-profitable',
    status: 'error',
  },
};
