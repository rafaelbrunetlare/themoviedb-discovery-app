#!/usr/bin/env node
import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { DEFAULT_DATABASE_PATH, getDatabase } from './database/schema.ts';
import {
  deleteUnusedGenres,
  upsertGenres,
} from './database/genre-repository.ts';
import { parseGenresCsv } from './database/genres-csv.ts';
import {
  deleteUnusedCountries,
  upsertCountries,
} from './database/country-repository.ts';
import { parseCountriesCsv } from './database/countries-csv.ts';

/** Command-line interface for movie database operations. */
export function createProgram(
  defaultDatabasePath = DEFAULT_DATABASE_PATH,
): Command {
  const program = new Command()
    .description('CLI for movie database operations')
    .option('-p, --path <path>', 'path to the SQLite database file');

  program
    .command('create-database')
    .description('Create and initialize the movies database schema')
    .option('-p, --path <path>', 'path to the SQLite database file')
    .action((options: { path?: string }) => {
      const path =
        options.path ??
        program.opts<{ path?: string }>().path ??
        defaultDatabasePath;
      const database = getDatabase(path);
      try {
        console.log(`Database available at ${resolve(path)}`);
      } finally {
        database.close();
      }
    });

  program
    .command('add-genres')
    .description('Import or update genres from a CSV file')
    .argument('<csv-file>', 'path to the genres CSV file')
    .option('-p, --path <path>', 'path to the SQLite database file')
    .action((csvFile: string, options: { path?: string }) => {
      const genres = parseGenresCsv(readFileSync(csvFile, 'utf8'));
      const path =
        options.path ??
        program.opts<{ path?: string }>().path ??
        defaultDatabasePath;
      const database = getDatabase(path);
      try {
        upsertGenres(database, genres);
        console.log(
          `Imported ${genres.length} genres into database at ${resolve(path)}`,
        );
      } finally {
        database.close();
      }
    });

  program
    .command('clean-genres')
    .description('Delete genres that are not associated with any movie')
    .option('-p, --path <path>', 'path to the SQLite database file')
    .action((options: { path?: string }) => {
      const path =
        options.path ??
        program.opts<{ path?: string }>().path ??
        defaultDatabasePath;
      const database = getDatabase(path);
      try {
        const deletedCount = deleteUnusedGenres(database);
        console.log(
          `Removed ${deletedCount} unused genres from database at ${resolve(path)}`,
        );
      } finally {
        database.close();
      }
    });

  program
    .command('add-countries')
    .description('Import or update countries from a CSV file')
    .argument('<csv-file>', 'path to the countries CSV file')
    .option('-p, --path <path>', 'path to the SQLite database file')
    .action((csvFile: string, options: { path?: string }) => {
      const countries = parseCountriesCsv(readFileSync(csvFile, 'utf8'));
      const path =
        options.path ??
        program.opts<{ path?: string }>().path ??
        defaultDatabasePath;
      const database = getDatabase(path);
      try {
        upsertCountries(database, countries);
        console.log(
          `Imported ${countries.length} countries into database at ${resolve(path)}`,
        );
      } finally {
        database.close();
      }
    });

  program
    .command('clean-countries')
    .description('Delete countries that are not associated with any movie')
    .option('-p, --path <path>', 'path to the SQLite database file')
    .action((options: { path?: string }) => {
      const path =
        options.path ??
        program.opts<{ path?: string }>().path ??
        defaultDatabasePath;
      const database = getDatabase(path);
      try {
        const deletedCount = deleteUnusedCountries(database);
        console.log(
          `Removed ${deletedCount} unused countries from database at ${resolve(path)}`,
        );
      } finally {
        database.close();
      }
    });

  return program;
}

export function runCliIfMain(
  moduleUrl: string,
  entryPoint = process.argv[1],
): void {
  if (entryPoint && moduleUrl === pathToFileURL(resolve(entryPoint)).href) {
    createProgram().parse();
  }
}

runCliIfMain(import.meta.url);
