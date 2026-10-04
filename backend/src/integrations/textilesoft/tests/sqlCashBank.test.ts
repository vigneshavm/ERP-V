import { describe, it, expect, jest, beforeEach } from "@jest/globals";

// Cash & Bank screen: read-only from CashInOutEntry, closepattycash/openpattycash and BankTransEntry.
type Row = Record<string, unknown>;
let tables: Record<string, Row[] | Error> = {};
const queries: string[] = [];

jest.unstable_mockModule("../sqlItemSource.js", () => ({
  getPool: async () => ({
    request: () => ({
      input() {},
      query: async (text: string) => {
        queries.push(text);
        const t = /dbo\.\[(CashInOutEntry|closepattycash|openpattycash|BankTransEntry|sales2)\]/.exec(text)?.[1];
        const v = t ? tables[t] : undefined;
        if (v instanceof Error) throw v;
        return { recordset: v ?? [] };
      },
    }),
  }),
}));
jest.unstable_mockModule("../sqlShopClock.js", () => ({ shopAsOf: async () => "2026-09-30" }));

const { sqlCashBank } = await import("../sqlCashBank.js");
const range = { from: "2026-09-01", to: "2026-09-30" };

beforeEach(() => {
  tables = {};
  queries.length = 0;
});

describe("Cash & Bank (existing Textilesoft tables only)", () => {
  it("totals cash in/out per day from CashInOutEntry", async () => {
    tables.CashInOutEntry = [
      { d: "2026-09-02", counter: "C1", cashier: "A", party: "Tea", bill: "5", cin: 0, cout: 120 },
      { d: "2026-09-02", counter: "C1", cashier: "A", party: "Float", bill: "6", cin: 500, cout: 0 },
      { d: "2026-09-03", counter: "C1", cashier: "B", party: "Tea", bill: "7", cin: 0, cout: 80 },
    ];
    const r = await sqlCashBank(range);
    expect(r.source).toBe("sql");
    expect(r.cash).toMatchObject({ available: true, in: 500, out: 200, net: 300 });
    expect((r.cash as any).byDay).toEqual([
      { date: "2026-09-02", in: 500, out: 120, entries: 2 },
      { date: "2026-09-03", in: 0, out: 80, entries: 1 },
    ]);
  });

  it("lists day closes with the recorded columns and counts days", async () => {
    tables.closepattycash = [
      { d: "2026-09-02", counter: "C1", cashier: "A", slno: "1", bills: 12, net: 9000, cashin: 500, cashout: 120, opening: 2000, drawn: 8000, card: 3000, credit: 500, gpay: 1500, selfpay: 0, counted: 8100, status: "CP" },
    ];
    tables.openpattycash = [{ d: "2026-09-02", counter: "C1", cashier: "A", opened: 2000 }];
    const r = await sqlCashBank(range);
    const dc = r.dayClose as any;
    expect(dc.available).toBe(true);
    expect(dc.rows[0]).toMatchObject({ bills: 12, sales: 9000, card: 3000, upi: 1500, credit: 500, opening: 2000, counted: 8100 });
    expect(dc.rows[0]).not.toHaveProperty("cash");
    expect(dc.totals).toMatchObject({ days: 1, sales: 9000, card: 3000 });
    expect(dc.openings).toHaveLength(1);
  });

  it("summarises bank transactions per bank", async () => {
    tables.BankTransEntry = [
      { d: "2026-09-05", tranNo: "9", code: "1", name: "Deposit", bank: "SBI", account: "123", mode: "CASH", remarks: "", counter: "C1", tin: 10000, tout: 0, bal: 10000 },
      { d: "2026-09-06", tranNo: "10", code: "2", name: "Rent", bank: "SBI", account: "123", mode: "NEFT", remarks: "", counter: "C1", tin: 0, tout: 4000, bal: 6000 },
      { d: "2026-09-06", tranNo: "11", code: "1", name: "Deposit", bank: "", account: "", mode: "CASH", remarks: "", counter: "C1", tin: 500, tout: 0, bal: 500 },
    ];
    const bank = (await sqlCashBank(range)).bank as any;
    expect(bank).toMatchObject({ available: true, in: 10500, out: 4000, net: 6500 });
    expect(bank.byBank[0]).toEqual({ bank: "SBI", in: 10000, out: 4000, entries: 2, net: 6000 });
    expect(bank.byBank.some((b: any) => b.bank === "Unnamed bank")).toBe(true);
  });

  it("a table missing in this installation is reported, not fatal", async () => {
    tables.BankTransEntry = new Error("Invalid object name 'dbo.BankTransEntry'");
    const r = await sqlCashBank(range);
    expect((r.bank as any).available).toBe(false);
    expect((r.cash as any).available).toBe(true);
  });

  it("daily takings come from live sales2 bills split by payment type", async () => {
    tables.sales2 = [
      { d: "2026-09-03", bills: 2, total: 1500, cash: 900, card: 300, upi: 200, credit: 100, selfpay: 0 },
      { d: "2026-09-02", bills: 1, total: 500, cash: 500, card: 0, upi: 0, credit: 0, selfpay: 0 },
    ];
    const r = await sqlCashBank(range);
    expect(r.takings).toMatchObject({ available: true, totals: { bills: 3, total: 2000, cash: 1400, card: 300, upi: 200, credit: 100 } });
    expect(queries.find((q) => q.includes("dbo.[sales2]"))).toContain("<> '1'");
  });

  it("only reads: no write statements are sent", async () => {
    await sqlCashBank(range);
    expect(queries.length).toBeGreaterThan(0);
    expect(queries.every((q) => !/\b(INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)\b/i.test(q))).toBe(true);
  });
});
