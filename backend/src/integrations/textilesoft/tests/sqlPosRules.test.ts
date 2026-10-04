import { describe, it, expect } from "@jest/globals";
import { posTenders, priceApprovalReason, saleGstRate, shareDiscount } from "../sqlPosRules.js";

// POS tenders (#3) and price approval (#4) for shop-database bills.
describe("posTenders", () => {
  const walkIn = { hasCustomer: false };

  it("single tender, paid in full", () => {
    expect(posTenders({ total: 1050, paymentMethod: "upi", paidAmount: 1050, ...walkIn })).toEqual({ cash: 0, card: 0, upi: 1050, credit: 0, change: 0 });
    expect(posTenders({ total: 1050, paymentMethod: "CARD", paidAmount: 1050, ...walkIn })).toMatchObject({ card: 1050 });
  });

  it("extra cash is change; the bill keeps only what it needed", () => {
    expect(posTenders({ total: 1050, paymentMethod: "cash", paidAmount: 2000, ...walkIn })).toEqual({ cash: 1050, card: 0, upi: 0, credit: 0, change: 950 });
  });

  it("split payments keep each part (not all cash)", () => {
    const t = posTenders({
      total: 1050,
      splitPaymentDetails: [
        { method: "cash", amount: 500 },
        { method: "Google Pay", amount: 550 },
      ],
      ...walkIn,
    });
    expect(t).toEqual({ cash: 500, card: 0, upi: 550, credit: 0, change: 0 });
  });

  it("card / UPI can't be more than the bill", () => {
    expect(() => posTenders({ total: 100, paymentMethod: "card", paidAmount: 150, ...walkIn })).toThrow(/card amount is more than the bill total/);
    expect(() =>
      posTenders({ total: 100, splitPaymentDetails: [{ method: "upi", amount: 80 }, { method: "card", amount: 50 }], ...walkIn }),
    ).toThrow(/Card \+ UPI/);
  });

  it("unpaid amounts are credit, and credit needs a customer", () => {
    expect(() => posTenders({ total: 1050, paymentMethod: "cash", paidAmount: 1000, ...walkIn })).toThrow(/₹50 of this bill isn't paid/);
    expect(() => posTenders({ total: 1050, paymentMethod: "credit", ...walkIn })).toThrow(/₹1050 of this bill isn't paid/);
    expect(posTenders({ total: 1050, paymentMethod: "cash", paidAmount: 1000, hasCustomer: true })).toMatchObject({ cash: 1000, credit: 50 });
    expect(posTenders({ total: 1050, paymentMethod: "credit", hasCustomer: true })).toMatchObject({ credit: 1050 });
  });

  it("unknown methods and bad amounts are refused", () => {
    expect(() => posTenders({ total: 10, paymentMethod: "cheque", paidAmount: 10, ...walkIn })).toThrow(/isn't supported/);
    expect(() => posTenders({ total: 10, splitPaymentDetails: [{ method: "cash", amount: -5 }], ...walkIn })).toThrow(/Split payment 1/);
  });
});

describe("priceApprovalReason", () => {
  it("₹0 and above-MRP lines need approval; below MRP doesn't", () => {
    expect(priceApprovalReason("SHIRT", 0, 800)).toBe("SHIRT is billed at ₹0");
    expect(priceApprovalReason("SHIRT", 900, 800)).toBe("SHIRT is billed at ₹900, above its MRP ₹800");
    expect(priceApprovalReason("SHIRT", 750, 800)).toBeNull();
    expect(priceApprovalReason("SAREE", 500)).toBeNull(); // Quick Entry: no MRP
  });
});

describe("saleGstRate", () => {
  const flat = { gst_name: "GST5", gst: "5" };
  const slab = { gst: "5", sales_from_amount: "0", sales_to_amount: "2500", gst1: "18", sales_from_amount1: "2500.01", sales_to_amount1: "999999" };
  it("flat group: one rate", () => {
    expect(saleGstRate(flat, 21000)).toBe(5);
  });
  it("slab group: chosen on the value without GST", () => {
    expect(saleGstRate(slab, 2625)).toBe(5); // 2500 + 5%
    expect(saleGstRate(slab, 2000)).toBe(5);
    expect(saleGstRate(slab, 2950)).toBe(18); // 2500 + 18% -> 2500 ex-GST sits on the edge; above 2625 incl. 5% it's 18
    expect(saleGstRate(slab, 5900)).toBe(18);
    expect(saleGstRate(slab, 2500, true)).toBe(5);
    expect(saleGstRate(slab, 2600, true)).toBe(18);
  });
  it("legacy basis compares the inclusive per-unit price directly with the slab", () => {
    expect(saleGstRate(slab, 2500, false, "legacy")).toBe(5);
    expect(saleGstRate(slab, 2501, false, "legacy")).toBe(18);
    expect(saleGstRate(slab, 2600, false, "legacy")).toBe(18);
  });
});

describe("shareDiscount", () => {
  it("in proportion, to the paisa, summing to the discount", () => {
    const s = shareDiscount([2000, 1180], 100);
    expect(s).toEqual([62.89, 37.11]);
    const t = shareDiscount([100, 100, 100], 10);
    expect(t.reduce((a, b) => a + b, 0)).toBeCloseTo(10, 5);
    expect(shareDiscount([100], 500)).toEqual([100]); // never more than the lines
    expect(shareDiscount([100, 50], 0)).toEqual([0, 0]);
  });
});

describe("refunds and discounts on exchange bills", () => {
  it("a negative total is a refund out of the chosen tender; onto credit needs a customer", () => {
    expect(posTenders({ total: -500, paymentMethod: "cash", hasCustomer: false })).toEqual({ cash: -500, card: 0, upi: 0, credit: 0, change: 0 });
    expect(posTenders({ total: -500, paymentMethod: "upi", hasCustomer: false })).toMatchObject({ upi: -500 });
    expect(() => posTenders({ total: -500, paymentMethod: "credit", hasCustomer: false })).toThrow(/refund onto credit/);
  });

  it("paid in full pays the server's total, whatever the till's figure", () => {
    expect(posTenders({ total: 1015, paymentMethod: "card", paidAmount: 999, paidInFull: true, hasCustomer: false })).toMatchObject({ card: 1015, credit: 0 });
  });

  it("returned lines (negative) take no share of the bill discount", () => {
    expect(shareDiscount([-500, 1000, 1000], 100)).toEqual([0, 50, 50]);
  });
});

describe("SQL payment payload safety", () => {
  it.each([NaN, Infinity, -Infinity])("rejects invalid bill total %s instead of substituting zero", total => {
    expect(() => posTenders({ total, paymentMethod: "cash", paidInFull: true, hasCustomer: false })).toThrow("finite");
  });
  it.each([{}, "cash", 123])("rejects malformed split container %s instead of using a single tender", splitPaymentDetails => {
    expect(() => posTenders({ total: 100, paymentMethod: "cash", paidInFull: true, splitPaymentDetails, hasCustomer: false })).toThrow("must be an array");
  });
  it("refuses split refunds instead of silently posting one tender", () => {
    expect(() => posTenders({ total: -100, paymentMethod: "cash", splitPaymentDetails: [{ method: "cash", amount: 50 }, { method: "upi", amount: 50 }], hasCustomer: false })).toThrow("Split refunds are unavailable");
  });
  it.each([undefined, null, ""])("refuses split entry with missing amount %s", amount => {
    expect(() => posTenders({ total: 0, splitPaymentDetails: [{ method: "cash", amount }], hasCustomer: false })).toThrow("explicit method and amount");
  });
  it("rejects an amount that the existing SQL writer would round", () => {
    expect(() => posTenders({ total: 100, splitPaymentDetails: [{ method: "cash", amount: 50.001 }, { method: "upi", amount: 49.999 }], hasCustomer: false })).toThrow("two-decimal payment precision");
  });
  it("retains two-decimal split amounts and cash change", () => {
    expect(posTenders({ total: 100, splitPaymentDetails: [{ method: "cash", amount: 70.25 }, { method: "upi", amount: 40.5 }], hasCustomer: false })).toEqual({ cash: 59.5, card: 0, upi: 40.5, credit: 0, change: 10.75 });
  });
  it("rejects a non-zero amount that SQL would store as zero", () => {
    expect(() => posTenders({ total: 100, splitPaymentDetails: [{ method: "cash", amount: 1e-12 }, { method: "upi", amount: 100 }], hasCustomer: false })).toThrow("two-decimal payment precision");
  });
  it("refuses underpaid walk-in split instead of inventing customer credit", () => {
    expect(() => posTenders({ total: 100, splitPaymentDetails: [{ method: "cash", amount: 40 }, { method: "upi", amount: 50 }], hasCustomer: false })).toThrow("isn't paid");
  });
});
