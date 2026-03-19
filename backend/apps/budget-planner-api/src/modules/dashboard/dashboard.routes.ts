import { Router, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { User, MonthlySummary, SmsTransaction, Transaction } from '../../models/index.js';
import { authenticate } from '../../controllers/helpers.js';
import { AuthRequest } from '../../types/index.js';

const router = Router();
router.use(authenticate);

function toMonthKey(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const uid = req.user!.sub;

        const [profile, summaries, sms] = await Promise.all([
            User.findById(uid).select('totalWealth currency'),
            MonthlySummary.find({ userId: uid }).sort({ monthDate: -1 }).limit(12),
            SmsTransaction.aggregate([
                { $match: { userId: new Types.ObjectId(uid), status: 'pending' } },
                { $group: { _id: null, count: { $sum: 1 }, lastDetected: { $max: '$createdAt' } } },
            ]),
        ]);

        const now = new Date();
        const monthlySummaries = (summaries as any[]).map(s => {
            const d = new Date(s.monthDate + '-01');
            const progress = s.budgetTotal > 0
                ? Math.min(100, Math.round((s.totalExpense / s.budgetTotal) * 1000) / 10)
                : 0;
            return {
                month:          d.toLocaleString('en', { month: 'short', year: 'numeric' }),
                year:           d.getFullYear(),
                monthNum:       d.getMonth() + 1,
                income:         s.totalIncome,
                expense:        s.totalExpense,
                budget:         s.budgetTotal,
                progress,
                showPredictive: progress > 90,
                isCurrentMonth: d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth(),
            };
        });

        res.json({
            success: true,
            data: {
                profile: {
                    totalWealth: profile?.totalWealth ?? 0,
                    currency:    profile?.currency ?? 'INR',
                },
                monthlySummaries,
                smsTransfers: {
                    pendingCount: sms[0]?.count        ?? 0,
                    lastDetected: sms[0]?.lastDetected ?? null,
                },
            },
        });
    } catch (err) { next(err); }
});

router.get('/summary/:year/:month', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { year, month } = req.params;
        const y = Number(year);
        const m = Number(month);
        const start = new Date(y, m - 1, 1);
        const end   = new Date(y, m,     0, 23, 59, 59, 999);

        const result = await Transaction.aggregate([
            { $match: { userId: new Types.ObjectId(req.user!.sub), date: { $gte: start, $lte: end } } },
            {
                $group: {
                    _id:              null,
                    income:           { $sum: { $cond: [{ $eq: ['$type', 'income']  }, '$amount', 0] } },
                    expense:          { $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] } },
                    transactionCount: { $sum: 1 },
                },
            },
        ]);

        res.json({ success: true, data: result[0] ?? { income: 0, expense: 0, transactionCount: 0 } });
    } catch (err) { next(err); }
});

export default router;
