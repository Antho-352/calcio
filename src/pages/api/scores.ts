import type { APIRoute } from 'astro';
import { getMatches } from '@/lib/football-api';

export const prerender = false;

/**
 * Proxy endpoint for live scores
 * Returns current matches with intelligent caching
 *
 * GET /api/scores?date=YYYY-MM-DD (optional)
 * GET /api/scores?live=true (only live matches)
 */
export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const dateParam = url.searchParams.get('date');
  const liveOnly = url.searchParams.get('live') === 'true';

  try {
    // Fetch all matches (uses football-api.ts cache)
    const allMatches = await getMatches();

    let matches = allMatches;

    // Filter by date if provided
    if (dateParam) {
      const targetDate = new Date(dateParam);
      matches = matches.filter((match) => {
        const matchDate = new Date(match.date);
        return (
          matchDate.getFullYear() === targetDate.getFullYear() &&
          matchDate.getMonth() === targetDate.getMonth() &&
          matchDate.getDate() === targetDate.getDate()
        );
      });
    }

    // Filter live matches only
    if (liveOnly) {
      matches = matches.filter((match) => {
        if (match.status !== 'live') return false;

        const matchDate = new Date(match.date);
        const now = new Date();

        // Match window: kick-off - 15min → end + 30min (assume 120 min max)
        const windowStart = new Date(matchDate.getTime() - 15 * 60 * 1000);
        const windowEnd = new Date(matchDate.getTime() + 150 * 60 * 1000);

        return now >= windowStart && now <= windowEnd;
      });
    }

    // Determine cache duration based on live matches
    const hasLiveMatches = matches.some((m) => m.status === 'live');
    const cacheSeconds = hasLiveMatches ? 30 : 300; // 30s if live, 5min otherwise

    return new Response(JSON.stringify({ matches, timestamp: Date.now() }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': `public, max-age=${cacheSeconds}`,
      },
    });
  } catch (error) {
    console.error('Error fetching scores:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to fetch scores',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
