import { describe, it, expect, beforeEach, jest } from "@jest/globals";

type Row = Record<string, unknown>;
let db: Record<string, Row[]> = {};
const eq = (a: unknown, b: unknown) =>
  String(a ?? "").trim().toLowerCase() === String(b ?? "").trim().toLowerCase();

function run(text: string, _p: Record<string, unknown> = {}): Row[] {
  if (/FROM dbo\.\[HSNDetails\]/.test(text)) {
    return (db.HSNDetails ?? []).map((r) => ({
      g: r.group_cd,
      code: r.name_eng,
      name: r.prin_name_eng,
    }));
  }
  if (/FROM dbo\.\[sales2\] AS s JOIN dbo\.\[salsntry\] AS l/.test(text)) {
    // Outward lines query
    const out: Row[] = [];
    for (const h of db.sales2 ?? []) {
      if (h.status === "1") continue; // only live bills
      const lines = (db.salsntry ?? []).filter((l) => eq(l.systemidbill, h.sysidandbill));
      for (const l of lines) {
        out.push({
          m: "2026-09",
          rate: l.hdngst || "5",
          hsn: l.hsncode || "6205",
          inter: Number(h.igstper || 0) > 0 ? 1 : 0,
          lines: 1,
          qty: Number(l.qty || 0),
          value: Number(l.net_amount || 0),
          tax: Number(l.tax || 0),
        });
      }
    }
    return out;
  }
  if (/FROM dbo\.\[sales2\] AS s WHERE s\.\[date\] >=/.test(text)) {
    if (/ROW_NUMBER\(\) OVER \(PARTITION BY/.test(text)) {
      // Table 13: one row per bill series (counter letter of sales2.mode), first/last sysidandbill
      const map = new Map<string, { from: string; to: string; total: number; cancelled: number }>();
      const bills = [...(db.sales2 ?? [])].sort(
        (a, b) => String(a.date).localeCompare(String(b.date)) || Number(a.billno) - Number(b.billno),
      );
      for (const s of bills) {
        const series = String(s.mode ?? "").trim().replace(/\d.*$/, "") || String(s.systemname ?? "").trim();
        const doc = String(s.sysidandbill ?? "").trim();
        const cancelled = s.status === "1" ? 1 : 0;
        const cur = map.get(series);
        if (!cur) map.set(series, { from: doc, to: doc, total: 1, cancelled });
        else { cur.to = doc; cur.total += 1; cur.cancelled += cancelled; }
      }
      return Array.from(map.entries()).map(([series, d]) => ({
        series, fromDoc: d.from, toDoc: d.to, total: d.total, cancelled: d.cancelled,
      }));
    }
    // Outward headers summary
    let bills = 0, billValue = 0, headerTax = 0, cancelledBills = 0, cancelledValue = 0, interBills = 0;
    for (const s of db.sales2 ?? []) {
      const val = Number(s.tot_netamnt || 0);
      const isInter = Number(s.igstper || 0) > 0;
      if (s.status === "1") {
        cancelledBills++;
        cancelledValue += val;
      } else {
        bills++;
        billValue += val;
        headerTax += Number(s.gst5 || 0) + Number(s.gst12 || 0) + Number(s.gst18 || 0) + Number(s.gst28 || 0);
        if (isInter) interBills++;
      }
    }
    return [{
      bills,
      billValue,
      headerTax,
      cancelledBills,
      cancelledValue,
      interBills,
    }];
  }
  if (/FROM dbo\.\[purentrydetails\] AS p/.test(text)) {
    // Inward purchases
    return (db.purentrydetails ?? []).map((l) => ({
      doc: l.grn_no,
      d: "2026-09-30",
      invDate: "2026-09-25",
      sup: "RAMRAJ",
      gstin: "33AAAAA0000A1Z5",
      inter: 0,
      rate: l.gst_per || "5",
      lines: 1,
      qty: Number(l.qty || 0),
      value: Number(l.net_amount || 0),
      tax: Number(l.gst_amount || 0),
    }));
  }
  if (/FROM dbo\.\[PurchaseReturnDetails\] AS p/.test(text)) {
    // Inward returns
    return (db.PurchaseReturnDetails ?? []).map((l) => ({
      doc: l.grn_no,
      d: "2026-09-30",
      invDate: null,
      sup: "RAMRAJ",
      gstin: "33AAAAA0000A1Z5",
      inter: 0,
      rate: l.gst_per || "5",
      lines: 1,
      qty: Number(l.qty || 0),
      value: Number(l.net_amount || 0),
      tax: Number(l.gst_amount || 0),
    }));
  }
  throw new Error("unexpected query: " + text);
}

class FakeRequest {
  params: Record<string, unknown> = {};
  input(k: string, v: unknown) {
    this.params[k] = v;
    return this;
  }
  async query(sqlText: string) {
    return { recordset: run(sqlText, this.params) };
  }
}

const mockPool = {
  request: () => new FakeRequest(),
};

jest.unstable_mockModule("../sqlItemSource.js", () => ({
  getPool: async () => mockPool,
}));

jest.unstable_mockModule("../sqlShopClock.js", () => ({
  shopAsOf: async () => "2026-09-30T18:00:00Z",
}));

const gstReports = await import("../sqlGstReports.js");
const gstMath = await import("../../../modules/finance/services/gstMath.js");

beforeEach(() => {
  db = {
    HSNDetails: [
      { group_cd: "GRP6205", name_eng: "6205", prin_name_eng: "Men's Shirts of cotton" },
      { group_cd: "GRP5208", name_eng: "5208", prin_name_eng: "Woven fabrics of cotton" },
    ],
    sales2: [
      {
        mode: "A101",
        billno: 101,
        date: "2026-09-30",
        sysidandbill: "1300926101",
        tot_netamnt: "1050",
        gst5: "50",
        igstper: "0",
        status: "0", // live
      },
      {
        mode: "A102",
        billno: 102,
        date: "2026-09-30",
        sysidandbill: "1300926102",
        tot_netamnt: "525",
        gst5: "25",
        igstper: "0",
        status: "1", // cancelled
      },
    ],
    salsntry: [
      {
        systemidbill: "1300926101",
        hsncode: "6205",
        hdngst: "5",
        qty: "2",
        net_amount: "1050",
        tax: "50",
      },
    ],
    purentrydetails: [
      {
        grn_no: "VJ100",
        gst_per: "5",
        qty: "10",
        net_amount: "5250",
        gst_amount: "250",
      },
    ],
    PurchaseReturnDetails: [
      {
        grn_no: "VJ100",
        gst_per: "5",
        qty: "2",
        net_amount: "1050",
        gst_amount: "50",
      },
    ],
  };
});

describe("Textilesoft GST and Tax Reporting (10_gst.md)", () => {
  describe("Pure GST Math (gstMath.ts)", () => {
    it("resolves GST slabs accurately and detects nearest slab", () => {
      expect(gstMath.resolveRate("5%", 1000, 50)).toBe(5);
      expect(gstMath.resolveRate(18, 1000, 180)).toBe(18);
      expect(gstMath.resolveRate("", 1000, 50.2)).toBe(5); // implied 5.02% -> snaps to 5%
      expect(gstMath.resolveRate("", 1000, 200)).toBe(-1); // 20% is not a valid slab
      expect(gstMath.resolveRate("", -1000, -50)).toBe(5); // returned line: same ratio
      expect(gstMath.resolveRate("", -500, 0)).toBe(0);
      expect(gstMath.resolveRate("", 1000, -50)).toBe(-1); // signs disagree: not a rate
    });

    it("splits intra-state tax 50/50 and keeps inter-state in IGST", () => {
      const intra = gstMath.splitTax(100, false);
      expect(intra).toEqual({ cgst: 50, sgst: 50, igst: 0 });

      const inter = gstMath.splitTax(100, true);
      expect(inter).toEqual({ cgst: 0, sgst: 0, igst: 100 });
    });

    it("creates tax buckets from tax-inclusive values (taxable = value - tax)", () => {
      const bucket = gstMath.bucketFromTaxInclusive({
        source: "shop",
        month: "2026-09",
        storedRate: "5",
        hsn: "6205",
        interState: false,
        lines: 1,
        qty: 2,
        value: 1050,
        tax: 50,
      });

      expect(bucket.value).toBe(1050);
      expect(bucket.taxable).toBe(1000);
      expect(bucket.cgst).toBe(25);
      expect(bucket.sgst).toBe(25);
      expect(bucket.igst).toBe(0);
      expect(bucket.rate).toBe(5);
      expect(bucket.hsn).toBe("6205");
    });
  });

  describe("SQL Outward GST Reporting (GSTR-1, sales2 + salsntry)", () => {
    it("reports outward tax buckets, bill totals and separates cancelled bills", async () => {
      const out = await gstReports.shopOutward({ from: "2026-09-01", to: "2026-09-30" });

      expect(out.bills).toBe(1);
      expect(out.billValue).toBe(1050);
      expect(out.headerTax).toBe(50);
      expect(out.cancelled).toEqual({ bills: 1, value: 525 });

      expect(out.buckets).toHaveLength(1);
      expect(out.buckets[0].rate).toBe(5);
      expect(out.buckets[0].taxable).toBe(1000);
      expect(out.buckets[0].cgst).toBe(25);
      expect(out.buckets[0].sgst).toBe(25);

      // Table 13 Documents summary
      // One series per counter letter (bill numbers restart daily), not one row per bill.
      expect(out.documents).toEqual([
        { series: "A", from: "1300926101", to: "1300926102", total: 2, cancelled: 1 },
      ]);
    });

    it("resolves HSN descriptions from dbo.HSNDetails", async () => {
      const hsn = await gstReports.shopHsnMaster();
      expect(hsn.describe("6205")).toBe("Men's Shirts of cotton");
      expect(hsn.resolve("GRP6205")).toEqual({ code: "6205", viaGroup: true });
      expect(hsn.resolve("6205")).toEqual({ code: "6205", viaGroup: false });
    });
  });

  describe("SQL Inward GST Reporting (GSTR-2/3B, purentrydetails + PurchaseReturnDetails)", () => {
    it("reports inward purchases and purchase returns with supplier GSTIN", async () => {
      const inward = await gstReports.shopInward({ from: "2026-09-01", to: "2026-09-30" });

      expect(inward.rows).toHaveLength(2);
      // Purchase row
      const purch = inward.rows[0];
      expect(purch.kind).toBe("purchase");
      expect(purch.doc).toBe("VJ100");
      expect(purch.supplier).toBe("RAMRAJ");
      expect(purch.gstin).toBe("33AAAAA0000A1Z5");
      expect(purch.bucket.rate).toBe(5);
      expect(purch.bucket.taxable).toBe(5000); // 5250 - 250
      expect(purch.bucket.cgst).toBe(125);
      expect(purch.bucket.sgst).toBe(125);

      // Return row
      const ret = inward.rows[1];
      expect(ret.kind).toBe("return");
      expect(ret.doc).toBe("VJ100");
      expect(ret.bucket.rate).toBe(5);
      expect(ret.bucket.taxable).toBe(1000); // 1050 - 50
    });
  });
});
