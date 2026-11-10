import { describe, expect, it } from 'vitest';
import { parseGenresCsv } from './genres-csv';

describe('parseGenresCsv', () => {
  it('accepts case-insensitive headers in either order, BOM, CRLF and blank lines', () => {
    // Arrange
    const csv = '\uFEFFNAME,Id\r\n"Science Fiction",878\r\n\r\nDrama,18\r\n';

    // Act
    const genres = parseGenresCsv(csv);

    // Assert
    expect(genres).toEqual([
      { id: 878, name: 'Science Fiction' },
      { id: 18, name: 'Drama' },
    ]);
  });

  it('parses commas and escaped quotes inside quoted names', () => {
    // Arrange
    const csv = 'id,name\n1,"Action, Adventure"\n2,"The ""Classic"""\n';

    // Act
    const genres = parseGenresCsv(csv);

    // Assert
    expect(genres).toEqual([
      { id: 1, name: 'Action, Adventure' },
      { id: 2, name: 'The "Classic"' },
    ]);
  });

  it.each(['', 'id', 'id,title\n1,Drama', 'id,ID,name\n1,2,Drama'])(
    'rejects invalid headers in %j',
    (csv) => {
      // Act and assert
      expect(() => parseGenresCsv(csv)).toThrow(
        'Genres CSV must contain exactly the id and name headers',
      );
    },
  );

  it.each(['0,Drama', '-1,Drama', '1.5,Drama', '9007199254740992,Drama'])(
    'rejects invalid genre identifiers in %j',
    (row) => {
      // Act and assert
      expect(() => parseGenresCsv(`id,name\n${row}`)).toThrow(
        'Invalid genre id on CSV row 2: expected a positive safe integer',
      );
    },
  );

  it('rejects an empty genre name and malformed CSV syntax', () => {
    // Act and assert
    expect(() => parseGenresCsv('id,name\n1,  \n')).toThrow(
      'Invalid genre name on CSV row 2: name is empty',
    );
    expect(() => parseGenresCsv('id,name\n1,"unfinished')).toThrow();
  });

  it('rejects rows with the wrong number of values', () => {
    // Act and assert
    expect(() => parseGenresCsv('id,name\n1,Drama,Extra')).toThrow(
      'Invalid genres CSV row 2: expected 2 values',
    );
    expect(() => parseGenresCsv('id,name\n1')).toThrow(
      'Invalid genres CSV row 2: expected 2 values',
    );
  });
});
