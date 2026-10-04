import { describe, it, expect } from "@jest/globals";

// Only the pure row -> limits mapping is tested here; getBillingLimits is one SELECT on dbo.specialcondion.
const { limitsFromRow } = await import("../sqlBillingLimits.js");

describe("limitsFromRow (dbo.specialcondion, rows as in SSS_copy)", () => {
  it("SRI: may discount up to 60%, less up to 100, product discount up to 100%", () => {
    expect(
      limitsFromRow({ user_id: "SRI", bill_cancel: "Yes", bill_discount: "Yes", bill_less: "Yes", dis_per: "60", less_rang: "100", pdis: "Yes", pdis_per: "100" }),
    ).toEqual({ maxBillDisPct: 60, maxBillLess: 100, maxProdDisPct: 100, canCancelBill: true });
  });

  it("ADMIN: 20% / 100 / 20%", () => {
    expect(limitsFromRow({ bill_cancel: "Yes", bill_discount: "Yes", bill_less: "Yes", dis_per: "20", less_rang: "100", pdis: "Yes", pdis_per: "20" })).toMatchObject({
      maxBillDisPct: 20,
      maxBillLess: 100,
      maxProdDisPct: 20,
    });
  });

  it("a permission of No means 0, whatever the cap column holds", () => {
    expect(limitsFromRow({ bill_cancel: "Yes", bill_discount: "No", bill_less: "No", dis_per: "", less_rang: "", pdis: "No", pdis_per: "" })).toEqual({
      maxBillDisPct: 0,
      maxBillLess: 0,
      maxProdDisPct: 0,
      canCancelBill: true,
    });
    expect(limitsFromRow({ bill_discount: "No", dis_per: "50" }).maxBillDisPct).toBe(0);
  });

  it("Yes with a blank cap is not capped", () => {
    const l = limitsFromRow({ bill_discount: "Yes", dis_per: "", pdis: "Yes", pdis_per: null, bill_less: "Yes", less_rang: " " });
    expect([l.maxBillDisPct, l.maxProdDisPct, l.maxBillLess]).toEqual([Infinity, Infinity, Infinity]);
  });

  it("bill_cancel No: the user may not cancel bills", () => {
    expect(limitsFromRow({ bill_cancel: "No" }).canCancelBill).toBe(false);
  });
});
