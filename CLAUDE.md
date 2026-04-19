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
- `/blog/[slug]` — Individual articles (planned SSR + cache)

**Static with getStaticPaths** (dynamic routes):
- `/equipes/[slug]` — Team pages (20 teams)
- `/arbitres/[slug]` — Referee pages (15 referees)
- `/joueurs/[slug]` — Player pages

### 2. Multi-API Football Data with Fallback

`lib/football-api.ts` implements a **multi-API strategy** with automatic fallback to mock data:

```typescript
// Always wrap API calls with try-catch to fallback to mock data
export async function getTeam(idOrSlug: string | number) {
  return getCached(`team-${idOrSlug}`, TTL.WEEK, async () => {
    if (API_CONFIG.theSportsDB.key) {
      try {
        return await fetchTheSportsDBTeam(idOrSlug);
      } catch (error) {
        console.warn('API call failed, using mock data:', error);
        // Fall through to mock data
      }
    }
    return MOCK_TEAMS.find(/* ... */);
  });
}
```

**Critical**: Never throw errors from API functions. Always return mock data as fallback.

### 3. File-Based Cache (Persists Across Restarts)

`lib/cache.ts` uses **JSON file cache** (`.cache/api-cache.json`) that survives PM2 restarts:

```typescript
const standings = await getCached(
  'standings-serie-a',
  24 * 60 * 60 * 1000,  // 24h TTL
  async () => await getStandings()
);
```

**TTL Strategy**:
- Standings/Calendar: 24h
- Match results: 6h
- Player/Team stats: 7 days
- Live scores: 30s (memory only during match windows)

### 4. WordPress Headless Integration

**URL**: wp.vai-calcio.fr (with .htaccess redirect to prevent duplicate content)

**GraphQL**: All queries centralized in `lib/wordpress.ts`
- `getPosts(limit, offset)` — Get blog posts
- `getPostsByCategory(category, limit, offset)` — Filtered posts
- `getPostBySlug(slug)` — Single post

**Webhook**: `/api/revalidate` invalidates cache when WP publishes content (requires `REVALIDATE_SECRET`)

### 5. Design System (Immutable)

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

## Common Pitfalls

### 1. Dynamic Route Pages Without getStaticPaths

**Problem**: Pages like `/equipes/[slug].astro` crash without `getStaticPaths()`

**Solution**:
```astro
---
import { getTeams } from '@/lib/football-api';

export async function getStaticPaths() {
  const teams = await getTeams();
  return teams.map((team) => ({
    params: { slug: team.name.toLowerCase().replace(/\s+/g, '-') },
  }));
}
---
```

### 2. JSX Template Literals in Astro

**Problem**: Template literals inside JSX `class` attributes cause syntax errors

**Wrong**:
```astro
<tr class={`base-classes ${dynamicClass}`}>
```

**Right**:
```astro
<tr class={'base-classes ' + dynamicClass}>
```

Or pre-compute in frontmatter:
```astro
---
const items = data.map(item => ({
  ...item,
  computedClass: getClass(item)  // Pre-compute before JSX
}));
---
<tr class={item.computedClass}>
```

### 3. Mock Data Generation

When generating mock matches, **Serie A = 10 matches per matchday** (20 teams / 2):

```typescript
// Generate 10 finished matches (last matchday) + 10 scheduled (next matchday)
for (let i = 0; i < 20; i++) {
  const isFinished = i < 10;
  const teamIndex = i % 10;  // Pair teams: 0-1, 2-3, 4-5, etc.
  // ...
}
```

### 4. Deployment Zip Creation

**Wrong**: `zip -r site.zip dist/` → creates `dist/` folder inside zip

**Right**:
```bash
cd dist && zip -r ../vai-calcio-fr.zip .
```

Use **fixed filename** (no timestamps) to overwrite previous zip.

## Project-Specific Conventions

### File Naming

- Components: PascalCase (`ArticleCard.astro`)
- Pages: kebab-case (`resultats-calendrier.astro`)
- Lib utilities: camelCase (`football-api.ts`)

### Component Organization

- **Layouts**: `BaseLayout` (HTML shell) → `PageLayout` (breadcrumbs) → `ArticleLayout` (sidebar)
- **Islands**: Preact components in `components/islands/` (use `client:load` sparingly)
- **Lib**: Pure functions, no side effects, always typed

### GraphQL Query Pattern

Centralize in `lib/wordpress.ts` with consistent structure:

```typescript
export async function getPostsByCategory(category: string, limit = 10, offset = 0) {
  const query = `
    query GetPostsByCategory($category: String!, $limit: Int!, $offset: Int!) {
      posts(
        first: $limit
        after: $offset
        where: { categoryName: $category, orderby: { field: DATE, order: DESC } }
      ) {
        nodes { /* fields */ }
        pageInfo { hasNextPage endCursor }
      }
    }
  `;
  const data = await graphQLClient.request(query, { category, limit, offset });
  return { posts: data.posts.nodes, total: data.posts.pageInfo.total };
}
```

## Development Workflow

### Local Development

1. Ensure WordPress is running at `wp.vai-calcio.fr` (optional)
2. Copy `.env.example` to `.env`
3. Run `npm run dev` → http://localhost:5432
4. All API calls fallback to mock data if not configured

### Adding New Pages

1. Static page: Create in `src/pages/`
2. Dynamic page: Add `getStaticPaths()` + `export const prerender = true`
3. SSR page: Add `export const prerender = false`
4. Update `src/components/Header.astro` navigation if needed

### Adding New API Endpoints

1. Create in `src/pages/api/` with `.ts` extension
2. Add `export const prerender = false`
3. Return `new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } })`
4. Add CORS headers if needed for client-side fetch

## Key Environment Variables

**Required for production**:
- `WORDPRESS_GRAPHQL_URL` — https://wp.vai-calcio.fr/graphql
- `REVALIDATE_SECRET` — Webhook secret token
- `BREVO_API_KEY` — Newsletter (Brevo/Sendinblue)
- `BREVO_LIST_ID` — Newsletter list ID

**Optional (fallback to mock data)**:
- `FOOTBALL_API_KEY` — API-Football
- `FOOTBALL_DATA_API_KEY` — Football-data.org
- `THESPORTSDB_API_KEY` — Always "1" (free tier)

## Resources

- **Architecture details**: See full project plan in `.claude/plans/`
- **WordPress setup**: `docs/wordpress-setup.md`
- **API documentation**: Comments in `lib/football-api.ts`
- **Mock data**: All mock data defined at top of `lib/football-api.ts` (20 teams, 15 referees, etc.)

## Contact

**Owner**: Anthony Russo
**Email**: contact@vai-calcio.fr
