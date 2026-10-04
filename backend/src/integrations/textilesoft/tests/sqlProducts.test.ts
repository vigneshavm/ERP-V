import { describe, it, expect, jest, beforeEach } from "@jest/globals";

// In-memory shop tables. Values compared like SQL Server: trimmed, case-insensitive.
type Row = Record<string, unknown>;
let db: Record<string, Row[]> = {};
const writes: string[] = [];
const eq = (a: unknown, b: unknown) =>
  String(a ?? "").trim().toLowerCase() === String(b ?? "").trim().toLowerCase();
const col = (r: Row, c: string) => r[Object.keys(r).find((k) => k.toLowerCase() === c.toLowerCase()) ?? c];

function run(text: string, p: Record<string, unknown> = {}): Row[] {
  if (/HAVING COUNT\(DISTINCT/.test(text)) {
    const names = new Map<string, Set<string>>();
    for (const r of db.newproduct) {
      const k = String(r.code).trim();
      if (!String(r.name ?? "").trim()) continue;
      names.set(k, (names.get(k) ?? new Set()).add(String(r.name).trim().toUpperCase()));
    }
    return [...names].filter(([, n]) => n.size > 1).flatMap(([code, n]) => [...n].map((name) => ({ code, name })));
  }
  if (/INFORMATION_SCHEMA/.test(text))
    return Object.entries(db).flatMap(([t, rows]) =>
      Object.keys(rows[0] ?? {}).map((c) => ({ TABLE_NAME: t, COLUMN_NAME: c })),
    );
  if (/UNION|^SELECT '/.test(text.trim()))
    return [...text.matchAll(/SELECT '(\w+)' AS t WHERE EXISTS \(SELECT 1 FROM dbo\.\[(\w+)\] WHERE LTRIM\(RTRIM\(\[(\w+)\]\)\) = @v\)/g)]
      .filter(([, , t, c]) => (db[t] ?? []).some((r) => eq(col(r, c), p.v)))
      .map(([, t]) => ({ t }));
  let m = text.match(/CASE WHEN EXISTS \(SELECT 1 FROM dbo\.\[(\w+)\] WHERE LTRIM\(RTRIM\((\w+)\)\) = @c\)/);
  if (m) return [{ used: (db[m[1]] ?? []).some((r) => eq(col(r, m![2]), p.c)) ? 1 : 0 }];
  if (/SELECT TOP 1 LTRIM\(RTRIM\(name\)\) AS name FROM dbo\.\[newproduct\]/.test(text))
    return db.newproduct.filter((r) => eq(r.code, p.c)).slice(0, 1).map((r) => ({ name: r.name }));
  if (/SELECT \* FROM dbo\.\[newproduct\] WHERE LTRIM\(RTRIM\(code\)\) = @c/.test(text))
    return db.newproduct.filter((r) => eq(r.code, p.c));
  if (/name\)\) = @n AND LTRIM\(RTRIM\(code\)\) <> @c/.test(text))
    return db.newproduct.filter((r) => eq(r.name, p.n) && !eq(r.code, p.c));
  m = text.match(/SELECT 1 FROM dbo\.\[(\w+)\].* WHERE LTRIM\(RTRIM\(\[?(\w+)\]?\)\) = @(\w+)/);
  if (m) return (db[m[1]] ?? []).filter((r) => eq(col(r, m![2]), p[m![3]])).map(() => ({ 1: 1 }));
  throw new Error("unexpected query: " + text);
}

class SqlWriteError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message);
  }
}
const tx = {
  query: async (t: string, p?: Record<string, unknown>) => run(t, p),
  insert: async (t: string) => void writes.push(`insert ${t}`),
  update: async (t: string, set: Row) => {
    writes.push(`update ${t} ${Object.keys(set).join(",")}`);
    return 1;
  },
  remove: async (t: string) => {
    writes.push(`remove ${t}`);
    return 1;
  },
  nextNumber: async () => 99,
};
jest.unstable_mockModule("../sqlWrite.js", () => ({
  SqlWriteError,
  txt: (v: unknown) => String(v ?? "").trim(),
  tsDate: () => "2026-09-30",
  sqlRead: async (t: string, p?: Record<string, unknown>) => run(t, p),
  withSqlTransaction: async (_l: string, fn: (t: typeof tx) => unknown) => fn(tx),
}));
const logs: string[] = [];
jest.unstable_mockModule("../../../config/logger.js", () => ({
  info: (m: string) => logs.push("INFO " + m),
  warn: (m: string) => logs.push("WARN " + m),
}));
jest.unstable_mockModule("../sqlAttributes.js", () => ({
  productMappings: async () => ({ racks: new Map(), fashions: new Map() }),
  setProductMapping: async () => undefined,
}));

const products = await import("../sqlProducts.js");
const refs = await import("../sqlReferences.js");

beforeEach(() => {
  refs.clearReferenceSchemaCache();
  writes.length = 0;
  db = {
    newproduct: [
      { code: "12", name: "PANT", unit_de: "PCS", gst_group: "GST5", cmy_name: "SSS", mrp: "800", ProductHSNCode: "NIL" },
    ],
    purentrydetails: [{ code: "7", pname: "OLD", grn_no: "1" }],
    salbill: [{ code: "5", cmy_name: "SSS" }],
    supplierdetail: [{ code: "12", CompanyName: "X" }], // supplier code 12 -- not product 12
    PatternSize: [{ ProductName: "SHIRT" }],
    TMP_PURCH_BACK: [{ code: "12" }],
    prounit: [{ name_eng: "PCS" }],
    gstgroup: [{ gst_name: "GST5" }],
    companydetail: [{ cmy_name_eng: "SSS" }],
  };
});

describe("checkProductNumbers", () => {
  it("normalises numbers and HSN", () => {
    expect(
      products.checkProductNumbers({ mrp: "1,250.50", discountPercent: "5", hsnCode: "6109 1000", name: "x" }),
    ).toMatchObject({ mrp: "1250.5", discountPercent: "5", hsnCode: "61091000", name: "x" });
    expect(products.checkProductNumbers({ mrp: "", retailRate: null })).toMatchObject({ mrp: "" });
  });

  it("refuses text, negatives, % over 100 and bad HSN, naming the field", () => {
    expect(() => products.checkProductNumbers({ mrp: "12o" })).toThrow(/MRP must be a number/);
    expect(() => products.checkProductNumbers({ wholesaleRate: "-5" })).toThrow(/Wholesale rate/);
    expect(() => products.checkProductNumbers({ discountPercent: "150" })).toThrow(/more than 100/);
    expect(() => products.checkProductNumbers({ hsnCode: "61091" })).toThrow(/4, 6 or 8 digits/);
  });

  it("on update, a value sent back unchanged is not re-checked (old Textilesoft data)", () => {
    expect(products.checkProductNumbers({ hsnCode: "NIL", mrp: "90" }, { hsnCode: "NIL", mrp: "80" })).toMatchObject({
      hsnCode: "NIL",
      mrp: "90",
    });
    expect(() => products.checkProductNumbers({ hsnCode: "NIL2" }, { hsnCode: "NIL" })).toThrow(/HSN/);
  });
});

describe("reference lists", () => {
  it("only product-code tables; no supplier/bank/employee codes, other modules' masters or scratch tables", () => {
    const tables = products.PRODUCT_CODE_REFS.map((r) => r.table.toLowerCase());
    for (const t of ["purentrydetails", "stockdetails", "salbill", "podetails", "purchasereturndetails"])
      expect(tables).toContain(t);
    for (const t of ["supplierdetail", "bankdetail", "newemployee", "customergroup", "giftnewproduct", "tmp_purch_back"])
      expect(tables).not.toContain(t);
    expect(tables.some((t) => /^tmp|temp$/.test(t))).toBe(false);
  });
});

describe("deleteProduct", () => {
  it("purchased: Textilesoft's own rule and message", async () => {
    db.newproduct.push({ code: "7", name: "OLD", cmy_name: "SSS" });
    await expect(products.deleteProduct("7")).rejects.toThrow(/already purchased/);
  });

  it("sold but never purchased: refused, naming the table", async () => {
    db.newproduct.push({ code: "5", name: "SAREE", cmy_name: "SSS" });
    await expect(products.deleteProduct("5")).rejects.toMatchObject({
      statusCode: 409,
      message: expect.stringContaining("salbill"),
    });
    expect(writes).toEqual([]);
  });

  it("a setting keyed on the product name blocks the delete", async () => {
    db.newproduct.push({ code: "8", name: "SHIRT", cmy_name: "SSS" });
    await expect(products.deleteProduct("8")).rejects.toThrow(/PatternSize/);
  });

  it("unused product is deleted (a supplier with the same code number doesn't count)", async () => {
    await products.deleteProduct("12");
    expect(writes).toEqual(["remove newproduct", "remove productwiserackno", "remove productwisefashionname"]);
  });
});

describe("updateProduct rename", () => {
  it("allowed after purchases (lines keep their own pname, as in Textilesoft)", async () => {
    db.newproduct.push({ code: "7", name: "OLD", unit_de: "PCS", gst_group: "GST5", cmy_name: "SSS" });
    await products.updateProduct("7", { name: "NEW" });
    expect(writes).toContain("update productwiserackno pname");
  });

  it("refused while a name-keyed setting uses the old name", async () => {
    db.newproduct.push({ code: "8", name: "SHIRT", unit_de: "PCS", gst_group: "GST5", cmy_name: "SSS" });
    await expect(products.updateProduct("8", { name: "SHIRTS" })).rejects.toThrow(/PatternSize/);
    expect(writes).toEqual([]);
  });

  it("editing the price of a product with a legacy HSN still works", async () => {
    await products.updateProduct("12", { mrp: "850", hsnCode: "NIL" });
    expect(writes[0]).toMatch(/update newproduct .*mrp/);
  });
});

describe("duplicate product codes (startup check)", () => {
  it("one code with a row per company is normal; one code with two names is reported", async () => {
    db.newproduct.push({ code: "12", name: "pant ", cmy_name: "SSS2" }); // same product, 2nd company
    expect(await products.duplicateProductCodes()).toEqual([]);
    db.newproduct.push({ code: "12", name: "SHIRT", cmy_name: "SSS" }); // desktop + ERP took code 12 together
    expect(await products.duplicateProductCodes()).toEqual([{ code: "12", names: expect.arrayContaining(["PANT", "SHIRT"]) }]);
  });

  it("logs a warning naming the codes, and never throws", async () => {
    logs.length = 0;
    db.newproduct.push({ code: "12", name: "SHIRT", cmy_name: "SSS" });
    await products.logDuplicateProductCodes();
    expect(logs.join("\n")).toMatch(/WARN .*1 product code\(s\) .*12 \(/);
    logs.length = 0;
    const saved = db.newproduct;
    // @ts-expect-error force a failure
    db.newproduct = null;
    await expect(products.logDuplicateProductCodes()).resolves.toBeUndefined();
    expect(logs.join("\n")).toMatch(/check skipped/);
    db.newproduct = saved;
  });
});
