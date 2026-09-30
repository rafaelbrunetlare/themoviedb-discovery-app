import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Express } from 'express';
import { registerMoviesApiID } from './movies-api';

// Mock the necessary modules and functions
const { getMock, listenMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
  listenMock: vi.fn(),
}));

vi.mock('express', () => ({
  default: vi.fn(() => ({
    get: getMock,
    listen: listenMock,
  })),
}));

vi.mock('./config', () => ({
  tmdbAccessToken: 'test-access-token',
}));

// Import the code under test after setting up the mocks
import './index';

// Define types for the request and response objects used in the route handlers
type RouteHandler = (req: Request, res: Response) => void | Promise<void>;

// Create a map of route handlers for easy access in tests
const routeHandlers = new Map<string, RouteHandler>(
  getMock.mock.calls.map(([path, handler]) => [
    path as string,
    handler as RouteHandler,
  ]),
);

// Check if the server was started on the expected port
const serverWasStarted = listenMock.mock.calls.some(([port]) => port === 3000);

describe('back-end server routes', () => {
  // Clear mocks before each test to ensure isolation
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('server setup', () => {
    describe('server listening', () => {
      it('starts the server on port 3000', () => {
        expect(serverWasStarted).toBe(true);
      });
    });
  });

  describe('route registration', () => {
    it('registers the /api/movies/popular route', () => {
      expect(routeHandlers.has('/api/movies/popular')).toBe(true);
    });

    it('fetches and transforms a movie by id', async () => {
      const rawMovie = {
        adult: false,
        backdrop_path: '/backdrop.jpg',
        id: 123,
        genre_ids: [18],
        original_language: 'en',
        original_title: 'A Film',
        overview: 'Overview',
        popularity: 10,
        poster_path: '/poster.jpg',
        release_date: '2024-01-01',
        title: 'A Film',
        video: false,
        vote_average: 7,
        vote_count: 100,
      };
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(rawMovie),
      });
      vi.stubGlobal('fetch', fetchMock);
      const json = vi.fn();
      const movieRouteMock = vi.fn();
      registerMoviesApiID({ get: movieRouteMock } as unknown as Express);
      const [path, registeredHandler] = movieRouteMock.mock.calls[0];
      const handler = registeredHandler as RouteHandler;

      await handler?.(
        { params: { id: '123' }, query: { language: 'en-US' } } as Request,
        { json } as Response,
      );

      expect(path).toBe('/api/movies/:id');
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.themoviedb.org/3/movie/123?language=en-US',
        expect.any(Object),
      );
      expect(json).toHaveBeenCalledWith({
        backdrop_path: '/backdrop.jpg',
        genre_ids: [18],
        id: 123,
        original_language: 'en',
        original_title: 'A Film',
        overview: 'Overview',
        popularity: 10,
        poster_path: '/poster.jpg',
        release_date: '2024-01-01',
        title: 'A Film',
        vote_average: 7,
        vote_count: 100,
      });
    });

    it('registers the /api/health route', () => {
      expect(routeHandlers.has('/api/health')).toBe(true);
    });
  });
});
