/**
 * Discount limits for the billing user, read from Textilesoft's dbo.specialcondion (one row per user_id and
 * counter). The legacy billing page packs these into a hidden field and refuses a bill discount, "less" or
 * product discount above them. The ERP only reads this table (never writes it).
 *
 *   bill_discount = Yes/No  may give a bill discount      dis_per   highest bill discount %
 *   bill_less     = Yes/No  may give a flat "less"        less_rang highest less, rupees
 *   pdis          = Yes/No  may give a product discount   pdis_per  highest product discount %
 *   bill_cancel   = Yes/No  may cancel a bill
 *
 * A permission of No means the limit is 0. A permission of Yes with a blank cap means no cap.
 */
import { getPool } from "./sqlItemSource.js";
import type { CalcLimits } from "../../modules/sales/domain/salesCalc.js";

export interface BillingLimits extends CalcLimits {
  canCancelBill: boolean;
}

const yes = (v: unknown): boolean => /^(yes|y|1|true)$/i.test(String(v ?? "").trim());

const cap = (allowed: boolean, v: unknown): number => {
  if (!allowed) return 0;
  const s = String(v ?? "").trim();
  const n = Number(s);
  return s === "" || !Number.isFinite(n) || n < 0 ? Infinity : n;
};

/** One dbo.specialcondion row -> limits. */
export function limitsFromRow(row: Record<string, unknown>): BillingLimits {
  return {
    maxBillDisPct: cap(yes(row.bill_discount), row.dis_per),
    maxBillLess: cap(yes(row.bill_less), row.less_rang),
    maxProdDisPct: cap(yes(row.pdis), row.pdis_per),
    canCancelBill: yes(row.bill_cancel),
  };
}

/**
 * The user's limits at a counter, or null when Textilesoft has no row for the user (then the caller keeps its
 * own policy). A row for the user's own counter beats one with no counter, which beats any other counter's.
 */
export async function getBillingLimits(userId: string, counter?: string): Promise<BillingLimits | null> {
  const u = (userId || "").trim();
  if (!u) return null;
  const req = (await getPool()).request();
  req.input("u", u);
  req.input("c", (counter || "").trim());
  const res = await req.query(
    `SELECT TOP 1 bill_discount, dis_per, bill_less, less_rang, pdis, pdis_per, bill_cancel
       FROM dbo.[specialcondion]
      WHERE LTRIM(RTRIM(user_id)) = @u
      ORDER BY CASE WHEN LTRIM(RTRIM(ISNULL(CounterName, ''))) = @c THEN 0
                    WHEN NULLIF(LTRIM(RTRIM(ISNULL(CounterName, ''))), '') IS NULL THEN 1 ELSE 2 END`,
  );
  const rows = (res as { recordset: Record<string, unknown>[] }).recordset ?? [];
  return rows[0] ? limitsFromRow(rows[0]) : null;
}
