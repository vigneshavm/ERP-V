import express from 'express';
import { protect } from '@smarterp/shared/middlewares/authMiddleware.js';
import expenseRoutes from './expenseRoutes.js';
import expenseCategoryRoutes from './expenseCategoryRoutes.js';
import recurringExpenseRoutes from './recurringExpenseRoutes.js';
import expenseReportRoutes from './expenseReportRoutes.js';
import personalTransactionRoutes from './personalTransactionRoutes.js';

const router = express.Router();

import { getHistory } from '../controllers/ExpenseReportController.js';
router.use('/expenses', expenseRoutes);
router.use('/categories', expenseCategoryRoutes);
router.use('/recurring-expenses', recurringExpenseRoutes);
router.use('/expense-reports', expenseReportRoutes);
router.use('/transactions', personalTransactionRoutes);
router.get('/history', protect, getHistory);

export default router;
