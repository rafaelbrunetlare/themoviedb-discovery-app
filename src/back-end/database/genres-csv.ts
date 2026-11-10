import { parse } from 'csv-parse/sync';
import type { Genre } from '../types/MoviesTypes';

/**
 * Parses and validates a CSV document containing genre identifiers and names.
 */
export function parseGenresCsv(csv: string): Genre[] {
  const rows = parse(csv, {
    bom: true,
    relax_column_count: true,
    skip_empty_lines: true,
  }) as string[][];

  const headers = rows[0];
  if (!headers || headers.length !== 2) {
    throw new Error('Genres CSV must contain exactly the id and name headers');
  }

  const normalizedHeaders = headers.map((header) => header.toLowerCase());
  const idIndex = normalizedHeaders.indexOf('id');
  const nameIndex = normalizedHeaders.indexOf('name');
  if (idIndex === -1 || nameIndex === -1 || idIndex === nameIndex) {
    throw new Error('Genres CSV must contain exactly the id and name headers');
  }

  return rows.slice(1).map((row, index) => {
    const rowNumber = index + 2;
    if (row.length !== 2) {
      throw new Error(`Invalid genres CSV row ${rowNumber}: expected 2 values`);
    }

    const idValue = row[idIndex];
    const nameValue = row[nameIndex];
    if (!/^\d+$/.test(idValue)) {
      throw new Error(
        `Invalid genre id on CSV row ${rowNumber}: expected a positive safe integer`,
      );
    }
    const id = Number(idValue);
    if (!Number.isSafeInteger(id) || id <= 0) {
      throw new Error(
        `Invalid genre id on CSV row ${rowNumber}: expected a positive safe integer`,
      );
    }

    const name = nameValue.trim();
    if (!name) {
      throw new Error(
        `Invalid genre name on CSV row ${rowNumber}: name is empty`,
      );
    }

    return { id, name };
  });
}
