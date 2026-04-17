import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';

const CACHE_FILE = '.cache/api-cache.json';

interface CacheEntry {
  data: any;
  expires: number;
}

type CacheStore = Record<string, CacheEntry>;

/**
 * Ensure cache directory exists
 */
function ensureCacheDir() {
  const dir = dirname(CACHE_FILE);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

/**
 * Read cache from disk
 */
function readCache(): CacheStore {
  ensureCacheDir();

  if (!existsSync(CACHE_FILE)) {
    return {};
  }

  try {
    const content = readFileSync(CACHE_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Failed to read cache file:', error);
    return {};
  }
}

/**
 * Write cache to disk
 */
function writeCache(cache: CacheStore) {
  ensureCacheDir();

  try {
    writeFileSync(CACHE_FILE, JSON.stringify(cache), 'utf-8');
  } catch (error) {
    console.error('Failed to write cache file:', error);
  }
}

/**
 * Get cached data or fetch and cache it
 *
 * @param key - Unique cache key
 * @param ttlMs - Time to live in milliseconds
 * @param fetcher - Function to fetch data if cache miss
 * @returns Cached or freshly fetched data
 */
export async function getCached<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const cache = readCache();
  const entry = cache[key];

  // Check if cached and not expired
  if (entry && Date.now() < entry.expires) {
    return entry.data as T;
  }

  // Fetch fresh data
  const data = await fetcher();

  // Cache it
  cache[key] = {
    data,
    expires: Date.now() + ttlMs,
  };

  writeCache(cache);

  return data;
}

/**
 * Invalidate cache entry by key
 */
export function invalidateCache(key: string) {
  const cache = readCache();
  delete cache[key];
  writeCache(cache);
}

/**
 * Invalidate multiple cache entries by pattern
 *
 * @param pattern - String pattern or regex to match keys
 */
export function invalidateCachePattern(pattern: string | RegExp) {
  const cache = readCache();
  const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;

  Object.keys(cache).forEach((key) => {
    if (regex.test(key)) {
      delete cache[key];
    }
  });

  writeCache(cache);
}

/**
 * Clear all cache
 */
export function clearCache() {
  writeCache({});
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  const cache = readCache();
  const now = Date.now();

  const stats = {
    total: 0,
    valid: 0,
    expired: 0,
    size: 0,
  };

  Object.keys(cache).forEach((key) => {
    stats.total++;

    if (cache[key].expires > now) {
      stats.valid++;
    } else {
      stats.expired++;
    }
  });

  // Approximate size in bytes
  stats.size = JSON.stringify(cache).length;

  return stats;
}

// Common TTL constants (in milliseconds)
export const TTL = {
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
  MONTH: 30 * 24 * 60 * 60 * 1000,
};
