import './MovieCountWidget.css';

type MovieCountWidgetProps =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'success'; count: number };

export default function MovieCountWidget(props: MovieCountWidgetProps) {
  return (
    <section
      className="movie-count-widget"
      aria-labelledby="movie-count-widget-title"
      aria-busy={props.status === 'loading'}
    >
      <p className="movie-count-widget__eyebrow">Bibliothèque</p>
      <h2 id="movie-count-widget-title">Films en base</h2>

      {props.status === 'loading' && (
        <p className="movie-count-widget__message" role="status">
          Chargement du nombre de films…
        </p>
      )}

      {props.status === 'error' && (
        <p className="movie-count-widget__message" role="alert">
          Le nombre de films est indisponible.
        </p>
      )}

      {props.status === 'success' && (
        <div className="movie-count-widget__result">
          <p className="movie-count-widget__count">
            {new Intl.NumberFormat('fr-FR').format(props.count)}
          </p>
          <p className="movie-count-widget__label">
            {props.count === 1 ? 'film enregistré' : 'films enregistrés'}
          </p>
          {props.count === 0 && (
            <p className="movie-count-widget__message">
              Aucun film n’est encore enregistré.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
