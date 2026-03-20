import express from 'express';
import { protect } from '@smarterp/shared/middlewares/authMiddleware.js';
import { initializeUnit, getParameters, updateParameter } from '../controllers/ClearingParameterController.js';

const router = express.Router();

router.get("/", protect, getParameters);

// PUT / replaces POST /init.
// Initialising clearing parameters is an idempotent upsert — PUT is correct.
// If parameters exist they are replaced; if not, they are created.
router.put("/", protect, initializeUnit);

router.put("/:id", protect, updateParameter);

export default router;
