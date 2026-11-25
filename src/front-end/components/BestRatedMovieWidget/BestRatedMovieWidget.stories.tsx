import type { Meta, StoryObj } from '@storybook/react-vite';
import storyPoster from '../MoviePoster/assets/story-movie-poster.svg';
import BestRatedMovieWidget from './BestRatedMovieWidget';

const meta = {
  title: 'Widgets/Film le mieux noté',
  component: BestRatedMovieWidget,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof BestRatedMovieWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Nominal: Story = {
  args: {
    status: 'success',
    movie: {
      title: 'The Grand Adventure',
      releaseYear: 2024,
      rating: 9.1,
      posterUrl: storyPoster,
    },
  },
};

export const AfficheAbsente: Story = {
  args: {
    status: 'success',
    movie: {
      title: 'No Poster',
      releaseYear: 2024,
      rating: 8.7,
      posterUrl: null,
    },
  },
};

export const Chargement: Story = {
  args: {
    status: 'loading',
  },
};

export const AucunFilmNote: Story = {
  args: {
    status: 'empty',
  },
};

export const Erreur: Story = {
  args: {
    status: 'error',
  },
};
