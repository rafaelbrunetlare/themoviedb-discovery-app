import { useState } from 'react';
import './MoviePoster.css';

export interface MoviePosterProps {
  movieTitle: string;
  posterUrl: string | null;
}

export default function MoviePoster({
  movieTitle,
  posterUrl,
}: MoviePosterProps) {
  const [failedPosterUrl, setFailedPosterUrl] = useState<string | null>(null);

  return (
    <div className="movie-poster">
      {posterUrl && failedPosterUrl !== posterUrl ? (
        <img
          src={posterUrl}
          alt={`Affiche de ${movieTitle}`}
          onError={() => setFailedPosterUrl(posterUrl)}
        />
      ) : (
        <div
          className="movie-poster__fallback"
          role="img"
          aria-label={`Affiche indisponible pour ${movieTitle}`}
        >
          Affiche indisponible
        </div>
      )}
    </div>
  );
}
