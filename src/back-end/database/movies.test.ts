import { DatabaseSync } from 'node:sqlite';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { initializeSchema } from './schema';
import {
  getMovieById,
  listMovies,
  type MovieInput,
  upsertMovie,
} from './movies';

function createMovie(id: number, title = `Movie ${id}`): MovieInput {
  return {
    id,
    title,
    original_title: `Original ${title}`,
    original_language: 'en',
    overview: `Overview for ${title}`,
    release_date: '2024-05-01',
    popularity: 12.5,
    vote_average: 7.5,
    vote_count: 100,
    poster_path: '/poster.jpg',
    backdrop_path: '/backdrop.jpg',
    runtime_minutes: 110,
    budget: 1000000,
    revenue: 2000000,
    collected_at: '2024-05-02T10:00:00.000Z',
  };
}

describe('movies database module', () => {
  let database: DatabaseSync;

  beforeEach(() => {
    database = new DatabaseSync(':memory:');
    initializeSchema(database);
  });

  afterEach(() => {
    database.close();
  });

  it('inserts a movie and finds it by identifier', () => {
    // Arrange
    const movie = createMovie(42);

    // Act
    upsertMovie(database, movie);

    // Assert
    expect(getMovieById(database, 42)).toEqual({
      ...movie,
      release_year: 2024,
    });
  });

  it('updates an existing movie instead of inserting a duplicate', () => {
    // Arrange
    upsertMovie(database, createMovie(42));
    const updatedMovie = createMovie(42, 'Updated movie');

    // Act
    upsertMovie(database, updatedMovie);

    // Assert
    expect(getMovieById(database, 42)).toEqual({
      ...updatedMovie,
      release_year: 2024,
    });
    expect(listMovies(database)).toHaveLength(1);
  });

  it('lists movies in ascending identifier order', () => {
    // Arrange
    upsertMovie(database, createMovie(30));
    upsertMovie(database, createMovie(10));
    upsertMovie(database, createMovie(20));

    // Act
    const movies = listMovies(database);

    // Assert
    expect(movies.map((movie) => movie.id)).toEqual([10, 20, 30]);
  });

  it('returns undefined when the identifier is not present', () => {
    expect(getMovieById(database, 404)).toBeUndefined();
  });
});
