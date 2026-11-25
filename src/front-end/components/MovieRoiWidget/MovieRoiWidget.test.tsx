// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import MovieRoiWidget from './MovieRoiWidget';

afterEach(cleanup);

describe('MovieRoiWidget', () => {
  it('displays the most profitable movie with a French-formatted ROI', () => {
    // Arrange and act: render the agreed best-ROI demonstration value.
    render(
      <MovieRoiWidget
        kind="most-profitable"
        status="success"
        movie={{
          title: 'The Grand Adventure',
          releaseYear: 2024,
          posterUrl: null,
          roiPercent: 69667.36,
        }}
      />,
    );

    // Assert: movie details and the ROI percentage are explicit.
    expect(
      screen.getByRole('heading', { name: 'Film le plus rentable' }),
    ).toBeTruthy();
    expect(
      screen.getByRole('heading', { level: 3, name: 'The Grand Adventure' }),
    ).toBeTruthy();
    expect(screen.getByText('2024', { exact: true })).toBeTruthy();
    expect(screen.getByText('Retour sur investissement (ROI)')).toBeTruthy();
    const formattedRoi = screen.getByText('69 667,36', { exact: true });
    expect(formattedRoi.textContent).toBe('69\u202f667,36');
    expect(screen.getByText('% ROI', { exact: true })).toBeTruthy();
  });

  it('keeps the negative sign for the least profitable movie', () => {
    // Arrange and act: render a valid negative ROI.
    render(
      <MovieRoiWidget
        kind="least-profitable"
        status="success"
        movie={{
          title: 'The Lost Investment',
          releaseYear: 2020,
          posterUrl: null,
          roiPercent: -100,
        }}
      />,
    );

    // Assert: the least-profitable label and negative percentage are preserved.
    expect(
      screen.getByRole('heading', { name: 'Film le moins rentable' }),
    ).toBeTruthy();
    expect(screen.getByText('-100,00', { exact: true })).toBeTruthy();
    expect(screen.getByText('% ROI', { exact: true })).toBeTruthy();
  });

  it('displays a zero ROI as a valid value', () => {
    // Arrange and act: render a valid zero-percent ROI.
    render(
      <MovieRoiWidget
        kind="least-profitable"
        status="success"
        movie={{
          title: 'Break Even',
          releaseYear: 2022,
          posterUrl: null,
          roiPercent: 0,
        }}
      />,
    );

    // Assert: zero is distinct from an unknown ROI.
    expect(screen.getByText('0,00', { exact: true })).toBeTruthy();
    expect(screen.getByText('% ROI', { exact: true })).toBeTruthy();
  });

  it('displays an unknown ROI instead of treating it as zero', () => {
    // Arrange and act: render a movie whose ROI is unavailable.
    render(
      <MovieRoiWidget
        kind="least-profitable"
        status="success"
        movie={{
          title: 'Unknown Return',
          releaseYear: null,
          posterUrl: null,
          roiPercent: null,
        }}
      />,
    );

    // Assert: unknown value and year remain explicit with no percentage.
    expect(screen.getByText('Valeur inconnue')).toBeTruthy();
    expect(screen.getByText('Année inconnue')).toBeTruthy();
    expect(screen.queryByText('0,00', { exact: true })).toBeNull();
    expect(screen.queryByText('% ROI', { exact: true })).toBeNull();
  });

  it('shows an accessible loading state', () => {
    // Arrange and act: render the most profitable widget while it loads.
    render(<MovieRoiWidget kind="most-profitable" status="loading" />);

    // Assert: loading is announced and the widget is marked busy.
    expect(screen.getByRole('status').textContent).toBe('Chargement du film…');
    expect(
      screen
        .getByRole('region', { name: 'Film le plus rentable' })
        .getAttribute('aria-busy'),
    ).toBe('true');
  });

  it('shows an empty state when no film meets the eligibility rules', () => {
    // Arrange and act: render the widget without an eligible film.
    render(<MovieRoiWidget kind="most-profitable" status="empty" />);

    // Assert: the widget explains the empty result without inventing a value.
    expect(screen.getByRole('status').textContent).toBe(
      'Aucun film éligible au calcul du ROI.',
    );
    expect(screen.queryByText('0,00', { exact: true })).toBeNull();
  });

  it('shows an accessible error state', () => {
    // Arrange and act: render the least profitable widget after a failed request.
    render(<MovieRoiWidget kind="least-profitable" status="error" />);

    // Assert: the error is exposed to assistive technology without a value.
    expect(screen.getByRole('alert').textContent).toBe(
      'Le résultat du ROI est indisponible.',
    );
    expect(
      screen.getByRole('region', { name: 'Film le moins rentable' }),
    ).toBeTruthy();
  });
});
