import Redis from 'ioredis';
import { env } from '#app';
import { Request, Response, NextFunction } from 'express';

// 1. Initialize Redis Client
export const redis = env.REDIS_URL ? new Redis(env.REDIS_URL, {
  lazyConnect: true,
  maxRetriesPerRequest: 1,
  retryStrategy: (times) => {
    // Stop retrying after 3 attempts
    if (times > 3) {
      return null;
    }
    return Math.min(times * 50, 2000);
  }
}) : null;

export let isRedisConnected = false;

if (redis) {
  redis.connect().catch(() => {
    console.warn('[Cache] Failed to connect to Redis. Running without cache.');
  });
  redis.on('connect', () => {
    console.log('[Cache] Redis connected successfully.');
    isRedisConnected = true;
  });
  redis.on('error', (err) => {
    console.warn(`[Cache] Redis error: ${err.message}. Cache operations will be bypassed.`);
    isRedisConnected = false;
  });
} else {
  console.log('[Cache] REDIS_URL not provided. Running without cache.');
}

/**
 * Wraps a service function with Redis cache.
 * @param key Cache key string
 * @param ttl Time to live in seconds
 * @param fetcher Async function that fetches data from DB
 * @returns Data from cache or DB
 */
export async function withCache<T>(key: string, ttl: number, fetcher: () => Promise<T>): Promise<T> {
  if (!redis || !isRedisConnected) {
    return fetcher();
  }

  try {
    const cached = await redis.get(key);
    if (cached) {
      return JSON.parse(cached) as T;
    }
  } catch (err: unknown) {
    console.warn(`[Cache] Failed to get key ${key}: ${err instanceof Error ? err.message : String(err)}`);
  }

  // Cache miss or error fetching from cache, execute fetcher
  const data = await fetcher();

  // Save to cache asynchronously so it doesn't block the request
  if (redis && isRedisConnected && data !== undefined) {
    redis.set(key, JSON.stringify(data), 'EX', ttl).catch(err => {
      console.warn(`[Cache] Failed to set key ${key}: ${err.message}`);
    });
  }

  return data;
}

/**
 * Set data manually into the cache.
 */
export async function setCache(key: string, data: unknown, ttl: number): Promise<void> {
  if (redis && isRedisConnected && data !== undefined) {
    await redis.set(key, JSON.stringify(data), 'EX', ttl).catch(err => {
      console.warn(`[Cache] Failed to set key ${key}: ${err.message}`);
    });
  }
}

/**
 * Clears keys matching a pattern (e.g. 'student:all:*' or 'auth:me:*')
 * Uses SCAN to safely find and delete keys without blocking Redis.
 */
export async function clearCachePattern(pattern: string): Promise<void> {
  if (!redis || !isRedisConnected) return;

  try {
    let cursor = '0';
    do {
      const res = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = res[0];
      const keys = res[1];

      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } while (cursor !== '0');
  } catch (err: unknown) {
    console.warn(`[Cache] Failed to clear cache pattern ${pattern}: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/**
 * Intercepts an express route to serve from cache or cache its response.
 * Useful for 3rd party routes like sentriAuth.
 */
export function cacheRouteMiddleware(keyGen: (req: Request) => string | null, ttl: number) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!redis || !isRedisConnected) {
      return next();
    }

    const key = keyGen(req);
    if (!key) {
      return next();
    }

    try {
      const cached = await redis.get(key);
      if (cached) {
        // Send cached response
        res.setHeader('X-Cache', 'HIT');
        return res.json(JSON.parse(cached));
      }
    } catch (err: unknown) {
      console.warn(`[Cache] Middleware failed to get key ${key}: ${err instanceof Error ? err.message : String(err)}`);
    }

    res.setHeader('X-Cache', 'MISS');

    // Intercept res.json
    const originalJson = res.json.bind(res);
    res.json = (body: unknown) => {
      // Only cache successful 200/201 responses
      if (redis && isRedisConnected && res.statusCode >= 200 && res.statusCode < 300) {
        redis.set(key, JSON.stringify(body), 'EX', ttl).catch(err => {
          console.warn(`[Cache] Middleware failed to set key ${key}: ${err.message}`);
        });
      }
      return originalJson(body);
    };

    next();
  };
}
