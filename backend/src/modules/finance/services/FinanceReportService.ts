import mongoose from "mongoose";
import Invoice from "../../sales/models/Invoice.js";
import Return from "../../sales/models/Return.js";
import PaymentIn from "../../sales/models/PaymentIn.js";
import Bill from "../models/Bill.js";
import CashbankTransaction from "../models/CashbankTransaction.js";
import PaymentOut from "../../purchase/models/PaymentOut.js";
import PurchasePayment from "../../purchase/models/PurchasePayment.js";
import Expense from "../../expense/models/Expense.js";
import User from "../../core/models/User.js";
import { isSqlItemSource } from "../../../config/itemDataSource.js";
import {
    shopBarcodeCosts, shopBillCosts, shopCancelledBills, shopFinanceAsOf, shopPurchases, shopSalesBills, shopTopItems, type ShopRange,
} from "../../../integrations/textilesoft/sqlFinance.js";
import { tableQuery, type TableQuery } from "../../core/services/tableQuery.js";
import {
    ENTRY_TYPE_LABEL, all, billProfit, byDay, byType, chronological, erpInvoiceSplit, flowTotals, inflow, modeOf, outflow,
    profitTotals, round2, shopBillSplit, type BillProfit, type EntryType, type FinanceEntry, type Mode,
} from "./financeMath.js";

/**
 * Financial reports: Day Book, All Transactions, Cash Flow, P&L and Bill-wise Profit.
 *
 * Sources
 *   shop (ITEM_DATA_SOURCE=sql)  Textilesoft sales bills (payment split), GRNs and purchase returns, lot costs
 *   ERP (MongoDB)                invoices, sales returns, customer receipts, supplier bills, supplier payments
 *                                (PaymentOut and PurchasePayment), expenses, cash-book entries
 * Scope
 *   Invoice / Bill / PaymentOut / PurchasePayment carry tenantId. Expense, PaymentIn, Return and cash-book entries
 *   carry only the user who created them, so they are included when that user belongs to the shop (tenant).
 * Double counting
 *   A supplier bill counts only what was paid when it was created (paidAmount − later PaymentOut allocations);
 *   later payments count through their own PaymentOut record. ERP Purchase documents are not used (the Bill is
 *   the supplier's invoice), the same rule as the GST reports.
 * Profit
 *   Cost = quantity × the lot's purchase rate (excl. GST). Shop lines and ERP lines of shop items use the barcode's
 *   rate from the shop database; other ERP lines use the item's cost price. Uncosted lines are left out of both sales
 *   and cost and reported as coverage (the Party P&L rule).
 */

type Source = "sql" | "mongo";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Doc = Record<string, any>;

const IST_OFFSET_MS = 5.5 * 3_600_000;
const istStart = (d: string) => new Date(`${d}T00:00:00+05:30`);
const istEndExclusive = (d: string) => new Date(istStart(d).getTime() + 86_400_000);
const istDate = (d: Date): string => new Date(d.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
const istTime = (d: Date): string => new Date(d.getTime() + IST_OFFSET_MS).toISOString().slice(11, 16);
const todayIst = (): string => istDate(new Date());

const n = (v: unknown): number => {
    const x = Number(v);
    return Number.isFinite(x) ? x : 0;
};
const s = (v: unknown): string => String(v ?? "").trim();
const sourceOf = (): Source => (isSqlItemSource() ? "sql" : "mongo");

export interface FinanceRange { from: string; to: string }

export const parseFinanceRange = (from: unknown, to: unknown): FinanceRange | null => {
    const ok = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
    if (!ok(from) || !ok(to) || from > to) return null;
    return { from, to };
};

const tenantKey = (tenantId: string) => (mongoose.Types.ObjectId.isValid(tenantId) ? new mongoose.Types.ObjectId(tenantId) : tenantId);

async function tenantUserIds(tenantId: string): Promise<mongoose.Types.ObjectId[]> {
    const users = await User.find({ tenantId: tenantKey(tenantId) }, { _id: 1 }).lean();
    return users.map((u) => u._id as mongoose.Types.ObjectId);
}

const dateFilter = (r: FinanceRange) => ({ $gte: istStart(r.from), $lt: istEndExclusive(r.to) });
const whenOf = (d: unknown) => {
    const date = d instanceof Date ? d : new Date(String(d));
    return Number.isNaN(date.getTime()) ? { date: "", time: null } : { date: istDate(date), time: istTime(date) };
};

/* ------------------------------------------------------------------------------------------------ Shop entries */

interface ShopData {
    entries: FinanceEntry[];
    overpaidBills: number;
    returnsAvailable: boolean;
    asOf: string | null;
}

async function shopEntries(range: ShopRange): Promise<ShopData> {
    if (!isSqlItemSource()) return { entries: [], overpaidBills: 0, returnsAvailable: true, asOf: null };
    const [bills, purchases, asOf] = await Promise.all([shopSalesBills(range), shopPurchases(range), shopFinanceAsOf()]);
    let overpaid = 0;
    const entries: FinanceEntry[] = [];
    for (const b of bills) {
        const split = shopBillSplit(b.total, b.card, b.upi, b.creditAmt, b.self);
        if (split.overpaid) overpaid += 1;
        entries.push(inflow({ source: "shop", type: "sale", date: b.date, time: b.time, ref: b.billNo, party: b.customer, amount: round2(b.total), note: "" }, split));
    }
    for (const p of purchases.docs) {
        const base = { source: "shop" as const, date: p.date, time: null, ref: p.doc, party: p.supplier, amount: round2(p.value), note: p.payType ? `Pay type: ${p.payType}` : "" };
        if (p.kind === "purchase") {
            // A GRN's pay_type says how it was paid; unknown or credit terms mean nothing was paid yet.
            const mode: Mode = p.payType ? modeOf(p.payType) : "credit";
            entries.push(outflow({ ...base, type: "purchase" }, all(round2(p.value), mode)));
        } else {
            // How a purchase return was settled is not recorded: it reduces what is owed, not cash.
            entries.push(inflow({ ...base, type: "purchase-return", note: "Settlement not recorded" }, all(round2(p.value), "credit")));
        }
    }
    return { entries, overpaidBills: overpaid, returnsAvailable: purchases.returnsAvailable, asOf };
}

/* ------------------------------------------------------------------------------------------------ ERP entries */

async function erpEntries(tenantId: string, range: FinanceRange): Promise<FinanceEntry[]> {
    const users = await tenantUserIds(tenantId);
    const tid = String(tenantId);
    const [invoices, returns, receipts, bills, payOuts, purchasePays, expenses, cashbook] = await Promise.all([
        Invoice.find({ tenantId: tenantKey(tenantId), isDeleted: { $ne: true }, fulfillmentStatus: { $nin: ["CANCELLED", "REFUNDED"] }, createdAt: dateFilter(range) },
            { invoiceNo: 1, createdAt: 1, customer: 1, totalAmount: 1, paidAmount: 1, paymentMethod: 1, splitPaymentDetails: 1 })
            .populate("customer", "name").lean(),
        Return.find({ createdBy: { $in: users }, status: { $in: ["processed", "refunded"] }, returnDate: dateFilter(range) },
            { returnId: 1, returnDate: 1, customerName: 1, totalReturnAmount: 1, refundMethod: 1, actualRefundMethod: 1 }).lean(),
        PaymentIn.find({ createdBy: { $in: users }, paymentDate: dateFilter(range) },
            { receiptNumber: 1, paymentDate: 1, customer: 1, totalAmount: 1, paymentMethods: 1 })
            .populate("customer", "name").lean(),
        Bill.find({ tenantId: tid, status: { $in: ["approved", "paid", "unpaid", "overdue"] }, date: dateFilter(range) },
            { billNo: 1, vendorInvoiceNo: 1, date: 1, supplier: 1, amount: 1, paidAmount: 1, paymentMethod: 1 })
            .populate("supplier", "name").lean(),
        PaymentOut.find({ tenantId: tid, status: { $nin: ["cancelled", "bounced"] }, paymentDate: dateFilter(range) },
            { paymentNo: 1, paymentDate: 1, supplierId: 1, amount: 1, paymentMode: 1, referenceNo: 1 })
            .populate("supplierId", "name").lean(),
        PurchasePayment.find({ tenantId: tid, paymentDate: dateFilter(range) }, { paymentNo: 1, paymentDate: 1, supplierId: 1, amount: 1, paymentMethod: 1 })
            .populate("supplierId", "name").lean(),
        Expense.find({ createdBy: { $in: users }, date: dateFilter(range) }, { expenseNo: 1, date: 1, category: 1, amount: 1, paymentMethod: 1, description: 1 }).lean(),
        CashbankTransaction.find({ userId: { $in: users.map(String) }, date: dateFilter(range) },
            { type: 1, amount: 1, fromAccount: 1, toAccount: 1, description: 1, date: 1, reference: 1 }).lean(),
    ]);

    // What PaymentOut records have paid against these bills (any date), so a bill counts only its paid-at-creation part.
    const billIds = (bills as Doc[]).map((b) => b._id);
    const allocated = new Map<string, number>();
    if (billIds.length) {
        const rows = await PaymentOut.aggregate([
            { $match: { tenantId: tid, status: { $nin: ["cancelled", "bounced"] }, "allocations.billId": { $in: billIds } } },
            { $unwind: "$allocations" },
            { $match: { "allocations.billId": { $in: billIds } } },
            { $group: { _id: "$allocations.billId", amount: { $sum: "$allocations.amount" } } },
        ]);
        for (const r of rows as Doc[]) allocated.set(String(r._id), n(r.amount));
    }

    const out: FinanceEntry[] = [];
    for (const inv of invoices as Doc[]) {
        out.push(inflow({ source: "erp", type: "sale", ...whenOf(inv.createdAt), ref: s(inv.invoiceNo), party: s(inv.customer?.name) || "Walk-in", amount: round2(n(inv.totalAmount)), note: "" }, erpInvoiceSplit(inv)));
    }
    for (const r of returns as Doc[]) {
        const amount = round2(n(r.totalReturnAmount));
        const method = r.actualRefundMethod ?? (r.refundMethod === "original_payment" ? "bank" : r.refundMethod);
        out.push(outflow({ source: "erp", type: "sale-return", ...whenOf(r.returnDate), ref: s(r.returnId), party: s(r.customerName), amount, note: `Refund: ${s(method) || "not recorded"}` }, all(amount, modeOf(method))));
    }
    for (const p of receipts as Doc[]) {
        const split = { cash: 0, bank: 0, credit: 0 };
        const methods = (p.paymentMethods ?? []) as Doc[];
        if (methods.length) for (const m of methods) split[modeOf(m.method) === "cash" ? "cash" : "bank"] += n(m.amount);
        else split.cash += n(p.totalAmount);
        out.push(inflow({ source: "erp", type: "receipt", ...whenOf(p.paymentDate), ref: s(p.receiptNumber), party: s(p.customer?.name), amount: round2(n(p.totalAmount)), note: "" }, { cash: round2(split.cash), bank: round2(split.bank), credit: 0 }));
    }
    for (const b of bills as Doc[]) {
        const amount = round2(n(b.amount));
        const paidAtCreation = Math.min(amount, Math.max(0, n(b.paidAmount) - (allocated.get(String(b._id)) ?? 0)));
        const mode = modeOf(b.paymentMethod);
        const paidMode = mode === "credit" ? "cash" : mode;
        out.push(outflow(
            { source: "erp", type: "purchase", ...whenOf(b.date), time: null, ref: s(b.billNo), party: s(b.supplier?.name), amount, note: b.vendorInvoiceNo ? `Supplier inv ${s(b.vendorInvoiceNo)}` : "" },
            { cash: paidMode === "cash" ? round2(paidAtCreation) : 0, bank: paidMode === "bank" ? round2(paidAtCreation) : 0, credit: round2(amount - paidAtCreation) },
        ));
    }
    for (const p of payOuts as Doc[]) {
        const amount = round2(n(p.amount));
        // A "Discount Received" entry settles the bill without money moving.
        const mode: Mode = p.paymentMode === "Discount Received" ? "credit" : modeOf(p.paymentMode);
        out.push(outflow({ source: "erp", type: "supplier-payment", ...whenOf(p.paymentDate), ref: s(p.paymentNo), party: s(p.supplierId?.name), amount, note: s(p.referenceNo) }, all(amount, mode)));
    }
    for (const p of purchasePays as Doc[]) {
        const amount = round2(n(p.amount));
        out.push(outflow({ source: "erp", type: "supplier-payment", ...whenOf(p.paymentDate), ref: s(p.paymentNo), party: s(p.supplierId?.name), amount, note: "" }, all(amount, modeOf(p.paymentMethod))));
    }
    for (const e of expenses as Doc[]) {
        const amount = round2(n(e.amount));
        out.push(outflow({ source: "erp", type: "expense", ...whenOf(e.date), ref: s(e.expenseNo), party: s(e.category), amount, note: s(e.description) }, all(amount, modeOf(e.paymentMethod))));
    }
    for (const c of cashbook as Doc[]) {
        const amount = round2(n(c.amount));
        const base = { source: "erp" as const, ...whenOf(c.date), ref: s(c.reference), party: "", amount, note: s(c.description) };
        const isCash = (acct: unknown) => s(acct).toLowerCase() === "cash";
        if (c.type === "in") out.push(inflow({ ...base, type: "cash-in" }, all(amount, isCash(c.toAccount) ? "cash" : "bank")));
        else if (c.type === "out") out.push(outflow({ ...base, type: "cash-out" }, all(amount, isCash(c.fromAccount) ? "cash" : "bank")));
        else out.push({ ...base, type: "transfer", note: `${isCash(c.fromAccount) ? "Cash" : "Bank"} → ${isCash(c.toAccount) ? "cash" : "bank"}${base.note ? ` · ${base.note}` : ""}`, cashIn: 0, bankIn: 0, cashOut: 0, bankOut: 0, credit: 0 });
    }
    return out;
}

async function allEntries(tenantId: string, range: FinanceRange) {
    const [shop, erp] = await Promise.all([shopEntries(range), erpEntries(tenantId, range)]);
    return { entries: [...shop.entries, ...erp].sort(chronological), shop };
}

const shopChecks = (shop: ShopData) => ({
    /** Shop bills whose card/UPI/other split exceeds the bill total (capped at the total). */
    overpaidShopBills: shop.overpaidBills,
    returnsAvailable: shop.returnsAvailable,
});

/* ------------------------------------------------------------------------------------------------ Transactions */

export interface TransactionQuery extends TableQuery {
    type?: string;
    mode?: string;
    source?: string;
}

function filterEntries(list: FinanceEntry[], q: TransactionQuery): FinanceEntry[] {
    let out = list;
    if (q.type && q.type in ENTRY_TYPE_LABEL) out = out.filter((e) => e.type === q.type);
    if (q.source === "shop" || q.source === "erp") out = out.filter((e) => e.source === q.source);
    if (q.mode === "cash") out = out.filter((e) => e.cashIn > 0 || e.cashOut > 0);
    if (q.mode === "bank") out = out.filter((e) => e.bankIn > 0 || e.bankOut > 0);
    if (q.mode === "credit") out = out.filter((e) => e.credit > 0);
    return out;
}

const withLabel = (e: FinanceEntry) => ({ ...e, typeLabel: ENTRY_TYPE_LABEL[e.type] });

export async function buildTransactions(tenantId: string, range: FinanceRange, q: TransactionQuery) {
    const { entries, shop } = await allEntries(tenantId, range);
    const filtered = filterEntries(entries, q);
    const t = tableQuery(filtered, q, {
        searchIn: (e) => [e.ref, e.party, e.note, ENTRY_TYPE_LABEL[e.type]],
        sortable: {
            date: (e) => `${e.date} ${e.time ?? ""}`, ref: (e) => e.ref, party: (e) => e.party, type: (e) => ENTRY_TYPE_LABEL[e.type],
            amount: (e) => e.amount, in: (e) => e.cashIn + e.bankIn, out: (e) => e.cashOut + e.bankOut,
        },
        fallback: (a, b) => -chronological(a, b),
        tieBreak: (e) => `${e.source}:${e.type}:${e.ref}`,
    });
    const matched = t.matched;
    return {
        range,
        totals: flowTotals(matched),
        byType: byType(matched),
        items: t.items.map(withLabel),
        pagination: t.pagination,
        sort: t.sort,
        dir: t.dir,
        checks: shopChecks(shop),
        asOf: shop.asOf,
        source: sourceOf(),
    };
}

/* ------------------------------------------------------------------------------------------------ Day Book */

export async function buildDayBook(tenantId: string, date?: string) {
    // Default: the latest day with shop data (the restored copy lags real time), else today.
    const day = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : (isSqlItemSource() ? (await shopFinanceAsOf()) ?? todayIst() : todayIst());
    const range = { from: day, to: day };
    const { entries, shop } = await allEntries(tenantId, range);
    return {
        date: day,
        totals: flowTotals(entries),
        byType: byType(entries),
        entries: entries.map(withLabel),
        checks: shopChecks(shop),
        asOf: shop.asOf,
        source: sourceOf(),
    };
}

/* ------------------------------------------------------------------------------------------------ Cash Flow */

export async function buildCashFlow(tenantId: string, range: FinanceRange) {
    const { entries, shop } = await allEntries(tenantId, range);
    const moving = entries.filter((e) => e.type !== "transfer");
    const t = flowTotals(moving);
    const types = byType(moving);
    const pick = (type: EntryType) => types.find((r) => r.type === type);
    return {
        range,
        totals: t,
        inflows: types.filter((r) => r.cashIn + r.bankIn > 0).map((r) => ({ type: r.type, label: r.label, cash: r.cashIn, bank: r.bankIn, total: round2(r.cashIn + r.bankIn), entries: r.entries })),
        outflows: types.filter((r) => r.cashOut + r.bankOut > 0).map((r) => ({ type: r.type, label: r.label, cash: r.cashOut, bank: r.bankOut, total: round2(r.cashOut + r.bankOut), entries: r.entries })),
        /** Billed but not paid in the period: sales given on credit, purchases taken on credit. */
        credit: { sales: round2(pick("sale")?.credit ?? 0), purchases: round2(pick("purchase")?.credit ?? 0) },
        transfers: entries.filter((e) => e.type === "transfer").length,
        byDay: byDay(moving).map((d) => ({ date: d.date, inflow: round2(d.cashIn + d.bankIn), outflow: round2(d.cashOut + d.bankOut), net: d.net, cashNet: round2(d.cashIn - d.cashOut), bankNet: round2(d.bankIn - d.bankOut) })),
        checks: shopChecks(shop),
        asOf: shop.asOf,
        source: sourceOf(),
    };
}

/* ------------------------------------------------------------------------------------------------ Profit */

export interface ProfitRow extends BillProfit {
    source: "shop" | "erp";
    kind: "bill" | "return";
    id: string;
    ref: string;
    date: string;
    time: string | null;
    party: string;
    total: number;
    gst: number;
}

interface CostLookup {
    shopCost: Map<string, number>;
}

/** ERP line cost: shop lot rate by barcode (SQL mode), else the item's cost price; undefined when neither is known. */
function erpUnitCost(item: Doc | undefined, lookup: CostLookup): number | undefined {
    const bc = s(item?.barcode);
    const shop = bc ? lookup.shopCost.get(bc) : undefined;
    if (shop !== undefined) return shop;
    const cp = n(item?.costPrice);
    return cp > 0 ? cp : undefined;
}

async function profitRows(tenantId: string, range: FinanceRange): Promise<{ rows: ProfitRow[]; asOf: string | null }> {
    const sql = isSqlItemSource();
    const users = await tenantUserIds(tenantId);
    const [bills, billCosts, shopCost, asOf, invoices, returns] = await Promise.all([
        sql ? shopSalesBills(range) : Promise.resolve([]),
        sql ? shopBillCosts(range) : Promise.resolve(new Map()),
        sql ? shopBarcodeCosts() : Promise.resolve(new Map<string, number>()),
        sql ? shopFinanceAsOf() : Promise.resolve(null),
        Invoice.find({ tenantId: tenantKey(tenantId), isDeleted: { $ne: true }, fulfillmentStatus: { $nin: ["CANCELLED", "REFUNDED"] }, createdAt: dateFilter(range) },
            { invoiceNo: 1, createdAt: 1, customer: 1, totalAmount: 1, tax: 1, items: 1 })
            .populate("customer", "name").populate("items.item", "costPrice barcode").lean(),
        Return.find({ createdBy: { $in: users }, status: { $in: ["processed", "refunded"] }, returnDate: dateFilter(range) },
            { returnId: 1, returnDate: 1, customerName: 1, totalReturnAmount: 1, taxAmount: 1, items: 1 })
            .populate("items.product", "costPrice barcode").lean(),
    ]);
    const lookup: CostLookup = { shopCost };
    const rows: ProfitRow[] = [];

    for (const b of bills) {
        const c = billCosts.get(b.id) ?? { lineValue: 0, uncosted: 0, cost: 0 };
        rows.push({ source: "shop", kind: "bill", id: b.id, ref: b.billNo, date: b.date, time: b.time, party: b.customer, total: round2(b.total), gst: round2(b.gst), ...billProfit(b.total, b.gst, c.lineValue, c.uncosted, c.cost) });
    }
    for (const inv of invoices as Doc[]) {
        let lineValue = 0, uncosted = 0, cost = 0, tax = 0;
        for (const it of (inv.items ?? []) as Doc[]) {
            const value = n(it.total ?? n(it.price) * n(it.quantity));
            tax += n(it.cgst) + n(it.sgst) + n(it.igst) || n(it.tax);
            lineValue += value;
            const unit = erpUnitCost(it.item, lookup);
            if (unit === undefined) uncosted += value; else cost += unit * n(it.quantity);
        }
        const gst = n(inv.tax) || tax;
        const w = whenOf(inv.createdAt);
        rows.push({ source: "erp", kind: "bill", id: String(inv._id), ref: s(inv.invoiceNo), ...w, party: s(inv.customer?.name) || "Walk-in", total: round2(n(inv.totalAmount)), gst: round2(gst), ...billProfit(n(inv.totalAmount), gst, lineValue, uncosted, cost) });
    }
    for (const r of returns as Doc[]) {
        let lineValue = 0, uncosted = 0, cost = 0;
        for (const it of (r.items ?? []) as Doc[]) {
            const value = n(it.lineTotal);
            lineValue += value;
            const unit = erpUnitCost(it.product, lookup);
            if (unit === undefined) uncosted += value; else cost += unit * n(it.returnedQty);
        }
        // A return reverses sales and cost: negative amounts.
        const p = billProfit(n(r.totalReturnAmount), n(r.taxAmount), lineValue, uncosted, cost);
        const w = whenOf(r.returnDate);
        rows.push({
            source: "erp", kind: "return", id: String(r._id), ref: s(r.returnId), ...w, party: s(r.customerName),
            total: -round2(n(r.totalReturnAmount)), gst: -round2(n(r.taxAmount)),
            netSales: -p.netSales, coverage: p.coverage, cost: -p.cost, profit: -p.profit, marginPct: p.marginPct,
        });
    }
    return { rows, asOf };
}

export interface BillProfitQuery extends TableQuery {
    source?: string;
    show?: string; // 'loss' | 'uncosted'
}

export async function buildBillProfit(tenantId: string, range: FinanceRange, q: BillProfitQuery) {
    const { rows, asOf } = await profitRows(tenantId, range);
    let list = rows;
    if (q.source === "shop" || q.source === "erp") list = list.filter((r) => r.source === q.source);
    if (q.show === "loss") list = list.filter((r) => r.profit < 0);
    if (q.show === "uncosted") list = list.filter((r) => r.coverage < 1);
    const t = tableQuery(list, q, {
        searchIn: (r) => [r.ref, r.party],
        sortable: {
            date: (r) => `${r.date} ${r.time ?? ""}`, ref: (r) => r.ref, party: (r) => r.party, netSales: (r) => r.netSales,
            cost: (r) => r.cost, profit: (r) => r.profit, marginPct: (r) => r.marginPct, coverage: (r) => r.coverage,
        },
        fallback: (a, b) => b.date.localeCompare(a.date) || (b.time ?? "").localeCompare(a.time ?? ""),
        tieBreak: (r) => `${r.source}:${r.kind}:${r.id}`,
    });
    const matched = t.matched;
    return {
        range,
        summary: profitTotals(matched),
        lossBills: matched.filter((r) => r.profit < 0).length,
        items: t.items,
        pagination: t.pagination,
        sort: t.sort,
        dir: t.dir,
        asOf,
        source: sourceOf(),
    };
}

/* ------------------------------------------------------------------------------------------------ P&L */

export async function buildProfitLoss(tenantId: string, range: FinanceRange) {
    const users = await tenantUserIds(tenantId);
    const [{ rows, asOf }, expenses] = await Promise.all([
        profitRows(tenantId, range),
        Expense.find({ createdBy: { $in: users }, date: dateFilter(range) }, { date: 1, category: 1, amount: 1 }).lean(),
    ]);
    const sales = rows.filter((r) => r.kind === "bill");
    const rets = rows.filter((r) => r.kind === "return");
    const overall = profitTotals(rows);

    const byCategory = new Map<string, number>();
    for (const e of expenses as Doc[]) byCategory.set(s(e.category) || "Other", (byCategory.get(s(e.category) || "Other") ?? 0) + n(e.amount));
    const expenseTotal = round2([...byCategory.values()].reduce((a, b) => a + b, 0));

    const months = [...new Set([...rows.map((r) => r.date.slice(0, 7)), ...(expenses as Doc[]).map((e) => whenOf(e.date).date.slice(0, 7))])].filter(Boolean).sort();
    const byMonth = months.map((m) => {
        const t = profitTotals(rows.filter((r) => r.date.startsWith(m)));
        const exp = round2((expenses as Doc[]).filter((e) => whenOf(e.date).date.startsWith(m)).reduce((a, e) => a + n(e.amount), 0));
        return { month: m, netSales: t.netSales, costedSales: t.costedSales, cost: t.cost, grossProfit: t.grossProfit, expenses: exp, netProfit: round2(t.grossProfit - exp) };
    });

    return {
        range,
        sales: profitTotals(sales),
        returns: profitTotals(rets),
        total: overall,
        /** Net sales whose cost is unknown: included in net sales, not in gross profit. */
        uncostedSales: round2(overall.netSales - overall.costedSales),
        expenses: { total: expenseTotal, byCategory: [...byCategory].map(([category, amount]) => ({ category, amount: round2(amount) })).sort((a, b) => b.amount - a.amount) },
        netProfit: round2(overall.grossProfit - expenseTotal),
        bySource: { shop: profitTotals(rows.filter((r) => r.source === "shop")), erp: profitTotals(rows.filter((r) => r.source === "erp")) },
        byMonth,
        asOf,
        source: sourceOf(),
    };
}

/* ------------------------------------------------------------------------------------------------ Sales Report */

export interface SalesBillRow {
    source: "shop" | "erp";
    id: string;
    ref: string;
    date: string;
    time: string | null;
    customer: string;
    /** Bill total including GST. */
    value: number;
    gst: number;
    netSales: number;
    cash: number;
    bank: number;
    credit: number;
}

export interface SalesQuery extends TableQuery {
    source?: string;
    mode?: string; // cash | bank | credit
}

const WALK_IN = /^(walk-?in|cash customer)?$/i;

/**
 * Sales Report: every live sale in the period (Textilesoft bills + ERP invoices), with headline totals,
 * a day-by-day series, top customers and items, and the bill list. Cancelled bills are excluded from every
 * figure and reported separately.
 */
export async function buildSalesReport(tenantId: string, range: FinanceRange, q: SalesQuery) {
    const sql = isSqlItemSource();
    const [bills, cancelledShop, topShopItems, asOf, invoices, cancelledErp] = await Promise.all([
        sql ? shopSalesBills(range) : Promise.resolve([]),
        sql ? shopCancelledBills(range) : Promise.resolve({ bills: 0, value: 0 }),
        sql ? shopTopItems(range, 15) : Promise.resolve([]),
        sql ? shopFinanceAsOf() : Promise.resolve(null),
        Invoice.find({ tenantId: tenantKey(tenantId), isDeleted: { $ne: true }, fulfillmentStatus: { $nin: ["CANCELLED", "REFUNDED"] }, createdAt: dateFilter(range) },
            { invoiceNo: 1, createdAt: 1, customer: 1, totalAmount: 1, paidAmount: 1, paymentMethod: 1, splitPaymentDetails: 1, tax: 1, items: 1 })
            .populate("customer", "name").lean(),
        Invoice.aggregate([
            { $match: { tenantId: tenantKey(tenantId), fulfillmentStatus: "CANCELLED", createdAt: dateFilter(range) } },
            { $group: { _id: null, bills: { $sum: 1 }, value: { $sum: "$totalAmount" } } },
        ]),
    ]);

    let overpaid = 0;
    const rows: SalesBillRow[] = bills.map((b) => {
        const sp = shopBillSplit(b.total, b.card, b.upi, b.creditAmt, b.self);
        if (sp.overpaid) overpaid += 1;
        return { source: "shop", id: b.id, ref: b.billNo, date: b.date, time: b.time, customer: b.customer, value: round2(b.total), gst: round2(b.gst), netSales: round2(b.total - b.gst), cash: sp.cash, bank: sp.bank, credit: sp.credit };
    });
    const erpItems = new Map<string, { name: string; qty: number; value: number }>();
    for (const inv of invoices as Doc[]) {
        let tax = 0;
        for (const it of (inv.items ?? []) as Doc[]) {
            tax += n(it.cgst) + n(it.sgst) + n(it.igst) || n(it.tax);
            const name = s(it.name).toUpperCase();
            if (name) {
                const cur = erpItems.get(name) ?? { name, qty: 0, value: 0 };
                cur.qty += n(it.quantity);
                cur.value += n(it.total ?? n(it.price) * n(it.quantity));
                erpItems.set(name, cur);
            }
        }
        const gst = n(inv.tax) || tax;
        const total = n(inv.totalAmount);
        const sp = erpInvoiceSplit(inv);
        rows.push({ source: "erp", id: String(inv._id), ref: s(inv.invoiceNo), ...whenOf(inv.createdAt), customer: s(inv.customer?.name) || "Walk-in", value: round2(total), gst: round2(gst), netSales: round2(total - gst), cash: sp.cash, bank: sp.bank, credit: sp.credit });
    }

    // Summary over every live bill (filters below only narrow the table).
    const sum = (list: SalesBillRow[], k: keyof Pick<SalesBillRow, "value" | "gst" | "netSales" | "cash" | "bank" | "credit">) => round2(list.reduce((a, r) => a + r[k], 0));
    const lastDay = sql && asOf && asOf < range.to ? (asOf < range.from ? range.from : asOf) : range.to;
    const days = Math.max(1, Math.round((Date.parse(`${lastDay}T00:00:00Z`) - Date.parse(`${range.from}T00:00:00Z`)) / 86_400_000) + 1);
    const value = sum(rows, "value");

    const byDayMap = new Map<string, { date: string; value: number; bills: number }>();
    for (const r of rows) {
        const d = byDayMap.get(r.date) ?? { date: r.date, value: 0, bills: 0 };
        d.value += r.value; d.bills += 1;
        byDayMap.set(r.date, d);
    }
    const byDay = [...byDayMap.values()].sort((a, b) => a.date.localeCompare(b.date)).map((d) => ({ ...d, value: round2(d.value) }));
    const best = byDay.reduce<{ date: string; value: number; bills: number } | null>((a, d) => (!a || d.value > a.value ? d : a), null);

    const customers = new Map<string, { name: string; bills: number; value: number }>();
    let walkIn = { bills: 0, value: 0 };
    for (const r of rows) {
        if (WALK_IN.test(r.customer.trim())) { walkIn = { bills: walkIn.bills + 1, value: walkIn.value + r.value }; continue; }
        const key = r.customer.trim().toUpperCase();
        const c = customers.get(key) ?? { name: r.customer.trim(), bills: 0, value: 0 };
        c.bills += 1; c.value += r.value;
        customers.set(key, c);
    }
    const topCustomers = [...customers.values()].sort((a, b) => b.value - a.value).slice(0, 10).map((c) => ({ ...c, value: round2(c.value) }));

    const items = new Map<string, { name: string; qty: number; value: number }>();
    for (const it of [...topShopItems, ...erpItems.values()]) {
        const cur = items.get(it.name) ?? { name: it.name, qty: 0, value: 0 };
        cur.qty += it.qty; cur.value += it.value;
        items.set(it.name, cur);
    }
    const topItems = [...items.values()].sort((a, b) => b.value - a.value).slice(0, 10).map((i) => ({ ...i, qty: Math.round(i.qty * 1000) / 1000, value: round2(i.value) }));

    // Table
    let list = rows;
    if (q.source === "shop" || q.source === "erp") list = list.filter((r) => r.source === q.source);
    if (q.mode === "cash") list = list.filter((r) => r.cash > 0);
    if (q.mode === "bank") list = list.filter((r) => r.bank > 0);
    if (q.mode === "credit") list = list.filter((r) => r.credit > 0);
    const t = tableQuery(list, q, {
        searchIn: (r) => [r.ref, r.customer],
        sortable: { date: (r) => `${r.date} ${r.time ?? ""}`, ref: (r) => r.ref, customer: (r) => r.customer, value: (r) => r.value, netSales: (r) => r.netSales, gst: (r) => r.gst },
        fallback: (a, b) => b.date.localeCompare(a.date) || (b.time ?? "").localeCompare(a.time ?? ""),
        tieBreak: (r) => `${r.source}:${r.id}`,
    });

    const cancelledE = (cancelledErp as Doc[])[0] ?? {};
    return {
        range,
        summary: {
            bills: rows.length,
            value,
            gst: sum(rows, "gst"),
            netSales: sum(rows, "netSales"),
            cash: sum(rows, "cash"),
            bank: sum(rows, "bank"),
            credit: sum(rows, "credit"),
            days,
            avgPerDay: round2(value / days),
            avgBill: rows.length ? round2(value / rows.length) : 0,
            bestDay: best,
        },
        cancelled: { bills: cancelledShop.bills + n(cancelledE.bills), value: round2(cancelledShop.value + n(cancelledE.value)) },
        bySource: {
            shop: { bills: rows.filter((r) => r.source === "shop").length, value: sum(rows.filter((r) => r.source === "shop"), "value") },
            erp: { bills: rows.filter((r) => r.source === "erp").length, value: sum(rows.filter((r) => r.source === "erp"), "value") },
        },
        byDay,
        topCustomers,
        walkIn: { bills: walkIn.bills, value: round2(walkIn.value) },
        topItems,
        items: t.items,
        pagination: t.pagination,
        sort: t.sort,
        dir: t.dir,
        checks: { overpaidShopBills: overpaid },
        asOf,
        source: sourceOf(),
    };
}
