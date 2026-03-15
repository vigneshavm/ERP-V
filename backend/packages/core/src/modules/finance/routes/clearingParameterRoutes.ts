import express from 'express';
import { protect } from '@smarterp/shared/middlewares/authMiddleware.js';
import { initializeUnit, getParameters, updateParameter } from '../controllers/ClearingParameterController.js';

const router = express.Router();

router.post('/init', protect, initializeUnit);
router.get('/', protect, getParameters);
router.put('/:id', protect, updateParameter);

export default router;
