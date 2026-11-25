import type { Meta, StoryObj } from '@storybook/react-vite';
import storyPoster from '../MoviePoster/assets/story-movie-poster.svg';
import MovieRoiWidget from './MovieRoiWidget';

const meta = {
  title: 'Widgets/Film le moins rentable',
  component: MovieRoiWidget,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof MovieRoiWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Nominal: Story = {
  args: {
    kind: 'least-profitable',
    status: 'success',
    movie: {
      title: 'The Lost Investment',
      releaseYear: 2020,
      posterUrl: storyPoster,
      roiPercent: -100,
    },
  },
};

export const RoiZero: Story = {
  args: {
    kind: 'least-profitable',
    status: 'success',
    movie: {
      title: 'Break Even',
      releaseYear: 2022,
      posterUrl: storyPoster,
      roiPercent: 0,
    },
  },
};

export const ValeurInconnue: Story = {
  args: {
    kind: 'least-profitable',
    status: 'success',
    movie: {
      title: 'Unknown Return',
      releaseYear: null,
      posterUrl: null,
      roiPercent: null,
    },
  },
};

export const AfficheAbsente: Story = {
  args: {
    kind: 'least-profitable',
    status: 'success',
    movie: {
      title: 'The Lost Investment',
      releaseYear: 2020,
      posterUrl: null,
      roiPercent: -100,
    },
  },
};

export const Chargement: Story = {
  args: {
    kind: 'least-profitable',
    status: 'loading',
  },
};

export const AucunFilmEligible: Story = {
  args: {
    kind: 'least-profitable',
    status: 'empty',
  },
};

export const Erreur: Story = {
  args: {
    kind: 'least-profitable',
    status: 'error',
  },
};
