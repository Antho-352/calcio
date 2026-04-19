import type { APIRoute } from 'astro';
import { getStandings } from '@/lib/football-api';

export const prerender = false;

/**
 * Proxy endpoint for standings
 * Returns Serie A standings with server-side caching
 *
 * GET /api/standings
 */
export const GET: APIRoute = async () => {
  try {
    // Fetch standings (uses football-api.ts cache with 24h TTL)
    const standings = await getStandings();

    return new Response(
      JSON.stringify({ standings, timestamp: Date.now() }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600', // 1 hour cache
        },
      }
    );
  } catch (error) {
    console.error('Error fetching standings:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to fetch standings',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
