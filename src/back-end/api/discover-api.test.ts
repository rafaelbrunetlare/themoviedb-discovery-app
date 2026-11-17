import type { Express, Request, RequestHandler, Response } from 'express';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { tmdbAccessToken } from '../utils/config';
import { registerDiscoverApi } from './discover-api';
import type { TmdbMovie, TmdbMoviesRawResponse } from '../types/MoviesTypes';

vi.mock('../utils/config', () => ({
  tmdbAccessToken: 'test-access-token',
}));

type RouteHandler = (
  req: Request,
  res: Response,
  next: (error?: unknown) => void,
) => void | Promise<void>;

const handlers = new Map<string, RequestHandler>();
const app = {
  get: (path: string, handler: RequestHandler) => handlers.set(path, handler),
} as unknown as Express;

function getHandler(path: string): RouteHandler {
  const handler = handlers.get(path);
  if (!handler) throw new Error(`No handler registered for ${path}`);
  return handler as RouteHandler;
}

function createResponse() {
  const response = { json: vi.fn(), status: vi.fn() };
  response.status.mockReturnValue(response);
  return response as unknown as Response & {
    json: ReturnType<typeof vi.fn>;
    status: ReturnType<typeof vi.fn>;
  };
}

function tmdbResponse(data: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: vi.fn().mockResolvedValue(data),
  } as unknown as Response;
}

const rawMovie: TmdbMovie = {
  adult: false,
  backdrop_path: '/backdrop.jpg',
  genre_ids: [18],
  id: 42,
  original_language: 'en',
  original_title: 'Original title',
  overview: 'A story',
  popularity: 12.5,
  poster_path: '/poster.jpg',
  release_date: '2020-06-01',
  title: 'Movie title',
  video: false,
  vote_average: 7.5,
  vote_count: 100,
};

describe('discover API', () => {
  beforeEach(() => {
    handlers.clear();
    registerDiscoverApi(app);
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('GET /api/discover/movies', () => {
    it('sends the year and custom options, then returns converted movies', async () => {
      // Arrange
      const rawData: TmdbMoviesRawResponse = {
        page: 2,
        results: [rawMovie],
        total_pages: 4,
        total_results: 73,
      };
      const fetchMock = vi.fn().mockResolvedValueOnce(tmdbResponse(rawData));
      vi.stubGlobal('fetch', fetchMock);
      const response = createResponse();

      // Act
      await getHandler('/api/discover/movies')(
        {
          query: {
            year: '2020',
            language: 'en-US',
            page: '2',
            region: 'US',
          },
        } as unknown as Request,
        response,
        vi.fn(),
      );

      // Assert
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.themoviedb.org/3/discover/movie?primary_release_year=2020&language=en-US&page=2&region=US',
        {
          headers: {
            Authorization: `Bearer ${tmdbAccessToken}`,
            'Content-Type': 'application/json;charset=utf-8',
          },
        },
      );
      expect(response.json).toHaveBeenCalledWith({
        page: 2,
        results: [
          {
            backdrop_path: '/backdrop.jpg',
            genre_ids: [18],
            id: 42,
            original_language: 'en',
            original_title: 'Original title',
            overview: 'A story',
            popularity: 12.5,
            poster_path: '/poster.jpg',
            release_date: '2020-06-01',
            title: 'Movie title',
            vote_average: 7.5,
            vote_count: 100,
          },
        ],
        total_pages: 4,
        total_results: 73,
      });
    });

    it('uses default options and preserves pagination for an empty result', async () => {
      // Arrange
      const rawData: TmdbMoviesRawResponse = {
        page: 1,
        results: [],
        total_pages: 0,
        total_results: 0,
      };
      const fetchMock = vi.fn().mockResolvedValueOnce(tmdbResponse(rawData));
      vi.stubGlobal('fetch', fetchMock);
      const response = createResponse();

      // Act
      await getHandler('/api/discover/movies')(
        { query: { year: '2020' } } as unknown as Request,
        response,
        vi.fn(),
      );

      // Assert
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.themoviedb.org/3/discover/movie?primary_release_year=2020&language=fr-FR&page=1&region=FR',
        expect.any(Object),
      );
      expect(response.json).toHaveBeenCalledWith({
        page: 1,
        results: [],
        total_pages: 0,
        total_results: 0,
      });
    });

    it('defaults empty or non-string optional parameters', async () => {
      // Arrange
      const fetchMock = vi.fn().mockResolvedValueOnce(
        tmdbResponse({
          page: 1,
          results: [],
          total_pages: 0,
          total_results: 0,
        }),
      );
      vi.stubGlobal('fetch', fetchMock);
      const response = createResponse();

      // Act
      await getHandler('/api/discover/movies')(
        {
          query: {
            year: '2020',
            language: '',
            page: ['3', '4'],
            region: { code: 'CA' },
          },
        } as unknown as Request,
        response,
        vi.fn(),
      );

      // Assert
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.themoviedb.org/3/discover/movie?primary_release_year=2020&language=fr-FR&page=1&region=FR',
        expect.any(Object),
      );
      expect(response.status).not.toHaveBeenCalled();
    });

    it.each([
      ['missing', undefined],
      ['repeated', ['2020', '2021']],
      ['structured', { value: '2020' }],
      ['not numeric', '20x0'],
      ['below range', '0999'],
      ['more than four digits', '10000'],
    ])('rejects a %s year without calling TMDB', async (_label, year) => {
      // Arrange
      const fetchMock = vi.fn();
      vi.stubGlobal('fetch', fetchMock);
      const response = createResponse();

      // Act
      await getHandler('/api/discover/movies')(
        { query: { year } } as unknown as Request,
        response,
        vi.fn(),
      );

      // Assert
      expect(fetchMock).not.toHaveBeenCalled();
      expect(response.status).toHaveBeenCalledWith(400);
      expect(response.json).toHaveBeenCalledWith({
        error: 'year must be a four-digit string between 1000 and 9999',
      });
    });

    it('logs TMDB HTTP, network, and JSON errors and returns HTTP 500', async () => {
      // Arrange
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(tmdbResponse({}, false, 503))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
        });
      vi.stubGlobal('fetch', fetchMock);
      const responses = [createResponse(), createResponse(), createResponse()];

      // Act
      for (const response of responses) {
        await getHandler('/api/discover/movies')(
          { query: { year: '2020' } } as unknown as Request,
          response,
          vi.fn(),
        );
      }

      // Assert
      for (const response of responses) {
        expect(response.status).toHaveBeenCalledWith(500);
        expect(response.json).toHaveBeenCalledWith({
          error: 'Failed to discover movies',
        });
      }
      expect(console.error).toHaveBeenCalledTimes(3);
    });
  });
});
