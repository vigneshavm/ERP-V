import { Router } from 'express';
import { body, param } from 'express-validator';
import { Types } from 'mongoose';
import mongoose from 'mongoose';
import { Goal, Loan, Account, CreditCard, DebitCard, Notification, Transaction, Budget, MonthlySummary, Category, RecurringBill, Contact, User, } from '../models/index.js';
import { AppError, authenticate, validate } from '../controllers/helpers.js';
function toMonthKey(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
// ─── GOALS ────────────────────────────────────────────────────────────────────
export const goalsRouter = Router();
goalsRouter.use(authenticate);
goalsRouter.get('/', async (req, res, next) => {
    try {
        const r = await Goal.find({ userId: req.user.sub }).sort({ deadline: 1 });
        res.json({ success: true, data: r });
    }
    catch (err) {
        next(err);
    }
});
goalsRouter.get('/:id', async (req, res, next) => {
    try {
        const r = await Goal.findOne({ _id: req.params.id, userId: req.user.sub });
        if (!r)
            throw AppError.notFound('Goal not found');
        res.json({ success: true, data: r });
    }
    catch (err) {
        next(err);
    }
});
goalsRouter.post('/', validate([
    body('name').trim().notEmpty(), body('target').isFloat({ gt: 0 }),
    body('current').optional().isFloat({ min: 0 }), body('deadline').isISO8601(),
    body('icon').notEmpty(), body('color').matches(/^#[0-9A-Fa-f]{6}$/),
]), async (req, res, next) => {
    try {
        const { name, target, current = 0, icon, color, deadline } = req.body;
        const dailyNudge = Math.max(0, (target - current) / Math.max(1, Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000)));
        const r = await Goal.create({ userId: req.user.sub, name, target, current, icon, color, deadline, dailyNudge });
        res.status(201).json({ success: true, data: r });
    }
    catch (err) {
        next(err);
    }
});
goalsRouter.patch('/:id/progress', validate([param('id').isMongoId(), body('current').isFloat({ min: 0 })]), async (req, res, next) => {
    try {
        const r = await Goal.findOneAndUpdate({ _id: req.params.id, userId: req.user.sub }, { current: req.body.current }, { new: true });
        if (!r)
            throw AppError.notFound('Goal not found');
        res.json({ success: true, data: r });
    }
    catch (err) {
        next(err);
    }
});
goalsRouter.patch('/:id', validate([param('id').isMongoId()]), async (req, res, next) => {
    try {
        const update = {};
        ['name', 'target', 'current', 'icon', 'color', 'deadline'].forEach(f => { if (req.body[f] !== undefined)
            update[f] = req.body[f]; });
        if (!Object.keys(update).length)
            throw AppError.badRequest('No fields to update');
        const r = await Goal.findOneAndUpdate({ _id: req.params.id, userId: req.user.sub }, update, { new: true });
        if (!r)
            throw AppError.notFound('Goal not found');
        res.json({ success: true, data: r });
    }
    catch (err) {
        next(err);
    }
});
goalsRouter.delete('/:id', async (req, res, next) => {
    try {
        const r = await Goal.findOneAndDelete({ _id: req.params.id, userId: req.user.sub });
        if (!r)
            throw AppError.notFound('Goal not found');
        res.json({ success: true, message: 'Goal deleted' });
    }
    catch (err) {
        next(err);
    }
});
// ─── LOANS ────────────────────────────────────────────────────────────────────
export const loansRouter = Router();
loansRouter.use(authenticate);
loansRouter.get('/', async (req, res, next) => {
    try {
        const r = await Loan.find({ userId: req.user.sub }).sort({ deadline: 1 });
        res.json({ success: true, data: r });
    }
    catch (err) {
        next(err);
    }
});
loansRouter.get('/:id', async (req, res, next) => {
    try {
        const r = await Loan.findOne({ _id: req.params.id, userId: req.user.sub });
        if (!r)
            throw AppError.notFound('Loan not found');
        res.json({ success: true, data: r });
    }
    catch (err) {
        next(err);
    }
});
loansRouter.post('/', validate([
    body('name').trim().notEmpty(), body('bank').trim().notEmpty(),
    body('total').isFloat({ gt: 0 }), body('current').optional().isFloat({ min: 0 }),
    body('interestRate').isFloat({ min: 0 }), body('tenureMonths').isInt({ gt: 0 }),
    body('type').isIn(['Borrowed', 'Lent']), body('deadline').isISO8601(),
    body('icon').notEmpty(), body('color').matches(/^#[0-9A-Fa-f]{6}$/),
]), async (req, res, next) => {
    try {
        const r = await Loan.create({ userId: req.user.sub, ...req.body });
        res.status(201).json({ success: true, data: r });
    }
    catch (err) {
        next(err);
    }
});
loansRouter.patch('/:id', async (req, res, next) => {
    try {
        const fields = ['name', 'bank', 'total', 'current', 'interestRate', 'tenureMonths', 'deadline', 'icon', 'color', 'type'];
        const update = {};
        fields.forEach(f => { if (req.body[f] !== undefined)
            update[f] = req.body[f]; });
        if (!Object.keys(update).length)
            throw AppError.badRequest('No fields to update');
        const r = await Loan.findOneAndUpdate({ _id: req.params.id, userId: req.user.sub }, update, { new: true });
        if (!r)
            throw AppError.notFound('Loan not found');
        res.json({ success: true, data: r });
    }
    catch (err) {
        next(err);
    }
});
loansRouter.post('/:id/payment', validate([param('id').isMongoId(), body('amount').isFloat({ gt: 0 })]), async (req, res, next) => {
    try {
        const loan = await Loan.findOne({ _id: req.params.id, userId: req.user.sub });
        if (!loan)
            throw AppError.notFound('Loan not found');
        const paymentAmount = Number(req.body.amount);
        const wealthDelta = loan.type === 'Borrowed' ? -paymentAmount : paymentAmount;
        const session = await mongoose.startSession();
        try {
            await session.withTransaction(async () => {
                await Loan.findByIdAndUpdate(loan._id, { $min: { current: loan.total }, $inc: {} }, // clamp via $min after inc
                { session });
                // Use findByIdAndUpdate to avoid stale-doc race on concurrent payments
                await Loan.findByIdAndUpdate(loan._id, [{ $set: { current: { $min: ['$total', { $add: ['$current', paymentAmount] }] } } }], { session });
                await User.findByIdAndUpdate(req.user.sub, { $inc: { totalWealth: wealthDelta } }, { session });
            });
        }
        finally {
            session.endSession();
        }
        res.json({ success: true, message: 'Payment recorded' });
    }
    catch (err) {
        next(err);
    }
});
loansRouter.delete('/:id', async (req, res, next) => {
    try {
        const r = await Loan.findOneAndDelete({ _id: req.params.id, userId: req.user.sub });
        if (!r)
            throw AppError.notFound('Loan not found');
        res.json({ success: true, message: 'Loan deleted' });
    }
    catch (err) {
        next(err);
    }
});
// ─── ACCOUNTS ─────────────────────────────────────────────────────────────────
export const accountsRouter = Router();
accountsRouter.use(authenticate);
accountsRouter.get('/', async (req, res, next) => {
    try {
        const r = await Account.find({ userId: req.user.sub }).sort({ name: 1 });
        res.json({ success: true, data: r });
    }
    catch (err) {
        next(err);
    }
});
accountsRouter.post('/', validate([body('name').trim().notEmpty(), body('type').isIn(['Savings', 'Checking', 'Current', 'Wallet']), body('balance').isFloat({ min: 0 }), body('color').matches(/^#[0-9A-Fa-f]{6}$/)]), async (req, res, next) => {
    try {
        const r = await Account.create({ userId: req.user.sub, ...req.body });
        res.status(201).json({ success: true, data: r });
    }
    catch (err) {
        next(err);
    }
});
accountsRouter.patch('/:id', async (req, res, next) => {
    try {
        const update = {};
        ['name', 'color', 'selected'].forEach(f => { if (req.body[f] !== undefined)
            update[f] = req.body[f]; });
        if (!Object.keys(update).length)
            throw AppError.badRequest('No fields to update');
        const r = await Account.findOneAndUpdate({ _id: req.params.id, userId: req.user.sub }, update, { new: true });
        if (!r)
            throw AppError.notFound('Account not found');
        res.json({ success: true, data: r });
    }
    catch (err) {
        next(err);
    }
});
accountsRouter.delete('/:id', async (req, res, next) => {
    try {
        const r = await Account.findOneAndDelete({ _id: req.params.id, userId: req.user.sub });
        if (!r)
            throw AppError.notFound('Account not found');
        res.json({ success: true, message: 'Account deleted' });
    }
    catch (err) {
        next(err);
    }
});
// ─── CARDS ────────────────────────────────────────────────────────────────────
export const cardsRouter = Router();
cardsRouter.use(authenticate);
cardsRouter.get('/credit', async (req, res, next) => {
    try {
        const r = await CreditCard.find({ userId: req.user.sub }).sort({ dueDate: 1 });
        res.json({ success: true, data: r });
    }
    catch (err) {
        next(err);
    }
});
cardsRouter.post('/credit', validate([
    body('bank').notEmpty(), body('cardName').notEmpty(),
    body('last4').isLength({ min: 4, max: 4 }).isNumeric(),
    body('network').isIn(['Visa', 'Mastercard', 'RuPay', 'Amex', 'Discover']),
    body('limit').isFloat({ gt: 0 }), body('dueDate').isISO8601(), body('color').matches(/^#[0-9A-Fa-f]{6}$/),
]), async (req, res, next) => {
    try {
        const r = await CreditCard.create({ userId: req.user.sub, ...req.body });
        res.status(201).json({ success: true, data: r });
    }
    catch (err) {
        next(err);
    }
});
cardsRouter.patch('/credit/:id', async (req, res, next) => {
    try {
        const r = await CreditCard.findOneAndUpdate({ _id: req.params.id, userId: req.user.sub }, req.body, { new: true });
        if (!r)
            throw AppError.notFound('Credit card not found');
        res.json({ success: true, data: r });
    }
    catch (err) {
        next(err);
    }
});
cardsRouter.delete('/credit/:id', async (req, res, next) => {
    try {
        await CreditCard.findOneAndDelete({ _id: req.params.id, userId: req.user.sub });
        res.json({ success: true, message: 'Credit card removed' });
    }
    catch (err) {
        next(err);
    }
});
cardsRouter.get('/debit', async (req, res, next) => {
    try {
        const r = await DebitCard.find({ userId: req.user.sub });
        res.json({ success: true, data: r });
    }
    catch (err) {
        next(err);
    }
});
cardsRouter.post('/debit', validate([
    body('bank').notEmpty(), body('cardName').notEmpty(),
    body('last4').isLength({ min: 4, max: 4 }).isNumeric(),
    body('network').notEmpty(), body('accountId').isMongoId(), body('color').matches(/^#[0-9A-Fa-f]{6}$/),
]), async (req, res, next) => {
    try {
        const r = await DebitCard.create({ userId: req.user.sub, ...req.body });
        res.status(201).json({ success: true, data: r });
    }
    catch (err) {
        next(err);
    }
});
cardsRouter.patch('/debit/:id', async (req, res, next) => {
    try {
        const r = await DebitCard.findOneAndUpdate({ _id: req.params.id, userId: req.user.sub }, req.body, { new: true });
        if (!r)
            throw AppError.notFound('Debit card not found');
        res.json({ success: true, data: r });
    }
    catch (err) {
        next(err);
    }
});
cardsRouter.delete('/debit/:id', async (req, res, next) => {
    try {
        await DebitCard.findOneAndDelete({ _id: req.params.id, userId: req.user.sub });
        res.json({ success: true, message: 'Debit card removed' });
    }
    catch (err) {
        next(err);
    }
});
// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
export const notificationsRouter = Router();
notificationsRouter.use(authenticate);
notificationsRouter.get('/', async (req, res, next) => {
    try {
        const r = await Notification.find({ userId: req.user.sub }).sort({ createdAt: -1 }).limit(50);
        res.json({ success: true, data: r });
    }
    catch (err) {
        next(err);
    }
});
notificationsRouter.patch('/:id/read', async (req, res, next) => {
    try {
        await Notification.findOneAndUpdate({ _id: req.params.id, userId: req.user.sub }, { read: true });
        res.json({ success: true, message: 'Notification marked as read' });
    }
    catch (err) {
        next(err);
    }
});
notificationsRouter.patch('/read-all', async (req, res, next) => {
    try {
        await Notification.updateMany({ userId: req.user.sub }, { read: true });
        res.json({ success: true, message: 'All notifications marked as read' });
    }
    catch (err) {
        next(err);
    }
});
notificationsRouter.delete('/:id', async (req, res, next) => {
    try {
        await Notification.findOneAndDelete({ _id: req.params.id, userId: req.user.sub });
        res.json({ success: true, message: 'Notification deleted' });
    }
    catch (err) {
        next(err);
    }
});
// ─── REPORTS ──────────────────────────────────────────────────────────────────
export const reportsRouter = Router();
reportsRouter.use(authenticate);
reportsRouter.get('/stats', async (req, res, next) => {
    try {
        const uid = req.user.sub;
        const barData = await MonthlySummary.find({ userId: uid }).sort({ monthDate: -1 }).limit(6)
            .select('monthDate totalIncome totalExpense');
        const currentMonth = toMonthKey(new Date());
        const budget = await Budget.findOne({ userId: uid, month: currentMonth });
        const remainingBudget = budget
            ? budget.totalAmount - budget.items.reduce((s, i) => s + i.spent, 0)
            : 0;
        res.json({ success: true, data: { barData, remainingBudget } });
    }
    catch (err) {
        next(err);
    }
});
reportsRouter.get('/yearly', async (req, res, next) => {
    try {
        const year = Number(req.query.year) || new Date().getFullYear();
        const uid = req.user.sub;
        // monthDate is a YYYY-MM string key — string range is correct here
        const monthly = await MonthlySummary.find({
            userId: uid,
            monthDate: {
                $gte: `${year}-01`,
                $lte: `${year}-12`,
            },
        }).sort({ monthDate: 1 });
        const byCategory = await Transaction.aggregate([
            { $match: { userId: new Types.ObjectId(uid), type: 'expense', date: { $gte: new Date(Number(year), 0, 1), $lte: new Date(Number(year), 11, 31, 23, 59, 59, 999) } } },
            { $group: { _id: '$categoryId', total: { $sum: '$amount' } } },
            { $lookup: { from: 'budgetcategories', localField: '_id', foreignField: '_id', as: 'cat' } },
            { $unwind: '$cat' },
            { $project: { name: '$cat.name', color: '$cat.color', total: 1 } },
            { $sort: { total: -1 } },
            { $limit: 10 },
        ]);
        res.json({ success: true, data: { year, monthly, topCategories: byCategory } });
    }
    catch (err) {
        next(err);
    }
});
reportsRouter.get('/recurring', async (req, res, next) => {
    try {
        const r = await RecurringBill.find({ userId: req.user.sub }).sort({ nextDueDate: 1 });
        res.json({ success: true, data: r });
    }
    catch (err) {
        next(err);
    }
});
reportsRouter.get('/detailed', async (req, res, next) => {
    try {
        const { from, to } = req.query;
        if (!from || !to)
            throw AppError.badRequest('from and to query params are required');
        const txns = await Transaction.find({ userId: req.user.sub, date: { $gte: new Date(from), $lte: new Date(to) } })
            .sort({ date: -1 })
            .populate('categoryId', 'name color');
        const totals = txns.reduce((acc, t) => {
            acc[t.type] = (acc[t.type] || 0) + t.amount;
            return acc;
        }, {});
        res.json({ success: true, data: { transactions: txns, totals } });
    }
    catch (err) {
        next(err);
    }
});
// ─── TRANSACTIONS (calendar view) ─────────────────────────────────────────────
export const transactionsRouter = Router();
transactionsRouter.use(authenticate);
transactionsRouter.get('/contacts', async (req, res, next) => {
    try {
        const r = await Contact.find({ userId: req.user.sub }).sort({ name: 1 });
        res.json({ success: true, data: r });
    }
    catch (err) {
        next(err);
    }
});
transactionsRouter.get('/monthly', async (req, res, next) => {
    try {
        const monthStr = typeof req.query.month === 'string' ? req.query.month : toMonthKey(new Date());
        const [year, mon] = monthStr.split('-').map(Number);
        const start = new Date(year, mon - 1, 1);
        const end = new Date(year, mon, 0, 23, 59, 59, 999);
        const r = await Transaction.aggregate([
            { $match: { userId: new Types.ObjectId(req.user.sub), type: 'expense', date: { $gte: start, $lte: end } } },
            { $group: { _id: '$categoryId', total: { $sum: '$amount' }, count: { $sum: 1 } } },
            { $lookup: { from: 'budgetcategories', localField: '_id', foreignField: '_id', as: 'cat' } },
            { $unwind: '$cat' },
            { $project: { categoryId: '$_id', name: '$cat.name', color: '$cat.color', icon: '$cat.icon', total: 1, count: 1 } },
            { $sort: { total: -1 } },
        ]);
        res.json({ success: true, data: r });
    }
    catch (err) {
        next(err);
    }
});
transactionsRouter.get('/', async (req, res, next) => {
    try {
        const { page = 1, limit = 50, sort = '-date' } = req.query;
        const pageSize = Number(limit);
        const skip = (Number(page) - 1) * pageSize;
        const sortOrder = String(sort).startsWith('-') ? -1 : 1;
        const sortField = String(sort).replace(/^-/, '');
        const [data, total] = await Promise.all([
            Transaction.find({ userId: req.user.sub })
                .sort({ [sortField]: sortOrder }).skip(skip).limit(pageSize)
                .populate('categoryId', 'name color icon'),
            Transaction.countDocuments({ userId: req.user.sub }),
        ]);
        res.json({ success: true, data, pagination: { total, page: Number(page), limit: pageSize, pages: Math.ceil(total / pageSize) } });
    }
    catch (err) {
        next(err);
    }
});
// ─── SETTINGS ─────────────────────────────────────────────────────────────────
export const settingsRouter = Router();
settingsRouter.use(authenticate);
settingsRouter.get('/', async (req, res, next) => {
    try {
        const user = await User.findById(req.user.sub).select('settings');
        res.json({ success: true, data: user?.settings ?? {} });
    }
    catch (err) {
        next(err);
    }
});
settingsRouter.put('/', validate([body('theme').optional().isIn(['light', 'dark', 'system']), body('language').optional().isIn(['en', 'hi', 'ta', 'es'])]), async (req, res, next) => {
    try {
        const user = await User.findById(req.user.sub);
        if (!user)
            throw AppError.notFound('User not found');
        user.settings = { ...user.settings, ...req.body };
        await user.save();
        res.json({ success: true, message: 'Settings saved' });
    }
    catch (err) {
        next(err);
    }
});
settingsRouter.post('/backup', async (req, res, next) => {
    try {
        const uid = req.user.sub;
        const [profile, categories, transactions, goals, loans, accounts, creditCards, budget] = await Promise.all([
            User.findById(uid).select('email name currency'),
            Category.find({ userId: uid }),
            Transaction.find({ userId: uid }).sort({ date: -1 }),
            Goal.find({ userId: uid }),
            Loan.find({ userId: uid }),
            Account.find({ userId: uid }),
            CreditCard.find({ userId: uid }),
            Budget.find({ userId: uid }),
        ]);
        res.json({ success: true, data: { exportedAt: new Date().toISOString(), profile, categories, transactions, goals, loans, accounts, creditCards, budget } });
    }
    catch (err) {
        next(err);
    }
});
settingsRouter.post('/data/clear', async (req, res, next) => {
    try {
        const uid = req.user.sub;
        const session = await mongoose.startSession();
        try {
            await session.withTransaction(async () => {
                await Promise.all([
                    Transaction.deleteMany({ userId: uid }, { session }),
                    Goal.deleteMany({ userId: uid }, { session }),
                    Loan.deleteMany({ userId: uid }, { session }),
                    Notification.deleteMany({ userId: uid }, { session }),
                    User.findByIdAndUpdate(uid, { totalWealth: 0 }, { session }),
                ]);
            });
        }
        finally {
            session.endSession();
        }
        res.json({ success: true, message: 'All personal data cleared' });
    }
    catch (err) {
        next(err);
    }
});
