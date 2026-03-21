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
import journalEntryRoutes from './journalEntryRoutes.js';
import clearingParameterRoutes from './clearingParameterRoutes.js';
import { getAllDailyFinance } from '../controllers/CashBankController.js';
import { protect } from '@smarterp/shared/middlewares/authMiddleware.js';
const router = express.Router();
router.use('/bills', billRoutes);
// /cash-bank (singular compound noun) replaces /cash-banks
router.use('/cash-bank', cashBankRoutes);
router.use('/dues', dueRoutes);
router.use('/loyalty-points', loyaltyRoutes);
// /day-end (singular compound noun) replaces /day-ends
router.use('/day-end', dayEndRoutes);
router.use('/accounts', accountRoutes);
router.use('/bank-statements', bankStatementRoutes);
router.use('/loans', loanRoutes);
router.use('/journal-entries', journalEntryRoutes);
// /clearing-parameters replaces /clearings — descriptive and unambiguous
router.use('/clearing-parameters', clearingParameterRoutes);
router.use('/reports', financialReportRoutes);
// GET /reports/daily replaces GET /daily-finances — consistent with other report routes
router.get('/reports/daily', protect, getAllDailyFinance);
export default router;
