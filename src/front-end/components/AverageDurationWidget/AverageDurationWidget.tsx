import './AverageDurationWidget.css';

/**
 * The success value is a precomputed average in minutes, based only on valid
 * movie runtimes. Use the empty state when no valid runtime is available.
 */
export type AverageDurationWidgetProps =
  | { status: 'loading' }
  | { status: 'empty' }
  | { status: 'error' }
  | { status: 'success'; averageDuration: number };

export default function AverageDurationWidget(
  props: AverageDurationWidgetProps,
) {
  return (
    <section
      className="average-duration-widget"
      aria-labelledby="average-duration-widget-title"
      aria-busy={props.status === 'loading'}
    >
      <p className="average-duration-widget__eyebrow">Catalogue</p>
      <h2 id="average-duration-widget-title">Durée moyenne</h2>

      {props.status === 'loading' && (
        <p className="average-duration-widget__message" role="status">
          Chargement de la durée moyenne…
        </p>
      )}

      {props.status === 'empty' && (
        <p className="average-duration-widget__message" role="status">
          Aucune durée valide disponible.
        </p>
      )}

      {props.status === 'error' && (
        <p className="average-duration-widget__message" role="alert">
          La durée moyenne est indisponible.
        </p>
      )}

      {props.status === 'success' && (
        <p className="average-duration-widget__value">
          <span>
            {new Intl.NumberFormat('fr-FR', {
              maximumFractionDigits: 1,
            }).format(props.averageDuration)}
          </span>{' '}
          <span className="average-duration-widget__unit">min</span>
        </p>
      )}
    </section>
  );
}
