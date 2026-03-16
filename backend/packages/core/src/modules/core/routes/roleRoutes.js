import express from 'express';
import { getRoles, createRole } from '../controllers/RoleController.js';
import { protect } from '@smarterp/shared/middlewares/authMiddleware.js';
const router = express.Router();
router.get('/', protect, getRoles);
router.post('/', protect, createRole);
export default router;
