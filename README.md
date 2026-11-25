# themoviedb-discovery-app

Application web de découverte de films qui s'appuie sur l'API de [The Movie Database (TMDB)](https://www.themoviedb.org/). Elle affiche les films populaires en France et permet de consulter leur fiche détaillée.

## Fonctionnalités

- Liste des films populaires, avec pagination et paramètres de langue et de région.
- Fiche détaillée pour chaque film.
- Pages « À propos » et « Page introuvable ».
- Thème clair ou sombre, conservé dans le navigateur.
- API Express intermédiaire pour appeler TMDB sans exposer le jeton dans le navigateur.

Les paramètres par défaut sont la langue `fr-FR`, la région `FR` et la première page.

## Prérequis

- Node.js 24 (version indiquée dans `.nvmrc`).
- npm.
- Un jeton d'accès à l'API TMDB. Vous pouvez en obtenir un depuis les paramètres de votre compte TMDB, dans la section API.

## Installation et démarrage

1. Installez les dépendances :

   ```sh
   npm install
   ```

2. Créez un fichier `.env` à la racine du projet et ajoutez votre jeton d'accès :

   ```dotenv
   TMDB_ACCESS_TOKEN=votre_jeton_d_acces_tmdb
   ```

   Gardez ce jeton privé et ne le publiez pas dans le dépôt.

3. Démarrez le serveur et l'application :

   ```sh
   npm run dev
   ```

4. Ouvrez [http://localhost:5173](http://localhost:5173).

Le serveur Express écoute sur le port `3000`. Vite sert l'interface sur le port `5173` et transmet les requêtes `/api` au serveur Express.

## Storybook

Storybook permet de visualiser les composants de l'interface sans lancer l'API :

```sh
npm run storybook
```

Ouvrez [http://localhost:6006](http://localhost:6006). La story du tableau de
bord présente son état sans widget ; le sélecteur de thème permet de vérifier
les variantes claire et sombre.

Le widget « Films en base » propose des stories pour le chargement, les films
disponibles, une base vide et une erreur. Il est piloté par ses propriétés et
utilise des nombres de démonstration ; le back-end actuel ne fournit pas encore
de décompte de films stockés.

Le widget « Durée moyenne » reçoit une moyenne déjà calculée à partir des
durées valides, exprimée en minutes. Si aucune durée valide n'est disponible,
utilisez l'état `empty` plutôt que de fournir `0`. Ses stories couvrent les
états nominal (107 min), chargement, absence de données et erreur.

Le widget « Note moyenne » reçoit une note calculée en amont sur le catalogue
complet et précise si elle est simple ou pondérée. Il affiche la note avec deux
décimales au format français sur 10. Utilisez l'état `empty` en l'absence de
notes ; ses stories présentent les états nominal (6,78 / 10), chargement, sans
notes et erreur.

Le widget « Pays le plus représenté » reçoit le pays gagnant et son effectif
déjà calculé. Les associations multiples d'un film à plusieurs pays doivent
être dédupliquées avant de fournir le résultat ; le composant ne les recompte
pas. Ses stories couvrent l'exemple (United States of America, 725 films), un
nom long, chargement, absence de pays connu et erreur.

Pour documenter un futur widget, ajoutez un fichier
`NomDuWidget.stories.tsx` près de son composant et exportez une story pour chaque
état pertinent, par exemple chargement, données disponibles, aucun résultat et
erreur. Utilisez des données de démonstration contrôlées afin que les stories
restent reproductibles. Pour générer une version statique de Storybook, lancez
`npm run build-storybook` ; les fichiers sont produits dans `storybook-static/`.

## API locale

| Méthode | Route                 | Description                                                       |
| ------- | --------------------- | ----------------------------------------------------------------- |
| `GET`   | `/api/health`         | Vérifie que le serveur répond.                                    |
| `GET`   | `/api/movies/popular` | Renvoie les films populaires.                                     |
| `GET`   | `/api/movies/:id`     | Renvoie les détails du film correspondant à son identifiant TMDB. |

Les routes des films acceptent les paramètres `language`, `page` et `region`. Exemple :

```text
/api/movies/popular?language=fr-FR&page=1&region=FR
```

## Vérifications

```sh
npm test          # Lance les tests avec la couverture
npm run test:verbose
npm run lint      # Vérifie le code
npm run fmt:check # Vérifie le formatage
```

La configuration de couverture des tests exige 100 % pour les instructions, branches, fonctions et lignes.
