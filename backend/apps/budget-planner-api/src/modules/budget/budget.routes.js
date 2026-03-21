import { Router } from 'express';
import { body } from 'express-validator';
import { Types } from 'mongoose';
import { Budget, MonthlySummary } from '../../models/index.js';
import { AppError, authenticate, validate } from '../../controllers/helpers.js';
function toMonthKey(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
const router = Router();
router.use(authenticate);
router.get('/', async (req, res, next) => {
    try {
        const month = req.query.month || toMonthKey(new Date());
        const uid = req.user.sub;
        let budget = await Budget.findOne({ userId: uid, month }).populate('items.categoryId', 'name icon color');
        if (!budget) {
            budget = await Budget.create({ userId: uid, month, totalAmount: 0, mode: 'flexible', items: [] });
            await MonthlySummary.findOneAndUpdate({ userId: uid, monthDate: month }, { $setOnInsert: { totalIncome: 0, totalExpense: 0, budgetTotal: 0 } }, { upsert: true });
        }
        const items = budget.items.map((item) => ({
            id: item._id,
            categoryId: item.categoryId?._id ?? item.categoryId,
            name: item.categoryId?.name,
            icon: item.categoryId?.icon,
            color: item.categoryId?.color,
            total: item.totalAmount,
            spent: item.spent,
            overspent: item.overspent,
        }));
        res.json({ success: true, data: { id: budget._id, month, total: budget.totalAmount, mode: budget.mode, items } });
    }
    catch (err) {
        next(err);
    }
});
router.patch('/mode', validate([body('mode').isIn(['zero-based', 'flexible']), body('month').optional().isISO8601()]), async (req, res, next) => {
    try {
        const month = req.body.month || toMonthKey(new Date());
        await Budget.findOneAndUpdate({ userId: req.user.sub, month }, { mode: req.body.mode });
        res.json({ success: true, message: `Budget mode set to ${req.body.mode}` });
    }
    catch (err) {
        next(err);
    }
});
router.put('/items/:categoryId', validate([body('amount').isFloat({ min: 0 }), body('month').optional()]), async (req, res, next) => {
    try {
        const month = req.body.month || toMonthKey(new Date());
        const { categoryId } = req.params;
        const { amount } = req.body;
        const uid = req.user.sub;
        const catOid = new Types.ObjectId(categoryId);
        let budget = await Budget.findOne({ userId: uid, month });
        if (!budget)
            throw AppError.notFound('Budget not found for this month');
        const existing = budget.items.find((i) => i.categoryId.toString() === categoryId);
        if (existing) {
            existing.totalAmount = amount;
            existing.overspent = existing.spent > amount;
        }
        else {
            budget.items.push({ _id: new Types.ObjectId(), categoryId: catOid, totalAmount: amount, spent: 0, overspent: false });
        }
        budget.totalAmount = budget.items.reduce((s, i) => s + i.totalAmount, 0);
        await budget.save();
        // Sync budgetTotal in monthly summary
        await MonthlySummary.findOneAndUpdate({ userId: uid, monthDate: month }, { budgetTotal: budget.totalAmount }, { upsert: true });
        res.json({ success: true, message: 'Budget item updated' });
    }
    catch (err) {
        next(err);
    }
});
router.delete('/items/:categoryId', async (req, res, next) => {
    try {
        const month = req.query.month || toMonthKey(new Date());
        const budget = await Budget.findOne({ userId: req.user.sub, month });
        if (!budget)
            throw AppError.notFound('Budget not found');
        budget.items = budget.items.filter((i) => i.categoryId.toString() !== req.params.categoryId);
        budget.totalAmount = budget.items.reduce((s, i) => s + i.totalAmount, 0);
        await budget.save();
        res.json({ success: true, message: 'Budget item removed' });
    }
    catch (err) {
        next(err);
    }
});
export default router;
