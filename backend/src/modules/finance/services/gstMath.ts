/**
 * Pure GST arithmetic shared by the GST return reports (GSTR-1, GSTR-3B, GSTR-9, Purchase GST Register).
 * No DB access, so every rule here is unit-tested in isolation.
 *
 * Amounts are carried unrounded through aggregation and rounded to paise only at the edges, so a
 * report total equals the sum of its unrounded lines, not the sum of rounded sub-totals.
 */

export type GstSource = "shop" | "erp";

/** GST slabs in force; anything else is treated as a data problem, not a rate. */
export const GST_SLABS = [0, 0.1, 0.25, 1.5, 3, 5, 12, 18, 28, 40] as const;

/** One aggregated group of taxable lines (a month × rate × HSN × intra/inter-state cell). */
export interface TaxBucket {
    source: GstSource;
    /** 'YYYY-MM' (the tax period the lines fall in). */
    month: string;
    /** GST %. -1 = the line's rate could not be determined. */
    rate: number;
    hsn: string;
    interState: boolean;
    lines: number;
    qty: number;
    /** Invoice value including GST. */
    value: number;
    taxable: number;
    cgst: number;
    sgst: number;
    igst: number;
}

export interface TaxTotals {
    lines: number;
    qty: number;
    value: number;
    taxable: number;
    cgst: number;
    sgst: number;
    igst: number;
    tax: number;
}

export const round2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;

const num = (v: unknown): number => {
    const n = typeof v === "number" ? v : Number(String(v ?? "").trim());
    return Number.isFinite(n) ? n : 0;
};

/**
 * The line's GST rate. Prefers the stored rate when it is a real slab; otherwise infers it from the
 * tax actually charged (tax / taxable), snapped to the nearest slab if within 0.5 percentage points.
 * Returns -1 when neither works, so the report can show the line as "rate unknown" instead of guessing.
 */
export function resolveRate(stored: unknown, taxable: number, tax: number): number {
    const s = typeof stored === "number" ? stored : Number(String(stored ?? "").trim().replace(/%$/, ""));
    const text = String(stored ?? "").trim();
    if (text !== "" && Number.isFinite(s) && (GST_SLABS as readonly number[]).includes(s)) return s;
    if (taxable > 0 && tax >= 0) {
        const implied = (tax / taxable) * 100;
        let best = -1;
        let gap = Infinity;
        for (const slab of GST_SLABS) {
            const g = Math.abs(slab - implied);
            if (g < gap) { gap = g; best = slab; }
        }
        if (gap <= 0.5) return best;
    }
    return -1;
}

/** Splits a tax amount into CGST/SGST (half each, intra-state) or IGST (inter-state). */
export function splitTax(tax: number, interState: boolean): { cgst: number; sgst: number; igst: number } {
    return interState ? { cgst: 0, sgst: 0, igst: tax } : { cgst: tax / 2, sgst: tax / 2, igst: 0 };
}

/**
 * A bucket from an aggregated SQL row where only the GST-inclusive value and the total tax are known
 * (the Textilesoft line tables): taxable = value − tax.
 */
export function bucketFromTaxInclusive(input: {
    source: GstSource; month: string; storedRate: unknown; hsn: unknown; interState: boolean;
    lines: unknown; qty: unknown; value: unknown; tax: unknown;
}): TaxBucket {
    const value = num(input.value);
    const tax = num(input.tax);
    const taxable = value - tax;
    return {
        source: input.source,
        month: input.month,
        rate: resolveRate(input.storedRate, taxable, tax),
        hsn: normaliseHsn(input.hsn),
        interState: input.interState,
        lines: num(input.lines),
        qty: num(input.qty),
        value,
        taxable,
        ...splitTax(tax, input.interState),
    };
}

/** HSN codes are digits; Textilesoft stores placeholders like '1' or '' on unclassified lines. */
export function normaliseHsn(v: unknown): string {
    const s = String(v ?? "").trim();
    return /^\d{4,8}$/.test(s) ? s : "";
}

export function totals(buckets: TaxBucket[]): TaxTotals {
    const t: TaxTotals = { lines: 0, qty: 0, value: 0, taxable: 0, cgst: 0, sgst: 0, igst: 0, tax: 0 };
    for (const b of buckets) {
        t.lines += b.lines; t.qty += b.qty; t.value += b.value; t.taxable += b.taxable;
        t.cgst += b.cgst; t.sgst += b.sgst; t.igst += b.igst;
    }
    t.tax = t.cgst + t.sgst + t.igst;
    return roundTotals(t);
}

export function roundTotals(t: TaxTotals): TaxTotals {
    return {
        lines: t.lines, qty: Math.round(t.qty * 1000) / 1000,
        value: round2(t.value), taxable: round2(t.taxable),
        cgst: round2(t.cgst), sgst: round2(t.sgst), igst: round2(t.igst), tax: round2(t.cgst + t.sgst + t.igst),
    };
}

/** Groups buckets by a key and totals each group, in first-seen key order. */
export function groupTotals<K extends string>(buckets: TaxBucket[], key: (b: TaxBucket) => K): Map<K, TaxTotals> {
    const acc = new Map<K, TaxBucket[]>();
    for (const b of buckets) {
        const k = key(b);
        const list = acc.get(k);
        if (list) list.push(b); else acc.set(k, [b]);
    }
    const out = new Map<K, TaxTotals>();
    for (const [k, list] of acc) out.set(k, totals(list));
    return out;
}

/** Rate-wise summary (GSTR-1 Table 7, B2C others), highest value first; unknown rate last. */
export function byRate(buckets: TaxBucket[]): (TaxTotals & { rate: number })[] {
    return [...groupTotals(buckets, (b) => String(b.rate))]
        .map(([rate, t]) => ({ rate: Number(rate), ...t }))
        .sort((a, b) => (a.rate === -1 ? 1 : b.rate === -1 ? -1 : a.rate - b.rate));
}

/** HSN-wise summary (GSTR-1 Table 12): one row per HSN × rate, biggest taxable value first. */
export function byHsn(buckets: TaxBucket[], describe: (hsn: string) => string = () => ""): (TaxTotals & { hsn: string; rate: number; description: string })[] {
    return [...groupTotals(buckets, (b) => `${b.hsn}|${b.rate}`)]
        .map(([k, t]) => {
            const [hsn, rate] = k.split("|");
            return { hsn, rate: Number(rate), description: hsn ? describe(hsn) : "No HSN code", ...t };
        })
        .sort((a, b) => b.taxable - a.taxable);
}

/** Month-wise totals, in calendar order. */
export function byMonth(buckets: TaxBucket[]): (TaxTotals & { month: string })[] {
    return [...groupTotals(buckets, (b) => b.month)].map(([month, t]) => ({ month, ...t })).sort((a, b) => a.month.localeCompare(b.month));
}

/** Every month 'YYYY-MM' from `from` to `to` inclusive (dates 'YYYY-MM-DD'). */
export function monthsBetween(from: string, to: string): string[] {
    const out: string[] = [];
    let y = Number(from.slice(0, 4));
    let m = Number(from.slice(5, 7));
    const endY = Number(to.slice(0, 4));
    const endM = Number(to.slice(5, 7));
    while (y < endY || (y === endY && m <= endM)) {
        out.push(`${y}-${String(m).padStart(2, "0")}`);
        m += 1;
        if (m > 12) { m = 1; y += 1; }
        if (out.length > 240) break;
    }
    return out;
}

/** Indian financial year containing the date: { from: 'YYYY-04-01', to: 'YYYY+1-03-31', label: '2025-26' }. */
export function financialYear(date: string): { from: string; to: string; label: string } {
    const y = Number(date.slice(0, 4));
    const m = Number(date.slice(5, 7));
    const start = m >= 4 ? y : y - 1;
    return { from: `${start}-04-01`, to: `${start + 1}-03-31`, label: `${start}-${String((start + 1) % 100).padStart(2, "0")}` };
}

export interface Heads { cgst: number; sgst: number; igst: number }

export interface SetOffResult {
    liability: Heads;
    credit: Heads;
    /** Credit used against each liability head, by which credit head paid it. */
    paidByCredit: { igst: Heads; cgst: Heads; sgst: Heads };
    /** Liability left to pay in cash, per head. */
    cash: Heads;
    /** Unused credit carried forward, per head. */
    carryForward: Heads;
}

/**
 * Suggested utilisation of input tax credit against output tax (CGST Act s.49, 49A, 49B):
 *   1. IGST credit first: against IGST, then CGST, then SGST (IGST credit must be exhausted before
 *      CGST/SGST credit is used).
 *   2. CGST credit: against CGST, then IGST. Never against SGST.
 *   3. SGST credit: against SGST, then IGST. Never against CGST.
 * The GST portal lets the filer choose the CGST/SGST split of leftover IGST credit; this uses
 * CGST first, which is the portal's default order. The result is a suggestion, not the filed figure.
 */
export function setOff(liability: Heads, credit: Heads): SetOffResult {
    const due: Heads = { ...liability };
    const left: Heads = { ...credit };
    const paid = { igst: { cgst: 0, sgst: 0, igst: 0 }, cgst: { cgst: 0, sgst: 0, igst: 0 }, sgst: { cgst: 0, sgst: 0, igst: 0 } };

    const use = (from: keyof Heads, against: keyof Heads) => {
        const amt = Math.min(left[from], due[against]);
        if (amt <= 0) return;
        left[from] -= amt;
        due[against] -= amt;
        paid[from][against] += amt;
    };

    use("igst", "igst");
    use("igst", "cgst");
    use("igst", "sgst");
    use("cgst", "cgst");
    use("cgst", "igst");
    use("sgst", "sgst");
    use("sgst", "igst");

    const r = (h: Heads): Heads => ({ cgst: round2(h.cgst), sgst: round2(h.sgst), igst: round2(h.igst) });
    return {
        liability: r(liability),
        credit: r(credit),
        paidByCredit: { igst: r(paid.igst), cgst: r(paid.cgst), sgst: r(paid.sgst) },
        cash: r(due),
        carryForward: r(left),
    };
}
