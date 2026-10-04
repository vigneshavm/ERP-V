import { describe, it, expect, beforeEach, jest } from "@jest/globals";

type Row = Record<string, unknown>;
let db: Record<string, Row[]> = {};
const writes: string[] = [];
const eq = (a: unknown, b: unknown) =>
  String(a ?? "").trim().toLowerCase() === String(b ?? "").trim().toLowerCase();

class SqlWriteError extends Error {
  constructor(message: string, public statusCode: number, public code?: string) {
    super(message);
  }
}

function run(text: string, p: Record<string, unknown> = {}): Row[] {
  if (/FROM dbo\.\[supplierdetail\]/.test(text)) {
    const s = txt(p.s);
    return (db.supplierdetail ?? []).filter((r) => eq(r.sup_name, s));
  }
  if (/FROM dbo\.\[companydetail\]/.test(text)) {
    const c = txt(p.c);
    return (db.companydetail ?? []).filter((r) => eq(r.cmy_name_eng, c));
  }
  if (/MAX\(TRY_CAST\(SUBSTRING\(LTRIM\(RTRIM\(grn_no\)\), 3, 20\) AS bigint\)\)/.test(text)) {
    const ns = (db.POHeader ?? [])
      .map((h) => txt(h.grn_no))
      .filter((g) => /^PO[0-9]/i.test(g))
      .map((g) => Number(g.slice(2)))
      .filter((n) => Number.isFinite(n));
    return [{ n: ns.length ? Math.max(...ns) : null }];
  }
  if (/FROM dbo\.\[newproduct\]/.test(text))
    return (db.newproduct ?? []).filter((r) => eq(r.code, p.c) && eq(r.cmy_name, p.m));
  if (/FROM dbo\.\[gstgroup\]/.test(text)) return db.gstgroup ?? [];
  if (/FROM dbo\.\[POHeader\] WHERE (?:LTRIM\(RTRIM\(grn_no\)\)|grn_no)\s*=\s*@p/.test(text)) {
    return (db.POHeader ?? []).filter((h) => eq(h.grn_no, p.p));
  }
  if (/FROM dbo\.\[PODetails\] WHERE (?:LTRIM\(RTRIM\(grn_no\)\)|grn_no)\s*=\s*@p/.test(text)) {
    const lines = (db.PODetails ?? []).filter(
      (d) => eq(d.grn_no, p.p) && (p.l === undefined || eq(d.sl_no, p.l)),
    );
    if (/TRY_CAST\(receivqty AS float\)/.test(text)) {
      // TRY_CAST: text that isn't a number counts as 0 instead of failing the query.
      const n = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);
      return lines.filter((l) => n(l.receivqty) !== 0 || n(l.receiventryqty) !== 0);
    }
    return lines;
  }
  if (/FROM dbo\.\[POHeader\] h/.test(text)) {
    return db.POHeader ?? [];
  }
  throw new Error("unexpected query: " + text);
}

const txt = (v: unknown) => String(v ?? "").trim();

const tx = {
  query: async (t: string, p?: Record<string, unknown>) => run(t, p),
  insert: async (t: string, row: Row) => {
    writes.push(`insert ${t}`);
    (db[t] ??= []).push({ ...row, ID: (db[t]?.length ?? 0) + 1 });
  },
  update: async (t: string, patch: Row, filter: Row) => {
    writes.push(`update ${t}`);
    const rows = db[t] ?? [];
    let count = 0;
    for (const r of rows) {
      const match = Object.entries(filter).every(([k, v]) => eq(r[k], v));
      if (match) {
        Object.assign(r, patch);
        count++;
      }
    }
    return count;
  },
  remove: async (t: string, filter: Row) => {
    writes.push(`remove ${t}`);
    const rows = db[t] ?? [];
    const before = rows.length;
    db[t] = rows.filter((r) => !Object.entries(filter).every(([k, v]) => eq(r[k], v)));
    return before - db[t].length;
  },
  nextNumber: async () => 101,
};

jest.unstable_mockModule("../sqlWrite.js", () => ({
  SqlWriteError,
  txt,
  tsDate: () => "30/09/2026",
  sqlRead: async (t: string, p?: Record<string, unknown>) => run(t, p),
  withSqlTransaction: async (_l: string, fn: (t: typeof tx) => unknown) => fn(tx),
}));

jest.unstable_mockModule("../../../config/logger.js", () => ({
  info: () => undefined,
  warn: () => undefined,
}));

jest.unstable_mockModule("../sqlSuppliers.js", () => ({
  sqlSupplierList: async () => [
    { _id: "sup-1", businessName: "RAMRAJ", sup_name: "RAMRAJ" },
  ],
}));

const poModule = await import("../sqlPurchaseOrder.js");

beforeEach(() => {
  writes.length = 0;
  db = {
    supplierdetail: [{ sup_name: "RAMRAJ", city: "TIRUPUR" }],
    companydetail: [{ cmy_name_eng: "SHREE SARAVANA STORES" }],
    newproduct: [
      { code: "SHIRT01", name: "COTTON SHIRT", unit_de: "PCS", gst_group: "GST5", cmy_name: "SHREE SARAVANA STORES" },
      { code: "FABRIC01", name: "SHIRTING FABRIC", unit_de: "MTR", gst_group: "GST5", cmy_name: "SHREE SARAVANA STORES" },
      { code: "BLAZER01", name: "BLAZER", unit_de: "PCS", gst_group: "NEWGST18", cmy_name: "SHREE SARAVANA STORES" },
    ],
    gstgroup: [
      { gst_name: "GST5", gst: "5" },
      // 5% up to 2500, 18% above (Textilesoft slab group)
      { gst_name: "NEWGST18", gst: "5", from_amount: "0", to_amount: "2500", gst1: "18", from_amount1: "2500.01", to_amount1: "999999" },
    ],
    POHeader: [],
    PODetails: [],
  };
});

describe("Textilesoft Purchase Order and PO receipt flow (06_purchase_order_grn.md)", () => {
  it("creates a purchase order with header totals and atomic details", async () => {
    const po = await poModule.createSqlPurchaseOrder({
      supplier: "RAMRAJ",
      company: "SHREE SARAVANA STORES",
      date: "2026-09-30",
      salesman: "KUMAR",
      incharge: "MANAGER1",
      agent: "AGENT1",
      items: [
        {
          code: "SHIRT01",
          pname: "COTTON SHIRT",
          qty: 10,
          rate: 450,
          mrp: 699,
          taxPercent: 5,
          brand: "RAMRAJ",
          size: "40",
          color: "WHITE",
        },
        {
          code: "FABRIC01",
          pname: "SHIRTING FABRIC",
          qty: 2,
          mtr: 25, // meter item: 2 rolls x 25m = 50m
          rate: 120,
          mrp: 180,
          taxPercent: 5,
        },
      ],
    });

    expect(po).toBeDefined();
    expect(po?.purchaseNumber).toBe("PO1");
    expect(po?.company).toBe("SHREE SARAVANA STORES");
    expect(po?.status).toBe("ACTIVE");
    expect(po?.totalQuantity).toBe(12);
    expect(po?.totalMeter).toBe(60); // 10 units (10m) + 50 units (50m)

    // Check DB writes
    expect(writes).toContain("insert POHeader");
    expect(writes).toContain("insert PODetails");

    const header = db.POHeader[0];
    expect(header.grn_no).toBe("PO1");
    expect(header.suplier_name).toBe("RAMRAJ");
    expect(header.SalesMan).toBe("KUMAR");
    expect(header.OverAllQty).toBe("12");
    expect(header.OverAllMtr).toBe("60");

    const lines = db.PODetails;
    expect(lines).toHaveLength(2);
    expect(lines[0].pname).toBe("COTTON SHIRT");
    expect(lines[0].prate).toBe("450.00");
    expect(lines[0].amount).toBe("4500.00");
    expect(lines[0].TotalMeter).toBe("10");

    expect(lines[1].pname).toBe("SHIRTING FABRIC");
    expect(lines[1].prate).toBe("120.00");
    expect(lines[1].amount).toBe("6000.00"); // 50m * 120
    expect(lines[1].TotalMeter).toBe("50");
  });

  it("updates PO status to CANCELLED (1) without physical deletion", async () => {
    db.POHeader = [
      {
        grn_no: "PO101",
        suplier_name: "RAMRAJ",
        cmy_name: "SHREE SARAVANA STORES",
        POStatus: "0",
        date: "30/09/2026",
      },
    ];

    const updated = await poModule.updateSqlPurchaseOrderStatus("PO101", "CANCELLED");
    expect(updated?.status).toBe("CANCELLED");
    expect(db.POHeader[0].POStatus).toBe("1");
    expect(db.POHeader).toHaveLength(1); // not deleted
  });

  it("updates PO receipt quantities on PODetails (PurchaseReceivedEntry.aspx flow)", async () => {
    db.POHeader = [
      {
        grn_no: "PO101",
        suplier_name: "RAMRAJ",
        cmy_name: "SHREE SARAVANA STORES",
        POStatus: "0",
        date: "30/09/2026",
      },
    ];
    db.PODetails = [
      {
        grn_no: "PO101",
        sl_no: "1",
        code: "SHIRT01",
        pname: "COTTON SHIRT",
        qty: "10",
        receivqty: "0",
        receiventryqty: "0",
        returnqty: "0",
        shortqty: "0",
        excessqty: "0",
      },
    ];

    const res = await poModule.updateSqlPurchaseOrderReceipt("PO101", "1", {
      receivedQty: 8,
      receivedEntryQty: 10,
      returnQty: 1,
      shortQty: 1,
      excessQty: 0,
      receivedRefNo: "DC-9921",
      receivedDate: "2026-09-30",
      checkedBy: "CHECKER1",
    });

    expect(res).toBeDefined();
    const line = db.PODetails[0];
    expect(line.receivqty).toBe("8");
    expect(line.receiventryqty).toBe("10");
    expect(line.returnqty).toBe("1");
    expect(line.shortqty).toBe("1");
    expect(line.excessqty).toBe("0");
    expect(line.receivrefno).toBe("DC-9921");
    expect(line.checkedby).toBe("CHECKER1");
  });

  it("blocks deletion of a PO if any items were received", async () => {
    db.POHeader = [
      {
        grn_no: "PO101",
        suplier_name: "RAMRAJ",
        cmy_name: "SHREE SARAVANA STORES",
        POStatus: "0",
        date: "30/09/2026",
      },
    ];
    db.PODetails = [
      {
        grn_no: "PO101",
        sl_no: "1",
        qty: "10",
        receivqty: "8", // already partially received!
      },
    ];

    await expect(poModule.deleteSqlPurchaseOrder("PO101")).rejects.toThrow(
      "Received purchase orders cannot be deleted; cancel the PO instead.",
    );

    // Ensure not deleted
    expect(db.POHeader).toHaveLength(1);
    expect(db.PODetails).toHaveLength(1);
  });

  it("allows deletion of an unreceived PO", async () => {
    db.POHeader = [
      {
        grn_no: "PO101",
        suplier_name: "RAMRAJ",
        cmy_name: "SHREE SARAVANA STORES",
        POStatus: "0",
        date: "30/09/2026",
      },
    ];
    db.PODetails = [
      {
        grn_no: "PO101",
        sl_no: "1",
        qty: "10",
        receivqty: "0",
        receiventryqty: "0",
      },
    ];

    await poModule.deleteSqlPurchaseOrder("PO101");
    expect(db.POHeader).toHaveLength(0);
    expect(db.PODetails).toHaveLength(0);
  });

  // ---------------------------------------------------------------------------------------------
  // Fixes (review of 06_purchase_order_grn.md, 30 Sep 2026)
  // ---------------------------------------------------------------------------------------------

  const header = (over: Row = {}) => ({
    grn_no: "PO101",
    suplier_name: "RAMRAJ",
    cmy_name: "SHREE SARAVANA STORES",
    POStatus: "0",
    date: "30/09/2026",
    ...over,
  });
  const receivedLine = () => ({
    grn_no: "PO101",
    sl_no: "1",
    code: "SHIRT01",
    qty: "10",
    receivqty: "5",
    receiventryqty: "5",
    returnqty: "2",
    shortqty: "5",
    excessqty: "0",
    receivrefno: "DC-1",
    checkedby: "RAVI",
  });

  describe("status: only Textilesoft's own values (#2)", () => {
    it("an unknown or missing status is refused instead of re-activating a cancelled PO", async () => {
      db.POHeader = [header({ POStatus: "1" })];
      for (const st of ["SUBMITTED", "APPROVED", "Billed", "", undefined])
        await expect(poModule.updateSqlPurchaseOrderStatus("PO101", st)).rejects.toMatchObject({ statusCode: 400 });
      expect(db.POHeader[0].POStatus).toBe("1");
    });

    it("maps ACTIVE / CANCELLED / EDIT (case-insensitive)", () => {
      expect(poModule.poStatusCode("active")).toBe("0");
      expect(poModule.poStatusCode("Cancelled")).toBe("1");
      expect(poModule.poStatusCode("CANCELED")).toBe("1");
      expect(poModule.poStatusCode("edit")).toBe("2");
    });
  });

  describe("receipt: partial updates, derived short/excess, cancelled POs (#3)", () => {
    it("sending only the received qty keeps return qty, ref no and checked-by; short/excess are derived", async () => {
      db.POHeader = [header()];
      db.PODetails = [receivedLine()];
      await poModule.updateSqlPurchaseOrderReceipt("PO101", "1", { receivedQty: 12 });
      expect(db.PODetails[0]).toMatchObject({
        receivqty: "12",
        shortqty: "0",
        excessqty: "2", // ordered 10, received 12
        returnqty: "2",
        receiventryqty: "5",
        receivrefno: "DC-1",
        checkedby: "RAVI",
      });
    });

    it("short is ordered minus received when less arrives", () => {
      expect(poModule.receiptChanges({ receivedQty: 8 }, 10)).toEqual({ receivqty: "8", shortqty: "2", excessqty: "0" });
      expect(poModule.receiptChanges({ receivedQty: 8, shortQty: 1 }, 10)).toEqual({ receivqty: "8", shortqty: "1" });
    });

    it("refuses negatives, text and empty updates", () => {
      expect(() => poModule.receiptChanges({ receivedQty: -1 }, 10)).toThrow(/Received qty must be a number/);
      expect(() => poModule.receiptChanges({ returnQty: "two" }, 10)).toThrow(/Return qty/);
      expect(() => poModule.receiptChanges({}, 10)).toThrow(/Nothing to update/);
    });

    it("a cancelled PO can't be received against", async () => {
      db.POHeader = [header({ POStatus: "1" })];
      db.PODetails = [receivedLine()];
      await expect(poModule.updateSqlPurchaseOrderReceipt("PO101", "1", { receivedQty: 10 })).rejects.toMatchObject({
        statusCode: 409,
      });
      expect(db.PODetails[0].receivqty).toBe("5");
    });

    it("unknown line: 404", async () => {
      db.POHeader = [header()];
      db.PODetails = [receivedLine()];
      await expect(poModule.updateSqlPurchaseOrderReceipt("PO101", "9", { receivedQty: 1 })).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe("lines are checked and computed on the server (#7)", () => {
    const create = (items: Row[]) =>
      poModule.createSqlPurchaseOrder({ supplier: "RAMRAJ", company: "SHREE SARAVANA STORES", items: items as never });

    it("product must exist for the company; name and unit come from the product master", async () => {
      await expect(create([{ code: "NOPE", qty: 1, rate: 10 }])).rejects.toThrow(/product NOPE is not set up/);
      await create([{ code: "SHIRT01", pname: "WRONG NAME", qty: 2, rate: 100 }]);
      expect(db.PODetails[0]).toMatchObject({ pname: "COTTON SHIRT", unit_details: "PCS", pro_group_name: "GST5" });
    });

    it("zero / negative / text quantities and rates are refused; nothing is written", async () => {
      await expect(create([{ code: "SHIRT01", qty: 0, rate: 10 }])).rejects.toThrow(/Line 1: enter the quantity/);
      await expect(create([{ code: "SHIRT01", qty: -2, rate: 10 }])).rejects.toThrow(/quantity must be a number/);
      await expect(create([{ code: "SHIRT01", qty: 1, rate: "abc" }])).rejects.toThrow(/rate must be a number/);
      await expect(create([{ code: "SHIRT01", qty: 1, rate: 10, discountPercent: 120 }])).rejects.toThrow(/more than 100/);
      expect(writes).toEqual([]);
    });

    it("a client-sent amount is ignored; less, then discount, then GST, as in purchase entry", async () => {
      await create([{ code: "SHIRT01", qty: 10, rate: 100, amount: 1, less: 50, discountPercent: 10 }]);
      // 1000 - 50 = 950; 10% = 95; taxable 855; GST5 = 42.75; net 897.75
      expect(db.PODetails[0]).toMatchObject({
        amount: "1000.00",
        plamt: "950.00",
        dis_amount: "95.00",
        gst_per: "5",
        gst_amount: "42.75",
        net_amount: "897.75",
        nrate: "89.78",
      });
    });

    it("GST comes from the product's group (slab by rate) unless the line gives it", async () => {
      await create([
        { code: "BLAZER01", qty: 1, rate: 3000 },
        { code: "BLAZER01", qty: 1, rate: 2000 },
        { code: "BLAZER01", qty: 1, rate: 3000, gstPercent: 12 },
      ]);
      expect(db.PODetails.map((l) => l.gst_per)).toEqual(["18", "5", "12"]);
    });

    it("a discount sent only as an amount is kept", async () => {
      await create([{ code: "SHIRT01", qty: 1, rate: 200, discountAmount: 20 }]);
      expect(db.PODetails[0]).toMatchObject({ dis_per: "10.00", dis_amount: "20.00" });
    });
  });

  describe("PO numbers and dates (column types from SSS_copy)", () => {
    const create = () =>
      poModule.createSqlPurchaseOrder({
        supplier: "RAMRAJ",
        company: "SHREE SARAVANA STORES",
        date: "2026-09-05",
        items: [{ code: "SHIRT01", qty: 1, rate: 100 }],
      });

    it("PO numbers keep counting (PO1, PO2, ... after PO9 comes PO10)", async () => {
      expect((await create())?.purchaseNumber).toBe("PO1");
      expect((await create())?.purchaseNumber).toBe("PO2");
      db.POHeader.push({ grn_no: "PO9" });
      expect((await create())?.purchaseNumber).toBe("PO10");
    });

    it("date columns get ISO (5 Sep stays 5 Sep); PODetails.date keeps Textilesoft's text", async () => {
      await create();
      expect(db.POHeader[0]).toMatchObject({ date: "2026-09-05", entry_date: "2026-09-05", invoce_date: "2026-09-05" });
      expect(db.PODetails[0]).toMatchObject({ entry_date: "2026-09-05", date: "30/09/2026" /* mocked tsDate */ });
    });

    it("poDay reads yyyy-mm-dd and dd/MM/yyyy as local calendar days, refuses junk", () => {
      expect(poModule.poDay("2026-09-05").iso).toBe("2026-09-05");
      expect(poModule.poDay("05/09/2026").iso).toBe("2026-09-05");
      expect(() => poModule.poDay("tomorrow")).toThrow(/not a date/);
    });

    it("delete check works on text quantities like '2.5' and '' (no conversion error)", async () => {
      db.POHeader = [header()];
      db.PODetails = [{ grn_no: "PO101", sl_no: "1", qty: "10", receivqty: "2.5", receiventryqty: "" }];
      await expect(poModule.deleteSqlPurchaseOrder("PO101")).rejects.toThrow(/cancel the PO instead/);
      db.PODetails = [{ grn_no: "PO101", sl_no: "1", qty: "10", receivqty: "", receiventryqty: "0.00" }];
      await poModule.deleteSqlPurchaseOrder("PO101");
      expect(db.POHeader).toHaveLength(0);
    });
  });
});
