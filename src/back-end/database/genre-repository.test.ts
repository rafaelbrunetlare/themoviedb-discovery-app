import { DatabaseSync } from 'node:sqlite';
import { afterEach, describe, expect, it } from 'vitest';
import { initializeSchema } from './schema';
import { getGenreById, getGenres, upsertGenres } from './genre-repository';
import type { Genre } from '../types/MoviesTypes';

describe('genre repository', () => {
  const databases: DatabaseSync[] = [];

  afterEach(() => {
    for (const database of databases) {
      database.close();
    }
    databases.length = 0;
  });

  function createDatabase(): DatabaseSync {
    const database = new DatabaseSync(':memory:');
    initializeSchema(database);
    databases.push(database);
    return database;
  }

  it('finds an existing genre and returns undefined for an unknown identifier', () => {
    // Arrange
    const database = createDatabase();
    upsertGenres(database, [{ id: 18, name: 'Drama' }]);

    // Act
    const existingGenre = getGenreById(database, 18);
    const missingGenre = getGenreById(database, 999);

    // Assert
    expect(existingGenre).toEqual({ id: 18, name: 'Drama' });
    expect(missingGenre).toBeUndefined();
  });

  it('lists genres in ascending identifier order', () => {
    // Arrange
    const database = createDatabase();
    upsertGenres(database, [
      { id: 35, name: 'Comedy' },
      { id: 12, name: 'Adventure' },
    ]);

    // Act
    const genres = getGenres(database);

    // Assert
    expect(genres).toEqual([
      { id: 12, name: 'Adventure' },
      { id: 35, name: 'Comedy' },
    ]);
  });

  it('inserts arrays and other iterables and updates existing genres without duplicates', () => {
    // Arrange
    const database = createDatabase();
    const genreIterable = new Set<Genre>([
      { id: 18, name: 'Drama' },
      { id: 28, name: 'Action' },
    ]);
    upsertGenres(database, genreIterable);

    // Act
    upsertGenres(database, [{ id: 18, name: 'Drama updated' }]);

    // Assert
    expect(getGenres(database)).toEqual([
      { id: 18, name: 'Drama updated' },
      { id: 28, name: 'Action' },
    ]);
    expect(
      database
        .prepare('SELECT COUNT(*) AS count FROM genres WHERE id = ?')
        .get(18),
    ).toEqual({ count: 1 });
  });

  it('does not modify data for an empty iterable and keeps the last repeated label', () => {
    // Arrange
    const database = createDatabase();
    upsertGenres(database, [{ id: 18, name: 'Drama' }]);

    // Act
    upsertGenres(database, []);
    upsertGenres(database, [
      { id: 18, name: 'First label' },
      { id: 18, name: 'Last label' },
    ]);

    // Assert
    expect(getGenreById(database, 18)).toEqual({
      id: 18,
      name: 'Last label',
    });
  });

  it('enforces the required genre name', () => {
    // Arrange
    const database = createDatabase();

    // Act and assert
    expect(() =>
      upsertGenres(database, [{ id: 18, name: null as unknown as string }]),
    ).toThrow(/NOT NULL constraint failed/);
    expect(getGenres(database)).toEqual([]);
  });
});
