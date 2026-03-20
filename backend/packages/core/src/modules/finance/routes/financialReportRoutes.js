import express from 'express';
import { protect } from '@smarterp/shared/middlewares/authMiddleware.js';
import FinancialReportController from '../controllers/FinancialReportController.js';
const router = express.Router();
router.get('/trial-balance', protect, FinancialReportController.getTrialBalance);
router.get('/profit-loss', protect, FinancialReportController.getProfitAndLoss);
router.get('/balance-sheet', protect, FinancialReportController.getBalanceSheet);
router.get('/cashflow', protect, FinancialReportController.getCashFlow);
export default router;
