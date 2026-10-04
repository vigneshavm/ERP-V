/**
 * POS bill rules for Textilesoft (SQL) mode that don't need the database -- kept apart so they can be tested
 * on their own. Used by PosController.createInvoiceInSql before the bill is written (sqlPosWriter.ts).
 */
import { SqlWriteError } from "./sqlWrite.js";

export interface Tenders {
  cash: number;
  card: number;
  upi: number;
  credit: number;
}

const r2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;
const EPS = 0.005;

/** Payment method names the POS / other callers use -> Textilesoft tender column. */
const METHOD: Record<string, keyof Tenders> = {
  cash: "cash",
  card: "card",
  "credit card": "card",
  "debit card": "card",
  debitcard: "card",
  creditcard: "card",
  upi: "upi",
  gpay: "upi",
  "google pay": "upi",
  googlepay: "upi",
  phonepe: "upi",
  paytm: "upi",
  credit: "credit",
  due: "credit",
};

const amount = (v: unknown, label: string): number => {
  if (v === undefined || v === null || String(v).trim() === "") return 0;
  const n = Number(String(v).replace(/,/g, ""));
  if (!Number.isFinite(n) || n < 0)
    throw new SqlWriteError(`${label} must be an amount of 0 or more (got "${String(v)}").`, 400);
  const cents = n * 100;
  if ((n !== 0 && Math.round(cents) === 0) || !Number.isSafeInteger(Math.round(cents)) || Math.abs(cents - Math.round(cents)) > 1e-8)
    throw new SqlWriteError(`${label} must fit the existing two-decimal payment precision.`, 400);
  return n;
};

const tenderOf = (method: unknown): keyof Tenders => {
  const k = METHOD[String(method ?? "").trim().toLowerCase()];
  if (!k)
    throw new SqlWriteError(
      `Payment method "${String(method ?? "")}" isn't supported for shop-database bills; use cash, card, UPI or credit.`,
      400,
    );
  return k;
};

export interface TenderInput {
  total: number;
  paymentMethod?: unknown;
  paidAmount?: unknown;
  /** [{ method, amount }] -- when given, it decides the tenders (paymentMethod / paidAmount are ignored). */
  splitPaymentDetails?: unknown;
  /** A named customer with a phone number (or a saved customer) -- required for anything left on credit. */
  hasCustomer: boolean;
  /** The till says the bill was paid in full with paymentMethod: pay the server's total (which can differ
   *  from the till's, e.g. returned items are refunded at what was paid for them). */
  paidInFull?: boolean;
}

/**
 * How a bill was paid, per Textilesoft tender column (s_recevied_cashamt / s_card_amt / s_googlepay /
 * s_credit_amt). Rules:
 *   - a split payment keeps each part (cash + UPI stays cash + UPI, not all cash);
 *   - card / UPI can't be more than the bill; extra cash is change (the cash column keeps what was kept);
 *   - whatever isn't paid is credit, and credit needs a customer -- an unpaid walk-in bill is refused.
 */
export function posTenders(input: TenderInput): Tenders & { change: number } {
  if (!Number.isFinite(input.total))
    throw new SqlWriteError("The bill total must be finite before settling payment.", 400);
  amount(Math.abs(input.total), "Bill total");
  if (input.splitPaymentDetails != null && !Array.isArray(input.splitPaymentDetails))
    throw new SqlWriteError("Split payment details must be an array; no payment was substituted.", 400);
  const split = Array.isArray(input.splitPaymentDetails) ? input.splitPaymentDetails : [];
  if (input.total < -EPS && split.length)
    throw new SqlWriteError("Split refunds are unavailable. Choose one supported refund payment method.", 400);
  // Exchange bill where the returned items are worth more than the new ones: money goes back to the
  // customer. Recorded as a negative amount in the tender it's paid out from (cash by default); a refund
  // onto the customer's credit needs a customer. Split refunds aren't supported.
  if ((Number(input.total) || 0) < -EPS) {
    const refund = r2(-Number(input.total));
    const k = tenderOf(input.paymentMethod ?? "cash");
    if (k === "credit" && !input.hasCustomer)
      throw new SqlWriteError("A refund onto credit needs the customer (name and phone).", 400);
    const t: Tenders = { cash: 0, card: 0, upi: 0, credit: 0 };
    t[k] = -refund;
    return { ...t, change: 0 };
  }
  const total = r2(Math.max(0, Number(input.total) || 0));
  const t: Tenders = { cash: 0, card: 0, upi: 0, credit: 0 };
  if (split.length) {
    split.forEach((s: { method?: unknown; amount?: unknown }, i: number) => {
      if (!s || typeof s !== "object" || s.amount === undefined || s.amount === null || String(s.amount).trim() === "")
        throw new SqlWriteError(`Split payment ${i + 1} needs an explicit method and amount.`, 400);
      t[tenderOf(s.method)] += amount(s.amount, `Split payment ${i + 1}`);
    });
  } else {
    const k = tenderOf(input.paymentMethod ?? "cash");
    if (k === "credit") t.credit = total;
    else if (input.paidInFull) t[k] = total;
    else t[k] = Math.min(amount(input.paidAmount, "Paid amount"), k === "cash" ? Infinity : total);
    if (!input.paidInFull && k !== "credit" && k !== "cash" && amount(input.paidAmount, "Paid amount") > total + EPS)
      throw new SqlWriteError(`The ${k === "upi" ? "UPI" : "card"} amount is more than the bill total (₹${total}).`, 400);
  }
  if (t.card + t.upi > total + EPS)
    throw new SqlWriteError(`Card + UPI (₹${r2(t.card + t.upi)}) is more than the bill total (₹${total}).`, 400);
  if (t.card + t.upi + t.credit > total + EPS)
    throw new SqlWriteError(`Credit + card + UPI is more than the bill total (₹${total}).`, 400);
  // Extra cash is change: keep only what the bill needs.
  const cashNeeded = r2(total - t.card - t.upi - t.credit);
  const change = t.cash > cashNeeded + EPS ? r2(t.cash - cashNeeded) : 0;
  t.cash = Math.min(t.cash, cashNeeded);
  // Anything unpaid is credit.
  const unpaid = r2(total - t.cash - t.card - t.upi - t.credit);
  if (unpaid > EPS) t.credit += unpaid;
  if (t.credit > EPS && !input.hasCustomer)
    throw new SqlWriteError(
      `₹${r2(t.credit)} of this bill isn't paid. Collect it, or choose the customer (name and phone) to bill it on credit.`,
      400,
    );
  return { cash: r2(t.cash), card: r2(t.card), upi: r2(t.upi), credit: r2(t.credit), change };
}

/**
 * Why a line's price needs a manager's OK, or null. ₹0 lines and prices above the item's MRP are allowed
 * only with approval (same approvers as a large discount); lower prices within MRP are the cashier's call.
 */
export function priceApprovalReason(name: string, unitPriceIncl: number, mrp?: number): string | null {
  if (!(unitPriceIncl > 0)) return `${name} is billed at ₹0`;
  if (mrp !== undefined && mrp > 0 && unitPriceIncl > mrp + EPS)
    return `${name} is billed at ₹${r2(unitPriceIncl)}, above its MRP ₹${r2(mrp)}`;
  return null;
}

// ------------------------------------------------------------------------------------------------
// GST on a sale (#1) and bill discount (#2)
// ------------------------------------------------------------------------------------------------

/**
 * GST % for one piece sold at `unitPriceIncl` (GST included) under a Textilesoft gstgroup row. A flat group
 * (GST5, GST18 ...) has one rate. A slab group (gst / gst1..3 with from_amount / to_amount, e.g. 5% up to
 * 2500 and 18% above) uses the legacy Textilesoft column names. Slab selection receives the
 * transaction price after line and allocated bill discounts, inclusive or exclusive per till mode.
 */
export type SaleGstBasis = "exGst" | "legacy";

export function saleGstRate(
  group: Record<string, unknown>,
  unitPrice: number,
  /** true when unitPrice is already without GST (GST-exclusive till). */
  priceIsExGst = false,
  basis: SaleGstBasis = "exGst",
): number {
  const str = (v: unknown) => (v === null || v === undefined ? "" : String(v).trim());
  const slabs = ["", "1", "2", "3"]
    .map((k) => ({
      gst: str(group[`gst${k}`]),
      from: Number(str(group[`sales_from_amount${k}`] ?? group[`sales_from_amount${k ? `_${k}` : ""}`] ?? group[`from_amount${k}`]) || 0),
      to: Number(str(group[`sales_to_amount${k}`] ?? group[`sales_to_amount${k ? `_${k}` : ""}`] ?? group[`to_amount${k}`]) || Infinity),
    }))
    .filter((s) => s.gst !== "" && Number.isFinite(Number(s.gst)));
  if (slabs.length <= 1) return Number(slabs[0]?.gst ?? str(group.gst) ?? 0) || 0;
  for (const s of slabs) {
    const g = Number(s.gst);
    const slabPrice = basis === "legacy"
      ? unitPrice
      : priceIsExGst ? unitPrice : unitPrice / (1 + g / 100);
    if (slabPrice >= s.from - 0.005 && slabPrice <= s.to + 0.005) return g;
  }
  return Number(slabs[slabs.length - 1].gst) || 0;
}

/**
 * The bill discount shared over the lines in proportion to their amounts (to the paisa; the last line takes
 * the rounding). GST is then worked out on each line's discounted amount -- a bill discount lowers the
 * taxable value.
 */
export function shareDiscount(amounts: number[], discount: number): number[] {
  // Only new items (positive amounts) take the bill discount; returned items are refunded at what was paid.
  const total = amounts.reduce((a, b) => a + Math.max(0, b), 0);
  const d = Math.min(Math.max(0, r2(discount)), r2(total));
  if (!d || !total) return amounts.map(() => 0);
  const out = amounts.map((a) => (a > 0 ? r2((d * a) / total) : 0));
  const diff = r2(d - out.reduce((a, b) => a + b, 0));
  // put the rounding on the largest line so no share goes negative
  const i = amounts.indexOf(Math.max(...amounts));
  out[i] = r2(out[i] + diff);
  return out;
}
