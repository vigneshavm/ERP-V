import { describe, it, expect, jest, beforeEach } from "@jest/globals";

type Row = Record<string, unknown>;
const reads: { text: string; params: Record<string, unknown> }[] = [];
let purchaseLines: Row[] = []; // what the GROUP BY over purentrydetails returns
let masterRows: Row[] = [];
let mappingRows: Record<string, Row[]> = {};
const masters: Record<string, string[]> = {};
const writes: string[] = [];

class SqlWriteError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message);
  }
}
const tx = {
  query: async (text: string, p: Record<string, unknown> = {}) => {
    const m = text.match(/FROM dbo\.\[(\w+)\] WHERE LTRIM\(RTRIM\(name_eng\)\) = @v/);
    if (m) return (masters[m[1]] ?? []).includes(String(p.v)) ? [{ 1: 1 }] : [];
    if (/TOP 1 name FROM dbo\.\[newproduct\]/.test(text)) return p.c === "12" ? [{ name: "PANT" }] : [];
    throw new Error("unexpected tx query " + text);
  },
  remove: async (t: string, w: Row) => void writes.push(`remove ${t} ${JSON.stringify(w)}`),
  insert: async (t: string, r: Row) => void writes.push(`insert ${t} ${JSON.stringify(r)}`),
};
jest.unstable_mockModule("../sqlWrite.js", () => ({
  SqlWriteError,
  txt: (v: unknown) => String(v ?? "").trim(),
  sqlRead: async (text: string, params: Record<string, unknown> = {}) => {
    reads.push({ text, params });
    if (/FROM dbo\.\[purentrydetails\]/.test(text)) return purchaseLines;
    const m = text.match(/FROM dbo\.\[(productwiserackno|productwisefashionname)\]/);
    if (m) return mappingRows[m[1]] ?? [];
    return masterRows;
  },
  withSqlTransaction: async (_l: string, fn: (t: typeof tx) => unknown) => fn(tx),
}));

const attrs = await import("../sqlAttributes.js");

beforeEach(() => {
  reads.length = 0;
  writes.length = 0;
  purchaseLines = [];
  masterRows = [];
  mappingRows = {};
  masters.RackNo = ["A1", "B2"];
  masters.FashionName = ["SLIM"];
});

describe("suggestAttribute", () => {
  it("unknown attribute: 400 listing the valid ones", async () => {
    await expect(attrs.suggestAttribute("fabric")).rejects.toMatchObject({
      statusCode: 400,
      message: expect.stringContaining("brand, pattern, size"),
    });
  });

  it("merges purchase history and the master list, most used first, then master-only values", async () => {
    purchaseLines = [
      { v: "PETER ENGLAND", n: 40 },
      { v: "Allen Solly", n: 12 },
    ];
    masterRows = [{ v: "ALLEN SOLLY" }, { v: "ZODIAC" }];
    expect(await attrs.suggestAttribute("brand")).toEqual([
      { value: "PETER ENGLAND", uses: 40, inMaster: false },
      { value: "Allen Solly", uses: 12, inMaster: true },
      { value: "ZODIAC", uses: 0, inMaster: true },
    ]);
    // pattern is stored in purentrydetails.patrn and its master is dbo.pattern
    await attrs.suggestAttribute("pattern");
    expect(reads.some((r) => /d\.\[patrn\]/.test(r.text))).toBe(true);
    expect(reads.some((r) => /FROM dbo\.\[pattern\]/.test(r.text))).toBe(true);
  });

  it("typed text: values starting with it come first; the search is parameterised", async () => {
    purchaseLines = [
      { v: "COTTON BLUE", n: 50 },
      { v: "BLUE", n: 2 },
    ];
    const out = await attrs.suggestAttribute("color", { q: " blue " });
    expect(out.map((s) => s.value)).toEqual(["BLUE", "COTTON BLUE"]);
    expect(reads[0].params.q).toBe("%blue%");
    expect(reads[0].text).not.toContain("blue");
  });

  it("per supplier / product: only what they actually used (no master-only values); limit is clamped", async () => {
    purchaseLines = [{ v: "M", n: 3 }];
    masterRows = [{ v: "M" }, { v: "XXL" }];
    const out = await attrs.suggestAttribute("size", { supplier: "RAMRAJ", limit: 5000 });
    expect(out).toEqual([{ value: "M", uses: 3, inMaster: true }]);
    expect(reads[0].text).toMatch(/JOIN dbo\.\[purgrnentry\] h/);
    expect(reads[0].params).toMatchObject({ sup: "RAMRAJ", lim: 200 });
    await attrs.suggestAttribute("size", { productCode: "12", limit: 0 });
    expect(reads[2].params).toMatchObject({ pc: "12", lim: 30 });
  });
});

describe("product-wise rack / fashion", () => {
  it("productMappings groups by product code, without duplicates or blanks", async () => {
    mappingRows.productwiserackno = [
      { code: "12", v: "A1" },
      { code: "12", v: "B2" },
      { code: "12", v: "A1" },
      { code: "7", v: "" },
    ];
    mappingRows.productwisefashionname = [{ code: "12", v: "SLIM" }];
    const m = await attrs.productMappings();
    expect(m.racks.get("12")).toEqual(["A1", "B2"]);
    expect(m.racks.get("7")).toEqual([]);
    expect(m.fashions.get("12")).toEqual(["SLIM"]);
  });

  it("setProductMapping replaces the product's rows; values upper-cased and de-duplicated", async () => {
    await attrs.setProductMapping(tx as never, "rack", "12", "PANT", ["a1", "A1 ", "b2", ""]);
    expect(writes).toEqual([
      'remove productwiserackno {"pcode":"12"}',
      'insert productwiserackno {"pcode":"12","pname":"PANT","rackname":"A1"}',
      'insert productwiserackno {"pcode":"12","pname":"PANT","rackname":"B2"}',
    ]);
  });

  it("a value missing from the master is refused before anything is written", async () => {
    await expect(attrs.setProductMapping(tx as never, "fashion", "12", "PANT", ["SLIM", "BAGGY"])).rejects.toMatchObject({
      statusCode: 400,
      message: expect.stringContaining('Fashion name "BAGGY"'),
    });
    expect(writes).toEqual([]);
  });

  it("replaceProductMapping: unknown product is 404; otherwise saves with the product's name", async () => {
    await expect(attrs.replaceProductMapping("rack", "99", ["A1"])).rejects.toMatchObject({ statusCode: 404 });
    mappingRows.productwiserackno = [{ code: "12", v: "A1" }];
    expect(await attrs.replaceProductMapping("rack", "12", ["A1"])).toEqual(["A1"]);
    expect(writes).toContain('insert productwiserackno {"pcode":"12","pname":"PANT","rackname":"A1"}');
  });
});
