import { describe, it, expect, jest, beforeEach } from "@jest/globals";

// Attribute masters (brand, size, ...): usage checks and brand number fields.
type Row = Record<string, unknown>;
let lines: Record<string, Row[]> = {};
const writes: string[] = [];
const eq = (a: unknown, b: unknown) =>
  String(a ?? "").trim().toLowerCase() === String(b ?? "").trim().toLowerCase();

class SqlWriteError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message);
  }
}
const query = async (text: string, p: Record<string, unknown> = {}): Promise<Row[]> => {
  if (/INFORMATION_SCHEMA/.test(text))
    return Object.entries(lines).flatMap(([t, rows]) =>
      Object.keys(rows[0] ?? {}).map((c) => ({ TABLE_NAME: t, COLUMN_NAME: c })),
    );
  if (/UNION|^SELECT '/.test(text.trim()))
    return [...text.matchAll(/SELECT '(\w+)' AS t WHERE EXISTS \(SELECT 1 FROM dbo\.\[(\w+)\] WHERE LTRIM\(RTRIM\(\[(\w+)\]\)\) = @v\)/g)]
      .filter(([, , t, c]) => (lines[t] ?? []).some((r) => eq(r[c], p.v)))
      .map(([, t]) => ({ t }));
  const m = text.match(/CASE WHEN EXISTS \(SELECT 1 FROM dbo\.\[(\w+)\] WHERE LTRIM\(RTRIM\(\[(\w+)\]\)\) = @v\)/);
  if (m) return [{ used: (lines[m[1]] ?? []).some((r) => eq(r[m[2]], p.v)) ? 1 : 0 }];
  if (/SELECT 1 FROM dbo\.\[brand\] WHERE/.test(text)) return [];
  return [];
};
const tx = {
  query,
  insert: async (t: string, r: Row) => void writes.push(`insert ${t} ${JSON.stringify(r)}`),
  update: async (t: string, set: Row) => {
    writes.push(`update ${t} ${JSON.stringify(set)}`);
    return 1;
  },
  remove: async (t: string) => {
    writes.push(`remove ${t}`);
    return 1;
  },
  nextNumber: async () => 5,
};
jest.unstable_mockModule("../sqlWrite.js", () => ({
  SqlWriteError,
  txt: (v: unknown) => String(v ?? "").trim(),
  tsDate: () => "2026-09-30",
  sqlRead: async (t: string, p?: Record<string, unknown>) =>
    /FROM dbo\.\[brand\]/.test(t)
      ? [{ group_cd: "5", name_eng: "ZODIAC", com_per: "2.5", discount: "10", amt: "", com_pic: "" }]
      : query(t, p),
  withSqlTransaction: async (_l: string, fn: (t: typeof tx) => unknown) => fn(tx),
}));
jest.unstable_mockModule("../sqlOrg.js", () => ({
  listLocations: async () => [],
  createLocation: async () => undefined,
  updateLocation: async () => undefined,
  deleteLocation: async () => undefined,
}));

const masters = await import("../sqlMasters.js");
const refs = await import("../sqlReferences.js");
// Same id format as sqlMasters.ts (sql.<type>.<code>.<base64url name>).
const id = (type: string, code: string, name: string) =>
  `sql.${type}.${code}.${Buffer.from(name, "utf8").toString("base64url")}`;

beforeEach(() => {
  refs.clearReferenceSchemaCache();
  writes.length = 0;
  lines = {
    purentrydetails: [{ size: "XL", brand: "ZODIAC" }],
    salbill: [{ size: "XXL" }],
    PrintSizeCompany: [{ Size: "L" }],
  };
});

describe("brand number fields", () => {
  const brand = { numeric: { commissionPercent: ["Commission %", 100], commissionAmount: ["Commission amount", null], discountPercent: ["Discount %", 100] } } as never;

  it("normalises numbers, allows empty", () => {
    expect(masters.checkMasterNumbers(brand, { commissionPercent: "2.50", discountPercent: "", commissionAmount: "1,000", commissionType: "P" })).toEqual({
      commissionPercent: "2.5",
      discountPercent: "",
      commissionAmount: "1000",
      commissionType: "P",
    });
  });

  it("refuses text and percentages over 100", () => {
    expect(() => masters.checkMasterNumbers(brand, { discountPercent: "five" })).toThrow(/Discount % must be a number/);
    expect(() => masters.checkMasterNumbers(brand, { commissionPercent: "120" })).toThrow(/more than 100/);
    expect(() => masters.checkMasterNumbers(brand, { commissionAmount: "-3" })).toThrow(/Commission amount/);
  });
});

describe("attribute delete checks every table naming the value", () => {
  const del = (type: string, code: string, name: string) => {
    return masters.deleteSqlMaster(id(type, code, name));
  };

  it("a size only on a sales bill (not purentrydetails) is still protected", async () => {
    await expect(del("PRODUCT_SIZE", "3", "XXL")).rejects.toMatchObject({
      statusCode: 409,
      message: expect.stringContaining("salbill"),
    });
    expect(writes).toEqual([]);
  });

  it("a print size with the same letters doesn't block deleting the garment size", async () => {
    await del("PRODUCT_SIZE", "4", "L");
    expect(writes).toEqual(["remove size"]);
  });
});
