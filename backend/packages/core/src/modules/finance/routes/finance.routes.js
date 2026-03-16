import express from 'express';
import billRoutes from './billRoutes.js';
import cashBankRoutes from './cashBankRoutes.js';
import dueRoutes from './dueRoutes.js';
import loyaltyRoutes from './loyaltyRoutes.js';
import dayEndRoutes from './dayEndRoutes.js';
import accountRoutes from './accountRoutes.js';
import financialReportRoutes from './financialReportRoutes.js';
const router = express.Router();
router.use('/bills', billRoutes);
router.use('/cashbank', cashBankRoutes);
router.use('/due', dueRoutes);
router.use('/loyalty', loyaltyRoutes);
router.use('/day-end', dayEndRoutes);
router.use('/accounts', accountRoutes);
// Bank Statement
import bankStatementRoutes from './bankStatementRoutes.js';
router.use('/bank-statement', bankStatementRoutes);
// Loans
import loanRoutes from './loanRoutes.js';
router.use('/loans', loanRoutes);
// Daily Finance (Sync)
import { getAllDailyFinance } from '../controllers/CashBankController.js';
import { protect } from '@smarterp/shared/middlewares/authMiddleware.js';
router.get('/daily-finance', protect, getAllDailyFinance);
// Mount Journal Entry routes
import journalEntryRoutes from './journalEntryRoutes.js';
router.use('/journal', journalEntryRoutes);
// Mount Clearing Parameter routes
import clearingParameterRoutes from './clearingParameterRoutes.js';
router.use('/clearing', clearingParameterRoutes);
router.use('/reports', financialReportRoutes);
export default router;
