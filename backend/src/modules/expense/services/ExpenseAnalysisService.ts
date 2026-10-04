import { listExpenseCategories } from "../../../integrations/textilesoft/erpExpenseCategory.js";
import { listSqlExpenses } from "../../../integrations/textilesoft/sqlExpenses.js";
import { EXPENSE_FLAG_LABEL, EXPENSE_RULES, flagExpenses, summarizeExpenses, type CategoryPolicy, type ExpenseDoc } from "./expenseMath.js";
import { istDate, istStart, istEndExclusive } from "../../../utils/dateUtils.js";

/**
 * Expense analysis (Expenses > Tracker): every ERP expense in the period for the whole shop (all users of the
 * tenant; the older /api/expense-reports only covers the signed-in user), with rule-based flags.
 */

/** How far back the rules look for a category's usual amount and for duplicates. */
const HISTORY_DAYS = 180;

export async function buildExpenseAnalysis(_tenantId: string, range: { from: string; to: string }) {
    const historyStart = new Date(istStart(range.from).getTime() - HISTORY_DAYS * 86_400_000);

    const [allExpenses, cats] = await Promise.all([
        listSqlExpenses(),
        listExpenseCategories(),
    ]);
    const rangeEnd = istEndExclusive(range.to);
    const docs = allExpenses.filter((expense) => expense.date >= historyStart && expense.date < rangeEnd);

    const history: ExpenseDoc[] = docs.map((d) => ({
        id: String(d._id),
        expenseNo: String(d.expenseNo ?? ""),
        date: istDate(d.date),
        category: String(d.category ?? "Other"),
        amount: Number(d.amount) || 0,
        paymentMethod: String(d.paymentMethod ?? "cash"),
        hasReceipt: false,
        description: String(d.description ?? ""),
        recordedBy: "Unknown user",
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
        source: "sql" as const,
    };
}
