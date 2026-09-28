import express from 'express';
import adminController from '../controllers/AdminController.js';
import { protect, authorize } from '../../../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * All routes in this file are protected and restricted to superadmins
 */
router.use(protect);
router.use(authorize('superadmin'));

router.get('/session', adminController.getSession);
router.get('/users', adminController.getAllUsersAcrossTenants);
router.get('/tenants', adminController.getTenants);
router.patch('/tenants/:id/status', adminController.updateTenantStatus);

export default router;
