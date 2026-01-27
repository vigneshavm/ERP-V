import express from 'express';
import billRoutes from './billRoutes.js';
import cashBankRoutes from './cashBankRoutes.js';
import dueRoutes from './dueRoutes.js';
import loyaltyRoutes from './loyaltyRoutes.js';
import dayEndRoutes from './dayEndRoutes.js';

const router = express.Router();

router.use('/bills', billRoutes);
router.use('/cashbank', cashBankRoutes);
router.use('/due', dueRoutes);
router.use('/loyalty', loyaltyRoutes);
router.use('/day-end', dayEndRoutes);

export default router;
