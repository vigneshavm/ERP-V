import { describe, it, expect, jest, beforeEach } from "@jest/globals";

// Rows from INFORMATION_SCHEMA.COLUMNS of the shop's SSS_copy (Sep 2026), trimmed.
const SCHEMA = [
  ["salbill", "cmnyname"],
  ["salbill", "cmy_name"],
  ["salbill", "countername"],
  ["salsntry", "cmnyname"],
  ["salsntry", "systemname"],
  ["salsntry", "rackno"],
  ["newproduct", "cmy_name"],
  ["newproduct", "floor_name"],
  ["GroceryNewProductEntry", "floor_name"],
  ["status1", "cmy_name"],
  ["purgrnentry", "cmy_name"],
  ["purgrnentry", "warehouse"],
  ["POHeader", "warehouse"],
  ["supplierdetail", "CompanyName"],
  ["StockDamage", "CompanyName"],
  ["TMP_GST_COMPANYWISE_REPORTS", "cmnyname"],
  ["PurchaseEntryMainTemp", "CompanyName"],
  ["tblElecSales_Temp", "cmy_name"],
  ["TMPCLOSEPATTY", "counter_name"],
  ["psam3", "CompanyName"],
  ["sam3", "CompanyName"],
  ["countername", "counter_name"],
  ["newuser", "counter_name"],
  ["AccountDate", "Countername"],
  ["LoginOpen", "CounterName"],
  ["productwiserackno", "rackname"],
  ["stockdetails", "rackno"],
  ["TMP_NEWPURCHASE_DETAILS", "warehouse"],
  ["salbill", "size"],
  ["PODetails", "size"],
  ["PrintSizeCompany", "Size"],
  ["TMP_PRINT_PODETAILS", "size"],
  ["newproduct", "group_name"],
  ["expensename", "group_name"],
  ["CashNameEntry", "group_name"],
  ["salbill", "gst_group"],
  ["purentrydetails", "pro_group_name"],
  ["purentrydetails", "patrn"],
  ["StockDamage", "pattern"],
  ["productwisefashionname", "fashionname"],
  ["stockdetails", "fashion"],
].map(([TABLE_NAME, COLUMN_NAME]) => ({ TABLE_NAME, COLUMN_NAME }));

let schemaReads = 0;
jest.unstable_mockModule("../sqlWrite.js", () => ({
  txt: (v: unknown) => String(v ?? "").trim(),
  sqlRead: async () => {
    schemaReads++;
    return SCHEMA;
  },
}));

const ref = await import("../sqlReferences.js");
const tables = (kind: Parameters<typeof ref.referenceColumns>[1]) =>
  [...new Set(ref.referenceColumns(SCHEMA, kind).map((c) => c.table))];

beforeEach(() => {
  ref.clearReferenceSchemaCache();
  schemaReads = 0;
});

describe("which tables reference a master (from the schema)", () => {
  it("company: every real table, incl. salbill and status1; not scratch or supplier tables", () => {
    expect(tables("company")).toEqual([
      "newproduct",
      "purgrnentry",
      "salbill",
      "salsntry",
      "status1",
      "StockDamage",
    ]);
  });

  it("counter: bills, users, business date and login state; not the counter master itself", () => {
    expect(tables("counter")).toEqual(["AccountDate", "LoginOpen", "newuser", "salbill", "salsntry"]);
  });

  it("warehouse, floor, rack", () => {
    expect(tables("warehouse")).toEqual(["POHeader", "purgrnentry"]);
    expect(tables("floor")).toEqual(["GroceryNewProductEntry", "newproduct"]);
    expect(tables("rack")).toEqual(["productwiserackno", "salsntry", "stockdetails"]);
  });
});

describe("product attributes and classification (04_product_attributes.md)", () => {
  it("size: sales and PO lines count; a print size and scratch tables don't", () => {
    expect(tables("size")).toEqual(["PODetails", "salbill"]);
  });
  it("group: product tables only, not cash / expense account groups", () => {
    expect(tables("group")).toEqual(["newproduct"]);
  });
  it("GST group: gst_group and purentrydetails.pro_group_name", () => {
    expect(tables("gstgroup")).toEqual(["purentrydetails", "salbill"]);
  });
  it("pattern is 'patrn' on purchase lines but 'pattern' on stock damage; fashion includes the product mapping", () => {
    expect(tables("pattern")).toEqual(["purentrydetails", "StockDamage"]);
    expect(tables("fashion")).toEqual(["productwisefashionname", "stockdetails"]);
  });
});

describe("findReferences", () => {
  const txWith = (hits: string[]) => {
    const calls: { text: string; params?: Record<string, unknown> }[] = [];
    return {
      calls,
      tx: {
        query: async (text: string, params?: Record<string, unknown>) => {
          calls.push({ text, params });
          return hits.map((t) => ({ t }));
        },
      } as never,
    };
  };

  it("checks all tables in one parameterised query and returns the ones in use", async () => {
    const { tx, calls } = txWith(["salbill", "newuser"]);
    expect(await ref.findReferences(tx, "counter", " USER2 ")).toEqual(["newuser", "salbill"]);
    expect(calls).toHaveLength(1);
    expect(calls[0].params).toEqual({ v: "USER2" });
    expect(calls[0].text).toMatch(/FROM dbo\.\[newuser\] WHERE LTRIM\(RTRIM\(\[counter_name\]\)\) = @v/);
    expect(calls[0].text).not.toMatch(/countername\] WHERE LTRIM\(RTRIM\(\[counter_name/); // master skipped
    expect(calls[0].text).not.toMatch(/TMPCLOSEPATTY/);
  });

  it("an unused master returns [] and the schema is read once per hour, not per check", async () => {
    const { tx } = txWith([]);
    expect(await ref.findReferences(tx, "warehouse", "GODOWN")).toEqual([]);
    await ref.findReferences(tx, "rack", "R1");
    expect(schemaReads).toBe(1);
  });

  it("empty name: no query", async () => {
    const { tx, calls } = txWith(["salbill"]);
    expect(await ref.findReferences(tx, "company", "  ")).toEqual([]);
    expect(calls).toHaveLength(0);
  });
});

describe("describeReferences", () => {
  it("names user accounts and shortens long lists", () => {
    expect(ref.describeReferences(["newuser", "salbill"])).toBe("newuser (user accounts), salbill");
    expect(ref.describeReferences(["a", "b", "c", "d", "e", "f"])).toBe("a, b, c, d and 2 more");
  });
});
