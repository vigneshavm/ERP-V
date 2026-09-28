import { Router } from "express";
import { healthCheck, readinessCheck, livenessCheck } from "../controllers/HealthController.js";

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

/**
 * @swagger
 * /api/health/ready:
 *   get:
 *     summary: Readiness check
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is ready
 */
router.get("/ready", readinessCheck);

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
