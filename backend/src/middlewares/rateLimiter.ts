import Redis from 'ioredis';
import crypto from 'crypto';
import { error as logError, warn } from '../config/logger.js';
import { Request, Response, NextFunction } from 'express';

// Extend Request to include rateLimitContext
declare global {
    namespace Express {
        interface Request {
            rateLimitContext?: any;
            correlationId?: string;
        }
    }
}

// Redis client for distributed rate limiting
// Cast to any to avoid "not constructable" error if default export mismatch occurs
const RedisClass: any = Redis;
const redisClient = new RedisClass({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
    retryStrategy: (times: number) => {
        if (times > 3) return null;
        return Math.min(times * 50, 200);
    },
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    enableOfflineQueue: false, // Don't queue commands when offline
});

let isRedisAvailable = false;
let redisErrorLogged = false; // Track if we've already logged the Redis error

redisClient.on('connect', () => {
    console.log('✅ Redis connected (rate limiting)');
    isRedisAvailable = true;
    redisErrorLogged = false; // Reset error flag on successful connection
});

redisClient.on('error', (err: any) => {
    // Only log the first Redis error to prevent log spam
    if (!redisErrorLogged && process.env.NODE_ENV !== 'test') {
        logError('Redis error (rate limiting):', err.message);
        warn('Redis unavailable - rate limiting will use in-memory fallback');
        redisErrorLogged = true;
    }
    isRedisAvailable = false;
});

// Attempt connection (non-blocking)
redisClient.connect().catch((_err: any) => {
    // Error will be logged by the 'error' event handler
});

// In-memory fallback store (per-instance only)
const memoryStore = new Map();

/**
 * Rate limiting thresholds (enterprise-grade)
 */
const LIMITS = {
    IP: {
        max: 5,
        windowMs: 15 * 60 * 1000, // 15 minutes
        keyPrefix: 'rl:ip:',
    },
    ACCOUNT: {
        max: 5,
        windowMs: 15 * 60 * 1000, // 15 minutes
        keyPrefix: 'rl:account:',
    },
    DEVICE: {
        max: 3,
        windowMs: 5 * 60 * 1000, // 5 minutes
        keyPrefix: 'rl:device:',
    },
    GLOBAL: {
        max: process.env.NODE_ENV === 'test' ? 1000 : 100, // Higher limit in tests to prevent interference
        windowMs: 60 * 1000, // 1 minute (spike detection)
        keyPrefix: 'rl:global:',
    },
};

/**
 * Hash identifier for privacy (account email)
 */
const hashIdentifier = (identifier: string): string => {
    return crypto.createHash('sha256').update(identifier.toLowerCase()).digest('hex').substring(0, 16);
};

/**
 * Get rate limit state from Redis or memory
 */
const getRateLimitState = async (key: string, windowMs: number): Promise<{ count: number; resetAt: number }> => {
    if (isRedisAvailable) {
        try {
            const data = await redisClient.get(key);
            if (!data) {
                return { count: 0, resetAt: Date.now() + windowMs };
            }

            const parsed = JSON.parse(data);
            return parsed;
        } catch (err) {
            logError('Redis get error:', err as any);
            isRedisAvailable = false;
        }
    }

    // Fallback to memory
    const data = memoryStore.get(key);
    if (!data || Date.now() > data.resetAt) {
        return { count: 0, resetAt: Date.now() + windowMs };
    }
    return data;
};

/**
 * Increment rate limit counter
 */
const incrementRateLimit = async (key: string, windowMs: number): Promise<{ count: number; resetAt: number }> => {
    const state = await getRateLimitState(key, windowMs);

    // Reset if window expired
    if (Date.now() > state.resetAt) {
        state.count = 1;
        state.resetAt = Date.now() + windowMs;
    } else {
        state.count++;
    }

    if (isRedisAvailable) {
        try {
            const ttlSeconds = Math.ceil(windowMs / 1000);
            await redisClient.setex(key, ttlSeconds, JSON.stringify(state));
        } catch (err: any) {
            logError('Redis setex error:', err);
            isRedisAvailable = false;
        }
    }

    // Always update memory as fallback
    memoryStore.set(key, state);

    // Cleanup expired memory entries periodically
    if (Math.random() < 0.01) {
        const now = Date.now();
        for (const [k, v] of memoryStore.entries()) {
            if (now > v.resetAt + windowMs) {
                memoryStore.delete(k);
            }
        }
    }

    return state;
};

/**
 * Reset rate limit counter (on successful login)
 */
const resetRateLimit = async (key: string): Promise<void> => {
    if (isRedisAvailable) {
        try {
            await redisClient.del(key);
        } catch (err: any) {
            logError('Redis del error:', err);
        }
    }

    memoryStore.delete(key);
};

/**
 * Multi-dimensional login rate limiter
 */
export const loginRateLimiter = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const ip = req.ip || req.connection.remoteAddress || 'unknown';
        const email = req.body.email;
        const deviceId = (req.signedCookies?.deviceId as string) || (req.headers['x-device-id'] as string) || 'unknown';
        const correlationId = req.correlationId || 'unknown';

        // 1. Global spike detection (prevent floods)
        const globalKey = LIMITS.GLOBAL.keyPrefix + 'login';
        const globalState = await incrementRateLimit(globalKey, LIMITS.GLOBAL.windowMs);

        if (globalState.count > LIMITS.GLOBAL.max) {
            logError('SECURITY: Global login spike detected', {
                count: globalState.count,
                max: LIMITS.GLOBAL.max,
                correlationId,
            });

            return res.status(429).json({
                message: 'Too many login attempts. Please try again later.',
                retryAfter: Math.ceil((globalState.resetAt - Date.now()) / 1000),
            });
        }

        // 2. IP-based limiting
        const ipKey = LIMITS.IP.keyPrefix + ip;
        const ipState = await getRateLimitState(ipKey, LIMITS.IP.windowMs);

        if (ipState.count >= LIMITS.IP.max) {
            warn('SECURITY: IP rate limit exceeded', {
                ip,
                count: ipState.count,
                correlationId,
            });

            return res.status(429).json({
                message: 'Too many login attempts from this IP. Please try again later.',
                retryAfter: Math.ceil((ipState.resetAt - Date.now()) / 1000),
            });
        }

        // 3. Account-based limiting (if email provided)
        if (email) {
            const accountHash = hashIdentifier(email);
            const accountKey = LIMITS.ACCOUNT.keyPrefix + accountHash;
            const accountState = await getRateLimitState(accountKey, LIMITS.ACCOUNT.windowMs);

            if (accountState.count >= LIMITS.ACCOUNT.max) {
                warn('SECURITY: Account rate limit exceeded', {
                    accountHash,
                    count: accountState.count,
                    correlationId,
                });

                // Log potential credential stuffing
                logError('SECURITY: Possible credential stuffing attack', {
                    accountHash,
                    ip,
                    attempts: accountState.count,
                    correlationId,
                });

                return res.status(429).json({
                    message: 'Too many failed login attempts for this account. Please try again later.',
                    retryAfter: Math.ceil((accountState.resetAt - Date.now()) / 1000),
                });
            }
        }

        // 4. Device-based limiting
        if (deviceId !== 'unknown') {
            const deviceKey = LIMITS.DEVICE.keyPrefix + deviceId;
            const deviceState = await getRateLimitState(deviceKey, LIMITS.DEVICE.windowMs);

            if (deviceState.count >= LIMITS.DEVICE.max) {
                warn('SECURITY: Device rate limit exceeded', {
                    deviceId: deviceId.substring(0, 8) + '...',
                    count: deviceState.count,
                    correlationId,
                });

                return res.status(429).json({
                    message: 'Too many login attempts from this device. Please try again later.',
                    retryAfter: Math.ceil((deviceState.resetAt - Date.now()) / 1000),
                });
            }
        }

        // Store rate limit context for post-login processing
        req.rateLimitContext = {
            ip,
            email,
            deviceId,
            ipKey,
            accountKey: email ? LIMITS.ACCOUNT.keyPrefix + hashIdentifier(email) : null,
            deviceKey: deviceId !== 'unknown' ? LIMITS.DEVICE.keyPrefix + deviceId : null,
        };

        next();
    } catch (err) {
        logError('Rate limiter error:', err as any);

        // Fail-safe: Allow request but log error
        if (process.env.NODE_ENV === 'production') {
            console.error('🚨 RATE LIMITER FAILURE - SECURITY DEGRADED');
        }

        next();
    }
};

/**
 * Attack signal detection (non-blocking, log-only)
 */
const detectAttackSignals = async (req: Request) => {
    const { email, ip } = req.rateLimitContext;
    const correlationId = req.correlationId || 'unknown';

    if (!email) return;

    const accountHash = hashIdentifier(email);

    // Check for distributed attack (same account, many IPs)
    const distributedKey = `attack:distributed:${accountHash}`;

    if (isRedisAvailable) {
        try {
            await redisClient.sadd(distributedKey, ip);
            await redisClient.expire(distributedKey, 3600); // 1 hour

            const uniqueIPs = await redisClient.scard(distributedKey);

            if (uniqueIPs >= 5) {
                logError('🚨 SECURITY ALERT: Distributed brute-force attack detected', {
                    accountHash,
                    uniqueIPs,
                    correlationId,
                    attackType: 'distributed_brute_force',
                });
            }
        } catch (err: any) {
            logError('Attack detection error:', err);
        }
    }

    // Check for credential stuffing (same password across accounts)
    // Note: We don't have password here, but we can detect velocity
    const velocityKey = `attack:velocity:${ip}`;

    if (isRedisAvailable) {
        try {
            const attempts = await redisClient.incr(velocityKey);
            await redisClient.expire(velocityKey, 60); // 1 minute

            if (attempts >= 10) {
                logError('🚨 SECURITY ALERT: High-velocity login attempts detected', {
                    ip,
                    attempts,
                    correlationId,
                    attackType: 'credential_stuffing_suspected',
                });
            }
        } catch (err: any) {
            logError('Velocity detection error:', err);
        }
    }
};

/**
 * Post-login handler - increment or reset counters
 */
export const handleLoginAttempt = async (req: Request, success: boolean) => {
    if (!req.rateLimitContext) return;

    const { ipKey, accountKey, deviceKey, ip } = req.rateLimitContext;
    const correlationId = req.correlationId || 'unknown';

    if (success) {
        // Reset all counters on successful login
        await resetRateLimit(ipKey);
        if (accountKey) await resetRateLimit(accountKey);
        if (deviceKey) await resetRateLimit(deviceKey);

        console.log('✅ Login successful - rate limit counters reset', {
            ip,
            accountHash: accountKey ? accountKey.split(':')[2] : null,
            correlationId,
        });
    } else {
        // Increment counters on failed login
        await incrementRateLimit(ipKey, LIMITS.IP.windowMs);
        if (accountKey) await incrementRateLimit(accountKey, LIMITS.ACCOUNT.windowMs);
        if (deviceKey) await incrementRateLimit(deviceKey, LIMITS.DEVICE.windowMs);

        // Log failed attempt
        warn('SECURITY: Login attempt failed', {
            ip,
            accountHash: accountKey ? accountKey.split(':')[2] : null,
            correlationId,
        });

        // Attack signal detection
        await detectAttackSignals(req);
    }
};

/**
 * Legacy rate limiters
 */
export const authLimiter = loginRateLimiter; // Alias

export const passwordResetLimiter = async (req: Request, res: Response, next: NextFunction) => {
    // Simple IP-based limiting for password reset
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const key = 'rl:pwreset:' + ip;

    const state = await getRateLimitState(key, 60 * 60 * 1000); // 1 hour

    if (state.count >= 3) {
        return res.status(429).json({
            message: 'Too many password reset requests. Please try again later.',
            retryAfter: Math.ceil((state.resetAt - Date.now()) / 1000),
        });
    }

    await incrementRateLimit(key, 60 * 60 * 1000);
    next();
};

export const forceLogoutLimiter = async (req: Request, res: Response, next: NextFunction) => {
    // Account-based limiting for force logout
    const userId = (req as any).user?._id?.toString();
    if (!userId) return next();

    const key = 'rl:logout:' + userId;
    const state = await getRateLimitState(key, 60 * 60 * 1000); // 1 hour

    if (state.count >= 5) {
        return res.status(429).json({
            message: 'Too many logout requests. Please try again later.',
            retryAfter: Math.ceil((state.resetAt - Date.now()) / 1000),
        });
    }

    await incrementRateLimit(key, 60 * 60 * 1000);
    next();
};

export { redisClient };

export default {
    loginRateLimiter,
    handleLoginAttempt,
    authLimiter,
    passwordResetLimiter,
    forceLogoutLimiter,
    redisClient,
    isRedisAvailable: () => isRedisAvailable,
};

export const importLimiter = async (req: Request, res: Response, next: NextFunction) => {
    // User-based limiting for imports
    const userId = (req as any).user?._id?.toString();
    // If not authenticated (shouldn't happen on protected route), fall back to IP
    const identifier = userId || req.ip || req.connection.remoteAddress || 'unknown';

    const key = `rl:import:${identifier}`;
    const windowMs = 15 * 60 * 1000; // 15 minutes

    const state = await getRateLimitState(key, windowMs);

    if (state.count >= 10) {
        return res.status(429).json({
            message: 'Too many import requests. Please try again in 15 minutes.',
            retryAfter: Math.ceil((state.resetAt - Date.now()) / 1000),
        });
    }

    await incrementRateLimit(key, windowMs);
    next();
};
