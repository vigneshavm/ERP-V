/**
 * Read-only adapters that give the finance screens' three feeds (transactions, cheques, daily records) from
 * Textilesoft's existing tables -- nothing is created or written. Built on sqlCashBank.ts / sqlExpenses.ts:
 *   transactions  dbo.CashInOutEntry (cash in/out at counters) + dbo.BankTransEntry (bank in/out)
 *   cheques       dbo.BankTransEntry rows that carry a cheque number (ChqNo, ChqDate, ChqStatus)
 *   daily records dbo.sales2 tender split per day + dbo.closepattycash (counted cash) + dbo.expenseentry
 * A section whose table is missing or unreadable is simply absent from the result (never invented).
 */
import { sqlDate } from "./sqlDates.js";
import { SESSION_PREFIX } from "./mapping.js";
import { getPool } from "./sqlItemSource.js";
import { sqlCashBank, type CashBankRange } from "./sqlCashBank.js";
import { listSqlExpenses } from "./sqlExpenses.js";

type Row = Record<string, unknown>;
const num = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const r2 = (n: number): number => Math.round(n * 100) / 100;
const str = (v: unknown): string => (v === null || v === undefined ? "" : String(v).trim());
const D = sqlDate;

export const isoDay = (d: Date): string => d.toISOString().slice(0, 10);

/** from/to (YYYY-MM-DD) from a query, defaulting to the last 90 days. */
export function rangeFrom(q: { from?: unknown; to?: unknown }): CashBankRange {
  const ok = (v: unknown) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
  const to = ok(q.to) ? String(q.to) : isoDay(new Date());
  const from = ok(q.from) ? String(q.from) : isoDay(new Date(Date.now() - 90 * 86400000));
  return { from, to };
}

export async function financeTransactions(range: CashBankRange) {
  const cb = await sqlCashBank(range);
  const out: Record<string, unknown>[] = [];
  if (cb.cash.available) {
    for (const r of cb.cash.rows) {
      const amount = r.in > 0 ? r.in : r.out;
      if (!amount) continue;
      out.push({
        id: `sql-cash-${r.date}-${r.counter}-${r.bill}-${r.in > 0 ? "in" : "out"}`,
        type: r.in > 0 ? "cash_in" : "cash_out", category: "Cash", amount, date: r.date,
        description: [r.party, r.cashier && `by ${r.cashier}`, r.counter && `@ ${r.counter}`].filter(Boolean).join(" "),
        paymentMethod: "cash", source: "sql",
      });
    }
  }
  if (cb.bank.available) {
    for (const r of cb.bank.rows) {
      const amount = r.in > 0 ? r.in : r.out;
      if (!amount) continue;
      out.push({
        id: `sql-bank-${r.tranNo || r.date}-${r.account}-${r.in > 0 ? "in" : "out"}`,
        type: r.in > 0 ? "bank_in" : "bank_out", category: r.name || "Bank", amount, date: r.date,
        description: [r.bank, r.account, r.remarks].filter(Boolean).join(" · "),
        paymentMethod: r.mode || "bank", source: "sql",
      });
    }
  }
  return out.sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

export async function financeCheques(range: CashBankRange) {
  try {
    const pool = await getPool();
    // Cheque columns differ between Textilesoft installs: read what exists instead of assuming.
    const colsRes = await pool.request().query(
      "SELECT COLUMN_NAME AS c FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='dbo' AND TABLE_NAME='BankTransEntry'",
    );
    const have = new Set(((colsRes?.recordset ?? []) as Row[]).map((r) => str(r.c).toLowerCase()));
    if (!have.has("chqno")) return [];
    const col = (name: string, alias: string, fallback = "''") => (have.has(name.toLowerCase()) ? `[${name}]` : fallback) + ` AS ${alias}`;
    const num0 = (name: string, alias: string) =>
      have.has(name.toLowerCase()) ? `ISNULL(TRY_CAST([${name}] AS float), 0) AS ${alias}` : `CAST(0 AS float) AS ${alias}`;
    const dateExpr = have.has("chqdate") && have.has("tranentrydate")
      ? `COALESCE(${D("[ChqDate]")}, ${D("[TranEntryDate]")})`
      : have.has("chqdate") ? D("[ChqDate]") : have.has("tranentrydate") ? D("[TranEntryDate]") : "CAST(NULL AS date)";
    const req = pool.request();
    req.input("f", range.from);
    req.input("t", range.to);
    const res = await req.query(
      SESSION_PREFIX +
        `SELECT TOP (2000) CONVERT(varchar(10), d, 23) AS d, tranNo, chq, bank, party, status, tin, tout, remarks FROM (
           SELECT ${dateExpr} AS d, ${col("TranNo", "tranNo")}, [ChqNo] AS chq, ${col("BankName", "bank")},
                  ${col("AccountName", "party")}, ${col("ChqStatus", "status")}, ${num0("TranInAmount", "tin")},
                  ${num0("TranOutAmount", "tout")}, ${col("Remarks", "remarks")}
             FROM dbo.[BankTransEntry] WHERE NULLIF(LTRIM(RTRIM(CAST([ChqNo] AS varchar(100)))), '') IS NOT NULL) x
          WHERE d >= CAST(@f AS date) AND d <= CAST(@t AS date) ORDER BY d DESC`,
    );
    return ((res?.recordset ?? []) as Row[]).map((r) => {
      const s = str(r.status).toLowerCase();
      return {
        id: `sql-chq-${str(r.tranNo)}-${str(r.chq)}`,
        number: str(r.chq), bankName: str(r.bank), payee: str(r.party),
        amount: r2(num(r.tin) > 0 ? num(r.tin) : num(r.tout)), date: str(r.d),
        status: /bounc|return|dishon/.test(s) ? "BOUNCED" : /clear|pass|credit/.test(s) ? "CLEARED" : "PENDING",
        type: num(r.tin) > 0 ? "RECEIVED" : "ISSUED", notes: str(r.remarks), source: "sql",
      };
    });
  } catch (e) {
    console.error("[finance] cheques unavailable:", (e as Error)?.message);
    return [];
  }
}

export async function financeDaily(range: CashBankRange) {
  const cb = await sqlCashBank(range);
  const days = new Map<string, Record<string, any>>();
  const day = (date: string) => {
    let d = days.get(date);
    if (!d) {
      d = { id: `sql-day-${date}`, date, cashSales: 0, onlineSales: 0, totalSales: 0, expenses: 0, cashInDrawer: 0, source: "sql" };
      days.set(date, d);
    }
    return d;
  };
  if (cb.takings.available) {
    for (const t of cb.takings.days) {
      const d = day(t.date);
      d.cashSales = t.cash; d.onlineSales = r2(t.card + t.upi + t.selfPay); d.totalSales = t.total;
    }
  }
  if (cb.dayClose.available) {
    for (const c of cb.dayClose.rows) {
      const d = day(c.date);
      d.cashInDrawer = r2((d.cashInDrawer as number) + c.counted);
    }
  }
  let expensesNote = "";
  try {
    for (const e of await listSqlExpenses()) {
      const date = isoDay(e.date);
      if (date < range.from || date > range.to) continue;
      const d = day(date);
      d.expenses = r2((d.expenses as number) + e.amount);
    }
  } catch {
    expensesNote = "Expenses could not be read from Textilesoft (dbo.expenseentry).";
  }
  return [...days.values()]
    .map((d): Record<string, any> => Object.assign({}, d, { notes: expensesNote || undefined }))
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
}
