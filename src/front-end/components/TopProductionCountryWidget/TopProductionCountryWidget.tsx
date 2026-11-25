import './TopProductionCountryWidget.css';

/**
 * Supply the most represented country and its precomputed movie count.
 * Deduplicate movie-country associations before passing the count; this widget
 * does not aggregate or recount them.
 */
export type TopProductionCountryWidgetProps =
  | { status: 'loading' }
  | { status: 'empty' }
  | { status: 'error' }
  | { status: 'success'; countryName: string; movieCount: number };

export default function TopProductionCountryWidget(
  props: TopProductionCountryWidgetProps,
) {
  return (
    <section
      className="top-production-country-widget"
      aria-labelledby="top-production-country-widget-title"
      aria-busy={props.status === 'loading'}
    >
      <p className="top-production-country-widget__eyebrow">
        Origine du catalogue
      </p>
      <h2 id="top-production-country-widget-title">Pays le plus représenté</h2>

      {props.status === 'loading' && (
        <p className="top-production-country-widget__message" role="status">
          Chargement du pays le plus représenté…
        </p>
      )}

      {props.status === 'empty' && (
        <p className="top-production-country-widget__message" role="status">
          Aucun pays de production connu.
        </p>
      )}

      {props.status === 'error' && (
        <p className="top-production-country-widget__message" role="alert">
          Le pays le plus représenté est indisponible.
        </p>
      )}

      {props.status === 'success' && (
        <div className="top-production-country-widget__result">
          <p className="top-production-country-widget__country">
            {props.countryName}
          </p>
          <p className="top-production-country-widget__count">
            <span>
              {new Intl.NumberFormat('fr-FR').format(props.movieCount)}
            </span>{' '}
            <span>films</span>
          </p>
        </div>
      )}
    </section>
  );
}
