import mongoose from "mongoose";
import BankAccount from "../models/BankAccount.js";
import CashbankTransaction from "../models/CashbankTransaction.js";
import PettyCashClose from "../models/PettyCashClose.js";
import Loan from "../models/Loan.js";
import LoanPayment from "../models/LoanPayment.js";
import Cheque from "../models/Cheque.js";
import Bill from "../models/Bill.js";
import BankStatementTransaction from "../models/BankStatementTransaction.js";
import User from "../../core/models/User.js";
import { buildCashFlow } from "./FinanceReportService.js";
import {
    ALERT_RULES, addDays, buildAlerts, cashPosition, daysBetween, lastCount, loanRow, reconciliationSummary, suggestMatches,
    type LedgerEntry, type LoanRow, type StatementLine,
} from "./cashBankMath.js";

/**
 * Cash & bank overview (Finance > Overview) and bank reconciliation, from the ERP's own records plus the shop's
 * cash sales (through the Cash Flow report). Everything is for the whole shop (all users of the tenant): the
 * older cash-bank endpoints only look at the signed-in user's records.
 */

const IST_OFFSET_MS = 5.5 * 3_600_000;
const istDate = (d: Date): string => new Date(d.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
const todayIst = () => istDate(new Date());
const istStart = (d: string) => new Date(`${d}T00:00:00+05:30`);
const istEndExclusive = (d: string) => new Date(istStart(d).getTime() + 86_400_000);
const tenantKey = (tenantId: string) => (mongoose.Types.ObjectId.isValid(tenantId) ? new mongoose.Types.ObjectId(tenantId) : tenantId);
const n = (v: unknown): number => {
    const x = Number(v);
    return Number.isFinite(x) ? x : 0;
};
const round2 = (v: number) => Math.round(v * 100) / 100;
const dateOf = (v: unknown): string | null => {
    const d = v instanceof Date ? v : v ? new Date(String(v)) : null;
    return d && !Number.isNaN(d.getTime()) ? istDate(d) : null;
};

async function tenantUsers(tenantId: string) {
    const users = await User.find({ tenantId: tenantKey(tenantId) }, { _id: 1 }).lean();
    const ids = users.map((u) => u._id as mongoose.Types.ObjectId);
    return { ids, strings: ids.map(String) };
}

/* ---------------------------------------------------------------------------------------------------- Overview */

export interface BankRow {
    id: string;
    name: string;
    type: string;
    branch: string;
    balance: number;
    opening: number;
    status: string;
    unreconciled: number;
    unreconciledAmount: number;
    unreconciledOld: number;
}

export async function loadLoans(tenantId: string, today: string): Promise<LoanRow[]> {
    const loans = await Loan.find({ tenantId: tenantKey(tenantId) }).sort({ createdAt: -1 }).lean();
    const pays = loans.length
        ? await LoanPayment.aggregate<{ _id: unknown; paid: number; count: number; last: Date }>([
            { $match: { loanId: { $in: loans.map((l) => l._id) } } },
            { $group: { _id: "$loanId", paid: { $sum: "$amountPaid" }, count: { $sum: 1 }, last: { $max: "$paymentDate" } } },
        ])
        : [];
    const byLoan = new Map(pays.map((p) => [String(p._id), p]));
    return loans.map((l) => {
        const p = byLoan.get(String(l._id));
        return loanRow({
            id: String(l._id), name: String(l.name ?? ""), principal: n(l.principalAmount), interestRate: n(l.interestRate),
            termMonths: n(l.termMonths), emi: n(l.emiAmount), pending: n(l.totalPendingAmount),
            startDate: dateOf(l.startDate) ?? today, status: String(l.status ?? "active"),
            paid: n(p?.paid), payments: n(p?.count), lastPayment: dateOf(p?.last),
        }, today);
    });
}

export async function buildCashBankOverview(tenantId: string) {
    const today = todayIst();
    const tid = tenantKey(tenantId);
    const users = await tenantUsers(tenantId);
    const trendFrom = addDays(today, -29);

    const [accounts, unreconciled, closes, loans, cheques, bills, flow] = await Promise.all([
        BankAccount.find({ tenantId: tid }, { bankName: 1, accountType: 1, branch: 1, currentBalance: 1, openingBalance: 1, status: 1 }).lean(),
        CashbankTransaction.find({ userId: { $in: users.strings }, reconciled: { $ne: true }, type: { $in: ["in", "out", "transfer"] } },
            { fromAccount: 1, toAccount: 1, amount: 1, date: 1 }).lean(),
        PettyCashClose.find({ tenantId: tid, status: "COMPLETED" }, { date: 1, countedCash: 1, expectedCash: 1, variance: 1 }).sort({ date: -1 }).limit(20).lean(),
        loadLoans(tenantId, today),
        Cheque.find({ tenantId: tid, status: "PENDING" }, { number: 1, payee: 1, amount: 1, date: 1, type: 1, bankName: 1 }).sort({ date: 1 }).lean(),
        Bill.find({ tenantId: String(tenantId), status: { $in: ["approved", "unpaid", "overdue"] }, paymentStatus: { $ne: "paid" }, dueDate: { $lt: istStart(today) } },
            { billNo: 1, amount: 1, paidAmount: 1, discountReceived: 1, dueDate: 1, supplier: 1 }).populate("supplier", "name").lean(),
        buildCashFlow(tenantId, { from: trendFrom, to: today }),
    ]);

    // Banks with their unreconciled ERP entries.
    const oldCutoff = addDays(today, -ALERT_RULES.unreconciledDays);
    const banks: BankRow[] = accounts.map((a) => {
        const id = String(a._id);
        const mine = unreconciled.filter((t) => String(t.fromAccount) === id || String(t.toAccount) === id);
        return {
            id, name: String(a.bankName ?? "Account"), type: String(a.accountType ?? ""), branch: String(a.branch ?? ""),
            balance: round2(n(a.currentBalance)), opening: round2(n(a.openingBalance)), status: String(a.status ?? "active"),
            unreconciled: mine.length,
            unreconciledAmount: round2(mine.reduce((s, t) => s + n(t.amount), 0)),
            unreconciledOld: mine.filter((t) => (dateOf(t.date) ?? today) < oldCutoff).length,
        };
    });

    // Cash: last count + movement since.
    const count = lastCount(closes.map((c) => ({ date: dateOf(c.date) ?? "", countedCash: n(c.countedCash), expectedCash: n(c.expectedCash), variance: n(c.variance) })).filter((c) => c.date));
    // Gross cash in / out for exactly the days after the count (same rules as the Cash Flow report).
    let movement = { cashIn: 0, cashOut: 0 };
    if (count && count.date < today) {
        const since = await buildCashFlow(tenantId, { from: addDays(count.date, 1), to: today });
        movement = { cashIn: since.totals.cashIn, cashOut: since.totals.cashOut };
    }
    // Cash <-> bank transfers since the count (the Cash Flow report leaves transfers out of in/out).
    let fromBank = 0, toBank = 0;
    if (count && count.date < today) {
        const transfers = await CashbankTransaction.find({
            userId: { $in: users.strings }, type: "transfer", date: { $gte: istEndExclusive(count.date) }, $or: [{ fromAccount: "cash" }, { toAccount: "cash" }],
        }, { fromAccount: 1, toAccount: 1, amount: 1 }).lean();
        for (const t of transfers) {
            if (String(t.toAccount) === "cash") fromBank += n(t.amount);
            else toBank += n(t.amount);
        }
    }
    const cash = cashPosition(count, { ...movement, fromBank, toBank }, today);

    const chequeRows = cheques.map((c) => ({
        id: String(c._id), number: String(c.number ?? ""), payee: String(c.payee ?? ""), bank: String(c.bankName ?? ""),
        amount: round2(n(c.amount)), date: dateOf(c.date) ?? today, type: c.type as "RECEIVED" | "ISSUED",
    }));
    const billRows = bills.map((b) => ({
        id: String(b._id), billNo: String(b.billNo ?? ""), supplier: String((b.supplier as unknown as { name?: string } | null)?.name ?? ""),
        due: dateOf(b.dueDate) ?? today, outstanding: round2(Math.max(0, n(b.amount) - n(b.paidAmount) - n(b.discountReceived))),
    })).filter((b) => b.outstanding > 0).map((b) => ({ ...b, daysOverdue: daysBetween(b.due, today) }))
        .sort((a, b) => b.daysOverdue - a.daysOverdue);
    const overdueBills = { count: billRows.length, amount: round2(billRows.reduce((s, b) => s + b.outstanding, 0)) };

    const activeBanks = banks.filter((b) => b.status !== "inactive");
    const activeLoans = loans.filter((l) => l.health !== "closed");
    const alerts = buildAlerts({ today, cash, banks: activeBanks, loans, cheques: chequeRows, overdueBills });

    return {
        today,
        cash,
        banks,
        bankTotal: round2(activeBanks.reduce((s, b) => s + b.balance, 0)),
        loans,
        loanTotals: {
            active: activeLoans.length,
            pending: round2(activeLoans.reduce((s, l) => s + l.pending, 0)),
            monthlyEmi: round2(activeLoans.reduce((s, l) => s + l.emi, 0)),
            nextDue: activeLoans.map((l) => l.nextDue).filter((d): d is string => !!d).sort()[0] ?? null,
        },
        cheques: {
            rows: chequeRows,
            toReceive: round2(chequeRows.filter((c) => c.type === "RECEIVED").reduce((s, c) => s + c.amount, 0)),
            toPay: round2(chequeRows.filter((c) => c.type === "ISSUED").reduce((s, c) => s + c.amount, 0)),
        },
        overdueBills: { ...overdueBills, rows: billRows.slice(0, 20) },
        trend: { from: trendFrom, to: today, totals: flow.totals, byDay: flow.byDay },
        alerts,
        rules: ALERT_RULES,
        asOf: flow.asOf,
        source: flow.source,
    };
}

/** Loans page: every loan with EMI status, totals, and the shop's bank accounts (for recording an EMI paid from a bank). */
export async function buildLoansReport(tenantId: string) {
    const today = todayIst();
    const [loans, accounts] = await Promise.all([
        loadLoans(tenantId, today),
        BankAccount.find({ tenantId: tenantKey(tenantId), status: { $ne: "inactive" } }, { bankName: 1, accountType: 1 }).lean(),
    ]);
    const active = loans.filter((l) => l.health !== "closed");
    return {
        today,
        loans,
        totals: {
            active: active.length,
            pending: round2(active.reduce((s, l) => s + l.pending, 0)),
            paid: round2(loans.reduce((s, l) => s + l.paid, 0)),
            monthlyEmi: round2(active.reduce((s, l) => s + l.emi, 0)),
            overdue: active.filter((l) => l.health === "overdue").length,
        },
        banks: accounts.map((a) => ({ id: String(a._id), name: String(a.bankName ?? ""), type: String(a.accountType ?? "") })),
    };
}

/* ---------------------------------------------------------------------------------------------------- Reconciliation */

export class NotFound extends Error {
    readonly status = 404;
}

export async function buildBankReconciliation(tenantId: string, accountId: string, range: { from: string; to: string }) {
    const tid = tenantKey(tenantId);
    if (!mongoose.Types.ObjectId.isValid(accountId)) throw new NotFound("Bank account not found");
    const account = await BankAccount.findOne({ _id: accountId, tenantId: tid }, { bankName: 1, accountType: 1, currentBalance: 1 }).lean();
    if (!account) throw new NotFound("Bank account not found");
    const users = await tenantUsers(tenantId);
    const when = { $gte: istStart(range.from), $lt: istEndExclusive(range.to) };

    const [txns, stmt] = await Promise.all([
        CashbankTransaction.find({ userId: { $in: users.strings }, date: when, $or: [{ fromAccount: accountId }, { toAccount: accountId }, { fromAccount: account._id }, { toAccount: account._id }] },
            { type: 1, amount: 1, fromAccount: 1, toAccount: 1, description: 1, reference: 1, date: 1, reconciled: 1 }).sort({ date: 1 }).lean(),
        BankStatementTransaction.find({ userId: { $in: users.ids }, date: when }, { date: 1, amount: 1, type: 1, description: 1, reference: 1, balance: 1, status: 1 }).sort({ date: 1 }).lean(),
    ]);

    const entries: LedgerEntry[] = txns.map((t) => ({
        id: String(t._id), date: dateOf(t.date) ?? range.from, amount: round2(n(t.amount)),
        // Into this account = credit on the bank statement; out of it = debit.
        direction: String(t.toAccount) === accountId ? "credit" : "debit",
        description: String(t.description ?? ""), reference: String(t.reference ?? ""), reconciled: !!t.reconciled,
    }));
    const lines: StatementLine[] = stmt.map((s) => ({
        id: String(s._id), date: dateOf(s.date) ?? range.from, amount: round2(Math.abs(n(s.amount))), type: s.type === "debit" ? "debit" : "credit",
        description: String(s.description ?? ""), reference: String(s.reference ?? ""),
        balance: s.balance === undefined || s.balance === null ? null : round2(n(s.balance)), reconciled: s.status === "reconciled",
    }));
    const matches = suggestMatches(lines, entries);
    return {
        range,
        account: { id: accountId, name: String(account.bankName ?? ""), type: String(account.accountType ?? ""), erpBalance: round2(n(account.currentBalance)) },
        summary: reconciliationSummary(lines, entries, matches),
        matches,
        lines,
        entries,
        asOf: todayIst(),
        source: "mongo" as const,
    };
}

/** Marks confirmed pairs as reconciled on both sides. Only this tenant's records are touched. */
export async function confirmMatches(tenantId: string, userId: string, pairs: { statementId: string; entryId: string }[]) {
    const valid = pairs.filter((p) => mongoose.Types.ObjectId.isValid(p.statementId) && mongoose.Types.ObjectId.isValid(p.entryId));
    if (!valid.length) return { matched: 0 };
    const users = await tenantUsers(tenantId);
    const now = new Date();
    const [s, e] = await Promise.all([
        BankStatementTransaction.updateMany({ _id: { $in: valid.map((p) => p.statementId) }, userId: { $in: users.ids } }, { $set: { status: "reconciled" } }),
        CashbankTransaction.updateMany({ _id: { $in: valid.map((p) => p.entryId) }, userId: { $in: users.strings } },
            { $set: { reconciled: true, reconciledDate: now, reconciledBy: new mongoose.Types.ObjectId(userId) } }),
    ]);
    return { matched: Math.min(s.modifiedCount, e.modifiedCount) };
}
