import { describe, it, expect, beforeEach, jest } from "@jest/globals";

type Row = Record<string, unknown>;
let db: Record<string, Row[]> = {};
const writes: string[] = [];
const eq = (a: unknown, b: unknown) =>
  String(a ?? "").trim().toLowerCase() === String(b ?? "").trim().toLowerCase();

class SqlWriteError extends Error {
  constructor(message: string, public statusCode: number, public code?: string) {
    super(message);
  }
}

function run(text: string, p: Record<string, unknown> = {}): Row[] {
  if (/FROM dbo\.\[sales2\] WHERE sysidandbill=@k/.test(text)) {
    return (db.sales2 ?? []).filter((h) => eq(h.sysidandbill, p.k));
  }
  if (/FROM dbo\.\[salsntry\] WHERE systemidbill=@k/.test(text)) {
    return (db.salsntry ?? []).filter((l) => eq(l.systemidbill, p.k));
  }
  if (/SELECT MAX\(TRY_CAST\(SUBSTRING\(mode,2,30\) AS bigint\)\) n FROM dbo\.\[sales2Return\]/.test(text)) {
    const nums = (db.sales2Return ?? [])
      .map((r) => txt(r.mode))
      .filter((m) => m.startsWith("R"))
      .map((m) => Number(m.slice(1)))
      .filter(Number.isFinite);
    return [{ n: nums.length ? Math.max(...nums) : 0 }];
  }
  if (/SELECT ISNULL\(SUM\(TRY_CAST\(qty AS float\)\),0\) q FROM dbo\.\[salbillReturns\] WHERE barcode=@b AND cmy_bill=@c/.test(text)) {
    const sum = (db.salbillReturns ?? [])
      .filter((l) => eq(l.barcode, p.b) && eq(l.cmy_bill, p.c))
      .reduce((s, l) => s + Number(l.qty || 0), 0);
    return [{ q: sum }];
  }
  if (/FROM dbo\.\[sales2Return\] WHERE sysidandbill=@k/.test(text)) {
    return (db.sales2Return ?? []).filter((h) => eq(h.sysidandbill, p.k));
  }
  if (/FROM dbo\.\[salbillReturns\] WHERE billno=@b/.test(text)) {
    return (db.salbillReturns ?? []).filter((l) => eq(l.billno, p.b));
  }
  if (/SELECT sysidandbill,mode,billno,date,cus_name,mbl_no,tot_qty,tot_netamnt,UserID,returnStatus FROM dbo\.\[sales2Return\]/.test(text)) {
    return db.sales2Return ?? [];
  }
  throw new Error("unexpected query: " + text);
}

const txt = (v: unknown) => String(v ?? "").trim();

const tx = {
  query: async (t: string, p?: Record<string, unknown>) => run(t, p),
  insert: async (t: string, row: Row) => {
    writes.push(`insert ${t}`);
    (db[t] ??= []).push({ ...row, ID: (db[t]?.length ?? 0) + 1 });
  },
  update: async () => 1,
  remove: async (t: string, filter: Row) => {
    writes.push(`remove ${t}`);
    const rows = db[t] ?? [];
    const before = rows.length;
    db[t] = rows.filter((r) => !Object.entries(filter).every(([k, v]) => eq(r[k], v)));
    return before - db[t].length;
  },
  nextNumber: async () => 1,
};

jest.unstable_mockModule("../sqlWrite.js", () => ({
  SqlWriteError,
  txt,
  tsDate: () => "30/09/2026",
  sqlRead: async (t: string, p?: Record<string, unknown>) => run(t, p),
  withSqlTransaction: async (_l: string, fn: (t: typeof tx) => unknown) => fn(tx),
}));

const srModule = await import("../sqlSalesReturn.js");

beforeEach(() => {
  writes.length = 0;
  db = {
    sales2: [
      {
        No: 1,
        billno: 101,
        mode: "A101",
        sysidandbill: "1300926101",
        systemname: "SERVER",
        countername: "SERVER",
        cus_name: "KUMAR",
        mbl_no: "9876543210",
        cmny_bill: "DA142426",
      },
    ],
    salsntry: [
      {
        systemidbill: "1300926101",
        barcode: "6296211",
        p_name: "COTTON SHIRT",
        qty: "2",
        mtr: "0",
        rate: "500.00",
        tax: "50.00",
        hdngst: "5",
        net_amount: "1050.00",
        cmny_bill: "DA142426",
        cmy_name: "SHREE SARAVANA STORES",
      },
    ],
    sales2Return: [],
    salbillReturns: [],
    salsntryReturn: [],
  };
});

describe("Textilesoft Sales Return flow (09_sales_return.md)", () => {
  it("creates a sales return writing to sales2Return, salbillReturns and salsntryReturn", async () => {
    const ret = await srModule.createSqlSalesReturnLegacy({
      invoiceId: "sql:1300926101",
      userId: "ERP_USER",
      refundMethod: "CASH",
      items: [
        {
          barcode: "6296211",
          productName: "COTTON SHIRT",
          returnedQty: 1, // return 1 of 2
          rate: 500,
          taxPercent: 5,
        },
      ],
    });

    expect(ret).toBeDefined();
    expect(ret?.returnId).toBe("R1");
    expect(ret?.customerName).toBe("KUMAR");
    expect(ret?.totalReturnAmount).toBe(525); // 500 + 5% gst (25) = 525
    expect(ret?.items).toHaveLength(1);
    expect(ret?.items[0].barcode).toBe("6296211");
    expect(ret?.items[0].returnedQty).toBe(1);
    expect(ret?.items[0].lineTotal).toBe(525);

    // Verify all 3 tables written
    expect(writes).toContain("insert sales2Return");
    expect(writes).toContain("insert salbillReturns");
    expect(writes).toContain("insert salsntryReturn");

    // Header check
    const header = db.sales2Return[0];
    expect(header.mode).toBe("R1");
    expect(header.billno).toBe("1");
    expect(header.returnStatus).toBe("1");
    expect(header.tot_qty).toBe("1");
    expect(header.tot_netamnt).toBe("525");
    expect(header.gst5).toBe("25");

    // Lines check
    const line = db.salbillReturns[0];
    expect(line.barcode).toBe("6296211");
    expect(line.qty).toBe("1");
    expect(line.netamt).toBe("525");
    expect(line.gst).toBe("25");
    expect(line.cgst).toBe("12.5");
    expect(line.sgst).toBe("12.5");
  });

  it("enforces return quantity limit based on unreturned balance", async () => {
    // Already returned 1 piece previously
    db.salbillReturns = [
      {
        barcode: "6296211",
        cmy_bill: "DA142426",
        qty: "1",
      },
    ];

    // Attempting to return 2 pieces when only 1 is left (total sold was 2)
    await expect(
      srModule.createSqlSalesReturnLegacy({
        invoiceId: "sql:1300926101",
        userId: "ERP_USER",
        items: [
          {
            barcode: "6296211",
            returnedQty: 2,
          },
        ],
      }),
    ).rejects.toThrow("Cannot return 2 of COTTON SHIRT. Remaining returnable quantity is 1.");
  });

  it("lists sales returns from sales2Return", async () => {
    db.sales2Return = [
      {
        sysidandbill: "R1-1727690000000",
        mode: "R1",
        billno: "1",
        date: "30/09/2026",
        cus_name: "KUMAR",
        mbl_no: "9876543210",
        tot_qty: "1",
        tot_netamnt: "525",
        returnStatus: "1",
      },
    ];

    const list = await srModule.listSqlSalesReturns();
    expect(list).toHaveLength(1);
    expect(list[0].returnId).toBe("R1");
    expect(list[0].customerName).toBe("KUMAR");
    expect(list[0].totalReturnAmount).toBe(525);
  });

  it("deletes a sales return removing from all 3 return tables", async () => {
    db.sales2Return = [
      {
        sysidandbill: "R1-1727690000000",
        mode: "R1",
        billno: "1",
      },
    ];
    db.salbillReturns = [
      {
        billno: "1",
        barcode: "6296211",
      },
    ];
    db.salsntryReturn = [
      {
        billno: "1",
        barcode: "6296211",
      },
    ];

    await srModule.deleteSqlSalesReturn("sql:sr:R1-1727690000000");

    expect(db.sales2Return).toHaveLength(0);
    expect(db.salbillReturns).toHaveLength(0);
    expect(db.salsntryReturn).toHaveLength(0);

    expect(writes).toContain("remove salsntryReturn");
    expect(writes).toContain("remove salbillReturns");
    expect(writes).toContain("remove sales2Return");
  });
});

describe("SQL mode: returns go through the POS (Return mode), not these tables", () => {
  it("createSqlSalesReturn is refused with a pointer to the POS", async () => {
    await expect(
      srModule.createSqlSalesReturn({ invoiceId: "sql:1", items: [{ barcode: "1", returnedQty: 1 }] }),
    ).rejects.toMatchObject({ statusCode: 400, message: expect.stringContaining("switch to Return mode") });
  });
});
