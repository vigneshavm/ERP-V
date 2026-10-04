import { describe, it, expect, beforeEach, jest } from "@jest/globals";

// Purchase returns (07_purchase_return.md) against an in-memory shop database.
type Row = Record<string, unknown>;
let db: Record<string, Row[]> = {};
const writes: string[] = [];
const txt = (v: unknown) => String(v ?? "").trim();
const eq = (a: unknown, b: unknown) => txt(a).toLowerCase() === txt(b).toLowerCase();
const n = (v: unknown) => (Number.isFinite(Number(v)) && txt(v) !== "" ? Number(v) : 0);

class SqlWriteError extends Error {
  constructor(message: string, public statusCode: number, public code?: string) {
    super(message);
  }
}

function run(text: string, p: Record<string, unknown> = {}): Row[] {
  if (/FROM dbo\.\[supplierdetail\]/.test(text)) return (db.supplierdetail ?? []).filter((r) => eq(r.sup_name, p.s));
  if (/AS received/.test(text)) {
    const sum = (rows: Row[], f: (r: Row) => number) => rows.reduce((s, r) => s + f(r), 0);
    return [
      {
        received: sum((db.purentrydetails ?? []).filter((r) => eq(r.barcode, p.b) && r.STATUS == null), (r) => n(r.qty) + n(r.fqty)),
        sold: sum((db.salsntry ?? []).filter((r) => eq(r.barcode, p.b) && txt(r.status) !== "1"), (r) => n(r.qty)),
        returned:
          sum((db.PurchaseReturnDetails ?? []).filter((r) => eq(r.barcode, p.b)), (r) => n(r.qty)) +
          sum((db.purretrun ?? []).filter((r) => eq(r.barcode, p.b)), (r) => n(r.qty)),
      },
    ];
  }
  if (/SELECT \* FROM dbo\.\[purentrydetails\] WHERE barcode = @b/.test(text))
    return (db.purentrydetails ?? []).filter(
      (d) => eq(d.barcode, p.b) && d.STATUS == null && (p.g === undefined || eq(d.grn_no, p.g)),
    );
  if (/FROM dbo\.\[purgrnentry\] WHERE LTRIM\(RTRIM\(grn_no\)\) = @g/.test(text))
    return (db.purgrnentry ?? []).filter((h) => eq(h.grn_no, p.g));
  if (/MAX\(TRY_CAST\(SUBSTRING\(LTRIM\(RTRIM\(grn_no\)\)/.test(text)) {
    const nums = (db.PurchaseReturnHeader ?? [])
      .map((r) => txt(r.grn_no))
      .filter((r) => /^PR[0-9]+$/.test(r))
      .map((r) => Number(r.slice(2)));
    return [{ n: nums.length ? Math.max(...nums) : 0 }];
  }
  if (/SELECT TOP 1 1 AS x FROM dbo\.\[PurchaseReturnDetails\] WHERE LTRIM\(RTRIM\(grn_no\)\) = @r/.test(text))
    return (db.PurchaseReturnDetails ?? []).filter((d) => eq(d.grn_no, p.r)).slice(0, 1);
  if (/FROM dbo\.\[PurchaseReturnHeader\] WHERE ID = @id/.test(text))
    return (db.PurchaseReturnHeader ?? []).filter((h) => n(h.ID) === n(p.id)).map((h) => ({ ...h, rgrno: txt(h.grn_no) }));
  if (/COUNT(?:_BIG)?\(\*\) AS n FROM dbo\.\[PurchaseReturnHeader\]/.test(text))
    return [{ n: (db.PurchaseReturnHeader ?? []).filter((h) => eq(h.grn_no, p.r)).length }];
  // Detail lines whose barcode has no purchase line (the read path refuses those returns).
  if (/COUNT_BIG\(\*\) AS n FROM dbo\.\[PurchaseReturnDetails\] d/.test(text))
    return [
      {
        n: (db.PurchaseReturnDetails ?? []).filter(
          (d) => eq(d.grn_no, p.r) && !(db.purentrydetails ?? []).some((x) => eq(x.barcode, d.barcode)),
        ).length,
      },
    ];
  if (/FROM dbo\.\[PurchaseReturnHeader\] WHERE LTRIM\(RTRIM\(grn_no\)\) = @r/.test(text))
    return [...(db.PurchaseReturnHeader ?? [])].reverse().filter((h) => eq(h.grn_no, p.r)).slice(0, 1);
  if (/FROM dbo\.\[PurchaseReturnDetails\] WHERE LTRIM\(RTRIM\(grn_no\)\) = @r/.test(text))
    return (db.PurchaseReturnDetails ?? []).filter((d) => eq(d.grn_no, p.r));
  if (/FROM dbo\.\[PurchaseReturnHeader\] h ORDER BY/.test(text))
    return [...(db.PurchaseReturnHeader ?? [])].reverse().map((h) => ({ ...h, rgrno: txt(h.grn_no) }));
  throw new Error("unexpected query: " + text);
}

const tx = {
  query: async (t: string, p?: Record<string, unknown>) => run(t, p),
  insert: async (t: string, row: Row) => {
    writes.push(`insert ${t}`);
    (db[t] ??= []).push({ ...row, ID: (db[t]?.length ?? 0) + 1 });
  },
  update: async () => 1,
  remove: async (t: string, filter: Row) => {
    writes.push(`remove ${t}`);
    const rows = db[t] ?? [];
    const before = rows.length;
    db[t] = rows.filter((r) => !Object.entries(filter).every(([k, v]) => eq(r[k], v)));
    return before - db[t].length;
  },
  nextNumber: async () => 1,
};

jest.unstable_mockModule("../sqlWrite.js", () => ({
  SqlWriteError,
  txt,
  tsDate: () => "30/09/2026",
  sqlRead: async (t: string, p?: Record<string, unknown>) => run(t, p),
  withSqlTransaction: async (_l: string, fn: (t: typeof tx) => unknown) => fn(tx),
}));
jest.unstable_mockModule("../../../config/logger.js", () => ({ info: () => undefined, warn: () => undefined }));
jest.unstable_mockModule("../sqlSuppliers.js", () => ({
  sqlSupplierList: async () => [{ _id: "sup-1", businessName: "RAMRAJ", sup_name: "RAMRAJ" }],
}));

const prModule = await import("../sqlPurchaseReturn.js");

const purchaseLine = (over: Row = {}): Row => ({
  grn_no: "VJ100",
  barcode: "6296211",
  code: "SHIRT01",
  pname: "COTTON SHIRT",
  qty: "10",
  fqty: "0",
  prate: "450.00",
  mrp: "699",
  gst_per: "5",
  dis_per: "0",
  pless: "0",
  brand: "RAMRAJ",
  size: "40",
  STATUS: null,
  ...over,
});

beforeEach(() => {
  writes.length = 0;
  db = {
    supplierdetail: [{ sup_name: "RAMRAJ" }, { sup_name: "ZODIAC" }],
    purgrnentry: [
      { grn_no: "VJ100", suplier_name: "RAMRAJ", cmy_name: "SSS", warehouse: "MAIN" },
      { grn_no: "VJ101", suplier_name: "RAMRAJ", cmy_name: "SSS", warehouse: "MAIN" },
      { grn_no: "VJ102", suplier_name: "ZODIAC", cmy_name: "SSS", warehouse: "MAIN" },
    ],
    purentrydetails: [
      purchaseLine(),
      purchaseLine({ grn_no: "VJ101", barcode: "6296212" }),
      purchaseLine({ grn_no: "VJ102", barcode: "6296213" }),
    ],
    salsntry: [],
    PurchaseReturnHeader: [],
    PurchaseReturnDetails: [],
    purretrun: [],
  };
});

const ret = (items: Row[], over: Row = {}) =>
  prModule.createSqlPurchaseReturn({ supplierName: "RAMRAJ", grnNo: "VJ100", returnDate: "2026-09-30", items, ...over });

describe("stored the way this shop's Textilesoft stores returns", () => {
  it("writes PurchaseReturnHeader + Details only (no purretrun); grn_no = the return number", async () => {
    const pr = await ret([{ barcode: "6296211", qty: 2 }], { supplierReturnGrn: "SR-551" });
    expect(pr?.returnId).toBe("PR1");
    expect(writes).toEqual(["insert PurchaseReturnHeader", "insert PurchaseReturnDetails"]);
    expect(db.purretrun).toEqual([]);
    expect(db.PurchaseReturnHeader[0]).toMatchObject({
      grn_no: "PR1",
      invoce_amount: "SR-551",
      ViewStatus: "NewPurchaseReturn",
      suplier_name: "RAMRAJ",
    });
    expect(db.PurchaseReturnDetails[0]).toMatchObject({ grn_no: "PR1", barcode: "6296211", qty: "2", net_amount: "945.00" });
  });

  it("numbers continue after the highest PR<digits> in the header table; Textilesoft's PRCA11 doesn't count", async () => {
    db.PurchaseReturnHeader = [
      { ID: 1, grn_no: "PR11" },
      { ID: 2, grn_no: "PRCA11" },
    ];
    expect((await ret([{ barcode: "6296211", qty: 1 }]))?.returnId).toBe("PR12");
  });

  it("lists every return from the header table, Textilesoft's included, with the header ID as id", async () => {
    db.PurchaseReturnHeader = [{ ID: 6, grn_no: "PRCA11", suplier_name: "A 1 RAMA JAYAM TEX", date: new Date("2025-02-01"), totnetamot: "3276.00", CQty: "21", invoce_amount: "123" }];
    const list = await prModule.listSqlPurchaseReturns();
    expect(list[0]).toMatchObject({ id: "sql:pr:6", returnId: "PRCA11", totalAmount: 3276, quantity: 21, supplierRef: "123", returnDate: "2025-02-01" });
  });

  it("opens a return with its lines (by return number)", async () => {
    await ret([{ barcode: "6296211", qty: 2 }]);
    const pr = await prModule.getSqlPurchaseReturn("sql:pr:1");
    expect(pr).toMatchObject({ returnId: "PR1", totalAmount: 945 });
    expect(pr?.items).toHaveLength(1);
  });
});

describe("#1 can't return more than is in stock", () => {
  it("more than received is refused", async () => {
    await expect(ret([{ barcode: "6296211", qty: 11 }])).rejects.toMatchObject({
      statusCode: 409,
      message: expect.stringMatching(/Only 10 of barcode 6296211 can be returned/),
    });
    expect(writes).toEqual([]);
  });

  it("sold pieces and earlier returns (Textilesoft's in PurchaseReturnDetails too) are taken off", async () => {
    db.purentrydetails[0].fqty = "2"; // 12 in
    db.salsntry = [{ barcode: "6296211", qty: "5" }, { barcode: "6296211", qty: "3", status: "1" /* cancelled bill */ }];
    db.PurchaseReturnDetails = [{ grn_no: "PRCA11", barcode: "6296211", qty: "4" }];
    await expect(ret([{ barcode: "6296211", qty: 4 }])).rejects.toThrow(/Only 3 of barcode/);
    await ret([{ barcode: "6296211", qty: 3 }]);
  });

  it("an earlier ERP return counts, so a second one can't exceed what's left", async () => {
    await ret([{ barcode: "6296211", qty: 8 }]);
    await expect(ret([{ barcode: "6296211", qty: 3 }])).rejects.toThrow(/Only 2 of barcode/);
  });

  it("the same barcode twice in one return is added up", async () => {
    await expect(ret([{ barcode: "6296211", qty: 6 }, { barcode: "6296211", qty: 5 }])).rejects.toThrow(/11 asked/);
  });

  it("a fully sold barcode says so", async () => {
    db.salsntry = [{ barcode: "6296211", qty: "10" }];
    await expect(ret([{ barcode: "6296211", qty: 1 }])).rejects.toThrow(/nothing left to return/);
  });
});

describe("#2 every line is a purchased barcode", () => {
  it("a line without a barcode is refused", async () => {
    await expect(ret([{ productCode: "SHIRT01", qty: 1, rate: 450 }])).rejects.toThrow(/scan or enter the barcode/);
  });

  it("a barcode not on the named GRN is refused", async () => {
    await expect(ret([{ barcode: "9999999", qty: 1 }])).rejects.toThrow("barcode 9999999 was not received on GRN VJ100");
  });

  it("one return may hold barcodes from several GRNs of the same supplier (as Textilesoft's PRCA11 does)", async () => {
    const pr = await ret([{ barcode: "6296211", qty: 1 }, { barcode: "6296212", qty: 1 }], { grnNo: undefined });
    expect(pr?.items).toHaveLength(2);
  });

  it("barcodes from different suppliers are refused", async () => {
    await expect(ret([{ barcode: "6296211", qty: 1 }, { barcode: "6296213", qty: 1 }], { grnNo: undefined })).rejects.toThrow(
      /make one return per supplier/,
    );
  });

  it("zero / negative / text quantity is refused", async () => {
    await expect(ret([{ barcode: "6296211", qty: 0 }])).rejects.toThrow(/greater than zero/);
    await expect(ret([{ barcode: "6296211", qty: -1 }])).rejects.toThrow(/quantity must be a number/);
    await expect(ret([{ barcode: "6296211", qty: "two" }])).rejects.toThrow(/quantity must be a number/);
  });
});

describe("#3 values come from the purchase line, not the request", () => {
  it("rate, GST, product and attributes are the purchase's", async () => {
    await ret([{ barcode: "6296211", qty: 2, rate: 1, tax: 0, productName: "FAKE", productCode: "X", brand: "FAKE" }]);
    expect(db.PurchaseReturnDetails[0]).toMatchObject({
      prate: "450.00",
      gst_per: "5",
      code: "SHIRT01",
      pname: "COTTON SHIRT",
      brand: "RAMRAJ",
      size: "40",
      amount: "900.00",
      gst_amount: "45.00",
      net_amount: "945.00",
    });
  });

  it("the purchase's discount applies and its less is shared by quantity", async () => {
    db.purentrydetails[0].dis_per = "10";
    db.purentrydetails[0].pless = "100"; // on 10 pieces
    await ret([{ barcode: "6296211", qty: 2 }]);
    // 900 - less 20 = 880; 10% = 88; taxable 792; GST 5% = 39.60; net 831.60
    expect(db.PurchaseReturnDetails[0]).toMatchObject({ pless: "20.00", plamt: "880.00", dis_amount: "88.00", gst_amount: "39.60", net_amount: "831.60" });
  });
});

describe("#4 header totals are computed", () => {
  it("GST buckets, rate and totals come from the lines; client values are ignored", async () => {
    await ret([{ barcode: "6296211", qty: 2 }], { gst5: 999, gst18: 5, gstPercent: 28 });
    expect(db.PurchaseReturnHeader[0]).toMatchObject({ gst5: "45.00", gst18: "0.00", gst_in: "5", CQty: "2", CTotal: "900.00", CGst: "45.00", totnetamot: "945.00" });
  });

  it("a local purchase's return is local (IGSTAmt 0); an inter-state one carries its IGST", async () => {
    await ret([{ barcode: "6296211", qty: 2 }]);
    expect(db.PurchaseReturnHeader[0]).toMatchObject({ IGSTAmt: "0.00" });
    db.purgrnentry[0].IGSTAmt = "250.00";
    await ret([{ barcode: "6296211", qty: 2 }]);
    expect(db.PurchaseReturnHeader[1]).toMatchObject({ IGSTAmt: "45.00" });
  });

  it("GRNs mixing inter-state and local purchases are refused", async () => {
    db.purgrnentry[0].IGSTAmt = "250.00";
    await expect(ret([{ barcode: "6296211", qty: 1 }, { barcode: "6296212", qty: 1 }], { grnNo: undefined })).rejects.toThrow(
      /mix inter-state \(IGST\) and local/,
    );
  });

  it("a bill-level discount or less is refused rather than stored outside the totals", async () => {
    await expect(ret([{ barcode: "6296211", qty: 1 }], { discount: 50 })).rejects.toThrow(/bill-level discount/);
    await expect(ret([{ barcode: "6296211", qty: 1 }], { less: 10 })).rejects.toThrow(/bill-level discount or less/);
  });

  it("courier charge is kept in the header's other-charges column", async () => {
    await ret([{ barcode: "6296211", qty: 1 }], { courierCharge: "150" });
    expect(db.PurchaseReturnHeader[0].oter_char).toBe("150.00");
  });
});

describe("#7 supplier / company / warehouse come from the GRN", () => {
  it("returning to a different supplier is refused", async () => {
    await expect(ret([{ barcode: "6296211", qty: 1 }], { supplierName: "ZODIAC" })).rejects.toThrow(/is from RAMRAJ, not ZODIAC/);
  });

  it("a different company or warehouse is refused; none given -> the GRN's", async () => {
    await expect(ret([{ barcode: "6296211", qty: 1 }], { company: "OTHER" })).rejects.toThrow(/belongs to SSS/);
    await expect(ret([{ barcode: "6296211", qty: 1 }], { warehouse: "GODOWN" })).rejects.toThrow(/received into MAIN/);
    await ret([{ barcode: "6296211", qty: 1 }], { supplierName: undefined });
    expect(db.PurchaseReturnHeader[0]).toMatchObject({ suplier_name: "RAMRAJ", cmy_name: "SSS", warehouse: "MAIN" });
  });
});

describe("#6 delete", () => {
  it("removes the header and its lines; another return stays", async () => {
    await ret([{ barcode: "6296211", qty: 2 }]); // PR1, header ID 1
    await ret([{ barcode: "6296211", qty: 1 }]); // PR2, header ID 2
    await prModule.deleteSqlPurchaseReturn("sql:pr:1");
    expect(db.PurchaseReturnHeader.map((h) => h.grn_no)).toEqual(["PR2"]);
    expect(db.PurchaseReturnDetails.map((d) => d.grn_no)).toEqual(["PR2"]);
  });

  it("a return number shared by two headers (Textilesoft's two PR11s) isn't deleted", async () => {
    db.PurchaseReturnHeader = [
      { ID: 4, grn_no: "PR11" },
      { ID: 5, grn_no: "PR11" },
    ];
    await expect(prModule.deleteSqlPurchaseReturn("sql:pr:4")).rejects.toMatchObject({ statusCode: 409 });
    expect(db.PurchaseReturnHeader).toHaveLength(2);
  });

  it("unknown return: 404", async () => {
    await expect(prModule.deleteSqlPurchaseReturn("sql:pr:99")).rejects.toMatchObject({ statusCode: 404 });
    await expect(prModule.deleteSqlPurchaseReturn("PR9")).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe("dates (column types from SSS_copy)", () => {
  it("date columns get ISO (5 Sep stays 5 Sep); PurchaseReturnDetails.date (varchar) keeps dd/MM/yyyy", async () => {
    await ret([{ barcode: "6296211", qty: 1 }], { returnDate: "2026-09-05", invoiceDate: "2026-09-01" });
    expect(db.PurchaseReturnHeader[0]).toMatchObject({ date: "2026-09-05", entry_date: "2026-09-05", invoce_date: "2026-09-01" });
    expect(db.PurchaseReturnDetails[0]).toMatchObject({ entry_date: "2026-09-05", date: "30/09/2026" /* mocked tsDate */ });
  });
});
