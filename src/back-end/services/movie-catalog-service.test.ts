import { DatabaseSync } from 'node:sqlite';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initializeSchema } from '../database/schema';
import { updateMovieCatalog } from './movie-catalog-service';

vi.mock('../utils/config', () => ({
  tmdbAccessToken: 'test-access-token',
}));

type MovieDetailsFixture = {
  id: number;
  title: string;
  original_title: string;
  original_language: string;
  overview: string;
  release_date: string;
  popularity: number;
  vote_average: number;
  vote_count: number;
  poster_path: string | null;
  backdrop_path: string | null;
  runtime: number | null;
  budget: number;
  revenue: number;
  genres: Array<{ id: number; name: string }>;
  production_countries: Array<{ iso_3166_1: string; name: string }>;
};

type ApiFixture = {
  genres?: Array<{ id: number; name: string }>;
  countries?: Array<{
    iso_3166_1: string;
    english_name: string;
    native_name: string;
  }>;
  pages: Record<
    number,
    { page: number; total_pages: number; results: Array<{ id: number }> }
  >;
  details: Record<number, MovieDetailsFixture>;
  failedPath?: string;
};

function movieDetails(
  id: number,
  title: string,
  overrides: Partial<MovieDetailsFixture> = {},
): MovieDetailsFixture {
  return {
    id,
    title,
    original_title: `Original ${title}`,
    original_language: 'en',
    overview: `Overview ${title}`,
    release_date: '2024-06-10',
    popularity: 12.5,
    vote_average: 7.5,
    vote_count: 25,
    poster_path: '/poster.jpg',
    backdrop_path: '/backdrop.jpg',
    runtime: 100,
    budget: 1000,
    revenue: 2000,
    genres: [{ id: 28, name: 'Action' }],
    production_countries: [{ iso_3166_1: 'US', name: 'United States' }],
    ...overrides,
  };
}

function apiFetch(fixture: ApiFixture) {
  return vi.fn(async (input: string | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    if (url.pathname === fixture.failedPath) {
      return { ok: false, status: 503, json: async () => ({}) } as Response;
    }

    let data: unknown;
    if (url.pathname.endsWith('/genre/movie/list')) {
      data = { genres: fixture.genres ?? [] };
    } else if (url.pathname.endsWith('/configuration/countries')) {
      data = fixture.countries ?? [];
    } else if (url.pathname.endsWith('/discover/movie')) {
      data = fixture.pages[Number(url.searchParams.get('page'))];
    } else {
      const movieId = Number(url.pathname.split('/').pop());
      data = fixture.details[movieId];
    }

    void init;
    return { ok: true, status: 200, json: async () => data } as Response;
  });
}

const emptyPage = { page: 1, total_pages: 0, results: [] };

describe('movie catalog update service', () => {
  let database: DatabaseSync;

  beforeEach(() => {
    database = new DatabaseSync(':memory:');
    initializeSchema(database);
  });

  afterEach(() => {
    database.close();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('updates movies, genres, and countries from all Discover pages and details', async () => {
    // Arrange
    const fetchMock = apiFetch({
      genres: [
        { id: 28, name: 'Action' },
        { id: 18, name: 'Drama' },
      ],
      countries: [
        {
          iso_3166_1: 'US',
          english_name: '',
          native_name: 'United States of America',
        },
      ],
      pages: {
        1: { page: 1, total_pages: 2, results: [{ id: 1 }, { id: 1 }] },
        2: { page: 2, total_pages: 2, results: [{ id: 2 }] },
      },
      details: {
        1: movieDetails(1, 'Action film'),
        2: movieDetails(2, 'Drama film', {
          release_date: '',
          genres: [{ id: 18, name: 'Drama' }],
          production_countries: [{ iso_3166_1: 'CA', name: 'Canada' }],
          runtime: null,
          budget: 0,
          revenue: 0,
        }),
      },
    });

    // Act
    const result = await updateMovieCatalog(database, '2024', {
      language: 'en-US',
      region: 'US',
      fetcher: fetchMock as unknown as typeof fetch,
    });

    // Assert
    expect(result).toEqual({ movies: 2, genres: 2, countries: 2 });
    expect(
      database.prepare('SELECT id, title FROM movies ORDER BY id').all(),
    ).toEqual([
      { id: 1, title: 'Action film' },
      { id: 2, title: 'Drama film' },
    ]);
    expect(
      database
        .prepare('SELECT genre_id FROM movie_genres WHERE movie_id = 2')
        .all(),
    ).toEqual([{ genre_id: 18 }]);
    expect(
      database
        .prepare(
          'SELECT country_code FROM production_countries WHERE movie_id = 2',
        )
        .all(),
    ).toEqual([{ country_code: 'CA' }]);
    expect(
      database.prepare('SELECT code, name FROM countries ORDER BY code').all(),
    ).toEqual([
      { code: 'CA', name: 'Canada' },
      { code: 'US', name: 'United States of America' },
    ]);
    expect(
      database
        .prepare(
          'SELECT runtime_minutes, budget, revenue FROM movies WHERE id = 2',
        )
        .get(),
    ).toEqual({ runtime_minutes: null, budget: null, revenue: null });
    expect(
      database.prepare('SELECT release_date FROM movies WHERE id = 2').get(),
    ).toEqual({ release_date: null });
    expect(
      fetchMock.mock.calls.some(([input]) =>
        String(input).includes('discover/movie?primary_release_year=2024'),
      ),
    ).toBe(true);
    expect(
      fetchMock.mock.calls.some(
        ([input]) =>
          String(input).includes('discover/movie?primary_release_year=2024') &&
          String(input).includes('page=2'),
      ),
    ).toBe(true);
    for (const [, init] of fetchMock.mock.calls) {
      expect(init?.headers).toEqual({
        Authorization: 'Bearer test-access-token',
        'Content-Type': 'application/json;charset=utf-8',
      });
    }
  });

  it('updates existing film data and replaces its genre and country links', async () => {
    // Arrange
    database
      .prepare('INSERT INTO genres (id, name) VALUES (?, ?)')
      .run(28, 'Old action');
    database
      .prepare('INSERT INTO countries (code, name) VALUES (?, ?)')
      .run('US', 'Old country');
    database
      .prepare(
        'INSERT INTO movies (id, title, original_title, original_language, overview, collected_at) VALUES (?, ?, ?, ?, ?, ?)',
      )
      .run(5, 'Old title', 'Old title', 'en', 'Old overview', 'old timestamp');
    database
      .prepare('INSERT INTO movie_genres (movie_id, genre_id) VALUES (?, ?)')
      .run(5, 28);
    database
      .prepare(
        'INSERT INTO production_countries (movie_id, country_code) VALUES (?, ?)',
      )
      .run(5, 'US');
    const fetchMock = apiFetch({
      genres: [{ id: 18, name: 'Drama' }],
      countries: [
        { iso_3166_1: 'GB', english_name: 'United Kingdom', native_name: 'UK' },
      ],
      pages: { 1: { page: 1, total_pages: 1, results: [{ id: 5 }] } },
      details: {
        5: movieDetails(5, 'Updated title', {
          genres: [{ id: 18, name: 'Drama' }],
          production_countries: [{ iso_3166_1: 'GB', name: 'United Kingdom' }],
        }),
      },
    });

    // Act
    await updateMovieCatalog(database, '2024', {
      fetcher: fetchMock as unknown as typeof fetch,
    });

    // Assert
    expect(
      database.prepare('SELECT title FROM movies WHERE id = 5').get(),
    ).toEqual({ title: 'Updated title' });
    expect(
      database
        .prepare('SELECT genre_id FROM movie_genres WHERE movie_id = 5')
        .all(),
    ).toEqual([{ genre_id: 18 }]);
    expect(
      database
        .prepare(
          'SELECT country_code FROM production_countries WHERE movie_id = 5',
        )
        .all(),
    ).toEqual([{ country_code: 'GB' }]);
    expect(
      database.prepare('SELECT name FROM genres WHERE id = 28').get(),
    ).toEqual({ name: 'Old action' });
  });

  it('uses the default options and handles an empty Discover response', async () => {
    // Arrange
    const fetchMock = apiFetch({ pages: { 1: emptyPage }, details: {} });
    vi.stubGlobal('fetch', fetchMock);

    // Act
    const result = await updateMovieCatalog(database, '2024');

    // Assert
    expect(result).toEqual({ movies: 0, genres: 0, countries: 0 });
    const discoverUrl = String(
      fetchMock.mock.calls.find(([input]) =>
        String(input).includes('/discover/movie'),
      )?.[0],
    );
    expect(discoverUrl).toContain('language=fr-FR');
    expect(discoverUrl).toContain('region=FR');
  });

  it('rejects invalid years without making API requests', async () => {
    // Arrange
    const fetchMock = apiFetch({ pages: {}, details: {} });

    // Act and Assert
    await expect(
      updateMovieCatalog(database, '0999', {
        fetcher: fetchMock as unknown as typeof fetch,
      }),
    ).rejects.toThrow('year must be a four-digit string between 1000 and 9999');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('does not modify the database when a TMDB request fails', async () => {
    // Arrange
    const fetchMock = apiFetch({
      pages: {},
      details: {},
      failedPath: '/3/genre/movie/list',
    });

    // Act and Assert
    await expect(
      updateMovieCatalog(database, '2024', {
        fetcher: fetchMock as unknown as typeof fetch,
      }),
    ).rejects.toThrow('TMDB request failed with status 503');
    expect(database.prepare('SELECT * FROM genres').all()).toEqual([]);
    expect(database.prepare('SELECT * FROM countries').all()).toEqual([]);
  });

  it('rolls back the whole database update when a movie write fails', async () => {
    // Arrange
    database.exec(`
      CREATE TRIGGER reject_movie BEFORE INSERT ON movies
      WHEN NEW.id = 2
      BEGIN
        SELECT RAISE(ABORT, 'rejected movie');
      END;
    `);
    const fetchMock = apiFetch({
      genres: [{ id: 28, name: 'Action' }],
      countries: [
        { iso_3166_1: 'US', english_name: 'United States', native_name: 'US' },
      ],
      pages: {
        1: { page: 1, total_pages: 1, results: [{ id: 1 }, { id: 2 }] },
      },
      details: {
        1: movieDetails(1, 'First'),
        2: movieDetails(2, 'Second'),
      },
    });

    // Act and Assert
    await expect(
      updateMovieCatalog(database, '2024', {
        fetcher: fetchMock as unknown as typeof fetch,
      }),
    ).rejects.toThrow('rejected movie');
    expect(database.prepare('SELECT * FROM movies').all()).toEqual([]);
    expect(database.prepare('SELECT * FROM genres').all()).toEqual([]);
    expect(database.prepare('SELECT * FROM countries').all()).toEqual([]);
  });
});
