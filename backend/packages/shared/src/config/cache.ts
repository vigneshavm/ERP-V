/**
 * In-process cache with stampede protection.
 *
 * Redis has been removed. This module provides:
 *   - TTL-based in-memory LRU store
 *   - Single-flight (stampede) protection via an in-flight map
 *   - Drop-in API compatibility with the previous Redis-backed version
 *     (getCache / setCache / deleteCache / deleteCachePattern /
 *      getCacheOrFetch / cacheMiddleware / invalidateUserCache)
 *
 * Trade-off vs Redis: cache is not shared across multiple Node.js
 * processes / pods. For single-instance deployments this is equivalent;
 * for multi-pod deployments a future migration to Redis can reuse the
 * same interface without changing any call sites.
 */

import { Request, Response, NextFunction } from 'express';

interface CacheEntry<T> {
    value: T;
    expiresAt: number;
}

interface AuthenticatedRequest extends Request {
    user?: { _id: string; [key: string]: any };
}

// ── In-process store ──────────────────────────────────────────────────────────
const store = new Map<string, CacheEntry<any>>();

/** Remove all expired entries (called lazily on get/set). */
const evictExpired = (): void => {
    const now = Date.now();
    for (const [key, entry] of store) {
        if (entry.expiresAt <= now) store.delete(key);
    }
};

// ── Core cache API ────────────────────────────────────────────────────────────

/** Retrieve a cached value, or null if missing / expired. */
export const getCache = async <T = any>(key: string): Promise<T | null> => {
    const entry = store.get(key);
    if (!entry) return null;
    if (entry.expiresAt <= Date.now()) {
        store.delete(key);
        return null;
    }
    return entry.value as T;
};

/** Store a value with a TTL (seconds). */
export const setCache = async <T = any>(key: string, value: T, ttl = 300): Promise<boolean> => {
    store.set(key, { value, expiresAt: Date.now() + ttl * 1000 });
    // Opportunistically evict expired entries every ~100 writes (amortised O(1))
    if (Math.random() < 0.01) evictExpired();
    return true;
};

/** Delete a single key. */
export const deleteCache = async (key: string): Promise<boolean> => {
    return store.delete(key);
};

/** Delete all keys that start with the given prefix (replaces the Redis KEYS pattern scan). */
export const deleteCachePattern = async (pattern: string): Promise<boolean> => {
    // pattern may end with * — treat everything before * as a prefix
    const prefix = pattern.endsWith('*') ? pattern.slice(0, -1) : pattern;
    for (const key of store.keys()) {
        if (key.startsWith(prefix)) store.delete(key);
    }
    return true;
};

// ── Stampede protection ───────────────────────────────────────────────────────
const inflightRequests = new Map<string, Promise<any>>();

/**
 * Return a cached value if present; otherwise call fetchFn exactly once
 * even if concurrent requests arrive for the same key simultaneously.
 */
export const getCacheOrFetch = async <T = any>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl = 300,
): Promise<T | null> => {
    const cached = await getCache<T>(key);
    if (cached !== null) return cached;

    if (inflightRequests.has(key)) return inflightRequests.get(key) as Promise<T>;

    const promise = (async (): Promise<T> => {
        try {
            const data = await fetchFn();
            await setCache(key, data, ttl);
            return data;
        } finally {
            inflightRequests.delete(key);
        }
    })();

    inflightRequests.set(key, promise);
    return promise;
};

// ── Express middleware ────────────────────────────────────────────────────────

/**
 * Route-level cache middleware.
 * Caches the full JSON response per user + URL.
 * Usage: router.get('/items', cacheMiddleware(300), controller.getItems)
 */
export const cacheMiddleware = (ttl = 300) =>
    async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
        const cacheKey = `cache:${req.user?._id ?? 'anon'}:${req.originalUrl}`;

        try {
            const cachedData = await getCacheOrFetch(
                cacheKey,
                () =>
                    new Promise<any>((resolve) => {
                        const originalJson = res.json.bind(res);
                        res.json = function (data: any) {
                            resolve(data);
                            return originalJson(data);
                        };
                        next();
                    }),
                ttl,
            );

            if (cachedData !== null) {
                res.json(cachedData);
            }
        } catch {
            next();
        }
    };

/** Invalidate all cached responses for a given user. */
export const invalidateUserCache = async (userId: string, pattern = '*'): Promise<boolean> =>
    deleteCachePattern(`cache:${userId}:${pattern === '*' ? '' : pattern}`);

export default {
    getCache,
    setCache,
    deleteCache,
    deleteCachePattern,
    getCacheOrFetch,
    cacheMiddleware,
    invalidateUserCache,
};
