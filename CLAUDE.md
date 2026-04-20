# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

vai-calcio.fr — Site de news et informations sur le football italien (Serie A).

**Stack**: Astro 5 (SSG/SSR hybrid) + WordPress headless + Tailwind CSS + Node.js

## Essential Commands

```bash
# Development
npm run dev              # Start dev server on port 5432
npm run build            # Build for production
npm run preview          # Preview production build

# Note: Port 5432 is intentional (not 4321 default)
```

## Critical Architecture Patterns

### 1. Rendering Strategy (Astro 5)

**Default**: All pages are **static** (`output: 'static'` in astro.config.mjs)

**SSR routes** need explicit `export const prerender = false`:
- `/api/*` — All API routes (revalidate, newsletter, scores, standings)
- `/sitemap.xml` — Dynamic sitemap (auto-updates with WordPress articles)
- `/blog/[slug]` — Individual articles (planned SSR + cache)

**Static with getStaticPaths** (dynamic routes):
- `/equipes/[slug]` — Team pages (20 teams)
- `/arbitres/[slug]` — Referee pages (15 referees)
- `/joueurs/[slug]` — Player pages (~700 players)

### 2. Multi-API Football Data (Free Sources Only)

Three primary data sources, all free/public, no API key required:

#### ESPN Public API (`src/lib/espn.ts`)
```
https://site.api.espn.com/apis/site/v2/sports/soccer/ita.1
```
- **Logos**: `https://a.espncdn.com/i/teamlogos/soccer/500/{espnId}.png` (stable CDN)
- **Teams**: `/teams` → 20 Serie A 2025-26 teams
- **Rosters**: `/teams/{espnId}/roster` → current squad with positions, DOB, height
- **Schedule**: `/scoreboard?limit=500&dates=20250801-20260701` → full season
- **Standings**: `/standings` → real-time league table
- No key needed. Match status: `STATUS_FINAL` → finished, else date-based fallback

#### Fantamaster CDN (`src/lib/fantamaster.ts`)
```
https://apicdn.fantamaster.it/playersstats/
```
- ~585 players, roles P/D/C/A, goals/assists/cards/ratings/value
- Name format: "Lastname Firstinitial" e.g. "Martinez L"
- Use `normalize()` for accent-insensitive matching
- Always scope by `teamSlug` to avoid cross-team name collisions
- `getAllPlayerStats()`, `getPlayerStatsByTeamSlug(slug)`, `getPlayerStatsByName(name, teamSlug?)`

#### Wikipedia FR API (`src/lib/wikipedia.ts`)
```
https://fr.wikipedia.org/w/api.php
```
- Free, no key, French descriptions for clubs and players
- `getWikipediaExtract(slugOrTitle, 'fr', sentences)` — teams (static mapping in TEAM_WIKI_FR)
- `getWikipediaPlayerExtract(playerName, 'fr', 3)` — players (direct name search)

#### TheSportsDB (`src/lib/thesportsdb.ts`)
```
https://www.thesportsdb.com/api/v1/json/3/
```
- Key "3" (free tier) — **CRITICAL: key "1" returns 404**
- **Use `searchteams.php?t=NAME` NOT `lookupteam.php?id=X`** — the lookup endpoint always returns Arsenal data for all IDs on free tier
- Used for: stadium name, capacity, founded year, website, hex colors
- Filter results with `strCountry === 'Italy'`

### 3. Data Flow in `lib/football-api.ts`

```
getTeam(slug)
  ├─ ESPN logo (from BASE_TEAMS static mapping)
  ├─ TheSportsDB searchteams → stadium, capacity, founded, colors, website
  └─ Wikipedia FR → club description

getTeamSquad(espnId)
  ├─ ESPN roster → primary (2025-26 squad, positions, DOB, height)
  └─ TheSportsDB players → photo URLs as fallback

getMatches()
  ├─ ESPN scoreboard → real schedule + scores
  └─ Date-based status fallback (if ESPN returns "scheduled" but date is past → "finished")

getStandings()
  ├─ ESPN /standings → real table
  └─ Mock fallback if ESPN unavailable

getTeamTopScorers(teamId, limit)
  └─ Fantamaster → goals, assists, caps, rating (filtered by team)

getPlayerSeasonStats(playerName, teamSlug?)
  └─ Fantamaster → season stats (team-scoped for accurate matching)
```

### 4. Serie A 2025-26 Teams (20 clubs)

ESPN IDs for `BASE_TEAMS`:
- Inter Milan: 110, AC Milan: 103, Juventus: 111, Napoli: 114, AS Roma: 104
- Lazio: 112, Atalanta: 105, Fiorentina: 109, Torino: 239, Bologna: 107
- Udinese: 118, Genoa: 3263, Lecce: 113, Hellas Verona: 119, Cagliari: 2925
- Como: 2572, Parma: 115, **Cremonese: 4050**, **Pisa: 3956**, **Sassuolo: 3997**

Promoted 2025-26: Cremonese, Pisa, Sassuolo (replaced Venezia, Monza, Empoli)

### 5. File-Based Cache (Persists Across Restarts)

`lib/cache.ts` uses **JSON file cache** (`.cache/api-cache.json`):

```typescript
const standings = await getCached('standings-espn-v1', TTL.HOUR * 6, async () => { ... });
```

**TTL Strategy**:
- Standings/Calendar: 6h
- Match results: 3h
- Player/Team stats: 1 day
- Team enrichment (TheSportsDB + Wikipedia): 1 week

**Clear cache when data is stale**: `rm -f .cache/api-cache.json`

### 6. WordPress Headless Integration

**URL**: wp.vai-calcio.fr (with .htaccess redirect to prevent duplicate content)

**GraphQL**: All queries centralized in `lib/wordpress.ts`
- `getPosts(limit, offset)` — Get blog posts
- `getPostsByCategory(category, limit, offset)` — Filtered posts
- `getPostBySlug(slug)` — Single post

**Webhook**: `/api/revalidate` invalidates cache when WP publishes content (requires `REVALIDATE_SECRET`)

### 7. Design System (Immutable)

**Colors** (defined in `tailwind.config.mjs`):
- `background: #F5F5F0` (off-white)
- `accent: #2D7A3A` (green)
- `accent-light: #E8F5E9`
- `separator: #E0E0E0`

**Typography**:
- **Titles**: Barlow Condensed (600, 700) — condensed, sporty
- **Body**: Inter (400, 500, 600) — readable
- **Self-hosted**: All fonts in `/public/fonts/` (WOFF2)

**Principles**:
- Dense, editorial style (newspaper-like)
- Mobile-first
- Thin borders (1px)
- No emojis
- Grid-based layouts (3-4 columns on desktop)

**Logo/Favicon**: Simple SVG — "VAI" / "CALCIO" on green (#2D7A3A) background
- `/public/favicon.svg` — browser tab icon
- `/public/player-placeholder.svg` — fallback for missing player photos

## Common Pitfalls

### 1. Dynamic Route Pages Without getStaticPaths

**Problem**: Pages like `/equipes/[slug].astro` crash without `getStaticPaths()`

**Solution**:
```astro
export async function getStaticPaths() {
  const teams = await getTeams();
  return teams.map((team) => ({
    params: { slug: team.name.toLowerCase().replace(/\s+/g, '-') },
  }));
}
```

### 2. JSX Template Literals in Astro

**Wrong**: `<tr class={\`base-classes ${dynamicClass}\`}>`
**Right**: `<tr class={'base-classes ' + dynamicClass}>`

Or pre-compute in frontmatter.

### 3. TheSportsDB — Never Use lookupteam

```typescript
// WRONG — always returns Arsenal data:
fetchSportsDB(`/lookupteam.php?id=${id}`)

// CORRECT — search by name + filter by Italy:
fetchSportsDB(`/searchteams.php?t=${encodeURIComponent(name)}`)
  .then(teams => teams.find(t => t.strCountry === 'Italy'))
```

### 4. Fantamaster Name Matching

FM names are "Lastname Initial" format. Always normalize accents and scope by team:

```typescript
// Normalize accents before comparison:
function normalize(s) { return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }

// Scope by team to avoid cross-team name collisions:
getPlayerSeasonStats(player.name, team.thesportsdbSlug)
```

### 5. Match Status — ESPN Returns "scheduled" for Past Matches

ESPN's scoreboard API sometimes returns historical matches as "scheduled". The date-based fallback in `getMatches()` handles this:
```typescript
const resolvedStatus = m.status === 'finished' ? 'finished'
  : matchDate < today ? 'finished'
  : 'scheduled';
```

### 6. Deployment Zip Creation

```bash
cd dist && zip -r ../vai-calcio-fr.zip .  # NOT: zip -r site.zip dist/
```

## Project-Specific Conventions

### File Naming
- Components: PascalCase (`ArticleCard.astro`)
- Pages: kebab-case (`resultats-calendrier.astro`)
- Lib utilities: camelCase (`football-api.ts`)

### Component Organization
- **Layouts**: `BaseLayout` (HTML shell) → `PageLayout` (breadcrumbs) → `ArticleLayout` (sidebar)
- **Islands**: Preact components in `components/islands/` (use `client:load` sparingly)
- **Lib**: Pure functions, no side effects, always typed

## Development Workflow

### Local Development
1. Copy `.env.example` to `.env` (WordPress optional — all football data is free/public)
2. Run `npm run dev` → http://localhost:5432
3. All football data (ESPN, Fantamaster, Wikipedia) works without API keys

### Adding New Pages
1. Static page: Create in `src/pages/`
2. Dynamic page: Add `getStaticPaths()` + `export const prerender = true`
3. SSR page: Add `export const prerender = false`
4. Update `src/components/Header.astro` navigation if needed

## Key Environment Variables

**Required for production**:
- `WORDPRESS_GRAPHQL_URL` — https://wp.vai-calcio.fr/graphql
- `REVALIDATE_SECRET` — Webhook secret token
- `BREVO_API_KEY` — Newsletter (Brevo/Sendinblue)
- `BREVO_LIST_ID` — Newsletter list ID

**Optional** (football data works without these):
- `THESPORTSDB_API_KEY` — Use "3" (free tier) — key "1" returns 404

## Contact

**Owner**: Anthony Russo
**Email**: contact@vai-calcio.fr
