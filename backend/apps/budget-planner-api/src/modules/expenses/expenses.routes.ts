import { Router, Response, NextFunction } from 'express';
import { body, param } from 'express-validator';
import { Types } from 'mongoose';
import mongoose from 'mongoose';
import {
    Category, Transaction, MonthlySummary, Budget, Notification, User,
} from '../../models/index.js';
import { AppError, authenticate, paginate, buildPage, validate } from '../../controllers/helpers.js';
import { AuthRequest } from '../../types/index.js';

const router = Router();
router.use(authenticate);

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Return start and end Date objects for the given YYYY-MM string. */
function monthBounds(yyyyMM: string): { start: Date; end: Date } {
    const [y, m] = yyyyMM.split('-').map(Number);
    return {
        start: new Date(y, m - 1, 1, 0, 0, 0, 0),
        end:   new Date(y, m,     0, 23, 59, 59, 999),
    };
}

/** Extract YYYY-MM from a Date for monthly summary keying. */
function toMonthKey(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// ─── Anomaly detection ────────────────────────────────────────────────────────
async function detectAnomaly(userId: string, categoryId: string, amount: number) {
    const recent = await Transaction.find({ userId, categoryId, type: 'expense' })
        .sort({ date: -1 }).limit(5).select('amount');
    if (recent.length < 3) return { isAnomaly: false as const };
    const avg = recent.reduce((s, t) => s + t.amount, 0) / recent.length;
    if (amount > avg * 3) {
        return {
            isAnomaly: true as const,
            reason: `This spend is more than 3× your average (${avg.toFixed(0)}) for this category`,
        };
    }
    return { isAnomaly: false as const };
}

// ─── CATEGORIES ───────────────────────────────────────────────────────────────

/**
 * GET /expenses/categories
 * Single aggregate — computes current-month spend per category in one round-trip.
 * Replaces the old N+1 pattern (one aggregate query per category).
 */
router.get('/categories', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const uid = new Types.ObjectId(req.user!.sub);
        const { start, end } = monthBounds(toMonthKey(new Date()));

        const results = await Category.aggregate([
            { $match: { userId: uid } },
            {
                $lookup: {
                    from: 'budgettransactions',
                    let: { catId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$categoryId', '$$catId'] },
                                        { $eq: ['$type', 'expense'] },
                                        { $gte: ['$date', start] },
                                        { $lte: ['$date', end] },
                                    ],
                                },
                            },
                        },
                        { $group: { _id: null, total: { $sum: '$amount' } } },
                    ],
                    as: 'spendData',
                },
            },
            {
                $addFields: {
                    value: { $ifNull: [{ $arrayElemAt: ['$spendData.total', 0] }, 0] },
                },
            },
            { $addFields: { over: { $gt: ['$value', '$limitAmount'] } } },
            { $project: { spendData: 0 } },
        ]);

        res.json({ success: true, data: results });
    } catch (err) { next(err); }
});

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
            const cat = await Category.create({
                userId: req.user!.sub, name, icon,
                emoji: emoji || icon, color, type, limitAmount: limit,
            });
            res.status(201).json({ success: true, data: cat });
        } catch (err) { next(err); }
    },
);

router.patch('/categories/:id',
    validate([
        param('id').isMongoId(),
        body('name').optional().trim().notEmpty(),
        body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/),
        body('limit').optional().isFloat({ min: 0 }),
    ]),
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const update: Record<string, unknown> = {};
            if (req.body.name  !== undefined) update.name        = req.body.name;
            if (req.body.icon  !== undefined) update.icon        = req.body.icon;
            if (req.body.emoji !== undefined) update.emoji       = req.body.emoji;
            if (req.body.color !== undefined) update.color       = req.body.color;
            if (req.body.limit !== undefined) update.limitAmount = req.body.limit;
            if (!Object.keys(update).length) throw AppError.badRequest('No fields to update');
            const cat = await Category.findOneAndUpdate(
                { _id: req.params.id, userId: req.user!.sub }, update, { new: true },
            );
            if (!cat) throw AppError.notFound('Category not found');
            res.json({ success: true, data: cat });
        } catch (err) { next(err); }
    },
);

router.delete('/categories/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        await Transaction.updateMany(
            { categoryId: req.params.id, userId: req.user!.sub },
            { $unset: { categoryId: 1 } },
        );
        const result = await Category.findOneAndDelete({ _id: req.params.id, userId: req.user!.sub });
        if (!result) throw AppError.notFound('Category not found');
        res.json({ success: true, message: 'Category deleted' });
    } catch (err) { next(err); }
});

// ─── TRANSACTIONS ─────────────────────────────────────────────────────────────

router.get('/', paginate(30), async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const p = (req as any).pagination;
        const filter: Record<string, unknown> = { userId: req.user!.sub };

        if (req.query.categoryId) filter.categoryId = req.query.categoryId;
        if (req.query.type)       filter.type       = req.query.type;
        if (req.query.from || req.query.to) {
            filter.date = {
                ...(req.query.from ? { $gte: new Date(req.query.from as string) } : {}),
                ...(req.query.to   ? { $lte: new Date(req.query.to   as string) } : {}),
            };
        }
        if (req.query.anomaly === 'true') filter.isAnomaly = true;
        if (p.search) {
            filter.$or = [
                { name:  { $regex: p.search, $options: 'i' } },
                { notes: { $regex: p.search, $options: 'i' } },
            ];
        }

        const [total, data] = await Promise.all([
            Transaction.countDocuments(filter),
            Transaction.find(filter)
                .sort({ date: -1 })
                .skip(p.offset)
                .limit(p.limit)
                .populate('categoryId', 'name color icon'),
        ]);
        res.json({ success: true, ...buildPage(data, total, p) });
    } catch (err) { next(err); }
});

/**
 * POST /expenses
 * All side-effects (summary, wealth, budget) are wrapped in a MongoDB session
 * so a partial failure cannot leave financial totals inconsistent.
 */
router.post('/',
    validate([
        body('amount').isFloat({ gt: 0 }),
        body('categoryId').isMongoId(),
        body('name').trim().notEmpty(),
        body('type').optional().isIn(['expense', 'income']),
        body('date').optional().isISO8601(),
        body('paymentMethod').optional().isIn(['cash', 'card', 'upi', 'bank_transfer', 'other']),
    ]),
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const uid = req.user!.sub;
            const { amount, categoryId, name, notes, type = 'expense', date, paymentMethod, accountId } = req.body;
            const txnDate = date ? new Date(date) : new Date();
            const month   = toMonthKey(txnDate);

            const anomaly = type === 'expense'
                ? await detectAnomaly(uid, categoryId, amount)
                : { isAnomaly: false as const };

            const session = await mongoose.startSession();
            let createdId: string;
            try {
                await session.withTransaction(async () => {
                    const [txn] = await Transaction.create([{
                        userId: uid, categoryId, name, amount, type, date: txnDate,
                        notes, isAnomaly: anomaly.isAnomaly,
                        anomalyReason: anomaly.isAnomaly ? anomaly.reason : undefined,
                        paymentMethod, accountId,
                    }], { session });
                    createdId = txn._id.toString();

                    const wealthDelta  = type === 'expense' ? -amount : amount;
                    const summaryField = type === 'expense' ? 'totalExpense' : 'totalIncome';

                    await Promise.all([
                        MonthlySummary.findOneAndUpdate(
                            { userId: uid, monthDate: month },
                            { $inc: { [summaryField]: amount } },
                            { upsert: true, session },
                        ),
                        User.findByIdAndUpdate(uid, { $inc: { totalWealth: wealthDelta } }, { session }),
                    ]);

                    if (type === 'expense') {
                        await Budget.findOneAndUpdate(
                            { userId: uid, month, 'items.categoryId': categoryId },
                            { $inc: { 'items.$.spent': amount } },
                            { session },
                        );
                        // Recalculate overspent flag after increment
                        await Budget.updateOne(
                            { userId: uid, month, 'items.categoryId': categoryId },
                            [{
                                $set: {
                                    'items.$[item].overspent': {
                                        $gt: ['$items.$[item].spent', '$items.$[item].totalAmount'],
                                    },
                                },
                            }],
                            { arrayFilters: [{ 'item.categoryId': new Types.ObjectId(categoryId) }], session },
                        );
                    }

                    if (anomaly.isAnomaly) {
                        await Notification.create([{
                            userId: uid, type: 'warning', title: 'Unusual Spend Detected',
                            message: anomaly.reason, amount, icon: 'AlertTriangle', color: '#FF9500',
                        }], { session });
                    }
                });
            } finally {
                session.endSession();
            }

            res.status(201).json({
                success: true,
                data: {
                    id:            createdId!,
                    isAnomaly:     anomaly.isAnomaly,
                    anomalyReason: anomaly.isAnomaly ? anomaly.reason : undefined,
                },
            });
        } catch (err) { next(err); }
    },
);

router.get('/history/summary', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const monthStr = (req.query.month as string) || toMonthKey(new Date());
        const { start, end } = monthBounds(monthStr);
        const uid = new Types.ObjectId(req.user!.sub);

        const byCategory = await Transaction.aggregate([
            { $match: { userId: uid, type: 'expense', date: { $gte: start, $lte: end } } },
            { $group: { _id: '$categoryId', value: { $sum: '$amount' } } },
            { $lookup: { from: 'budgetcategories', localField: '_id', foreignField: '_id', as: 'cat' } },
            { $unwind: '$cat' },
            { $project: { name: '$cat.name', color: '$cat.color', value: 1 } },
            { $sort: { value: -1 } },
        ]);

        const total = byCategory.reduce((s: number, r: any) => s + r.value, 0);

        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        weekStart.setHours(0, 0, 0, 0);

        const dailyTrend = await Transaction.aggregate([
            { $match: { userId: uid, type: 'expense', date: { $gte: weekStart } } },
            { $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
                amount: { $sum: '$amount' },
            }},
            { $sort: { _id: 1 } },
            { $project: {
                day: { $dayOfWeek: { $dateFromString: { dateString: '$_id' } } },
                amount: 1,
            }},
        ]);

        res.json({ success: true, data: { totalSpent: total, month: monthStr, categories: byCategory, dailyTrend } });
    } catch (err) { next(err); }
});

router.get('/anomaly/check', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { categoryId, amount } = req.query as { categoryId: string; amount: string };
        if (!categoryId || !amount) throw AppError.badRequest('categoryId and amount are required');
        const result = await detectAnomaly(req.user!.sub, categoryId, Number(amount));
        res.json({ success: true, data: result });
    } catch (err) { next(err); }
});

router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const txn = await Transaction.findOne({ _id: req.params.id, userId: req.user!.sub })
            .populate('categoryId', 'name color icon');
        if (!txn) throw AppError.notFound('Transaction not found');
        res.json({ success: true, data: txn });
    } catch (err) { next(err); }
});

router.patch('/:id',
    validate([
        param('id').isMongoId(),
        body('name').optional().trim().notEmpty(),
        body('notes').optional(),
        body('categoryId').optional().isMongoId(),
    ]),
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const update: Record<string, unknown> = {};
            if (req.body.name       ) update.name       = req.body.name;
            if (req.body.notes !== undefined) update.notes = req.body.notes;
            if (req.body.categoryId ) update.categoryId = req.body.categoryId;
            if (!Object.keys(update).length) throw AppError.badRequest('No fields to update');
            const txn = await Transaction.findOneAndUpdate(
                { _id: req.params.id, userId: req.user!.sub }, update, { new: true },
            );
            if (!txn) throw AppError.notFound('Transaction not found');
            res.json({ success: true, data: txn });
        } catch (err) { next(err); }
    },
);

/**
 * DELETE /expenses/:id
 * Wrapped in a session — deleting the transaction and reversing the wealth/summary
 * impact must succeed or fail together.
 */
router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const txn = await Transaction.findOne({ _id: req.params.id, userId: req.user!.sub });
        if (!txn) throw AppError.notFound('Transaction not found');
        const { amount, type, date } = txn;
        const month = toMonthKey(date);

        const session = await mongoose.startSession();
        try {
            await session.withTransaction(async () => {
                await txn.deleteOne({ session });
                const wealthDelta  = type === 'expense' ? amount : -amount;
                const summaryField = type === 'expense' ? 'totalExpense' : 'totalIncome';
                await Promise.all([
                    User.findByIdAndUpdate(req.user!.sub, { $inc: { totalWealth: wealthDelta } }, { session }),
                    MonthlySummary.findOneAndUpdate(
                        { userId: req.user!.sub, monthDate: month },
                        { $inc: { [summaryField]: -amount } },
                        { session },
                    ),
                ]);
            });
        } finally {
            session.endSession();
        }
        res.json({ success: true, message: 'Transaction deleted' });
    } catch (err) { next(err); }
});

/**
 * POST /expenses/bulk/delete
 * Max 100 IDs per request. Aggregates month impact before writing to minimise
 * the number of MonthlySummary updates. Wrapped in a session.
 */
router.post('/bulk/delete',
    validate([
        body('ids').isArray({ min: 1, max: 100 }).withMessage('Max 100 ids per request'),
        body('ids.*').isMongoId(),
    ]),
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { ids } = req.body;
            const txns = await Transaction.find({ _id: { $in: ids }, userId: req.user!.sub })
                .select('amount type date');

            // Aggregate wealth delta and per-month expense reversal before writing
            const monthImpact = new Map<string, number>();
            let wealthDelta = 0;
            for (const t of txns) {
                if (t.type === 'expense') {
                    const m = toMonthKey(t.date);
                    monthImpact.set(m, (monthImpact.get(m) ?? 0) + t.amount);
                    wealthDelta += t.amount;
                }
            }

            const session = await mongoose.startSession();
            try {
                await session.withTransaction(async () => {
                    await Transaction.deleteMany({ _id: { $in: ids }, userId: req.user!.sub }, { session });
                    if (wealthDelta > 0) {
                        await User.findByIdAndUpdate(
                            req.user!.sub, { $inc: { totalWealth: wealthDelta } }, { session },
                        );
                    }
                    await Promise.all([...monthImpact.entries()].map(([month, total]) =>
                        MonthlySummary.findOneAndUpdate(
                            { userId: req.user!.sub, monthDate: month },
                            { $inc: { totalExpense: -total } },
                            { session },
                        ),
                    ));
                });
            } finally {
                session.endSession();
            }
            res.json({ success: true, message: `${ids.length} transactions deleted` });
        } catch (err) { next(err); }
    },
);

router.post('/bulk/recategorize',
    validate([
        body('ids').isArray({ min: 1, max: 100 }).withMessage('Max 100 ids per request'),
        body('targetCategoryId').isMongoId(),
    ]),
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { ids, targetCategoryId } = req.body;
            await Transaction.updateMany(
                { _id: { $in: ids }, userId: req.user!.sub },
                { categoryId: targetCategoryId },
            );
            res.json({ success: true, message: `${ids.length} transactions recategorized` });
        } catch (err) { next(err); }
    },
);

router.post('/:id/dispute', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const txn = await Transaction.findOne({ _id: req.params.id, userId: req.user!.sub });
        if (!txn) throw AppError.notFound('Transaction not found');
        const { amount, type, date } = txn;
        const month = toMonthKey(date);

        const session = await mongoose.startSession();
        try {
            await session.withTransaction(async () => {
                await Transaction.findByIdAndUpdate(txn._id, { disputed: true }, { session });
                if (type === 'expense') {
                    await Promise.all([
                        User.findByIdAndUpdate(
                            req.user!.sub, { $inc: { totalWealth: amount } }, { session },
                        ),
                        MonthlySummary.findOneAndUpdate(
                            { userId: req.user!.sub, monthDate: month },
                            { $inc: { totalExpense: -amount } },
                            { session },
                        ),
                    ]);
                }
            });
        } finally {
            session.endSession();
        }
        res.json({ success: true, message: 'Transaction disputed and impact reversed' });
    } catch (err) { next(err); }
});

export default router;
