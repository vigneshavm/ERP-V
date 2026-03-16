import express from 'express';
import adminController from '../controllers/AdminController.js';
import { protect, authorize } from '@smarterp/shared/middlewares/authMiddleware.js';
const router = express.Router();
/**
 * All routes in this file are protected and restricted to superadmins
 */
router.use(protect);
router.use(authorize('superadmin'));
router.get('/users', adminController.getAllUsersAcrossTenants);
export default router;
