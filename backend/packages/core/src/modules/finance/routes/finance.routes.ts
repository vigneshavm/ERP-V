import express from 'express';
import billRoutes from './billRoutes.js';
import cashBankRoutes from './cashBankRoutes.js';
import dueRoutes from './dueRoutes.js';
import loyaltyRoutes from './loyaltyRoutes.js';
import dayEndRoutes from './dayEndRoutes.js';
import accountRoutes from './accountRoutes.js';
import financialReportRoutes from './financialReportRoutes.js';
import bankStatementRoutes from './bankStatementRoutes.js';
import loanRoutes from './loanRoutes.js';
import { getAllDailyFinance } from '../controllers/CashBankController.js';
import { protect } from '@smarterp/shared/middlewares/authMiddleware.js';
import journalEntryRoutes from './journalEntryRoutes.js';
import clearingParameterRoutes from './clearingParameterRoutes.js';

const router = express.Router();

router.use('/bills', billRoutes);
router.use('/cash-banks', cashBankRoutes);
router.use('/dues', dueRoutes);
router.use('/loyalty-points', loyaltyRoutes);
router.use('/day-ends', dayEndRoutes);
router.use('/accounts', accountRoutes);
router.use('/bank-statements', bankStatementRoutes);
router.use('/loans', loanRoutes);

router.get('/daily-finances', protect, getAllDailyFinance);
router.use('/journal-entries', journalEntryRoutes);
router.use('/clearings', clearingParameterRoutes);
router.use('/reports', financialReportRoutes);

export default router;
