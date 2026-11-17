import { readFileSync } from 'node:fs';
import { parse } from 'csv-parse/sync';
import type { DatabaseSync } from 'node:sqlite';
import { upsertMovie, type MovieInput } from './movies';

const requiredColumns = [
  'id',
  'title',
  'original_title',
  'original_language',
  'overview',
  'release_date',
  'popularity',
  'vote_average',
  'vote_count',
  'poster_path',
  'backdrop_path',
  'runtime',
  'budget',
  'revenue',
];

type CsvMovie = Record<string, string>;

function parseNullableNumber(value: string, column: string): number | null {
  if (value.trim() === '') return null;

  const parsedValue = Number(value);
  if (!Number.isFinite(parsedValue)) {
    throw new Error(`Invalid number in CSV column "${column}": ${value}`);
  }

  return parsedValue;
}

function toMovieInput(row: CsvMovie, collectedAt: string): MovieInput {
  const id = Number(row.id);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error(`Invalid movie id in CSV: ${row.id}`);
  }

  return {
    id,
    title: row.title,
    original_title: row.original_title,
    original_language: row.original_language,
    overview: row.overview,
    release_date: row.release_date || null,
    popularity: parseNullableNumber(row.popularity, 'popularity'),
    vote_average: parseNullableNumber(row.vote_average, 'vote_average'),
    vote_count: parseNullableNumber(row.vote_count, 'vote_count'),
    poster_path: row.poster_path || null,
    backdrop_path: row.backdrop_path || null,
    runtime_minutes: parseNullableNumber(row.runtime, 'runtime'),
    budget: parseNullableNumber(row.budget, 'budget'),
    revenue: parseNullableNumber(row.revenue, 'revenue'),
    collected_at: collectedAt,
  };
}

function readMovieRows(csvFilePath: string): CsvMovie[] {
  const csvContent = readFileSync(csvFilePath, 'utf8');
  return parse<CsvMovie>(csvContent, {
    bom: true,
    columns: (headers: string[]) => {
      const missingColumns = requiredColumns.filter(
        (column) => !headers.includes(column),
      );
      if (missingColumns.length > 0) {
        throw new Error(
          `CSV is missing required columns: ${missingColumns.join(', ')}`,
        );
      }
      return headers;
    },
    skip_empty_lines: true,
  });
}

export function importMoviesFromCsv(
  database: DatabaseSync,
  csvFilePath: string,
): number {
  const rows = readMovieRows(csvFilePath);
  const collectedAt = new Date().toISOString();
  const movies = rows.map((row) => toMovieInput(row, collectedAt));

  database.exec('BEGIN');
  try {
    for (const movie of movies) {
      upsertMovie(database, movie);
    }
    database.exec('COMMIT');
  } catch (error) {
    database.exec('ROLLBACK');
    throw error;
  }

  return movies.length;
}
