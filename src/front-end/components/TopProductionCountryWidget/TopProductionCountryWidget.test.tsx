// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import TopProductionCountryWidget from './TopProductionCountryWidget';

afterEach(cleanup);

describe('TopProductionCountryWidget', () => {
  it('displays the leading country and its movie count', () => {
    // Arrange and act: render the nominal example from Storybook.
    render(
      <TopProductionCountryWidget
        status="success"
        countryName="United States of America"
        movieCount={725}
      />,
    );

    // Assert: the title, country, count, and unit are available to users.
    expect(
      screen.getByRole('heading', { name: 'Pays le plus représenté' }),
    ).toBeTruthy();
    expect(screen.getByText('United States of America')).toBeTruthy();
    expect(screen.getByText('725', { exact: true })).toBeTruthy();
    expect(screen.getByText('films', { exact: true })).toBeTruthy();
  });

  it('keeps long country names available as readable text', () => {
    // Arrange and act: render a country with a long display name.
    render(
      <TopProductionCountryWidget
        status="success"
        countryName="The Democratic Republic of São Tomé and Príncipe"
        movieCount={3}
      />,
    );

    // Assert: the complete country name is rendered without truncation.
    expect(
      screen.getByText('The Democratic Republic of São Tomé and Príncipe'),
    ).toBeTruthy();
  });

  it('shows an accessible loading state', () => {
    // Arrange and act: render the widget while the aggregate is loading.
    render(<TopProductionCountryWidget status="loading" />);

    // Assert: loading is announced and the widget is marked busy.
    expect(screen.getByRole('status').textContent).toBe(
      'Chargement du pays le plus représenté…',
    );
    expect(
      screen
        .getByRole('region', { name: 'Pays le plus représenté' })
        .getAttribute('aria-busy'),
    ).toBe('true');
  });

  it('shows the empty state when no production country is known', () => {
    // Arrange and act: render the widget without a known country.
    render(<TopProductionCountryWidget status="empty" />);

    // Assert: the empty state is announced without inventing a country or count.
    expect(screen.getByRole('status').textContent).toBe(
      'Aucun pays de production connu.',
    );
    expect(screen.queryByText('0', { exact: true })).toBeNull();
    expect(screen.queryByText('films', { exact: true })).toBeNull();
  });

  it('shows an accessible error state', () => {
    // Arrange and act: render the widget after an aggregate request fails.
    render(<TopProductionCountryWidget status="error" />);

    // Assert: the error is exposed to assistive technology without a country or count.
    expect(screen.getByRole('alert').textContent).toBe(
      'Le pays le plus représenté est indisponible.',
    );
    expect(screen.queryByText('films', { exact: true })).toBeNull();
  });
});
