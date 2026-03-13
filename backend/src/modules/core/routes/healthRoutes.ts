import { Router } from "express";
import { healthCheck, readinessCheck, livenessCheck, dbHealthCheck } from "../controllers/HealthController.js";

const router = Router();

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: General health check
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is healthy
 */
router.get("/", healthCheck);

router.get("/ready", readinessCheck);

/**
 * @swagger
 * /api/health/db/ready:
 *   get:
 *     summary: Database connection check
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Database is connected
 */
router.get("/db/ready", dbHealthCheck);

/**
 * @swagger
 * /api/health/live:
 *   get:
 *     summary: Liveness check
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is live
 */
router.get("/live", livenessCheck);

export default router;
