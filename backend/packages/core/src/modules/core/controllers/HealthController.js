import mongoose from 'mongoose';
import { asyncHandler } from '@smarterp/shared/utils/asyncHandler.js';
/**
 * Health check controller
 * Provides endpoints for monitoring application health
 */
/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Basic health check
 *     description: Returns 200 if application is running
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Application is running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   example: "2024-01-25T17:00:00.000Z"
 *                 uptime:
 *                   type: number
 *                   example: 123.456
 *                 environment:
 *                   type: string
 *                   example: development
 */
export const healthCheck = asyncHandler(async (_req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
    });
});
/**
 * @swagger
 * /api/health/ready:
 *   get:
 *     summary: Readiness check
 *     description: Returns 200 if application is ready to serve traffic (checks DB)
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Application is ready
 *       503:
 *         description: Application is not ready
 */
export const readinessCheck = asyncHandler(async (_req, res) => {
    // Check database connection
    const dbState = mongoose.connection.readyState;
    const dbReady = dbState === 1; // 1 = connected
    if (!dbReady) {
        res.status(503).json({
            status: 'not_ready',
            timestamp: new Date().toISOString(),
            checks: {
                database: 'disconnected',
            },
        });
        return;
    }
    res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString(),
        checks: {
            database: 'connected',
        },
    });
});
/**
 * @swagger
 * /api/health/db/ready:
 *   get:
 *     summary: Database connection check
 *     description: Returns 200 if database is connected
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Database is connected
 *       503:
 *         description: Database is disconnected
 */
export const dbHealthCheck = asyncHandler(async (_req, res) => {
    const dbState = mongoose.connection.readyState;
    const dbReady = dbState === 1;
    if (!dbReady) {
        res.status(503).json({
            status: 'disconnected',
            timestamp: new Date().toISOString(),
        });
        return;
    }
    res.status(200).json({
        status: 'connected',
        timestamp: new Date().toISOString(),
    });
});
/**
 * @swagger
 * /api/health/live:
 *   get:
 *     summary: Liveness check
 *     description: Returns 200 if application is alive
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Application is alive
 */
export const livenessCheck = asyncHandler(async (_req, res) => {
    res.status(200).json({
        status: 'alive',
        timestamp: new Date().toISOString(),
    });
});
export default {
    healthCheck,
    readinessCheck,
    livenessCheck,
    dbHealthCheck,
};
