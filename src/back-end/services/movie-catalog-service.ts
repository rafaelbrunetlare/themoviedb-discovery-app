import type { DatabaseSync } from 'node:sqlite';
import type { MovieInput } from '../database/movies';
import { upsertMovie } from '../database/movies';
import { tmdbAccessToken } from '../utils/config';
import { DEFAULT_LANGUAGE, DEFAULT_REGION } from '../utils/constants';

type TmdbGenre = { id: number; name: string };
type TmdbCountry = {
  iso_3166_1: string;
  english_name: string;
  native_name: string;
};
type TmdbCountryForMovie = { iso_3166_1: string; name: string };
type DiscoverPage = {
  page: number;
  total_pages: number;
  results: Array<{ id: number }>;
};
type TmdbMovieDetails = {
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
  genres: TmdbGenre[];
  production_countries: TmdbCountryForMovie[];
};

export type MovieCatalogUpdateOptions = {
  language?: string;
  region?: string;
  fetcher?: typeof fetch;
};

export type MovieCatalogUpdateResult = {
  movies: number;
  genres: number;
  countries: number;
};

function createTmdbUrl(path: string, query: Record<string, string>): string {
  const searchParams = new URLSearchParams(query);
  return `https://api.themoviedb.org/3/${path}?${searchParams.toString()}`;
}

async function fetchTmdbJson<T>(
  fetcher: typeof fetch,
  url: string,
): Promise<T> {
  const response = await fetcher(url, {
    headers: {
      Authorization: `Bearer ${tmdbAccessToken}`,
      'Content-Type': 'application/json;charset=utf-8',
    },
  });
  if (!response.ok) {
    throw new Error(`TMDB request failed with status ${response.status}`);
  }
  return (await response.json()) as T;
}

async function fetchDiscoverMovieIds(
  fetcher: typeof fetch,
  year: string,
  language: string,
  region: string,
): Promise<number[]> {
  const firstPage = await fetchTmdbJson<DiscoverPage>(
    fetcher,
    createTmdbUrl('discover/movie', {
      primary_release_year: year,
      language,
      region,
      page: '1',
    }),
  );
  const movieIds = firstPage.results.map((movie) => movie.id);

  for (let page = 2; page <= firstPage.total_pages; page += 1) {
    const nextPage = await fetchTmdbJson<DiscoverPage>(
      fetcher,
      createTmdbUrl('discover/movie', {
        primary_release_year: year,
        language,
        region,
        page: String(page),
      }),
    );
    movieIds.push(...nextPage.results.map((movie) => movie.id));
  }

  return [...new Set(movieIds)];
}

function toMovieInput(
  movie: TmdbMovieDetails,
  collectedAt: string,
): MovieInput {
  const positiveOrNull = (value: number | null): number | null =>
    value !== null && value > 0 ? value : null;

  return {
    id: movie.id,
    title: movie.title,
    original_title: movie.original_title,
    original_language: movie.original_language,
    overview: movie.overview,
    release_date: movie.release_date || null,
    popularity: movie.popularity,
    vote_average: movie.vote_average,
    vote_count: movie.vote_count,
    poster_path: movie.poster_path,
    backdrop_path: movie.backdrop_path,
    runtime_minutes: positiveOrNull(movie.runtime),
    budget: positiveOrNull(movie.budget),
    revenue: positiveOrNull(movie.revenue),
    collected_at: collectedAt,
  };
}

export async function updateMovieCatalog(
  database: DatabaseSync,
  year: string,
  options: MovieCatalogUpdateOptions = {},
): Promise<MovieCatalogUpdateResult> {
  if (!/^[1-9]\d{3}$/.test(year)) {
    throw new Error('year must be a four-digit string between 1000 and 9999');
  }

  const fetcher = options.fetcher ?? fetch;
  const language = options.language ?? DEFAULT_LANGUAGE;
  const region = options.region ?? DEFAULT_REGION;
  const [genreResponse, countryResponse] = await Promise.all([
    fetchTmdbJson<{ genres: TmdbGenre[] }>(
      fetcher,
      createTmdbUrl('genre/movie/list', { language }),
    ),
    fetchTmdbJson<TmdbCountry[]>(
      fetcher,
      createTmdbUrl('configuration/countries', { language }),
    ),
  ]);

  const movieIds = await fetchDiscoverMovieIds(fetcher, year, language, region);
  const movieDetails: TmdbMovieDetails[] = [];
  for (const movieId of movieIds) {
    movieDetails.push(
      await fetchTmdbJson<TmdbMovieDetails>(
        fetcher,
        createTmdbUrl(`movie/${movieId}`, { language }),
      ),
    );
  }

  const genresById = new Map(
    genreResponse.genres.map((genre) => [genre.id, genre]),
  );
  const countriesByCode = new Map(
    countryResponse.map((country) => [
      country.iso_3166_1,
      {
        code: country.iso_3166_1,
        name: country.english_name || country.native_name,
      },
    ]),
  );
  for (const movie of movieDetails) {
    for (const genre of movie.genres) genresById.set(genre.id, genre);
    for (const country of movie.production_countries) {
      if (!countriesByCode.has(country.iso_3166_1)) {
        countriesByCode.set(country.iso_3166_1, {
          code: country.iso_3166_1,
          name: country.name,
        });
      }
    }
  }

  const collectedAt = new Date().toISOString();
  database.exec('BEGIN');
  try {
    const upsertGenre = database.prepare(
      'INSERT INTO genres (id, name) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET name = excluded.name',
    );
    for (const genre of genresById.values()) {
      upsertGenre.run(genre.id, genre.name);
    }

    const upsertCountry = database.prepare(
      'INSERT INTO countries (code, name) VALUES (?, ?) ON CONFLICT(code) DO UPDATE SET name = excluded.name',
    );
    for (const country of countriesByCode.values()) {
      upsertCountry.run(country.code, country.name);
    }

    const deleteMovieGenres = database.prepare(
      'DELETE FROM movie_genres WHERE movie_id = ?',
    );
    const insertMovieGenre = database.prepare(
      'INSERT INTO movie_genres (movie_id, genre_id) VALUES (?, ?)',
    );
    const deleteMovieCountries = database.prepare(
      'DELETE FROM production_countries WHERE movie_id = ?',
    );
    const insertMovieCountry = database.prepare(
      'INSERT INTO production_countries (movie_id, country_code) VALUES (?, ?)',
    );

    for (const movie of movieDetails) {
      upsertMovie(database, toMovieInput(movie, collectedAt));
      deleteMovieGenres.run(movie.id);
      for (const genre of movie.genres) {
        insertMovieGenre.run(movie.id, genre.id);
      }
      deleteMovieCountries.run(movie.id);
      for (const country of movie.production_countries) {
        insertMovieCountry.run(movie.id, country.iso_3166_1);
      }
    }

    database.exec('COMMIT');
  } catch (error) {
    database.exec('ROLLBACK');
    throw error;
  }

  return {
    movies: movieDetails.length,
    genres: genresById.size,
    countries: countriesByCode.size,
  };
}
