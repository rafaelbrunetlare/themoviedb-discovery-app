// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import MoviesDashboardPage from './MoviesDashboardPage';

afterEach(cleanup);

describe('MoviesDashboardPage', () => {
  it('displays the dashboard and its empty state when no widgets are configured', () => {
    // Arrange and act: render the dashboard without providing any widgets.
    render(<MoviesDashboardPage />);

    // Assert: the dashboard introduces its purpose and shows the no-widget state.
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Tableau de bord des films',
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'Aucun widget pour le moment',
      }),
    ).toBeTruthy();
    expect(
      screen.getByText(/films, de genres et de pays de production/),
    ).toBeTruthy();
  });
});
