// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import AverageRatingWidget from './AverageRatingWidget';

afterEach(cleanup);

describe('AverageRatingWidget', () => {
  it('displays the French-formatted rating, scale, and simple-average label', () => {
    // Arrange and act: render the nominal catalog average from the Storybook example.
    render(
      <AverageRatingWidget
        status="success"
        averageRating={6.78}
        method="simple"
      />,
    );

    // Assert: the value, scale, and calculation method are explicit.
    expect(screen.getByRole('heading', { name: 'Note moyenne' })).toBeTruthy();
    expect(screen.getByText('6,78', { exact: true })).toBeTruthy();
    expect(screen.getByText('/ 10', { exact: true })).toBeTruthy();
    expect(screen.getByText('Moyenne simple')).toBeTruthy();
  });

  it('always displays two decimals for the supplied rating', () => {
    // Arrange and act: render a rating that has fewer than two decimal places.
    render(
      <AverageRatingWidget
        status="success"
        averageRating={6.5}
        method="simple"
      />,
    );

    // Assert: the displayed rating is padded to two French-formatted decimals.
    expect(screen.getByText('6,50', { exact: true })).toBeTruthy();
  });

  it('distinguishes a weighted rating from a simple average', () => {
    // Arrange and act: render a value explicitly identified as weighted.
    render(
      <AverageRatingWidget
        status="success"
        averageRating={6.91}
        method="weighted"
      />,
    );

    // Assert: the method label communicates that this is a weighted rating.
    expect(screen.getByText('Note pondérée')).toBeTruthy();
    expect(screen.queryByText('Moyenne simple')).toBeNull();
  });

  it('shows no-ratings state without confusing it with a zero rating', () => {
    // Arrange and act: render the widget when the catalog has no ratings.
    render(<AverageRatingWidget status="empty" />);

    // Assert: no score or scale is rendered for the empty state.
    expect(screen.getByRole('status').textContent).toBe(
      'Aucune note disponible.',
    );
    expect(screen.queryByText('0,00', { exact: true })).toBeNull();
    expect(screen.queryByText('/ 10', { exact: true })).toBeNull();
  });

  it('displays a zero score when zero is the provided rating', () => {
    // Arrange and act: render a valid zero rating rather than an empty state.
    render(
      <AverageRatingWidget
        status="success"
        averageRating={0}
        method="simple"
      />,
    );

    // Assert: a real zero is shown with its scale and method.
    expect(screen.getByText('0,00', { exact: true })).toBeTruthy();
    expect(screen.getByText('/ 10', { exact: true })).toBeTruthy();
    expect(screen.getByText('Moyenne simple')).toBeTruthy();
  });

  it('shows an accessible loading state', () => {
    // Arrange and act: render the widget while the average is loading.
    render(<AverageRatingWidget status="loading" />);

    // Assert: loading is announced and the widget is marked busy.
    expect(screen.getByRole('status').textContent).toBe(
      'Chargement de la note moyenne…',
    );
    expect(
      screen
        .getByRole('region', { name: 'Note moyenne' })
        .getAttribute('aria-busy'),
    ).toBe('true');
  });

  it('shows an accessible error state', () => {
    // Arrange and act: render the widget after a failed request.
    render(<AverageRatingWidget status="error" />);

    // Assert: the error is exposed to assistive technology without a score.
    expect(screen.getByRole('alert').textContent).toBe(
      'La note moyenne est indisponible.',
    );
    expect(screen.queryByText('/ 10', { exact: true })).toBeNull();
  });
});
