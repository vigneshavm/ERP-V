import { Response } from 'express';
import { error } from '../../../config/logger.js';
import { AuthenticatedRequest } from '../../../middlewares/authMiddleware.js';
import {
    findSqlExpense,
    listSqlExpenses,
} from '../../../integrations/textilesoft/sqlExpenses.js';

/** Expenses use the existing dbo.expenseentry table. Receipt, user, tenant and payment-account data are not represented there. */
export const getAllExpenses = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        res.status(200).json(await listSqlExpenses());
    } catch (err) {
        error(`Get all SQL expenses failed: ${(err as Error).message}`);
        res.status(500).json({ message: 'Server Error', error: (err as Error).message });
    }
};

export const createExpense = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
    res.status(503).json({ success: false, code: 'SQL_EXPENSE_ENTRY_UNAVAILABLE', message: 'The existing SQL expense fields do not support a verified entry lifecycle.' });
};

export const getExpenseById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const expense = await findSqlExpense(String(req.params.id));
        if (!expense) {
            res.status(404).json({ message: 'Expense not found' });
            return;
        }
        res.status(200).json(expense);
    } catch (err) {
        error(`Get SQL expense failed: ${(err as Error).message}`);
        res.status(500).json({ message: 'Server Error', error: (err as Error).message });
    }
};

export const updateExpense = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
    res.status(503).json({ success: false, code: 'SQL_EXPENSE_ENTRY_UNAVAILABLE', message: 'The existing SQL expense fields do not support a verified entry lifecycle.' });
};

export const deleteExpense = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
    res.status(503).json({ success: false, code: 'SQL_EXPENSE_ENTRY_UNAVAILABLE', message: 'The existing SQL expense fields do not support a verified entry lifecycle.' });
};

export default { getAllExpenses, createExpense, getExpenseById, updateExpense, deleteExpense };
