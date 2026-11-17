import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { initializeSchema } from './schema';
import { getMovieById, listMovies } from './movies';
import { importMoviesFromCsv } from './movies-csv';

const csvHeader =
  'id,title,original_title,original_language,overview,release_date,popularity,vote_average,vote_count,poster_path,backdrop_path,runtime,budget,revenue,genres,production_countries';

function csvRow(
  id: number,
  title: string,
  releaseDate = '2024-05-01',
  runtime = '110',
): string {
  return [
    String(id),
    `"${title}"`,
    'Original title',
    'en',
    '"An overview, with a comma"',
    releaseDate,
    '12.5',
    '7.5',
    '100',
    '/poster.jpg',
    '/backdrop.jpg',
    runtime,
    '1000000',
    '2000000',
    '"[28,12]"',
    '"[{""iso_3166_1"":""US"",""name"":""United States""}]"',
  ].join(',');
}

describe('movies CSV importer', () => {
  let database: DatabaseSync;
  let directory: string;

  beforeEach(() => {
    database = new DatabaseSync(':memory:');
    initializeSchema(database);
    directory = mkdtempSync(join(tmpdir(), 'movies-csv-'));
  });

  afterEach(() => {
    database.close();
    rmSync(directory, { recursive: true, force: true });
  });

  function writeCsv(content: string, fileName = 'movies.csv'): string {
    const csvFilePath = join(directory, fileName);
    writeFileSync(csvFilePath, content, 'utf8');
    return csvFilePath;
  }

  it('imports quoted CSV fields and maps columns to the movie schema', () => {
    // Arrange
    const csvFilePath = writeCsv(
      `${csvHeader}\n${csvRow(42, 'Movie, title')}\n`,
    );

    // Act
    const importedCount = importMoviesFromCsv(database, csvFilePath);

    // Assert
    expect(importedCount).toBe(1);
    expect(getMovieById(database, 42)).toMatchObject({
      id: 42,
      title: 'Movie, title',
      original_title: 'Original title',
      original_language: 'en',
      overview: 'An overview, with a comma',
      release_date: '2024-05-01',
      release_year: 2024,
      popularity: 12.5,
      vote_average: 7.5,
      vote_count: 100,
      poster_path: '/poster.jpg',
      backdrop_path: '/backdrop.jpg',
      runtime_minutes: 110,
      budget: 1000000,
      revenue: 2000000,
    });
  });

  it('updates existing movies when the same CSV is imported again', () => {
    // Arrange
    const firstCsv = writeCsv(`${csvHeader}\n${csvRow(42, 'First title')}\n`);
    importMoviesFromCsv(database, firstCsv);
    const updatedCsv = writeCsv(
      `${csvHeader}\n${csvRow(42, 'Updated title', '2025-01-03')}\n`,
    );

    // Act
    const importedCount = importMoviesFromCsv(database, updatedCsv);

    // Assert
    expect(importedCount).toBe(1);
    expect(listMovies(database)).toHaveLength(1);
    expect(getMovieById(database, 42)).toMatchObject({
      title: 'Updated title',
      release_date: '2025-01-03',
      release_year: 2025,
    });
  });

  it('imports an empty file with valid headers and nullable values', () => {
    // Arrange
    const emptyCsv = writeCsv(`${csvHeader}\n`, 'empty.csv');
    const nullableCsv = writeCsv(
      `${csvHeader}\n${csvRow(17, 'Nullable movie', '', '')}\n`.replace(
        ',12.5,7.5,100,/poster.jpg,/backdrop.jpg,,1000000,2000000,',
        ',,,,,,,,,',
      ),
      'nullable.csv',
    );

    // Act
    const emptyCount = importMoviesFromCsv(database, emptyCsv);
    const importedCount = importMoviesFromCsv(database, nullableCsv);

    // Assert
    expect(emptyCount).toBe(0);
    expect(importedCount).toBe(1);
    expect(getMovieById(database, 17)).toMatchObject({
      release_date: null,
      popularity: null,
      vote_average: null,
      vote_count: null,
      poster_path: null,
      backdrop_path: null,
      runtime_minutes: null,
    });
  });

  it('rejects a CSV missing required columns', () => {
    // Arrange
    const csvFilePath = writeCsv('id,title\n42,Movie\n');

    // Act and Assert
    expect(() => importMoviesFromCsv(database, csvFilePath)).toThrow(
      'CSV is missing required columns:',
    );
    expect(listMovies(database)).toEqual([]);
  });

  it('rejects invalid numbers before starting an import', () => {
    // Arrange
    const csvFilePath = writeCsv(
      `${csvHeader}\n${csvRow(42, 'Valid movie')}\n${csvRow(43, 'Invalid movie').replace(',12.5,', ',invalid,')}\n`,
    );

    // Act and Assert
    expect(() => importMoviesFromCsv(database, csvFilePath)).toThrow(
      'Invalid number in CSV column "popularity": invalid',
    );
    expect(listMovies(database)).toEqual([]);
  });

  it('rejects invalid movie identifiers before starting an import', () => {
    // Arrange
    const csvFilePath = writeCsv(
      `${csvHeader}\n${csvRow(0, 'Invalid movie id')}\n`,
    );

    // Act and Assert
    expect(() => importMoviesFromCsv(database, csvFilePath)).toThrow(
      'Invalid movie id in CSV: 0',
    );
    expect(listMovies(database)).toEqual([]);
  });

  it('rolls back all rows if SQLite rejects a movie during import', () => {
    // Arrange
    const csvFilePath = writeCsv(
      `${csvHeader}\n${csvRow(42, 'Valid movie')}\n${csvRow(43, 'Invalid runtime', '2024-01-01', '0')}\n`,
    );

    // Act and Assert
    expect(() => importMoviesFromCsv(database, csvFilePath)).toThrow(
      /CHECK constraint failed/,
    );
    expect(listMovies(database)).toEqual([]);
  });
});
