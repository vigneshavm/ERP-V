import { createHash } from "crypto";
import { SESSION_PREFIX } from "./mapping.js";
import { getPool } from "./sqlItemSource.js";
import { SQL_ID_PREFIX } from "./sqlSales.js";

/**
 * ITEM_DATA_SOURCE=sql: the shop's suppliers, read-only.
 *   master   dbo.supplierdetail   (name, address, city, phone, e-mail, GST no., credit days, opening amount)
 *   activity dbo.purgrnentry      (GRN count, total purchased, last purchase) -- joined on the supplier name
 *
 * Every GRN in the shop DB is a CASH purchase (pay_type = CASH for all 15,080) and no supplier payment entries exist,
 * so there are no credit purchases: totalPaid = totalAmount and the only balance is the master's opening amount.
 * A supplier already in the ERP with the same business name wins over the shop entry.
 */

type Row = Record<string, unknown>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Doc = Record<string, any>;

const num = (v: unknown): number => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
};
const round2 = (n: number): number => Math.round(n * 100) / 100;

let cache: { at: number; value: Doc[] } | undefined;

export async function sqlSupplierList(): Promise<Doc[]> {
    if (cache && Date.now() - cache.at < 60_000) return cache.value;
    const req = (await getPool()).request();
    const res = await req.query(
        SESSION_PREFIX +
            `SELECT COALESCE(m.[nm], g.[nm]) AS name, m.[phone] AS phone, m.[email] AS email, m.[city] AS mcity, g.[city] AS gcity, m.[address] AS address, m.[gst] AS gst, m.[days] AS days, m.[opening] AS opening, ` +
            `ISNULL(g.[grns], 0) AS grns, ISNULL(g.[total], 0) AS total, ISNULL(g.[cash], 0) AS cash, g.[lastDate] AS lastDate ` +
            `FROM (SELECT LTRIM(RTRIM([sup_name])) AS nm, MAX(NULLIF(LTRIM(RTRIM(ISNULL(NULLIF([mb_nu], ''), [phone_nu]))), '')) AS phone, MAX(NULLIF(LTRIM(RTRIM([e_id])), '')) AS email, ` +
            `MAX(NULLIF(LTRIM(RTRIM([city])), '')) AS city, MAX(NULLIF(LTRIM(RTRIM([address])), '')) AS address, MAX(NULLIF(LTRIM(RTRIM([gst_number])), '')) AS gst, ` +
            `MAX(NULLIF(LTRIM(RTRIM([credit_days])), '')) AS days, MAX(TRY_CAST([opening_amount] AS float)) AS opening ` +
            `FROM dbo.[supplierdetail] WHERE NULLIF(LTRIM(RTRIM([sup_name])), '') IS NOT NULL GROUP BY LTRIM(RTRIM([sup_name]))) AS m ` +
            `FULL OUTER JOIN (SELECT LTRIM(RTRIM([suplier_name])) AS nm, MAX([Supplier_City]) AS city, COUNT(*) AS grns, ISNULL(SUM(TRY_CAST([totnetamot] AS float)), 0) AS total, ` +
            `ISNULL(SUM(CASE WHEN UPPER(LTRIM(RTRIM([pay_type]))) = 'CASH' THEN TRY_CAST([totnetamot] AS float) ELSE 0 END), 0) AS cash, CONVERT(varchar(10), MAX([entry_date]), 23) AS lastDate ` +
            `FROM dbo.[purgrnentry] WHERE NULLIF(LTRIM(RTRIM([suplier_name])), '') IS NOT NULL GROUP BY LTRIM(RTRIM([suplier_name]))) AS g ON UPPER(g.[nm]) = UPPER(m.[nm]) ` +
            `ORDER BY ISNULL(g.[total], 0) DESC, COALESCE(m.[nm], g.[nm])`,
    );
    const rows: Row[] = res ? res.recordset : [];
    const value = rows.map((r) => {
        const name = String(r.name).trim();
        const total = round2(num(r.total));
        const paid = round2(Math.min(num(r.cash), total));
        const opening = round2(num(r.opening));
        const balance = round2(total - paid + opening);
        return {
            _id: `${SQL_ID_PREFIX}${createHash("sha1").update(name.toLowerCase()).digest("hex").slice(0, 16)}`,
            businessName: name,
            contactPersonName: "",
            contactNo: String(r.phone ?? "").trim(),
            email: String(r.email ?? "").trim(),
            gstNumber: String(r.gst ?? "").trim(),
            address: String(r.address ?? "").trim(),
            city: String(r.mcity ?? r.gcity ?? "").trim(),
            supplierId: "",
            supplierType: "Textilesoft",
            status: "active",
            supplierGroup: "",
            creditDays: num(r.days),
            openingBalance: opening,
            creditLimit: 0,
            billCount: num(r.grns),
            totalAmount: total,
            totalPaid: paid,
            lastPaymentDate: null,
            lastPurchaseDate: String(r.lastDate ?? ""),
            netBalance: balance,
            currentBillOutstanding: 0,
            totalOutstanding: balance,
            overdueCount: 0,
            overdueAmount: 0,
            dueSoonCount: 0,
            dueNext7DaysAmount: 0,
            creditUtilization: 0,
            paymentStatus: "Good",
            isCreditRisk: false,
            source: "sql",
        };
    });
    cache = { at: Date.now(), value };
    return value;
}
