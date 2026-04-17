# vai-calcio.fr

Site de news et infos sur le football italien (Serie A).

## Stack technique

- **Framework**: Astro 5 (SSG + SSR routes)
- **CMS**: WordPress headless (wp.vai-calcio.fr)
- **UI**: Tailwind CSS 3, Preact islands
- **Recherche**: Pagefind
- **Newsletter**: Brevo API
- **APIs**: Football-API, Football-data.org, TheSportsDB
- **Déploiement**: Node.js + PM2 + Nginx (KimSufi OVH)

## Développement

```bash
# Installer les dépendances
npm install

# Copier les variables d'environnement
cp .env.example .env

# Démarrer le serveur de développement
npm run dev

# Build pour production
npm run build

# Prévisualiser le build
npm run preview
```

## Configuration

Voir `.env.example` pour les variables d'environnement requises.

Voir `CLAUDE.md` pour la documentation complète du projet.

## Documentation

- `/docs/wordpress-setup.md` — Configuration WordPress headless
- `CLAUDE.md` — Architecture, conventions, cache strategy

## Déploiement

```bash
# Build et déploiement vers serveur KimSufi
./deploy.sh
```

Le site tourne sur PM2 (port 4321) derrière Nginx reverse proxy.
