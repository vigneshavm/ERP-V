/**
 * Textilesoft sales-bill arithmetic (pure: no I/O, no imports).
 *
 * Mirrors the legacy billing page's browser code (GstSalesentryNewsaleAllJS/calculation.js: gdmtr(),
 * biddis(), cal()). The MRP on a line is GST-inclusive.
 *
 * Rules kept from the ERP's existing POS writer (decided with the shop owner):
 *   - a returned item (qty < 0) is refunded at the price the customer paid and takes no discount;
 *   - the bill discount can be given in rupees (shared over the lines in proportion) or as a percentage;
 *   - the bill total is a whole rupee.
 * Legacy rules added: product discount % per line, metre items, FREE/COF/DIS lines skip the bill discount,
 * limits on the discounts.
 */

export type PromoStatus = "" | "FREE" | "COF" | "DIS";

export interface CalcLineInput {
  /** Negative = an item the customer brings back (exchange). */
  qty: number;
  /** Unit price including GST. For a returned item: what the customer paid per piece. */
  mrp: number;
  /** GST % already worked out for the line (flat, or from a slab group). */
  gstRate: number;
  unit?: "PCS" | "MTR";
  /** Metres per qty, MTR items only (blank / 0 counts as 1). */
  mtr?: number;
  /** Product discount %. */
  pdisPct?: number;
  /** FREE / COF / DIS lines never take the bill discount. */
  promo?: PromoStatus;
}

export interface CalcLimits {
  /** Highest bill discount % the user may give (specialcondion.dis_per; 0 when not allowed). */
  maxBillDisPct: number;
  /** Highest flat "less" in rupees (specialcondion.less_rang). */
  maxBillLess: number;
  /** Highest product discount % (specialcondion.pdis_per; 0 when not allowed). */
  maxProdDisPct: number;
}

export interface CalcBillInput {
  lines: CalcLineInput[];
  /** Bill discount as a percentage of the eligible lines (legacy screen). */
  bdisPct?: number;
  /** Bill discount in rupees, shared over the eligible lines in proportion to their amounts. */
  billDiscAmt?: number;
  /** Flat rupees off the bill after GST (legacy "bill less" box; not part of the taxable value). */
  billLess?: number;
  limits?: CalcLimits;
  /**
   * "single" (default, the ERP's current arithmetic): taxable = discounted amount / (1 + GST%), rounded once.
   * "legacy": unit rate is rounded to 2 decimals first, then multiplied by qty (the old screen's order).
   */
  rateRounding?: "single" | "legacy";
  /** Round the payable total to a whole rupee (default true, as the legacy screen's toFixed(0)). */
  roundTotal?: boolean;
}

export interface CalcLine {
  /** qty x metres x MRP, GST included, before any discount. */
  amount: number;
  pdisPct: number;
  pdisAmt: number;
  /** Bill-discount share taken by this line (rupees). */
  billDisAmt: number;
  /** amount - product discount (the legacy line "net", before the bill discount). */
  net: number;
  /** Unit price without GST. */
  rate: number;
  /** Taxable value (gstcrossamt). */
  gstcrossamt: number;
  gstRate: number;
  gst: number;
  cgst: number;
  sgst: number;
  /** What the customer pays for the line: net - bill discount share. */
  payable: number;
  /** True for a returned item (no discounts). */
  refund: boolean;
}

export interface CalcBill {
  lines: CalcLine[];
  gross: number;
  productDiscount: number;
  /** Rupees taken off by the bill discount (sum of the line shares). */
  billDiscount: number;
  billLess: number;
  /** gross - product discount - bill discount - bill less, before rounding. */
  totalBeforeRound: number;
  /** The amount to collect (whole rupee unless roundTotal is false). May be negative: money goes back. */
  payable: number;
  /** payable - totalBeforeRound (informational; legacy bills leave the round-off column blank). */
  roundOff: number;
  /** GST by rate, e.g. { "5": 85.71 } - feeds sales2.gst5 / gst12 / gst18 / gst28. */
  gstByRate: Record<string, number>;
  /** Items going out. */
  qtyOut: number;
  /** Items coming back (negative). */
  qtyBack: number;
  /** Total metres sold. */
  totalMtr: number;
  warnings: string[];
}

export const r2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;

/** Whole rupee, halves away from zero (the legacy screen's toFixed(0) on the till total). */
export const roundRupee = (n: number): number => (n < 0 ? -Math.round(-n) : Math.round(n));

/**
 * `discount` shared over `amounts` in proportion (to the paisa; the largest line takes the rounding so no
 * share goes negative). Amounts <= 0 take nothing.
 */
export function shareProportionally(amounts: number[], discount: number): number[] {
  const total = amounts.reduce((a, b) => a + Math.max(0, b), 0);
  const d = Math.min(Math.max(0, r2(discount)), r2(total));
  if (!d || !total) return amounts.map(() => 0);
  const out = amounts.map((a) => (a > 0 ? r2((d * a) / total) : 0));
  const diff = r2(d - out.reduce((a, b) => a + b, 0));
  out[amounts.indexOf(Math.max(...amounts))] = r2(out[amounts.indexOf(Math.max(...amounts))] + diff);
  return out;
}

export function calcBill(input: CalcBillInput): CalcBill {
  const warnings: string[] = [];
  const lim = input.limits;
  const legacy = input.rateRounding === "legacy";

  let bdisPct = Math.max(0, Number(input.bdisPct) || 0);
  if (lim && bdisPct > lim.maxBillDisPct + 1e-9) {
    warnings.push(`Bill discount ${bdisPct}% is above the allowed ${lim.maxBillDisPct}%.`);
    bdisPct = 0;
  }
  let billLess = Math.max(0, r2(Number(input.billLess) || 0));
  if (lim && billLess > lim.maxBillLess + 1e-9) {
    warnings.push(`Bill less ₹${billLess} is above the allowed ₹${lim.maxBillLess}.`);
    billLess = 0;
  }

  // Pass 1: amounts, product discount, bill-discount eligibility.
  const base = input.lines.map((l) => {
    const refund = (Number(l.qty) || 0) < 0;
    const mtrF = l.unit === "MTR" && Number(l.mtr) > 0 ? Number(l.mtr) : 1;
    let pdis = refund ? 0 : Math.max(0, Number(l.pdisPct) || 0);
    if (lim && pdis > lim.maxProdDisPct + 1e-9) {
      warnings.push(`Product discount ${pdis}% is above the allowed ${lim.maxProdDisPct}%.`);
      pdis = 0;
    }
    const amount = r2(mtrF * l.qty * l.mrp);
    const pdisAmt = pdis > 0 ? r2((amount * pdis) / 100) : 0;
    const eligible = !refund && pdis === 0 && (l.promo ?? "") === "";
    return { l, refund, mtrF, pdis, amount, pdisAmt, net: r2(amount - pdisAmt), eligible };
  });

  // Pass 2: bill discount per line.
  let shares: number[];
  const eligibleAmounts = base.map((b) => (b.eligible ? b.amount : 0));
  if (bdisPct > 0) {
    shares = base.map((b) => (b.eligible ? r2((b.amount * bdisPct) / 100) : 0));
  } else if ((Number(input.billDiscAmt) || 0) > 0) {
    shares = shareProportionally(eligibleAmounts, Number(input.billDiscAmt));
  } else {
    shares = base.map(() => 0);
  }
  if (lim && bdisPct === 0 && (Number(input.billDiscAmt) || 0) > 0) {
    const eligibleGross = r2(eligibleAmounts.reduce((a, b) => a + b, 0));
    const pct = eligibleGross > 0 ? (shares.reduce((a, b) => a + b, 0) / eligibleGross) * 100 : 0;
    if (pct > lim.maxBillDisPct + 1e-9) {
      warnings.push(`Bill discount is ${r2(pct)}% of the bill, above the allowed ${lim.maxBillDisPct}%.`);
      shares = base.map(() => 0);
    }
  }

  // Pass 3: GST per line.
  const lines: CalcLine[] = base.map((b, i) => {
    const g = b.l.gstRate;
    const share = shares[i];
    const taxableIncl = r2(b.amount - b.pdisAmt - share);
    let rate: number;
    let cross: number;
    let gst: number;
    if (legacy) {
      // Bill discounts may be entered as rupees. Use the already allocated per-line share
      // to derive this transaction line's effective rate; never reapply a percentage discount.
      const unitNetIncl = b.l.qty && b.mtrF
        ? (b.l.mrp * (1 - b.pdis / 100)) - share / (Math.abs(b.l.qty) * b.mtrF)
        : 0;
      rate = r2((r2(unitNetIncl) * 100) / (100 + g));
      cross = r2(rate * b.l.qty * b.mtrF);
      gst = r2((cross * g) / 100);
    } else {
      rate = r2((b.l.mrp * (1 - b.pdis / 100)) / (1 + g / 100));
      cross = r2(taxableIncl / (1 + g / 100));
      gst = r2(taxableIncl - cross);
    }
    const half = r2(gst / 2);
    return {
      amount: b.amount, pdisPct: b.pdis, pdisAmt: b.pdisAmt, billDisAmt: share, net: b.net, rate,
      gstcrossamt: cross, gstRate: g, gst, cgst: half, sgst: half, payable: r2(b.net - share), refund: b.refund,
    };
  });

  const sum = (f: (x: CalcLine) => number) => r2(lines.reduce((s, x) => s + f(x), 0));
  const gross = sum((x) => x.amount);
  const billDiscount = sum((x) => x.billDisAmt);
  const totalBeforeRound = r2(sum((x) => x.payable) - billLess);
  const payable = input.roundTotal === false ? totalBeforeRound : roundRupee(totalBeforeRound);
  const gstByRate: Record<string, number> = {};
  for (const x of lines) gstByRate[String(x.gstRate)] = r2((gstByRate[String(x.gstRate)] ?? 0) + x.gst);

  return {
    lines,
    gross,
    productDiscount: sum((x) => x.pdisAmt),
    billDiscount,
    billLess,
    totalBeforeRound,
    payable,
    roundOff: r2(payable - totalBeforeRound),
    gstByRate,
    qtyOut: input.lines.reduce((s, l) => s + Math.max(0, l.qty), 0),
    qtyBack: input.lines.reduce((s, l) => s + Math.min(0, l.qty), 0),
    totalMtr: r2(base.reduce((s, b) => s + (b.l.unit === "MTR" && b.l.qty > 0 ? b.mtrF * b.l.qty : 0), 0)),
    warnings,
  };
}
