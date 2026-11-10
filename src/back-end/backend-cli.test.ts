import { DatabaseSync } from 'node:sqlite';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createProgram, runCliIfMain } from './backend-cli';
import { getDatabase } from './database/schema';

describe('backend CLI genre commands', () => {
  let directory: string;
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'movies-cli-'));
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    rmSync(directory, { recursive: true, force: true });
  });

  function csvFile(content: string, filename = 'genres.csv'): string {
    const path = join(directory, filename);
    writeFileSync(path, content);
    return path;
  }

  function createDatabase(path: string): DatabaseSync {
    return getDatabase(path);
  }

  async function runCli(
    args: string[],
    defaultDatabasePath?: string,
  ): Promise<void> {
    await createProgram(defaultDatabasePath).parseAsync(args, { from: 'user' });
  }

  describe('create-database', () => {
    it('creates and closes the database at the requested path', async () => {
      // Arrange
      const path = join(directory, 'custom-movies.sqlite');
      const closeSpy = vi.spyOn(DatabaseSync.prototype, 'close');

      // Act
      await runCli(['create-database', '--path', path]);

      // Assert
      expect(closeSpy).toHaveBeenCalledOnce();
      expect(logSpy).toHaveBeenCalledWith(
        `Database available at ${resolve(path)}`,
      );
    });

    it('uses the default database path when no path option is provided', async () => {
      // Arrange
      const path = join(directory, 'default-movies.sqlite');
      const closeSpy = vi.spyOn(DatabaseSync.prototype, 'close');

      // Act
      await runCli(['create-database'], path);

      // Assert
      expect(closeSpy).toHaveBeenCalledOnce();
      expect(logSpy).toHaveBeenCalledWith(
        `Database available at ${resolve(path)}`,
      );
    });

    it('runs the command when the CLI file is invoked directly', () => {
      // Arrange
      const path = join(directory, 'direct-movies.sqlite');
      const cliPath = resolve('src/back-end/backend-cli.ts');
      const originalArgv = process.argv;
      process.argv = [
        process.execPath,
        cliPath,
        '--path',
        path,
        'create-database',
      ];

      // Act
      try {
        runCliIfMain(pathToFileURL(cliPath).href, cliPath);
      } finally {
        process.argv = originalArgv;
      }

      // Assert
      expect(logSpy).toHaveBeenCalledWith(
        `Database available at ${resolve(path)}`,
      );
      expect(existsSync(path)).toBe(true);
    });

    it('does not run when the CLI has no entry point', () => {
      // Act
      runCliIfMain(
        pathToFileURL(resolve('src/back-end/backend-cli.ts')).href,
        '',
      );

      // Assert
      expect(logSpy).not.toHaveBeenCalled();
    });
  });

  describe('add-genres', () => {
    it('imports and updates genres in a custom database and closes the connection', async () => {
      // Arrange
      const path = join(directory, 'custom-movies.sqlite');
      const database = createDatabase(path);
      database
        .prepare('INSERT INTO genres (id, name) VALUES (?, ?)')
        .run(18, 'Old');
      database.close();
      const csvPath = csvFile('name,id\nDrama,18\nAction,28\n');
      const closeSpy = vi.spyOn(DatabaseSync.prototype, 'close');

      // Act
      await runCli(['--path', path, 'add-genres', csvPath]);

      // Assert
      expect(closeSpy).toHaveBeenCalledOnce();
      const resultDatabase = createDatabase(path);
      expect(
        resultDatabase.prepare('SELECT id, name FROM genres ORDER BY id').all(),
      ).toEqual([
        { id: 18, name: 'Drama' },
        { id: 28, name: 'Action' },
      ]);
      resultDatabase.close();
      expect(logSpy).toHaveBeenCalledWith(
        `Imported 2 genres into database at ${resolve(path)}`,
      );
    });

    it('uses the default database path when no path option is provided', async () => {
      // Arrange
      const path = join(directory, 'default-movies.sqlite');
      const csvPath = csvFile('id,name\n18,Drama\n');

      // Act
      await runCli(['add-genres', csvPath], path);

      // Assert
      const database = createDatabase(path);
      expect(database.prepare('SELECT id, name FROM genres').all()).toEqual([
        { id: 18, name: 'Drama' },
      ]);
      database.close();
      expect(logSpy).toHaveBeenCalledWith(
        `Imported 1 genres into database at ${resolve(path)}`,
      );
    });

    it('validates the CSV before opening the database', async () => {
      // Arrange
      const path = join(directory, 'not-created.sqlite');
      const csvPath = csvFile('id,title\n1,Drama\n');

      // Act and assert
      await expect(
        runCli(['--path', path, 'add-genres', csvPath]),
      ).rejects.toThrow(
        'Genres CSV must contain exactly the id and name headers',
      );
      expect(existsSync(path)).toBe(false);
    });

    it('rolls back the import and closes the connection when a write fails', async () => {
      // Arrange
      const path = join(directory, 'custom-movies.sqlite');
      const database = createDatabase(path);
      database.exec(`
        CREATE TRIGGER reject_genre BEFORE INSERT ON genres
        WHEN NEW.id = 2
        BEGIN
          SELECT RAISE(ABORT, 'rejected genre');
        END;
      `);
      database.close();
      const csvPath = csvFile('id,name\n1,Action\n2,Adventure\n');
      const closeSpy = vi.spyOn(DatabaseSync.prototype, 'close');

      // Act and assert
      await expect(
        runCli(['add-genres', csvPath, '--path', path]),
      ).rejects.toThrow('rejected genre');
      expect(closeSpy).toHaveBeenCalledOnce();
      const resultDatabase = createDatabase(path);
      expect(resultDatabase.prepare('SELECT * FROM genres').all()).toEqual([]);
      resultDatabase.close();
    });
  });

  describe('clean-genres', () => {
    it('removes only unassociated genres in the selected database and reports the count', async () => {
      // Arrange
      const path = join(directory, 'custom-movies.sqlite');
      const database = createDatabase(path);
      database
        .prepare('INSERT INTO genres (id, name) VALUES (?, ?), (?, ?)')
        .run(18, 'Drama', 28, 'Action');
      database
        .prepare(`
        INSERT INTO movies (
          id, title, original_title, original_language, overview, collected_at
        ) VALUES (1, 'Movie', 'Movie', 'en', '', '2026-01-01')
      `)
        .run();
      database
        .prepare('INSERT INTO movie_genres (movie_id, genre_id) VALUES (?, ?)')
        .run(1, 18);
      database.close();
      const closeSpy = vi.spyOn(DatabaseSync.prototype, 'close');

      // Act
      await runCli(['clean-genres', '--path', path]);

      // Assert
      const resultDatabase = createDatabase(path);
      expect(
        resultDatabase.prepare('SELECT id, name FROM genres').all(),
      ).toEqual([{ id: 18, name: 'Drama' }]);
      expect(closeSpy).toHaveBeenCalledOnce();
      resultDatabase.close();
      expect(logSpy).toHaveBeenCalledWith(
        `Removed 1 unused genres from database at ${resolve(path)}`,
      );
    });

    it('uses the default database path and reports when nothing is deleted', async () => {
      // Arrange
      const path = join(directory, 'default-movies.sqlite');

      // Act
      await runCli(['clean-genres'], path);

      // Assert
      expect(logSpy).toHaveBeenCalledWith(
        `Removed 0 unused genres from database at ${resolve(path)}`,
      );
    });
  });

  describe('add-countries', () => {
    it('imports and updates countries in the selected database and closes the connection', async () => {
      // Arrange
      const path = join(directory, 'custom-movies.sqlite');
      const database = createDatabase(path);
      database
        .prepare('INSERT INTO countries (code, name) VALUES (?, ?)')
        .run('FR', 'Old name');
      database.close();
      const countriesCsv = csvFile(
        'name,code\nFrance,FR\nUnited States,US\n',
        'countries.csv',
      );
      const closeSpy = vi.spyOn(DatabaseSync.prototype, 'close');

      // Act
      await runCli(['--path', path, 'add-countries', countriesCsv]);

      // Assert
      expect(closeSpy).toHaveBeenCalledOnce();
      const resultDatabase = createDatabase(path);
      expect(
        resultDatabase
          .prepare('SELECT code, name FROM countries ORDER BY code')
          .all(),
      ).toEqual([
        { code: 'FR', name: 'France' },
        { code: 'US', name: 'United States' },
      ]);
      resultDatabase.close();
      expect(logSpy).toHaveBeenCalledWith(
        `Imported 2 countries into database at ${resolve(path)}`,
      );
    });

    it('uses the default database path when no path option is provided', async () => {
      // Arrange
      const path = join(directory, 'default-movies.sqlite');
      const countriesCsv = csvFile('code,name\nFR,France\n', 'countries.csv');

      // Act
      await runCli(['add-countries', countriesCsv], path);

      // Assert
      const database = createDatabase(path);
      expect(
        database.prepare('SELECT code, name FROM countries').all(),
      ).toEqual([{ code: 'FR', name: 'France' }]);
      database.close();
      expect(logSpy).toHaveBeenCalledWith(
        `Imported 1 countries into database at ${resolve(path)}`,
      );
    });

    it('validates country data before opening the database', async () => {
      // Arrange
      const path = join(directory, 'not-created.sqlite');
      const countriesCsv = csvFile('code,name\nfr,France\n', 'countries.csv');

      // Act and assert
      await expect(
        runCli(['--path', path, 'add-countries', countriesCsv]),
      ).rejects.toThrow(
        'Invalid country code on CSV row 2: expected two uppercase letters',
      );
      expect(existsSync(path)).toBe(false);
    });

    it('rolls back a failed import and closes the connection', async () => {
      // Arrange
      const path = join(directory, 'custom-movies.sqlite');
      const database = createDatabase(path);
      database.exec(`
        CREATE TRIGGER reject_country BEFORE INSERT ON countries
        WHEN NEW.code = 'US'
        BEGIN
          SELECT RAISE(ABORT, 'rejected country');
        END;
      `);
      database.close();
      const countriesCsv = csvFile(
        'code,name\nFR,France\nUS,United States\n',
        'countries.csv',
      );
      const closeSpy = vi.spyOn(DatabaseSync.prototype, 'close');

      // Act and assert
      await expect(
        runCli(['add-countries', countriesCsv, '--path', path]),
      ).rejects.toThrow('rejected country');
      expect(closeSpy).toHaveBeenCalledOnce();
      const resultDatabase = createDatabase(path);
      expect(resultDatabase.prepare('SELECT * FROM countries').all()).toEqual(
        [],
      );
      resultDatabase.close();
    });
  });

  describe('clean-countries', () => {
    it('removes only countries not associated with a movie and reports the count', async () => {
      // Arrange
      const path = join(directory, 'custom-movies.sqlite');
      const database = createDatabase(path);
      database
        .prepare('INSERT INTO countries (code, name) VALUES (?, ?), (?, ?)')
        .run('FR', 'France', 'US', 'United States');
      database
        .prepare(`
          INSERT INTO movies (
            id, title, original_title, original_language, overview, collected_at
          ) VALUES (1, 'Movie', 'Movie', 'en', '', '2026-01-01')
        `)
        .run();
      database
        .prepare(
          'INSERT INTO production_countries (movie_id, country_code) VALUES (?, ?)',
        )
        .run(1, 'FR');
      database.close();
      const closeSpy = vi.spyOn(DatabaseSync.prototype, 'close');

      // Act
      await runCli(['clean-countries', '--path', path]);

      // Assert
      expect(closeSpy).toHaveBeenCalledOnce();
      const resultDatabase = createDatabase(path);
      expect(
        resultDatabase.prepare('SELECT code, name FROM countries').all(),
      ).toEqual([{ code: 'FR', name: 'France' }]);
      resultDatabase.close();
      expect(logSpy).toHaveBeenCalledWith(
        `Removed 1 unused countries from database at ${resolve(path)}`,
      );
    });

    it('uses the default database path and reports when nothing is deleted', async () => {
      // Arrange
      const path = join(directory, 'default-movies.sqlite');

      // Act
      await runCli(['clean-countries'], path);

      // Assert
      expect(logSpy).toHaveBeenCalledWith(
        `Removed 0 unused countries from database at ${resolve(path)}`,
      );
    });
  });
});
