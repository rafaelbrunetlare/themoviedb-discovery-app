import type { DatabaseSync } from 'node:sqlite';
import type { Genre } from '../types/MoviesTypes';

/**
 * Finds a genre by its identifier.
 */
export function getGenreById(
  database: DatabaseSync,
  id: number,
): Genre | undefined {
  return database
    .prepare('SELECT id, name FROM genres WHERE id = ?')
    .get(id) as Genre | undefined;
}

/**
 * Lists all genres ordered by their identifier.
 */
export function getGenres(database: DatabaseSync): Genre[] {
  return database
    .prepare('SELECT id, name FROM genres ORDER BY id ASC')
    .all() as Genre[];
}

/**
 * Inserts or updates genres while preserving the order of the input iterable.
 */
export function upsertGenres(
  database: DatabaseSync,
  genres: Iterable<Genre>,
): void {
  database.exec('BEGIN TRANSACTION');
  try {
    const statement = database.prepare(`
      INSERT INTO genres (id, name)
      VALUES (?, ?)
      ON CONFLICT(id) DO UPDATE SET name = excluded.name
    `);

    for (const genre of genres) {
      statement.run(genre.id, genre.name);
    }

    database.exec('COMMIT');
  } catch (error) {
    database.exec('ROLLBACK');
    throw error;
  }
}

/**
 * Deletes genres that are not associated with any movie and returns the count.
 */
export function deleteUnusedGenres(database: DatabaseSync): number {
  const result = database
    .prepare(`
    DELETE FROM genres
    WHERE NOT EXISTS (
      SELECT 1 FROM movie_genres WHERE movie_genres.genre_id = genres.id
    )
  `)
    .run();

  return Number(result.changes);
}
