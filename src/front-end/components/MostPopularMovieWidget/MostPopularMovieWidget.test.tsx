// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import MostPopularMovieWidget from './MostPopularMovieWidget';

afterEach(cleanup);

describe('MostPopularMovieWidget', () => {
  it('displays the movie and its two-decimal popularity index', () => {
    // Arrange and act: render the nominal popularity example.
    render(
      <MostPopularMovieWidget
        status="success"
        movie={{
          title: 'The Grand Adventure',
          releaseYear: 2024,
          popularity: 1036.49,
          posterUrl: '/poster.jpg',
        }}
      />,
    );

    // Assert: movie details and popularity are labeled without a rating scale.
    expect(
      screen.getByRole('heading', { name: 'Film le plus populaire' }),
    ).toBeTruthy();
    expect(
      screen.getByRole('img', { name: 'Affiche de The Grand Adventure' }),
    ).toBeTruthy();
    expect(
      screen.getByRole('heading', { level: 3, name: 'The Grand Adventure' }),
    ).toBeTruthy();
    expect(screen.getByText('2024', { exact: true })).toBeTruthy();
    expect(screen.getByText('Indice de popularité')).toBeTruthy();
    const formattedPopularity = screen.getByText('1 036,49', {
      exact: true,
    });
    expect(formattedPopularity.textContent).toBe('1\u202f036,49');
    expect(screen.queryByText('/ 10', { exact: true })).toBeNull();
    expect(screen.queryByText(/votes/i)).toBeNull();
  });

  it('shows an explicit fallback when the poster is missing', () => {
    // Arrange and act: render a popular movie without a poster URL.
    render(
      <MostPopularMovieWidget
        status="success"
        movie={{
          title: 'No Poster',
          releaseYear: 2024,
          popularity: 42,
          posterUrl: null,
        }}
      />,
    );

    // Assert: the poster fallback is accessible and the index remains visible.
    expect(
      screen.getByRole('img', { name: 'Affiche indisponible pour No Poster' }),
    ).toBeTruthy();
    expect(screen.getByText('42,00', { exact: true })).toBeTruthy();
  });

  it('shows incomplete movie data and an explicit unknown popularity value', () => {
    // Arrange and act: render a long title with an unknown year and popularity.
    render(
      <MostPopularMovieWidget
        status="success"
        movie={{
          title: 'A Very Long Movie Title That Must Remain Readable',
          releaseYear: null,
          popularity: null,
          posterUrl: null,
        }}
      />,
    );

    // Assert: incomplete information remains explicit instead of becoming zero.
    expect(
      screen.getByRole('heading', {
        level: 3,
        name: 'A Very Long Movie Title That Must Remain Readable',
      }),
    ).toBeTruthy();
    expect(screen.getByText('Année inconnue')).toBeTruthy();
    expect(screen.getByText('Valeur inconnue')).toBeTruthy();
    expect(screen.queryByText('0,00', { exact: true })).toBeNull();
  });

  it('shows an accessible loading state', () => {
    // Arrange and act: render the widget while the most popular movie loads.
    render(<MostPopularMovieWidget status="loading" />);

    // Assert: loading is announced and the widget is marked busy.
    expect(screen.getByRole('status').textContent).toBe(
      'Chargement du film le plus populaire…',
    );
    expect(
      screen
        .getByRole('region', { name: 'Film le plus populaire' })
        .getAttribute('aria-busy'),
    ).toBe('true');
  });

  it('shows an accessible error state', () => {
    // Arrange and act: render the widget after the popularity request fails.
    render(<MostPopularMovieWidget status="error" />);

    // Assert: the error is exposed to assistive technology without movie data.
    expect(screen.getByRole('alert').textContent).toBe(
      'Le film le plus populaire est indisponible.',
    );
    expect(screen.queryByText('Indice de popularité')).toBeNull();
  });
});
