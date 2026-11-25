import './AverageRatingWidget.css';

/**
 * The success value is precomputed across the complete catalog, not a single
 * page of movies. Use the empty state when no ratings are available.
 */
export type AverageRatingWidgetProps =
  | { status: 'loading' }
  | { status: 'empty' }
  | { status: 'error' }
  | {
      status: 'success';
      averageRating: number;
      method: 'simple' | 'weighted';
    };

export default function AverageRatingWidget(props: AverageRatingWidgetProps) {
  return (
    <section
      className="average-rating-widget"
      aria-labelledby="average-rating-widget-title"
      aria-busy={props.status === 'loading'}
    >
      <p className="average-rating-widget__eyebrow">Catalogue</p>
      <h2 id="average-rating-widget-title">Note moyenne</h2>

      {props.status === 'loading' && (
        <p className="average-rating-widget__message" role="status">
          Chargement de la note moyenne…
        </p>
      )}

      {props.status === 'empty' && (
        <p className="average-rating-widget__message" role="status">
          Aucune note disponible.
        </p>
      )}

      {props.status === 'error' && (
        <p className="average-rating-widget__message" role="alert">
          La note moyenne est indisponible.
        </p>
      )}

      {props.status === 'success' && (
        <>
          <p className="average-rating-widget__value">
            <span>
              {new Intl.NumberFormat('fr-FR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }).format(props.averageRating)}
            </span>{' '}
            <span className="average-rating-widget__scale">/ 10</span>
          </p>
          <p className="average-rating-widget__method">
            {props.method === 'simple' ? 'Moyenne simple' : 'Note pondérée'}
          </p>
        </>
      )}
    </section>
  );
}
