import { Router, Response, NextFunction } from 'express';
import { body, param } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { authenticate, paginate, buildPage, validate } from '../../middleware/index';
import { AuthRequest } from '../../types';

const router = Router();
router.use(authenticate);

// ─── Anomaly detection (mirrors frontend checkAnomaly logic) ──────────────────
async function detectAnomaly(userId: string, categoryId: string, amount: number) {
  const result = await db.query<{ amount: number }>(
    `SELECT amount FROM transactions
     WHERE user_id = $1 AND category_id = $2 AND type = 'expense'
     ORDER BY created_at DESC LIMIT 5`,
    [userId, categoryId]
  );
  if (result.rows.length < 3) return { isAnomaly: false };
  const avg = result.rows.reduce((s, r) => s + Number(r.amount), 0) / result.rows.length;
  if (amount > avg * 3) {
    return { isAnomaly: true, reason: `This spend is more than 3× your average (${avg.toFixed(0)}) for this category` };
  }
  return { isAnomaly: false };
}

// ═══════════════════════════════════════════════════════════════════
// CATEGORIES
// ═══════════════════════════════════════════════════════════════════

/**
 * GET /api/v1/expenses/categories
 * List all user's categories with current month spend.
 */
router.get('/categories', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await db.query(
      `SELECT
         c.id, c.name, c.icon, c.emoji, c.color, c.type, c.limit_amount AS "limit",
         COALESCE(SUM(t.amount) FILTER (
           WHERE t.type = 'expense'
             AND EXTRACT(MONTH FROM t.date::date) = EXTRACT(MONTH FROM NOW())
             AND EXTRACT(YEAR  FROM t.date::date) = EXTRACT(YEAR  FROM NOW())
         ), 0) AS value,
         COALESCE(SUM(t.amount) FILTER (
           WHERE t.type = 'expense'
             AND EXTRACT(MONTH FROM t.date::date) = EXTRACT(MONTH FROM NOW())
             AND EXTRACT(YEAR  FROM t.date::date) = EXTRACT(YEAR  FROM NOW())
         ), 0) > c.limit_amount AS over
       FROM categories c
       LEFT JOIN transactions t ON t.category_id = c.id AND t.user_id = c.user_id
       WHERE c.user_id = $1
       GROUP BY c.id
       ORDER BY c.type, c.name`,
      [req.user!.sub]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

/**
 * POST /api/v1/expenses/categories
 */
router.post('/categories',
  validate([
    body('name').trim().notEmpty(),
    body('color').matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Valid hex color required'),
    body('icon').notEmpty(),
    body('limit').isFloat({ min: 0 }),
    body('type').optional().isIn(['expense', 'income']),
  ]),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { name, icon, emoji, color, limit, type = 'expense' } = req.body;
      const result = await db.query(
        `INSERT INTO categories (id, user_id, name, icon, emoji, color, type, value, limit_amount, over)
         VALUES ($1,$2,$3,$4,$5,$6,$7,0,$8,false) RETURNING *`,
        [uuidv4(), req.user!.sub, name, icon, emoji || icon, color, type, limit]
      );
      res.status(201).json({ success: true, data: result.rows[0] });
    } catch (err) { next(err); }
  }
);

/**
 * PATCH /api/v1/expenses/categories/:id
 */
router.patch('/categories/:id',
  validate([
    param('id').isUUID(),
    body('name').optional().trim().notEmpty(),
    body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/),
    body('limit').optional().isFloat({ min: 0 }),
  ]),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const fields: string[] = []; const params: unknown[] = [];
      const set = (col: string, val: unknown) => { params.push(val); fields.push(`${col} = $${params.length}`); };
      if (req.body.name !== undefined) set('name', req.body.name);
      if (req.body.icon !== undefined) set('icon', req.body.icon);
      if (req.body.emoji !== undefined) set('emoji', req.body.emoji);
      if (req.body.color !== undefined) set('color', req.body.color);
      if (req.body.limit !== undefined) set('limit_amount', req.body.limit);
      if (!fields.length) throw AppError.badRequest('No fields to update');
      params.push(req.params.id, req.user!.sub);
      const result = await db.query(
        `UPDATE categories SET ${fields.join(', ')} WHERE id = $${params.length - 1} AND user_id = $${params.length} RETURNING *`,
        params
      );
      if (!result.rows[0]) throw AppError.notFound('Category not found');
      res.json({ success: true, data: result.rows[0] });
    } catch (err) { next(err); }
  }
);

/**
 * DELETE /api/v1/expenses/categories/:id
 */
router.delete('/categories/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await db.transaction(async (client) => {
      // Re-assign transactions to "Others" category or null before deleting
      await client.query(
        'UPDATE transactions SET category_id = NULL WHERE category_id = $1 AND user_id = $2',
        [req.params.id, req.user!.sub]
      );
      const result = await client.query(
        'DELETE FROM categories WHERE id = $1 AND user_id = $2', [req.params.id, req.user!.sub]
      );
      if (!result.rowCount) throw AppError.notFound('Category not found');
    });
    res.json({ success: true, message: 'Category deleted' });
  } catch (err) { next(err); }
});

// ═══════════════════════════════════════════════════════════════════
// TRANSACTIONS (expense/income entries)
// ═══════════════════════════════════════════════════════════════════

/**
 * GET /api/v1/expenses
 * List transactions with category + date filters + pagination.
 */
router.get('/', paginate(30), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const p = (req as any).pagination;
    const params: unknown[] = [req.user!.sub];
    const conds = ['t.user_id = $1'];

    if (req.query.categoryId) { params.push(req.query.categoryId); conds.push(`t.category_id = $${params.length}`); }
    if (req.query.type) { params.push(req.query.type); conds.push(`t.type = $${params.length}`); }
    if (req.query.from) { params.push(req.query.from); conds.push(`t.date >= $${params.length}`); }
    if (req.query.to) { params.push(req.query.to); conds.push(`t.date <= $${params.length}`); }
    if (req.query.anomaly === 'true') conds.push('t.is_anomaly = true');
    if (p.search) { params.push(`%${p.search}%`); conds.push(`(t.name ILIKE $${params.length} OR t.notes ILIKE $${params.length})`); }

    const where = conds.join(' AND ');
    const countR = await db.query<{ count: string }>(`SELECT COUNT(*) FROM transactions t WHERE ${where}`, params);
    params.push(p.limit, p.offset);
    const dataR = await db.query(
      `SELECT t.*, c.name AS category_name, c.color AS category_color, c.icon AS category_icon
       FROM transactions t
       LEFT JOIN categories c ON c.id = t.category_id
       WHERE ${where}
       ORDER BY t.date DESC, t.time DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    res.json({ success: true, ...buildPage(dataR.rows, Number(countR.rows[0].count), p) });
  } catch (err) { next(err); }
});

/**
 * POST /api/v1/expenses
 * Record a new expense or income transaction. Runs anomaly detection.
 */
router.post('/',
  validate([
    body('amount').isFloat({ gt: 0 }),
    body('categoryId').isUUID(),
    body('name').trim().notEmpty(),
    body('type').optional().isIn(['expense', 'income']),
    body('date').optional().isISO8601(),
    body('paymentMethod').optional().isIn(['cash', 'card', 'upi', 'bank_transfer', 'other']),
  ]),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const uid = req.user!.sub;
      const { amount, categoryId, name, notes, type = 'expense', date, time, paymentMethod, accountId } = req.body;
      const txnDate = date || new Date().toISOString().split('T')[0];
      const txnTime = time || new Date().toTimeString().slice(0, 5);
      const id = uuidv4();

      const anomaly = type === 'expense' ? await detectAnomaly(uid, categoryId, amount) : { isAnomaly: false };

      await db.transaction(async (client) => {
        await client.query(
          `INSERT INTO transactions (id, user_id, category_id, name, amount, type, date, time, notes, is_anomaly, anomaly_reason, payment_method, account_id)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
          [id, uid, categoryId, name, amount, type, txnDate, txnTime, notes, anomaly.isAnomaly, (anomaly as any).reason || null, paymentMethod || null, accountId || null]
        );

        // Update monthly_summaries aggregate
        const monthDate = txnDate.slice(0, 7) + '-01';
        await client.query(
          `INSERT INTO monthly_summaries (user_id, month_date, total_income, total_expense, budget_total)
           VALUES ($1, $2, 0, 0, 0)
           ON CONFLICT (user_id, month_date) DO NOTHING`,
          [uid, monthDate]
        );
        if (type === 'expense') {
          await client.query(
            'UPDATE monthly_summaries SET total_expense = total_expense + $1 WHERE user_id = $2 AND month_date = $3',
            [amount, uid, monthDate]
          );
          // Update user wealth
          await client.query('UPDATE users SET total_wealth = total_wealth - $1 WHERE id = $2', [amount, uid]);
          // Update budget item spent
          await client.query(
            `UPDATE budget_items bi
             SET spent = spent + $1, overspent = (spent + $1 > bi.total_amount)
             FROM budgets b
             WHERE bi.budget_id = b.id AND b.user_id = $2 AND bi.category_id = $3
               AND b.month = $4`,
            [amount, uid, categoryId, txnDate.slice(0, 7)]
          );
        } else {
          await client.query(
            'UPDATE monthly_summaries SET total_income = total_income + $1 WHERE user_id = $2 AND month_date = $3',
            [amount, uid, monthDate]
          );
          await client.query('UPDATE users SET total_wealth = total_wealth + $1 WHERE id = $2', [amount, uid]);
        }

        // Auto-create anomaly notification
        if (anomaly.isAnomaly) {
          await client.query(
            `INSERT INTO notifications (id, user_id, type, title, message, amount, icon, color, read)
             VALUES ($1,$2,'warning','Unusual Spend Detected',$3,$4,'AlertTriangle','#FF9500',false)`,
            [uuidv4(), uid, (anomaly as any).reason, amount]
          );
        }
      });

      res.status(201).json({ success: true, data: { id, isAnomaly: anomaly.isAnomaly, anomalyReason: (anomaly as any).reason } });
    } catch (err) { next(err); }
  }
);

/**
 * GET /api/v1/expenses/:id
 */
router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await db.query(
      `SELECT t.*, c.name AS category_name, c.color AS category_color, c.icon AS category_icon
       FROM transactions t LEFT JOIN categories c ON c.id = t.category_id
       WHERE t.id = $1 AND t.user_id = $2`,
      [req.params.id, req.user!.sub]
    );
    if (!result.rows[0]) throw AppError.notFound('Transaction not found');
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

/**
 * PATCH /api/v1/expenses/:id  — edit notes, name, category
 */
router.patch('/:id',
  validate([
    param('id').isUUID(),
    body('name').optional().trim().notEmpty(),
    body('notes').optional(),
    body('categoryId').optional().isUUID(),
  ]),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const fields: string[] = []; const params: unknown[] = [];
      const set = (col: string, val: unknown) => { params.push(val); fields.push(`${col} = $${params.length}`); };
      if (req.body.name) set('name', req.body.name);
      if (req.body.notes !== undefined) set('notes', req.body.notes);
      if (req.body.categoryId) set('category_id', req.body.categoryId);
      if (!fields.length) throw AppError.badRequest('No fields to update');
      params.push(req.params.id, req.user!.sub);
      const r = await db.query(`UPDATE transactions SET ${fields.join(', ')} WHERE id = $${params.length - 1} AND user_id = $${params.length} RETURNING *`, params);
      if (!r.rows[0]) throw AppError.notFound('Transaction not found');
      res.json({ success: true, data: r.rows[0] });
    } catch (err) { next(err); }
  }
);

/**
 * DELETE /api/v1/expenses/:id  — delete and reverse wealth/budget impact
 */
router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await db.transaction(async (client) => {
      const txn = await client.query<{ amount: number; type: string; category_id: string; date: string }>(
        'SELECT amount, type, category_id, date FROM transactions WHERE id = $1 AND user_id = $2',
        [req.params.id, req.user!.sub]
      );
      if (!txn.rows[0]) throw AppError.notFound('Transaction not found');
      const { amount, type, category_id, date } = txn.rows[0];
      const monthDate = date.slice(0, 7) + '-01';

      await client.query('DELETE FROM transactions WHERE id = $1', [req.params.id]);
      if (type === 'expense') {
        await client.query('UPDATE users SET total_wealth = total_wealth + $1 WHERE id = $2', [amount, req.user!.sub]);
        await client.query('UPDATE monthly_summaries SET total_expense = total_expense - $1 WHERE user_id = $2 AND month_date = $3', [amount, req.user!.sub, monthDate]);
      } else {
        await client.query('UPDATE users SET total_wealth = total_wealth - $1 WHERE id = $2', [amount, req.user!.sub]);
        await client.query('UPDATE monthly_summaries SET total_income = total_income - $1 WHERE user_id = $2 AND month_date = $3', [amount, req.user!.sub, monthDate]);
      }
    });
    res.json({ success: true, message: 'Transaction deleted' });
  } catch (err) { next(err); }
});

/**
 * POST /api/v1/expenses/bulk/delete
 */
router.post('/bulk/delete',
  validate([body('ids').isArray({ min: 1 }), body('ids.*').isUUID()]),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { ids } = req.body;
      await db.transaction(async (client) => {
        const txns = await client.query<{ id: string; amount: number; type: string; date: string }>(
          `SELECT id, amount, type, date FROM transactions WHERE id = ANY($1) AND user_id = $2`,
          [ids, req.user!.sub]
        );
        for (const t of txns.rows) {
          const monthDate = t.date.slice(0, 7) + '-01';
          await client.query('DELETE FROM transactions WHERE id = $1', [t.id]);
          if (t.type === 'expense') {
            await client.query('UPDATE users SET total_wealth = total_wealth + $1 WHERE id = $2', [t.amount, req.user!.sub]);
            await client.query('UPDATE monthly_summaries SET total_expense = GREATEST(0, total_expense - $1) WHERE user_id = $2 AND month_date = $3', [t.amount, req.user!.sub, monthDate]);
          }
        }
      });
      res.json({ success: true, message: `${ids.length} transactions deleted` });
    } catch (err) { next(err); }
  }
);

/**
 * POST /api/v1/expenses/bulk/recategorize
 * Move a list of transactions to a new category.
 */
router.post('/bulk/recategorize',
  validate([body('ids').isArray({ min: 1 }), body('targetCategoryId').isUUID()]),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { ids, targetCategoryId } = req.body;
      await db.query(
        `UPDATE transactions SET category_id = $1 WHERE id = ANY($2) AND user_id = $3`,
        [targetCategoryId, ids, req.user!.sub]
      );
      res.json({ success: true, message: `${ids.length} transactions recategorized` });
    } catch (err) { next(err); }
  }
);

/**
 * POST /api/v1/expenses/:id/dispute
 * Dispute / reverse a transaction (removes it and restores wealth).
 */
router.post('/:id/dispute', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await db.transaction(async (client) => {
      const txn = await client.query<{ amount: number; type: string; date: string }>(
        'SELECT amount, type, date FROM transactions WHERE id = $1 AND user_id = $2',
        [req.params.id, req.user!.sub]
      );
      if (!txn.rows[0]) throw AppError.notFound('Transaction not found');
      const { amount, type, date } = txn.rows[0];
      const monthDate = date.slice(0, 7) + '-01';
      await client.query('UPDATE transactions SET disputed = true WHERE id = $1', [req.params.id]);
      // Reverse impact
      if (type === 'expense') {
        await client.query('UPDATE users SET total_wealth = total_wealth + $1 WHERE id = $2', [amount, req.user!.sub]);
        await client.query('UPDATE monthly_summaries SET total_expense = GREATEST(0, total_expense - $1) WHERE user_id = $2 AND month_date = $3', [amount, req.user!.sub, monthDate]);
      }
    });
    res.json({ success: true, message: 'Transaction disputed and impact reversed' });
  } catch (err) { next(err); }
});

/**
 * GET /api/v1/expenses/history/summary
 * Expense history breakdown by category for the current month.
 */
router.get('/history/summary', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const month = (req.query.month as string) || new Date().toISOString().slice(0, 7);
    const result = await db.query(
      `SELECT
         c.name, c.color,
         SUM(t.amount) AS value
       FROM transactions t
       JOIN categories c ON c.id = t.category_id
       WHERE t.user_id = $1 AND t.type = 'expense'
         AND TO_CHAR(t.date::date, 'YYYY-MM') = $2
       GROUP BY c.id, c.name, c.color
       ORDER BY value DESC`,
      [req.user!.sub, month]
    );
    const total = result.rows.reduce((s, r) => s + Number(r.value), 0);
    const dailyTrend = await db.query(
      `SELECT TO_CHAR(date::date, 'Dy') AS day, SUM(amount) AS amount
       FROM transactions
       WHERE user_id = $1 AND type = 'expense'
         AND date::date >= date_trunc('week', NOW())
       GROUP BY date::date
       ORDER BY date::date`,
      [req.user!.sub]
    );
    res.json({ success: true, data: { totalSpent: total, month, categories: result.rows, dailyTrend: dailyTrend.rows } });
  } catch (err) { next(err); }
});

/**
 * GET /api/v1/expenses/anomaly/check?categoryId=&amount=
 * Pre-check whether a transaction would be flagged as anomaly.
 */
router.get('/anomaly/check', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { categoryId, amount } = req.query as { categoryId: string; amount: string };
    if (!categoryId || !amount) throw AppError.badRequest('categoryId and amount are required');
    const result = await detectAnomaly(req.user!.sub, categoryId, Number(amount));
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

export default router;
