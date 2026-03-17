import { Router, Response, NextFunction } from 'express';
import { body, param } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { authenticate, validate } from '../middleware/index';
import { AuthRequest } from '../types';

// ═══════════════════════════════════════════════════════════════════
// GOALS  /api/v1/goals
// ═══════════════════════════════════════════════════════════════════
export const goalsRouter = Router();
goalsRouter.use(authenticate);

goalsRouter.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const r = await db.query('SELECT * FROM goals WHERE user_id = $1 ORDER BY deadline ASC', [req.user!.sub]);
    res.json({ success: true, data: r.rows });
  } catch (err) { next(err); }
});

goalsRouter.post('/',
  validate([
    body('name').trim().notEmpty(),
    body('target').isFloat({ gt: 0 }),
    body('current').optional().isFloat({ min: 0 }),
    body('deadline').isISO8601(),
    body('icon').notEmpty(),
    body('color').matches(/^#[0-9A-Fa-f]{6}$/),
  ]),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { name, target, current = 0, icon, color, deadline } = req.body;
      const dailyNudge = (target - current) / Math.max(1, Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000));
      const r = await db.query(
        `INSERT INTO goals (id, user_id, name, target, current, icon, color, deadline, daily_nudge)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
        [uuidv4(), req.user!.sub, name, target, current, icon, color, deadline, Math.max(0, dailyNudge)]
      );
      res.status(201).json({ success: true, data: r.rows[0] });
    } catch (err) { next(err); }
  }
);

goalsRouter.patch('/:id/progress',
  validate([param('id').isUUID(), body('current').isFloat({ min: 0 })]),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const r = await db.query(
        'UPDATE goals SET current = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
        [req.body.current, req.params.id, req.user!.sub]
      );
      if (!r.rows[0]) throw AppError.notFound('Goal not found');
      res.json({ success: true, data: r.rows[0] });
    } catch (err) { next(err); }
  }
);

goalsRouter.patch('/:id',
  validate([param('id').isUUID()]),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const fields: string[] = []; const params: unknown[] = [];
      const set = (col: string, val: unknown) => { params.push(val); fields.push(`${col} = $${params.length}`); };
      if (req.body.name) set('name', req.body.name);
      if (req.body.target) set('target', req.body.target);
      if (req.body.icon) set('icon', req.body.icon);
      if (req.body.color) set('color', req.body.color);
      if (req.body.deadline) set('deadline', req.body.deadline);
      if (!fields.length) throw AppError.badRequest('No fields to update');
      params.push(req.params.id, req.user!.sub);
      const r = await db.query(`UPDATE goals SET ${fields.join(', ')} WHERE id = $${params.length - 1} AND user_id = $${params.length} RETURNING *`, params);
      if (!r.rows[0]) throw AppError.notFound('Goal not found');
      res.json({ success: true, data: r.rows[0] });
    } catch (err) { next(err); }
  }
);

goalsRouter.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const r = await db.query('DELETE FROM goals WHERE id = $1 AND user_id = $2', [req.params.id, req.user!.sub]);
    if (!r.rowCount) throw AppError.notFound('Goal not found');
    res.json({ success: true, message: 'Goal deleted' });
  } catch (err) { next(err); }
});

// ═══════════════════════════════════════════════════════════════════
// LOANS  /api/v1/loans
// ═══════════════════════════════════════════════════════════════════
export const loansRouter = Router();
loansRouter.use(authenticate);

loansRouter.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const r = await db.query('SELECT * FROM loans WHERE user_id = $1 ORDER BY deadline ASC', [req.user!.sub]);
    res.json({ success: true, data: r.rows });
  } catch (err) { next(err); }
});

loansRouter.post('/',
  validate([
    body('name').trim().notEmpty(),
    body('bank').trim().notEmpty(),
    body('total').isFloat({ gt: 0 }),
    body('current').optional().isFloat({ min: 0 }),
    body('interestRate').isFloat({ min: 0 }),
    body('tenureMonths').isInt({ gt: 0 }),
    body('type').isIn(['Borrowed', 'Lent']),
    body('deadline').isISO8601(),
    body('icon').notEmpty(),
    body('color').matches(/^#[0-9A-Fa-f]{6}$/),
  ]),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { name, bank, total, current = 0, interestRate, tenureMonths, type, deadline, icon, color } = req.body;
      const r = await db.query(
        `INSERT INTO loans (id, user_id, name, bank, total, current, interest_rate, tenure_months, type, deadline, icon, color)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
        [uuidv4(), req.user!.sub, name, bank, total, current, interestRate, tenureMonths, type, deadline, icon, color]
      );
      res.status(201).json({ success: true, data: r.rows[0] });
    } catch (err) { next(err); }
  }
);

loansRouter.patch('/:id',
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const fields: string[] = []; const params: unknown[] = [];
      const set = (col: string, val: unknown) => { params.push(val); fields.push(`${col} = $${params.length}`); };
      ['name', 'bank', 'interest_rate', 'tenure_months', 'deadline', 'icon', 'color'].forEach(f => {
        const k = f.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
        if (req.body[k] !== undefined) set(f, req.body[k]);
      });
      if (!fields.length) throw AppError.badRequest('No fields to update');
      params.push(req.params.id, req.user!.sub);
      const r = await db.query(`UPDATE loans SET ${fields.join(', ')} WHERE id = $${params.length - 1} AND user_id = $${params.length} RETURNING *`, params);
      if (!r.rows[0]) throw AppError.notFound('Loan not found');
      res.json({ success: true, data: r.rows[0] });
    } catch (err) { next(err); }
  }
);

loansRouter.post('/:id/payment',
  validate([param('id').isUUID(), body('amount').isFloat({ gt: 0 })]),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await db.transaction(async (client) => {
        const loan = await client.query<{ total: number; current: number; type: string }>(
          'SELECT total, current, type FROM loans WHERE id = $1 AND user_id = $2 FOR UPDATE',
          [req.params.id, req.user!.sub]
        );
        if (!loan.rows[0]) throw AppError.notFound('Loan not found');
        const { total, current, type } = loan.rows[0];
        const newCurrent = Math.min(Number(total), Number(current) + Number(req.body.amount));
        await client.query('UPDATE loans SET current = $1 WHERE id = $2', [newCurrent, req.params.id]);
        // Affect wealth
        if (type === 'Borrowed') {
          await client.query('UPDATE users SET total_wealth = total_wealth - $1 WHERE id = $2', [req.body.amount, req.user!.sub]);
        } else {
          await client.query('UPDATE users SET total_wealth = total_wealth + $1 WHERE id = $2', [req.body.amount, req.user!.sub]);
        }
      });
      res.json({ success: true, message: 'Payment recorded' });
    } catch (err) { next(err); }
  }
);

loansRouter.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const r = await db.query('DELETE FROM loans WHERE id = $1 AND user_id = $2', [req.params.id, req.user!.sub]);
    if (!r.rowCount) throw AppError.notFound('Loan not found');
    res.json({ success: true, message: 'Loan deleted' });
  } catch (err) { next(err); }
});

// ═══════════════════════════════════════════════════════════════════
// ACCOUNTS (bank accounts / wallets)  /api/v1/accounts
// ═══════════════════════════════════════════════════════════════════
export const accountsRouter = Router();
accountsRouter.use(authenticate);

accountsRouter.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const r = await db.query('SELECT * FROM accounts WHERE user_id = $1 ORDER BY name', [req.user!.sub]);
    res.json({ success: true, data: r.rows });
  } catch (err) { next(err); }
});

accountsRouter.post('/',
  validate([
    body('name').trim().notEmpty(),
    body('type').isIn(['Savings', 'Checking', 'Current', 'Wallet']),
    body('balance').isFloat({ min: 0 }),
    body('color').matches(/^#[0-9A-Fa-f]{6}$/),
  ]),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { name, type, balance, color } = req.body;
      const r = await db.query(
        `INSERT INTO accounts (id, user_id, name, type, balance, income, expense, color, selected)
         VALUES ($1,$2,$3,$4,$5,0,0,$6,false) RETURNING *`,
        [uuidv4(), req.user!.sub, name, type, balance, color]
      );
      res.status(201).json({ success: true, data: r.rows[0] });
    } catch (err) { next(err); }
  }
);

accountsRouter.patch('/:id',
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const fields: string[] = []; const params: unknown[] = [];
      const set = (col: string, val: unknown) => { params.push(val); fields.push(`${col} = $${params.length}`); };
      if (req.body.name) set('name', req.body.name);
      if (req.body.color) set('color', req.body.color);
      if (req.body.selected !== undefined) set('selected', req.body.selected);
      if (!fields.length) throw AppError.badRequest('No fields to update');
      params.push(req.params.id, req.user!.sub);
      const r = await db.query(`UPDATE accounts SET ${fields.join(', ')} WHERE id = $${params.length - 1} AND user_id = $${params.length} RETURNING *`, params);
      if (!r.rows[0]) throw AppError.notFound('Account not found');
      res.json({ success: true, data: r.rows[0] });
    } catch (err) { next(err); }
  }
);

accountsRouter.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const r = await db.query('DELETE FROM accounts WHERE id = $1 AND user_id = $2', [req.params.id, req.user!.sub]);
    if (!r.rowCount) throw AppError.notFound('Account not found');
    res.json({ success: true, message: 'Account deleted' });
  } catch (err) { next(err); }
});

// ═══════════════════════════════════════════════════════════════════
// CREDIT CARDS  /api/v1/cards/credit
// ═══════════════════════════════════════════════════════════════════
export const cardsRouter = Router();
cardsRouter.use(authenticate);

cardsRouter.get('/credit', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const r = await db.query('SELECT * FROM credit_cards WHERE user_id = $1 ORDER BY due_date ASC', [req.user!.sub]);
    res.json({ success: true, data: r.rows });
  } catch (err) { next(err); }
});

cardsRouter.post('/credit',
  validate([
    body('bank').notEmpty(), body('cardName').notEmpty(),
    body('last4').isLength({ min: 4, max: 4 }).isNumeric(),
    body('network').isIn(['Visa', 'Mastercard', 'RuPay', 'Amex', 'Discover']),
    body('limit').isFloat({ gt: 0 }),
    body('dueDate').isISO8601(),
    body('color').matches(/^#[0-9A-Fa-f]{6}$/),
  ]),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { bank, cardName, last4, network, limit, dueDate, minDue = 0, color, gradient = '' } = req.body;
      const r = await db.query(
        `INSERT INTO credit_cards (id, user_id, bank, card_name, last4, network, card_limit, spent, due_date, min_due, color, gradient)
         VALUES ($1,$2,$3,$4,$5,$6,$7,0,$8,$9,$10,$11) RETURNING *`,
        [uuidv4(), req.user!.sub, bank, cardName, last4, network, limit, dueDate, minDue, color, gradient]
      );
      res.status(201).json({ success: true, data: r.rows[0] });
    } catch (err) { next(err); }
  }
);

cardsRouter.get('/debit', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const r = await db.query('SELECT * FROM debit_cards WHERE user_id = $1', [req.user!.sub]);
    res.json({ success: true, data: r.rows });
  } catch (err) { next(err); }
});

cardsRouter.post('/debit',
  validate([
    body('bank').notEmpty(), body('cardName').notEmpty(),
    body('last4').isLength({ min: 4, max: 4 }).isNumeric(),
    body('network').notEmpty(), body('accountId').isUUID(),
    body('color').matches(/^#[0-9A-Fa-f]{6}$/),
  ]),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { bank, cardName, last4, network, accountId, color, gradient = '' } = req.body;
      const r = await db.query(
        `INSERT INTO debit_cards (id, user_id, bank, card_name, last4, network, account_id, color, gradient)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
        [uuidv4(), req.user!.sub, bank, cardName, last4, network, accountId, color, gradient]
      );
      res.status(201).json({ success: true, data: r.rows[0] });
    } catch (err) { next(err); }
  }
);

cardsRouter.delete('/credit/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await db.query('DELETE FROM credit_cards WHERE id = $1 AND user_id = $2', [req.params.id, req.user!.sub]);
    res.json({ success: true, message: 'Credit card removed' });
  } catch (err) { next(err); }
});

cardsRouter.delete('/debit/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await db.query('DELETE FROM debit_cards WHERE id = $1 AND user_id = $2', [req.params.id, req.user!.sub]);
    res.json({ success: true, message: 'Debit card removed' });
  } catch (err) { next(err); }
});

// ═══════════════════════════════════════════════════════════════════
// NOTIFICATIONS  /api/v1/notifications
// ═══════════════════════════════════════════════════════════════════
export const notificationsRouter = Router();
notificationsRouter.use(authenticate);

notificationsRouter.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const r = await db.query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50', [req.user!.sub]
    );
    res.json({ success: true, data: r.rows });
  } catch (err) { next(err); }
});

notificationsRouter.patch('/:id/read', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await db.query('UPDATE notifications SET read = true WHERE id = $1 AND user_id = $2', [req.params.id, req.user!.sub]);
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (err) { next(err); }
});

notificationsRouter.patch('/read-all', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await db.query('UPDATE notifications SET read = true WHERE user_id = $1', [req.user!.sub]);
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) { next(err); }
});

notificationsRouter.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await db.query('DELETE FROM notifications WHERE id = $1 AND user_id = $2', [req.params.id, req.user!.sub]);
    res.json({ success: true, message: 'Notification deleted' });
  } catch (err) { next(err); }
});

// ═══════════════════════════════════════════════════════════════════
// REPORTS  /api/v1/reports
// ═══════════════════════════════════════════════════════════════════
export const reportsRouter = Router();
reportsRouter.use(authenticate);

/** GET /api/v1/reports/stats — bar chart data + remaining budget */
reportsRouter.get('/stats', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const uid = req.user!.sub;
    const barData = await db.query(
      `SELECT TO_CHAR(month_date, 'Mon') AS month,
              total_income AS income, total_expense AS expense
       FROM monthly_summaries WHERE user_id = $1
       ORDER BY month_date DESC LIMIT 6`,
      [uid]
    );
    const budget = await db.query(
      `SELECT total_amount - COALESCE(SUM(bi.spent), 0) AS remaining_budget
       FROM budgets b LEFT JOIN budget_items bi ON bi.budget_id = b.id
       WHERE b.user_id = $1 AND b.month = $2 GROUP BY b.total_amount`,
      [uid, new Date().toISOString().slice(0, 7)]
    );
    res.json({ success: true, data: { barData: barData.rows, remainingBudget: budget.rows[0]?.remaining_budget ?? 0 } });
  } catch (err) { next(err); }
});

/** GET /api/v1/reports/yearly?year=YYYY — yearly insights */
reportsRouter.get('/yearly', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const year = Number(req.query.year) || new Date().getFullYear();
    const monthly = await db.query(
      `SELECT TO_CHAR(month_date, 'Mon') AS month, total_income AS income, total_expense AS expense
       FROM monthly_summaries WHERE user_id = $1 AND EXTRACT(YEAR FROM month_date) = $2 ORDER BY month_date`,
      [req.user!.sub, year]
    );
    const byCategory = await db.query(
      `SELECT c.name, c.color, SUM(t.amount) AS total
       FROM transactions t JOIN categories c ON c.id = t.category_id
       WHERE t.user_id = $1 AND t.type = 'expense' AND EXTRACT(YEAR FROM t.date::date) = $2
       GROUP BY c.id, c.name, c.color ORDER BY total DESC LIMIT 10`,
      [req.user!.sub, year]
    );
    res.json({ success: true, data: { year, monthly: monthly.rows, topCategories: byCategory.rows } });
  } catch (err) { next(err); }
});

/** GET /api/v1/reports/recurring — recurring bills & subscriptions */
reportsRouter.get('/recurring', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const r = await db.query('SELECT * FROM recurring_bills WHERE user_id = $1 ORDER BY next_due_date ASC', [req.user!.sub]);
    res.json({ success: true, data: r.rows });
  } catch (err) { next(err); }
});

/** GET /api/v1/reports/detailed?from=&to= — full transaction export with totals */
reportsRouter.get('/detailed', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { from, to } = req.query as { from: string; to: string };
    if (!from || !to) throw AppError.badRequest('from and to query params are required');
    const r = await db.query<{ type: string; amount: string | number }>(
      `SELECT t.*, c.name AS category_name, c.color AS category_color
       FROM transactions t LEFT JOIN categories c ON c.id = t.category_id
       WHERE t.user_id = $1 AND t.date BETWEEN $2 AND $3
       ORDER BY t.date DESC, t.time DESC`,
      [req.user!.sub, from, to]
    );
    const totals = r.rows.reduce(
      (acc, t) => { acc[t.type] = (acc[t.type] || 0) + Number(t.amount); return acc; },
      {} as Record<string, number>
    );
    res.json({ success: true, data: { transactions: r.rows, totals } });
  } catch (err) { next(err); }
});

// ═══════════════════════════════════════════════════════════════════
// TRANSACTIONS (calendar / all-transactions view)  /api/v1/transactions
// ═══════════════════════════════════════════════════════════════════
export const transactionsRouter = Router();
transactionsRouter.use(authenticate);

/** GET /api/v1/transactions — all transactions joined with category info */
transactionsRouter.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const r = await db.query(
      `SELECT t.*, c.name AS category_name, c.color AS category_color, c.icon AS category_icon
       FROM transactions t LEFT JOIN categories c ON c.id = t.category_id
       WHERE t.user_id = $1 ORDER BY t.date DESC, t.time DESC`,
      [req.user!.sub]
    );
    res.json({ success: true, data: r.rows });
  } catch (err) { next(err); }
});

/** GET /api/v1/transactions/contacts — people for split/transfer UX */
transactionsRouter.get('/contacts', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const r = await db.query('SELECT * FROM contacts WHERE user_id = $1 ORDER BY name', [req.user!.sub]);
    res.json({ success: true, data: r.rows });
  } catch (err) { next(err); }
});

/** GET /api/v1/transactions/monthly?month=YYYY-MM — grouped by category */
transactionsRouter.get('/monthly', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const month = (req.query.month as string) || new Date().toISOString().slice(0, 7);
    const r = await db.query(
      `SELECT c.id AS category_id, c.name, c.color, c.icon,
              SUM(t.amount) AS total, COUNT(*) AS count
       FROM transactions t JOIN categories c ON c.id = t.category_id
       WHERE t.user_id = $1 AND TO_CHAR(t.date::date, 'YYYY-MM') = $2
         AND t.type = 'expense'
       GROUP BY c.id, c.name, c.color, c.icon ORDER BY total DESC`,
      [req.user!.sub, month]
    );
    res.json({ success: true, data: r.rows });
  } catch (err) { next(err); }
});

// ═══════════════════════════════════════════════════════════════════
// SETTINGS  /api/v1/settings
// ═══════════════════════════════════════════════════════════════════
export const settingsRouter = Router();
settingsRouter.use(authenticate);

settingsRouter.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const r = await db.query('SELECT settings FROM users WHERE id = $1', [req.user!.sub]);
    res.json({ success: true, data: r.rows[0]?.settings ?? {} });
  } catch (err) { next(err); }
});

settingsRouter.put('/',
  validate([body('theme').optional().isIn(['light', 'dark', 'system']), body('language').optional().isIn(['en', 'hi', 'ta', 'es'])]),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await db.query(
        `UPDATE users SET settings = settings || $1::jsonb WHERE id = $2`,
        [JSON.stringify(req.body), req.user!.sub]
      );
      res.json({ success: true, message: 'Settings saved' });
    } catch (err) { next(err); }
  }
);

/** POST /api/v1/settings/backup — export all user data as JSON */
settingsRouter.post('/backup', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const uid = req.user!.sub;
    const [profile, categories, transactions, goals, loans, accounts, creditCards, budget] = await Promise.all([
      db.query('SELECT id, email, name, currency FROM users WHERE id = $1', [uid]),
      db.query('SELECT * FROM categories WHERE user_id = $1', [uid]),
      db.query('SELECT * FROM transactions WHERE user_id = $1 ORDER BY date DESC', [uid]),
      db.query('SELECT * FROM goals WHERE user_id = $1', [uid]),
      db.query('SELECT * FROM loans WHERE user_id = $1', [uid]),
      db.query('SELECT * FROM accounts WHERE user_id = $1', [uid]),
      db.query('SELECT * FROM credit_cards WHERE user_id = $1', [uid]),
      db.query('SELECT * FROM budgets WHERE user_id = $1', [uid]),
    ]);
    res.json({
      success: true,
      data: {
        exportedAt: new Date().toISOString(),
        profile: profile.rows[0],
        categories: categories.rows,
        transactions: transactions.rows,
        goals: goals.rows,
        loans: loans.rows,
        accounts: accounts.rows,
        creditCards: creditCards.rows,
        budget: budget.rows,
      },
    });
  } catch (err) { next(err); }
});

/** POST /api/v1/settings/data/clear — wipe all user data (keep account) */
settingsRouter.post('/data/clear', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const uid = req.user!.sub;
    await db.transaction(async (client) => {
      await client.query('DELETE FROM transactions WHERE user_id = $1', [uid]);
      await client.query('DELETE FROM goals WHERE user_id = $1', [uid]);
      await client.query('DELETE FROM loans WHERE user_id = $1', [uid]);
      await client.query('DELETE FROM notifications WHERE user_id = $1', [uid]);
      await client.query('UPDATE users SET total_wealth = 0 WHERE id = $1', [uid]);
    });
    res.json({ success: true, message: 'All personal data cleared' });
  } catch (err) { next(err); }
});
