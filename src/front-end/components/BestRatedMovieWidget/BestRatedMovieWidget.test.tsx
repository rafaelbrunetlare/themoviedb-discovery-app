// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import BestRatedMovieWidget from './BestRatedMovieWidget';

afterEach(cleanup);

describe('BestRatedMovieWidget', () => {
  it('displays the movie, accessible poster, year, and formatted rating', () => {
    // Arrange and act: render the nominal best-rated movie.
    render(
      <BestRatedMovieWidget
        status="success"
        movie={{
          title: 'The Grand Adventure',
          releaseYear: 2024,
          rating: 9.1,
          posterUrl: '/poster.jpg',
        }}
      />,
    );

    // Assert: the poster and movie details are available to users.
    expect(
      screen.getByRole('heading', { name: 'Film le mieux noté' }),
    ).toBeTruthy();
    expect(
      screen.getByRole('img', { name: 'Affiche de The Grand Adventure' }),
    ).toBeTruthy();
    expect(
      screen.getByRole('heading', { level: 3, name: 'The Grand Adventure' }),
    ).toBeTruthy();
    expect(screen.getByText('2024', { exact: true })).toBeTruthy();
    expect(screen.getByText('9,1', { exact: true })).toBeTruthy();
    expect(screen.getByText('/ 10', { exact: true })).toBeTruthy();
  });

  it('shows an explicit fallback when the poster is missing', () => {
    // Arrange and act: render a movie that has no poster URL.
    render(
      <BestRatedMovieWidget
        status="success"
        movie={{
          title: 'No Poster',
          releaseYear: 2024,
          rating: 8.7,
          posterUrl: null,
        }}
      />,
    );

    // Assert: the fallback has an accessible name and no broken image is shown.
    expect(
      screen.getByRole('img', { name: 'Affiche indisponible pour No Poster' }),
    ).toBeTruthy();
    expect(
      screen.queryByRole('img', { name: 'Affiche de No Poster' }),
    ).toBeNull();
  });

  it('replaces an inaccessible poster and keeps an unknown year readable', () => {
    // Arrange: render a movie with an unavailable poster and unknown year.
    render(
      <BestRatedMovieWidget
        status="success"
        movie={{
          title: 'A Very Long Movie Title That Must Remain Readable',
          releaseYear: null,
          rating: 9.1,
          posterUrl: '/missing-poster.jpg',
        }}
      />,
    );

    // Act: simulate the browser failing to load the poster.
    fireEvent.error(
      screen.getByRole('img', {
        name: 'Affiche de A Very Long Movie Title That Must Remain Readable',
      }),
    );

    // Assert: the fallback replaces the image and the remaining details persist.
    expect(
      screen.getByRole('img', {
        name: 'Affiche indisponible pour A Very Long Movie Title That Must Remain Readable',
      }),
    ).toBeTruthy();
    expect(screen.getByText('Année inconnue')).toBeTruthy();
    expect(
      screen.getByRole('heading', {
        level: 3,
        name: 'A Very Long Movie Title That Must Remain Readable',
      }),
    ).toBeTruthy();
  });

  it('shows an accessible loading state', () => {
    // Arrange and act: render the widget while the best-rated film loads.
    render(<BestRatedMovieWidget status="loading" />);

    // Assert: loading is announced and the widget is marked busy.
    expect(screen.getByRole('status').textContent).toBe(
      'Chargement du film le mieux noté…',
    );
    expect(
      screen
        .getByRole('region', { name: 'Film le mieux noté' })
        .getAttribute('aria-busy'),
    ).toBe('true');
  });

  it('shows an empty state when no rated movie is available', () => {
    // Arrange and act: render the widget when the catalog has no rated films.
    render(<BestRatedMovieWidget status="empty" />);

    // Assert: the empty state is announced without inventing movie details.
    expect(screen.getByRole('status').textContent).toBe(
      'Aucun film noté disponible.',
    );
    expect(screen.queryByText('/ 10', { exact: true })).toBeNull();
  });

  it('shows an accessible error state', () => {
    // Arrange and act: render the widget after the best-rated request fails.
    render(<BestRatedMovieWidget status="error" />);

    // Assert: the error is exposed to assistive technology without movie data.
    expect(screen.getByRole('alert').textContent).toBe(
      'Le film le mieux noté est indisponible.',
    );
    expect(screen.queryByText('/ 10', { exact: true })).toBeNull();
  });
});
