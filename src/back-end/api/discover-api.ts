import type { Express } from 'express';
import express from 'express';
import type {
  MoviesApiResponse,
  TmdbMoviesRawResponse,
} from '../types/MoviesTypes';
import { tmdbAccessToken } from '../utils/config';
import { toSupportedMovie } from '../utils/converter';
import {
  DEFAULT_LANGUAGE,
  DEFAULT_PAGE,
  DEFAULT_REGION,
} from '../utils/constants';

function getQueryString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.length > 0 ? value : fallback;
}

export function registerDiscoverApi(app: Express): void {
  app.get(
    '/api/discover/movies',
    async (req: express.Request, res: express.Response) => {
      const { year } = req.query;

      if (typeof year !== 'string' || !/^[1-9]\d{3}$/.test(year)) {
        res.status(400).json({
          error: 'year must be a four-digit string between 1000 and 9999',
        });
        return;
      }

      const queryParams = new URLSearchParams({
        primary_release_year: year,
        language: getQueryString(req.query.language, DEFAULT_LANGUAGE),
        page: getQueryString(req.query.page, String(DEFAULT_PAGE)),
        region: getQueryString(req.query.region, DEFAULT_REGION),
      });

      try {
        const response = await fetch(
          `https://api.themoviedb.org/3/discover/movie?${queryParams.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${tmdbAccessToken}`,
              'Content-Type': 'application/json;charset=utf-8',
            },
          },
        );

        if (!response.ok) {
          throw new Error(
            `TMDB API request failed with status ${response.status}`,
          );
        }

        const rawData = (await response.json()) as TmdbMoviesRawResponse;
        const data: MoviesApiResponse = {
          page: rawData.page,
          results: rawData.results.map(toSupportedMovie),
          total_pages: rawData.total_pages,
          total_results: rawData.total_results,
        };

        res.json(data);
      } catch (error) {
        console.error('Error discovering movies:', error);
        res.status(500).json({ error: 'Failed to discover movies' });
      }
    },
  );
}
