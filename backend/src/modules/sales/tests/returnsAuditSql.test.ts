import { describe, it, expect, jest, beforeEach } from "@jest/globals";

// Returns & Refund Audit from the shop database (no MongoDB).
type Row = Record<string, unknown>;
let returnRows: Row[] = [];
let linkRows: Row[] = [];
let headRows: Row[] = [];
let sumRows: Row[] = [];
let billCount = 0;
let allocationTableMissing = false;

jest.unstable_mockModule("../../../integrations/textilesoft/sqlItemSource.js", () => ({
  getPool: async () => ({
    request: () => ({
      input() {},
      query: async (text: string) => {
        if (/FROM dbo\.\[salsntry\] l JOIN/.test(text)) return { recordset: returnRows };
        if (/SELECT COUNT\(\*\) AS n FROM dbo\.\[sales2\]/.test(text)) return { recordset: [{ n: billCount }] };
        if (/erp\.sales_return_allocation/.test(text) && allocationTableMissing) throw new Error("Invalid object name 'erp.sales_return_allocation'");
        if (/MIN\(a\.\[source_sysidandbill\]\)/.test(text)) return { recordset: linkRows };
        if (/FROM dbo\.\[sales2\]$/.test(text.trim())) return { recordset: headRows };
        if (/SUM\(\[paid_amount\]\)/.test(text)) return { recordset: sumRows };
        return { recordset: [] };
      },
    }),
  }),
}));

const { buildReturnsAudit } = await import("../services/ReturnAuditService.js");

const ret = (over: Row): Row => ({
  sysid: "R1", billno: "A9", dt: "2026-09-20T11:00:00", cus: "Meena", userId: "cash1", amount: 500, qty: 1, lines: 1, cash: 500, bank: 0, ...over,
});

beforeEach(() => {
  returnRows = [];
  linkRows = [];
  headRows = [];
  sumRows = [];
  billCount = 10;
  allocationTableMissing = false;
});

describe("returns audit (shop database)", () => {
  it("lists a return with its cashier, customer and refund mode", async () => {
    returnRows = [ret({})];
    const r = await buildReturnsAudit("t", { from: "2026-09-01", to: "2026-09-30" });
    expect(r.source).toBe("sql");
    expect(r.rows).toHaveLength(1);
    expect(r.rows[0]).toMatchObject({ returnId: "A9", cashier: "cash1", customer: "Meena", amount: 500, refundMode: "cash", level: "LOW" });
    expect(r.summary.returnRatePct).toBe(10);
  });

  it("flags a cash refund above the limit", async () => {
    returnRows = [ret({ amount: 2500, cash: 2500 })];
    const r = await buildReturnsAudit("t", { from: "2026-09-01", to: "2026-09-30" });
    expect(r.rows[0].flags).toContain("CASH_ABOVE_LIMIT");
    expect(r.rows[0].level).toBe("HIGH");
  });

  it("flags a cashier who made three returns the same day", async () => {
    returnRows = [1, 2, 3].map((i) => ret({ sysid: `R${i}`, billno: `A${i}`, dt: `2026-09-20T1${i}:00:00`, cus: `Cust ${i}` }));
    const r = await buildReturnsAudit("t", { from: "2026-09-01", to: "2026-09-30" });
    expect(r.rows.every((x) => x.flags.includes("CASHIER_BURST"))).toBe(true);
  });

  it("flags refunds that add up to more than the source bill (ERP-made returns)", async () => {
    returnRows = [ret({ amount: 900, cash: 0, bank: 900 })];
    linkRows = [{ retSysid: "R1", srcSysid: "S1" }];
    headRows = [{ sysid: "S1", billno: "A1", total: 1000 }];
    sumRows = [{ src: "S1", value: 1200 }];
    const r = await buildReturnsAudit("t", { from: "2026-09-01", to: "2026-09-30" });
    expect(r.rows[0].bill).toBe("A1");
    expect(r.rows[0].flags).toContain("REFUND_EXCEEDS_BILL");
    expect(r.rows[0].level).toBe("CRITICAL");
    expect(r.shopReturnRows).toBe(0);
  });

  it("older returns have no source bill: they are counted as unlinked, never as exceeding it", async () => {
    returnRows = [ret({})];
    const r = await buildReturnsAudit("t", { from: "2026-09-01", to: "2026-09-30" });
    expect(r.rows[0].bill).toBeNull();
    expect(r.shopReturnRows).toBe(1);
  });

  it("works before migration 004 is applied (no allocation table)", async () => {
    allocationTableMissing = true;
    returnRows = [ret({})];
    const r = await buildReturnsAudit("t", { from: "2026-09-01", to: "2026-09-30" });
    expect(r.rows).toHaveLength(1);
    expect(r.shopReturnRows).toBe(1);
  });

  it("only lists returns inside the period; earlier ones feed the repeat-customer check", async () => {
    returnRows = [ret({ sysid: "R0", billno: "A0", dt: "2026-08-25T10:00:00" }), ret({})];
    const r = await buildReturnsAudit("t", { from: "2026-09-01", to: "2026-09-30" });
    expect(r.rows).toHaveLength(1);
    expect(r.rows[0].flags).toContain("REPEAT_CUSTOMER");
  });
});
