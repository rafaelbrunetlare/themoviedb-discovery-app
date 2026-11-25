// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import MovieCountWidget from './MovieCountWidget';

afterEach(cleanup);

describe('MovieCountWidget', () => {
  it('renders the number of registered movies', () => {
    // Arrange and act: render the widget with a successful count.
    render(<MovieCountWidget status="success" count={248} />);

    // Assert: the widget title and formatted count are visible.
    expect(screen.getByRole('heading', { name: 'Films en base' })).toBeTruthy();
    expect(screen.getByText('248', { exact: true })).toBeTruthy();
    expect(screen.getByText('films enregistrés')).toBeTruthy();
  });

  it('uses the singular label for one registered movie', () => {
    // Arrange and act: render the widget with one movie.
    render(<MovieCountWidget status="success" count={1} />);

    // Assert: the count uses the singular label.
    expect(screen.getByText('1', { exact: true })).toBeTruthy();
    expect(screen.getByText('film enregistré')).toBeTruthy();
  });

  it('explains that the database is empty when the count is zero', () => {
    // Arrange and act: render the widget with an empty result.
    render(<MovieCountWidget status="success" count={0} />);

    // Assert: the empty count remains visible with a helpful message.
    expect(screen.getByText('0', { exact: true })).toBeTruthy();
    expect(
      screen.getByText('Aucun film n’est encore enregistré.'),
    ).toBeTruthy();
  });

  it('announces while the movie count is loading', () => {
    // Arrange and act: render the widget in its loading state.
    render(<MovieCountWidget status="loading" />);

    // Assert: loading is announced accessibly and marks the widget as busy.
    expect(screen.getByRole('status').textContent).toBe(
      'Chargement du nombre de films…',
    );
    expect(
      screen
        .getByRole('region', { name: 'Films en base' })
        .getAttribute('aria-busy'),
    ).toBe('true');
  });

  it('announces when the movie count cannot be loaded', () => {
    // Arrange and act: render the widget in its error state.
    render(<MovieCountWidget status="error" />);

    // Assert: the error is exposed as an alert and no count is shown.
    expect(screen.getByRole('alert').textContent).toBe(
      'Le nombre de films est indisponible.',
    );
    expect(screen.queryByText('0', { exact: true })).toBeNull();
  });
});
