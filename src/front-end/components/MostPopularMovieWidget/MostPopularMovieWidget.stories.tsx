import type { Meta, StoryObj } from '@storybook/react-vite';
import storyPoster from '../MoviePoster/assets/story-movie-poster.svg';
import MostPopularMovieWidget from './MostPopularMovieWidget';

const meta = {
  title: 'Widgets/Film le plus populaire',
  component: MostPopularMovieWidget,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof MostPopularMovieWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Nominal: Story = {
  args: {
    status: 'success',
    movie: {
      title: 'The Grand Adventure',
      releaseYear: 2024,
      popularity: 1036.49,
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
      popularity: 42,
      posterUrl: null,
    },
  },
};

export const ValeurInconnue: Story = {
  args: {
    status: 'success',
    movie: {
      title: 'A Very Long Movie Title That Must Remain Readable',
      releaseYear: null,
      popularity: null,
      posterUrl: null,
    },
  },
};

export const Chargement: Story = {
  args: {
    status: 'loading',
  },
};

export const Erreur: Story = {
  args: {
    status: 'error',
  },
};
