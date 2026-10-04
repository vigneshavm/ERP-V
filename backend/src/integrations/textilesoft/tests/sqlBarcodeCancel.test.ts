import { describe, it, expect, beforeEach, jest } from "@jest/globals";

// Legacy barcode cancel (B14/B15): flag the purchase line STATUS = '1'; refuse sold or already-cancelled barcodes.
type Row = Record<string, unknown>;
let db: Record<string, Row[]> = {};
const updates: Array<{ table: string; set: Row; where: Row }> = [];
const txt = (v: unknown) => String(v ?? "").trim();
const eq = (a: unknown, b: unknown) => txt(a).toLowerCase() === txt(b).toLowerCase();

class SqlWriteError extends Error {
  constructor(message: string, public statusCode: number, public code?: string) {
    super(message);
  }
}

const tx = {
  query: async (text: string, p: Record<string, unknown> = {}): Promise<Row[]> => {
    if (/FROM dbo\.\[purentrydetails\] WHERE LTRIM\(RTRIM\(barcode\)\) = @b/.test(text))
      return (db.purentrydetails ?? []).filter((r) => eq(r.barcode, p.b));
    throw new Error("unexpected query: " + text);
  },
  update: async (table: string, set: Row, where: Row) => {
    updates.push({ table, set, where });
    const rows = (db[table] ?? []).filter((r) => Object.entries(where).every(([k, v]) => eq(r[k], v)));
    rows.forEach((r) => Object.assign(r, set));
    return rows.length;
  },
};

jest.unstable_mockModule("../sqlWrite.js", () => ({
  SqlWriteError,
  txt,
  sqlWriter: async () => ({}),
  sqlRead: async (text: string, p: Record<string, unknown> = {}): Promise<Row[]> => {
    if (/FROM dbo\.\[salsntry\] WHERE barcode=@barcode/.test(text)) return (db.salsntry ?? []).filter((r) => eq(r.barcode, p.barcode)).slice(0, 1);
    throw new Error("unexpected read: " + text);
  },
  withSqlTransaction: async (_label: string, fn: (t: typeof tx) => unknown) => fn(tx),
}));

const { cancelUnsoldBarcode } = await import("../sqlLegacyQueries.js");

beforeEach(() => {
  updates.length = 0;
  db = {
    purentrydetails: [
      { ID: 1, grn_no: "V13204", barcode: "6212112", STATUS: null },
      { ID: 2, grn_no: "V13204", barcode: "6212113", STATUS: "1" },
      { ID: 3, grn_no: "V13205", barcode: "6212200", STATUS: null },
    ],
    salsntry: [{ barcode: "6212200", qty: "1" }],
    stockdetails: [{ grn_no: "V13204", barcode: "6212112", qty: "8" }],
    purgrnentry: [{ grn_no: "V13204", tot_qut: "247", totnetamot: "100810.00" }],
  };
});

describe("cancelUnsoldBarcode", () => {
  it("flags only the purchase line with STATUS = '1' and touches nothing else", async () => {
    const result = await cancelUnsoldBarcode("6212112");
    expect(result).toEqual({ barcode: "6212112", cancelledLines: 1, grnNumbers: ["V13204"] });
    expect(updates).toEqual([{ table: "purentrydetails", set: { STATUS: "1" }, where: { ID: 1 } }]);
    expect(db.purentrydetails[0]?.STATUS).toBe("1");
    expect(db.stockdetails[0]).toEqual({ grn_no: "V13204", barcode: "6212112", qty: "8" });
    expect(db.purgrnentry[0]).toEqual({ grn_no: "V13204", tot_qut: "247", totnetamot: "100810.00" });
  });

  it("refuses a barcode with a saved sale and writes nothing", async () => {
    await expect(cancelUnsoldBarcode("6212200")).rejects.toMatchObject({ statusCode: 409, code: "BARCODE_ALREADY_SOLD" });
    expect(updates).toHaveLength(0);
  });

  it("refuses an already-cancelled barcode", async () => {
    await expect(cancelUnsoldBarcode("6212113")).rejects.toMatchObject({ statusCode: 409, code: "BARCODE_ALREADY_CANCELLED" });
    expect(updates).toHaveLength(0);
  });

  it("returns 404 for a barcode with no purchase line", async () => {
    await expect(cancelUnsoldBarcode("9999999")).rejects.toMatchObject({ statusCode: 404, code: "BARCODE_NOT_FOUND" });
    expect(updates).toHaveLength(0);
  });

  it("requires a barcode", async () => {
    await expect(cancelUnsoldBarcode("  ")).rejects.toMatchObject({ statusCode: 400 });
  });
});
