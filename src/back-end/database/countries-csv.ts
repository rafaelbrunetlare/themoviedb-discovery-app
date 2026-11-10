import { parse } from 'csv-parse/sync';
import type { Country } from '../types/MoviesTypes';

/**
 * Parses and validates a CSV document containing country codes and names.
 */
export function parseCountriesCsv(csv: string): Country[] {
  const rows = parse(csv, {
    bom: true,
    relax_column_count: true,
    skip_empty_lines: true,
  }) as string[][];

  const headers = rows[0];
  if (!headers || headers.length !== 2) {
    throw new Error(
      'Countries CSV must contain exactly the code and name headers',
    );
  }

  const normalizedHeaders = headers.map((header) =>
    header.trim().toLowerCase(),
  );
  const codeIndex = normalizedHeaders.indexOf('code');
  const nameIndex = normalizedHeaders.indexOf('name');
  if (codeIndex === -1 || nameIndex === -1 || codeIndex === nameIndex) {
    throw new Error(
      'Countries CSV must contain exactly the code and name headers',
    );
  }

  return rows.slice(1).flatMap((row, index) => {
    const rowNumber = index + 2;
    if (row.length === 1 && row[0].trim() === '') {
      return [];
    }
    if (row.length !== 2) {
      throw new Error(
        `Invalid countries CSV row ${rowNumber}: expected 2 values`,
      );
    }

    const code = row[codeIndex].trim();
    const name = row[nameIndex].trim();
    if (!/^[A-Z]{2}$/.test(code)) {
      throw new Error(
        `Invalid country code on CSV row ${rowNumber}: expected two uppercase letters`,
      );
    }
    if (!name) {
      throw new Error(
        `Invalid country name on CSV row ${rowNumber}: name is empty`,
      );
    }

    return [{ code, name }];
  });
}
