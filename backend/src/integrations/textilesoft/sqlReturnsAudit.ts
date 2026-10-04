import { SESSION_PREFIX, type QueryParam } from "./mapping.js";
import { getPool } from "./sqlItemSource.js";
import type { ReturnDoc } from "../../modules/sales/services/returnAudit.js";

/**
 * Returns for the Returns & Refund Audit, read from the shop database (no MongoDB).
 *
 * A "return" is a bill that carries returned (negative-quantity) lines: a pure return or an exchange. The source
 * bill it came from is known only for returns the ERP made (erp.sales_return_allocation); older Textilesoft
 * returns have no link, so they are listed without a source bill and cannot trip the "refund exceeds the bill" check.
 * The refund method is read from the bill's tender columns: card / UPI present -> bank, only cash -> cash,
 * nothing paid out (credit) -> credit note.
 */

type Row = Record<string, unknown>;
const num = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const str = (v: unknown): string => (v === null || v === undefined ? "" : String(v).trim());

async function run(text: string, params: QueryParam[] = []): Promise<Row[]> {
  const req = (await getPool()).request();
  for (const p of params) req.input(p.name, p.value);
  const res = await req.query(SESSION_PREFIX + text);
  return res ? res.recordset : [];
}

const addDays = (isoDate: string, days: number): string => {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

export interface ShopReturnsData {
  /** Returns from `windowFrom` to `to` (inclusive) - the audit looks back for repeat customers / cashier bursts. */
  window: ReturnDoc[];
  /** All-time value returned per source bill (sysidandbill), from the ERP's own return allocations. */
  returnedBySource: Map<string, number>;
  /** Live sales bills in the period (denominator for the return rate). */
  bills: number;
  /** Returned lines on bills that are not linked to a source bill (older Textilesoft returns). */
  unlinked: number;
}

export async function shopReturnsData(range: { from: string; to: string }, lookbackDays: number): Promise<ShopReturnsData> {
  const windowFrom = addDays(range.from, -lookbackDays);
  const p: QueryParam[] = [
    { name: "wf", value: windowFrom },
    { name: "to", value: range.to },
  ];
  const [rows, billCount] = await Promise.all([
    run(
      `SELECT l.[systemidbill] AS sysid, MAX(h.[billno]) AS billno, MAX(CONVERT(varchar(19), h.[datetime], 126)) AS dt,
              MAX(h.[cus_name]) AS cus, MAX(h.[UserID]) AS userId,
              SUM(ABS(ISNULL(TRY_CAST(l.[net_amount] AS float), ISNULL(TRY_CAST(l.[amount] AS float), 0)))) AS amount,
              SUM(ABS(ISNULL(TRY_CAST(l.[qty] AS float), 0))) AS qty, COUNT(*) AS lines,
              MAX(ISNULL(TRY_CAST(h.[s_recevied_cashamt] AS float), 0)) AS cash,
              MAX(ISNULL(TRY_CAST(h.[s_card_amt] AS float), 0) + ISNULL(TRY_CAST(h.[s_googlepay] AS float), 0)) AS bank
         FROM dbo.[salsntry] l JOIN dbo.[sales2] h ON h.[sysidandbill] = l.[systemidbill]
        WHERE ISNULL(TRY_CAST(l.[qty] AS float), 0) < 0 AND ISNULL(l.[status], '') <> '1' AND ISNULL(h.[status], '') <> '1'
          AND h.[date] >= CAST(@wf AS date) AND h.[date] <= CAST(@to AS date)
        GROUP BY l.[systemidbill]`,
      p,
    ),
    run(
      `SELECT COUNT(*) AS n FROM dbo.[sales2] WHERE ISNULL([status], '') <> '1' AND [date] >= CAST(@f AS date) AND [date] <= CAST(@to AS date)`,
      [{ name: "f", value: range.from }, { name: "to", value: range.to }],
    ),
  ]);

  // Links to the source bill (ERP-made returns only; the table exists once migration 004 has been applied).
  const source = new Map<string, { sysid: string; billno: string; total: number }>();
  const returnedBySource = new Map<string, number>();
  if (rows.length) {
    try {
      const links = await run(
        `SELECT a.[return_sysidandbill] AS retSysid, MIN(a.[source_sysidandbill]) AS srcSysid FROM erp.sales_return_allocation a
          GROUP BY a.[return_sysidandbill]`,
      );
      const linkOf = new Map(links.map((r) => [str(r.retSysid), str(r.srcSysid)]));
      const sources = [...new Set([...linkOf.values()].filter(Boolean))];
      if (sources.length) {
        const heads = await run(
          `SELECT [sysidandbill] AS sysid, [billno] AS billno, ISNULL(TRY_CAST([tot_netamnt] AS float), 0) AS total FROM dbo.[sales2]`,
        );
        const headOf = new Map(heads.map((r) => [str(r.sysid), { sysid: str(r.sysid), billno: str(r.billno), total: num(r.total) }]));
        for (const [ret, src] of linkOf) {
          const h = headOf.get(src);
          if (h) source.set(ret, h);
        }
        const sums = await run(
          `SELECT [source_sysidandbill] AS src, SUM([paid_amount]) AS value FROM erp.sales_return_allocation GROUP BY [source_sysidandbill]`,
        );
        for (const r of sums) returnedBySource.set(str(r.src), num(r.value));
      }
    } catch {
      // erp.sales_return_allocation not created yet: every return is "unlinked".
    }
  }

  let unlinked = 0;
  const window: ReturnDoc[] = rows.map((r) => {
    const src = source.get(str(r.sysid));
    if (!src) unlinked += 1;
    const cash = num(r.cash);
    const bank = num(r.bank);
    const refundMethod = bank !== 0 ? "bank" : cash !== 0 ? "cash" : "credit";
    const user = str(r.userId) || "Unknown user";
    return {
      _id: str(r.sysid),
      returnId: str(r.billno),
      returnDate: `${str(r.dt)}+05:30`,
      invoice: src ? { _id: src.sysid, invoiceNo: src.billno, totalAmount: src.total } : null,
      customer: null,
      customerName: str(r.cus),
      createdBy: { _id: user, name: user },
      refundMethod,
      status: "processed",
      totalReturnAmount: Math.round(num(r.amount) * 100) / 100,
      items: Array.from({ length: Math.max(1, num(r.lines)) }, () => ({ returnedQty: 0 })),
    };
  });
  return { window, returnedBySource, bills: num(billCount[0]?.n), unlinked };
}
