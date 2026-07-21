import { Redis } from 'ioredis';
import { env } from '@/configs/env.js';

export const redis = env.REDIS_URL ? new Redis(env.REDIS_URL) : null;

export async function withCache<T>(key: string, ttl: number, fetcher: () => Promise<T>): Promise<T> {
  if (!redis) return fetcher();

  const cached = await redis.get(key);
  if (cached) {
    try {
      return JSON.parse(cached) as T;
    } catch (e) {
      console.warn(`Failed to parse cache for key ${key}`);
    }
  }

  const data = await fetcher();
  await redis.setex(key, ttl, JSON.stringify(data));
  return data;
}

export async function clearCachePattern(pattern: string): Promise<void> {
  if (!redis) return;
  
  // Using SCAN to safely delete keys matching pattern
  let cursor = '0';
  do {
    const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
    cursor = nextCursor;
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } while (cursor !== '0');
}

export async function setCache(key: string, data: unknown, ttl: number): Promise<void> {
  if (!redis) return;
  await redis.setex(key, ttl, JSON.stringify(data));
}
