import type { APIRoute } from 'astro';
import { invalidateCache, invalidateCachePattern } from '@/lib/cache';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    // Verify secret token
    const authHeader = request.headers.get('authorization');
    const secret = import.meta.env.REVALIDATE_SECRET;

    if (!secret) {
      console.error('REVALIDATE_SECRET not configured');
      return new Response(
        JSON.stringify({ error: 'Server misconfiguration' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (!authHeader || authHeader !== `Bearer ${secret}`) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse request body
    const body = await request.json();
    const { postId, slug, action } = body;

    // Log revalidation request
    console.log('Revalidation request:', { postId, slug, action });

    // Invalidate cache based on action
    if (action === 'publish' || action === 'update') {
      // Invalidate specific post cache
      if (slug) {
        invalidateCache(`post-${slug}`);
      }
      if (postId) {
        invalidateCache(`post-${postId}`);
      }

      // Invalidate blog list cache
      invalidateCachePattern(/^posts-/);
      invalidateCachePattern(/^blog-list/);
    } else if (action === 'delete') {
      // Invalidate specific post and lists
      if (slug) {
        invalidateCache(`post-${slug}`);
      }
      if (postId) {
        invalidateCache(`post-${postId}`);
      }
      invalidateCachePattern(/^posts-/);
      invalidateCachePattern(/^blog-list/);
    }

    // Note: Astro 5 experimental cache invalidation would go here
    // For now, we're using file-based cache invalidation
    // In production with Astro cache.set(), you would use:
    // await cache.invalidate({ tags: ['post-${postId}', 'blog-list'] })

    return new Response(
      JSON.stringify({
        revalidated: true,
        postId,
        slug,
        action,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Revalidation error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

export const GET: APIRoute = async () => {
  return new Response(
    JSON.stringify({
      message: 'Revalidation endpoint - POST only',
      usage: 'Send POST request with Authorization: Bearer <secret>',
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
};
