import { Router, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { authenticate, validate } from '../../middleware/index';
import { AuthRequest } from '../../types';

const router = Router();
router.use(authenticate);

/**
 * GET /api/v1/budget?month=YYYY-MM
 * Returns the budget for the given month including all line items with live spend.
 */
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const month = (req.query.month as string) || new Date().toISOString().slice(0, 7);
    const uid = req.user!.sub;

    let budget = await db.query(
      'SELECT * FROM budgets WHERE user_id = $1 AND month = $2', [uid, month]
    );

    // Auto-create budget for the month if missing
    if (!budget.rows[0]) {
      const id = uuidv4();
      await db.query(
        `INSERT INTO budgets (id, user_id, month, total_amount, mode) VALUES ($1,$2,$3,0,'flexible')`,
        [id, uid, month]
      );
      budget = await db.query('SELECT * FROM budgets WHERE id = $1', [id]);
    }

    const items = await db.query(
      `SELECT
         bi.id, bi.category_id, bi.total_amount AS total, bi.spent, bi.overspent,
         c.name, c.icon, c.color
       FROM budget_items bi
       JOIN categories c ON c.id = bi.category_id
       WHERE bi.budget_id = $1
       ORDER BY c.name`,
      [budget.rows[0].id]
    );

    res.json({
      success: true,
      data: {
        id: budget.rows[0].id,
        month,
        total: Number(budget.rows[0].total_amount),
        mode: budget.rows[0].mode,
        items: items.rows,
      },
    });
  } catch (err) { next(err); }
});

/**
 * PATCH /api/v1/budget/mode
 * Switch between zero-based and flexible budgeting.
 */
router.patch('/mode',
  validate([body('mode').isIn(['zero-based', 'flexible']), body('month').optional().isISO8601()]),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const month = req.body.month || new Date().toISOString().slice(0, 7);
      await db.query(
        'UPDATE budgets SET mode = $1 WHERE user_id = $2 AND month = $3', [req.body.mode, req.user!.sub, month]
      );
      res.json({ success: true, message: `Budget mode set to ${req.body.mode}` });
    } catch (err) { next(err); }
  }
);

/**
 * PUT /api/v1/budget/items/:categoryId
 * Set or update the budget allocation for a category in the current month.
 */
router.put('/items/:categoryId',
  validate([body('amount').isFloat({ min: 0 }), body('month').optional()]),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const month = req.body.month || new Date().toISOString().slice(0, 7);
      const { categoryId } = req.params;
      const { amount } = req.body;

      const budget = await db.query<{ id: string }>(
        'SELECT id FROM budgets WHERE user_id = $1 AND month = $2', [req.user!.sub, month]
      );
      if (!budget.rows[0]) throw AppError.notFound('Budget not found for this month');

      // Upsert budget item
      await db.query(
        `INSERT INTO budget_items (id, budget_id, category_id, total_amount, spent, overspent)
         VALUES ($1,$2,$3,$4,
           COALESCE((SELECT spent FROM budget_items WHERE budget_id = $2 AND category_id = $3), 0),
           false)
         ON CONFLICT (budget_id, category_id)
         DO UPDATE SET total_amount = $4, overspent = (budget_items.spent > $4)`,
        [uuidv4(), budget.rows[0].id, categoryId, amount]
      );

      // Recalculate budget total
      await db.query(
        `UPDATE budgets SET total_amount = (
           SELECT COALESCE(SUM(total_amount), 0) FROM budget_items WHERE budget_id = $1
         ) WHERE id = $1`,
        [budget.rows[0].id]
      );

      res.json({ success: true, message: 'Budget item updated' });
    } catch (err) { next(err); }
  }
);

/**
 * DELETE /api/v1/budget/items/:categoryId
 */
router.delete('/items/:categoryId', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const month = (req.query.month as string) || new Date().toISOString().slice(0, 7);
    const budget = await db.query<{ id: string }>(
      'SELECT id FROM budgets WHERE user_id = $1 AND month = $2', [req.user!.sub, month]
    );
    if (!budget.rows[0]) throw AppError.notFound('Budget not found');
    await db.query('DELETE FROM budget_items WHERE budget_id = $1 AND category_id = $2', [budget.rows[0].id, req.params.categoryId]);
    res.json({ success: true, message: 'Budget item removed' });
  } catch (err) { next(err); }
});

export default router;
