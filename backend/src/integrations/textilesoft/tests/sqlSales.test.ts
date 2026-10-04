import { describe, it, expect, beforeEach, jest } from "@jest/globals";

type Row = Record<string, unknown>;
let db: Record<string, Row[]> = {};
const writes: string[] = [];
const eq = (a: unknown, b: unknown) =>
  String(a ?? "").trim().toLowerCase() === String(b ?? "").trim().toLowerCase();

const num = (v: unknown) => (Number.isFinite(Number(v)) && String(v ?? "").trim() !== "" ? Number(v) : 0);
function run(text: string, p: Record<string, unknown> = {}): Row[] {
  // Counter billed on today by someone else (Textilesoft's desktop)?
  if (/ORDER BY \[datetime\] DESC/.test(text) && /<> @u/.test(text))
    return (db.sales2 ?? [])
      .filter((r) => eq(r.systemname, p.c) && eq(r.date, p.d) && !eq(r.UserID, p.u))
      .map((r) => ({ mode: r.mode, t: "11:02", u: r.UserID }));
  // A cancelled barcode: its purchase line has STATUS = '1'.
  if (/FROM dbo\.\[purentrydetails\] WHERE barcode = @b AND STATUS = '1'/.test(text))
    return (db.purentrydetails ?? []).filter((r) => eq(r.barcode, p.b) && String(r.STATUS ?? "") === "1").map(() => ({ x: 1 }));
  if (/SELECT \* FROM dbo\.\[gstgroup\]/.test(text)) return db.gstgroup ?? [];
  // Returned item: every live sale line of the barcode (oldest first) with its bill's totals.
  if (/FROM dbo\.\[salsntry\] l LEFT JOIN dbo\.\[sales2\] h/.test(text)) {
    return (db.salsntry ?? [])
      .filter((x) => eq(x.barcode, p.b) && String(x.status ?? "") !== "1" && num(x.qty) > 0)
      .map((l) => {
        const h = (db.sales2 ?? []).find((x) => eq(x.sysidandbill, l.systemidbill));
        const pos = (db.salsntry ?? []).filter((x) => eq(x.systemidbill, l.systemidbill) && num(x.qty) > 0);
        const billNet = pos.reduce((a, x) => a + (num(x.net_amount) || num(x.amount)), 0);
        const billPaid = pos.reduce((a, x) => a + num(x.gstcrossamt) + num(x.tax), 0);
        return { ...l, mode: h?.mode, bill_less: h?.bill_less, bill_disc: h?.bill_disc, billNet, billPaid };
      });
  }
  // Schema guard in sqlPosWriter.erpTableExists: the ERP tables exist with every required column unless a
  // test sets db.erpMissing (see "absent ERP storage" below).
  if (/SELECT OBJECT_ID\(@n\) AS id/.test(text)) {
    const name = String(p.n).replace(/^erp\./, "");
    return [{ id: (db.erpMissing as unknown as string[] | undefined)?.includes(name) ? null : 1 }];
  }
  if (/SELECT TOP 1 1 AS ok FROM sys\.indexes/.test(text))
    return (db as Record<string, unknown>).erpUniqueMissing ? [] : [{ ok: 1 }];
  if (/SELECT name FROM sys\.columns WHERE object_id = OBJECT_ID\(@n\)/.test(text)) {
    return String(p.n) === "erp.sales_idempotency"
      ? ["scope", "idempotency_key", "request_hash", "sysidandbill", "billno", "mode", "counter_name", "total_amount", "bill_datetime"].map((name) => ({ name }))
      : ["source_sysidandbill", "source_sale_line_no", "return_sysidandbill", "return_sale_line_no", "barcode", "quantity", "paid_amount", "gst_rate"].map((name) => ({ name }));
  }
  if (/FROM erp\.sales_return_allocation WHERE barcode=@b/.test(text)) {
    return (db.sales_return_allocation ?? [])
      .filter((x) => eq(x.barcode, p.b))
      .map((x) => ({ source_sale_line_no: x.source_sale_line_no, returned_qty: x.returned_qty ?? x.quantity ?? 0 }));
  }
  if (/FROM erp\.sales_idempotency WITH \(UPDLOCK, HOLDLOCK\)/.test(text)) {
    return (db.sales_idempotency ?? []).filter((r) => eq(r.scope, p.scope) && eq(r.idempotency_key, p.key));
  }
  if (/SUM\(CASE WHEN q > 0/.test(text)) {
    const qs = (db.salsntry ?? []).filter((x) => eq(x.barcode, p.b) && String(x.status ?? "") !== "1").map((x) => num(x.qty));
    return [{ sold: qs.filter((q) => q > 0).reduce((a, q) => a + q, 0), back: qs.filter((q) => q < 0).reduce((a, q) => a - q, 0) }];
  }
  if (/LEFT JOIN dbo\.\[newproduct\] n ON/.test(text)) {
    const d = (db.purentrydetails ?? []).filter((r) => eq(r.barcode, p.b)).slice(-1)[0];
    if (!d) return [];
    const n = (db.newproduct ?? []).find((r) => eq(r.code, d.code));
    return [{ pg: n?.gst_group ?? null, dg: d.pro_group_name ?? null }];
  }
  // Stock of one barcode: received - sold - returned.
  if (/AS received/.test(text)) {
    const sum = (rows: Row[] | undefined, f: (r: Row) => number) => (rows ?? []).reduce((a, r) => a + f(r), 0);
    return [
      {
        received: sum((db.purentrydetails ?? []).filter((r) => eq(r.barcode, p.b) && r.STATUS == null), (r) => num(r.qty) + num(r.fqty)),
        sold: sum((db.salsntry ?? []).filter((r) => eq(r.barcode, p.b) && String(r.status ?? "") !== "1"), (r) => num(r.qty)),
        returned:
          sum((db.PurchaseReturnDetails ?? []).filter((r) => eq(r.barcode, p.b)), (r) => num(r.qty)) +
          sum((db.purretrun ?? []).filter((r) => eq(r.barcode, p.b)), (r) => num(r.qty)),
      },
    ];
  }
  if (/FROM dbo\.\[countername\]/.test(text)) {
    if (p.c) {
      return (db.countername ?? []).filter((r) => eq(r.counter_name, p.c));
    }
    return db.countername ?? [];
  }
  if (/FROM dbo\.\[bill_option\]/.test(text)) {
    return db.bill_option ?? [];
  }
  if (/SELECT CONVERT\(varchar\(10\), CAST\(GETDATE\(\) AS date\), 23\) AS d/.test(text)) {
    return [{ d: "2026-09-30", yymmdd: "260930", dt: new Date("2026-09-30T10:15:00") }];
  }
  if (/SELECT CONVERT\(varchar\(19\), @dt, 126\) AS iso/.test(text)) {
    return [{ iso: "2026-09-30T10:15:00" }];
  }
  if (/SELECT ISNULL\(MAX\(billno\), 0\) \+ 1 AS n FROM dbo\.\[sales2\]/.test(text)) {
    const bills = (db.sales2 ?? [])
      .filter((r) => eq(r.systemname, p.c) && eq(r.date, p.d))
      .map((r) => Number(r.billno || 0));
    return [{ n: bills.length ? Math.max(...bills) + 1 : 101 }];
  }
  if (/SELECT TOP 1 1 AS x FROM dbo\.\[sales2\] WITH \(UPDLOCK, HOLDLOCK\) WHERE sysidandbill = @k/.test(text)) {
    return (db.sales2 ?? []).filter((r) => eq(r.sysidandbill, p.k)).map(() => ({ x: 1 }));
  }
  if (/SELECT TOP 1 cmny_bill.*FROM dbo\.\[salsntry\]/.test(text)) {
    return db.salsntry?.length ? [db.salsntry[db.salsntry.length - 1]] : [];
  }
  if (/SELECT ISNULL\(MAX\(\[No\]\), 0\) \+ 1 AS n FROM dbo\.\[(\w+)\]/.test(text)) {
    const [, tbl] = text.match(/FROM dbo\.\[(\w+)\]/)!;
    return [{ n: (db[tbl]?.length ?? 0) + 1 }];
  }
  const insertMatch = text.match(/INSERT INTO (?:[A-Za-z0-9_]+\.)?\[?(\w+)\]?(?:\s*\(([^)]+)\))?\s*VALUES\s*\(([^)]+)\)/);
  if (insertMatch) {
    const [, tbl, colsStr, valsStr] = insertMatch;
    writes.push(`insert ${tbl}`);
    const cols = (colsStr ?? "").split(",").map((c) => c.trim().replace(/^\[|\]$/g, "")).filter(Boolean);
    const vals = valsStr.split(",").map((v) => v.trim().replace(/^@/, ""));
    const row: Row = { ID: (db[tbl]?.length ?? 0) + 1 };
    if (cols.length) {
      cols.forEach((col, i) => {
        const paramKey = vals[i];
        row[col] = p[paramKey];
      });
    } else {
      vals.forEach((paramKey) => {
        row[paramKey] = p[paramKey];
      });
    }
    (db[tbl] ??= []).push(row);
    return [];
  }
  if (/FROM dbo\.\[sales2\] AS s WHERE s\.\[sysidandbill\] = @k/.test(text)) {
    const head = (db.sales2 ?? []).find((h) => eq(h.sysidandbill, p.k));
    if (!head) return [];
    return [{
      no: head.No || 1,
      billno: head.billno,
      mode: head.mode,
      d: head.date,
      dt: head.datetime ? new Date(head.datetime as string).toISOString().slice(0, 19) : "2026-09-30T10:15:00",
      cusName: head.cus_name,
      phone: head.mbl_no,
      city: "",
      counter: head.countername,
      sysname: head.systemname,
      userId: head.UserID,
      sysid: head.sysidandbill,
      qty: head.tot_qty,
      total: head.tot_netamnt,
      credit: head.s_credit_amt,
      cash: head.s_recevied_cashamt,
      card: head.s_card_amt,
      gpay: head.s_googlepay,
      billDiscount: head.bill_disc,
      billLess: head.bill_less,
      roundOff: 0,
    }];
  }
  if (/FROM dbo\.\[salsntry\] AS l WHERE l\.\[systemidbill\] = @k/.test(text)) {
    return (db.salsntry ?? [])
      .filter((l) => eq(l.systemidbill, p.k))
      .map((l) => ({
        name: l.p_name,
        barcode: l.barcode,
        hsn: l.hsncode,
        gst: l.hdngst,
        qty: l.qty,
        rate: l.rate,
        pdis: 0,
        less: l.less,
        tax: l.tax,
        cgst: l.cgst,
        sgst: l.sgst,
        net: l.net_amount,
      }));
  }
  if (/FROM dbo\.\[sales2\] AS s WHERE s\.\[status\] <> '1'/.test(text)) {
    return (db.sales2 ?? [])
      .filter((h) => h.status !== "1")
      .map((head) => ({
        no: head.No || 1,
        billno: head.billno,
        mode: head.mode,
        d: head.date,
        dt: head.datetime ? new Date(head.datetime as string).toISOString().slice(0, 19) : "2026-09-30T10:15:00",
        cusName: head.cus_name,
        phone: head.mbl_no,
        city: "",
        counter: head.countername,
        sysname: head.systemname,
        userId: head.UserID,
        sysid: head.sysidandbill,
        qty: head.tot_qty,
        total: head.tot_netamnt,
        credit: head.s_credit_amt,
        cash: head.s_recevied_cashamt,
        card: head.s_card_amt,
        gpay: head.s_googlepay,
        billLess: head.bill_less,
        roundOff: 0,
      }));
  }
  throw new Error("unexpected query: " + text);
}

class FakeRequest {
  params: Record<string, unknown> = {};
  constructor(_tx: unknown) {}
  input(k: string, v: unknown) {
    this.params[k] = v;
    return this;
  }
  async query(sqlText: string) {
    return { recordset: run(sqlText, this.params) };
  }
}

class FakeTransaction {
  constructor(_pool: unknown) {}
  async begin() {}
  async commit() {}
  async rollback() {}
}

const mockPool = {
  request: () => new FakeRequest(null),
};

jest.unstable_mockModule("../sqlItemSource.js", () => ({
  getPool: async () => mockPool,
}));

jest.unstable_mockModule("../sqlDbAccess.js", () => ({
  healDbAccess: async () => false,
}));

jest.unstable_mockModule("../sqlWrite.js", () => ({
  SqlWriteError: class SqlWriteError extends Error {
    constructor(msg: string, public statusCode: number, public code?: string) {
      super(msg);
    }
  },
  sqlWriter: async () => ({
    mssql: {
      Request: FakeRequest,
      Transaction: FakeTransaction,
    },
    pool: mockPool,
    database: "TextilesoftDB",
  }),
  tableColumns: async (_p: unknown, table: string) => {
    if (table === "sales2") {
      return new Set([
        "No", "billno", "mode", "Lmode", "date", "datetime", "sysidandbill",
        "systemname", "countername", "UserID", "cus_name", "mbl_no", "tot_qty",
        "tot_netamnt", "notdislesamt", "totnetsub", "crs_amount", "CM_Amt",
        "upnet", "upsat", "bill_disc", "bill_disc1", "bill_less", "bill_less1", "roundoff", "gst5", "gst12", "gst18", "gst28",
        "tmtr", "pdisamtot", "tot_pdis", "paymenttype", "status", "SBillStatus",
        "s_recevied_cashamt", "s_card_amt", "s_googlepay", "s_credit_amt",
        "s_selfamt", "s_balance_amt"
      ]);
    }
    if (table === "salsntry") {
      return new Set([
        "No", "srl_no", "sls_man", "barcode", "p_name", "PrintNameEng",
        "rate", "qty", "amount", "amt", "less", "dis", "net_amount",
        "pre_bill_amnt", "upnet", "pdis", "pdis_amount", "tax", "cgst", "sgst", "gstcrossamt",
        "hdngst", "gst_group", "hsncode", "hdnunit", "mrp", "upmrp",
        "Sub_Mrp", "c_Mrp", "c_Amt", "upsta", "bil_cl_qty", "EMIAMOUNT",
        "billno", "mode", "Lmode", "date", "SystemDate", "LLDate",
        "datetime", "systemidbill", "systemname", "status", "UserID",
        "cmnyname", "company_name", "cmny_bill", "ProGroupName",
        "count_IDBillno", "company_code", "comp_continu_billno",
        "cmy_wo_continu_billno", "cmy_wo_cont_idbillno"
      ]);
    }
    return new Set();
  },
}));

const posWriter = await import("../sqlPosWriter.js");
const sqlSales = await import("../sqlSales.js");

let testIdempotencySequence = 0;
const writeBill = (input: Record<string, unknown>) => {
  const idempotencyKey = String(input.idempotencyKey ?? "unit-" + ++testIdempotencySequence);
  return posWriter.writePosBillToSql({
    ...input,
    idempotencyKey,
    idempotencyScope: String(input.idempotencyScope ?? "unit-test"),
    requestHash: String(input.requestHash ?? idempotencyKey),
  } as never);
};

beforeEach(() => {
  delete process.env.TEXTILESOFT_SLAB_BASIS;
  writes.length = 0;
  testIdempotencySequence = 0;
  db = {
    countername: [
      { sl_no: "1", counter_name: "SERVER", counter_mode: "A" },
      { sl_no: "2", counter_name: "COUNTER1", counter_mode: "B" },
    ],
    bill_option: [
      { slno: 1, cmny_name: "SHREE SARAVANA STORES", cmny_mode: "DA", sys_name: "SERVER" },
    ],
    sales2: [],
    sales_return_allocation: [],
    sales_idempotency: [],
    purentrydetails: [
      { barcode: "6296211", code: "12", pro_group_name: "GST5", qty: "5", fqty: "0", STATUS: null },
      { barcode: "6296212", code: "13", pro_group_name: "GST5", qty: "1", fqty: "0", STATUS: null },
      { barcode: "7000001", code: "20", pro_group_name: "GST5", qty: "9", fqty: "0", STATUS: null },
      { barcode: "7000002", code: "21", pro_group_name: "", qty: "9", fqty: "0", STATUS: null },
    ],
    newproduct: [
      { code: "12", gst_group: "GST5" },
      { code: "13", gst_group: "GST5" },
      { code: "20", gst_group: "NEWGST18" }, // master moved to the slab group after purchase
    ],
    gstgroup: [
      { gst_name: "GST5", gst: "5" },
      { gst_name: "GST18", gst: "18" },
      { gst_name: "NEWGST18", gst: "5", from_amount: "0", to_amount: "2500", gst1: "18", from_amount1: "2500.01", to_amount1: "999999" },
    ],
    PurchaseReturnDetails: [],
    salsntry: [
      {
        cmny_bill: "DA142425",
        count_IDBillno: 500,
        comp_continu_billno: 600,
        cmy_wo_continu_billno: 700,
      },
    ],
  };
});

describe("Textilesoft Sales Billing (08_sales_billing.md)", () => {
  it("loads billing counters from dbo.countername", async () => {
    const counters = await posWriter.sqlCounters();
    expect(counters).toHaveLength(2);
    expect(counters[0]).toEqual({
      id: "SERVER",
      name: "SERVER",
      mode: "A",
      slNo: "1",
    });
    expect(counters[1]).toEqual({
      id: "COUNTER1",
      name: "COUNTER1",
      mode: "B",
      slNo: "2",
    });
  });

  it("writes a complete sales bill atomically into sales2 and salsntry", async () => {
    const result = await writeBill({
      counter: "SERVER",
      userId: "ERP_USER",
      customerName: "KUMAR",
      phone: "9876543210",
      billDiscount: 10,
      lines: [
        {
          barcode: "6296211",
          name: "COTTON SHIRT",
          unitPriceIncl: 525, // 500 + 5% gst (25)
          qty: 2, // 1050 total incl gst
          gstRate: 5,
          unit: "PCS",
          group: "SHIRTS",
          salesmanCode: "S03",
        },
      ],
      payment: {
        cash: 1000,
        card: 40,
        upi: 0,
        credit: 0,
      },
    });

    expect(result).toBeDefined();
    expect(result.billNo).toBe("A101");
    expect(result.billno).toBe(101);
    expect(result.sysidandbill).toBe("1300926101"); // serial(1) + ddmmyy(300926) + billno(101)
    expect(result.total).toBe(1040); // 1050 - 10 discount

    expect(writes).toContain("insert sales2");
    expect(writes).toContain("insert salsntry");

    // Verify sales2 header
    expect(db.sales2).toHaveLength(1);
    const h = db.sales2[0];
    expect(h.billno).toBe(101);
    expect(h.mode).toBe("A101");
    expect(h.Lmode).toBe("KA101");
    expect(h.sysidandbill).toBe("1300926101");
    expect(h.systemname).toBe("SERVER");
    expect(h.tot_qty).toBe("2");
    expect(h.tot_netamnt).toBe("1040");
    expect(h.bill_disc).toBe("10.00");
    expect(h.bill_less).toBe("0.00");
    expect(h.s_recevied_cashamt).toBe("1000");
    expect(h.s_card_amt).toBe("40");
    // ₹10 bill discount lowers the taxable value: (1050 - 10) incl. 5% -> tax 49.52 (not 50.00).
    expect(h.gst5).toBe("49.52");

    // Verify salsntry lines
    expect(db.salsntry).toHaveLength(2); // previous mock seed + new row
    const line = db.salsntry[1];
    expect(line.barcode).toBe("6296211");
    expect(line.p_name).toBe("COTTON SHIRT");
    expect(line.qty).toBe("2");
    expect(line.amount).toBe("1050.00");
    expect(line.gstcrossamt).toBe("990.48");
    expect(line.tax).toBe("49.52");
    expect(line.cgst).toBe("24.76");
    expect(line.sgst).toBe("24.76");
    expect(line.rate).toBe("495.24");
    expect(line.sls_man).toBe("S03");
    expect(line.cmny_bill).toBe("DA142426");
    expect(line.systemidbill).toBe("1300926101");
  });

  it("reads sales invoice by ID matching sales2 and salsntry", async () => {
    db.sales2 = [
      {
        No: 1,
        billno: 101,
        mode: "A101",
        date: "2026-09-30",
        datetime: "2026-09-30T10:15:00",
        sysidandbill: "1300926101",
        systemname: "SERVER",
        countername: "SERVER",
        UserID: "ERP",
        cus_name: "KUMAR",
        mbl_no: "9876543210",
        tot_qty: "2",
        tot_netamnt: "1040",
        bill_disc: "10.00",
        bill_less: "0.00",
        s_recevied_cashamt: "1000",
        s_card_amt: "40",
        s_googlepay: "0",
        s_credit_amt: "0",
        status: "0",
      },
    ];
    db.salsntry = [
      {
        systemidbill: "1300926101",
        barcode: "6296211",
        p_name: "COTTON SHIRT",
        hsncode: "6205",
        hdngst: "5",
        qty: "2",
        rate: "500",
        less: "0",
        tax: "50",
        cgst: "25",
        sgst: "25",
        net_amount: "1050",
      },
    ];

    const inv = await sqlSales.sqlInvoiceById("sql:1300926101");
    expect(inv).toBeDefined();
    expect(inv?.invoiceNo).toBe("A101");
    expect(inv?.customer.name).toBe("KUMAR");
    expect(inv?.customer.phone).toBe("9876543210");
    expect(inv?.paymentStatus).toBe("paid");
    expect(inv?.paymentMethod).toBe("split"); // cash 1000 + card 40
    expect(inv?.totalAmount).toBe(1040);
    expect(inv?.discount).toBe(10);
    expect(inv?.items).toHaveLength(1);
    expect(inv?.items[0].name).toBe("COTTON SHIRT");
    expect(inv?.items[0].quantity).toBe(2);
    expect(inv?.items[0].price).toBe(500);
    expect(inv?.items[0].cgst).toBe(25);
    expect(inv?.items[0].sgst).toBe(25);
  });

  it("lists active sales invoices excluding void/cancelled bills", async () => {
    db.sales2 = [
      {
        No: 1,
        billno: 101,
        mode: "A101",
        date: "2026-09-30",
        sysidandbill: "1300926101",
        cus_name: "KUMAR",
        tot_qty: "2",
        tot_netamnt: "1040",
        status: "0", // live bill
      },
      {
        No: 2,
        billno: 102,
        mode: "A102",
        date: "2026-09-30",
        sysidandbill: "1300926102",
        cus_name: "CANCELLED BILL",
        tot_qty: "1",
        tot_netamnt: "500",
        status: "1", // cancelled bill
      },
    ];

    const list = await sqlSales.sqlInvoiceList();
    expect(list).toHaveLength(1);
    expect(list[0].invoiceNo).toBe("A101");
  });
});

describe("POS bill checks inside the write (#5 stock, #7 counter)", () => {
  const bill = (over: Record<string, unknown> = {}) =>
    writeBill({
      counter: "SERVER",
      userId: "ERP",
      billDiscount: 0,
      lines: [{ barcode: "6296211", name: "COTTON SHIRT", unitPriceIncl: 525, qty: 2, gstRate: 5 }],
      payment: { cash: 1050, card: 0, upi: 0, credit: 0 },
      ...over,
    } as never);

  beforeEach(() => {
    delete process.env.TEXTILESOFT_POS_ALLOW_NEGATIVE_STOCK;
    delete process.env.TEXTILESOFT_POS_SHARED_COUNTERS;
    db.sales_idempotency = [];
    db.sales_return_allocation = [];
  });

  it("previews with server discount and rounding rules without inserting a bill", async () => {
    const result = await bill({ billDiscount: 100, previewOnly: true });
    expect(result.preview).toMatchObject({
      total: 950,
      gross: 1050,
      billDiscount: 100,
      roundOff: 0,
      tax: expect.any(Number),
    });
    expect(db.sales2).toHaveLength(0);
    expect(writes).not.toContain("insert sales2");
    expect(writes).not.toContain("insert salsntry");
  });

  it("refuses to write when the total changed after cashier confirmation", async () => {
    await expect(bill({ billDiscount: 100, expectedTotal: 949 })).rejects.toMatchObject({
      statusCode: 409,
      message: expect.stringContaining("changed from the previewed"),
    });
    expect(db.sales2).toHaveLength(0);
    expect(writes).not.toContain("insert sales2");
  });

  it("more than in stock is refused; sold pieces and supplier returns count", async () => {
    db.salsntry.push({ barcode: "6296211", qty: "2" }, { barcode: "6296211", qty: "9", status: "1" /* cancelled */ });
    db.PurchaseReturnDetails = [{ barcode: "6296211", qty: "1" }];
    await expect(bill({ lines: [{ barcode: "6296211", name: "COTTON SHIRT", unitPriceIncl: 525, qty: 3, gstRate: 5 }] })).rejects.toMatchObject({
      statusCode: 409,
      message: "Only 2 of COTTON SHIRT (barcode 6296211) in stock; 3 on the bill.",
    });
    expect(writes).toEqual([]);
    await bill(); // 2 is fine
  });

  it("the same barcode on two lines is added up; a sold-out barcode says so", async () => {
    await expect(
      bill({
        lines: [
          { barcode: "6296211", name: "COTTON SHIRT", unitPriceIncl: 525, qty: 3, gstRate: 5 },
          { barcode: "6296211", name: "COTTON SHIRT", unitPriceIncl: 525, qty: 3, gstRate: 5 },
        ],
      }),
    ).rejects.toThrow(/Only 5 of COTTON SHIRT/);
    db.salsntry.push({ barcode: "6296212", qty: "1" });
    await expect(bill({ lines: [{ barcode: "6296212", name: "JEANS", unitPriceIncl: 999, qty: 1, gstRate: 5 }] })).rejects.toThrow(
      /JEANS \(barcode 6296212\) is out of stock/,
    );
  });

  it("Quick Entry lines (no barcode) aren't stock-checked; the switch turns the check off", async () => {
    await bill({ lines: [{ barcode: "", name: "SAREE", unitPriceIncl: 800, qty: 1, gstRate: 5 }] });
    process.env.TEXTILESOFT_POS_ALLOW_NEGATIVE_STOCK = "on";
    await bill({ lines: [{ barcode: "6296211", name: "COTTON SHIRT", unitPriceIncl: 525, qty: 50, gstRate: 5 }] });
  });

  it("a counter the desktop has billed on today is refused; the ERP's own bills don't count", async () => {
    await bill(); // ERP bill A101 today -- not the desktop
    await bill();
    db.sales2.push({ systemname: "SERVER", date: "2026-09-30", UserID: "USER1", mode: "A95", billno: 95 });
    await expect(bill()).rejects.toMatchObject({
      statusCode: 409,
      message: expect.stringMatching(/Counter SERVER is billing in Textilesoft today \(bill A95 at 11:02 by USER1\)/),
    });
  });

  it("a counter listed in TEXTILESOFT_POS_SHARED_COUNTERS may be shared", async () => {
    db.sales2.push({ systemname: "SERVER", date: "2026-09-30", UserID: "USER1", mode: "A95", billno: 95 });
    process.env.TEXTILESOFT_POS_SHARED_COUNTERS = "server, counter2";
    await expect(bill()).resolves.toMatchObject({ billNo: "A96" });
  });
});

describe("GST from the product's group (#1) and bill discount in the taxable value (#2)", () => {
  const line = (barcode: string, price: number, gstRate = 18, qty = 1, extra: Record<string, unknown> = {}) => ({
    barcode,
    name: `ITEM ${barcode}`,
    unitPriceIncl: price,
    qty,
    gstRate,
    ...extra,
  });
  const bill = (lines: unknown[], billDiscount = 0) =>
    writeBill({ counter: "SERVER", userId: "ERP", billDiscount, lines, payment: { cash: 0, card: 0, upi: 0, credit: 0 } });
  const newLines = () => db.salsntry.slice(1);

  it("the product's group decides the rate, not the till (till said 18%, product is GST5)", async () => {
    await bill([line("6296211", 1050, 18)]);
    expect(newLines()[0]).toMatchObject({ hdngst: "5", gst_group: "GST5", tax: "50.00" });
  });

  it("slab group: by the piece's value without GST; the master's current group beats the purchase's", async () => {
    await bill([line("7000001", 2625), line("7000001", 3000)]);
    const [a, b] = newLines();
    expect(a).toMatchObject({ hdngst: "5", gst_group: "NEWGST18" }); // 2500 ex-GST
    expect(b).toMatchObject({ hdngst: "18", gst_group: "NEWGST18", tax: "457.63" }); // 3000 - 3000/1.18
  });

  it("legacy slab basis uses post-discount inclusive unit prices and preserves the default", async () => {
    await bill([line("7000001", 2600)]);
    expect(newLines()[0]).toMatchObject({ hdngst: "5", gst_group: "NEWGST18" });

    process.env.TEXTILESOFT_SLAB_BASIS = "legacy";
    await bill([line("7000001", 2500), line("7000001", 2501)]);
    const [atBoundary, overBoundary] = newLines().slice(1);
    expect(atBoundary.hdngst).toBe("5");
    expect(overBoundary.hdngst).toBe("18");
    await bill([line("7000001", 2600)], 150);
    const discounted = newLines().slice(3)[0];
    expect(discounted.hdngst).toBe("5"); // 2600 - proportional 150 bill discount = 2450
    expect(Number(db.sales2[2].gst5)).toBeCloseTo(Number(discounted.tax), 2);
    expect(db.sales2[2].bill_disc).toBe("150.00");
  });

  it("legacy slab basis selects on per-unit price and leaves Quick Entry lines at their supplied rate", async () => {
    process.env.TEXTILESOFT_SLAB_BASIS = "legacy";
    await bill([line("7000001", 1300, 18, 2), line("", 2600, 18)]);
    const [slabLine, quickEntry] = newLines();
    expect(slabLine).toMatchObject({ hdngst: "5", amount: "2600.00" });
    expect(quickEntry).toMatchObject({ hdngst: "18" });
  });

  it("no GST group in Textilesoft: the till's rate is used", async () => {
    await bill([line("7000002", 1180, 18)]);
    expect(newLines()[0]).toMatchObject({ hdngst: "18", tax: "180.00" });
  });

  it("GST-exclusive till: the product's own rate is added to the price", async () => {
    await bill([line("6296211", 999, 18, 1, { unitPriceExcl: 1000 })]);
    expect(newLines()[0]).toMatchObject({ hdngst: "5", amount: "1050.00", tax: "50.00" });
  });

  it("bill discount is shared over lines by amount; header GST = sum of line tax; paisa-exact", async () => {
    await bill([line("6296211", 1000, 5, 2), line("7000002", 1180, 18)], 100);
    const [a, b] = newLines();
    // shares: 2000/3180*100 = 62.89, 1180/3180*100 = 37.11
    expect(a).toMatchObject({ amount: "2000.00", tax: "92.24" }); // (2000-62.89) -> 1937.11 incl 5%
    expect(b).toMatchObject({ amount: "1180.00", tax: "174.34" }); // (1180-37.11) -> 1142.89 incl 18%
    const h = db.sales2[0];
    expect(h).toMatchObject({ tot_netamnt: "3080", bill_disc: "100.00", bill_less: "0.00", gst5: "92.24", gst18: "174.34" });
  });
});

describe("exchange / return lines on a POS bill (POS Return mode)", () => {
  // An earlier sale: bill S1 with ₹50 off, 6296211 at 1050 and 6296212 at 450 (both GST5).
  beforeEach(() => {
    db.sales_idempotency = [];
    db.sales_return_allocation = [];
    db.sales2.push({ sysidandbill: "S1", mode: "A7", bill_less: "50.00", systemname: "SERVER", date: "2026-09-20", UserID: "ERP" });
    db.salsntry.push(
      { systemidbill: "S1", barcode: "6296211", p_name: "COTTON SHIRT", qty: "1", amount: "1050.00", hdngst: "5", gst_group: "GST5", status: "0" },
      { systemidbill: "S1", barcode: "6296212", p_name: "JEANS", qty: "1", amount: "450.00", hdngst: "5", gst_group: "GST5", status: "0" },
    );
  });
  const ret = (barcode: string, qty = -1, extra: Record<string, unknown> = {}) => ({ barcode, name: "X", unitPriceIncl: 999, qty, gstRate: 18, ...extra });
  const sell = (barcode: string, price: number, qty = 1) => ({ barcode, name: `ITEM ${barcode}`, unitPriceIncl: price, qty, gstRate: 18 });
  const bill = (lines: unknown[], over: Record<string, unknown> = {}) =>
    writeBill({
      counter: "SERVER",
      userId: "ERP",
      billDiscount: 0,
      lines,
      tenders: { paymentMethod: "cash", paidInFull: true, hasCustomer: false },
      ...over,
    } as never);
  const mine = () => db.salsntry.filter((l) => l.systemidbill === db.sales2[db.sales2.length - 1].sysidandbill);

  it("refunds what was paid (after that bill's discount) at the sale's GST, not the till's price or rate", async () => {
    await bill([ret("6296211"), sell("7000002", 1180)]);
    const back = mine().find((l) => l.barcode === "6296211")!;
    // 1050 - 50 x 1050/1500 = 1015 paid; GST5 of the sale (till said 999 at 18%)
    expect(back).toMatchObject({ qty: "-1", amount: "-1015.00", hdngst: "5", gst_group: "GST5", p_name: "COTTON SHIRT", tax: "-48.33", rate: "966.67" });
    const h = db.sales2[db.sales2.length - 1];
    expect(h).toMatchObject({ tot_netamnt: "165", tot_qty: "1", s_recevied_cashamt: "165" });
  });

  it("legacy slab mode keeps a returned line's original GST rate", async () => {
    process.env.TEXTILESOFT_SLAB_BASIS = "legacy";
    await bill([ret("6296211"), sell("7000002", 1180)]);
    expect(mine().find((l) => l.barcode === "6296211")).toMatchObject({ hdngst: "5", gst_group: "GST5" });
  });

  it("returned pieces are back in stock (can be sold again)", async () => {
    await expect(bill([sell("6296211", 1050, 5)])).rejects.toThrow(/Only 4 of/); // 5 bought, 1 sold
    await bill([ret("6296211")]);
    await bill([sell("6296211", 1050, 5)]);
  });

  it("can't bring back more than was sold, or a barcode twice", async () => {
    await expect(bill([ret("6296211", -2)])).rejects.toThrow(/Only 1 of COTTON SHIRT \(barcode 6296211\) can come back/);
    await bill([ret("6296211")]);
    await expect(bill([ret("6296211")])).rejects.toThrow(/has already been returned/);
  });

  it("a barcode never sold, or a return without a barcode, is refused", async () => {
    await expect(bill([ret("7000001")])).rejects.toThrow(/has never been sold/);
    await expect(bill([ret("")])).rejects.toThrow(/Scan the barcode of the returned/);
  });

  it("the bill discount applies to the new items only", async () => {
    await bill([ret("6296212"), sell("6296211", 1000, 1)], { billDiscount: 100 });
    const [back, out] = [mine().find((l) => l.barcode === "6296212")!, mine().find((l) => l.barcode === "6296211")!];
    expect(back).toMatchObject({ amount: "-435.00" }); // 450 - 50 x 450/1500
    // new item: 1000 - 100 -> 900 incl 5% -> tax 42.86
    expect(out).toMatchObject({ amount: "1000.00", tax: "42.86" });
    expect(db.sales2[db.sales2.length - 1]).toMatchObject({ tot_netamnt: "465", bill_disc: "100.00", bill_less: "0.00" });
  });

  it("returns a discounted sale at its stored transaction amount", async () => {
    await bill([sell("6296211", 1050, 1)], { billDiscount: 100 });
    const sourceBill = db.sales2[db.sales2.length - 1];
    const sourceLine = db.salsntry.find((row) => row.systemidbill === sourceBill.sysidandbill)!;
    expect(sourceLine.net_amount).toBe("950.00");

    await bill([ret("6296211", -1, { returnFromBill: String(sourceBill.mode), returnFromLine: Number(sourceLine.No) })]);
    const returned = mine().find((row) => row.barcode === "6296211")!;
    expect(returned).toMatchObject({ amount: "-950.00", net_amount: "-950.00" });
    expect(db.sales_return_allocation).toHaveLength(1);
    expect(db.sales_return_allocation[0]).toMatchObject({
      source_sysidandbill: sourceBill.sysidandbill,
      source_sale_line_no: sourceLine.No,
      quantity: 1,
      paid_amount: "950.00",
    });
  });

  it("a return worth more than the new items is a refund, paid out of the chosen tender", async () => {
    await bill([ret("6296211")], { tenders: { paymentMethod: "upi", paidInFull: true, hasCustomer: false } });
    expect(db.sales2[db.sales2.length - 1]).toMatchObject({ tot_netamnt: "-1015", s_googlepay: "-1015", s_recevied_cashamt: "0" });
  });
});

describe("product discount, whole-rupee total, cancelled barcode, limits (08 sales billing)", () => {
  const bill = (lines: unknown[], over: Record<string, unknown> = {}) =>
    writeBill({
      counter: "SERVER",
      userId: "ERP",
      billDiscount: 0,
      lines,
      payment: { cash: 0, card: 0, upi: 0, credit: 0 },
      ...over,
    } as never);
  const item = (extra: Record<string, unknown> = {}) => ({ barcode: "6296211", name: "COTTON SHIRT", unitPriceIncl: 1000, qty: 2, gstRate: 5, ...extra });
  const newLines = () => db.salsntry.slice(1);

  it("a product discount % lowers the line's net and its taxable value; the line keeps the gross amount", async () => {
    await bill([item({ pdisPct: 10 })]);
    expect(newLines()[0]).toMatchObject({ amount: "2000.00", pdis: "10", pdis_amount: "200.00", net_amount: "1800.00", gstcrossamt: "1714.28", tax: "85.71", rate: "857.14" });
    expect(db.sales2[0]).toMatchObject({ tot_netamnt: "1800", pdisamtot: "200.00", tot_pdis: "200.00" });
  });

  it("a line without a product discount writes no pdis columns", async () => {
    await bill([item()]);
    expect(newLines()[0].pdis).toBeUndefined();
    expect(newLines()[0]).toMatchObject({ net_amount: "2000.00" });
  });

  it("the bill total is a whole rupee", async () => {
    const r = await bill([item({ unitPriceIncl: 333.33, qty: 3 })]);
    expect(r.total).toBe(1000); // 999.99
    expect(db.sales2[0]).toMatchObject({ tot_netamnt: "1000" });
  });

  it("a cancelled barcode (purchase line STATUS = 1) can't be sold", async () => {
    db.purentrydetails.push({ barcode: "8000001", code: "30", pro_group_name: "GST5", qty: "5", fqty: "0", STATUS: "1" });
    await expect(bill([item({ barcode: "8000001", name: "OLD LOT" })])).rejects.toMatchObject({
      statusCode: 409,
      message: "OLD LOT (barcode 8000001) is a cancelled barcode and can't be sold.",
    });
    expect(writes).toEqual([]);
  });

  it("a discount above the user's limit is refused (nothing written)", async () => {
    const limits = { maxBillDisPct: 20, maxBillLess: 100, maxProdDisPct: 50 };
    await expect(bill([item()], { billDiscount: 500, limits })).rejects.toMatchObject({ statusCode: 400, message: expect.stringMatching(/above the allowed 20%/) });
    await expect(bill([item({ pdisPct: 60 })], { limits })).rejects.toMatchObject({ statusCode: 400, message: expect.stringMatching(/Product discount 60%/) });
    expect(writes).toEqual([]);
    await bill([item({ pdisPct: 50 })], { billDiscount: 0, limits }); // at the limit is fine
  });
});

describe("returns refund what was actually paid for the specific sale line", () => {
  const line = (id: string, barcode: string, o: Record<string, unknown>) => ({ systemidbill: id, barcode, p_name: "SHIRT", qty: "1", hdngst: "5", gst_group: "GST5", status: "0", ...o });
  const ret = (barcode: string, extra: Record<string, unknown> = {}) => ({ barcode, name: "X", unitPriceIncl: 999, qty: -1, gstRate: 18, ...extra });
  const bill = (lines: unknown[]) =>
    writeBill({ counter: "SERVER", userId: "ERP", billDiscount: 0, lines, tenders: { paymentMethod: "cash", paidInFull: true, hasCustomer: false } });
  const mine = () => db.salsntry.filter((l) => l.systemidbill === db.sales2[db.sales2.length - 1].sysidandbill);

  it("uses the line's own paid value (taxable + GST): product discount and bill-discount share are both kept", async () => {
    db.sales2.push({ sysidandbill: "P1", mode: "A8", bill_less: "0", systemname: "SERVER", date: "2026-09-20", UserID: "ERP" });
    // gross 2000, 10% product discount -> net 1800; paid 1800 = 1714.29 + 85.71 (no bill discount on this bill)
    db.salsntry.push(line("P1", "8100001", { amount: "2000.00", net_amount: "1800.00", pdis_amount: "200.00", gstcrossamt: "1714.29", tax: "85.71" }));
    await bill([ret("8100001")]);
    expect(mine().find((l) => l.barcode === "8100001")).toMatchObject({ amount: "-1800.00", tax: "-85.71" });
  });

  it("ERP line with its bill-discount share inside the taxable value: refund = that line's paid amount", async () => {
    db.sales2.push({ sysidandbill: "P2", mode: "A9", bill_less: "100.00", systemname: "SERVER", date: "2026-09-20", UserID: "ERP" });
    // 2 lines 1000 + 1000, bill discount 100 -> 50 each; line 1 paid 950 = 904.76 + 45.24
    db.salsntry.push(
      line("P2", "8100002", { amount: "1000.00", net_amount: "1000.00", gstcrossamt: "904.76", tax: "45.24" }),
      line("P2", "8100003", { amount: "1000.00", net_amount: "1000.00", gstcrossamt: "904.76", tax: "45.24" }),
    );
    await bill([ret("8100002")]);
    expect(mine().find((l) => l.barcode === "8100002")).toMatchObject({ amount: "-950.00" });
  });

  it("same barcode sold at different prices: refuses to guess, takes the bill named", async () => {
    db.sales2.push(
      { sysidandbill: "Q1", mode: "A10", bill_less: "0", systemname: "SERVER", date: "2026-09-01", UserID: "ERP" },
      { sysidandbill: "Q2", mode: "A11", bill_less: "0", systemname: "SERVER", date: "2026-09-05", UserID: "ERP" },
    );
    db.salsntry.push(
      line("Q1", "8100004", { amount: "1000.00", net_amount: "1000.00", gstcrossamt: "952.38", tax: "47.62" }),
      line("Q2", "8100004", { amount: "800.00", net_amount: "800.00", gstcrossamt: "761.90", tax: "38.10" }),
    );
    await expect(bill([ret("8100004")])).rejects.toThrow(/sold at different prices/);
    await bill([ret("8100004", { returnFromBill: "A11" })]);
    expect(mine().find((l) => l.barcode === "8100004")).toMatchObject({ amount: "-800.00" });
  });

  it("lists the bills a barcode was sold on with what was paid per piece (for the till's picker)", async () => {
    db.sales2.push(
      { sysidandbill: "S1", mode: "A20", bill_less: "0", systemname: "SERVER", date: "2026-09-01", UserID: "ERP" },
      { sysidandbill: "S2", mode: "A21", bill_less: "0", systemname: "SERVER", date: "2026-09-05", UserID: "ERP" },
    );
    db.salsntry.push(
      line("S1", "8100009", { amount: "1000.00", net_amount: "1000.00", gstcrossamt: "952.38", tax: "47.62" }),
      line("S2", "8100009", { amount: "800.00", net_amount: "800.00", gstcrossamt: "761.90", tax: "38.10" }),
    );
    const r = await posWriter.listReturnSources("8100009");
    expect(r.open).toBe(2);
    expect(r.sources.map((x) => [x.bill, x.paidEach])).toEqual([["A21", 800], ["A20", 1000]]); // newest first
  });

  it("a bill the item wasn't sold on is refused", async () => {
    db.sales2.push({ sysidandbill: "R1", mode: "A12", bill_less: "0", systemname: "SERVER", date: "2026-09-01", UserID: "ERP" });
    db.salsntry.push(line("R1", "8100005", { amount: "500.00", net_amount: "500.00", gstcrossamt: "476.19", tax: "23.81" }));
    await expect(bill([ret("8100005", { returnFromBill: "Z99" })])).rejects.toThrow(/was not sold on bill Z99/);
  });
});

describe("absent ERP storage fails closed (review 2026-10-04)", () => {
  it("return-source lookup is refused with 503 when erp.sales_return_allocation is missing", async () => {
    // erpTableExists caches its answer for 60s; jump the clock so this test sees its own schema.
    const real = Date.now;
    const spy = jest.spyOn(Date, "now").mockImplementation(() => real() + 10 * 60_000);
    try {
      (db as Record<string, unknown>).erpMissing = ["sales_return_allocation"];
      await expect(posWriter.listReturnSources("8100009")).rejects.toMatchObject({
        statusCode: 503, // the mocked SqlWriteError here carries message + status only
        message: expect.stringMatching(/return allocation is unavailable/i),
      });
    } finally {
      spy.mockRestore();
    }
  });

  it("refuses POS writes when durable idempotency storage is missing", async () => {
    const real = Date.now;
    const spy = jest.spyOn(Date, "now").mockImplementation(() => real() + 10 * 60_000);
    try {
      (db as Record<string, unknown>).erpMissing = ["sales_idempotency"];
      await expect(writeBill({
        counter: "SERVER", userId: "ERP", billDiscount: 0,
        lines: [{ barcode: "6296211", name: "COTTON SHIRT", unitPriceIncl: 525, qty: 1, gstRate: 5 }],
        payment: { cash: 525, card: 0, upi: 0, credit: 0 },
      })).rejects.toMatchObject({ statusCode: 503, code: "SQL_IDEMPOTENCY_UNAVAILABLE" });
      expect(writes).toHaveLength(0);
    } finally {
      spy.mockRestore();
    }
  });

  it("refuses POS writes when the idempotency key has no matching unique database index", async () => {
    const real = Date.now;
    const spy = jest.spyOn(Date, "now").mockImplementation(() => real() + 20 * 60_000);
    try {
      (db as Record<string, unknown>).erpUniqueMissing = true;
      await expect(writeBill({
        counter: "SERVER", userId: "ERP", billDiscount: 0,
        lines: [{ barcode: "6296211", name: "COTTON SHIRT", unitPriceIncl: 525, qty: 1, gstRate: 5 }],
        payment: { cash: 525, card: 0, upi: 0, credit: 0 },
      })).rejects.toMatchObject({ statusCode: 503, code: "SQL_IDEMPOTENCY_UNAVAILABLE" });
      expect(writes).toHaveLength(0);
    } finally {
      spy.mockRestore();
    }
  });
});
