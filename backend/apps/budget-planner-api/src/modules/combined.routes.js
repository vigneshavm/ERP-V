"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingsRouter = exports.transactionsRouter = exports.reportsRouter = exports.notificationsRouter = exports.cardsRouter = exports.accountsRouter = exports.loansRouter = exports.goalsRouter = void 0;
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const uuid_1 = require("uuid");
const database_1 = require("../config/database");
const errorHandler_1 = require("../middleware/errorHandler");
const index_1 = require("../middleware/index");
// ═══════════════════════════════════════════════════════════════════
// GOALS  /api/v1/goals
// ═══════════════════════════════════════════════════════════════════
exports.goalsRouter = (0, express_1.Router)();
exports.goalsRouter.use(index_1.authenticate);
exports.goalsRouter.get('/', async (req, res, next) => {
    try {
        const r = await database_1.db.query('SELECT * FROM goals WHERE user_id = $1 ORDER BY deadline ASC', [req.user.sub]);
        res.json({ success: true, data: r.rows });
    }
    catch (err) {
        next(err);
    }
});
exports.goalsRouter.get('/:id', async (req, res, next) => {
    try {
        const r = await database_1.db.query('SELECT * FROM goals WHERE id = $1 AND user_id = $2', [req.params.id, req.user.sub]);
        if (!r.rows[0])
            throw errorHandler_1.AppError.notFound('Goal not found');
        res.json({ success: true, data: r.rows[0] });
    }
    catch (err) {
        next(err);
    }
});
exports.goalsRouter.post('/', (0, index_1.validate)([
    (0, express_validator_1.body)('name').trim().notEmpty(),
    (0, express_validator_1.body)('target').isFloat({ gt: 0 }),
    (0, express_validator_1.body)('current').optional().isFloat({ min: 0 }),
    (0, express_validator_1.body)('deadline').isISO8601(),
    (0, express_validator_1.body)('icon').notEmpty(),
    (0, express_validator_1.body)('color').matches(/^#[0-9A-Fa-f]{6}$/),
]), async (req, res, next) => {
    try {
        const { name, target, current = 0, icon, color, deadline } = req.body;
        const dailyNudge = (target - current) / Math.max(1, Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000));
        const r = await database_1.db.query(`INSERT INTO goals (id, user_id, name, target, current, icon, color, deadline, daily_nudge)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`, [(0, uuid_1.v4)(), req.user.sub, name, target, current, icon, color, deadline, Math.max(0, dailyNudge)]);
        res.status(201).json({ success: true, data: r.rows[0] });
    }
    catch (err) {
        next(err);
    }
});
exports.goalsRouter.patch('/:id/progress', (0, index_1.validate)([(0, express_validator_1.param)('id').isUUID(), (0, express_validator_1.body)('current').isFloat({ min: 0 })]), async (req, res, next) => {
    try {
        const r = await database_1.db.query('UPDATE goals SET current = $1 WHERE id = $2 AND user_id = $3 RETURNING *', [req.body.current, req.params.id, req.user.sub]);
        if (!r.rows[0])
            throw errorHandler_1.AppError.notFound('Goal not found');
        res.json({ success: true, data: r.rows[0] });
    }
    catch (err) {
        next(err);
    }
});
exports.goalsRouter.patch('/:id', (0, index_1.validate)([(0, express_validator_1.param)('id').isUUID()]), async (req, res, next) => {
    try {
        const fields = [];
        const params = [];
        const set = (col, val) => { params.push(val); fields.push(`${col} = $${params.length}`); };
        if (req.body.name)
            set('name', req.body.name);
        if (req.body.target)
            set('target', req.body.target);
        if (req.body.current !== undefined)
            set('current', req.body.current);
        if (req.body.icon)
            set('icon', req.body.icon);
        if (req.body.color)
            set('color', req.body.color);
        if (req.body.deadline)
            set('deadline', req.body.deadline);
        if (!fields.length)
            throw errorHandler_1.AppError.badRequest('No fields to update');
        params.push(req.params.id, req.user.sub);
        const r = await database_1.db.query(`UPDATE goals SET ${fields.join(', ')} WHERE id = $${params.length - 1} AND user_id = $${params.length} RETURNING *`, params);
        if (!r.rows[0])
            throw errorHandler_1.AppError.notFound('Goal not found');
        res.json({ success: true, data: r.rows[0] });
    }
    catch (err) {
        next(err);
    }
});
exports.goalsRouter.delete('/:id', async (req, res, next) => {
    try {
        const r = await database_1.db.query('DELETE FROM goals WHERE id = $1 AND user_id = $2', [req.params.id, req.user.sub]);
        if (!r.rowCount)
            throw errorHandler_1.AppError.notFound('Goal not found');
        res.json({ success: true, message: 'Goal deleted' });
    }
    catch (err) {
        next(err);
    }
});
// ═══════════════════════════════════════════════════════════════════
// LOANS  /api/v1/loans
// ═══════════════════════════════════════════════════════════════════
exports.loansRouter = (0, express_1.Router)();
exports.loansRouter.use(index_1.authenticate);
exports.loansRouter.get('/', async (req, res, next) => {
    try {
        const r = await database_1.db.query('SELECT * FROM loans WHERE user_id = $1 ORDER BY deadline ASC', [req.user.sub]);
        res.json({ success: true, data: r.rows });
    }
    catch (err) {
        next(err);
    }
});
exports.loansRouter.get('/:id', async (req, res, next) => {
    try {
        const r = await database_1.db.query('SELECT * FROM loans WHERE id = $1 AND user_id = $2', [req.params.id, req.user.sub]);
        if (!r.rows[0])
            throw errorHandler_1.AppError.notFound('Loan not found');
        res.json({ success: true, data: r.rows[0] });
    }
    catch (err) {
        next(err);
    }
});
exports.loansRouter.post('/', (0, index_1.validate)([
    (0, express_validator_1.body)('name').trim().notEmpty(),
    (0, express_validator_1.body)('bank').trim().notEmpty(),
    (0, express_validator_1.body)('total').isFloat({ gt: 0 }),
    (0, express_validator_1.body)('current').optional().isFloat({ min: 0 }),
    (0, express_validator_1.body)('interestRate').isFloat({ min: 0 }),
    (0, express_validator_1.body)('tenureMonths').isInt({ gt: 0 }),
    (0, express_validator_1.body)('type').isIn(['Borrowed', 'Lent']),
    (0, express_validator_1.body)('deadline').isISO8601(),
    (0, express_validator_1.body)('icon').notEmpty(),
    (0, express_validator_1.body)('color').matches(/^#[0-9A-Fa-f]{6}$/),
]), async (req, res, next) => {
    try {
        const { name, bank, total, current = 0, interestRate, tenureMonths, type, deadline, icon, color } = req.body;
        const r = await database_1.db.query(`INSERT INTO loans (id, user_id, name, bank, total, current, interest_rate, tenure_months, type, deadline, icon, color)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`, [(0, uuid_1.v4)(), req.user.sub, name, bank, total, current, interestRate, tenureMonths, type, deadline, icon, color]);
        res.status(201).json({ success: true, data: r.rows[0] });
    }
    catch (err) {
        next(err);
    }
});
exports.loansRouter.patch('/:id', async (req, res, next) => {
    try {
        const fields = [];
        const params = [];
        const set = (col, val) => { params.push(val); fields.push(`${col} = $${params.length}`); };
        ['name', 'bank', 'total', 'current', 'interest_rate', 'tenure_months', 'deadline', 'icon', 'color', 'type'].forEach(f => {
            const k = f.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
            if (req.body[k] !== undefined)
                set(f, req.body[k]);
        });
        if (!fields.length)
            throw errorHandler_1.AppError.badRequest('No fields to update');
        params.push(req.params.id, req.user.sub);
        const r = await database_1.db.query(`UPDATE loans SET ${fields.join(', ')} WHERE id = $${params.length - 1} AND user_id = $${params.length} RETURNING *`, params);
        if (!r.rows[0])
            throw errorHandler_1.AppError.notFound('Loan not found');
        res.json({ success: true, data: r.rows[0] });
    }
    catch (err) {
        next(err);
    }
});
exports.loansRouter.post('/:id/payment', (0, index_1.validate)([(0, express_validator_1.param)('id').isUUID(), (0, express_validator_1.body)('amount').isFloat({ gt: 0 })]), async (req, res, next) => {
    try {
        await database_1.db.transaction(async (client) => {
            const loan = await client.query('SELECT total, current, type FROM loans WHERE id = $1 AND user_id = $2 FOR UPDATE', [req.params.id, req.user.sub]);
            if (!loan.rows[0])
                throw errorHandler_1.AppError.notFound('Loan not found');
            const { total, current, type } = loan.rows[0];
            const newCurrent = Math.min(Number(total), Number(current) + Number(req.body.amount));
            await client.query('UPDATE loans SET current = $1 WHERE id = $2', [newCurrent, req.params.id]);
            // Affect wealth
            if (type === 'Borrowed') {
                await client.query('UPDATE users SET total_wealth = total_wealth - $1 WHERE id = $2', [req.body.amount, req.user.sub]);
            }
            else {
                await client.query('UPDATE users SET total_wealth = total_wealth + $1 WHERE id = $2', [req.body.amount, req.user.sub]);
            }
        });
        res.json({ success: true, message: 'Payment recorded' });
    }
    catch (err) {
        next(err);
    }
});
exports.loansRouter.delete('/:id', async (req, res, next) => {
    try {
        const r = await database_1.db.query('DELETE FROM loans WHERE id = $1 AND user_id = $2', [req.params.id, req.user.sub]);
        if (!r.rowCount)
            throw errorHandler_1.AppError.notFound('Loan not found');
        res.json({ success: true, message: 'Loan deleted' });
    }
    catch (err) {
        next(err);
    }
});
// ═══════════════════════════════════════════════════════════════════
// ACCOUNTS (bank accounts / wallets)  /api/v1/accounts
// ═══════════════════════════════════════════════════════════════════
exports.accountsRouter = (0, express_1.Router)();
exports.accountsRouter.use(index_1.authenticate);
exports.accountsRouter.get('/', async (req, res, next) => {
    try {
        const r = await database_1.db.query('SELECT * FROM accounts WHERE user_id = $1 ORDER BY name', [req.user.sub]);
        res.json({ success: true, data: r.rows });
    }
    catch (err) {
        next(err);
    }
});
exports.accountsRouter.post('/', (0, index_1.validate)([
    (0, express_validator_1.body)('name').trim().notEmpty(),
    (0, express_validator_1.body)('type').isIn(['Savings', 'Checking', 'Current', 'Wallet']),
    (0, express_validator_1.body)('balance').isFloat({ min: 0 }),
    (0, express_validator_1.body)('color').matches(/^#[0-9A-Fa-f]{6}$/),
]), async (req, res, next) => {
    try {
        const { name, type, balance, color } = req.body;
        const r = await database_1.db.query(`INSERT INTO accounts (id, user_id, name, type, balance, income, expense, color, selected)
         VALUES ($1,$2,$3,$4,$5,0,0,$6,false) RETURNING *`, [(0, uuid_1.v4)(), req.user.sub, name, type, balance, color]);
        res.status(201).json({ success: true, data: r.rows[0] });
    }
    catch (err) {
        next(err);
    }
});
exports.accountsRouter.patch('/:id', async (req, res, next) => {
    try {
        const fields = [];
        const params = [];
        const set = (col, val) => { params.push(val); fields.push(`${col} = $${params.length}`); };
        if (req.body.name)
            set('name', req.body.name);
        if (req.body.color)
            set('color', req.body.color);
        if (req.body.selected !== undefined)
            set('selected', req.body.selected);
        if (!fields.length)
            throw errorHandler_1.AppError.badRequest('No fields to update');
        params.push(req.params.id, req.user.sub);
        const r = await database_1.db.query(`UPDATE accounts SET ${fields.join(', ')} WHERE id = $${params.length - 1} AND user_id = $${params.length} RETURNING *`, params);
        if (!r.rows[0])
            throw errorHandler_1.AppError.notFound('Account not found');
        res.json({ success: true, data: r.rows[0] });
    }
    catch (err) {
        next(err);
    }
});
exports.accountsRouter.delete('/:id', async (req, res, next) => {
    try {
        const r = await database_1.db.query('DELETE FROM accounts WHERE id = $1 AND user_id = $2', [req.params.id, req.user.sub]);
        if (!r.rowCount)
            throw errorHandler_1.AppError.notFound('Account not found');
        res.json({ success: true, message: 'Account deleted' });
    }
    catch (err) {
        next(err);
    }
});
// ═══════════════════════════════════════════════════════════════════
// CREDIT CARDS  /api/v1/cards/credit
// ═══════════════════════════════════════════════════════════════════
exports.cardsRouter = (0, express_1.Router)();
exports.cardsRouter.use(index_1.authenticate);
exports.cardsRouter.get('/credit', async (req, res, next) => {
    try {
        const r = await database_1.db.query('SELECT * FROM credit_cards WHERE user_id = $1 ORDER BY due_date ASC', [req.user.sub]);
        res.json({ success: true, data: r.rows });
    }
    catch (err) {
        next(err);
    }
});
exports.cardsRouter.post('/credit', (0, index_1.validate)([
    (0, express_validator_1.body)('bank').notEmpty(), (0, express_validator_1.body)('cardName').notEmpty(),
    (0, express_validator_1.body)('last4').isLength({ min: 4, max: 4 }).isNumeric(),
    (0, express_validator_1.body)('network').isIn(['Visa', 'Mastercard', 'RuPay', 'Amex', 'Discover']),
    (0, express_validator_1.body)('limit').isFloat({ gt: 0 }),
    (0, express_validator_1.body)('dueDate').isISO8601(),
    (0, express_validator_1.body)('color').matches(/^#[0-9A-Fa-f]{6}$/),
]), async (req, res, next) => {
    try {
        const { bank, cardName, last4, network, limit, dueDate, minDue = 0, color, gradient = '' } = req.body;
        const r = await database_1.db.query(`INSERT INTO credit_cards (id, user_id, bank, card_name, last4, network, card_limit, spent, due_date, min_due, color, gradient)
         VALUES ($1,$2,$3,$4,$5,$6,$7,0,$8,$9,$10,$11) RETURNING *`, [(0, uuid_1.v4)(), req.user.sub, bank, cardName, last4, network, limit, dueDate, minDue, color, gradient]);
        res.status(201).json({ success: true, data: r.rows[0] });
    }
    catch (err) {
        next(err);
    }
});
exports.cardsRouter.get('/debit', async (req, res, next) => {
    try {
        const r = await database_1.db.query('SELECT * FROM debit_cards WHERE user_id = $1', [req.user.sub]);
        res.json({ success: true, data: r.rows });
    }
    catch (err) {
        next(err);
    }
});
exports.cardsRouter.post('/debit', (0, index_1.validate)([
    (0, express_validator_1.body)('bank').notEmpty(), (0, express_validator_1.body)('cardName').notEmpty(),
    (0, express_validator_1.body)('last4').isLength({ min: 4, max: 4 }).isNumeric(),
    (0, express_validator_1.body)('network').notEmpty(), (0, express_validator_1.body)('accountId').isUUID(),
    (0, express_validator_1.body)('color').matches(/^#[0-9A-Fa-f]{6}$/),
]), async (req, res, next) => {
    try {
        const { bank, cardName, last4, network, accountId, color, gradient = '' } = req.body;
        const r = await database_1.db.query(`INSERT INTO debit_cards (id, user_id, bank, card_name, last4, network, account_id, color, gradient)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`, [(0, uuid_1.v4)(), req.user.sub, bank, cardName, last4, network, accountId, color, gradient]);
        res.status(201).json({ success: true, data: r.rows[0] });
    }
    catch (err) {
        next(err);
    }
});
exports.cardsRouter.patch('/credit/:id', async (req, res, next) => {
    try {
        const fields = [];
        const params = [req.params.id, req.user.sub];
        const set = (col, val) => { params.push(val); fields.push(`${col} = $${params.length}`); };
        const mappings = {
            bank: 'bank', cardName: 'card_name', last4: 'last4', network: 'network',
            limit: 'card_limit', spent: 'spent', dueDate: 'due_date', minDue: 'min_due',
            color: 'color', gradient: 'gradient'
        };
        Object.entries(mappings).forEach(([bodyKey, dbCol]) => {
            if (req.body[bodyKey] !== undefined)
                set(dbCol, req.body[bodyKey]);
        });
        if (!fields.length)
            throw errorHandler_1.AppError.badRequest('No fields to update');
        const r = await database_1.db.query(`UPDATE credit_cards SET ${fields.join(', ')} WHERE id = $1 AND user_id = $2 RETURNING *`, params);
        if (!r.rowCount)
            throw errorHandler_1.AppError.notFound('Credit card not found');
        res.json({ success: true, data: r.rows[0] });
    }
    catch (err) {
        next(err);
    }
});
exports.cardsRouter.patch('/debit/:id', async (req, res, next) => {
    try {
        const fields = [];
        const params = [req.params.id, req.user.sub];
        const set = (col, val) => { params.push(val); fields.push(`${col} = $${params.length}`); };
        const mappings = {
            bank: 'bank', cardName: 'card_name', last4: 'last4', network: 'network',
            accountId: 'account_id', color: 'color', gradient: 'gradient'
        };
        Object.entries(mappings).forEach(([bodyKey, dbCol]) => {
            if (req.body[bodyKey] !== undefined)
                set(dbCol, req.body[bodyKey]);
        });
        if (!fields.length)
            throw errorHandler_1.AppError.badRequest('No fields to update');
        const r = await database_1.db.query(`UPDATE debit_cards SET ${fields.join(', ')} WHERE id = $1 AND user_id = $2 RETURNING *`, params);
        if (!r.rowCount)
            throw errorHandler_1.AppError.notFound('Debit card not found');
        res.json({ success: true, data: r.rows[0] });
    }
    catch (err) {
        next(err);
    }
});
exports.cardsRouter.delete('/credit/:id', async (req, res, next) => {
    try {
        await database_1.db.query('DELETE FROM credit_cards WHERE id = $1 AND user_id = $2', [req.params.id, req.user.sub]);
        res.json({ success: true, message: 'Credit card removed' });
    }
    catch (err) {
        next(err);
    }
});
exports.cardsRouter.delete('/debit/:id', async (req, res, next) => {
    try {
        await database_1.db.query('DELETE FROM debit_cards WHERE id = $1 AND user_id = $2', [req.params.id, req.user.sub]);
        res.json({ success: true, message: 'Debit card removed' });
    }
    catch (err) {
        next(err);
    }
});
// ═══════════════════════════════════════════════════════════════════
// NOTIFICATIONS  /api/v1/notifications
// ═══════════════════════════════════════════════════════════════════
exports.notificationsRouter = (0, express_1.Router)();
exports.notificationsRouter.use(index_1.authenticate);
exports.notificationsRouter.get('/', async (req, res, next) => {
    try {
        const r = await database_1.db.query('SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50', [req.user.sub]);
        res.json({ success: true, data: r.rows });
    }
    catch (err) {
        next(err);
    }
});
exports.notificationsRouter.patch('/:id/read', async (req, res, next) => {
    try {
        await database_1.db.query('UPDATE notifications SET read = true WHERE id = $1 AND user_id = $2', [req.params.id, req.user.sub]);
        res.json({ success: true, message: 'Notification marked as read' });
    }
    catch (err) {
        next(err);
    }
});
exports.notificationsRouter.patch('/read-all', async (req, res, next) => {
    try {
        await database_1.db.query('UPDATE notifications SET read = true WHERE user_id = $1', [req.user.sub]);
        res.json({ success: true, message: 'All notifications marked as read' });
    }
    catch (err) {
        next(err);
    }
});
exports.notificationsRouter.delete('/:id', async (req, res, next) => {
    try {
        await database_1.db.query('DELETE FROM notifications WHERE id = $1 AND user_id = $2', [req.params.id, req.user.sub]);
        res.json({ success: true, message: 'Notification deleted' });
    }
    catch (err) {
        next(err);
    }
});
// ═══════════════════════════════════════════════════════════════════
// REPORTS  /api/v1/reports
// ═══════════════════════════════════════════════════════════════════
exports.reportsRouter = (0, express_1.Router)();
exports.reportsRouter.use(index_1.authenticate);
/** GET /api/v1/reports/stats — bar chart data + remaining budget */
exports.reportsRouter.get('/stats', async (req, res, next) => {
    try {
        const uid = req.user.sub;
        const barData = await database_1.db.query(`SELECT TO_CHAR(month_date, 'Mon') AS month,
              total_income AS income, total_expense AS expense
       FROM monthly_summaries WHERE user_id = $1
       ORDER BY month_date DESC LIMIT 6`, [uid]);
        const budget = await database_1.db.query(`SELECT total_amount - COALESCE(SUM(bi.spent), 0) AS remaining_budget
       FROM budgets b LEFT JOIN budget_items bi ON bi.budget_id = b.id
       WHERE b.user_id = $1 AND b.month = $2 GROUP BY b.total_amount`, [uid, new Date().toISOString().slice(0, 7)]);
        res.json({ success: true, data: { barData: barData.rows, remainingBudget: budget.rows[0]?.remaining_budget ?? 0 } });
    }
    catch (err) {
        next(err);
    }
});
/** GET /api/v1/reports/yearly?year=YYYY — yearly insights */
exports.reportsRouter.get('/yearly', async (req, res, next) => {
    try {
        const year = Number(req.query.year) || new Date().getFullYear();
        const monthly = await database_1.db.query(`SELECT TO_CHAR(month_date, 'Mon') AS month, total_income AS income, total_expense AS expense
       FROM monthly_summaries WHERE user_id = $1 AND EXTRACT(YEAR FROM month_date) = $2 ORDER BY month_date`, [req.user.sub, year]);
        const byCategory = await database_1.db.query(`SELECT c.name, c.color, SUM(t.amount) AS total
       FROM transactions t JOIN categories c ON c.id = t.category_id
       WHERE t.user_id = $1 AND t.type = 'expense' AND EXTRACT(YEAR FROM t.date::date) = $2
       GROUP BY c.id, c.name, c.color ORDER BY total DESC LIMIT 10`, [req.user.sub, year]);
        res.json({ success: true, data: { year, monthly: monthly.rows, topCategories: byCategory.rows } });
    }
    catch (err) {
        next(err);
    }
});
/** GET /api/v1/reports/recurring — recurring bills & subscriptions */
exports.reportsRouter.get('/recurring', async (req, res, next) => {
    try {
        const r = await database_1.db.query('SELECT * FROM recurring_bills WHERE user_id = $1 ORDER BY next_due_date ASC', [req.user.sub]);
        res.json({ success: true, data: r.rows });
    }
    catch (err) {
        next(err);
    }
});
/** GET /api/v1/reports/detailed?from=&to= — full transaction export with totals */
exports.reportsRouter.get('/detailed', async (req, res, next) => {
    try {
        const { from, to } = req.query;
        if (!from || !to)
            throw errorHandler_1.AppError.badRequest('from and to query params are required');
        const r = await database_1.db.query(`SELECT t.*, c.name AS category_name, c.color AS category_color
       FROM transactions t LEFT JOIN categories c ON c.id = t.category_id
       WHERE t.user_id = $1 AND t.date BETWEEN $2 AND $3
       ORDER BY t.date DESC, t.time DESC`, [req.user.sub, from, to]);
        const totals = r.rows.reduce((acc, t) => { acc[t.type] = (acc[t.type] || 0) + Number(t.amount); return acc; }, {});
        res.json({ success: true, data: { transactions: r.rows, totals } });
    }
    catch (err) {
        next(err);
    }
});
// ═══════════════════════════════════════════════════════════════════
// TRANSACTIONS (calendar / all-transactions view)  /api/v1/transactions
// ═══════════════════════════════════════════════════════════════════
exports.transactionsRouter = (0, express_1.Router)();
exports.transactionsRouter.use(index_1.authenticate);
/** GET /api/v1/transactions — all transactions joined with category info */
exports.transactionsRouter.get('/', async (req, res, next) => {
    try {
        const r = await database_1.db.query(`SELECT t.*, c.name AS category_name, c.color AS category_color, c.icon AS category_icon
       FROM transactions t LEFT JOIN categories c ON c.id = t.category_id
       WHERE t.user_id = $1 ORDER BY t.date DESC, t.time DESC`, [req.user.sub]);
        res.json({ success: true, data: r.rows });
    }
    catch (err) {
        next(err);
    }
});
/** GET /api/v1/transactions/contacts — people for split/transfer UX */
exports.transactionsRouter.get('/contacts', async (req, res, next) => {
    try {
        const r = await database_1.db.query('SELECT * FROM contacts WHERE user_id = $1 ORDER BY name', [req.user.sub]);
        res.json({ success: true, data: r.rows });
    }
    catch (err) {
        next(err);
    }
});
/** GET /api/v1/transactions — all transactions joined with category info */
exports.transactionsRouter.get('/', async (req, res, next) => {
    try {
        const { page = 1, limit = 50, sort = '-date' } = req.query;
        const pageSize = Number(limit);
        const skip = (Number(page) - 1) * pageSize;
        // Handle sort (Postgres style)
        const sortField = String(sort).startsWith('-') ? String(sort).substring(1) : String(sort);
        const sortOrder = String(sort).startsWith('-') ? 'DESC' : 'ASC';
        // Mapping for DB columns if necessary
        const colMap = {
            date: 'date', amount: 'amount', category: 'category', type: 'type'
        };
        const dbCol = colMap[sortField] || 'date';
        const r = await database_1.db.query(`SELECT * FROM transactions WHERE user_id = $1 ORDER BY ${dbCol} ${sortOrder} LIMIT $2 OFFSET $3`, [req.user.sub, pageSize, skip]);
        const countR = await database_1.db.query('SELECT COUNT(*) FROM transactions WHERE user_id = $1', [req.user.sub]);
        const total = parseInt(countR.rows[0].count);
        res.json({
            success: true,
            data: r.rows,
            pagination: {
                total,
                page: Number(page),
                limit: pageSize,
                pages: Math.ceil(total / pageSize)
            }
        });
    }
    catch (err) {
        next(err);
    }
});
/** GET /api/v1/transactions/monthly?month=YYYY-MM — grouped by category */
exports.transactionsRouter.get('/monthly', async (req, res, next) => {
    try {
        const month = typeof req.query.month === 'string' ? req.query.month : new Date().toISOString().slice(0, 7);
        const r = await database_1.db.query(`SELECT c.id AS category_id, c.name, c.color, c.icon,
              SUM(t.amount) AS total, COUNT(*) AS count
       FROM transactions t JOIN categories c ON c.id = t.category_id
       WHERE t.user_id = $1 AND TO_CHAR(t.date::date, 'YYYY-MM') = $2
         AND t.type = 'expense'
       GROUP BY c.id, c.name, c.color, c.icon ORDER BY total DESC`, [req.user.sub, month]);
        res.json({ success: true, data: r.rows });
    }
    catch (err) {
        next(err);
    }
});
// ═══════════════════════════════════════════════════════════════════
// SETTINGS  /api/v1/settings
// ═══════════════════════════════════════════════════════════════════
exports.settingsRouter = (0, express_1.Router)();
exports.settingsRouter.use(index_1.authenticate);
exports.settingsRouter.get('/', async (req, res, next) => {
    try {
        const r = await database_1.db.query('SELECT settings FROM users WHERE id = $1', [req.user.sub]);
        res.json({ success: true, data: r.rows[0]?.settings ?? {} });
    }
    catch (err) {
        next(err);
    }
});
exports.settingsRouter.put('/', (0, index_1.validate)([(0, express_validator_1.body)('theme').optional().isIn(['light', 'dark', 'system']), (0, express_validator_1.body)('language').optional().isIn(['en', 'hi', 'ta', 'es'])]), async (req, res, next) => {
    try {
        await database_1.db.query(`UPDATE users SET settings = settings || $1::jsonb WHERE id = $2`, [JSON.stringify(req.body), req.user.sub]);
        res.json({ success: true, message: 'Settings saved' });
    }
    catch (err) {
        next(err);
    }
});
/** POST /api/v1/settings/backup — export all user data as JSON */
exports.settingsRouter.post('/backup', async (req, res, next) => {
    try {
        const uid = req.user.sub;
        const [profile, categories, transactions, goals, loans, accounts, creditCards, budget] = await Promise.all([
            database_1.db.query('SELECT id, email, name, currency FROM users WHERE id = $1', [uid]),
            database_1.db.query('SELECT * FROM categories WHERE user_id = $1', [uid]),
            database_1.db.query('SELECT * FROM transactions WHERE user_id = $1 ORDER BY date DESC', [uid]),
            database_1.db.query('SELECT * FROM goals WHERE user_id = $1', [uid]),
            database_1.db.query('SELECT * FROM loans WHERE user_id = $1', [uid]),
            database_1.db.query('SELECT * FROM accounts WHERE user_id = $1', [uid]),
            database_1.db.query('SELECT * FROM credit_cards WHERE user_id = $1', [uid]),
            database_1.db.query('SELECT * FROM budgets WHERE user_id = $1', [uid]),
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
    }
    catch (err) {
        next(err);
    }
});
/** POST /api/v1/settings/data/clear — wipe all user data (keep account) */
exports.settingsRouter.post('/data/clear', async (req, res, next) => {
    try {
        const uid = req.user.sub;
        await database_1.db.transaction(async (client) => {
            await client.query('DELETE FROM transactions WHERE user_id = $1', [uid]);
            await client.query('DELETE FROM goals WHERE user_id = $1', [uid]);
            await client.query('DELETE FROM loans WHERE user_id = $1', [uid]);
            await client.query('DELETE FROM notifications WHERE user_id = $1', [uid]);
            await client.query('UPDATE users SET total_wealth = 0 WHERE id = $1', [uid]);
        });
        res.json({ success: true, message: 'All personal data cleared' });
    }
    catch (err) {
        next(err);
    }
});
