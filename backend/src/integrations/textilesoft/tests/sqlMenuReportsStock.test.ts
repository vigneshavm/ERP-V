import { describe, it, expect, beforeEach, jest } from "@jest/globals";

// Stock menu reports: cancelled purchase lines are hidden (legacy behavior); the two supplier reports show the
// supplier from the existing purgrnentry header and accept an optional supplier filter. SQL text is captured.
type Params = Record<string, unknown>;
const seen: Array<{ text: string; params: Params }> = [];
let missingColumn: string | undefined;

const stockColumns = ["grn_no", "sl_no", "barcode", "pname", "qty", "fqty", "sales_qty", "sreturn_qty", "preturn_qty", "stock_aj", "tot_qty", "mrp", "prate", "mtr", "cr_rate", "cr_per", "brand", "patrn", "size", "model", "date", "design", "code", "color", "style"];
const tableColumns: Record<string, string[]> = {
  stockdetails: stockColumns,
  purentrydetails: ["barcode", "STATUS", "grn_no"],
  purgrnentry: ["ID", "grn_no", "suplier_name"],
};

const makeRequest = () => {
  const params: Params = {};
  return {
    input(name: string, value: unknown) {
      params[name] = value;
      return this;
    },
    async query(text: string) {
      seen.push({ text, params: { ...params } });
      if (/INFORMATION_SCHEMA\.COLUMNS/.test(text)) {
        const cols = (tableColumns[String(params.table)] ?? []).filter((c) => c !== missingColumn);
        return { recordset: cols.map((name) => ({ name })) };
      }
      return { recordset: [] };
    },
  };
};

jest.unstable_mockModule("../shopDbReader.js", () => ({
  loadDbConfig: () => ({}),
  openPool: async () => ({ request: makeRequest, close: async () => undefined }),
}));
jest.unstable_mockModule("../sqlWrite.js", () => ({
  SqlWriteError: class SqlWriteError extends Error {
    constructor(message: string, public statusCode: number, public code?: string) {
      super(message);
    }
  },
}));

const { nativeMenuReport } = await import("../sqlMenuReports.js");
const dataQuery = () => seen.filter((s) => !/INFORMATION_SCHEMA/.test(s.text)).at(-1)!;

beforeEach(() => {
  seen.length = 0;
  missingColumn = undefined;
});

describe("stockdetails menu reports", () => {
  it("hide barcodes whose purchase line is cancelled (STATUS = '1')", async () => {
    await nativeMenuReport("stock-report", {});
    expect(dataQuery().text).toContain("NOT IN (SELECT LTRIM(RTRIM(c.[barcode])) FROM dbo.[purentrydetails] AS c WHERE c.[STATUS] = '1'");
  });

  it("refuse to run when purentrydetails lacks STATUS", async () => {
    missingColumn = "STATUS";
    await expect(nativeMenuReport("stock-report", {})).rejects.toMatchObject({ statusCode: 503 });
    expect(seen.some((s) => !/INFORMATION_SCHEMA/.test(s.text))).toBe(false);
  });
});

describe("supplier stock reports (REP15 / REP16)", () => {
  it.each(["patternwise-supplier-sizewise-stock", "pattern-supplier-sizewise-stock-report"])("%s joins the supplier from the latest purgrnentry header", async (id) => {
    await nativeMenuReport(id, {});
    const { text } = dataQuery();
    expect(text).toContain("OUTER APPLY (SELECT TOP 1 [suplier_name] FROM dbo.[purgrnentry] AS g");
    expect(text).toContain("ORDER BY g.[ID] DESC");
    expect(text).toContain("h.[suplier_name]");
  });

  it("orders REP15 by pattern, supplier, size and REP16 by supplier, pattern, size", async () => {
    await nativeMenuReport("patternwise-supplier-sizewise-stock", {});
    expect(dataQuery().text).toMatch(/ORDER BY \[patrn\],\[suplier_name\],\[size\]/);
    await nativeMenuReport("pattern-supplier-sizewise-stock-report", {});
    expect(dataQuery().text).toMatch(/ORDER BY \[suplier_name\],\[patrn\],\[size\]/);
  });

  it("filters by supplier as a bound parameter, never inline", async () => {
    await nativeMenuReport("patternwise-supplier-sizewise-stock", { supplier: "  M.S.GUNNA " });
    const q = dataQuery();
    expect(q.text).toContain("LTRIM(RTRIM(h.[suplier_name]))=@supplier");
    expect(q.params.supplier).toBe("M.S.GUNNA");
    expect(q.text).not.toContain("GUNNA");
  });

  it("rejects a supplier filter on a report that has no supplier column", async () => {
    await expect(nativeMenuReport("stock-report", { supplier: "X" })).rejects.toMatchObject({ statusCode: 400 });
  });

  it("refuse to run when purgrnentry lacks suplier_name", async () => {
    missingColumn = "suplier_name";
    await expect(nativeMenuReport("patternwise-supplier-sizewise-stock", {})).rejects.toMatchObject({ statusCode: 503 });
  });
});
