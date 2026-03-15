/**
 * ENTERPRISE OBSERVABILITY: Request Correlation & Tracing
 * 
 * Adds:
 * - Request correlation IDs
 * - End-to-end tracing
 * - Structured logging with context
 * 
 * NO BUSINESS LOGIC CHANGES - Only adds observability
 */

import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from 'uuid';
import { AsyncLocalStorage } from 'async_hooks';

// AsyncLocalStorage for request context propagation
const asyncLocalStorage = new AsyncLocalStorage<any>();

/**
 * Middleware to generate and propagate correlation ID
 * Usage: app.use(correlationMiddleware);
 */
export const correlationMiddleware = (req: Request, res: Response, next: NextFunction) => {
    // Get correlation ID from header or generate new one
    const correlationId = (req.headers['x-correlation-id'] as string) ||
        (req.headers['x-request-id'] as string) ||
        uuidv4();

    // Store in async context
    const store = {
        correlationId,
        userId: null, // Will be set by auth middleware
        requestPath: req.path,
        requestMethod: req.method,
        startTime: Date.now(),
    };

    // Set response header
    res.setHeader('X-Correlation-ID', correlationId);

    // Run request in async context
    asyncLocalStorage.run(store, () => {
        // Attach to request for easy access
        (req as any).correlationId = correlationId;
        next();
    });
};

/**
 * Get current correlation ID from async context
 * @returns {string|null} Correlation ID
 */
export const getCorrelationId = (): string | null => {
    const store = asyncLocalStorage.getStore();
    return store?.correlationId || null;
};

/**
 * Get current request context
 * @returns {Object|null} Request context
 */
export const getRequestContext = () => {
    return asyncLocalStorage.getStore() || null;
};

/**
 * Set user ID in request context (call from auth middleware)
 * @param {string} userId - User ID
 */
export const setUserId = (userId: string) => {
    const store = asyncLocalStorage.getStore();
    if (store) {
        store.userId = userId;
    }
};

/**
 * Enhanced logger with correlation ID
 * Wraps existing logger to add correlation context
 */
export const createContextLogger = (baseLogger: any) => {
    const addContext = (level: string, message: string, meta: any = {}) => {
        const context = getRequestContext();
        const enrichedMeta = {
            ...meta,
            correlationId: context?.correlationId,
            userId: context?.userId,
            requestPath: context?.requestPath,
            requestMethod: context?.requestMethod,
        };

        baseLogger[level](message, enrichedMeta);
    };

    return {
        info: (message: string, meta: any) => addContext('info', message, meta),
        warn: (message: string, meta: any) => addContext('warn', message, meta),
        error: (message: string, meta: any) => addContext('error', message, meta),
        debug: (message: string, meta: any) => addContext('debug', message, meta),
    };
};

/**
 * Trace function execution with correlation
 * @param {string} operationName - Name of operation
 * @param {Function} fn - Function to trace
 * @returns {Promise<any>} Function result
 */
export const trace = async <T>(operationName: string, fn: () => Promise<T>): Promise<T> => {
    const context = getRequestContext();
    const startTime = Date.now();

    try {
        const result = await fn();
        const duration = Date.now() - startTime;

        console.log(`[TRACE] ${operationName} completed in ${duration}ms`, {
            correlationId: context?.correlationId,
            duration,
            success: true,
        });

        return result;
    } catch (error: any) {
        const duration = Date.now() - startTime;

        console.error(`[TRACE] ${operationName} failed in ${duration}ms`, {
            correlationId: context?.correlationId,
            duration,
            success: false,
            error: error.message,
        });

        throw error;
    }
};

export default {
    correlationMiddleware,
    getCorrelationId,
    getRequestContext,
    setUserId,
    createContextLogger,
    trace,
};
