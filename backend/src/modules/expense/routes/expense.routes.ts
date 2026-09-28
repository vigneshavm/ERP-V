import express from 'express';
import expenseMain from './expenseMain.routes.js';
import expenseCategory from './expenseCategory.routes.js';
import recurringExpense from './recurringExpense.routes.js';
import expenseReport from './expenseReport.routes.js';

const router = express.Router();

router.use('/expenses', expenseMain);
router.use('/expense-categories', expenseCategory);
router.use('/recurring-expenses', recurringExpense);
router.use('/expense-reports', expenseReport);

export default router;
