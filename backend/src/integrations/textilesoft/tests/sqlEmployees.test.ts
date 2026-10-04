import { describe, it, expect, jest, beforeEach } from "@jest/globals";

// Staff directory on dbo.newemployee (no unique key in the database: the checks live in the code).
type Row = Record<string, unknown>;
let employees: Row[] = [];
let billLines: Row[] = [];
let nextCode = 1;
const inserts: Row[] = [];
const updates: { set: Row; where: Row }[] = [];
const removed: Row[] = [];
const eq = (a: unknown, b: unknown) => String(a ?? "").trim() === String(b ?? "").trim();

class SqlWriteError extends Error {
  constructor(message: string, public statusCode: number, public code?: string) {
    super(message);
  }
}
const query = async (text: string, p: Record<string, unknown> = {}): Promise<Row[]> => {
  if (/FROM dbo\.\[salsntry\]/.test(text)) return billLines.some((r) => eq(r.sls_man, p.c)) ? [{ x: 1 }] : [];
  if (/\[name_eng\]\)\) = @n AND/.test(text)) return employees.filter((e) => eq(e.name_eng, p.n) && !eq(e.code, p.c));
  if (/\[name_eng\]\)\) = @n/.test(text)) return employees.filter((e) => eq(e.name_eng, p.n));
  if (/FROM dbo\.\[newemployee\] WHERE LTRIM\(RTRIM\(\[code\]\)\) = @c/.test(text)) return employees.filter((e) => eq(e.code, p.c));
  if (/FROM dbo\.\[newemployee\]/.test(text)) return employees;
  const lookup = /FROM dbo\.\[(empolyee\w+)\]/.exec(text)?.[1];
  if (lookup) return [{ name_eng: lookup === "empolyeecatagary" ? "SALESMAN" : "X" }];
  return [];
};
const tx = {
  query,
  async insert(_t: string, row: Row) { inserts.push(row); employees.push(row); },
  async update(_t: string, set: Row, where: Row) { updates.push({ set, where }); return 1; },
  async remove(_t: string, where: Row) { removed.push(where); return 1; },
  async nextNumber() { return nextCode; },
};
jest.unstable_mockModule("../sqlWrite.js", () => ({
  SqlWriteError,
  txt: (v: unknown) => (v === null || v === undefined ? "" : String(v).trim()),
  sqlRead: query,
  withSqlTransaction: async (_l: string, fn: (t: typeof tx) => unknown) => fn(tx),
}));

const { createEmployee, updateEmployee, deleteEmployee, listEmployees, employeeLookups, unknownEmployeeCodes } = await import("../sqlEmployees.js");

beforeEach(() => {
  employees = [];
  billLines = [];
  nextCode = 1;
  inserts.length = 0;
  updates.length = 0;
  removed.length = 0;
});

describe("staff directory (dbo.newemployee)", () => {
  it("creates an employee with the allocated code, an upper-case name and Textilesoft's column names", async () => {
    employees = [{ code: "4", name_eng: "OLD" }];
    nextCode = 5;
    const e = await createEmployee({ name: "  ravi kumar ", mobile: "9876543210", category: "SALESMAN", salary: "12000" });
    expect(inserts[0]).toMatchObject({ code: "5", name_eng: "RAVI KUMAR", mb_nu: "9876543210", catagaray: "SALESMAN", salary: "12000", pf: "" });
    expect(e).toMatchObject({ code: "5", name: "RAVI KUMAR", mobile: "9876543210", category: "SALESMAN" });
  });

  it("refuses a missing name, a duplicate name and a non-numeric salary", async () => {
    employees = [{ code: "1", name_eng: "RAVI" }];
    nextCode = 2;
    await expect(createEmployee({ mobile: "1" })).rejects.toMatchObject({ statusCode: 400 });
    await expect(createEmployee({ name: "ravi" })).rejects.toMatchObject({ statusCode: 409 });
    await expect(createEmployee({ name: "new", salary: "abc" })).rejects.toMatchObject({ statusCode: 400 });
    expect(inserts).toHaveLength(0);
  });

  it("refuses to save when the allocated code is already used by another row", async () => {
    employees = [{ code: "7", name_eng: "SITA" }];
    nextCode = 7; // e.g. Textilesoft saved the same number at the same moment
    await expect(createEmployee({ name: "gita" })).rejects.toMatchObject({ statusCode: 409 });
    expect(inserts).toHaveLength(0);
  });

  it("update writes only the fields sent, and refuses a missing or ambiguous code", async () => {
    employees = [{ code: "2", name_eng: "RAVI", mb_nu: "1" }, { code: "3", name_eng: "A" }, { code: "3", name_eng: "B" }];
    await updateEmployee("2", { mobile: "9999999999" });
    expect(updates).toEqual([{ set: { mb_nu: "9999999999" }, where: { code: "2" } }]);
    await expect(updateEmployee("9", { mobile: "1" })).rejects.toMatchObject({ statusCode: 404 });
    await expect(updateEmployee("", { mobile: "1" })).rejects.toMatchObject({ statusCode: 404 });
    await expect(updateEmployee("3", { mobile: "1" })).rejects.toMatchObject({ statusCode: 409 });
    expect(updates).toHaveLength(1);
  });

  it("cannot delete an employee who is the salesperson on a bill", async () => {
    employees = [{ code: "1", name_eng: "RAVI" }, { code: "2", name_eng: "SITA" }];
    billLines = [{ sls_man: "1" }];
    await expect(deleteEmployee("1")).rejects.toMatchObject({ statusCode: 409, code: "EMPLOYEE_IN_USE" });
    await deleteEmployee("2");
    expect(removed).toEqual([{ code: "2" }]);
  });

  it("lists in code order, reads the pick-lists, and finds unknown salesperson codes", async () => {
    employees = [{ code: "10", name_eng: "B" }, { code: "2", name_eng: "A" }];
    expect((await listEmployees()).map((e) => e.code)).toEqual(["2", "10"]);
    expect((await employeeLookups()).categories).toEqual(["SALESMAN"]);
    expect(await unknownEmployeeCodes(["2", "99", " "])).toEqual(["99"]);
  });
});
