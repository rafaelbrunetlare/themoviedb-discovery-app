import { describe, expect, it } from 'vitest';
import { parseCountriesCsv } from './countries-csv';

describe('parseCountriesCsv', () => {
  it('accepts case-insensitive headers in either order, BOM, CRLF and padded values', () => {
    // Arrange
    const csv = '\uFEFFNAME,Code\r\n France , FR \r\nUnited States,US\r\n';

    // Act
    const countries = parseCountriesCsv(csv);

    // Assert
    expect(countries).toEqual([
      { code: 'FR', name: 'France' },
      { code: 'US', name: 'United States' },
    ]);
  });

  it('parses commas and escaped quotes inside quoted names', () => {
    // Arrange
    const csv =
      'code,name\nGB,"United Kingdom, Great Britain"\nUS,"The ""States"""\n';

    // Act
    const countries = parseCountriesCsv(csv);

    // Assert
    expect(countries).toEqual([
      { code: 'GB', name: 'United Kingdom, Great Britain' },
      { code: 'US', name: 'The "States"' },
    ]);
  });

  it('ignores blank lines and returns an empty list for a header-only document', () => {
    // Arrange
    const csv = 'code,name\n\n  \n';

    // Act
    const countries = parseCountriesCsv(csv);

    // Assert
    expect(countries).toEqual([]);
    expect(parseCountriesCsv('code,name\n')).toEqual([]);
  });

  it.each(['', 'code', 'code,title\nFR,France', 'code,code,name'])(
    'rejects invalid headers in %j',
    (csv) => {
      // Act and assert
      expect(() => parseCountriesCsv(csv)).toThrow(
        'Countries CSV must contain exactly the code and name headers',
      );
    },
  );

  it.each(['fr,France', 'FRA,France', '1F,France', ' F ,France'])(
    'rejects invalid country codes in %j',
    (row) => {
      // Act and assert
      expect(() => parseCountriesCsv(`code,name\n${row}`)).toThrow(
        'Invalid country code on CSV row 2: expected two uppercase letters',
      );
    },
  );

  it('rejects empty names and malformed CSV syntax', () => {
    // Act and assert
    expect(() => parseCountriesCsv('code,name\nFR,  \n')).toThrow(
      'Invalid country name on CSV row 2: name is empty',
    );
    expect(() => parseCountriesCsv('code,name\nFR,"unfinished')).toThrow();
  });

  it('rejects rows with the wrong number of values', () => {
    // Act and assert
    expect(() => parseCountriesCsv('code,name\nFR,France,Extra')).toThrow(
      'Invalid countries CSV row 2: expected 2 values',
    );
    expect(() => parseCountriesCsv('code,name\nFR')).toThrow(
      'Invalid countries CSV row 2: expected 2 values',
    );
  });
});
