import { SESSION_PREFIX, type QueryParam } from "./mapping.js";
import { getPool } from "./sqlItemSource.js";

/**
 * ITEM_DATA_SOURCE=sql: sales invoices and purchases (GRNs) from the Textilesoft tables, read-only.
 *   sales:     dbo.sales2 (bill header, one row per bill)  +  dbo.salsntry (bill lines, joined on sysidandbill = systemidbill)
 *   purchases: dbo.purgrnentry (GRN header)                +  dbo.purentrydetails (GRN lines, joined on grn_no)
 * They are returned in the same shapes as the ERP's own Invoice / Purchase documents so the existing pages render them.
 * Ids look like `sql:<key>` and are never valid Mongo ObjectIds, so writes against them are rejected by the existing checks.
 * Table/column names are fixed identifiers below; every value is a bound parameter.
 */

type Row = Record<string, unknown>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Doc = Record<string, any>;

const num = (v: unknown): number => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
};
const round2 = (n: number): number => Math.round(n * 100) / 100;
const escapeLike = (v: string): string => v.replace(/[\\%_[]/g, (c) => `\\${c}`);
const str = (v: unknown): string => (v === null || v === undefined ? "" : String(v).trim());

async function run(text: string, params: QueryParam[]): Promise<Row[]> {
    const req = (await getPool()).request();
    for (const p of params) req.input(p.name, p.value);
    const res = await req.query(SESSION_PREFIX + text);
    return res ? res.recordset : [];
}

export const SQL_ID_PREFIX = "sql:";
export const isSqlId = (id: unknown): id is string => typeof id === "string" && id.startsWith(SQL_ID_PREFIX);
const keyOf = (id: string): string | undefined => {
    const k = id.slice(SQL_ID_PREFIX.length);
    return /^[A-Za-z0-9_-]{1,40}$/.test(k) ? k : undefined;
};

// ---------------------------------------------------------------------------------------------
// Sales invoices
// ---------------------------------------------------------------------------------------------

const NUM = (col: string): string => `ISNULL(TRY_CAST(s.[${col}] AS float), 0)`;
const HEADER_COLS =
    `s.[No] AS no, s.[billno] AS billno, s.[mode] AS mode, CONVERT(varchar(10), s.[date], 23) AS d, CONVERT(varchar(19), s.[datetime], 126) AS dt, ` +
    `s.[cus_name] AS cusName, s.[mbl_no] AS phone, s.[city] AS city, s.[countername] AS counter, s.[UserID] AS userId, s.[sysidandbill] AS sysid, ` +
    `${NUM("tot_qty")} AS qty, ${NUM("tot_netamnt")} AS total, ${NUM("s_credit_amt")} AS credit, ${NUM("s_recevied_cashamt")} AS cash, ` +
    `${NUM("s_card_amt")} AS card, ${NUM("s_googlepay")} AS gpay, ${NUM("bill_less")} AS billLess, ${NUM("roundoff")} AS roundOff`;

function paymentOf(r: Row): { paymentStatus: "paid" | "partial" | "unpaid"; paymentMethod: string; paidAmount: number } {
    const total = num(r.total);
    const credit = Math.min(num(r.credit), total);
    const paidAmount = round2(Math.max(0, total - credit));
    const paymentStatus = credit <= 0 ? "paid" : paidAmount <= 0 ? "unpaid" : "partial";
    const used = [num(r.cash) > 0, num(r.card) > 0, num(r.gpay) > 0, credit > 0].filter(Boolean).length;
    const paymentMethod = used > 1 ? "split" : credit > 0 ? "credit" : num(r.card) > 0 ? "card" : num(r.gpay) > 0 ? "upi" : "cash";
    return { paymentStatus, paymentMethod, paidAmount };
}

function invoiceHeader(r: Row): Doc {
    const at = str(r.dt) || `${str(r.d)}T00:00:00`;
    const pay = paymentOf(r);
    const total = round2(num(r.total));
    return {
        _id: `${SQL_ID_PREFIX}${str(r.sysid)}`,
        invoiceNo: str(r.mode) || String(r.billno ?? ""),
        saleChannel: "RETAIL",
        counterName: str(r.counter) || undefined,
        customer: { _id: "sql-customer", name: str(r.cusName) || "Walk-in Customer", phone: str(r.phone) },
        createdBy: { name: str(r.userId) || "Textilesoft" },
        items: [],
        subtotal: total,
        tax: 0,
        discount: round2(num(r.billLess)),
        totalAmount: total,
        paidAmount: pay.paidAmount,
        paymentStatus: pay.paymentStatus,
        paymentMethod: pay.paymentMethod,
        createdAt: at,
        updatedAt: at,
        source: "sql",
    };
}

/**
 * Every bill for one calendar day (YYYY-MM-DD), oldest first -- powers the Daily Sales Report drill-down.
 * Unlike sqlInvoiceList/sqlInvoiceById, this deliberately includes cancelled bills (status = '1') too, each
 * tagged `cancelled: true`, so the drill-down can show what was rung up and then voided that day.
 */
export async function sqlInvoiceListByDate(date: string, limit = 1000): Promise<Doc[]> {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return [];
    const rows = await run(
        `SELECT TOP (@lim) ${HEADER_COLS}, s.[status] AS status FROM dbo.[sales2] AS s WHERE s.[date] = CAST(@d AS date) ORDER BY s.[No] ASC`,
        [
            { name: "lim", value: Math.min(Math.max(1, limit), 2000) },
            { name: "d", value: date },
        ],
    );
    return rows.map((r) => ({ ...invoiceHeader(r), cancelled: str(r.status) === "1" }));
}

/** Newest bills first. `search` matches bill no, customer name or phone. */
export async function sqlInvoiceList(search?: string, limit = 500): Promise<Doc[]> {
    const p: QueryParam[] = [{ name: "lim", value: Math.min(Math.max(1, limit), 2000) }];
    let where = "s.[status] <> '1'";
    if (search) {
        p.push({ name: "q", value: `%${escapeLike(search)}%` });
        where += " AND (s.[mode] LIKE @q ESCAPE '\\' OR s.[cus_name] LIKE @q ESCAPE '\\' OR s.[mbl_no] LIKE @q ESCAPE '\\')";
    }
    const rows = await run(`SELECT TOP (@lim) ${HEADER_COLS} FROM dbo.[sales2] AS s WHERE ${where} ORDER BY s.[No] DESC`, p);
    return rows.map(invoiceHeader);
}

let totalsCache: { at: number; value: { totalInvoices: number; totalSales: number; totalPaid: number } } | undefined;
export async function sqlInvoiceTotals(): Promise<{ totalInvoices: number; totalSales: number; totalPaid: number }> {
    if (totalsCache && Date.now() - totalsCache.at < 60_000) return totalsCache.value;
    const [r] = await run(
        `SELECT COUNT(*) AS n, ISNULL(SUM(x.total), 0) AS total, ISNULL(SUM(CASE WHEN x.total - x.credit < 0 THEN 0 ELSE x.total - x.credit END), 0) AS paid ` +
            `FROM (SELECT ${NUM("tot_netamnt")} AS total, ${NUM("s_credit_amt")} AS credit FROM dbo.[sales2] AS s WHERE s.[status] <> '1') AS x`,
        [],
    );
    const value = { totalInvoices: num(r?.n), totalSales: round2(num(r?.total)), totalPaid: round2(num(r?.paid)) };
    totalsCache = { at: Date.now(), value };
    return value;
}

/** One bill with its lines. Returns undefined when the id is malformed or not found. */
export async function sqlInvoiceById(id: string): Promise<Doc | undefined> {
    const key = isSqlId(id) ? keyOf(id) : undefined;
    if (!key) return undefined;
    const [head] = await run(`SELECT TOP 1 ${HEADER_COLS} FROM dbo.[sales2] AS s WHERE s.[sysidandbill] = @k ORDER BY s.[No] DESC`, [{ name: "k", value: key }]);
    if (!head) return undefined;
    const lines = await run(
        `SELECT l.[p_name] AS name, l.[barcode] AS barcode, l.[hsncode] AS hsn, l.[hdngst] AS gst, ISNULL(TRY_CAST(l.[qty] AS float), 0) AS qty, ` +
            `ISNULL(TRY_CAST(l.[rate] AS float), 0) AS rate, ISNULL(TRY_CAST(l.[pdis_amount] AS float), 0) AS pdis, ISNULL(TRY_CAST(l.[less] AS float), 0) AS less, ` +
            `ISNULL(TRY_CAST(l.[tax] AS float), 0) AS tax, ISNULL(TRY_CAST(l.[cgst] AS float), 0) AS cgst, ISNULL(TRY_CAST(l.[sgst] AS float), 0) AS sgst, ` +
            // No status filter here: sqlInvoiceById is also used for cancelled bills (see sqlInvoiceListByDate),
            // whose lines in salsntry typically carry the same cancelled status as the header -- filtering them
            // out left cancelled bills showing a correct total but "no line items found".
            `ISNULL(TRY_CAST(l.[net_amount] AS float), 0) AS net FROM dbo.[salsntry] AS l WHERE l.[systemidbill] = @k ORDER BY l.[No]`,
        [{ name: "k", value: key }],
    );
    const doc = invoiceHeader(head);
    doc.items = lines.map((l) => ({
        _id: `sql-line-${str(l.barcode)}`,
        name: str(l.name) || "Item",
        sku: str(l.barcode),
        hsnCode: str(l.hsn),
        gstRate: num(l.gst),
        quantity: num(l.qty),
        price: round2(num(l.rate)),
        taxableAmount: round2(num(l.rate) * num(l.qty)),
        cgst: round2(num(l.cgst)),
        sgst: round2(num(l.sgst)),
        igst: 0,
        tax: round2(num(l.tax)),
        discount: round2(num(l.pdis) + num(l.less)),
        total: round2(num(l.net)),
    }));
    const tax = round2(doc.items.reduce((s: number, i: Doc) => s + i.tax, 0));
    doc.tax = tax;
    doc.subtotal = round2(doc.items.reduce((s: number, i: Doc) => s + i.taxableAmount, 0));
    return doc;
}

// ---------------------------------------------------------------------------------------------
// Purchases (GRNs)
// ---------------------------------------------------------------------------------------------

function purchaseHeader(r: Row): Doc {
    const at = str(r.entry) || str(r.inv);
    const supplier = str(r.supplier) || "Unknown Vendor";
    return {
        _id: `${SQL_ID_PREFIX}${str(r.grn)}`,
        purchaseNumber: str(r.grn),
        vendorId: { _id: `sql-supplier-${supplier}`, name: supplier, businessName: supplier },
        date: at,
        totalAmount: round2(num(r.total)),
        status: "COMPLETED",
        // List rows carry one summary line (the GRN's total units) so received/expected counts on the GRN and
        // register pages add up; opening a GRN (sqlPurchaseById) replaces it with the real lines.
        items: num(r.qty) > 0 ? [{ productName: `${num(r.qty)} units`, quantity: num(r.qty), receivedQty: num(r.qty), rate: 0, taxPercent: 0, discountAmount: 0, amount: round2(num(r.total)), summary: true }] : [],
        notes: [str(r.warehouse) && `Warehouse: ${str(r.warehouse)}`, str(r.payType) && `Payment: ${str(r.payType)}`, num(r.qty) ? `Qty: ${num(r.qty)}` : ""].filter(Boolean).join(" · "),
        createdBy: { name: str(r.incharge) && str(r.incharge) !== "0" ? str(r.incharge) : "Textilesoft" },
        createdAt: at,
        updatedAt: at,
        source: "sql",
    };
}

const GRN_COLS =
    `g.[grn_no] AS grn, g.[suplier_name] AS supplier, CONVERT(varchar(10), g.[entry_date], 23) AS entry, CONVERT(varchar(10), g.[invoce_date], 23) AS inv, ` +
    `TRY_CAST(g.[totnetamot] AS float) AS total, TRY_CAST(g.[tot_qut] AS float) AS qty, g.[incharge] AS incharge, g.[pay_type] AS payType, g.[warehouse] AS warehouse`;

const purchaseListCache = new Map<number, { at: number; value: Doc[] }>();

export async function sqlPurchaseList(limit = 1000): Promise<Doc[]> {
    const lim = Math.min(Math.max(1, limit), 5000);
    const hit = purchaseListCache.get(lim);
    if (hit && Date.now() - hit.at < 60_000) return hit.value;
    const rows = await run(`SELECT TOP (@lim) ${GRN_COLS} FROM dbo.[purgrnentry] AS g ORDER BY g.[ID] DESC`, [{ name: "lim", value: lim }]);
    const value = rows.map(purchaseHeader);
    purchaseListCache.set(lim, { at: Date.now(), value });
    return value;
}

export async function sqlPurchaseById(id: string): Promise<Doc | undefined> {
    const key = isSqlId(id) ? keyOf(id) : undefined;
    if (!key) return undefined;
    const [head] = await run(`SELECT TOP 1 ${GRN_COLS} FROM dbo.[purgrnentry] AS g WHERE g.[grn_no] = @k ORDER BY g.[ID] DESC`, [{ name: "k", value: key }]);
    if (!head) return undefined;
    const lines = await run(
        `SELECT p.[pname] AS name, p.[barcode] AS barcode, ISNULL(TRY_CAST(p.[qty] AS float), 0) + ISNULL(TRY_CAST(p.[fqty] AS float), 0) AS qty, ` +
            `ISNULL(TRY_CAST(p.[prate] AS float), 0) AS rate, ISNULL(TRY_CAST(p.[gst_per] AS float), 0) AS gst, ISNULL(TRY_CAST(p.[dis_amount] AS float), 0) AS dis, ` +
            `ISNULL(TRY_CAST(p.[net_amount] AS float), 0) AS net FROM dbo.[purentrydetails] AS p WHERE p.[grn_no] = @k AND p.[STATUS] IS NULL ORDER BY p.[ID]`,
        [{ name: "k", value: key }],
    );
    const doc = purchaseHeader(head);
    doc.items = lines.map((l) => ({
        productName: str(l.name) || "Item",
        sku: str(l.barcode),
        quantity: num(l.qty),
        receivedQty: num(l.qty),
        rate: round2(num(l.rate)),
        taxPercent: num(l.gst),
        discountAmount: round2(num(l.dis)),
        amount: round2(num(l.net)),
    }));
    return doc;
}
