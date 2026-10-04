/**
 * Purchase returns, stored the way THIS shop's Textilesoft stores them (SSS_copy, Sep 2026):
 *   PurchaseReturnHeader   one row per return; grn_no = the RETURN number, invoce_amount = supplier's ref
 *   PurchaseReturnDetails  one row per line; grn_no = the return number; the barcode links to the purchase
 * purretrun (07_purchase_return.md's "legacy ledger") is empty in this shop and Textilesoft doesn't write it,
 * so the ERP doesn't either. Stock subtracts PurchaseReturnDetails (and purretrun, for other installations).
 * One return may hold barcodes from several GRNs of the same supplier (Textilesoft's PRCA11 does).
 */
import {
  sqlRead,
  withSqlTransaction,
  SqlWriteError,
  tsDate,
  txt,
  type Row,
  type SqlTx,
} from "./sqlWrite.js";
import { sqlSupplierList } from "./sqlSuppliers.js";
import { lineMath, f2 } from "./sqlPurchase.js";
import { poDay } from "./sqlPurchaseOrder.js";
const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const r2 = (n: number) => Math.round(n * 100) / 100;
const dateText = (v: unknown) => {
  const s = txt(v);
  if (!s) return tsDate();
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? s : tsDate(d);
};
const supplierName = async (id: string | undefined, name?: string) => {
  const raw = txt(name);
  if (raw) return raw.toUpperCase();
  // Optional: the supplier is taken from the GRN the barcodes came from (a different one is refused).
  if (!id) return "";
  const list = await sqlSupplierList();
  const x = list.find((s) => String(s._id) === id);
  if (!x)
    throw new SqlWriteError(
      "Supplier is not available in Textilesoft SQL.",
      400,
    );
  return txt(x.businessName).toUpperCase();
};
/** Optional non-negative number from the client; 0 when not sent. Throws on text / negatives. */
function amountIn(v: unknown, label: string): number {
  if (v === undefined || v === null || txt(v) === "") return 0;
  const n = Number(txt(v).replace(/,/g, ""));
  if (!Number.isFinite(n) || n < 0)
    throw new SqlWriteError(`${label} must be a number of 0 or more (got "${txt(v)}").`, 400);
  return n;
}

/**
 * How many of a barcode can still go back to the supplier -- the same stock the ERP's stock reports show:
 * received (qty + free qty) - sold (salsntry, not cancelled) - already returned (PurchaseReturnDetails,
 * plus purretrun where an installation uses it).
 */
export async function returnableQty(tx: SqlTx, barcode: string): Promise<number> {
  const [r] = await tx.query(
    `SELECT
       (SELECT ISNULL(SUM(ISNULL(TRY_CAST(qty AS float), 0) + ISNULL(TRY_CAST(fqty AS float), 0)), 0)
          FROM dbo.[purentrydetails] WHERE barcode = @b AND STATUS IS NULL) AS received,
       (SELECT ISNULL(SUM(ISNULL(TRY_CAST(qty AS float), 0)), 0)
          FROM dbo.[salsntry] WHERE barcode = @b AND ISNULL(status, '') <> '1') AS sold,
       (SELECT ISNULL(SUM(ISNULL(TRY_CAST(qty AS float), 0)), 0)
          FROM dbo.[PurchaseReturnDetails] WHERE barcode = @b)
       + (SELECT ISNULL(SUM(ISNULL(TRY_CAST(qty AS float), 0)), 0)
          FROM dbo.[purretrun] WHERE barcode = @b) AS returned`,
    { b: barcode },
  );
  return Number(r?.received ?? 0) - Number(r?.sold ?? 0) - Number(r?.returned ?? 0);
}

/**
 * Purchase return. Every line is a barcode from a purchase; everything about the line (product, rate, GST,
 * discount, attributes) comes from that purchase line, only the quantity comes from the user. Rules:
 *   - all lines must come from one GRN (the header has one grn_no); the GRN's supplier, company and
 *     warehouse are the return's, and a different supplier / company / warehouse is refused;
 *   - a barcode can't go back more times than it's in stock (received - sold - already returned);
 *   - line maths as in purchase entry (less, then discount, then GST); "less" is shared out by quantity;
 *   - header totals and GST buckets are computed from the lines, never taken from the client.
 */
export async function createSqlPurchaseReturn(input: Row) {
  const supplierIn = await supplierName(
    txt(input.supplierId),
    txt(input.supplierName || input.supplier),
  );
  const items = Array.isArray(input.items) ? input.items : [];
  if (!items.length)
    throw new SqlWriteError(
      "Purchase return must contain at least one item.",
      400,
    );
  // Bill-level discount / less can't be shared onto lines taken from the purchase; refuse rather than store
  // numbers the totals don't include.
  if (amountIn(input.discount, "Bill discount") || amountIn(input.discountPercent, "Bill discount %") || amountIn(input.less, "Bill less"))
    throw new SqlWriteError(
      "A bill-level discount or less isn't supported on purchase returns; the purchase line's own discount is used.",
      400,
    );
  const addCharge = amountIn(input.addCharge, "Additional charge");
  // Courier / other charges go in the header's "other charges" column (Textilesoft's oter_char).
  const otherCharge = amountIn(input.courierCharge, "Courier charge");
  let originalIn = txt(input.grnNo || input.grn_no || input.grnId);
  if (originalIn.startsWith("sql:")) originalIn = originalIn.replace(/^sql:/, "");

  return withSqlTransaction("Saving purchase return", async (tx) => {
    // ---- each line: its purchase line
    const wanted = new Map<string, number>(); // barcode -> qty in this return
    const found: { it: Row; p: Row; qty: number }[] = [];
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const at = `Line ${i + 1}`;
      const barcode = txt(it.barcode);
      if (!barcode)
        throw new SqlWriteError(`${at}: scan or enter the barcode (returns are tracked per barcode).`, 400);
      const qty = amountIn(it.quantity ?? it.qty, `${at}: quantity`);
      if (!qty) throw new SqlWriteError(`${at}: quantity must be greater than zero.`, 400);
      const rows = await tx.query(
        `SELECT * FROM dbo.[purentrydetails] WHERE barcode = @b AND STATUS IS NULL${originalIn ? " AND LTRIM(RTRIM(grn_no)) = @g" : ""}`,
        { b: barcode, ...(originalIn ? { g: originalIn } : {}) },
      );
      if (!rows.length)
        throw new SqlWriteError(
          originalIn
            ? `${at}: barcode ${barcode} was not received on GRN ${originalIn}.`
            : `${at}: barcode ${barcode} is not on any purchase.`,
          400,
        );
      const grns = new Set(rows.map((r) => txt(r.grn_no)));
      if (grns.size > 1)
        throw new SqlWriteError(
          `${at}: barcode ${barcode} is on more than one purchase (${[...grns].join(", ")}); choose the GRN.`,
          400,
        );
      wanted.set(barcode, (wanted.get(barcode) ?? 0) + qty);
      found.push({ it, p: rows[0], qty });
    }
    // ---- the GRNs decide supplier / company / warehouse (one return = one supplier, one company)
    const grns = [...new Set(found.map((f) => txt(f.p.grn_no)))];
    const heads: Row[] = [];
    for (const g of grns) {
      const [h] = await tx.query(
        "SELECT TOP 1 * FROM dbo.[purgrnentry] WHERE LTRIM(RTRIM(grn_no)) = @g",
        { g },
      );
      if (!h) throw new SqlWriteError(`Purchase GRN ${g} not found.`, 404);
      heads.push(h);
    }
    const [orig] = heads;
    // Inter-state purchases (IGST): the return reverses IGST credit, so it must carry the same flag.
    // The GST reports read IGSTAmt > 0 on the header as "inter-state".
    const isInter = (h: Row) => (Number(txt(h.IGSTAmt)) || 0) > 0;
    const interState = heads.some(isInter);
    if (interState && !heads.every(isInter))
      throw new SqlWriteError(
        `GRNs ${grns.join(", ")} mix inter-state (IGST) and local (CGST/SGST) purchases; make separate returns.`,
        400,
      );
    const supplier = txt(orig.suplier_name).toUpperCase();
    const company = txt(orig.cmy_name).toUpperCase();
    const warehouse = txt(orig.warehouse).toUpperCase();
    for (const h of heads) {
      if (txt(h.suplier_name).toUpperCase() !== supplier)
        throw new SqlWriteError(
          `GRN ${txt(h.grn_no)} is from ${txt(h.suplier_name)}, but GRN ${txt(orig.grn_no)} is from ${supplier}; make one return per supplier.`,
          400,
        );
      if (txt(h.cmy_name).toUpperCase() !== company)
        throw new SqlWriteError(
          `GRN ${txt(h.grn_no)} belongs to ${txt(h.cmy_name)}, but GRN ${txt(orig.grn_no)} to ${company}; make one return per company.`,
          400,
        );
    }
    const original = grns.join(", ");
    if (supplierIn && supplierIn !== supplier)
      throw new SqlWriteError(
        `GRN ${txt(orig.grn_no)} is from ${supplier}, not ${supplierIn}; goods go back to the supplier they came from.`,
        400,
      );
    const companyIn = txt(input.company || input.companyName).toUpperCase();
    if (companyIn && companyIn !== company)
      throw new SqlWriteError(`GRN ${txt(orig.grn_no)} belongs to ${company}, not ${companyIn}.`, 400);
    const warehouseIn = txt(input.warehouse).toUpperCase();
    if (warehouseIn && warehouseIn !== warehouse)
      throw new SqlWriteError(`GRN ${txt(orig.grn_no)} was received into ${warehouse}, not ${warehouseIn}.`, 400);

    // ---- stock: can't send back more than is here
    for (const [barcode, qty] of wanted) {
      const left = await returnableQty(tx, barcode);
      if (qty > left)
        throw new SqlWriteError(
          left > 0
            ? `Only ${left} of barcode ${barcode} can be returned (received - sold - already returned); ${qty} asked.`
            : `Barcode ${barcode} has nothing left to return (already sold or returned).`,
          409,
        );
    }

    // ---- return number
    // Return number: "PR" + running number, continuing after the highest all-digit one in PurchaseReturnHeader
    // (PR11 there -> PR12). Textilesoft's own "PR" + letters + number (PRCA11) can't clash. Locked until commit.
    const prefix = "PR";
    const [mx] = await tx.query(
      "SELECT MAX(TRY_CAST(SUBSTRING(LTRIM(RTRIM(grn_no)),LEN(@p)+1,20) AS bigint)) n FROM dbo.[PurchaseReturnHeader] WITH (UPDLOCK,HOLDLOCK) WHERE LTRIM(RTRIM(grn_no)) LIKE @p+'[0-9]%'",
      { p: prefix },
    );
    let seq = num(mx?.n) + 1;
    let rgrno = `${prefix}${seq}`;
    while (
      (
        await tx.query(
          "SELECT TOP 1 1 AS x FROM dbo.[PurchaseReturnDetails] WHERE LTRIM(RTRIM(grn_no)) = @r",
          { r: rgrno },
        )
      ).length
    )
      rgrno = `${prefix}${++seq}`;
    const d = dateText(input.returnDate || input.date);
    // Column types (SSS_copy, Sep 2026): date columns -- PurchaseReturnHeader.date / entry_date / invoce_date,
    // PurchaseReturnDetails.entry_date, purretrun.date -- get ISO, never dd/MM/yyyy text (which fails or swaps
    // day and month). PurchaseReturnDetails.date is varchar and keeps Textilesoft's dd/MM/yyyy text.
    const dIso = poDay(input.returnDate || input.date).iso;

    // ---- lines from the purchase lines
    let totalQty = 0,
      totalMtr = 0,
      totalNet = 0,
      totalGst = 0,
      totalTaxable = 0,
      totalLess = 0;
    const buckets: Record<string, number> = { "5": 0, "12": 0, "18": 0, "28": 0 };
    const rates = new Set<number>();
    const lines: Row[] = [];
    found.forEach(({ it, p, qty }, i) => {
      const mtr = num(p.mtr);
      const rate = num(p.prate);
      const gst = num(p.gst_per);
      const disPer = num(p.dis_per);
      // The purchase line's "less" shared out by quantity (returning 2 of 10 takes 2/10 of it).
      const purchasedQty = num(p.qty) || qty;
      const less = r2((num(p.pless) * qty) / purchasedQty);
      const m = lineMath({ qty, mtr, prate: rate, mrp: num(p.mrp), discountPercent: disPer, less }, gst);
      totalQty += qty;
      totalMtr += mtr ? m.units : 0;
      totalNet += m.netAmount;
      totalGst += m.gstAmount;
      totalTaxable += m.plamt - m.disAmount;
      totalLess += less;
      rates.add(gst);
      if (String(gst) in buckets) buckets[String(gst)] += m.gstAmount;
      lines.push({
        entry_date: dIso,
        pratecode: txt(p.pratecode),
        grn_no: rgrno, // Textilesoft keeps the return number here; the barcode links back to the purchase
        sl_no: String(i + 1),
        barcode: txt(p.barcode),
        design: txt(p.design),
        hsncode: txt(p.hsncode),
        code: txt(p.code),
        pname: txt(p.pname),
        prate: f2(rate),
        mtr: mtr ? String(mtr) : "",
        qty: String(qty),
        amount: f2(m.amount),
        dis_per: String(disPer),
        dis_amount: f2(m.disAmount),
        gst_per: String(gst),
        gst_amount: f2(m.gstAmount),
        nrate: f2(m.nrate),
        net_amount: f2(m.netAmount),
        sr_per: txt(p.sr_per),
        mrp: txt(p.mrp),
        sr_rate: txt(p.sr_rate),
        cr_per: txt(p.cr_per),
        cr_rate: txt(p.cr_rate),
        brand: txt(p.brand),
        patrn: txt(p.patrn),
        size: txt(p.size),
        color: txt(p.color),
        rackno: txt(p.rackno),
        model: txt(p.model),
        fashion: txt(p.fashion),
        style: txt(p.style),
        // Free pieces aren't sent back separately: the returned qty already counts against qty + fqty.
        fqty: "0",
        date: d,
        pro_group_name: txt(p.pro_group_name),
        unit_details: txt(p.unit_details),
        orgbar: txt(p.orgbar) || txt(p.barcode),
        pless: f2(less),
        plamt: f2(m.plamt),
        mrpdisper: txt(p.mrpdisper),
        mrpdisamt: txt(p.mrpdisamt),
        billstatus: 1,
      });
      void it;
    });
    const gstTotal = r2(totalGst);
    await tx.insert("PurchaseReturnHeader", {
      warehouse,
      suplier_name: supplier,
      agent_name: txt(orig.agent_name),
      incharge: txt(input.incharge),
      cmy_name: company,
      grn_no: rgrno, // the return number, as Textilesoft stores it
      // Textilesoft keeps the supplier's reference (return note / invoice no.) here.
      invoce_amount: txt(input.supplierReturnGrn || input.supplierRef || input.invoiceNo),
      invoce_date: input.invoiceDate ? poDay(input.invoiceDate).iso : dIso,
      entry_date: dIso,
      date: dIso,
      CQty: String(totalQty),
      CMtr: String(r2(totalMtr)),
      ViewStatus: "NewPurchaseReturn", // what Textilesoft's own return screen writes
      tot_less: f2(totalLess),
      less: f2(totalLess),
      totnetamot: f2(totalNet),
      pay_type: txt(input.refundMethod).toUpperCase() || "CREDIT",
      pnet_tot: f2(totalTaxable),
      tot_qut: String(totalQty),
      gst_in: rates.size === 1 ? String([...rates][0]) : "",
      igst_in: "",
      gst5: f2(buckets["5"]),
      gst12: f2(buckets["12"]),
      gst18: f2(buckets["18"]),
      gst28: f2(buckets["28"]),
      oter_char: otherCharge ? f2(otherCharge) : "",
      AddchargeAmt: f2(addCharge),
      AddchargePer: "0",
      AddcharegeGST: "0",
      AddchargeWOGST: f2(addCharge),
      IGSTAmt: interState ? f2(gstTotal) : "0.00",
      Supplier_City: txt(orig.Supplier_City),
      CTotal: f2(totalTaxable),
      CGst: f2(gstTotal),
      PreDisamt: "0.00",
    });
    for (const l of lines) await tx.insert("PurchaseReturnDetails", l);
    void original;
    return getSqlPurchaseReturn(rgrno);
  });
}
const isoDay = (v: unknown) =>
  v instanceof Date ? v.toISOString().slice(0, 10) : txt(v);

/** Returns from PurchaseReturnHeader (Textilesoft's and the ERP's), newest first. id = sql:pr:<header ID>
 *  (the return number isn't unique in Textilesoft's own data: two "PR11" headers exist). */
export async function listSqlPurchaseReturns() {
  const rows = await sqlRead(
    `SELECT h.ID, LTRIM(RTRIM(h.grn_no)) AS rgrno, h.date, h.suplier_name, h.cmy_name, h.invoce_amount, h.pay_type,
            h.totnetamot, h.CGst, h.CQty
       FROM dbo.[PurchaseReturnHeader] h ORDER BY h.date DESC, h.ID DESC`,
  );
  return rows.map((r) => ({
    id: `sql:pr:${txt(r.ID)}`,
    _id: `sql:pr:${txt(r.ID)}`,
    returnId: txt(r.rgrno),
    returnDate: isoDay(r.date),
    supplier: {
      _id: `sql-supplier:${txt(r.suplier_name)}`,
      businessName: txt(r.suplier_name),
      name: txt(r.suplier_name),
    },
    company: txt(r.cmy_name),
    supplierRef: txt(r.invoce_amount),
    items: [],
    quantity: num(r.CQty),
    totalAmount: num(r.totnetamot),
    taxAmount: num(r.CGst),
    refundMethod: txt(r.pay_type).toLowerCase() || "credit",
    status: "processed",
    source: "sql",
  }));
}

/** Header ID from "sql:pr:<ID>" (or a bare ID); undefined when it isn't one. */
const headerId = (id: string): number | undefined => {
  const n = Number(id.replace(/^sql:pr:/, ""));
  return Number.isInteger(n) && n > 0 ? n : undefined;
};

export async function getSqlPurchaseReturn(id: string) {
  const hid = headerId(id);
  const [h] = hid
    ? await sqlRead("SELECT TOP 1 * FROM dbo.[PurchaseReturnHeader] WHERE ID = @id", { id: hid })
    : // a return number (e.g. right after saving)
      await sqlRead(
        "SELECT TOP 1 * FROM dbo.[PurchaseReturnHeader] WHERE LTRIM(RTRIM(grn_no)) = @r ORDER BY ID DESC",
        { r: id.replace(/^sql:pr:/, "") },
      );
  if (!h) return undefined;
  const rgrno = txt(h.grn_no);
  const [sameNumber] = await sqlRead(
    "SELECT COUNT_BIG(*) AS n FROM dbo.[PurchaseReturnHeader] WHERE LTRIM(RTRIM(grn_no)) = @r",
    { r: rgrno },
  );
  if (Number(sameNumber?.n ?? 0) > 1)
    throw new SqlWriteError(
      `Return number ${rgrno} belongs to multiple headers; its lines cannot be assigned safely.`,
      409,
    );
  const [unlinked] = await sqlRead(
    `SELECT COUNT_BIG(*) AS n FROM dbo.[PurchaseReturnDetails] d
       WHERE LTRIM(RTRIM(d.grn_no)) = @r
         AND NOT EXISTS (SELECT 1 FROM dbo.[purentrydetails] p
                         WHERE LTRIM(RTRIM(p.barcode)) = LTRIM(RTRIM(d.barcode)))`,
    { r: rgrno },
  );
  if (Number(unlinked?.n ?? 0) > 0)
    throw new SqlWriteError(
      `Return number ${rgrno} contains lines that cannot be linked to a purchase barcode.`,
      409,
    );
  const lines = await sqlRead(
    "SELECT * FROM dbo.[PurchaseReturnDetails] WHERE LTRIM(RTRIM(grn_no)) = @r ORDER BY TRY_CAST(sl_no AS int), ID",
    { r: rgrno },
  );
  return {
    _id: `sql:pr:${txt(h.ID)}`,
    id: `sql:pr:${txt(h.ID)}`,
    returnId: rgrno,
    returnDate: isoDay(h.date),
    supplier: { businessName: txt(h.suplier_name) },
    company: txt(h.cmy_name),
    warehouse: txt(h.warehouse),
    supplierRef: txt(h.invoce_amount),
    items: lines.map((l) => ({
      productName: txt(l.pname),
      productId: txt(l.code),
      quantity: num(l.qty),
      rate: num(l.prate),
      tax: num(l.gst_per),
      taxAmount: num(l.gst_amount),
      amount: num(l.net_amount),
      barcode: txt(l.barcode),
    })),
    subtotal: num(h.CTotal ?? h.pnet_tot),
    taxAmount: num(h.CGst),
    discountAmount: num(h.PreDisamt),
    totalAmount: num(h.totnetamot),
    refundMethod: txt(h.pay_type).toLowerCase() || "credit",
    status: "processed",
    source: "sql",
  };
}

/**
 * Deletes a return: its header and its lines (PurchaseReturnDetails with that return number). Lines are
 * keyed by return number only, so when another header shares the number (Textilesoft's two "PR11"s),
 * nothing is deleted -- that has to be sorted out in Textilesoft.
 */
export async function deleteSqlPurchaseReturn(id: string) {
  const hid = headerId(id);
  if (!hid) throw new SqlWriteError("Purchase return not found.", 404);
  await withSqlTransaction("Deleting purchase return", async (tx) => {
    const [h] = await tx.query(
      "SELECT TOP 1 ID, LTRIM(RTRIM(grn_no)) AS rgrno FROM dbo.[PurchaseReturnHeader] WHERE ID = @id",
      { id: hid },
    );
    if (!h) throw new SqlWriteError("Purchase return not found.", 404);
    const rgrno = txt(h.rgrno);
    const [c] = await tx.query(
      "SELECT COUNT(*) AS n FROM dbo.[PurchaseReturnHeader] WHERE LTRIM(RTRIM(grn_no)) = @r",
      { r: rgrno },
    );
    if (Number(c?.n) > 1)
      throw new SqlWriteError(
        `Return number ${rgrno} is used by ${c.n} returns, so its lines can't be told apart here. Delete it in Textilesoft.`,
        409,
      );
    await tx.remove("PurchaseReturnDetails", { grn_no: rgrno });
    await tx.remove("PurchaseReturnHeader", { ID: hid });
  });
}
