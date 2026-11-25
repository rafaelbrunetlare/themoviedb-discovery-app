import './MoviesDashboardPage.css';

export default function MoviesDashboardPage() {
  return (
    <main className="app-shell movies-dashboard">
      <header className="movies-dashboard__header">
        <p className="movies-dashboard__eyebrow">TMDB Discovery</p>
        <h1>Tableau de bord des films</h1>
        <p>
          Retrouvez ici les informations clés sur les films, leurs genres et
          leurs pays de production.
        </p>
      </header>

      <section
        className="movies-dashboard__empty-state"
        aria-labelledby="movies-dashboard-empty-title"
      >
        <span className="movies-dashboard__empty-icon" aria-hidden="true">
          +
        </span>
        <h2 id="movies-dashboard-empty-title">Aucun widget pour le moment</h2>
        <p>
          Les widgets de films, de genres et de pays de production apparaîtront
          ici lorsqu’ils seront configurés.
        </p>
      </section>
    </main>
  );
}
