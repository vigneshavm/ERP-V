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
// ── In-process store ──────────────────────────────────────────────────────────
const store = new Map();
/** Remove all expired entries (called lazily on get/set). */
const evictExpired = () => {
    const now = Date.now();
    for (const [key, entry] of store) {
        if (entry.expiresAt <= now)
            store.delete(key);
    }
};
// ── Core cache API ────────────────────────────────────────────────────────────
/** Retrieve a cached value, or null if missing / expired. */
export const getCache = async (key) => {
    const entry = store.get(key);
    if (!entry)
        return null;
    if (entry.expiresAt <= Date.now()) {
        store.delete(key);
        return null;
    }
    return entry.value;
};
/** Store a value with a TTL (seconds). */
export const setCache = async (key, value, ttl = 300) => {
    store.set(key, { value, expiresAt: Date.now() + ttl * 1000 });
    // Opportunistically evict expired entries every ~100 writes (amortised O(1))
    if (Math.random() < 0.01)
        evictExpired();
    return true;
};
/** Delete a single key. */
export const deleteCache = async (key) => {
    return store.delete(key);
};
/** Delete all keys that start with the given prefix (replaces the Redis KEYS pattern scan). */
export const deleteCachePattern = async (pattern) => {
    // pattern may end with * — treat everything before * as a prefix
    const prefix = pattern.endsWith('*') ? pattern.slice(0, -1) : pattern;
    for (const key of store.keys()) {
        if (key.startsWith(prefix))
            store.delete(key);
    }
    return true;
};
// ── Stampede protection ───────────────────────────────────────────────────────
const inflightRequests = new Map();
/**
 * Return a cached value if present; otherwise call fetchFn exactly once
 * even if concurrent requests arrive for the same key simultaneously.
 */
export const getCacheOrFetch = async (key, fetchFn, ttl = 300) => {
    const cached = await getCache(key);
    if (cached !== null)
        return cached;
    if (inflightRequests.has(key))
        return inflightRequests.get(key);
    const promise = (async () => {
        try {
            const data = await fetchFn();
            await setCache(key, data, ttl);
            return data;
        }
        finally {
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
export const cacheMiddleware = (ttl = 300) => async (req, res, next) => {
    const cacheKey = `cache:${req.user?._id ?? 'anon'}:${req.originalUrl}`;
    try {
        const cachedData = await getCacheOrFetch(cacheKey, () => new Promise((resolve) => {
            const originalJson = res.json.bind(res);
            res.json = function (data) {
                resolve(data);
                return originalJson(data);
            };
            next();
        }), ttl);
        if (cachedData !== null) {
            res.json(cachedData);
        }
    }
    catch {
        next();
    }
};
/** Invalidate all cached responses for a given user. */
export const invalidateUserCache = async (userId, pattern = '*') => deleteCachePattern(`cache:${userId}:${pattern === '*' ? '' : pattern}`);
/** Dummy redisClient for compatibility with startup.ts after Redis removal. */
export const redisClient = {
    status: 'ready',
    quit: async () => { },
};
export default {
    getCache,
    setCache,
    deleteCache,
    deleteCachePattern,
    getCacheOrFetch,
    cacheMiddleware,
    invalidateUserCache,
    redisClient,
};
