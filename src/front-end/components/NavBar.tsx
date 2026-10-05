import { NavLink } from 'react-router';
import './NavBar.css';

export default function NavBar() {
  return (
    <header className="navbar-band">
      <nav className="navbar navbar--banner" aria-label="Navigation principale">
        <NavLink className="navbar__brand" to="/" end>
          TMDB Discovery
        </NavLink>
        <ul className="navbar__links">
          <li>
            <NavLink className="navbar__link" to="/" end>
              Films populaires
            </NavLink>
          </li>
          <li>
            <NavLink className="navbar__link" to="/about">
              À propos
            </NavLink>
          </li>
        </ul>
      </nav>
    </header>
  );
}
