import express from 'express';
import expenseRoutes from './expenseRoutes.js';
import expenseCategoryRoutes from './expenseCategoryRoutes.js';
import recurringExpenseRoutes from './recurringExpenseRoutes.js';
import expenseReportRoutes from './expenseReportRoutes.js';

const router = express.Router();

router.use('/expenses', expenseRoutes);
router.use('/expense-categories', expenseCategoryRoutes);
router.use('/recurring-expenses', recurringExpenseRoutes);
router.use('/expense-reports', expenseReportRoutes);

export default router;
