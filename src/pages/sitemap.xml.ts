import type { APIRoute } from 'astro';
import { getPosts } from '@/lib/wordpress';
import { getTeams, getReferees } from '@/lib/football-api';

export const prerender = false;

// Static pages with their priority and change frequency
const staticPages = [
  { url: '', priority: '1.0', changefreq: 'daily' }, // Homepage
  { url: 'serie-a', priority: '0.9', changefreq: 'daily' }, // Actualités Serie A
  { url: 'classement', priority: '0.9', changefreq: 'daily' },
  { url: 'resultats-calendrier', priority: '0.9', changefreq: 'daily' },
  { url: 'formations-probables', priority: '0.8', changefreq: 'daily' },
  { url: 'transferts', priority: '0.8', changefreq: 'weekly' },
  { url: 'coppa-italia', priority: '0.7', changefreq: 'weekly' },
  { url: 'equipe-nationale', priority: '0.7', changefreq: 'weekly' },
  { url: 'blog', priority: '0.8', changefreq: 'daily' },
  { url: 'arbitres', priority: '0.7', changefreq: 'weekly' },
  { url: 'joueurs', priority: '0.7', changefreq: 'weekly' },
  { url: 'contact', priority: '0.5', changefreq: 'monthly' },
  { url: 'mentions-legales', priority: '0.3', changefreq: 'yearly' },
  { url: 'a-propos', priority: '0.5', changefreq: 'monthly' },
  { url: 'sitemap', priority: '0.4', changefreq: 'monthly' },
];

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0]; // YYYY-MM-DD
}

export const GET: APIRoute = async ({ site }) => {
  const baseUrl = site?.toString().replace(/\/$/, '') || 'https://vai-calcio.fr';

  const urls: Array<{
    loc: string;
    lastmod?: string;
    changefreq: string;
    priority: string;
  }> = [];

  // 1. Add static pages
  staticPages.forEach((page) => {
    urls.push({
      loc: `${baseUrl}/${page.url}`,
      lastmod: formatDate(new Date()),
      changefreq: page.changefreq,
      priority: page.priority,
    });
  });

  // 2. Add blog articles from WordPress
  try {
    const { posts } = await getPosts(100); // Get up to 100 latest posts
    posts.forEach((post: any) => {
      urls.push({
        loc: `${baseUrl}/blog/${escapeXml(post.slug)}`,
        lastmod: formatDate(post.date),
        changefreq: 'weekly',
        priority: '0.8',
      });
    });
  } catch (error) {
    console.warn('Could not fetch WordPress posts for sitemap:', error);
  }

  // 3. Add team pages (20 Serie A teams)
  try {
    const teams = await getTeams();
    teams.forEach((team) => {
      const slug = team.name.toLowerCase().replace(/\s+/g, '-');
      urls.push({
        loc: `${baseUrl}/equipes/${escapeXml(slug)}`,
        changefreq: 'weekly',
        priority: '0.7',
      });
    });
  } catch (error) {
    console.warn('Could not fetch teams for sitemap:', error);
  }

  // 4. Add referee pages (15 Serie A referees)
  try {
    const referees = await getReferees();
    referees.forEach((referee) => {
      const slug = referee.name.toLowerCase().replace(/\s+/g, '-');
      urls.push({
        loc: `${baseUrl}/arbitres/${escapeXml(slug)}`,
        changefreq: 'weekly',
        priority: '0.6',
      });
    });
  } catch (error) {
    console.warn('Could not fetch referees for sitemap:', error);
  }

  // Generate XML
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${url.loc}</loc>
    ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600', // Cache 1 hour
    },
  });
};
