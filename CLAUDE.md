# vai-calcio.fr — Project Documentation

Site de news et infos sur le football italien (Serie A principalement).

## Architecture

### Stack

| Composant | Technologie | Version |
|-----------|-------------|---------|
| Framework | Astro | 5.18.1 |
| Adapter | @astrojs/node | 9.x |
| CMS | WordPress headless | Latest |
| UI Framework | Tailwind CSS | 3.x |
| Islands | Preact | Latest |
| Recherche | Pagefind (astro-pagefind) | Latest |
| Newsletter | Brevo API | v3 |
| GraphQL Client | graphql-request | Latest |
| Serveur | Node.js + PM2 + Nginx | - |
| Hosting | KimSufi OVH | - |

### Rendering Strategy

Astro 5 utilise `output: 'static'` par défaut avec adapter Node.

**Pages statiques** (prerender par défaut) :
- Pages de contenu : équipes, joueurs, arbitres, classement, résultats
- Pages légales, à propos, contact
- Sitemap HTML
- Taxonomie (tags, catégories)

**Routes SSR** (`export const prerender = false`) :
- `/api/revalidate` — webhook WordPress
- `/api/newsletter` — inscription newsletter
- `/api/scores` — proxy API football (cache serveur)
- `/api/standings` — proxy classement
- `/blog/[slug]` — articles individuels (SSR + cache experimental)

### WordPress Headless

**URL** : wp.vai-calcio.fr

**Plugins requis** :
- WPGraphQL
- ACF (Advanced Custom Fields)
- RankMath SEO
- WP Webhooks (ou custom functions.php)

**Custom Post Types** :
- `article` — posts WordPress natifs (titre, contenu, excerpt, image, catégorie, tags, équipe(s) liée(s))
- `formation` — CPT custom (journée, match, équipe, joueurs[], score confiance[], source[], date scraping)

**Custom Taxonomies** :
- `equipe` — lier articles à une ou plusieurs équipes
- `competition` — Serie A, Coppa Italia, Squadra Azzurra

**Duplicate content prevention** :
.htaccess sur wp.vai-calcio.fr avec redirect 301 vers vai-calcio.fr (voir docs/wordpress-setup.md).

### Cache Strategy

**Cache serveur fichier JSON** (`lib/cache.ts`) :
- Persiste sur disque (`.cache/api-cache.json`)
- Survit aux redémarrages PM2
- TTL par type de donnée

**TTL par ressource** :
- Classement : 24h (rebuild cron quotidien)
- Résultats : 6h
- Calendrier : 24h
- Live scores : 30s (mémoire uniquement, pendant fenêtres de match)
- Stats joueurs : 7 jours
- Fiches équipes/logos TheSportsDB : 30 jours

**Route caching Astro 5 experimental** :
- Articles blog : SSR avec `cache.set({ maxAge: 3600, swr: 600, tags: ['blog', 'post-{id}'] })`
- Invalidation via webhook `/api/revalidate`

**Fallback** : Nginx proxy_cache (si route caching instable).

### APIs Football

**Multi-API strategy** (à confirmer avec APIs trouvées) :

| API | Usage | Rate limit |
|-----|-------|------------|
| API-Football | Live scores, lineups, stats joueurs, arbitres | À confirmer |
| Football-data.org | Classement, calendrier, résultats (backup) | À confirmer |
| TheSportsDB | Logos équipes, photos stades, bannières (gratuit illimité) | Illimité |

**Client abstraction** : `lib/football-api.ts` — abstraction multi-API avec fallback automatique.

**Proxy endpoints** :
- `/api/scores` — proxy API football (jamais exposé au client)
- `/api/standings` — proxy classement

**Détection fenêtres de match** :
- Composant `LiveScores.tsx` : compare heure actuelle avec kick-off
- Polling 30s actif uniquement si match en cours (kick-off - 15min → fin + 30min)
- Sinon : affiche derniers scores statiques, zéro polling

### Formations Probables — Scraper

**Architecture** :
- Docker + Python + Camoufox (anti-bot browser)
- Sources : Sky Sport IT, Gazzetta dello Sport, TuttoSport, Corriere dello Sport
- Logique : scrape → parse → calcul score confiance (joueur cité par N/M sources) → POST WordPress REST API
- CPT WordPress `formation` avec ACF fields
- Consommation via WPGraphQL dans Astro

**Cron schedule** :
- Jeudi 10h : scrape matchs samedi/dimanche
- Samedi 8h : mise à jour pré-match
- Mardi 10h : matchs en milieu de semaine (si applicable)

### Newsletter

**Provider** : Brevo (ex-Sendinblue)
**Plan** : Gratuit (300 emails/jour, contacts illimités)

**Workflow** :
1. Formulaire dans Footer + sidebar homepage
2. Endpoint SSR `/api/newsletter.ts` : validation email + ajout contact via Brevo API v3
3. Email de bienvenue automatique via automation Brevo
4. Envoi manuel newsletters depuis interface Brevo

### SEO

**Schema.org JSON-LD** :
- `SportsEvent` — chaque match (date, lieu, équipes, score)
- `SportsOrganization` — chaque équipe
- `Article` / `NewsArticle` — chaque article
- `BreadcrumbList` — fil d'ariane sur toutes les pages
- `WebSite` + `SearchAction` — Pagefind searchbox

**Meta tags** :
- Articles : via RankMath SEO exposé par WPGraphQL
- Pages statiques : frontmatter Astro

**Sitemap** :
- XML : `@astrojs/sitemap` (auto)
- HTML : `/sitemap` pour utilisateurs

**robots.txt** :
- vai-calcio.fr : `Allow: /`, `Disallow: /api/`
- wp.vai-calcio.fr : `Disallow: /` + meta noindex (via RankMath)

### Sécurité

- `/api/revalidate` : secret token (env var `REVALIDATE_SECRET`)
- WordPress : désactiver XML-RPC, restreindre wp-json
- Clés API football : jamais côté client, toujours proxy
- `.env` pour secrets, `.env.example` versionné
- Headers Nginx : X-Frame-Options, X-Content-Type-Options, CSP basique
- wp.vai-calcio.fr : .htaccess redirect 301 (sécurité surface réduite)

## Design System

### Palette

```css
background: #F5F5F0      /* Blanc cassé */
text: #111111            /* Noir */
accent: #2D7A3A          /* Vert principal */
accent-light: #E8F5E9    /* Vert très clair */
separator: #E0E0E0       /* Séparateurs */
card: #FFFFFF            /* Fond cards */
```

### Typographie

- **Titres** : Barlow Condensed (600, 700) — condensé, sportif
- **Corps** : Inter (400, 500, 600) — lisible, neutre
- **Self-hosted** : `/public/fonts/` (WOFF2)
- **Font-display** : swap + preload poids critiques

### Principes

- Dense, éditorial (style journal sportif)
- Mobile-first
- Traits fins (borders 1px)
- Zéro emoji, icônes minimales et fines
- Grid dense : 2-3 colonnes desktop, 1 mobile
- Sidebar droite (desktop) : classement + dernières news

## Structure des Fichiers

```
calcio/
├── astro.config.mjs
├── tailwind.config.mjs
├── package.json
├── tsconfig.json
├── .env.example
├── CLAUDE.md
├── README.md
├── public/
│   ├── favicon.ico
│   ├── robots.txt
│   └── fonts/                    # Fonts self-hosted WOFF2
├── src/
│   ├── layouts/
│   │   ├── BaseLayout.astro      # HTML shell, head, meta, fonts
│   │   ├── ArticleLayout.astro   # Layout article + sidebar
│   │   └── PageLayout.astro      # Layout page simple
│   ├── components/
│   │   ├── Header.astro
│   │   ├── Footer.astro
│   │   ├── Sidebar.astro
│   │   ├── ArticleCard.astro
│   │   ├── ArticleGrid.astro
│   │   ├── StandingsTable.astro
│   │   ├── MatchScoreBanner.astro
│   │   ├── TeamCard.astro
│   │   ├── PlayerCard.astro
│   │   ├── FormationVisual.astro
│   │   ├── NewsletterForm.astro
│   │   ├── Breadcrumb.astro
│   │   ├── Pagination.astro
│   │   ├── SEOHead.astro
│   │   └── islands/
│   │       ├── LiveScores.tsx    # Preact — bandeau live (client:load)
│   │       └── LiveStandings.tsx # Preact — classement live (client:load)
│   ├── lib/
│   │   ├── wordpress.ts          # Client WPGraphQL + queries
│   │   ├── football-api.ts       # Client API football (multi-API)
│   │   ├── formations.ts         # Logique formations probables
│   │   ├── seo.ts                # Helpers JSON-LD, meta tags
│   │   ├── cache.ts              # Cache fichier JSON persistant
│   │   └── utils.ts              # Formatage dates, slugs, etc.
│   ├── pages/
│   │   ├── index.astro           # Homepage
│   │   ├── serie-a.astro         # Hub éditorial Serie A
│   │   ├── classement.astro
│   │   ├── resultats-calendrier.astro
│   │   ├── formations-probables.astro
│   │   ├── transferts.astro
│   │   ├── coppa-italia.astro
│   │   ├── equipe-nationale.astro
│   │   ├── contact.astro
│   │   ├── mentions-legales.astro
│   │   ├── a-propos.astro
│   │   ├── sitemap.astro         # Sitemap HTML
│   │   ├── 404.astro
│   │   ├── equipes/
│   │   │   └── [slug].astro      # Fiche équipe
│   │   ├── joueurs/
│   │   │   └── [slug].astro      # Fiche joueur
│   │   ├── arbitres/
│   │   │   └── [slug].astro      # Fiche arbitre
│   │   ├── blog/
│   │   │   ├── [slug].astro      # Article individuel (SSR + cache)
│   │   │   └── index.astro       # Liste articles
│   │   ├── tag/
│   │   │   └── [slug].astro
│   │   ├── categorie/
│   │   │   └── [slug].astro
│   │   └── api/
│   │       ├── revalidate.ts     # Webhook WordPress (SSR)
│   │       ├── newsletter.ts     # Inscription newsletter (SSR)
│   │       ├── scores.ts         # Proxy API football (SSR)
│   │       └── standings.ts      # Proxy classement (SSR)
│   └── styles/
│       └── global.css            # Tailwind base + custom styles
├── scripts/
│   ├── scraper/                  # Python scraper formations
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   ├── scraper.py
│   │   └── sources.json
│   └── cron/
│       └── update-data.sh        # Cron rebuild classement/résultats
├── docs/
│   └── wordpress-setup.md        # Instructions WordPress
└── docker-compose.yml            # Docker scraper
```

## Conventions de Code

### Astro Components

- Fichiers `.astro` pour composants statiques
- Fichiers `.tsx` (Preact) uniquement pour interactivité client-side
- Props TypeScript typées

```astro
---
interface Props {
  title: string;
  description?: string;
}

const { title, description } = Astro.props;
---

<div>
  <h1>{title}</h1>
  {description && <p>{description}</p>}
</div>
```

### Preact Islands

Utiliser `client:load` uniquement si nécessaire au chargement initial.
Préférer `client:visible` ou `client:idle` pour optimiser LCP.

```astro
---
import LiveScores from '@/components/islands/LiveScores';
---

<LiveScores client:load />
```

### GraphQL Queries

Centraliser dans `lib/wordpress.ts`. Typage TypeScript strict.

```typescript
export async function getPosts(limit = 10) {
  const query = `
    query GetPosts($limit: Int!) {
      posts(first: $limit, where: {orderby: {field: DATE, order: DESC}}) {
        nodes {
          id
          title
          slug
          excerpt
          date
          featuredImage {
            node {
              sourceUrl
            }
          }
        }
      }
    }
  `;

  const data = await graphQLClient.request(query, { limit });
  return data.posts.nodes;
}
```

### Cache Pattern

```typescript
import { getCached } from '@/lib/cache';

const standings = await getCached(
  'standings-serie-a',
  24 * 60 * 60 * 1000, // 24h
  async () => {
    return await footballAPI.getStandings('SA');
  }
);
```

### API Routes (SSR)

```typescript
// src/pages/api/newsletter.ts
export const prerender = false;

export async function POST({ request }: APIContext) {
  const { email } = await request.json();

  // Validation
  if (!email || !email.includes('@')) {
    return new Response(JSON.stringify({ error: 'Invalid email' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Brevo API call...

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
```

## Déploiement

### Serveur KimSufi

**Specs** (à confirmer) :
- CPU : Intel Xeon E5-1650v4 — 6c/12t @ 3.6 GHz
- RAM : 64 Go DDR4
- Stockage : 2×450 Go SSD NVMe (Soft RAID)
- OS : AlmaLinux 9
- DC : Gravelines (eu-west-gra)

### PM2 Configuration

`ecosystem.config.js` :

```javascript
module.exports = {
  apps: [{
    name: 'vai-calcio',
    cwd: '/var/www/vai-calcio',
    script: 'node_modules/.bin/astro',
    args: 'dev --host 0.0.0.0 --port 5432',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    env: {
      NODE_ENV: 'production',
    },
  }],
};
```

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name vai-calcio.fr www.vai-calcio.fr;

    location / {
        proxy_pass http://127.0.0.1:4321;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Déploiement Script

`deploy.sh` :

```bash
#!/bin/bash
set -e

echo "Building..."
npm run build

echo "Deploying to KimSufi..."
rsync -avz --delete \
  --exclude node_modules \
  --exclude .git \
  --exclude .env \
  ./ user@kimsufi-ip:/var/www/vai-calcio/

echo "Restarting PM2..."
ssh user@kimsufi-ip "cd /var/www/vai-calcio && pm2 restart vai-calcio"

echo "Deployment complete!"
```

## Variables d'Environnement

Voir `.env.example` pour la liste complète.

**Critiques** :
- `WORDPRESS_GRAPHQL_URL` — https://wp.vai-calcio.fr/graphql
- `REVALIDATE_SECRET` — Token sécurisé pour webhook
- `BREVO_API_KEY` — Clé API Brevo
- `BREVO_LIST_ID` — ID liste newsletter Brevo

**APIs Football** (à configurer selon APIs trouvées) :
- `FOOTBALL_API_KEY`
- `FOOTBALL_DATA_API_KEY`
- `THESPORTSDB_API_KEY` — Toujours "1" (gratuit)

## Phase de Développement

**Phase 1 — Core MVP** (Semaine 1-2) :
- ✅ Init Astro 5 + dépendances
- 🔲 CLAUDE.md (ce fichier)
- 🔲 Layouts + composants core
- 🔲 Lib WordPress GraphQL
- 🔲 Pages core (homepage, blog, légales)
- 🔲 Pagefind
- 🔲 SEO
- 🔲 Newsletter
- 🔲 Webhook revalidate
- 🔲 Déploiement PM2 + Nginx

**Phase 2 — Contenu sportif** (Semaine 3) :
- 🔲 Intégration API football
- 🔲 Fiches équipes/joueurs/arbitres
- 🔲 Résultats/calendrier
- 🔲 Hub éditorial Serie A
- 🔲 Sitemap HTML

**Phase 3 — Live + Formations** (Semaine 4+) :
- 🔲 Îlots Preact live
- 🔲 Détection fenêtres de match + polling
- 🔲 Scraper formations probables
- 🔲 Page formations avec visualisation terrain
- 🔲 Cron jobs

## Tests Manuels

**Phase 1** :
- [ ] Homepage charge en < 2s (Lighthouse > 90)
- [ ] Article WordPress publié → visible en < 30s via webhook
- [ ] wp.vai-calcio.fr redirige vers vai-calcio.fr (sauf wp-admin)
- [ ] Newsletter : inscription fonctionne, email de bienvenue reçu
- [ ] Sitemap XML accessible et valide
- [ ] Mobile : toutes pages lisibles et navigables
- [ ] JSON-LD valide (Google Rich Results Test)

**Phase 2** :
- [ ] Fiches équipes avec données API correctes
- [ ] Classement à jour
- [ ] Pagefind : recherche article par titre fonctionne
- [ ] Pages tag/catégorie affichent bons articles

**Phase 3** :
- [ ] Live scores : polling actif uniquement pendant matchs
- [ ] Live scores : zéro requête API hors fenêtre de match
- [ ] Formations : données scrapées correctes, scores confiance cohérents
- [ ] Formations : visualisation terrain lisible sur mobile

## Ressources

- [Astro 5 Documentation](https://docs.astro.build/)
- [WPGraphQL](https://www.wpgraphql.com/)
- [Brevo API v3](https://developers.brevo.com/)
- [Pagefind](https://pagefind.app/)
- [TheSportsDB API](https://www.thesportsdb.com/api.php)

## Contact

**Directeur de publication** : Anthony Russo
**Email** : contact@vai-calcio.fr
