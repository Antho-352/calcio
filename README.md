# Vai Calcio 🇮🇹⚽

Site de news et informations sur le football italien (Serie A principalement).

**Stack** : Astro 5 + WordPress headless + Node.js + Tailwind CSS

## 🚀 Démarrage rapide

### Prérequis

- Node.js 18+
- npm ou pnpm
- WordPress avec WPGraphQL (optionnel)

### Installation

```bash
# Cloner le repo
git clone https://github.com/Antho-352/calcio.git
cd calcio

# Installer les dépendances
npm install

# Copier .env.example et configurer
cp .env.example .env

# Lancer le serveur de développement
npm run dev
```

Site disponible sur **http://localhost:5432**

## 📁 Structure du projet

```
calcio/
├── src/
│   ├── components/       # Composants Astro/Preact
│   ├── layouts/          # Layouts (Base, Article, Page)
│   ├── lib/              # Utilitaires (API, WordPress, SEO, cache)
│   ├── pages/            # Pages du site + API routes
│   └── styles/           # CSS global + Tailwind
├── public/               # Assets statiques
├── scripts/
│   ├── scraper/          # Docker + Python formations scraper
│   └── cron/             # Scripts cron (update-data.sh)
├── docs/                 # Documentation WordPress setup
└── CLAUDE.md             # Documentation technique complète
```

## 🛠️ Commandes

```bash
npm run dev           # Dev server (port 5432)
npm run build         # Build production
npm run preview       # Preview build
npm run astro --help  # Aide Astro CLI
```

## 🎨 Fonctionnalités

### ✅ Implémenté

- **Articles WordPress** : Integration WPGraphQL avec cache
- **Classement Serie A** : Tableau complet + zones UEFA/relégation
- **Résultats & Calendrier** : Matchs passés et à venir
- **Fiches équipes** : Stats, résultats récents, articles liés
- **Fiches joueurs** : Stats saison (buts, passes, cartons)
- **Fiches arbitres** : Stats saison (cartons, penalties)
- **Hubs éditoriaux** : Serie A, Transferts, Coppa Italia, Squadra Azzurra
- **Formations probables** : Visualisation terrain + scraper Python
- **Newsletter** : Integration Brevo API
- **Recherche** : Pagefind (index statique)
- **SEO** : JSON-LD, meta tags, sitemap XML + HTML
- **Proxy API** : `/api/scores`, `/api/standings` (cache serveur)

### 🚧 En développement

- **Live scores** : Composants Preact avec polling intelligent
- **Live standings** : Actualisation temps réel
- **Scraper formations** : Docker + Camoufox (sources italiennes)

## 🔧 Configuration

### Variables d'environnement

Voir `.env.example` pour la liste complète. **Variables critiques** :

```env
WORDPRESS_GRAPHQL_URL=https://wp.vai-calcio.fr/graphql
REVALIDATE_SECRET=your-secret-token
BREVO_API_KEY=your-brevo-key
BREVO_LIST_ID=your-list-id
```

### WordPress Headless

Voir `docs/wordpress-setup.md` pour la configuration complète :

- WPGraphQL + ACF + RankMath SEO
- .htaccess redirect duplicate content
- Webhook publication → `/api/revalidate`

### APIs Football

Le site supporte plusieurs APIs avec fallback automatique :

- **API-Football** : Live scores, lineups, stats
- **Football-data.org** : Classement, calendrier
- **TheSportsDB** : Logos équipes, photos stades (gratuit)

Pour l'instant, **données mock** sont utilisées si APIs non configurées.

## 📦 Déploiement

### Build production

```bash
npm run build
```

Build génère `dist/` prêt pour deployment.

### PM2 (serveur Node)

```bash
# Installer PM2
npm install -g pm2

# Lancer l'app
pm2 start ecosystem.config.js

# Status
pm2 status

# Logs
pm2 logs vai-calcio
```

### Nginx reverse proxy

```nginx
server {
    listen 80;
    server_name vai-calcio.fr;

    location / {
        proxy_pass http://127.0.0.1:5432;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Cron daily update

Ajouter à crontab :

```cron
# Daily data update at 6am
0 6 * * * /var/www/vai-calcio/scripts/cron/update-data.sh
```

## 🐳 Docker Scraper

Scraper formations probables (Phase 3) :

```bash
cd scripts/scraper

# Build image
docker-compose build

# Run scraper
docker-compose up formations-scraper

# Logs
docker-compose logs -f
```

**Variables requises** :
```env
WORDPRESS_USER=admin
WORDPRESS_PASSWORD=password
WORDPRESS_API_URL=https://wp.vai-calcio.fr/wp-json/wp/v2/formation
```

## 📚 Documentation

- **CLAUDE.md** : Documentation technique complète (architecture, conventions, déploiement)
- **docs/wordpress-setup.md** : Configuration WordPress headless
- **Plan complet** : Voir `.claude/plans/` pour le plan de développement

## 🤝 Contribution

Projet personnel. Contact : contact@vai-calcio.fr

## 📄 Licence

Propriétaire - © 2025 Anthony Russo

---

**Directeur de publication** : Anthony Russo  
**Site** : [vai-calcio.fr](https://vai-calcio.fr)
