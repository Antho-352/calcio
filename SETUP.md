# Setup Guide - vai-calcio.fr

Guide de configuration pour lancer le projet en local.

## Prérequis

- Node.js 18+ et npm
- Git

## Installation

### 1. Dépendances déjà installées ✅

Les dépendances npm sont déjà installées. Si besoin de réinstaller :

```bash
npm install
```

### 2. Configuration des variables d'environnement

Créer le fichier `.env` depuis `.env.example` :

```bash
cp .env.example .env
```

**Pour tester en local sans WordPress**, vous pouvez utiliser ces valeurs temporaires :

```env
# WordPress GraphQL (optionnel pour le moment)
WORDPRESS_GRAPHQL_URL=https://wp.vai-calcio.fr/graphql

# Revalidation (générer un token aléatoire)
REVALIDATE_SECRET=dev-secret-token-local

# Newsletter Brevo (optionnel pour le moment)
BREVO_API_KEY=
BREVO_LIST_ID=

# Football APIs (à configurer plus tard)
FOOTBALL_API_KEY=
FOOTBALL_DATA_API_KEY=
THESPORTSDB_API_KEY=1

# Node environment
NODE_ENV=development
```

### 3. Télécharger les fonts (IMPORTANT)

Les fonts self-hosted doivent être téléchargées et placées dans `/public/fonts/`.

#### Inter (400, 500, 600)

Télécharger depuis [Google Fonts](https://fonts.google.com/specimen/Inter) :
- Inter-Regular.woff2 (400)
- Inter-Medium.woff2 (500)
- Inter-SemiBold.woff2 (600)

Ou utiliser ce script :

```bash
mkdir -p public/fonts

# Inter Regular (400)
curl -o public/fonts/Inter-Regular.woff2 \
  "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff2"

# Inter Medium (500)
curl -o public/fonts/Inter-Medium.woff2 \
  "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hjp-Ek-_EeA.woff2"

# Inter SemiBold (600)
curl -o public/fonts/Inter-SemiBold.woff2 \
  "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZ9hjp-Ek-_EeA.woff2"
```

#### Barlow Condensed (600, 700)

Télécharger depuis [Google Fonts](https://fonts.google.com/specimen/Barlow+Condensed) :
- BarlowCondensed-SemiBold.woff2 (600)
- BarlowCondensed-Bold.woff2 (700)

Ou utiliser ce script :

```bash
# Barlow Condensed SemiBold (600)
curl -o public/fonts/BarlowCondensed-SemiBold.woff2 \
  "https://fonts.gstatic.com/s/barlowcondensed/v12/HTxwL3I-JCGChYJ8VI-L6OO_au7B47rxz3nwJROTDAALgA.woff2"

# Barlow Condensed Bold (700)
curl -o public/fonts/BarlowCondensed-Bold.woff2 \
  "https://fonts.gstatic.com/s/barlowcondensed/v12/HTxwL3I-JCGChYJ8VI-L6OO_au7B477x03nwJROTDAALgA.woff2"
```

**Vérifier que les fonts sont présentes** :

```bash
ls -lh public/fonts/
# Devrait afficher 5 fichiers .woff2
```

### 4. Créer le répertoire cache

```bash
mkdir -p .cache
```

## Lancement en développement

```bash
npm run dev
```

Le site sera accessible sur : **http://localhost:4321**

## Fonctionnement sans WordPress

Si WordPress n'est pas encore configuré, le site affichera :
- Des données placeholder sur la homepage
- Un message "WordPress not configured" dans les logs
- Toutes les pages statiques fonctionnent normalement
- La recherche Pagefind fonctionne (mais sans contenu à indexer)

C'est normal ! Une fois WordPress configuré (voir `docs/wordpress-setup.md`), les articles réels apparaîtront.

## Test des fonctionnalités

### Pages à tester

- **Homepage** : http://localhost:4321
- **Blog** : http://localhost:4321/blog
- **Recherche** : http://localhost:4321/recherche
- **Sitemap** : http://localhost:4321/sitemap
- **À propos** : http://localhost:4321/a-propos
- **Contact** : http://localhost:4321/contact
- **Mentions légales** : http://localhost:4321/mentions-legales

### API endpoints (SSR)

- **Newsletter** : POST http://localhost:4321/api/newsletter
  ```bash
  curl -X POST http://localhost:4321/api/newsletter \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com"}'
  ```

- **Revalidate** : POST http://localhost:4321/api/revalidate
  ```bash
  curl -X POST http://localhost:4321/api/revalidate \
    -H "Authorization: Bearer dev-secret-token-local" \
    -H "Content-Type: application/json" \
    -d '{"postId":"123","slug":"test","action":"publish"}'
  ```

## Build pour production

```bash
npm run build
```

Le site sera construit dans `/dist/`.

## Preview du build

```bash
npm run preview
```

Accessible sur : http://localhost:4321

## Prochaines étapes

1. **Configurer WordPress** (optionnel pour le développement initial)
   - Suivre `docs/wordpress-setup.md`
   - Configurer WPGraphQL, ACF, RankMath
   - Ajouter .htaccess redirect

2. **Configurer Brevo** (optionnel)
   - Créer un compte sur https://www.brevo.com
   - Obtenir une clé API
   - Créer une liste de contacts
   - Ajouter les valeurs dans `.env`

3. **Configurer les APIs football** (Phase 2)
   - Choisir les APIs (API-Football, Football-data.org, TheSportsDB)
   - Obtenir les clés API
   - Implémenter `lib/football-api.ts`

4. **Ajouter des fonts** (si URLs ci-dessus ne fonctionnent pas)
   - Télécharger manuellement depuis Google Fonts
   - Sélectionner les poids : Inter (400, 500, 600), Barlow Condensed (600, 700)
   - Télécharger en WOFF2
   - Placer dans `public/fonts/`

## Troubleshooting

### "Cannot find module '@/...'"

Les alias TypeScript sont configurés dans `tsconfig.json`. Vérifier que le fichier existe et contient :

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Fonts ne chargent pas

1. Vérifier que les fichiers .woff2 sont dans `public/fonts/`
2. Vérifier les chemins dans `src/styles/global.css`
3. Vider le cache du navigateur

### WordPress GraphQL errors

C'est normal si WordPress n'est pas encore configuré. Le site fonctionne avec des données placeholder.

### Port 4321 déjà utilisé

Changer le port dans `astro.config.mjs` ou via :

```bash
npm run dev -- --port 3000
```

## Commandes utiles

```bash
npm run dev          # Développement
npm run build        # Build production
npm run preview      # Preview du build
npm run astro check  # Vérification TypeScript
```

## Structure importante

```
calcio/
├── .env                    # Variables d'environnement (à créer)
├── .cache/                 # Cache API (créé automatiquement)
├── public/fonts/           # Fonts WOFF2 (à télécharger)
├── src/
│   ├── pages/              # Pages et routes
│   ├── components/         # Composants
│   ├── layouts/            # Layouts
│   ├── lib/                # Librairies (WordPress, cache, utils, SEO)
│   └── styles/             # CSS global
└── docs/                   # Documentation
```
