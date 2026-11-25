import MoviePoster from '../MoviePoster/MoviePoster';
import './MostPopularMovieWidget.css';

/**
 * Popularity is the supplied popularity index, not a rating or vote count.
 * The widget displays the chosen movie and does not rank or aggregate movies.
 */
export type MostPopularMovieWidgetProps =
  | { status: 'loading' }
  | { status: 'error' }
  | {
      status: 'success';
      movie: {
        title: string;
        releaseYear: number | null;
        popularity: number | null;
        posterUrl: string | null;
      };
    };

export default function MostPopularMovieWidget(
  props: MostPopularMovieWidgetProps,
) {
  return (
    <section
      className="most-popular-movie-widget"
      aria-labelledby="most-popular-movie-widget-title"
      aria-busy={props.status === 'loading'}
    >
      <p className="most-popular-movie-widget__eyebrow">
        Sélection du catalogue
      </p>
      <h2 id="most-popular-movie-widget-title">Film le plus populaire</h2>

      {props.status === 'loading' && (
        <p className="most-popular-movie-widget__message" role="status">
          Chargement du film le plus populaire…
        </p>
      )}

      {props.status === 'error' && (
        <p className="most-popular-movie-widget__message" role="alert">
          Le film le plus populaire est indisponible.
        </p>
      )}

      {props.status === 'success' && (
        <div className="most-popular-movie-widget__movie">
          <MoviePoster
            movieTitle={props.movie.title}
            posterUrl={props.movie.posterUrl}
          />
          <div className="most-popular-movie-widget__details">
            <h3 className="most-popular-movie-widget__movie-title">
              {props.movie.title}
            </h3>
            <p className="most-popular-movie-widget__year">
              {props.movie.releaseYear ?? 'Année inconnue'}
            </p>
            <p className="most-popular-movie-widget__popularity-label">
              Indice de popularité
            </p>
            <p className="most-popular-movie-widget__popularity-value">
              {props.movie.popularity === null
                ? 'Valeur inconnue'
                : new Intl.NumberFormat('fr-FR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }).format(props.movie.popularity)}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
