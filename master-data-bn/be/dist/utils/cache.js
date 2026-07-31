"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isRedisConnected = exports.redis = void 0;
exports.withCache = withCache;
exports.setCache = setCache;
exports.clearCachePattern = clearCachePattern;
exports.cacheRouteMiddleware = cacheRouteMiddleware;
const ioredis_1 = __importDefault(require("ioredis"));
const env_1 = require("../configs/env");
// 1. Initialize Redis Client
exports.redis = env_1.env.REDIS_URL ? new ioredis_1.default(env_1.env.REDIS_URL, {
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
exports.isRedisConnected = false;
if (exports.redis) {
    exports.redis.connect().catch(() => {
        console.warn('[Cache] Failed to connect to Redis. Running without cache.');
    });
    exports.redis.on('connect', () => {
        console.log('[Cache] Redis connected successfully.');
        exports.isRedisConnected = true;
    });
    exports.redis.on('error', (err) => {
        console.warn(`[Cache] Redis error: ${err.message}. Cache operations will be bypassed.`);
        exports.isRedisConnected = false;
    });
}
else {
    console.log('[Cache] REDIS_URL not provided. Running without cache.');
}
/**
 * Wraps a service function with Redis cache.
 * @param key Cache key string
 * @param ttl Time to live in seconds
 * @param fetcher Async function that fetches data from DB
 * @returns Data from cache or DB
 */
async function withCache(key, ttl, fetcher) {
    if (!exports.redis || !exports.isRedisConnected) {
        return fetcher();
    }
    try {
        const cached = await exports.redis.get(key);
        if (cached) {
            return JSON.parse(cached);
        }
    }
    catch (err) {
        console.warn(`[Cache] Failed to get key ${key}: ${err.message}`);
    }
    // Cache miss or error fetching from cache, execute fetcher
    const data = await fetcher();
    // Save to cache asynchronously so it doesn't block the request
    if (exports.redis && exports.isRedisConnected && data !== undefined) {
        exports.redis.set(key, JSON.stringify(data), 'EX', ttl).catch(err => {
            console.warn(`[Cache] Failed to set key ${key}: ${err.message}`);
        });
    }
    return data;
}
/**
 * Set data manually into the cache.
 */
async function setCache(key, data, ttl) {
    if (exports.redis && exports.isRedisConnected && data !== undefined) {
        await exports.redis.set(key, JSON.stringify(data), 'EX', ttl).catch(err => {
            console.warn(`[Cache] Failed to set key ${key}: ${err.message}`);
        });
    }
}
/**
 * Clears keys matching a pattern (e.g. 'student:all:*' or 'auth:me:*')
 * Uses SCAN to safely find and delete keys without blocking Redis.
 */
async function clearCachePattern(pattern) {
    if (!exports.redis || !exports.isRedisConnected)
        return;
    try {
        let cursor = '0';
        do {
            const res = await exports.redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
            cursor = res[0];
            const keys = res[1];
            if (keys.length > 0) {
                await exports.redis.del(...keys);
            }
        } while (cursor !== '0');
    }
    catch (err) {
        console.warn(`[Cache] Failed to clear cache pattern ${pattern}: ${err.message}`);
    }
}
/**
 * Intercepts an express route to serve from cache or cache its response.
 * Useful for 3rd party routes like sentriAuth.
 */
function cacheRouteMiddleware(keyGen, ttl) {
    return async (req, res, next) => {
        if (!exports.redis || !exports.isRedisConnected) {
            return next();
        }
        const key = keyGen(req);
        if (!key) {
            return next();
        }
        try {
            const cached = await exports.redis.get(key);
            if (cached) {
                // Send cached response
                res.setHeader('X-Cache', 'HIT');
                return res.json(JSON.parse(cached));
            }
        }
        catch (err) {
            console.warn(`[Cache] Middleware failed to get key ${key}: ${err.message}`);
        }
        res.setHeader('X-Cache', 'MISS');
        // Intercept res.json
        const originalJson = res.json.bind(res);
        res.json = (body) => {
            // Only cache successful 200/201 responses
            if (exports.redis && exports.isRedisConnected && res.statusCode >= 200 && res.statusCode < 300) {
                exports.redis.set(key, JSON.stringify(body), 'EX', ttl).catch(err => {
                    console.warn(`[Cache] Middleware failed to set key ${key}: ${err.message}`);
                });
            }
            return originalJson(body);
        };
        next();
    };
}
