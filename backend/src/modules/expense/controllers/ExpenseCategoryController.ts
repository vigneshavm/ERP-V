import { Response } from 'express';
import { error } from '../../../config/logger.js';
import { AuthenticatedRequest } from '../../../middlewares/authMiddleware.js';
import {
    listExpenseCategories,
} from '../../../integrations/textilesoft/erpExpenseCategory.js';

export const getAllCategories = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        res.status(200).json({ categories: await listExpenseCategories() });
    } catch (err) {
        error(`Get SQL expense categories failed: ${(err as Error).message}`);
        res.status(500).json({ message: 'Server Error', error: (err as Error).message });
    }
};

const unavailable = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
    res.status(503).json({ success: false, code: 'SQL_EXPENSE_CATEGORY_WRITE_UNAVAILABLE', message: 'Maintain expense names and groups through the existing Textilesoft masters; budgets and approval rules are not stored there.' });
};

export const createCategory = unavailable;
export const updateCategory = unavailable;
export const deleteCategory = unavailable;

export default { getAllCategories, createCategory, updateCategory, deleteCategory };
