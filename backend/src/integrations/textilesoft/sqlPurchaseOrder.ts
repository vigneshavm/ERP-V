/**
 * SQL-backed Purchase Order / PO receiving adapter for Textilesoft (POHeader / PODetails; grn_no = PO number).
 *
 * Rules (06_purchase_order_grn.md):
 *   - status is Textilesoft's POStatus: 0 active, 1 cancelled, 2 edit. Nothing else is stored, so other
 *     statuses (SUBMITTED, APPROVED ...) are refused rather than silently turned into "active".
 *   - lines: product must exist for the company; name, unit and GST group come from newproduct; amounts
 *     are computed here with the purchase-entry maths (less, then discount, then GST) -- never taken
 *     from the client.
 *   - receipt updates change only the fields sent; short / excess are derived from ordered vs received
 *     when not given; a cancelled PO can't be received against.
 */
import {
  sqlRead,
  withSqlTransaction,
  SqlWriteError,
  tsDate,
  txt,
  type Row,
} from "./sqlWrite.js";
import { sqlSupplierList } from "./sqlSuppliers.js";
import { lineMath, gstForAmount, f2 } from "./sqlPurchase.js";

const num = (v: unknown): number => {
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

/** A PO day in both shapes Textilesoft uses (SSS_copy, Sep 2026): POHeader.date / entry_date and
 *  PODetails.entry_date are SQL `date` columns -> ISO; PODetails.date is varchar -> dd/MM/yyyy text. */
export interface PoDay {
  iso: string;
  text: string;
}

/**
 * "2026-09-30" (or a Date / ISO timestamp / dd/MM/yyyy) -> PoDay; today when empty. yyyy-mm-dd is read as
 * the local calendar day (no UTC shift). Writing dd/MM/yyyy text into a `date` column fails or swaps day
 * and month depending on the server's DATEFORMAT, so `date` columns always get ISO.
 */
export function poDay(v?: unknown): PoDay {
  let d: Date;
  const s = txt(v);
  const ymd = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  const dmy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);
  if (!s) {
    const t = new Date();
    d = new Date(t.getFullYear(), t.getMonth(), t.getDate());
  } else if (v instanceof Date) d = v;
  else if (ymd) d = new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]));
  else if (dmy) d = new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]));
  else d = new Date(s);
  if (Number.isNaN(d.getTime()))
    throw new SqlWriteError(`"${s}" is not a date (use yyyy-mm-dd).`, 400);
  const p2 = (n: number) => String(n).padStart(2, "0");
  return {
    iso: `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`,
    text: tsDate(d),
  };
}

export interface SqlPoLineInput {
  productCode?: string;
  code?: string;
  productName?: string;
  pname?: string;
  quantity?: number;
  qty?: number;
  freeQty?: number;
  fqty?: number;
  rate?: number;
  prate?: number;
  mrp?: number;
  mtr?: number;
  amount?: number;
  taxPercent?: number;
  gstPercent?: number;
  discountPercent?: number;
  disPer?: number;
  discountAmount?: number;
  disAmount?: number;
  brand?: string;
  pattern?: string;
  patrn?: string;
  size?: string;
  color?: string;
  style?: string;
  design?: string;
  unit?: string;
  unitDetails?: string;
  barcode?: string;
  model?: string;
  fashion?: string;
  shelfCode?: string;
  rack?: string;
  less?: number;
  pless?: number;
}

export interface SqlPurchaseOrderInput {
  poNumber?: string;
  grn_no?: string;
  supplier?: string;
  supplierName?: string;
  vendorName?: string;
  vendorId?: string;
  salesman?: string;
  agent?: string;
  incharge?: string;
  company?: string;
  companyName?: string;
  date?: string;
  entryDate?: string;
  invoiceDate?: string;
  status?: string;
  expectedDeliveryDate?: string;
  items?: SqlPoLineInput[];
  lines?: SqlPoLineInput[];
  notes?: string;
}

function supplierNameOf(
  input: SqlPurchaseOrderInput,
  suppliers: Row[],
): string {
  const raw = txt(input.supplier || input.supplierName || input.vendorName);
  if (raw) return raw.toUpperCase();
  const id = txt(input.vendorId);
  if (id) {
    const found = suppliers.find((s) => String(s._id) === id);
    if (found) return txt(found.businessName).toUpperCase();
  }
  return "";
}

/** Optional non-negative number from the client; undefined when not sent. Throws on text / negatives. */
function optNum(v: unknown, label: string, max?: number): number | undefined {
  if (v === undefined || v === null || txt(v) === "") return undefined;
  const n = Number(txt(v).replace(/,/g, ""));
  if (!Number.isFinite(n) || n < 0)
    throw new SqlWriteError(`${label} must be a number of 0 or more (got "${txt(v)}").`, 400);
  if (max !== undefined && n > max)
    throw new SqlWriteError(`${label} can't be more than ${max}.`, 400);
  return n;
}

/** Checks one PO line and returns its PODetails row. `p` is the newproduct row, `gstGroup` its gstgroup row. */
export function poLineRow(
  l: SqlPoLineInput,
  n: number,
  p: Row,
  gstGroup: Row | undefined,
  po: string,
  day: PoDay,
): Row {
  const at = `Line ${n}`;
  const qty = optNum(l.quantity ?? l.qty, `${at}: quantity`);
  if (!qty) throw new SqlWriteError(`${at}: enter the quantity.`, 400);
  const rate = optNum(l.rate ?? l.prate, `${at}: rate`) ?? 0;
  const mrp = optNum(l.mrp, `${at}: MRP`) ?? 0;
  const mtr = optNum(l.mtr, `${at}: metres`) ?? 0;
  const fqty = optNum(l.freeQty ?? l.fqty, `${at}: free quantity`) ?? 0;
  const less = optNum(l.less ?? l.pless, `${at}: less`) ?? 0;
  const gstIn = optNum(l.taxPercent ?? l.gstPercent, `${at}: GST %`, 100);
  let disPer = optNum(l.discountPercent ?? l.disPer, `${at}: discount %`, 100);
  const units = mtr > 0 ? qty * mtr : qty;
  const gross = rate * units;
  if (less > gross)
    throw new SqlWriteError(`${at}: less (${less}) is more than the line amount.`, 400);
  // A discount sent only as an amount becomes the equivalent % (the maths below works on %).
  const disAmtIn = optNum(l.discountAmount ?? l.disAmount, `${at}: discount amount`);
  if (disPer === undefined && disAmtIn !== undefined && gross - less > 0)
    disPer = (disAmtIn * 100) / (gross - less);
  // GST: the product's GST group (slab by rate, as in purchase entry) unless the line gives one.
  const gst = gstIn ?? (gstGroup ? gstForAmount(gstGroup, rate) : 0);
  const m = lineMath({ qty, mtr, prate: rate, mrp, discountPercent: disPer ?? 0, less }, gst);
  return {
    entry_date: day.iso, // date column
    grn_no: po,
    sl_no: String(n),
    barcode: txt(l.barcode),
    orgbar: txt(l.barcode),
    design: txt(l.design).toUpperCase(),
    code: txt(p.code),
    // From the product master, not the client.
    pname: txt(p.name),
    prate: f2(rate),
    mtr: mtr ? String(mtr) : "",
    qty: String(qty),
    fqty: String(fqty),
    amount: f2(m.amount),
    dis_per: f2(disPer ?? 0),
    dis_amount: f2(m.disAmount),
    gst_per: String(gst),
    gst_amount: f2(m.gstAmount),
    nrate: f2(m.nrate),
    net_amount: f2(m.netAmount),
    mrp: String(mrp),
    sr_per: "",
    sr_rate: "",
    cr_per: "",
    cr_rate: "",
    brand: txt(l.brand).toUpperCase(),
    patrn: txt(l.pattern ?? l.patrn).toUpperCase(),
    size: txt(l.size).toUpperCase(),
    color: txt(l.color).toUpperCase(),
    style: txt(l.style).toUpperCase(),
    unit_details: txt(l.unitDetails ?? l.unit) || txt(p.unit_de),
    model: txt(l.model).toUpperCase(),
    fashion: txt(l.fashion).toUpperCase(),
    rackno: txt(l.rack ?? l.shelfCode).toUpperCase(),
    // As in purchase entry: the GST group name.
    pro_group_name: txt(p.gst_group),
    pless: f2(less),
    plamt: f2(m.plamt),
    billstatus: 1,
    TotalMeter: String(m.units),
    date: day.text, // varchar column, Textilesoft's dd/MM/yyyy
  };
}

export async function createSqlPurchaseOrder(input: SqlPurchaseOrderInput) {
  const suppliers = await sqlSupplierList();
  const supplier = supplierNameOf(input, suppliers);
  const company = txt(input.company || input.companyName).toUpperCase();
  const lines = (Array.isArray(input.items) ? input.items : input.lines) || [];
  if (!supplier) throw new SqlWriteError("Select the supplier.", 400);
  if (!company) throw new SqlWriteError("Select the company.", 400);
  if (!lines.length)
    throw new SqlWriteError(
      "Purchase Order must contain at least one line.",
      400,
    );
  return withSqlTransaction("Saving the purchase order", async (tx) => {
    const [sup] = await tx.query(
      "SELECT TOP 1 1 AS ok FROM dbo.[supplierdetail] WHERE LTRIM(RTRIM(sup_name)) = @s",
      { s: supplier },
    );
    if (!sup)
      throw new SqlWriteError(
        `Supplier "${supplier}" is not in Textilesoft.`,
        400,
      );
    const [cmp] = await tx.query(
      "SELECT TOP 1 1 AS ok FROM dbo.[companydetail] WHERE LTRIM(RTRIM(cmy_name_eng)) = @c",
      { c: company },
    );
    if (!cmp)
      throw new SqlWriteError(
        `Company "${company}" is not in Textilesoft.`,
        400,
      );
    let po = txt(input.poNumber || input.grn_no);
    if (!po) {
      // The shop has no Textilesoft POs (POHeader empty, Sep 2026), so the ERP numbers its own: PO1, PO2 ...
      // (tx.nextNumber can't be used: it only reads all-digit values, so "PO7" was never seen and every
      // PO after the first got the same number.) Locked until commit so two saves can't take the same one.
      const [m] = await tx.query(
        `SELECT MAX(TRY_CAST(SUBSTRING(LTRIM(RTRIM(grn_no)), 3, 20) AS bigint)) AS n FROM dbo.[POHeader] WITH (UPDLOCK, HOLDLOCK)
          WHERE LTRIM(RTRIM(grn_no)) LIKE 'PO[0-9]%'`,
      );
      po = `PO${Number(m?.n ?? 0) + 1}`;
    }
    if (
      (
        await tx.query(
          "SELECT 1 FROM dbo.[POHeader] WHERE LTRIM(RTRIM(grn_no)) = @p",
          { p: po },
        )
      ).length
    )
      throw new SqlWriteError(`PO ${po} already exists.`, 409);
    const d = poDay(input.date || input.entryDate);
    const gstGroups = new Map<string, Row>();
    for (const g of await tx.query("SELECT * FROM dbo.[gstgroup]"))
      gstGroups.set(txt(g.gst_name).toUpperCase(), g);
    const rows: Row[] = [];
    for (let i = 0; i < lines.length; i++) {
      const code = txt(lines[i].productCode ?? lines[i].code);
      if (!code) throw new SqlWriteError(`Line ${i + 1}: choose a product.`, 400);
      const [p] = await tx.query(
        "SELECT TOP 1 * FROM dbo.[newproduct] WHERE LTRIM(RTRIM(code)) = @c AND LTRIM(RTRIM(cmy_name)) = @m",
        { c: code, m: company },
      );
      if (!p)
        throw new SqlWriteError(`Line ${i + 1}: product ${code} is not set up for ${company}.`, 400);
      rows.push(
        poLineRow(lines[i], i + 1, p, gstGroups.get(txt(p.gst_group).toUpperCase()), po, d),
      );
    }
    const totalQty = rows.reduce((s, r) => s + num(r.qty), 0);
    const totalMtr = rows.reduce((s, r) => s + num(r.TotalMeter), 0);
    await tx.insert("POHeader", {
      suplier_name: supplier,
      SalesMan: txt(input.salesman),
      agent_name: txt(input.agent),
      incharge: txt(input.incharge),
      cmy_name: company,
      grn_no: po,
      invoce_date: input.invoiceDate ? poDay(input.invoiceDate).iso : d.iso,
      entry_date: d.iso, // date columns
      date: d.iso,
      POStatus: txt(input.status) === "CANCELLED" ? "1" : "0",
      OverAllQty: String(totalQty),
      OverAllMtr: String(r2(totalMtr)),
    });
    for (const r of rows) await tx.insert("PODetails", r);
    return getSqlPurchaseOrder(po);
  });
}

export async function listSqlPurchaseOrders(
  q: { search?: string; from?: string; to?: string; supplier?: string } = {},
) {
  const where = ["1=1"];
  const p: Row = {};
  if (q.search) {
    where.push("(h.grn_no LIKE @q OR h.suplier_name LIKE @q)");
    p.q = `%${q.search}%`;
  }
  if (q.supplier) {
    where.push("h.suplier_name = @s");
    p.s = q.supplier;
  }
  if (q.from) {
    where.push("h.date >= @f");
    p.f = q.from;
  }
  if (q.to) {
    where.push("h.date <= @t");
    p.t = q.to;
  }
  const rows = await sqlRead(
    `SELECT h.*, CASE WHEN h.POStatus=1 THEN 'CANCELLED' WHEN h.POStatus=2 THEN 'EDIT' ELSE 'ACTIVE' END AS statusText FROM dbo.[POHeader] h WHERE ${where.join(" AND ")} ORDER BY h.date DESC, h.ID DESC`,
    p,
  );
  return rows.map((r) => ({
    _id: `sql:po:${txt(r.grn_no)}`,
    id: `sql:po:${txt(r.grn_no)}`,
    purchaseNumber: txt(r.grn_no),
    vendorId: {
      _id: `sql-supplier:${txt(r.suplier_name)}`,
      businessName: txt(r.suplier_name),
      name: txt(r.suplier_name),
    },
    date: r.date,
    status: txt(r.statusText),
    statusCode: txt(r.POStatus),
    items: [],
    totalQuantity: num(r.OverAllQty),
    totalMeter: num(r.OverAllMtr),
    company: txt(r.cmy_name),
    salesman: txt(r.SalesMan),
    agent: txt(r.agent_name),
    incharge: txt(r.incharge),
    source: "sql",
  }));
}

export async function getSqlPurchaseOrder(po: string) {
  const [h] = await sqlRead(
    "SELECT TOP 1 * FROM dbo.[POHeader] WHERE LTRIM(RTRIM(grn_no))=@p",
    { p: po.replace(/^sql:po:/, "") },
  );
  if (!h) return undefined;
  const lines = await sqlRead(
    "SELECT * FROM dbo.[PODetails] WHERE LTRIM(RTRIM(grn_no))=@p ORDER BY TRY_CAST(sl_no AS int), ID",
    { p: txt(h.grn_no) },
  );
  return {
    _id: `sql:po:${txt(h.grn_no)}`,
    id: `sql:po:${txt(h.grn_no)}`,
    purchaseNumber: txt(h.grn_no),
    vendorId: {
      _id: `sql-supplier:${txt(h.suplier_name)}`,
      businessName: txt(h.suplier_name),
      name: txt(h.suplier_name),
    },
    date: h.date,
    status:
      Number(h.POStatus) === 1
        ? "CANCELLED"
        : Number(h.POStatus) === 2
          ? "EDIT"
          : "ACTIVE",
    company: txt(h.cmy_name),
    salesman: txt(h.SalesMan),
    agent: txt(h.agent_name),
    incharge: txt(h.incharge),
    totalQuantity: num(h.OverAllQty),
    totalMeter: num(h.OverAllMtr),
    items: lines.map((r) => ({
      productId: txt(r.code),
      productName: txt(r.pname),
      quantity: num(r.qty),
      freeQty: num(r.fqty),
      rate: num(r.prate),
      sellingPrice: num(r.mrp),
      amount: num(r.amount),
      taxPercent: num(r.gst_per),
      taxAmount: num(r.gst_amount),
      discountAmount: num(r.dis_amount),
      brand: txt(r.brand),
      design: txt(r.design),
      pattern: txt(r.patrn),
      size: txt(r.size),
      color: txt(r.color),
      style: txt(r.style),
      barcode: txt(r.barcode),
      lotNumber: txt(r.grn_no),
      receivedQty: num(r.receivqty),
      receivedEntryQty: num(r.receiventryqty),
      returnQty: num(r.returnqty),
      shortQty: num(r.shortqty),
      excessQty: num(r.excessqty),
      unitId: txt(r.unit_details),
    })),
    source: "sql",
  };
}

/** Textilesoft's POStatus values. */
const PO_STATUS: Record<string, string> = { ACTIVE: "0", CANCELLED: "1", EDIT: "2" };

/**
 * ERP status -> POStatus. Only Textilesoft's own three exist in its tables; anything else (SUBMITTED,
 * APPROVED, Billed ...) or a missing status is refused instead of silently re-activating the PO.
 */
export function poStatusCode(status: unknown): string {
  const s = txt(status).toUpperCase();
  const code = PO_STATUS[s === "CANCELED" ? "CANCELLED" : s];
  if (!code)
    throw new SqlWriteError(
      s
        ? `Textilesoft purchase orders are only Active, Cancelled or Edit; "${txt(status)}" can't be stored.`
        : "Send the new status (ACTIVE, CANCELLED or EDIT).",
      400,
    );
  return code;
}

export async function updateSqlPurchaseOrderStatus(po: string, status: unknown) {
  const code = poStatusCode(status);
  await withSqlTransaction("Updating purchase order status", async (tx) => {
    const n = await tx.update(
      "POHeader",
      { POStatus: code },
      { grn_no: po.replace(/^sql:po:/, "") },
    );
    if (!n) throw new SqlWriteError("Purchase order not found.", 404);
  });
  return getSqlPurchaseOrder(po);
}

export async function deleteSqlPurchaseOrder(po: string) {
  const key = po.replace(/^sql:po:/, "");
  await withSqlTransaction("Deleting purchase order", async (tx) => {
    const rows = await tx.query(
      "SELECT TOP 1 POStatus FROM dbo.[POHeader] WHERE grn_no=@p",
      { p: key },
    );
    if (!rows.length) throw new SqlWriteError("Purchase order not found.", 404);
    const used = await tx.query(
      // receivqty / receiventryqty are varchar: compare as numbers without failing on "2.5" or "".
      "SELECT TOP 1 1 AS x FROM dbo.[PODetails] WHERE LTRIM(RTRIM(grn_no)) = @p AND (ISNULL(TRY_CAST(receivqty AS float), 0) <> 0 OR ISNULL(TRY_CAST(receiventryqty AS float), 0) <> 0)",
      { p: key },
    );
    if (used.length)
      throw new SqlWriteError(
        "Received purchase orders cannot be deleted; cancel the PO instead.",
        409,
      );
    await tx.remove("PODetails", { grn_no: key });
    await tx.remove("POHeader", { grn_no: key });
  });
}

/** Receipt fields: ERP name(s) -> PODetails column. */
const RECEIPT_QTY: [string[], string, string][] = [
  [["receivedQty", "receivqty"], "receivqty", "Received qty"],
  [["receivedEntryQty", "receiventryqty"], "receiventryqty", "Received entry qty"],
  [["returnQty", "returnqty"], "returnqty", "Return qty"],
  [["shortQty", "shortqty"], "shortqty", "Short qty"],
  [["excessQty", "excessqty"], "excessqty", "Excess qty"],
];

/**
 * The PODetails columns to change for a receipt update: only what was sent. When the received qty is
 * sent without short/excess, those are derived from the ordered qty (ordered 10, received 8 -> short 2).
 */
export function receiptChanges(input: Row, orderedQty: number): Row {
  const set: Row = {};
  const got: Record<string, number> = {};
  for (const [names, col, label] of RECEIPT_QTY) {
    const key = names.find((k) => input[k] !== undefined);
    if (key === undefined) continue;
    const n = optNum(input[key], label);
    if (n === undefined) continue;
    got[col] = n;
    set[col] = String(n);
  }
  if (got.receivqty !== undefined && got.shortqty === undefined && got.excessqty === undefined) {
    set.shortqty = String(Math.max(orderedQty - got.receivqty, 0));
    set.excessqty = String(Math.max(got.receivqty - orderedQty, 0));
  }
  if (input.receivedDate !== undefined) set.receivdate = dateText(input.receivedDate);
  if (input.receivedRefNo !== undefined) set.receivrefno = txt(input.receivedRefNo);
  if (input.checkedBy !== undefined) set.checkedby = txt(input.checkedBy);
  if (!Object.keys(set).length)
    throw new SqlWriteError("Nothing to update: send the received quantity or other receipt details.", 400);
  return set;
}

export async function updateSqlPurchaseOrderReceipt(
  po: string,
  lineNo: string,
  input: Row,
) {
  const key = po.replace(/^sql:po:/, "");
  await withSqlTransaction("Updating purchase order receipt", async (tx) => {
    const [h] = await tx.query(
      "SELECT TOP 1 POStatus FROM dbo.[POHeader] WHERE LTRIM(RTRIM(grn_no)) = @p",
      { p: key },
    );
    if (!h) throw new SqlWriteError("Purchase order not found.", 404);
    if (txt(h.POStatus) === "1")
      throw new SqlWriteError(`PO ${key} is cancelled; goods can't be received against it.`, 409);
    const [line] = await tx.query(
      "SELECT TOP 1 qty FROM dbo.[PODetails] WHERE LTRIM(RTRIM(grn_no)) = @p AND LTRIM(RTRIM(sl_no)) = @l",
      { p: key, l: txt(lineNo) },
    );
    if (!line) throw new SqlWriteError("PO line not found.", 404);
    const set = receiptChanges(input ?? {}, Number(txt(line.qty)) || 0);
    const n = await tx.update("PODetails", set, { grn_no: key, sl_no: txt(lineNo) });
    if (!n) throw new SqlWriteError("PO line not found.", 404);
  });
  return getSqlPurchaseOrder(po);
}
