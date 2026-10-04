import { describe, it, expect } from "@jest/globals";
import { calcBill, roundRupee, shareProportionally } from "../salesCalc.js";

// Vectors worked by hand from the legacy screen's rules (calculation.js gdmtr / biddis / cal).
describe("calcBill - legacy order of rounding (bill discount %)", () => {
  it("V1: MRP 1000, GST 5%, qty 2, bill discount 10%", () => {
    const b = calcBill({ lines: [{ qty: 2, mrp: 1000, gstRate: 5 }], bdisPct: 10, rateRounding: "legacy" });
    expect(b.lines[0]).toMatchObject({ amount: 2000, billDisAmt: 200, rate: 857.14, gstcrossamt: 1714.28, gst: 85.71, cgst: 42.86, sgst: 42.86 });
    expect(b.payable).toBe(1800);
    expect(b.gstByRate).toEqual({ "5": 85.71 });
  });
});

describe("calcBill - product discount", () => {
  it("V2: MRP 500, GST 12%, qty 1, product discount 20%", () => {
    const b = calcBill({ lines: [{ qty: 1, mrp: 500, gstRate: 12, pdisPct: 20 }], rateRounding: "legacy" });
    expect(b.lines[0]).toMatchObject({ amount: 500, pdisAmt: 100, net: 400, rate: 357.14, gst: 42.86 });
    expect(b.payable).toBe(400);
    expect(b.productDiscount).toBe(100);
  });
  it("the unit rate (ex GST) is after the product discount", () => {
    const b = calcBill({ lines: [{ qty: 2, mrp: 500, gstRate: 5, pdisPct: 10 }] });
    expect(b.lines[0]).toMatchObject({ rate: 428.57, pdisAmt: 100, net: 900, gstcrossamt: 857.14, gst: 42.86 });
  });
  it("a line with a product discount does not take the bill discount", () => {
    const b = calcBill({
      lines: [{ qty: 1, mrp: 500, gstRate: 12, pdisPct: 20 }, { qty: 1, mrp: 1000, gstRate: 5 }],
      bdisPct: 10,
    });
    expect(b.lines[0].billDisAmt).toBe(0);
    expect(b.lines[1].billDisAmt).toBe(100);
    expect(b.payable).toBe(1300);
  });
});

describe("calcBill - returned items (refunded at what was paid, no discount)", () => {
  it("V3: a returned line takes no bill discount", () => {
    const b = calcBill({
      lines: [{ qty: 1, mrp: 1000, gstRate: 5 }, { qty: -1, mrp: 300, gstRate: 5 }],
      bdisPct: 10,
    });
    expect(b.billDiscount).toBe(100);
    expect(b.payable).toBe(600);
    expect(b.qtyOut).toBe(1);
    expect(b.qtyBack).toBe(-1);
    expect(b.lines[1]).toMatchObject({ amount: -300, refund: true, billDisAmt: 0, gstcrossamt: -285.71 });
  });
  it("a returned line ignores its product discount", () => {
    const b = calcBill({ lines: [{ qty: -1, mrp: 300, gstRate: 5, pdisPct: 10 }] });
    expect(b.lines[0].pdisAmt).toBe(0);
    expect(b.payable).toBe(-300);
  });
});

describe("calcBill - bill discount in rupees (the ERP till)", () => {
  it("is shared over the eligible lines in proportion; GST on the discounted amount", () => {
    const b = calcBill({ lines: [{ qty: 1, mrp: 1000, gstRate: 5 }, { qty: 1, mrp: 3000, gstRate: 18 }], billDiscAmt: 400 });
    expect(b.lines.map((l) => l.billDisAmt)).toEqual([100, 300]);
    expect(b.lines[0]).toMatchObject({ gstcrossamt: 857.14, gst: 42.86, cgst: 21.43, sgst: 21.43 });
    expect(b.lines[1]).toMatchObject({ gstcrossamt: 2288.14, gst: 411.86 });
    expect(b.billDiscount).toBe(400);
    expect(b.payable).toBe(3600);
  });
  it("cannot exceed the eligible amount", () => {
    const b = calcBill({ lines: [{ qty: 1, mrp: 100, gstRate: 5 }], billDiscAmt: 500 });
    expect(b.billDiscount).toBe(100);
    expect(b.payable).toBe(0);
  });
  it("FREE / COF / DIS lines are skipped", () => {
    const b = calcBill({ lines: [{ qty: 1, mrp: 100, gstRate: 5, promo: "FREE" }, { qty: 1, mrp: 100, gstRate: 5 }], billDiscAmt: 20 });
    expect(b.lines.map((l) => l.billDisAmt)).toEqual([0, 20]);
  });
});

describe("calcBill - metres, rounding, limits", () => {
  it("V5: metre item", () => {
    const b = calcBill({ lines: [{ qty: 1, mrp: 200, gstRate: 5, unit: "MTR", mtr: 2.5 }] });
    expect(b.lines[0].amount).toBe(500);
    expect(b.totalMtr).toBe(2.5);
    expect(b.payable).toBe(500);
  });
  it("a PCS line ignores a metres value", () => {
    expect(calcBill({ lines: [{ qty: 2, mrp: 100, gstRate: 5, unit: "PCS", mtr: 9 }] }).payable).toBe(200);
  });
  it("the total is a whole rupee; the difference is reported", () => {
    const b = calcBill({ lines: [{ qty: 3, mrp: 333.33, gstRate: 5 }], billLess: 0.4 });
    expect(b.totalBeforeRound).toBe(999.59);
    expect(b.payable).toBe(1000);
    expect(b.roundOff).toBe(0.41);
    expect(calcBill({ lines: [{ qty: 3, mrp: 333.33, gstRate: 5 }], roundTotal: false }).payable).toBe(999.99);
  });
  it("V4: a bill discount % above the user's limit is ignored with a warning", () => {
    const b = calcBill({
      lines: [{ qty: 1, mrp: 1000, gstRate: 5 }], bdisPct: 30,
      limits: { maxBillDisPct: 20, maxBillLess: 100, maxProdDisPct: 50 },
    });
    expect(b.billDiscount).toBe(0);
    expect(b.warnings).toHaveLength(1);
  });
  it("a rupee bill discount above the limit (as a % of the bill) is ignored with a warning", () => {
    const b = calcBill({
      lines: [{ qty: 1, mrp: 1000, gstRate: 5 }], billDiscAmt: 300,
      limits: { maxBillDisPct: 20, maxBillLess: 100, maxProdDisPct: 50 },
    });
    expect(b.billDiscount).toBe(0);
    expect(b.warnings[0]).toMatch(/above the allowed 20%/);
  });
  it("product discount and bill less above their limits are dropped", () => {
    const b = calcBill({
      lines: [{ qty: 1, mrp: 1000, gstRate: 5, pdisPct: 60 }], billLess: 500,
      limits: { maxBillDisPct: 20, maxBillLess: 100, maxProdDisPct: 50 },
    });
    expect(b.productDiscount).toBe(0);
    expect(b.billLess).toBe(0);
    expect(b.warnings).toHaveLength(2);
  });
  it("a user without permission (limits 0) cannot discount", () => {
    const b = calcBill({ lines: [{ qty: 1, mrp: 1000, gstRate: 5, pdisPct: 5 }], limits: { maxBillDisPct: 0, maxBillLess: 0, maxProdDisPct: 0 } });
    expect(b.productDiscount).toBe(0);
  });
});

describe("helpers", () => {
  it("roundRupee rounds halves away from zero", () => {
    expect([roundRupee(10.5), roundRupee(10.49), roundRupee(-10.5), roundRupee(-0.4)]).toEqual([11, 10, -11, -0]);
  });
  it("shareProportionally gives the rounding to the largest line and never negative shares", () => {
    const s = shareProportionally([100, 200, 300], 100);
    expect(s.reduce((a, b) => a + b, 0)).toBe(100);
    expect(s.every((x) => x >= 0)).toBe(true);
    expect(shareProportionally([100, -50], 30)).toEqual([30, 0]);
  });
});
