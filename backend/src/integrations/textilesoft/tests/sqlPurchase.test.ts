import { describe, it, expect } from "@jest/globals";
import {
  barcodePrefix,
  barcodeOrder,
  prateCode,
  lineMath,
  gstForAmount,
} from "../sqlPurchase.js";

// Expected values are real rows from the shop's Textilesoft data (SSS_copy, Sep 2026).
describe("Textilesoft purchase formats", () => {
  it("barcode prefix = reversed year (2) + reversed month + reversed day + counter serial", () => {
    expect(barcodePrefix(new Date(2026, 8, 26))).toBe("629621"); // 6296211 .. 62962113 on 26/09/2026
    expect(barcodePrefix(new Date(2026, 8, 19))).toBe("629911");
    expect(barcodePrefix(new Date(2026, 8, 9))).toBe("62991"); // barLen 5
    expect(barcodePrefix(new Date(2026, 7, 31))).toBe("628131");
    expect(barcodePrefix(new Date(2025, 11, 31))).toBe("5221131"); // barLen 7
    expect(barcodePrefix(new Date(2025, 9, 1))).toBe("520111");
    expect(barcodePrefix(new Date(2026, 9, 2), "1", barcodeOrder({ year_pos: "1", month_pos: "2", date_pos: "3", reverse_con: "Yes", date_con: "No", month_con: "No", year_con: "No", month_gen: "No" } as any))).toBe("620121"); // 02/10/2026
    expect(barcodePrefix(new Date(2026, 9, 2), "1", ["day", "month", "year"])).toBe("201621");
    expect(() => barcodeOrder({ date_con: "Yes" } as any)).toThrow(/not supported/);
  });

  it("pratecode enciphers the purchase rate with grndetail.pur_code", () => {
    const key = "VSAPLMKTRNX";
    expect(prateCode(750, key)).toBe("KLNXNN");
    expect(prateCode(740, key)).toBe("KPNXNN");
    expect(prateCode(600, key)).toBe("MNNXNN");
    expect(prateCode(220, key)).toBe("SSNXNN");
    expect(prateCode(125, key)).toBe("VSLXNN");
  });

  it("line maths match Textilesoft's rows", () => {
    // VJ114098 line 4: PANT 2 x 750, GST 5%, MRP 800 -> sr_per 1.59, sr_rate 761.92
    expect(lineMath({ qty: 2, prate: 750, mrp: 800 }, 5)).toMatchObject({
      amount: 1500,
      gstAmount: 75,
      netAmount: 1575,
      nrate: 787.5,
      srPer: 1.59,
      srRate: 761.92,
    });
    // sr_rate rounding: 740 / MRP 780 -> 0.39% -> 742.89 ; 700 / MRP 780 -> 6.12% -> 742.84
    expect(lineMath({ qty: 1, prate: 740, mrp: 780 }, 5)).toMatchObject({
      srPer: 0.39,
      srRate: 742.89,
    });
    expect(lineMath({ qty: 1, prate: 700, mrp: 780 }, 5)).toMatchObject({
      srPer: 6.12,
      srRate: 742.84,
    });
    for (const [prate, mrp, srRate] of [
      [750, 790, 752.4],
      [600, 640, 609.54],
      [220, 240, 228.58],
      [700, 770, 733.32],
      [700, 750, 714.28],
      [750, 825, 785.7],
    ]) {
      expect(lineMath({ qty: 1, prate, mrp }, 5).srRate).toBe(srRate);
    }
    // BRA 3 x 125, MRP 135 -> sr_per 2.86, sr_rate 128.57
    expect(lineMath({ qty: 3, prate: 125, mrp: 135 }, 5)).toMatchObject({
      amount: 375,
      gstAmount: 18.75,
      netAmount: 393.75,
      nrate: 131.25,
      srPer: 2.86,
      srRate: 128.57,
    });
  });

  it("metre items: amount = rate x qty x metres", () => {
    expect(lineMath({ qty: 3, mtr: 1, prate: 55, mrp: 60 }, 5)).toMatchObject({
      units: 3,
      amount: 165,
      gstAmount: 8.25,
      netAmount: 173.25,
    });
    expect(lineMath({ qty: 1, mtr: 2, prate: 55, mrp: 60 }, 5)).toMatchObject({
      units: 2,
      amount: 110,
      gstAmount: 5.5,
      netAmount: 115.5,
    });
  });

  it("discount and less come off before GST", () => {
    const m = lineMath(
      { qty: 10, prate: 100, mrp: 150, less: 50, discountPercent: 10 },
      5,
    );
    expect(m).toMatchObject({
      amount: 1000,
      plamt: 950,
      disAmount: 95,
      gstAmount: 42.75,
      netAmount: 897.75,
    });
  });

  it("GST slab by amount (NEWGST18: 5% up to 2500, 18% above)", () => {
    const g = {
      gst: "5",
      from_amount: "1",
      to_amount: "2500",
      gst1: "18",
      from_amount1: "2501",
      to_amount1: "100000",
    };
    expect(gstForAmount(g, 999)).toBe(5);
    expect(gstForAmount(g, 3000)).toBe(18);
  });
});
