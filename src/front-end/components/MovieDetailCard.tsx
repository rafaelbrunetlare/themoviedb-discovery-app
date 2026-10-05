import type { MovieDetail } from '../../back-end/schemas/MoviesTypes';
import './MovieDetailCard.css';

type MovieDetailCardProps = {
  movie: MovieDetail;
};

export default function MovieDetailCard({ movie }: MovieDetailCardProps) {
  const releaseYear = movie.release_date
    ? movie.release_date.slice(0, 4)
    : 'Date inconnue';
  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : null;

  return (
    <article className="movie-detail-card">
      {posterUrl ? (
        <img
          className="movie-detail-card__poster"
          src={posterUrl}
          alt={`Affiche de ${movie.title}`}
        />
      ) : (
        <div
          className="movie-detail-card__poster movie-detail-card__poster--empty"
          role="img"
          aria-label={`Affiche indisponible pour ${movie.title}`}
        />
      )}
      <div className="movie-detail-card__content">
        <p className="movie-detail-card__eyebrow">Détails du film</p>
        <h2>{movie.title}</h2>
        {movie.tagline && (
          <p className="movie-detail-card__tagline">{movie.tagline}</p>
        )}
        <div className="movie-detail-card__metadata">
          <span>Année de sortie {releaseYear}</span>
          <span>Note {movie.vote_average.toFixed(1)}</span>
        </div>
        <section
          className="movie-detail-card__section"
          aria-labelledby="movie-genres"
        >
          <h3 id="movie-genres">Genres</h3>
          {movie.genres.length > 0 ? (
            <ul className="movie-detail-card__genres">
              {movie.genres.map((genre) => (
                <li key={genre.id}>{genre.name}</li>
              ))}
            </ul>
          ) : (
            <p className="movie-detail-card__empty">Genres indisponibles</p>
          )}
        </section>
        <section
          className="movie-detail-card__section"
          aria-labelledby="movie-overview"
        >
          <h3 id="movie-overview">Résumé</h3>
          <p className="movie-detail-card__overview">
            {movie.overview || 'Aucun résumé disponible pour ce film.'}
          </p>
        </section>
      </div>
    </article>
  );
}
