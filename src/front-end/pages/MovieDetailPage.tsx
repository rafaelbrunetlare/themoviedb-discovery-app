import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import type { MovieDetail } from '../../back-end/schemas/MoviesTypes';
import MovieDetailCard from '../components/MovieDetailCard';

export default function MovieDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [result, setResult] = useState<{
    id: string;
    movie?: MovieDetail;
    error: boolean;
  } | null>(null);

  useEffect(() => {
    if (!id) return;

    const controller = new AbortController();

    fetch(`/api/movies/${id}`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('Film introuvable');
        return response.json() as Promise<MovieDetail>;
      })
      .then((movie) => setResult({ id, movie, error: false }))
      .catch((fetchError: unknown) => {
        if (
          !(fetchError instanceof Error && fetchError.name === 'AbortError')
        ) {
          setResult({ id, error: true });
        }
      });

    return () => controller.abort();
  }, [id]);

  const currentResult = result?.id === id ? result : null;

  return (
    <main className="app-shell movie-detail-page">
      <header className="app-header movie-detail-page__header">
        <h1>Détails du film</h1>
        <Link className="movie-detail-page__back" to="/">
          ← Retour vers les films populaires
        </Link>
      </header>
      {currentResult?.error ? (
        <p className="status-message" role="alert">
          Impossible de récupérer les détails de ce film.
        </p>
      ) : currentResult?.movie ? (
        <MovieDetailCard movie={currentResult.movie} />
      ) : (
        <p className="status-message" role="status">
          Chargement des détails du film…
        </p>
      )}
    </main>
  );
}
