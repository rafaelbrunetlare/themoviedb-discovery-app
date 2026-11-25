import './BestRatedMovieWidget.css';
import MoviePoster from '../MoviePoster/MoviePoster';

/**
 * Supply the already selected best-rated movie. Use null for an unavailable
 * poster or release year; the widget renders explicit fallbacks for both.
 */
export type BestRatedMovieWidgetProps =
  | { status: 'loading' }
  | { status: 'empty' }
  | { status: 'error' }
  | {
      status: 'success';
      movie: {
        title: string;
        releaseYear: number | null;
        rating: number;
        posterUrl: string | null;
      };
    };

export default function BestRatedMovieWidget(props: BestRatedMovieWidgetProps) {
  return (
    <section
      className="best-rated-movie-widget"
      aria-labelledby="best-rated-movie-widget-title"
      aria-busy={props.status === 'loading'}
    >
      <p className="best-rated-movie-widget__eyebrow">Sélection du catalogue</p>
      <h2 id="best-rated-movie-widget-title">Film le mieux noté</h2>

      {props.status === 'loading' && (
        <p className="best-rated-movie-widget__message" role="status">
          Chargement du film le mieux noté…
        </p>
      )}

      {props.status === 'empty' && (
        <p className="best-rated-movie-widget__message" role="status">
          Aucun film noté disponible.
        </p>
      )}

      {props.status === 'error' && (
        <p className="best-rated-movie-widget__message" role="alert">
          Le film le mieux noté est indisponible.
        </p>
      )}

      {props.status === 'success' && (
        <div className="best-rated-movie-widget__movie">
          <MoviePoster
            movieTitle={props.movie.title}
            posterUrl={props.movie.posterUrl}
          />
          <div className="best-rated-movie-widget__details">
            <h3 className="best-rated-movie-widget__movie-title">
              {props.movie.title}
            </h3>
            <p className="best-rated-movie-widget__year">
              {props.movie.releaseYear ?? 'Année inconnue'}
            </p>
            <p className="best-rated-movie-widget__rating">
              <span>
                {new Intl.NumberFormat('fr-FR', {
                  maximumFractionDigits: 1,
                }).format(props.movie.rating)}
              </span>{' '}
              <span>/ 10</span>
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
