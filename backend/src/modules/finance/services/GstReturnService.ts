import mongoose from "mongoose";
import Invoice from "../../sales/models/Invoice.js";
import Bill from "../models/Bill.js";
import { decomposeGST } from "../../../utils/gstUtils.js";
import { isSqlItemSource } from "../../../config/itemDataSource.js";
import { shopHsnMaster, shopInward, shopOutward, type GstRange, type ShopOutward } from "../../../integrations/textilesoft/sqlGstReports.js";
import { tableQuery, type TableQuery } from "../../core/services/tableQuery.js";
import {
    byHsn, byMonth, byRate, financialYear, monthsBetween, resolveRate, round2, setOff, totals,
    type GstSource, type TaxBucket, type TaxTotals,
} from "./gstMath.js";

/**
 * GST return reports: GSTR-1 (outward), GSTR-3B (monthly summary + ITC set-off), GSTR-9 (annual) and the
 * Purchase GST Register (ITC). Figures combine the shop database (Textilesoft bills and GRNs, when
 * ITEM_DATA_SOURCE=sql) with the ERP's own documents in MongoDB:
 *   outward  Invoice (POS and invoice billing): per-line taxableAmount/cgst/sgst/igst as recorded at sale
 *   inward   Bill (supplier tax invoices): per-line taxRate/taxAmount, split by the bill's taxBreakdown
 * ERP Purchase documents are not used for ITC: a Bill is the tax invoice, and using both would count the
 * same goods twice.
 *
 * Nothing here is a filed return. Each result carries `checks` that the screens show, so anything the
 * figures depend on (unknown rates, missing GSTINs, header/line differences, ERP lines recorded at 0% GST)
 * is visible next to the numbers.
 */

type Source = "sql" | "mongo";

const IST = "+05:30";
const istStart = (d: string) => new Date(`${d}T00:00:00${IST}`);
const istEndExclusive = (d: string) => new Date(istStart(d).getTime() + 86_400_000);
const istDate = (d: Date): string => new Date(d.getTime() + 5.5 * 3_600_000).toISOString().slice(0, 10);

const n = (v: unknown): number => {
    const x = Number(v);
    return Number.isFinite(x) ? x : 0;
};

const tenantMatch = (tenantId: string) =>
    mongoose.Types.ObjectId.isValid(tenantId) ? new mongoose.Types.ObjectId(tenantId) : tenantId;

/* ------------------------------------------------------------------------------------------------ ERP outward */

export interface ErpOutward {
    buckets: TaxBucket[];
    invoices: number;
    invoiceValue: number;
    /** Lines stored with 0% GST or no tax (see the POS GST fix of Sept 2026: older sales were recorded at 0%). */
    zeroRateLines: { lines: number; value: number };
    /** Lines stored without a tax breakdown, whose tax was derived from rate and value here. */
    derivedLines: number;
    returns: { invoices: number; value: number };
}

export async function erpOutward(tenantId: string, range: GstRange): Promise<ErpOutward> {
    const docs = await Invoice.find(
        {
            tenantId: tenantMatch(tenantId),
            isDeleted: { $ne: true },
            // Cancelled and refunded sales are reversed, so they are not outward supplies.
            fulfillmentStatus: { $nin: ["CANCELLED", "REFUNDED"] },
            createdAt: { $gte: istStart(range.from), $lt: istEndExclusive(range.to) },
        },
        { createdAt: 1, isInterState: 1, taxMode: 1, totalAmount: 1, returnedAmount: 1, hasReturns: 1, items: 1 },
    ).lean();

    const cells = new Map<string, TaxBucket>();
    let zeroLines = 0, zeroValue = 0, derived = 0, invoiceValue = 0, retInv = 0, retValue = 0;

    for (const inv of docs as unknown as Record<string, any>[]) {
        const month = istDate(new Date(inv.createdAt)).slice(0, 7);
        const inter = Boolean(inv.isInterState);
        const inclusive = (inv.taxMode ?? "INCLUSIVE") === "INCLUSIVE";
        invoiceValue += n(inv.totalAmount);
        if (inv.hasReturns || n(inv.returnedAmount) > 0) { retInv += 1; retValue += n(inv.returnedAmount); }

        for (const it of (inv.items ?? []) as Record<string, any>[]) {
            const value = n(it.total ?? n(it.price) * n(it.quantity));
            let taxable = n(it.taxableAmount);
            let cgst = n(it.cgst), sgst = n(it.sgst), igst = n(it.igst);
            let tax = cgst + sgst + igst || n(it.tax);
            const storedRate = it.gstRate;

            if (taxable === 0 && value !== 0) {
                // No stored breakdown: derive from the recorded rate, the way the invoice was priced.
                const g = decomposeGST(value, n(storedRate), inter, inclusive);
                taxable = g.taxableAmount; cgst = g.cgst; sgst = g.sgst; igst = g.igst; tax = g.tax;
                derived += 1;
            } else if (cgst + sgst + igst === 0 && tax > 0) {
                ({ cgst, sgst, igst } = inter ? { cgst: 0, sgst: 0, igst: tax } : { cgst: tax / 2, sgst: tax / 2, igst: 0 });
            }
            if (!n(storedRate) || tax === 0) { zeroLines += 1; zeroValue += value; }

            const rate = resolveRate(storedRate, taxable, tax);
            const hsn = /^\d{4,8}$/.test(String(it.hsnCode ?? "").trim()) ? String(it.hsnCode).trim() : "";
            const key = `${month}|${rate}|${hsn}|${inter ? 1 : 0}`;
            const b = cells.get(key) ?? { source: "erp" as GstSource, month, rate, hsn, interState: inter, lines: 0, qty: 0, value: 0, taxable: 0, cgst: 0, sgst: 0, igst: 0 };
            b.lines += 1; b.qty += n(it.quantity); b.value += value; b.taxable += taxable; b.cgst += cgst; b.sgst += sgst; b.igst += igst;
            cells.set(key, b);
        }
    }

    return {
        buckets: [...cells.values()],
        invoices: docs.length,
        invoiceValue: round2(invoiceValue),
        zeroRateLines: { lines: zeroLines, value: round2(zeroValue) },
        derivedLines: derived,
        returns: { invoices: retInv, value: round2(retValue) },
    };
}

/* ------------------------------------------------------------------------------------------------ ERP inward */

export interface InwardRow {
    source: GstSource;
    kind: "purchase" | "return";
    doc: string;
    supplierInvoiceNo: string | null;
    date: string;
    invoiceDate: string | null;
    supplier: string;
    gstin: string;
    /** Rates on the document, e.g. "5%, 12%". */
    rates: string;
    lines: number;
    qty: number;
    value: number;
    taxable: number;
    cgst: number;
    sgst: number;
    igst: number;
    tax: number;
    /** Returns carry negative amounts so register totals are net of returns. */
    itcEligible: boolean;
}

// Bills that are accepted tax invoices. Drafts, rejected, disputed and pending-approval bills are not claimed.
const BILL_LIVE_STATUSES = ["approved", "paid", "unpaid", "overdue"];

export async function erpInward(tenantId: string, range: GstRange): Promise<{ row: InwardRow; cells: TaxBucket[] }[]> {
    const bills = await Bill.find(
        { tenantId: String(tenantId), status: { $in: BILL_LIVE_STATUSES }, date: { $gte: istStart(range.from), $lt: istEndExclusive(range.to) } },
        { billNo: 1, vendorInvoiceNo: 1, date: 1, supplier: 1, items: 1, taxBreakdown: 1, itcStatus: 1 },
    )
        .populate("supplier", "name gstNo")
        .lean();

    const out: { row: InwardRow; cells: TaxBucket[] }[] = [];
    for (const b of bills as unknown as Record<string, any>[]) {
        const date = istDate(new Date(b.date));
        const tb = b.taxBreakdown ?? {};
        const totalTax = n(tb.cgst) + n(tb.sgst) + n(tb.igst);
        const inter = n(tb.igst) > 0 && n(tb.cgst) + n(tb.sgst) === 0;
        const byRateCell = new Map<number, TaxBucket>();
        for (const it of (b.items ?? []) as Record<string, any>[]) {
            const value = n(it.total);
            const tax = n(it.taxAmount);
            const taxable = value - tax;
            const rate = resolveRate(it.taxRate, taxable, tax);
            const cell = byRateCell.get(rate) ?? { source: "erp" as GstSource, month: date.slice(0, 7), rate, hsn: "", interState: inter, lines: 0, qty: 0, value: 0, taxable: 0, cgst: 0, sgst: 0, igst: 0 };
            cell.lines += 1; cell.qty += n(it.quantity); cell.value += value; cell.taxable += taxable;
            if (inter) cell.igst += tax; else { cell.cgst += tax / 2; cell.sgst += tax / 2; }
            byRateCell.set(rate, cell);
        }
        // Prefer the bill's own tax split when it disagrees with the line sum (e.g. freight GST).
        const cells = [...byRateCell.values()];
        const t = totals(cells);
        if (totalTax > 0 && Math.abs(totalTax - t.tax) > 0.5 && cells.length === 1) {
            cells[0].cgst = n(tb.cgst); cells[0].sgst = n(tb.sgst); cells[0].igst = n(tb.igst);
        }
        const tt = totals(cells);
        const supplier = b.supplier ?? {};
        const gstin = String(supplier.gstNo ?? "").trim().toUpperCase();
        out.push({ cells, row: {
            source: "erp", kind: "purchase", doc: String(b.billNo ?? ""), supplierInvoiceNo: b.vendorInvoiceNo ? String(b.vendorInvoiceNo) : null,
            date, invoiceDate: date, supplier: String(supplier.name ?? "Unknown supplier"), gstin,
            rates: rateList(cells), lines: tt.lines, qty: tt.qty, value: tt.value, taxable: tt.taxable,
            cgst: tt.cgst, sgst: tt.sgst, igst: tt.igst, tax: tt.tax,
            itcEligible: isGstin(gstin) && b.itcStatus !== "INELIGIBLE",
        } });
    }
    return out;
}

/* ------------------------------------------------------------------------------------------------ Helpers */

/** A 15-character GSTIN: 2-digit state code, PAN, entity, 'Z', check character. */
export const isGstin = (v: string): boolean => /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(v);

const rateList = (cells: TaxBucket[]): string =>
    [...new Set(cells.map((c) => c.rate))].sort((a, b) => a - b).map((r) => (r < 0 ? "Unknown" : `${r}%`)).join(", ");

const sourceOf = (): Source => (isSqlItemSource() ? "sql" : "mongo");

export const parseRange = (from: unknown, to: unknown): GstRange | null => {
    const ok = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
    if (!ok(from) || !ok(to) || from > to) return null;
    return { from, to };
};

const EMPTY_SHOP: ShopOutward = {
    buckets: [], bills: 0, billValue: 0, headerTax: 0, cancelled: { bills: 0, value: 0 }, interStateBills: 0, documents: [], hsnViaGroupLines: 0, asOf: null,
};

async function outwardAll(tenantId: string, range: GstRange) {
    const sql = isSqlItemSource();
    const [shop, erp, hsn] = await Promise.all([
        sql ? shopOutward(range) : Promise.resolve(EMPTY_SHOP),
        erpOutward(tenantId, range),
        sql ? shopHsnMaster().catch(() => null) : Promise.resolve(null),
    ]);
    return { shop, erp, buckets: [...shop.buckets, ...erp.buckets], describe: (h: string) => hsn?.describe(h) ?? "" };
}

function outwardChecks(shop: ShopOutward, erp: ErpOutward, buckets: TaxBucket[]) {
    const shopLineTax = round2(shop.buckets.reduce((s, b) => s + b.cgst + b.sgst + b.igst, 0));
    const shopLineValue = round2(shop.buckets.reduce((s, b) => s + b.value, 0));
    const unknownRate = buckets.filter((b) => b.rate < 0);
    const noHsn = buckets.filter((b) => !b.hsn);
    return {
        /** Line tax vs the bill headers' gst5..gst28 columns. They should agree to within rounding. */
        shopHeaderVsLineTax: { header: shop.headerTax, lines: shopLineTax, difference: round2(shopLineTax - shop.headerTax) },
        /** Line values vs bill totals: a difference usually means bill-level discount or round-off. */
        shopHeaderVsLineValue: { header: shop.billValue, lines: shopLineValue, difference: round2(shopLineValue - shop.billValue) },
        unknownRate: { lines: unknownRate.reduce((s, b) => s + b.lines, 0), value: round2(unknownRate.reduce((s, b) => s + b.value, 0)) },
        missingHsn: { lines: noHsn.reduce((s, b) => s + b.lines, 0), value: round2(noHsn.reduce((s, b) => s + b.value, 0)) },
        hsnViaGroupLines: shop.hsnViaGroupLines,
        shopInterStateBills: shop.interStateBills,
        erpZeroRateLines: erp.zeroRateLines,
        erpDerivedLines: erp.derivedLines,
        erpReturnsNotDeducted: erp.returns,
    };
}

const bySource = (buckets: TaxBucket[]) => ({
    shop: totals(buckets.filter((b) => b.source === "shop")),
    erp: totals(buckets.filter((b) => b.source === "erp")),
});

/* ------------------------------------------------------------------------------------------------ GSTR-1 */

export async function buildGstr1(tenantId: string, range: GstRange) {
    const { shop, erp, buckets, describe } = await outwardAll(tenantId, range);
    return {
        range,
        summary: { ...totals(buckets), documents: shop.bills + erp.invoices },
        bySource: bySource(buckets),
        counts: { shopBills: shop.bills, erpInvoices: erp.invoices, cancelledShopBills: shop.cancelled },
        byRate: byRate(buckets),
        byHsn: byHsn(buckets, describe),
        documents: [
            ...shop.documents.map((d) => ({ source: "shop" as const, ...d })),
            ...(erp.invoices ? [{ source: "erp" as const, series: "ERP invoices", from: 0, to: 0, total: erp.invoices, cancelled: 0 }] : []),
        ],
        checks: outwardChecks(shop, erp, buckets),
        asOf: shop.asOf,
        source: sourceOf(),
    };
}

/* ------------------------------------------------------------------------------------------------ Inward register */

async function inwardAll(tenantId: string, range: GstRange) {
    const sql = isSqlItemSource();
    const [shop, erp] = await Promise.all([
        sql ? shopInward(range) : Promise.resolve({ rows: [], returnsAvailable: true, asOf: null }),
        erpInward(tenantId, range),
    ]);

    // Shop rows come per document × rate: fold them into one register row per document.
    const docs = new Map<string, { kind: "purchase" | "return"; doc: string; date: string; invoiceDate: string | null; supplier: string; gstin: string; cells: TaxBucket[] }>();
    for (const r of shop.rows) {
        const key = `${r.kind}:${r.doc}`;
        const d = docs.get(key) ?? { kind: r.kind, doc: r.doc, date: r.date, invoiceDate: r.invoiceDate, supplier: r.supplier, gstin: r.gstin, cells: [] };
        d.cells.push(r.bucket);
        docs.set(key, d);
    }
    const sign = (kind: "purchase" | "return") => (kind === "return" ? -1 : 1);
    const shopRows: InwardRow[] = [...docs.values()].map((d) => {
        const t = totals(d.cells);
        const s = sign(d.kind);
        return {
            source: "shop", kind: d.kind, doc: d.doc, supplierInvoiceNo: null, date: d.date, invoiceDate: d.invoiceDate,
            supplier: d.supplier, gstin: d.gstin, rates: rateList(d.cells), lines: t.lines, qty: s * t.qty,
            value: s * t.value, taxable: s * t.taxable, cgst: s * t.cgst, sgst: s * t.sgst, igst: s * t.igst, tax: s * t.tax,
            itcEligible: isGstin(d.gstin),
        };
    });
    // Buckets for summaries: returns count negative.
    const shopBuckets: TaxBucket[] = shop.rows.map((r) => {
        const s = sign(r.kind);
        const b = r.bucket;
        return { ...b, qty: s * b.qty, value: s * b.value, taxable: s * b.taxable, cgst: s * b.cgst, sgst: s * b.sgst, igst: s * b.igst };
    });
    // Input credit is claimable only on documents from a supplier with a valid GSTIN.
    const eligibleDocs = new Set(shopRows.filter((r) => r.itcEligible).map((r) => `${r.kind}:${r.doc}`));
    const eligibleShop = shopBuckets.filter((_, i) => eligibleDocs.has(`${shop.rows[i].kind}:${shop.rows[i].doc}`));
    const eligibleErp = erp.filter((d) => d.row.itcEligible).flatMap((d) => d.cells);
    const buckets = [...shopBuckets, ...erp.flatMap((d) => d.cells)];
    const eligibleSet = new Set<TaxBucket>([...eligibleShop, ...eligibleErp]);

    return {
        rows: [...shopRows, ...erp.map((d) => d.row)],
        buckets,
        eligibleBuckets: buckets.filter((b) => eligibleSet.has(b)),
        blockedBuckets: buckets.filter((b) => !eligibleSet.has(b)),
        returnsAvailable: shop.returnsAvailable,
        asOf: shop.asOf,
    };
}

export async function buildPurchaseRegister(tenantId: string, range: GstRange, q: TableQuery & { eligibility?: string; source?: string }) {
    const all = await inwardAll(tenantId, range);
    let rows = all.rows;
    if (q.eligibility === "eligible") rows = rows.filter((r) => r.itcEligible);
    if (q.eligibility === "no-gstin") rows = rows.filter((r) => !r.itcEligible);
    if (q.source === "shop" || q.source === "erp") rows = rows.filter((r) => r.source === q.source);

    const t = tableQuery(rows, q, {
        searchIn: (r) => [r.doc, r.supplier, r.gstin, r.supplierInvoiceNo],
        sortable: {
            date: (r) => r.date, doc: (r) => r.doc, supplier: (r) => r.supplier, gstin: (r) => r.gstin,
            taxable: (r) => r.taxable, tax: (r) => r.tax, value: (r) => r.value,
        },
        fallback: (a, b) => b.date.localeCompare(a.date),
        tieBreak: (r) => `${r.source}:${r.kind}:${r.doc}`,
    });

    const sum = (list: InwardRow[]): TaxTotals => {
        const z: TaxTotals = { lines: 0, qty: 0, value: 0, taxable: 0, cgst: 0, sgst: 0, igst: 0, tax: 0 };
        for (const r of list) { z.lines += r.lines; z.qty += r.qty; z.value += r.value; z.taxable += r.taxable; z.cgst += r.cgst; z.sgst += r.sgst; z.igst += r.igst; }
        z.tax = z.cgst + z.sgst + z.igst;
        return { ...z, value: round2(z.value), taxable: round2(z.taxable), cgst: round2(z.cgst), sgst: round2(z.sgst), igst: round2(z.igst), tax: round2(z.tax), qty: Math.round(z.qty * 1000) / 1000 };
    };
    const noGstin = all.rows.filter((r) => !r.itcEligible);
    return {
        range,
        summary: {
            all: sum(all.rows),
            eligible: sum(all.rows.filter((r) => r.itcEligible)),
            noGstin: sum(noGstin),
            returns: sum(all.rows.filter((r) => r.kind === "return")),
            documents: all.rows.length,
            suppliersWithoutGstin: new Set(noGstin.map((r) => r.supplier.toUpperCase())).size,
        },
        byRate: byRate(all.buckets),
        items: t.items,
        pagination: t.pagination,
        sort: t.sort,
        dir: t.dir,
        checks: {
            unknownRate: all.rows.filter((r) => r.rates.includes("Unknown")).length,
            returnsAvailable: all.returnsAvailable,
        },
        asOf: all.asOf,
        source: sourceOf(),
    };
}

/* ------------------------------------------------------------------------------------------------ GSTR-3B */

export async function buildGstr3b(tenantId: string, range: GstRange) {
    const [out, inw] = await Promise.all([outwardAll(tenantId, range), inwardAll(tenantId, range)]);
    const o = totals(out.buckets);
    const nilRated = totals(out.buckets.filter((b) => b.rate === 0));
    const taxable = totals(out.buckets.filter((b) => b.rate !== 0));
    const itc = totals(inw.eligibleBuckets);
    const allInward = totals(inw.buckets);
    const itcHeads = { cgst: Math.max(0, itc.cgst), sgst: Math.max(0, itc.sgst), igst: Math.max(0, itc.igst) };
    return {
        range,
        outward: {
            /** 3.1(a): outward taxable supplies (other than zero, nil and exempt). */
            taxable,
            /** 3.1(c): nil-rated / exempt (0% lines). */
            nilRated,
            total: o,
            interStateTaxable: totals(out.buckets.filter((b) => b.interState && b.rate !== 0)),
        },
        itc: {
            /** 4(A)(5): all other ITC, from purchases whose supplier has a valid GSTIN, net of purchase returns. */
            eligible: itc,
            /** Tax on purchases from suppliers with no valid GSTIN: not claimable until the GSTIN is recorded. */
            blocked: totals(inw.blockedBuckets),
            allPurchases: allInward,
        },
        setOff: setOff({ cgst: o.cgst, sgst: o.sgst, igst: o.igst }, itcHeads),
        byMonth: monthsBetween(range.from, range.to).map((m) => {
            const mo = totals(out.buckets.filter((b) => b.month === m));
            const mi = totals(inw.eligibleBuckets.filter((b) => b.month === m));
            return { month: m, outputTax: mo.tax, taxable: mo.taxable, itc: mi.tax, net: round2(mo.tax - mi.tax) };
        }),
        checks: outwardChecks(out.shop, out.erp, out.buckets),
        asOf: out.shop.asOf,
        source: sourceOf(),
    };
}

/* ------------------------------------------------------------------------------------------------ GSTR-9 */

export async function buildGstr9(tenantId: string, fyStartYear: number) {
    const fy = financialYear(`${fyStartYear}-04-01`);
    const range = { from: fy.from, to: fy.to };
    const [out, inw] = await Promise.all([outwardAll(tenantId, range), inwardAll(tenantId, range)]);
    const outMonths = new Map(byMonth(out.buckets).map((m) => [m.month, m]));
    const itcMonths = new Map(byMonth(inw.eligibleBuckets).map((m) => [m.month, m]));
    const zero = { lines: 0, qty: 0, value: 0, taxable: 0, cgst: 0, sgst: 0, igst: 0, tax: 0 };
    return {
        financialYear: fy,
        range,
        outward: totals(out.buckets),
        itc: totals(inw.eligibleBuckets),
        byMonth: monthsBetween(fy.from, fy.to).map((m) => {
            const o = outMonths.get(m) ?? { month: m, ...zero };
            const i = itcMonths.get(m) ?? { month: m, ...zero };
            return {
                month: m, taxable: o.taxable, cgst: o.cgst, sgst: o.sgst, igst: o.igst, outputTax: o.tax,
                itc: i.tax, net: round2(o.tax - i.tax),
            };
        }),
        byRate: byRate(out.buckets),
        /** Table 17: HSN-wise summary of outward supplies. */
        byHsn: byHsn(out.buckets, out.describe),
        checks: outwardChecks(out.shop, out.erp, out.buckets),
        asOf: out.shop.asOf,
        source: sourceOf(),
    };
}
