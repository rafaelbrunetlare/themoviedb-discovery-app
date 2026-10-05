import { Link } from 'react-router';

export default function NotFoundPage() {
  return (
    <main className="app-shell">
      <h1>Page introuvable</h1>
      <Link to="/">Retour aux films populaires</Link>
    </main>
  );
}
