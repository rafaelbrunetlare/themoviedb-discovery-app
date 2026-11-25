// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import AverageDurationWidget from './AverageDurationWidget';

afterEach(cleanup);

describe('AverageDurationWidget', () => {
  it('displays the provided average duration and its unit', () => {
    // Arrange and act: render the widget with the documented example value.
    render(<AverageDurationWidget status="success" averageDuration={107} />);

    // Assert: the value is shown with the required label and minute unit.
    expect(screen.getByRole('heading', { name: 'Durée moyenne' })).toBeTruthy();
    expect(screen.getByText('107', { exact: true })).toBeTruthy();
    expect(screen.getByText('min', { exact: true })).toBeTruthy();
  });

  it('formats fractional average durations with a French decimal separator', () => {
    // Arrange and act: render the widget with a fractional average.
    render(<AverageDurationWidget status="success" averageDuration={107.5} />);

    // Assert: the displayed average uses the French decimal separator.
    expect(screen.getByText('107,5', { exact: true })).toBeTruthy();
  });

  it('shows an accessible loading state', () => {
    // Arrange and act: render the widget while the average is loading.
    render(<AverageDurationWidget status="loading" />);

    // Assert: loading is announced and the widget is marked busy.
    expect(screen.getByRole('status').textContent).toBe(
      'Chargement de la durée moyenne…',
    );
    expect(
      screen
        .getByRole('region', { name: 'Durée moyenne' })
        .getAttribute('aria-busy'),
    ).toBe('true');
  });

  it('shows an empty state without displaying an arbitrary zero', () => {
    // Arrange and act: render the widget when there are no valid runtimes.
    render(<AverageDurationWidget status="empty" />);

    // Assert: the empty state is accessible and does not invent a value.
    expect(screen.getByRole('status').textContent).toBe(
      'Aucune durée valide disponible.',
    );
    expect(screen.queryByText('0', { exact: true })).toBeNull();
    expect(screen.queryByText('min', { exact: true })).toBeNull();
  });

  it('shows an accessible error state', () => {
    // Arrange and act: render the widget after a failed request.
    render(<AverageDurationWidget status="error" />);

    // Assert: the error is exposed to assistive technology without a value.
    expect(screen.getByRole('alert').textContent).toBe(
      'La durée moyenne est indisponible.',
    );
    expect(screen.queryByText('0', { exact: true })).toBeNull();
  });
});
