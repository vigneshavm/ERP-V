import { describe, it, expect, jest, beforeEach } from "@jest/globals";

// Purchase save/delete guards against an in-memory shop database:
//   - same supplier invoice entered twice -> 409 DUPLICATE_INVOICE unless confirmed
//   - delete refused while any table holds one of the GRN's barcodes, or when the GRN number is shared
type Row = Record<string, unknown>;
let db: Record<string, Row[]> = {};
const writes: string[] = [];
const logs: string[] = [];
const eq = (a: unknown, b: unknown) =>
  String(a ?? "").trim().toLowerCase() === String(b ?? "").trim().toLowerCase();

class SqlWriteError extends Error {
  constructor(message: string, public statusCode: number, public code?: string) {
    super(message);
  }
}

function run(text: string, p: Record<string, unknown> = {}): Row[] {
  if (/INFORMATION_SCHEMA/.test(text))
    return Object.entries(db).flatMap(([t, rows]) =>
      Object.keys(rows[0] ?? {}).map((c) => ({ TABLE_NAME: t, COLUMN_NAME: c })),
    );
  if (/JOIN dbo\.\[purentrydetails\] d ON x\./.test(text)) {
    const grnBarcodes = (db.purentrydetails ?? []).filter((d) => eq(d.grn_no, p.g)).map((d) => d.barcode);
    return [...text.matchAll(/SELECT '(\w+)' AS t WHERE EXISTS \(SELECT 1 FROM dbo\.\[(\w+)\] x JOIN dbo\.\[purentrydetails\] d ON x\.\[(\w+)\] = d\.barcode/g)]
      .filter(([, , t, c]) => (db[t] ?? []).some((r) => grnBarcodes.some((b) => eq(r[c], b))))
      .map(([, t]) => ({ t }));
  }
  if (/THEN 'sold'/.test(text)) {
    const bc = (db.purentrydetails ?? []).filter((d) => eq(d.grn_no, p.g)).map((d) => d.barcode);
    const hit = (t: string) => (db[t] ?? []).some((r) => bc.some((b) => eq(r.barcode, b)));
    return [{ used: hit("salsntry") ? "sold" : hit("purretrun") ? "returned" : "" }];
  }
  if (/COUNT\(\*\) AS n FROM dbo\.\[purgrnentry\] WHERE grn_no = @g/.test(text))
    return [{ n: (db.purgrnentry ?? []).filter((h) => eq(h.grn_no, p.g)).length }];
  if (/suplier_name\)\) = @s AND LTRIM\(RTRIM\(invoce_amount\)\) = @i/.test(text))
    return (db.purgrnentry ?? [])
      .filter((h) => eq(h.suplier_name, p.s) && eq(h.invoce_amount, p.i))
      .map((h) => ({ grn: h.grn_no, entry_date: h.entry_date }));
  if (/FROM dbo\.\[companydetail\]/.test(text)) return [{ ok: 1 }];
  if (/FROM dbo\.\[warehousedetail\]/.test(text)) return [{ ok: 1 }];
  if (/FROM dbo\.\[supplierdetail\]/.test(text)) return [{ city: "TIRUPUR" }];
  if (/FROM dbo\.\[grndetail\]/.test(text)) return []; // stop the save here (after the invoice check)
  if (/HAVING COUNT\(\*\) > 1/.test(text) && /barcode/.test(text))
    return [{ barcode: "6296211", n: 2 }];
  if (/HAVING COUNT\(\*\) > 1/.test(text)) return [];
  throw new Error("unexpected query: " + text);
}

const tx = {
  query: async (t: string, p?: Record<string, unknown>) => run(t, p),
  insert: async (t: string) => void writes.push(`insert ${t}`),
  update: async () => 1,
  remove: async (t: string) => {
    writes.push(`remove ${t}`);
    return 1;
  },
  nextNumber: async () => 1,
};
jest.unstable_mockModule("../sqlWrite.js", () => ({
  SqlWriteError,
  txt: (v: unknown) => String(v ?? "").trim(),
  tsDate: () => "30/09/2026",
  sqlRead: async (t: string, p?: Record<string, unknown>) => run(t, p),
  withSqlTransaction: async (_l: string, fn: (t: typeof tx) => unknown) => fn(tx),
}));
jest.unstable_mockModule("../../../config/logger.js", () => ({
  info: (m: string) => logs.push("INFO " + m),
  warn: (m: string) => logs.push("WARN " + m),
}));

const purchase = await import("../sqlPurchase.js");
const refs = await import("../sqlReferences.js");

const input = (over: Record<string, unknown> = {}) => ({
  company: "SSS",
  warehouse: "MAIN",
  supplier: "ramraj",
  invoiceNo: "INV-101",
  date: "2026-09-30",
  lines: [{ productCode: "12", qty: 2, prate: 750, mrp: 800 }],
  ...over,
});

beforeEach(() => {
  refs.clearReferenceSchemaCache();
  writes.length = 0;
  logs.length = 0;
  db = {
    purgrnentry: [{ grn_no: "VJ100", suplier_name: "RAMRAJ", invoce_amount: "INV-101", entry_date: new Date("2026-09-12") }],
    purentrydetails: [{ grn_no: "VJ100", barcode: "6296211" }, { grn_no: "VJ100", barcode: "6296212" }],
    stockdetails: [{ grn_no: "VJ100", barcode: "6296211" }],
    salsntry: [{ barcode: "999" }],
    purretrun: [{ barcode: "998" }],
    StockDamage: [{ barcode: "997" }],
    grndetail: [{ barcode: "6296211" }], // a settings column called "barcode" -- not a reference
    TMP_PURCH_BACK: [{ barcode: "6296211" }], // scratch table -- not a reference
  };
});

describe("duplicate supplier invoice", () => {
  it("refuses with DUPLICATE_INVOICE naming the earlier GRN and date; nothing written", async () => {
    await expect(purchase.createPurchase(input())).rejects.toMatchObject({
      statusCode: 409,
      code: "DUPLICATE_INVOICE",
      message: expect.stringMatching(/INV-101 of RAMRAJ is already entered as GRN VJ100 on 2026-09-12/),
    });
    expect(writes).toEqual([]);
  });

  it("a confirmed save skips the check (and goes on to GRN numbering)", async () => {
    await expect(purchase.createPurchase(input({ allowDuplicateInvoice: true }))).rejects.toThrow(/No GRN numbering/);
  });

  it("another supplier's invoice with the same number is fine", async () => {
    await expect(purchase.createPurchase(input({ supplier: "ZODIAC" }))).rejects.toThrow(/No GRN numbering/);
  });
});

describe("deletePurchase", () => {
  it("unused GRN: removes stock, lines and header (settings/scratch 'barcode' columns don't count)", async () => {
    await purchase.deletePurchase("VJ100");
    expect(writes).toEqual(["remove stockdetails", "remove purentrydetails", "remove purgrnentry"]);
  });

  it("sold: Textilesoft's own rule and message", async () => {
    db.salsntry.push({ barcode: "6296212" });
    await expect(purchase.deletePurchase("VJ100")).rejects.toThrow(/already been sold/);
    expect(writes).toEqual([]);
  });

  it("an item in stock damage (not sold, not returned) also blocks it, naming the table", async () => {
    db.StockDamage.push({ barcode: "6296211" });
    await expect(purchase.deletePurchase("VJ100")).rejects.toMatchObject({
      statusCode: 409,
      message: expect.stringContaining("StockDamage"),
    });
    expect(writes).toEqual([]);
  });

  it("a GRN number shared by two purchases is refused (would delete both GRNs' lines)", async () => {
    db.purgrnentry.push({ grn_no: "VJ100", suplier_name: "X" });
    await expect(purchase.deletePurchase("VJ100")).rejects.toThrow(/used by 2 purchases/);
    expect(writes).toEqual([]);
  });

  it("unknown GRN: 404", async () => {
    await expect(purchase.deletePurchase("NOPE")).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe("startup check", () => {
  it("warns about recent duplicate barcodes, never throws", async () => {
    await purchase.logPurchaseNumberClashes();
    expect(logs.join("\n")).toMatch(/WARN .*6296211 x2/);
    expect(logs.join("\n")).not.toMatch(/GRN numbers used/);
  });
});
