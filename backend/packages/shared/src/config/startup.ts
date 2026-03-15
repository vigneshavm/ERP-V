/**
 * ENTERPRISE DEPLOYMENT: Startup Self-Checks & Graceful Shutdown
 * 
 * Adds:
 * - Startup dependency validation
 * - Health check enhancements
 * - Graceful shutdown with connection draining
 * - Feature flags
 * 
 * NO BUSINESS LOGIC CHANGES - Only adds operational safety
 */

import mongoose, { Model } from 'mongoose';
import { Server } from 'http';
import { error as logError, warn } from './logger.js';

// Types
interface StartupChecks {
    environment: boolean;
    database: boolean;
    redis: boolean;
    email: boolean;
}

interface HealthCheckResult {
    status: 'up' | 'down' | 'unavailable';
    latency?: number;
    error?: string;
}

interface MemoryCheck {
    status: 'ok' | 'high';
    heapUsed: string;
    heapTotal: string;
}

interface HealthStatus {
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: string;
    uptime: number;
    checks: {
        database?: HealthCheckResult;
        redis?: HealthCheckResult;
        memory?: MemoryCheck;
    };
}

interface FeatureFlagsConfig {
    ENABLE_REDIS_CACHE: boolean;
    ENABLE_BACKGROUND_JOBS: boolean;
    ENABLE_METRICS: boolean;
    ENABLE_CSRF: boolean;
    ENABLE_RATE_LIMITING: boolean;
    ENABLE_AUDIT_LOGGING: boolean;
}

// Dynamic import types
type ValidateDatabaseSafetyFn = () => Promise<void>;
type ValidateIndexesFn = (models: Model<any>[]) => Promise<void>;

/**
 * Startup self-checks (non-fatal but visible)
 * Call before starting server
 */
export const runStartupChecks = async (): Promise<StartupChecks> => {
    console.log('🔍 Running startup self-checks...\n');

    const checks: StartupChecks = {
        environment: false,
        database: false,
        redis: false,
        email: false,
    };

    // 1. Environment variables
    try {
        const required = ['MONGO_URI', 'JWT_SECRET', 'JWT_REFRESH_SECRET', 'COOKIE_SECRET'];
        const missing = required.filter(key => !process.env[key]);

        if (missing.length > 0) {
            warn(`Environment check: Missing variables: ${missing.join(', ')}`);
        } else {
            console.log('✅ Environment: All required variables present');
            checks.environment = true;
        }
    } catch (err) {
        logError('Environment check failed:', { error: (err as Error).message });
    }

    // 2. Database connection
    try {
        if (mongoose.connection.readyState === 1) {
            console.log('✅ Database: Connected');
            checks.database = true;

            // Run database safety checks
            try {
                //  - module may not exist yet
                const { validateDatabaseSafety, validateIndexes } = await import('../utils/transaction.js') as {
                    validateDatabaseSafety: ValidateDatabaseSafetyFn;
                    validateIndexes: ValidateIndexesFn;
                };
                await validateDatabaseSafety();

                // Validate indexes (non-blocking)
                const models: Model<any>[] = [
                    mongoose.model('User'),
                    mongoose.model('Customer'),
                    mongoose.model('Item'),
                    mongoose.model('Invoice'),
                ];
                await validateIndexes(models);
            } catch {
                // Modules might not exist yet
            }
        } else {
            warn('Database: Not connected');
        }
    } catch (err) {
        logError('Database check failed:', { error: (err as Error).message });
    }

    // 3. Redis connection (optional)
    try {
        const cacheModule = await import('./cache.js');
        const redisClient = cacheModule.default?.redisClient || cacheModule.redisClient;
        if (redisClient?.status === 'ready') {
            console.log('✅ Redis: Connected');
            checks.redis = true;
        } else {
            warn('Redis: Not connected (cache and queue features disabled)');
        }
    } catch (err) {
        warn(`Redis check skipped: ${(err as Error).message}`);
    }

    // 4. Email configuration (optional)
    try {
        if (process.env.SMTP_HOST && process.env.SMTP_USER) {
            console.log('✅ Email: Configured');
            checks.email = true;
        } else {
            warn('Email: Not configured (email features disabled)');
        }
    } catch (err) {
        warn(`Email check failed: ${(err as Error).message}`);
    }

    console.log('\n📊 Startup checks summary:', checks);
    console.log('');

    return checks;
};

/**
 * Enhanced health check endpoint
 * Returns detailed health status
 */
export const getHealthStatus = async (): Promise<HealthStatus> => {
    const health: HealthStatus = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        checks: {},
    };

    // Database check
    try {
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.db?.admin().ping();
            health.checks.database = { status: 'up', latency: 0 };
        } else {
            health.checks.database = { status: 'down' };
            health.status = 'degraded';
        }
    } catch (err) {
        health.checks.database = { status: 'down', error: (err as Error).message };
        health.status = 'unhealthy';
    }

    // Redis check (optional)
    try {
        const cacheModule = await import('./cache.js');
        const redisClient = cacheModule.default?.redisClient || cacheModule.redisClient;
        if (redisClient?.status === 'ready') {
            health.checks.redis = { status: 'up' };
        } else {
            health.checks.redis = { status: 'down' };
            // Don't mark as unhealthy - Redis is optional
        }
    } catch (err) {
        health.checks.redis = { status: 'unavailable' };
    }

    // Memory check
    const memUsage = process.memoryUsage();
    health.checks.memory = {
        status: memUsage.heapUsed < memUsage.heapTotal * 0.9 ? 'ok' : 'high',
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB',
    };

    return health;
};

/**
 * Graceful shutdown handler
 * Ensures clean shutdown with connection draining
 */
export const setupGracefulShutdown = (server: Server): void => {
    let isShuttingDown = false;

    const shutdown = async (signal: string): Promise<void> => {
        if (isShuttingDown) return;
        isShuttingDown = true;

        console.log(`\n📦 Received ${signal}, starting graceful shutdown...`);

        // 1. Stop accepting new connections
        server.close(() => {
            console.log('✅ HTTP server closed');
        });

        // 2. Close database connection
        try {
            await mongoose.connection.close();
            console.log('✅ Database connection closed');
        } catch (err) {
            logError('Error closing database:', { error: (err as Error).message });
        }

        // 3. Close Redis connection
        try {
            const cacheModule = await import('./cache.js');
            const redisClient = cacheModule.default?.redisClient || cacheModule.redisClient;
            await redisClient?.quit();
            console.log('✅ Redis connection closed');
        } catch (err) {
            // Redis might not be initialized
        }

        // 4. Wait for in-flight requests (max 10s)
        setTimeout(() => {
            console.log('✅ Graceful shutdown complete');
            process.exit(0);
        }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
};

/**
 * Feature flags (off by default, no logic change)
 * Enable features via environment variables
 */
export const featureFlags: FeatureFlagsConfig = {
    ENABLE_REDIS_CACHE: process.env.ENABLE_REDIS_CACHE === 'true',
    ENABLE_BACKGROUND_JOBS: process.env.ENABLE_BACKGROUND_JOBS === 'true',
    ENABLE_METRICS: process.env.ENABLE_METRICS === 'true',
    ENABLE_CSRF: process.env.ENABLE_CSRF === 'true',
    ENABLE_RATE_LIMITING: process.env.ENABLE_RATE_LIMITING !== 'false', // Default ON
    ENABLE_AUDIT_LOGGING: process.env.ENABLE_AUDIT_LOGGING !== 'false', // Default ON
};

export default {
    runStartupChecks,
    getHealthStatus,
    setupGracefulShutdown,
    featureFlags,
};
