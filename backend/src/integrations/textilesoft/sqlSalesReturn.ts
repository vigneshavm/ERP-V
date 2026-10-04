/** SQL-backed sales-return adapter. Uses sales2Return + salbillReturns + salsntryReturn. */
import {
  sqlRead,
  withSqlTransaction,
  SqlWriteError,
  txt,
  tsDate,
  type Row,
} from "./sqlWrite.js";
const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const r2 = (n: number) => Math.round(n * 100) / 100;
export function isSqlSalesReturnId(id: unknown): id is string {
  return typeof id === "string" && id.startsWith("sql:sr:");
}
const key = (id: string) => id.replace(/^sql:sr:/, "");
/**
 * Not used in SQL mode: this shop's Textilesoft records customer returns as exchange lines (negative qty) on
 * a sale bill in sales2 / salsntry, never in sales2Return / salbillReturns / salsntryReturn (all empty). Returns
 * written here would never come back into stock and the sales / GST reports wouldn't deduct them. The ERP
 * does returns as exchange lines on a POS bill instead (POS Return mode -> sqlPosWriter.returnLine).
 */
export async function createSqlSalesReturn(input: Row) {
  void input;
  throw new SqlWriteError(
    "In shop-database mode, customer returns are done on the POS: switch to Return mode, scan the returned item, and finish the bill (an exchange, or a refund when nothing new is bought).",
    400,
    "SALES_RETURN_USE_POS",
  );
}

/**
 * The previous implementation, kept for reference until the POS exchange flow has been used for a while.
 * NOT reachable from any route (createSqlSalesReturn refuses). It refunds at the entered/original rate with no
 * bill discount, so it must not be re-enabled: refunds belong in sqlPosWriter.returnLine (what was paid for the
 * specific sale line).
 */
export async function createSqlSalesReturnLegacy(input: Row) {
  const invoice = txt(input.invoiceId).replace(/^sql:/, "");
  if (!invoice) throw new SqlWriteError("Select the original invoice.", 400);
  const items = Array.isArray(input.items) ? input.items : [];
  if (!items.length)
    throw new SqlWriteError("Select at least one item to return.", 400);
  return withSqlTransaction("Saving sales return", async (tx) => {
    const [head] = await tx.query(
      "SELECT TOP 1 * FROM dbo.[sales2] WHERE sysidandbill=@k ORDER BY No DESC",
      { k: invoice },
    );
    if (!head)
      throw new SqlWriteError(
        "Original sales invoice not found in Textilesoft.",
        404,
      );
    const sourceLines = await tx.query(
      "SELECT * FROM dbo.[salsntry] WHERE systemidbill=@k ORDER BY No",
      { k: invoice },
    );
    const [mx] = await tx.query(
      "SELECT MAX(TRY_CAST(SUBSTRING(mode,2,30) AS bigint)) n FROM dbo.[sales2Return] WITH (UPDLOCK,HOLDLOCK) WHERE mode LIKE 'R[0-9]%'",
    );
    const billNo = num(mx?.n) + 1;
    const returnMode = `R${billNo}`;
    const returnKey = `${returnMode}-${Date.now()}`;
    const d = tsDate();
    let qty = 0,
      mtr = 0,
      net = 0,
      tax = 0,
      sub = 0;
    const rows: any[] = [];
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      let barcode = txt(it.barcode || it.productId);
      if (barcode.startsWith("sql-line-"))
        barcode = barcode.replace(/^sql-line-/, "");
      const src =
        sourceLines.find((x) => txt(x.barcode) === barcode) ||
        sourceLines.find((x) => txt(x.p_name) === txt(it.productName));
      if (!src)
        throw new SqlWriteError(
          `Item ${txt(it.productName) || barcode} was not found on the original bill.`,
          400,
        );
      const rq = num(it.returnedQty);
      if (rq <= 0)
        throw new SqlWriteError(
          "Return quantity must be greater than zero.",
          400,
        );
      const [rr] = await tx.query(
        "SELECT ISNULL(SUM(TRY_CAST(qty AS float)),0) q FROM dbo.[salbillReturns] WHERE barcode=@b AND cmy_bill=@c",
        { b: barcode, c: txt(head.cmny_bill) },
      );
      const remaining = num(src.qty) - num(rr?.q);
      if (rq > remaining + 0.0001)
        throw new SqlWriteError(
          `Cannot return ${rq} of ${txt(src.p_name)}. Remaining returnable quantity is ${remaining}.`,
          400,
        );
      const rate = num(it.rate) || num(src.rate);
      const gst = num(it.taxPercent) || num(src.hdngst) || num(src.tax);
      const lineSub = r2(rq * rate);
      const lineTax = r2((lineSub * gst) / 100);
      const lineNet = r2(lineSub + lineTax);
      qty += rq;
      mtr += num(src.mtr) * rq;
      sub += lineSub;
      tax += lineTax;
      net += lineNet;
      rows.push({
        unit: txt(src.unit),
        sn: String(i + 1),
        slman: txt(src.slman),
        barcode,
        code: txt(src.code),
        p_name: txt(src.p_name),
        pnameTamil: txt(src.pnameTamil),
        mrp: txt(src.mrp),
        rate: String(rate),
        mtr: String(num(src.mtr)),
        qty: String(rq),
        amt: String(lineSub),
        pds: String(num(src.pds)),
        pamt: String(num(src.pamt)),
        bdis: String(num(src.bdis)),
        less: String(num(src.less)),
        gst: String(lineTax),
        cgst: String(lineTax / 2),
        sgst: String(lineTax / 2),
        netamt: String(lineNet),
        billno: String(billNo),
        cmy_name: txt(src.cmy_name),
        cmy_bill: txt(src.cmny_bill),
        gst_per: String(gst),
        bdisam: String(num(src.bdis_amount || src.bdisam)),
        countername: txt(head.countername),
        design: txt(src.design),
        brand: txt(src.brand),
        patrn: txt(src.patrn),
        size: txt(src.size),
        color: txt(src.color),
        style: txt(src.style),
        prate: txt(src.prate),
        nrate: txt(src.nrate),
        CheckBarcodeBalanceStock: "1",
        gstcrossamt: String(r2(lineSub)),
        user_id: txt(input.userId),
      });
    }
    const gstBuckets: any = { "5": 0, "12": 0, "18": 0, "28": 0 };
    for (const r of rows) {
      const g = String(num(r.gst_per));
      if (gstBuckets[g] !== undefined) gstBuckets[g] += num(r.gst);
    }
    await tx.insert("sales2Return", {
      tot_pdis: "0",
      retstat: "1",
      upsat: "",
      upnet: "",
      status: "0",
      crs_amount: "",
      systemname: txt(head.systemname),
      cus_card: txt(head.cus_card),
      cus_name: txt(head.cus_name),
      mbl_no: txt(head.mbl_no),
      tmtr: String(mtr),
      bill_disc: "0",
      bill_disc1: "0",
      bill_less: "0",
      bill_less1: "0",
      roundoff: "0",
      igstper: "0",
      tot_qty: String(qty),
      tot_netamnt: String(net),
      billno: String(billNo),
      date: d,
      notdislesamt: "0",
      paymenttype: txt(input.refundMethod).toUpperCase(),
      mode: returnMode,
      sysidandbill: returnKey,
      gst5: String(r2(gstBuckets["5"])),
      gst12: String(r2(gstBuckets["12"])),
      gst18: String(r2(gstBuckets["18"])),
      gst28: String(r2(gstBuckets["28"])),
      totnetsub: String(sub),
      pdisamtot: "0",
      SBillStatus: "1",
      points: "0",
      datetime: new Date().toISOString(),
      UserID: txt(input.userId),
      Lmode: `K${returnMode}`,
      BarcodeWiseProfit: "0",
      CustomerMan: txt(head.CustomerMan),
      Custpointamt: "0",
      Token_Dis_Gift_Amount: "0",
      Gift_Amount_wiseToken: "0",
      returnStatus: "1",
    });
    for (const r of rows) {
      await tx.insert("salbillReturns", { ...r, billno: String(billNo) });
      await tx.insert("salsntryReturn", {
        datetime: new Date().toISOString(),
        systemname: txt(head.systemname),
        upmrp: txt(r.mrp),
        upnet: txt(r.netamt),
        upsta: "",
        daily_cmy_bill: txt(r.cmy_bill),
        less: r.less,
        pre_bill_amnt: txt(r.amt),
        mrp: txt(r.mrp),
        srl_no: r.sn,
        sls_man: r.slman,
        barcode: r.barcode,
        p_name: r.p_name,
        rate: r.rate,
        mtr: r.mtr,
        qty: r.qty,
        amount: r.amt,
        pdis: r.bdis,
        pdis_amount: r.bdisam,
        net_amount: r.netamt,
        tax: r.gst,
        cgst: r.cgst,
        sgst: r.sgst,
        dis: r.bdis,
        billno: r.billno,
        hsncode: "",
        mode: returnMode,
        date: d,
        amt: r.amt,
        cmnyname: r.cmy_name,
        cmny_bill: r.cmy_bill,
        status: "0",
        hdnmtr: r.mtr,
        hdnunit: r.unit,
        hdnpgrm: "",
        hdngst: r.gst_per,
        company_name: r.cmy_name,
        bil_cl_qty: r.qty,
        UserID: txt(input.userId),
        returnStatus: "1",
      });
    }
    return getSqlSalesReturn(returnKey);
  });
}
export async function listSqlSalesReturns() {
  const rows = await sqlRead(
    "SELECT sysidandbill,mode,billno,date,cus_name,mbl_no,tot_qty,tot_netamnt,UserID,returnStatus FROM dbo.[sales2Return] ORDER BY date DESC, No DESC",
  );
  return rows.map((r) => ({
    _id: `sql:sr:${txt(r.sysidandbill)}`,
    id: `sql:sr:${txt(r.sysidandbill)}`,
    returnId: txt(r.mode) || txt(r.billno),
    invoiceId: "",
    customerName: txt(r.cus_name),
    phone: txt(r.mbl_no),
    returnDate: r.date,
    totalReturnAmount: num(r.tot_netamnt),
    items: [],
    status: txt(r.returnStatus),
    source: "sql",
  }));
}
export async function getSqlSalesReturn(id: string) {
  const k = key(id);
  const [h] = await sqlRead(
    "SELECT TOP 1 * FROM dbo.[sales2Return] WHERE sysidandbill=@k",
    { k },
  );
  if (!h) return undefined;
  const lines = await sqlRead(
    "SELECT * FROM dbo.[salbillReturns] WHERE billno=@b ORDER BY No",
    { b: h.billno },
  );
  return {
    _id: `sql:sr:${k}`,
    id: `sql:sr:${k}`,
    returnId: txt(h.mode) || txt(h.billno),
    invoiceId: "",
    customerName: txt(h.cus_name),
    returnDate: h.date,
    totalReturnAmount: num(h.tot_netamnt),
    subtotal: num(h.totnetsub),
    taxAmount: num(h.gst5) + num(h.gst12) + num(h.gst18) + num(h.gst28),
    discountAmount: num(h.bill_disc),
    refundMethod: txt(h.paymenttype).toLowerCase(),
    status: txt(h.returnStatus),
    items: lines.map((l) => ({
      product: l.code,
      productName: l.p_name,
      returnedQty: num(l.qty),
      rate: num(l.rate),
      taxPercent: num(l.gst_per),
      taxAmount: num(l.gst),
      lineTotal: num(l.netamt),
      barcode: txt(l.barcode),
    })),
    source: "sql",
  };
}
export async function deleteSqlSalesReturn(id: string) {
  const k = key(id);
  await withSqlTransaction("Deleting sales return", async (tx) => {
    const [h] = await tx.query(
      "SELECT TOP 1 billno FROM dbo.[sales2Return] WHERE sysidandbill=@k",
      { k },
    );
    if (!h) throw new SqlWriteError("Sales return not found.", 404);
    await tx.remove("salsntryReturn", { billno: String(h.billno) });
    await tx.remove("salbillReturns", { billno: String(h.billno) });
    await tx.remove("sales2Return", { sysidandbill: k });
  });
}
