import MoviePoster from '../MoviePoster/MoviePoster';
import './MovieRoiWidget.css';

/**
 * ROI and movie eligibility are determined upstream. This widget only
 * displays the supplied result; no ROI formula or ranking is applied here.
 */
export type MovieRoiWidgetProps =
  | {
      kind: 'most-profitable' | 'least-profitable';
      status: 'loading' | 'empty' | 'error';
    }
  | {
      kind: 'most-profitable' | 'least-profitable';
      status: 'success';
      movie: {
        title: string;
        releaseYear: number | null;
        posterUrl: string | null;
        roiPercent: number | null;
      };
    };

export default function MovieRoiWidget(props: MovieRoiWidgetProps) {
  const title =
    props.kind === 'most-profitable'
      ? 'Film le plus rentable'
      : 'Film le moins rentable';

  return (
    <section
      className="movie-roi-widget"
      aria-labelledby="movie-roi-widget-title"
      aria-busy={props.status === 'loading'}
    >
      <p className="movie-roi-widget__eyebrow">Rentabilité du catalogue</p>
      <h2 id="movie-roi-widget-title">{title}</h2>

      {props.status === 'loading' && (
        <p className="movie-roi-widget__message" role="status">
          Chargement du film…
        </p>
      )}

      {props.status === 'empty' && (
        <p className="movie-roi-widget__message" role="status">
          Aucun film éligible au calcul du ROI.
        </p>
      )}

      {props.status === 'error' && (
        <p className="movie-roi-widget__message" role="alert">
          Le résultat du ROI est indisponible.
        </p>
      )}

      {props.status === 'success' && (
        <div className="movie-roi-widget__movie">
          <MoviePoster
            movieTitle={props.movie.title}
            posterUrl={props.movie.posterUrl}
          />
          <div className="movie-roi-widget__details">
            <h3 className="movie-roi-widget__movie-title">
              {props.movie.title}
            </h3>
            <p className="movie-roi-widget__year">
              {props.movie.releaseYear ?? 'Année inconnue'}
            </p>
            <p className="movie-roi-widget__roi-label">
              Retour sur investissement (ROI)
            </p>
            <p className="movie-roi-widget__roi-value">
              {props.movie.roiPercent === null ? (
                'Valeur inconnue'
              ) : (
                <>
                  <span>
                    {new Intl.NumberFormat('fr-FR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }).format(props.movie.roiPercent)}
                  </span>{' '}
                  <span>% ROI</span>
                </>
              )}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
