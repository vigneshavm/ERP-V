import mongoose from "mongoose";
import Expense from "../models/Expense.js";
import ExpenseCategory from "../models/ExpenseCategory.js";
import User from "../../core/models/User.js";
import { EXPENSE_FLAG_LABEL, EXPENSE_RULES, flagExpenses, summarizeExpenses, type CategoryPolicy, type ExpenseDoc } from "./expenseMath.js";

/**
 * Expense analysis (Expenses > Tracker): every ERP expense in the period for the whole shop (all users of the
 * tenant; the older /api/expense-reports only covers the signed-in user), with rule-based flags.
 */

const IST_OFFSET_MS = 5.5 * 3_600_000;
const istDate = (d: Date): string => new Date(d.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
const istStart = (d: string) => new Date(`${d}T00:00:00+05:30`);
const istEndExclusive = (d: string) => new Date(istStart(d).getTime() + 86_400_000);
const tenantKey = (tenantId: string) => (mongoose.Types.ObjectId.isValid(tenantId) ? new mongoose.Types.ObjectId(tenantId) : tenantId);
/** How far back the rules look for a category's usual amount and for duplicates. */
const HISTORY_DAYS = 180;

export async function buildExpenseAnalysis(tenantId: string, range: { from: string; to: string }) {
    const users = (await User.find({ tenantId: tenantKey(tenantId) }, { _id: 1 }).lean()).map((u) => u._id);
    const historyStart = new Date(istStart(range.from).getTime() - HISTORY_DAYS * 86_400_000);

    const [docs, cats] = await Promise.all([
        Expense.find({ createdBy: { $in: users }, date: { $gte: historyStart, $lt: istEndExclusive(range.to) } },
            { expenseNo: 1, date: 1, category: 1, amount: 1, paymentMethod: 1, receipt: 1, description: 1, createdBy: 1 })
            .populate("createdBy", "name").lean(),
        ExpenseCategory.find({ createdBy: { $in: users } }, { name: 1, monthly_budget: 1, is_cash_allowed: 1, is_active: 1 }).lean(),
    ]);

    const history: ExpenseDoc[] = docs.map((d) => ({
        id: String(d._id),
        expenseNo: String(d.expenseNo ?? ""),
        date: istDate(new Date(d.date as unknown as Date)),
        category: String(d.category ?? "Other"),
        amount: Number(d.amount) || 0,
        paymentMethod: String(d.paymentMethod ?? "cash"),
        hasReceipt: typeof d.receipt === "string" && d.receipt.trim() !== "",
        description: String(d.description ?? ""),
        recordedBy: (d.createdBy as unknown as { name?: string } | null)?.name || "Unknown user",
    }));
    // One policy per category name; an active one wins over an inactive duplicate.
    const policyByName = new Map<string, CategoryPolicy & { active: boolean }>();
    for (const c of cats) {
        const key = String(c.name ?? "").trim().toLowerCase();
        if (!key) continue;
        const p = { name: String(c.name).trim(), monthlyBudget: Number(c.monthly_budget) || 0, cashAllowed: c.is_cash_allowed !== false, active: c.is_active !== false };
        const prev = policyByName.get(key);
        if (!prev || (!prev.active && p.active)) policyByName.set(key, p);
    }
    const policies = [...policyByName.values()];

    const rows = flagExpenses(history, policies, range.from, range.to);
    return {
        range,
        summary: summarizeExpenses(rows, policies, range.from, range.to),
        rows,
        rules: { ...EXPENSE_RULES, historyDays: HISTORY_DAYS, labels: EXPENSE_FLAG_LABEL },
        asOf: istDate(new Date()),
        source: "mongo" as const,
    };
}
