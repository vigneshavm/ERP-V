import { SqlWriteError, withSqlTransaction, sqlWriter, tableColumns, type Row } from "./sqlWrite.js";
import { SQL_ID_PREFIX } from "./sqlSales.js";
import { findByKeyDirect } from "./sqlItemSource.js";
import { saleGstRate } from "./sqlPosRules.js";
import { allowNegativeStock, saleSlabBasis } from "./sqlPosWriter.js";
import { assertCashNotCollected } from "./sqlBillCancel.js";
import { calcBill } from "../../modules/sales/domain/salesCalc.js";

/**
 * Edit a finished bill IN PLACE (POS "edit bill"): remove lines and/or add stock items, then re-total the bill.
 *
 * Differences from Textilesoft's own edit screen (BarcodeGstSalesentryNewsaleAllEdit), which deletes the bill's rows
 * and re-inserts them through a staging table:
 *   - nothing is deleted: a removed line gets salsntry.status = '1' (the same marker a cancelled bill's lines carry,
 *     so stock and every report already ignore it); an added line is a normal new salsntry row of the same bill;
 *   - the header (sales2) totals, GST split and payment split are updated for the new total;
 *   - the bill keeps its number, date and key.
 * New lines are priced exactly like POS bills: the stock item's selling price (GST included), the GST rate from the
 * product's GST group (same slab rules), amounts from the shared calcBill() in legacy rounding.
 *
 * Deliberately narrow (refused with 409 EDIT_UNSUPPORTED rather than guessed): bills with a bill discount / bill less,
 * product discounts, returned (exchange) lines, metre items or customer points; credit bills may not change their
 * credit amount (customer balances are not touched here). Only today's live bills whose cash has not been collected,
 * and the stored total must equal what the bill recomputes to -- otherwise the edit is refused.
 */
export interface BillEditInput {
  /** salsntry.No of the live lines to remove. */
  removeLineNos?: number[];
  /** Stock items to add, by barcode. */
  /** price (GST included) is an optional selling-price override, used when the item was picked by product name / code; omitted = the stock item's price. */
  add?: { barcode: string; qty: number; price?: number }[];
  /** New split of the total. Required unless dryRun. */
  payment?: { cash: number; card: number; upi: number; credit: number };
  /** Calculate and return the new total only; writes nothing. */
  dryRun?: boolean;
  /** Total the cashier saw in the preview; refused if the recalculation differs. */
  expectedTotal?: number;
}

export interface BillEditResult {
  billNo: string;
  sysId: string;
  dryRun: boolean;
  previousTotal: number;
  total: number;
  tax: number;
  linesRemoved: number;
  linesAdded: number;
  /** Payment split now on the bill (before an edit) / saved (after). */
  payment: { cash: number; card: number; upi: number; credit: number };
  added: { barcode: string; name: string; qty: number; unitPrice: number; gstRate: number; amount: number }[];
}

const r2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;
const f2 = (n: number): string => r2(n).toFixed(2);
const whole = (n: number): string => (Number.isInteger(r2(n)) ? String(r2(n)) : f2(n));
const num = (v: unknown): number => {
  const n = Number(String(v ?? "").trim());
  return Number.isFinite(n) ? n : 0;
};
const unsupported = (why: string): SqlWriteError =>
  new SqlWriteError(`This bill can't be edited here: ${why}. Cancel it and bill again instead.`, 409, "EDIT_UNSUPPORTED");

const keyOf = (id: string): string => {
  const raw = id.startsWith(SQL_ID_PREFIX) ? id.slice(SQL_ID_PREFIX.length) : id;
  if (!/^[A-Za-z0-9_-]{1,40}$/.test(raw)) throw new SqlWriteError("Invoice not found.", 404);
  return raw;
};

export async function editSqlBill(id: string, input: BillEditInput): Promise<BillEditResult> {
  const key = keyOf(String(id ?? ""));
  const removeNos = [...new Set((input.removeLineNos ?? []).map(Number))];
  if (removeNos.some((n) => !Number.isInteger(n) || n <= 0)) throw new SqlWriteError("Invalid line number to remove.", 400);
  const adds = new Map<string, number>();
  const priceOverride = new Map<string, number>();
  for (const a of input.add ?? []) {
    const barcode = String(a?.barcode ?? "").trim();
    const qty = Number(a?.qty);
    if (!barcode || !Number.isInteger(qty) || qty <= 0 || qty > 1000)
      throw new SqlWriteError("Each added item needs a barcode and a whole quantity above zero.", 400);
    if (a?.price !== undefined && a?.price !== null) {
      const pr = Math.round(Number(a.price) * 100) / 100;
      if (!(pr > 0) || pr > 10000000) throw new SqlWriteError(`Enter a valid price for barcode ${barcode}.`, 400);
      if (priceOverride.has(barcode) && priceOverride.get(barcode) !== pr)
        throw new SqlWriteError(`Barcode ${barcode} was added at two different prices. Use one price per item.`, 400);
      priceOverride.set(barcode, pr);
    }
    adds.set(barcode, (adds.get(barcode) ?? 0) + qty);
  }
  if (!removeNos.length && !adds.size) throw new SqlWriteError("Nothing to change: remove a line or add an item.", 400);
  const dryRun = input.dryRun === true;
  const pay = input.payment;
  if (!dryRun) {
    if (!pay || ![pay.cash, pay.card, pay.upi, pay.credit].every((x) => Number.isFinite(Number(x)) && Number(x) >= 0))
      throw new SqlWriteError("Enter the cash, card, UPI and credit amounts for the new total.", 400);
  }

  return withSqlTransaction("Bill edit", async (tx) => {
    // 1. The bill: live, today, cash not collected.
    const [head] = await tx.query(
      "SELECT TOP 1 *, CASE WHEN [date] = CAST(GETDATE() AS date) THEN 1 ELSE 0 END AS is_today FROM dbo.[sales2] WITH (UPDLOCK, ROWLOCK) WHERE [sysidandbill] = @k ORDER BY [No] DESC",
      { k: key },
    );
    if (!head) throw new SqlWriteError("Invoice not found.", 404);
    const status = String(head.status ?? "").trim();
    if (status === "1") throw new SqlWriteError("This bill is cancelled and can't be edited.", 409, "ALREADY_CANCELLED");
    if (status !== "0") throw new SqlWriteError("Only a live bill can be edited.", 409, "NOT_LIVE_BILL");
    if (Number(head.is_today) !== 1) throw new SqlWriteError("Only today's bills can be edited.", 409, "NOT_TODAY");
    await assertCashNotCollected(tx, key, "edited");

    // 2. Scope guards (refused, never guessed).
    if (num(head.bill_disc) > 0 || num(head.bill_less) > 0) throw unsupported("it has a bill discount or bill less");
    if (num(head.points) > 0 || num(head.Custpointamt) > 0) throw unsupported("it earned or used customer points");
    if (num(head.s_selfamt) > 0 || num(head.s_advance_amt) > 0) throw unsupported("it has a self / advance payment");

    // 3. Live lines, and a reference line for the bill-level numbers.
    const live = await tx.query(
      "SELECT * FROM dbo.[salsntry] WHERE [systemidbill] = @k AND ISNULL([status], '') <> '1' ORDER BY [No]",
      { k: key },
    );
    if (!live.length) throw new SqlWriteError("This bill has no live lines.", 409);
    for (const l of live) {
      if (num(l.qty) <= 0) throw unsupported("it has returned (exchange) items");
      if (num(l.pdis_amount) > 0 || num(l.less) > 0) throw unsupported("it has item discounts");
      if (/^(MTR|METER|METRE)$/i.test(String(l.hdnunit ?? "").trim())) throw unsupported("it has metre items");
    }
    const liveNos = new Set(live.map((l) => Number(l.No)));
    for (const n of removeNos) if (!liveNos.has(n)) throw new SqlWriteError(`Line ${n} is not a live line of this bill.`, 400);
    const kept = live.filter((l) => !removeNos.includes(Number(l.No)));

    // 4. The stored bill must equal what it recomputes to, or an edit could silently change it.
    const asCalcLine = (l: Row) => ({ qty: num(l.qty), mrp: num(l.mrp), gstRate: num(l.hdngst), unit: "PCS" as const });
    const before = calcBill({ lines: live.map(asCalcLine), rateRounding: "legacy" });
    const previousTotal = num(head.tot_netamnt);
    if (Math.abs(before.payable - previousTotal) >= 0.01)
      throw unsupported(`its saved total (${previousTotal}) does not match its lines (${before.payable})`);

    // 5. New items: price, GST and stock exactly as POS billing does.
    const gstGroups = new Map<string, Record<string, unknown>>();
    for (const g of await tx.query("SELECT * FROM dbo.[gstgroup]")) gstGroups.set(String(g.gst_name ?? "").trim().toUpperCase(), g);
    const removedQty = new Map<string, number>();
    for (const l of live) if (removeNos.includes(Number(l.No))) {
      const b = String(l.barcode ?? "").trim();
      removedQty.set(b, (removedQty.get(b) ?? 0) + num(l.qty));
    }
    const newLines: { barcode: string; name: string; qty: number; unitPrice: number; gst: number; group: string; hsn: string; unit: string; size: string; color: string; brand: string; style: string; prate: number }[] = [];
    for (const [barcode, qty] of adds) {
      const item = await findByKeyDirect({ barcode });
      if (!item) throw new SqlWriteError(`Barcode ${barcode} was not found in stock.`, 404);
      const unitPrice = priceOverride.get(barcode) ?? (Number(item.sellingPrice) || 0);
      if (!(unitPrice > 0)) throw new SqlWriteError(`${item.name} (barcode ${barcode}) has no selling price.`, 409);
      if (/^(MTR|METER|METRE)$/i.test(String(item.unit ?? "").trim())) throw unsupported("metre items can't be added");
      const [cx] = await tx.query("SELECT TOP 1 1 AS x FROM dbo.[purentrydetails] WHERE barcode = @b AND STATUS = '1'", { b: barcode });
      if (cx) throw new SqlWriteError(`${item.name} (barcode ${barcode}) is a cancelled barcode and can't be sold.`, 409);
      if (!allowNegativeStock()) {
        const [st] = await tx.query(
          `SELECT
             (SELECT ISNULL(SUM(ISNULL(TRY_CAST(qty AS float), 0) + ISNULL(TRY_CAST(fqty AS float), 0)), 0) FROM dbo.[purentrydetails] WHERE barcode = @b AND STATUS IS NULL) AS received,
             (SELECT ISNULL(SUM(ISNULL(TRY_CAST(qty AS float), 0)), 0) FROM dbo.[salsntry] WITH (UPDLOCK, HOLDLOCK) WHERE barcode = @b AND ISNULL(status, '') <> '1') AS sold,
             (SELECT ISNULL(SUM(ISNULL(TRY_CAST(qty AS float), 0)), 0) FROM dbo.[PurchaseReturnDetails] WHERE barcode = @b)
             + (SELECT ISNULL(SUM(ISNULL(TRY_CAST(qty AS float), 0)), 0) FROM dbo.[purretrun] WHERE barcode = @b) AS returned`,
          { b: barcode },
        );
        // Lines removed from this same bill free their stock for the new ones.
        const left = r2(num(st?.received) - num(st?.sold) - num(st?.returned) + (removedQty.get(barcode) ?? 0));
        if (qty > left + 0.0001)
          throw new SqlWriteError(
            left > 0 ? `Only ${left} of ${item.name} (barcode ${barcode}) in stock; ${qty} wanted.` : `${item.name} (barcode ${barcode}) is out of stock.`,
            409,
          );
      }
      // GST rate from the product's GST group, as POS billing resolves it.
      let gst = Number(item.gstRate) || 0;
      const [pg] = await tx.query(
        `SELECT TOP 1 LTRIM(RTRIM(n.gst_group)) AS pg, LTRIM(RTRIM(d.pro_group_name)) AS dg
           FROM dbo.[purentrydetails] d LEFT JOIN dbo.[newproduct] n ON LTRIM(RTRIM(n.code)) = LTRIM(RTRIM(d.code))
          WHERE d.barcode = @b ORDER BY d.ID DESC`,
        { b: barcode },
      );
      for (const name of [pg?.pg, pg?.dg]) {
        const row = gstGroups.get(String(name ?? "").trim().toUpperCase());
        if (row) {
          gst = saleGstRate(row, unitPrice);
          if (saleSlabBasis() === "legacy") gst = saleGstRate(row, unitPrice, false, "legacy");
          break;
        }
      }
      newLines.push({
        barcode, name: String(item.name ?? "").trim(), qty, unitPrice, gst,
        group: String(item.category ?? "").trim(), hsn: String(item.hsnCode ?? "").trim(), unit: "PCS",
        size: String(item.size ?? "").trim(), color: String(item.color ?? "").trim(), brand: String(item.brand ?? "").trim(),
        style: "", prate: Number(item.costPrice) || 0,
      });
    }

    // 6. New totals (bill discount / less are zero by the guards above).
    const after = calcBill({
      lines: [...kept.map(asCalcLine), ...newLines.map((n) => ({ qty: n.qty, mrp: n.unitPrice, gstRate: n.gst, unit: "PCS" as const }))],
      rateRounding: "legacy",
    });
    if (after.warnings.length) throw new SqlWriteError(after.warnings.join(" "), 400);
    if (!kept.length && !newLines.length)
      throw new SqlWriteError("A bill needs at least one item. To remove everything, cancel the bill.", 409, "EMPTY_BILL");
    const total = after.payable;
    const tax = r2(after.lines.reduce((s, l) => s + l.gst, 0));
    const currentPay = {
      cash: num(head.s_recevied_cashamt), card: num(head.s_card_amt), upi: num(head.s_googlepay), credit: num(head.s_credit_amt),
    };
    const added = newLines.map((n, i) => ({
      barcode: n.barcode, name: n.name, qty: n.qty, unitPrice: n.unitPrice, gstRate: n.gst,
      amount: after.lines[kept.length + i].payable,
    }));
    const result: BillEditResult = {
      billNo: String(head.mode ?? "").trim(), sysId: key, dryRun, previousTotal, total, tax,
      linesRemoved: removeNos.length, linesAdded: newLines.length, payment: currentPay, added,
    };
    if (input.expectedTotal !== undefined && Math.abs(Number(input.expectedTotal) - total) >= 0.01)
      throw new SqlWriteError(`The bill total is now ₹${total}, not the ₹${input.expectedTotal} you saw. Check the changes again.`, 409);
    if (dryRun) return result;

    // 7. Payment split for the new total. Credit can't change here (customer balances are not touched).
    const p = { cash: Number(pay!.cash), card: Number(pay!.card), upi: Number(pay!.upi), credit: Number(pay!.credit) };
    if (Math.abs(r2(p.cash + p.card + p.upi + p.credit) - total) >= 0.01)
      throw new SqlWriteError(`Cash + card + UPI + credit must add up to the new total ₹${total}.`, 400);
    if (Math.abs(p.credit - currentPay.credit) >= 0.01)
      throw new SqlWriteError("The credit amount of a bill can't be changed here (the customer's credit balance is not adjusted).", 409, "CREDIT_LOCKED");

    // 8. Write: removed lines first, then new lines, then the header.
    if (removeNos.length) {
      const params: Record<string, unknown> = { k: key };
      removeNos.forEach((n, i) => (params[`n${i}`] = n));
      const [r] = await tx.query(
        `UPDATE dbo.[salsntry] SET [status] = '1' WHERE [systemidbill] = @k AND ISNULL([status], '') <> '1' AND [No] IN (${removeNos.map((_, i) => `@n${i}`).join(", ")}); SELECT @@ROWCOUNT AS n`,
        params,
      );
      if (Number(r?.n) !== removeNos.length) throw new SqlWriteError("The bill changed while editing. Nothing was saved.", 409);
    }
    const [ref] = await tx.query("SELECT TOP 1 * FROM dbo.[salsntry] WHERE [systemidbill] = @k ORDER BY [No]", { k: key });
    const [mx] = await tx.query("SELECT ISNULL(MAX(TRY_CAST([srl_no] AS int)), 0) AS m FROM dbo.[salsntry] WHERE [systemidbill] = @k", { k: key });
    let srl = Number(mx?.m ?? 0);
    const { pool } = await sqlWriter();
    const lineCols = await tableColumns(pool, "salsntry");
    for (let i = 0; i < newLines.length; i++) {
      const n = newLines[i];
      const c = after.lines[kept.length + i];
      srl += 1;
      await tx.insert("salsntry", {
        No: lineCols.has("No") ? await tx.nextNumber("salsntry", "No") : undefined,
        srl_no: String(srl),
        sls_man: String(ref?.sls_man ?? "1").trim() || "1",
        barcode: n.barcode,
        p_name: n.name,
        PrintNameEng: n.name,
        rate: f2(c.rate),
        qty: whole(n.qty),
        amount: f2(c.amount),
        amt: f2(c.amount),
        less: f2(c.billDisAmt),
        dis: "0.00",
        net_amount: f2(c.net - c.billDisAmt),
        pre_bill_amnt: f2(c.net - c.billDisAmt),
        upnet: f2(c.net - c.billDisAmt),
        tax: f2(c.gst),
        cgst: f2(c.cgst),
        sgst: f2(c.sgst),
        gstcrossamt: f2(c.gstcrossamt),
        hdngst: String(c.gstRate),
        gst_group: `GST${c.gstRate}`,
        hsncode: n.hsn || undefined,
        hdnunit: "PCS",
        mrp: f2(n.unitPrice),
        upmrp: f2(n.unitPrice),
        Sub_Mrp: f2(n.unitPrice),
        c_Mrp: whole(n.unitPrice),
        c_Amt: whole(c.amount),
        upsta: "0",
        bil_cl_qty: "0",
        EMIAMOUNT: "0",
        billno: head.billno,
        mode: head.mode,
        Lmode: head.Lmode ?? ref?.Lmode,
        date: head.date,
        SystemDate: head.date,
        LLDate: head.date,
        datetime: head.datetime,
        systemidbill: key,
        systemname: head.systemname,
        status: "0",
        UserID: head.UserID,
        cmnyname: ref?.cmnyname,
        company_name: ref?.company_name,
        cmny_bill: ref?.cmny_bill,
        ProGroupName: n.group || undefined,
        count_IDBillno: ref?.count_IDBillno,
        company_code: ref?.company_code,
        comp_continu_billno: ref?.comp_continu_billno,
        cmy_wo_continu_billno: ref?.cmy_wo_continu_billno,
        cmy_wo_cont_idbillno: ref?.cmy_wo_cont_idbillno,
      });
    }

    const rate = (r: number) => after.gstByRate[String(r)];
    const header: Row = {
      tot_qty: whole(after.qtyOut),
      tot_netamnt: whole(total),
      notdislesamt: f2(after.gross),
      totnetsub: f2(after.gross),
      crs_amount: f2(total),
      CM_Amt: f2(total),
      upnet: whole(total),
      roundoff: f2(after.roundOff),
      gst5: f2(rate(5) ?? 0),
      gst12: rate(12) !== undefined || head.gst12 != null ? f2(rate(12) ?? 0) : undefined,
      gst18: rate(18) !== undefined || head.gst18 != null ? f2(rate(18) ?? 0) : undefined,
      gst28: rate(28) !== undefined || head.gst28 != null ? f2(rate(28) ?? 0) : undefined,
      tmtr: f2(after.totalMtr),
      s_recevied_cashamt: whole(p.cash),
      s_card_amt: whole(p.card),
      s_googlepay: whole(p.upi),
      s_credit_amt: whole(p.credit),
      s_balance_amt: "0",
    };
    const changed = await tx.update("sales2", header, { sysidandbill: key });
    if (changed !== 1) throw new SqlWriteError(`Expected to update one bill header, found ${changed}. Nothing was saved.`, 409);
    result.payment = p;
    return result;
  });
}
