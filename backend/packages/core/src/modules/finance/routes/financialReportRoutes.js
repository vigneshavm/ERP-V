import express from 'express';
import { protect } from '@smarterp/shared/middlewares/authMiddleware.js';
import { getTrialBalance, getProfitAndLoss, getBalanceSheet } from '../controllers/FinancialReportController.js';
const router = express.Router();
router.get('/trial-balance', protect, getTrialBalance);
router.get('/profit-loss', protect, getProfitAndLoss);
router.get('/balance-sheet', protect, getBalanceSheet);
export default router;
