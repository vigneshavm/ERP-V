import express from 'express';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import businessRoutes from './businessRoutes.js';
import healthRoutes from './healthRoutes.js';
import refreshTokenRoutes from './refreshTokenRoutes.js';
import reportRoutes from './reportRoutes.js';
import settingsRoutes from './settingsRoutes.js';
import shopRoutes from './shopRoutes.js';
import branchRoutes from './branchRoutes.js';
import subscriptionPlanRoutes from './subscriptionPlanRoutes.js';
import auditLogRoutes from './auditLogRoutes.js';
import adminRoutes from './adminRoutes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/business', businessRoutes);
router.use('/health', healthRoutes);
router.use('/refresh-token', refreshTokenRoutes);
router.use('/reports', reportRoutes);
router.use('/settings', settingsRoutes);
router.use('/shop', shopRoutes);
router.use('/branches', branchRoutes);
router.use('/subscription-plans', subscriptionPlanRoutes);
router.use('/audit-logs', auditLogRoutes);
router.use('/admin', adminRoutes);


export default router;
