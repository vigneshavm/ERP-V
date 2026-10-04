/**
 * ERP POS -> Textilesoft bills. Writes a POS bill into the shop database the way Textilesoft's own billing
 * does: one header row in dbo.sales2 and one row per line in dbo.salsntry, joined on
 * sysidandbill = systemidbill. Also reads the billing counters (dbo.countername) for the POS counter picker.
 *
 * The column conventions below were derived from Textilesoft's own recent bills (e.g. bill A95 of
 * 2 Jan 2026, SERVER counter), because Textilesoft's billing code is compiled and none of its stored
 * procedures or triggers write these tables:
 *   - billno       daily sequence per counter (bill_option: sys_bil_no_rest = DAILY), e.g. 95
 *   - mode         counter letter (countername.counter_mode) + billno, e.g. "A95"; Lmode = "K" + mode
 *   - sysidandbill counter serial (countername.sl_no) + DDMMYY + billno, e.g. "1" + "020126" + "95"
 *   - cmny_bill    company series (bill_option.cmny_mode, e.g. "DA") + running number, e.g. "DA142426"
 *   - amounts      GST-inclusive: amount = net_amount = qty * price; rate = price ex-GST;
 *                  tax = amount - gstcrossamt; cgst = sgst = tax / 2; header gst5/12/18/28 = tax per rate
 *   - status '0' = live bill ('1' = cancelled), SBillStatus '1', paymenttype '0'
 * Running line counters (count_IDBillno, comp_continu_billno, cmy_wo_continu_billno) continue from the
 * latest line; their exact meaning in Textilesoft is not documented, so they are best-effort.
 *
 * Writing is OFF unless TEXTILESOFT_POS_WRITE=on, and uses its own login (TEXTILESOFT_DB_WRITE_USER /
 * TEXTILESOFT_DB_WRITE_PASSWORD) because the ERP's normal login is read-only. Only columns that exist in
 * the target tables are written (checked against INFORMATION_SCHEMA at run time).
 */
import { getPool } from "./sqlItemSource.js";
import { info, warn } from "../../config/logger.js";
import { sqlWriter, tableColumns, SqlWriteError } from "./sqlWrite.js";
import { saleGstRate, posTenders, type SaleGstBasis, type TenderInput } from "./sqlPosRules.js";
import { calcBill, type CalcLimits } from "../../modules/sales/domain/salesCalc.js";

/** Error with an HTTP status: 400 = the bill itself is wrong (not retried), 503 = shop DB unavailable (retried). */
export class SqlPosError extends SqlWriteError {}

const onFlag = (v: string | undefined): boolean =>
  /^(1|true|on|yes)$/i.test((v ?? "").trim());

const listEnv = (v: string | undefined): string[] =>
  (v ?? "")
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);

/** TEXTILESOFT_POS_ALLOW_NEGATIVE_STOCK=on: bill barcodes even when stock says none are left. */
export const allowNegativeStock = (env: NodeJS.ProcessEnv = process.env): boolean =>
  onFlag(env.TEXTILESOFT_POS_ALLOW_NEGATIVE_STOCK);

export function isSqlPosWriteEnabled(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return onFlag(env.TEXTILESOFT_POS_WRITE);
}

export function saleSlabBasis(env: NodeJS.ProcessEnv = process.env): SaleGstBasis {
  return env.TEXTILESOFT_SLAB_BASIS?.trim().toLowerCase() === "legacy" ? "legacy" : "exGst";
}

// ------------------------------------------------------------------------------------------------
// Counters (read-only login)
// ------------------------------------------------------------------------------------------------

export interface SqlCounter {
  /** Textilesoft counter name, e.g. "SERVER" -- also the ERP counter id and the bill's systemname. */
  id: string;
  name: string;
  /** Bill-number letter, e.g. "A". */
  mode: string;
  /** Serial used as the first part of sysidandbill. */
  slNo: string;
}

export async function sqlCounters(): Promise<SqlCounter[]> {
  const req = (await getPool()).request();
  const res = await req.query(
    "SELECT sl_no, counter_name, counter_mode FROM dbo.[countername] WHERE NULLIF(LTRIM(RTRIM(counter_name)), '') IS NOT NULL ORDER BY TRY_CAST(sl_no AS int), sl_no",
  );
  const rows =
    (res as { recordset: Record<string, unknown>[] }).recordset ?? [];
  return rows.map((r) => {
    const id = String(r.counter_name ?? "").trim();
    return {
      id,
      name: id,
      mode: String(r.counter_mode ?? "").trim(),
      slNo: String(r.sl_no ?? "").trim(),
    };
  });
}

// ------------------------------------------------------------------------------------------------
// Writer pool (write login, no read-only intent)
// ------------------------------------------------------------------------------------------------

// Shared write pool + column lookup (sqlWrite.ts).
const writer = sqlWriter;
const columnsOf = tableColumns;

// ------------------------------------------------------------------------------------------------
// Bill
// ------------------------------------------------------------------------------------------------

export interface SqlPosLine {
  barcode: string;
  name: string;
  hsn?: string;
  group?: string;
  unit?: string;
  /** GST % the till used. For barcode lines the product's GST group decides (see below); this is only
   *  used when the product has no GST group in Textilesoft, and for Quick Entry lines. */
  gstRate: number;
  qty: number;
  /** Price per unit as charged to the customer, GST included. */
  unitPriceIncl: number;
  /** Set for GST-exclusive tills: price per unit before GST (the incl. price is then worked out here with
   *  the product's own rate, not the till's). */
  unitPriceExcl?: number;
  /** Product discount % on this line (legacy "product discount" box). Not for returned items. */
  pdisPct?: number;
  /** Salesman code for this line (legacy sls_man). Falls back to the bill-level code or "1". */
  salesmanCode?: string;
  /** Returned items only: the bill (number like "A96", or system id) the item was bought on. Needed when the
   *  barcode was sold at different prices. */
  returnFromBill?: string;
  /** Returned items only: exact source sale line No, supplied by the return-source picker. */
  returnFromLine?: number;
  /** Internal return allocation details filled by returnLine before persistence. */
  sourceSaleLineNo?: number;
  sourceSaleSysId?: string;
  /** Negative qty = an item the customer brings back (exchange). Its price, GST and name are taken from the
   *  barcode's sale -- what the customer paid -- never from the till. */
}

export interface SqlPosBill {
  counter: string;
  /** Login recorded on the bill (UserID), e.g. "ERP". */
  userId: string;
  customerName?: string;
  phone?: string;
  lines: SqlPosLine[];
  /** Bill-level discount (rupees), taken off the new items (not returned ones). */
  billDiscount: number;
  /** Flat post-tax bill less, distinct from the taxable bill discount. */
  billLess?: number;
  /** Optional default salesman code for the bill; each line may override it. */
  salesmanCode?: string;
  /** The user's discount limits (dbo.specialcondion). When given, a bill over a limit is refused. */
  limits?: CalcLimits;
  /** Tenders as given, or ... */
  payment?: { cash: number; card: number; upi: number; credit: number };
  /** ... how it was paid, worked out here on the bill's own total (posTenders). Takes precedence. */
  tenders?: Omit<TenderInput, "total">;
  idempotencyKey?: string;
  idempotencyScope?: string;
  requestHash?: string;
  /** Total the cashier explicitly accepted from the immediately preceding server preview. */
  expectedTotal?: number;
  /** Internal dry-run used by the checkout preview route; calculates using the same SQL data and rules. */
  previewOnly?: boolean;
}

export interface SqlPosPreview {
  counter: string;
  total: number;
  gross: number;
  productDiscount: number;
  billDiscount: number;
  billLess: number;
  roundOff: number;
  tax: number;
  gstByRate: Record<string, number>;
  lines: Array<{ name: string; barcode: string; qty: number; payable: number; gstRate: number; tax: number }>;
}

export interface SqlPosResult {
  /** Bill number as printed, e.g. "A96". */
  billNo: string;
  billno: number;
  sysidandbill: string;
  date: string;
  datetime: string;
  total: number;
  counter: string;
  /** Present only when writePosBillToSql is called in preview mode. */
  preview?: SqlPosPreview;
}

const r2 = (n: number): number => Math.round(n * 100) / 100;
const f2 = (n: number): string => r2(n).toFixed(2);
const whole = (n: number): string =>
  Number.isInteger(r2(n)) ? String(r2(n)) : f2(n);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Q = (text: string, params?: Record<string, unknown>) => Promise<Record<string, any>[]>;

const SALE_LINES_SQL = `SELECT l.[No], l.p_name, l.qty, l.amount, l.hdngst, l.gst_group, l.hsncode, l.hdnunit, l.ProGroupName,
            l.systemidbill, l.gstcrossamt, l.tax, l.net_amount, l.pdis_amount, h.mode, h.bill_less, h.date,
            (SELECT SUM(ISNULL(TRY_CAST(x.net_amount AS float), ISNULL(TRY_CAST(x.amount AS float), 0))) FROM dbo.[salsntry] x
              WHERE x.systemidbill = l.systemidbill AND ISNULL(TRY_CAST(x.qty AS float), 0) > 0) AS billNet,
            (SELECT SUM(ISNULL(TRY_CAST(x.gstcrossamt AS float), 0) + ISNULL(TRY_CAST(x.tax AS float), 0)) FROM dbo.[salsntry] x
              WHERE x.systemidbill = l.systemidbill AND ISNULL(TRY_CAST(x.qty AS float), 0) > 0) AS billPaid
       FROM dbo.[salsntry] l LEFT JOIN dbo.[sales2] h ON h.sysidandbill = l.systemidbill
      WHERE l.barcode = @b AND ISNULL(l.status, '') <> '1' AND ISNULL(TRY_CAST(l.qty AS float), 0) > 0
      ORDER BY l.[No] ASC`;

/**
 * What the customer paid per piece on each sale line of a barcode (oldest first), and what is still open on it.
 * Earlier returns aren't linked to a sale line in the shop's data, so they are taken off the oldest sales first.
 */
function saleCandidates(sales: Record<string, any>[], alreadyBack: number) {
  const num = (v: unknown): number => Number(String(v ?? "").trim()) || 0;
  let consumed = alreadyBack;
  return sales.map((s) => {
    const soldQty = num(s.qty) || 1;
    const amount = num(s.amount);
    const hasTax = String(s.gstcrossamt ?? "").trim() !== "" && String(s.tax ?? "").trim() !== "";
    let paid = hasTax ? num(s.gstcrossamt) + num(s.tax) : num(s.net_amount) || amount;
    // Old Textilesoft bills: a flat "less" after GST isn't in the line's taxable value. Detect it (the bill's
    // lines add up to the bill's net, not net - less) and share it by amount.
    const billLess = num(s.bill_less);
    const billNet = num(s.billNet);
    if (billLess > 0 && billNet > 0 && (!hasTax || Math.abs(num(s.billPaid) - billNet) < 0.5))
      paid -= (billLess * (num(s.net_amount) || amount)) / billNet;
    const take = Math.min(soldQty, consumed);
    consumed -= take;
    return { row: s, soldQty, remaining: soldQty - take, paidEach: r2(paid / soldQty), gst: num(s.hdngst) };
  });
}

/**
 * These capabilities require compatible existing storage. Never create or repair tables here;
 * unsupported submission/allocation is rejected rather than silently losing its protection.
 */
const erpTableState = new Map<string, { at: number; exists: boolean }>();
let warnedNoIdempotency = false;
async function erpTableExists(q: Q, name: "sales_idempotency" | "sales_return_allocation"): Promise<boolean> {
  const hit = erpTableState.get(name);
  if (hit && Date.now() - hit.at < 60_000) return hit.exists;
  const [row] = await q("SELECT OBJECT_ID(@n) AS id", { n: `erp.${name}` });
  const required = name === "sales_idempotency"
    ? ["scope", "idempotency_key", "request_hash", "sysidandbill", "billno", "mode", "counter_name", "total_amount", "bill_datetime"]
    : ["source_sysidandbill", "source_sale_line_no", "return_sysidandbill", "return_sale_line_no", "barcode", "quantity", "paid_amount", "gst_rate"];
  const columns = row?.id != null
    ? await q("SELECT name FROM sys.columns WHERE object_id = OBJECT_ID(@n)", { n: `erp.${name}` })
    : [];
  const verified = new Set(columns.map(column => String(column.name).toLowerCase()));
  const exists = row?.id != null && required.every(column => verified.has(column));
  if (!exists && (!hit || hit.exists))
    warn(`[sql-pos] erp.${name} compatible columns were not verified -- ${name === "sales_idempotency" ? "protected bill submission is unavailable" : "source-line return allocation is unavailable"}.`);
  erpTableState.set(name, { at: Date.now(), exists });
  return exists;
}

async function returnAllocations(q: Q, barcode: string): Promise<Map<number, number>> {
  if (!(await erpTableExists(q, "sales_return_allocation"))) {
    throw new SqlPosError(
      "SQL return allocation is unavailable: verified existing source-line allocation storage is required.",
      503,
      "SQL_RETURN_ALLOCATION_UNAVAILABLE",
    );
  }
  const rows = await q(
    `SELECT source_sale_line_no, SUM(quantity) AS returned_qty
       FROM erp.sales_return_allocation WHERE barcode=@b
      GROUP BY source_sale_line_no`,
    { b: barcode },
  );
  return new Map(rows.map((row) => [Number(row.source_sale_line_no), Number(row.returned_qty) || 0]));
}

export interface ReturnSource {
  /** Bill number as printed, e.g. "A96". */
  bill: string;
  sourceLineNo: number;
  date: string;
  qtySold: number;
  qtyRemaining: number;
  /** Paid per piece, GST included, after that line's discounts. */
  paidEach: number;
  gst: number;
}

/** The bills a barcode was sold on, for the POS "bought on bill" picker (newest first). */
export async function listReturnSources(barcode: string): Promise<{ name: string; open: number; sources: ReturnSource[] }> {
  const b = barcode.trim();
  const pool = await getPool();
  const run = async (text: string): Promise<Record<string, any>[]> => {
    const req = pool.request();
    req.input("b", b);
    const res = await req.query(text);
    return (res as { recordset: Record<string, any>[] }).recordset ?? [];
  };
  const sales = await run(SALE_LINES_SQL);
  const [c] = await run(
    `SELECT SUM(CASE WHEN q > 0 THEN q ELSE 0 END) AS sold, SUM(CASE WHEN q < 0 THEN -q ELSE 0 END) AS back
       FROM (SELECT ISNULL(TRY_CAST(qty AS float), 0) AS q FROM dbo.[salsntry]
              WHERE barcode = @b AND ISNULL(status, '') <> '1') t`,
  );
  const allocations = await returnAllocations(run, b);
  const exactReturned = [...allocations.values()].reduce((sum, qty) => sum + qty, 0);
  const legacyReturned = Math.max(0, (Number(c?.back ?? 0) || 0) - exactReturned);
  const cand = saleCandidates(sales, legacyReturned).map((candidate) => ({
    ...candidate,
    remaining: Math.max(0, candidate.remaining - (allocations.get(Number(candidate.row.No)) || 0)),
  }));
  return {
    name: String(sales[0]?.p_name ?? "").trim(),
    open: r2(Number(c?.sold ?? 0) - Number(c?.back ?? 0)),
    sources: cand
      .map((x) => ({
        bill: String(x.row.mode ?? "").trim() || String(x.row.systemidbill ?? "").trim(),
        sourceLineNo: Number(x.row.No),
        date: String(x.row.date ?? "").trim(),
        qtySold: x.soldQty,
        qtyRemaining: x.remaining,
        paidEach: x.paidEach,
        gst: x.gst,
      }))
      .reverse(),
  };
}

/**
 * A returned item on an exchange bill. Found by barcode in the shop's sales:
 *   - price = what the customer actually paid per piece for THAT sale line: the line's taxable value + its GST
 *     (gstcrossamt + tax, which already carry the product discount and the bill-discount share given at the
 *     time of sale). A flat post-GST "bill less" on an old Textilesoft bill is shared over its lines by amount;
 *   - GST = that sale's rate (a return reverses the tax charged, whatever the product's rate is now);
 *   - the sale line is the one named by `returnFromBill` (bill number or system id); with none named, the
 *     oldest sale lines still open are used, and if they were paid different amounts the cashier must say
 *     which sale it came from (we never guess money);
 *   - quantity can't exceed what's been sold of the barcode minus what's already come back.
 * Textilesoft's own exchange lines have no barcode (stock never comes back); the ERP's do, so the piece
 * is back in stock (sold = sum of salsntry qty, returns included).
 */
async function returnLine(
  q: Q,
  l: SqlPosLine,
): Promise<SqlPosLine & { gst: number; groupName: string }> {
  const b = (l.barcode || "").trim();
  const back = Math.abs(Number(l.qty) || 0);
  if (!b)
    throw new SqlPosError(
      `Scan the barcode of the returned ${l.name || "item"} -- returns are matched to their sale by barcode.`,
      400,
    );
  const sales = await q(SALE_LINES_SQL, { b });
  if (!sales.length)
    throw new SqlPosError(`Barcode ${b} (${l.name || "item"}) has never been sold, so it can't be returned.`, 400);
  const [c] = await q(
    `SELECT SUM(CASE WHEN q > 0 THEN q ELSE 0 END) AS sold, SUM(CASE WHEN q < 0 THEN -q ELSE 0 END) AS back
       FROM (SELECT ISNULL(TRY_CAST(qty AS float), 0) AS q FROM dbo.[salsntry] WITH (UPDLOCK, HOLDLOCK)
              WHERE barcode = @b AND ISNULL(status, '') <> '1') t`,
    { b },
  );
  const alreadyBack = Number(c?.back ?? 0);
  const open = r2(Number(c?.sold ?? 0) - alreadyBack);
  const nameOf = String(sales[0].p_name ?? l.name).trim();
  if (back > open + 0.0001)
    throw new SqlPosError(
      open > 0
        ? `Only ${open} of ${nameOf} (barcode ${b}) can come back (sold minus already returned); ${back} on the bill.`
        : `${nameOf} (barcode ${b}) has already been returned.`,
      409,
    );

  const allocations = await returnAllocations(q, b);
  const exactReturned = [...allocations.values()].reduce((sum, qty) => sum + qty, 0);
  const legacyReturned = Math.max(0, alreadyBack - exactReturned);
  const cand = saleCandidates(sales, legacyReturned).map((candidate) => ({
    ...candidate,
    remaining: Math.max(0, candidate.remaining - (allocations.get(Number(candidate.row.No)) || 0)),
  }));
  const sourceLineNo = Number(l.returnFromLine) || 0;
  const want = String(l.returnFromBill ?? "").trim().toUpperCase();
  let pick: (typeof cand)[number];
  if (sourceLineNo) {
    const found = cand.find((candidate) => Number(candidate.row.No) === sourceLineNo);
    if (!found) throw new SqlPosError(`${nameOf} source sale line ${sourceLineNo} was not found.`, 400);
    pick = found;
    if (back > pick.remaining + 0.0001)
      throw new SqlPosError(`Only ${pick.remaining} of ${nameOf} remain returnable from the selected sale line.`, 409);
  } else if (want) {
    const f = cand.filter(
      (x) => String(x.row.mode ?? "").trim().toUpperCase() === want || String(x.row.systemidbill ?? "").trim().toUpperCase() === want,
    );
    if (!f.length)
      throw new SqlPosError(`${nameOf} (barcode ${b}) was not sold on bill ${l.returnFromBill}.`, 400);
    if (f.length > 1)
      throw new SqlPosError(`${nameOf} has multiple sale lines on bill ${l.returnFromBill}; select the specific source line.`, 409);
    pick = f[0];
    if (back > pick.remaining + 0.0001)
      throw new SqlPosError(`Only ${pick.remaining} of ${nameOf} remain returnable from bill ${l.returnFromBill}.`, 409);
  } else {
    const live = cand.filter((x) => x.remaining > 0.0001);
    const pool = live.length ? live : cand;
    const prices = new Set(pool.map((x) => `${x.paidEach}|${x.gst}`));
    if (prices.size > 1)
      throw new SqlPosError(
        `${nameOf} (barcode ${b}) was sold at different prices (${pool
          .map((x) => `${String(x.row.mode ?? "").trim() || x.row.systemidbill}: ₹${x.paidEach}`)
          .join(", ")}). Choose the bill it was bought on.`,
        409,
      );
    pick = pool[0];
  }
  const s = pick.row;
  return {
    ...l,
    name: String(s.p_name ?? l.name).trim() || l.name,
    hsn: String(s.hsncode ?? "").trim() || l.hsn,
    unit: String(s.hdnunit ?? "").trim() || l.unit,
    group: String(s.ProGroupName ?? "").trim() || l.group,
    qty: -back,
    unitPriceIncl: pick.paidEach,
    unitPriceExcl: undefined,
    returnFromBill: String(s.mode ?? s.systemidbill ?? ""),
    returnFromLine: Number(s.No),
    sourceSaleLineNo: Number(s.No),
    sourceSaleSysId: String(s.systemidbill ?? ""),
    gst: pick.gst,
    groupName: String(s.gst_group ?? "").trim() || `GST${pick.gst}`,
  };
}

export async function writePosBillToSql(
  bill: SqlPosBill,
): Promise<SqlPosResult> {
  if (!bill.lines.length) throw new SqlPosError("The bill has no lines.", 400);
  const counter = bill.counter.trim();
  if (!counter) throw new SqlPosError("Select a billing counter first.", 400);

  let w;
  try {
    w = await writer();
  } catch (err) {
    throw new SqlPosError(
      `Could not connect to the shop database for writing: ${(err as Error).message}`,
      503,
    );
  }
  const { mssql, pool } = w;
  const salesCols = await columnsOf(pool, "sales2");
  const lineCols = await columnsOf(pool, "salsntry");

  const tx = new mssql.Transaction(pool);
  await tx.begin();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const q = async (
    text: string,
    params: Record<string, unknown> = {},
  ): Promise<Record<string, any>[]> => {
    const req = new mssql.Request(tx);
    for (const [k, v] of Object.entries(params)) req.input(k, v);
    const res = await req.query(text);
    return res.recordset ?? [];
  };

  try {
    const useIdempotency = !!bill.idempotencyKey && !bill.previewOnly && (await erpTableExists(q, "sales_idempotency"));
    if (!bill.previewOnly && !useIdempotency && !warnedNoIdempotency) {
      // Owner's choice: bill without erp.sales_idempotency (that table does not exist in SSS_copy and may not be
      // created). Consequence: a retried request can save the same bill twice -- the till must not auto-retry.
      warnedNoIdempotency = true;
      console.warn("[sql-pos] erp.sales_idempotency is missing: bills are saved without duplicate-request protection.");
    }
    const [prior] = useIdempotency
      ? await q(
          `SELECT request_hash, sysidandbill, billno, mode, counter_name, total_amount, bill_datetime
             FROM erp.sales_idempotency WITH (UPDLOCK, HOLDLOCK)
            WHERE scope=@scope AND idempotency_key=@key`,
          { scope: bill.idempotencyScope, key: bill.idempotencyKey },
        )
      : [];
    if (prior) {
      if (String(prior.request_hash) !== bill.requestHash)
        throw new SqlPosError("This Idempotency-Key was already used for a different bill request.", 409);
      await tx.commit();
      return {
        billNo: String(prior.mode),
        billno: Number(prior.billno),
        sysidandbill: String(prior.sysidandbill),
        date: String(prior.bill_datetime).slice(0, 10),
        datetime: String(prior.bill_datetime),
        total: Number(prior.total_amount),
        counter: String(prior.counter_name),
      };
    }
    // 1. Counter + company numbering rules.
    const [ctr] = await q(
      "SELECT TOP 1 sl_no, counter_mode FROM dbo.[countername] WHERE LTRIM(RTRIM(counter_name)) = @c",
      { c: counter },
    );
    if (!ctr)
      throw new SqlPosError(
        `Counter "${counter}" is not in Textilesoft's counter list (dbo.countername).`,
        400,
      );
    const letter = String(ctr.counter_mode ?? "").trim();
    const serial = String(ctr.sl_no ?? "").trim();
    if (!letter || !serial)
      throw new SqlPosError(
        `Counter "${counter}" has no bill letter or serial in dbo.countername.`,
        400,
      );

    const wantCompany = (process.env.TEXTILESOFT_POS_COMPANY || "").trim();
    const companies = await q(
      "SELECT cmny_name, cmny_mode, sys_name FROM dbo.[bill_option] WHERE NULLIF(LTRIM(RTRIM(cmny_mode)), '') IS NOT NULL ORDER BY slno",
    );
    const company =
      companies.find(
        (c) =>
          String(c.sys_name).trim() === counter &&
          (!wantCompany || String(c.cmny_name).trim() === wantCompany),
      ) ??
      companies.find(
        (c) => !wantCompany || String(c.cmny_name).trim() === wantCompany,
      ) ??
      companies[0];
    const companyName = String(company?.cmny_name ?? wantCompany).trim();
    const companyPrefix = String(company?.cmny_mode ?? "").trim();

    // 2. Server date/time (the shop's clock, same as Textilesoft).
    const [now] = await q(
      "SELECT CONVERT(varchar(10), CAST(GETDATE() AS date), 23) AS d, CONVERT(varchar(6), GETDATE(), 12) AS yymmdd, GETDATE() AS dt",
    );
    const d: string = now.d; // YYYY-MM-DD
    const yymmdd: string = now.yymmdd;
    const ddmmyy = yymmdd.slice(4, 6) + yymmdd.slice(2, 4) + yymmdd.slice(0, 2);

    // 2b. Counter in use by Textilesoft's desktop today? Its billing reads MAX(billno) without a lock, so
    //     the ERP and the desktop billing on one counter can both take the same bill number. Refuse a counter
    //     the desktop has billed on today unless it's listed in TEXTILESOFT_POS_SHARED_COUNTERS.
    if (!listEnv(process.env.TEXTILESOFT_POS_SHARED_COUNTERS).includes(counter.toUpperCase())) {
      const [desk] = await q(
        `SELECT TOP 1 mode, CONVERT(varchar(5), [datetime], 108) AS t, LTRIM(RTRIM(ISNULL(UserID, ''))) AS u
           FROM dbo.[sales2] WHERE LTRIM(RTRIM(systemname)) = @c AND [date] = CAST(@d AS date)
            AND LTRIM(RTRIM(ISNULL(UserID, ''))) <> @u ORDER BY [datetime] DESC`,
        { c: counter, d, u: bill.userId },
      );
      if (desk)
        throw new SqlPosError(
          `Counter ${counter} is billing in Textilesoft today (bill ${String(desk.mode).trim()}${desk.t ? ` at ${desk.t}` : ""}${desk.u ? ` by ${desk.u}` : ""}). ` +
            `Bill from a counter the desktop isn't using, so the two can't take the same bill number.`,
          409,
        );
    }

    // 2c. Stock: a barcode can't be sold more times than it's in stock (received - sold - returned to the
    //     supplier), the same figure the stock reports show. The line rows are locked until commit so two tills
    //     can't sell the last piece twice. TEXTILESOFT_POS_ALLOW_NEGATIVE_STOCK=on turns this off.
    // 2c'. A barcode whose purchase line was cancelled (purentrydetails.STATUS = '1') can't be sold.
    for (const l of bill.lines) {
      const b = (l.barcode || "").trim();
      if (!b || !((Number(l.qty) || 0) > 0)) continue;
      const [cx] = await q(
        "SELECT TOP 1 1 AS x FROM dbo.[purentrydetails] WHERE barcode = @b AND STATUS = '1'",
        { b },
      );
      if (cx)
        throw new SqlPosError(`${l.name} (barcode ${b}) is a cancelled barcode and can't be sold.`, 409);
    }
    if (!allowNegativeStock()) {
      const want = new Map<string, { qty: number; name: string }>();
      for (const l of bill.lines) {
        const b = (l.barcode || "").trim();
        if (!b) continue; // Quick Entry lines have no barcode (no stock to check)
        if (!((Number(l.qty) || 0) > 0)) continue; // returned items come back, they don't go out
        const cur = want.get(b) ?? { qty: 0, name: l.name };
        cur.qty += Number(l.qty) || 0;
        want.set(b, cur);
      }
      for (const [b, w] of want) {
        const [st] = await q(
          `SELECT
             (SELECT ISNULL(SUM(ISNULL(TRY_CAST(qty AS float), 0) + ISNULL(TRY_CAST(fqty AS float), 0)), 0)
                FROM dbo.[purentrydetails] WHERE barcode = @b AND STATUS IS NULL) AS received,
             (SELECT ISNULL(SUM(ISNULL(TRY_CAST(qty AS float), 0)), 0)
                FROM dbo.[salsntry] WITH (UPDLOCK, HOLDLOCK) WHERE barcode = @b AND ISNULL(status, '') <> '1') AS sold,
             (SELECT ISNULL(SUM(ISNULL(TRY_CAST(qty AS float), 0)), 0) FROM dbo.[PurchaseReturnDetails] WHERE barcode = @b)
             + (SELECT ISNULL(SUM(ISNULL(TRY_CAST(qty AS float), 0)), 0) FROM dbo.[purretrun] WHERE barcode = @b) AS returned`,
          { b },
        );
        const left = r2(Number(st?.received ?? 0) - Number(st?.sold ?? 0) - Number(st?.returned ?? 0));
        if (w.qty > left + 0.0001)
          throw new SqlPosError(
            left > 0
              ? `Only ${left} of ${w.name} (barcode ${b}) in stock; ${w.qty} on the bill.`
              : `${w.name} (barcode ${b}) is out of stock (already sold or returned to the supplier).`,
            409,
          );
      }
    }

    // 3. Next numbers. UPDLOCK + HOLDLOCK keeps two tills from taking the same number until commit.
    const [nb] = await q(
      "SELECT ISNULL(MAX(billno), 0) + 1 AS n FROM dbo.[sales2] WITH (UPDLOCK, HOLDLOCK) WHERE LTRIM(RTRIM(systemname)) = @c AND [date] = CAST(@d AS date)",
      { c: counter, d },
    );
    const billno = Number(nb.n);
    const mode = `${letter}${billno}`;
    const sysid = `${serial}${ddmmyy}${billno}`;

    const [dup] = await q(
      "SELECT TOP 1 1 AS x FROM dbo.[sales2] WITH (UPDLOCK, HOLDLOCK) WHERE sysidandbill = @k",
      { k: sysid },
    );
    if (dup)
      throw new SqlPosError(
        `Bill key ${sysid} already exists; try again.`,
        503,
      );

    const [lastLine] = await q(
      "SELECT TOP 1 cmny_bill, count_IDBillno, comp_continu_billno, cmy_wo_continu_billno FROM dbo.[salsntry] WITH (UPDLOCK, HOLDLOCK) " +
        (companyPrefix ? "WHERE cmny_bill LIKE @p + '%' " : "") +
        "ORDER BY [No] DESC",
      companyPrefix ? { p: companyPrefix } : {},
    ).catch(async () =>
      // Older copies without the running-counter columns.
      q(
        "SELECT TOP 1 cmny_bill FROM dbo.[salsntry] WITH (UPDLOCK, HOLDLOCK) " +
          (companyPrefix ? "WHERE cmny_bill LIKE @p + '%' " : "") +
          "ORDER BY [No] DESC",
        companyPrefix ? { p: companyPrefix } : {},
      ),
    );
    const lastCmnyNo =
      Number(String(lastLine?.cmny_bill ?? "").slice(companyPrefix.length)) ||
      0;
    const cmnyBill = companyPrefix ? `${companyPrefix}${lastCmnyNo + 1}` : "";
    const nextOf = (v: unknown): number | undefined =>
      Number.isFinite(Number(v)) && v !== null && v !== undefined
        ? Number(v) + 1
        : undefined;

    // 4a. GST rate per line from the product's GST group in Textilesoft (as its own bills record: GST5 -> 5%,
    //     GST18 -> 18%; slab groups by the piece's value), not from the till. The till's rate is only used
    //     when the product has no group (and for Quick Entry lines, which have no product).
    const gstGroups = new Map<string, Record<string, unknown>>();
    for (const g of await q("SELECT * FROM dbo.[gstgroup]"))
      gstGroups.set(String(g.gst_name ?? "").trim().toUpperCase(), g);
    const priced: (SqlPosLine & { gst: number; groupName: string })[] = [];
    const lineGstGroups: (Record<string, unknown> | undefined)[] = [];
    const slabBasis = saleSlabBasis();
    for (const raw of bill.lines) {
      // 4a'. Returned item (exchange): refund what the customer paid for this barcode, at that bill's GST.
      if ((Number(raw.qty) || 0) < 0) {
        priced.push(await returnLine(q, raw));
        lineGstGroups.push(undefined);
        continue;
      }
      const l = raw;
      let groupName = "";
      let gst = Number(l.gstRate) || 0;
      let gstGroup: Record<string, unknown> | undefined;
      const b = (l.barcode || "").trim();
      if (b) {
        const [pg] = await q(
          `SELECT TOP 1 LTRIM(RTRIM(n.gst_group)) AS pg, LTRIM(RTRIM(d.pro_group_name)) AS dg
             FROM dbo.[purentrydetails] d
             LEFT JOIN dbo.[newproduct] n ON LTRIM(RTRIM(n.code)) = LTRIM(RTRIM(d.code))
            WHERE d.barcode = @b ORDER BY d.ID DESC`,
          { b },
        );
        // The product master's current group first (a rate change applies to stock already bought).
        for (const name of [pg?.pg, pg?.dg]) {
          const row = gstGroups.get(String(name ?? "").trim().toUpperCase());
          if (row) {
            gstGroup = row;
            groupName = String(row.gst_name ?? "").trim();
            gst =
              l.unitPriceExcl !== undefined
                ? saleGstRate(row, l.unitPriceExcl, true)
                : saleGstRate(row, l.unitPriceIncl);
            break;
          }
        }
      }
      // GST-exclusive tills: the customer pays price + the product's GST.
      const unitPriceIncl =
        l.unitPriceExcl !== undefined ? r2(l.unitPriceExcl * (1 + gst / 100)) : l.unitPriceIncl;
      priced.push({ ...l, gst, groupName, unitPriceIncl });
      lineGstGroups.push(gstGroup);
    }

    // 4b. Calculate discount shares using the current rate, then let legacy slab groups select a rate
    // from the per-unit GST-inclusive price after both product and allocated bill discounts.
    const calcInput = {
      lines: priced.map((l) => ({
        qty: l.qty,
        mrp: l.unitPriceIncl,
        gstRate: l.gst,
        unit: /^(MTR|METER|METRE)$/i.test(String(l.unit || "PCS").trim()) ? "MTR" as const : "PCS" as const,
        pdisPct: l.pdisPct,
      })),
      billDiscAmt: bill.billDiscount,
      billLess: bill.billLess,
      limits: bill.limits,
      rateRounding: "legacy" as const,
    };
    const firstCalc = calcBill(calcInput);
    let calc = firstCalc;
    if (slabBasis === "legacy") {
      priced.forEach((line, index) => {
        const group = lineGstGroups[index];
        const qty = Number(line.qty) || 0;
        if (!group || qty <= 0 || !line.barcode || !Number.isFinite(qty)) return;
        const selected = saleGstRate(
          group,
          firstCalc.lines[index].payable / qty,
          false,
          "legacy",
        );
        line.gst = selected;
        if (line.unitPriceExcl !== undefined)
          line.unitPriceIncl = r2(line.unitPriceExcl * (1 + selected / 100));
      });
      calc = calcBill({
        ...calcInput,
        lines: priced.map((l, index) => ({ ...calcInput.lines[index], mrp: l.unitPriceIncl, gstRate: l.gst })),
      });
    }

    // 4c. Amounts, Textilesoft style (GST-inclusive), from the shared calculation (salesCalc.ts): product
    //     discount per line, the bill discount shared over the lines that may take it, GST on each line's
    //     discounted amount (header GST = sum of line tax), returned items refunded at what was paid, the
    //     total a whole rupee. Line `amount` stays the gross (undiscounted) amount, as Textilesoft's lines do.
    if (calc.warnings.length) throw new SqlPosError(calc.warnings.join(" "), 400);
    const gross = calc.gross;
    const discount = calc.billDiscount;
    const lines = priced.map((l, i) => {
      const c = calc.lines[i];
      return {
        ...l,
        srl: i + 1,
        amount: c.amount,
        net: c.net,
        pdisAmt: c.pdisAmt,
        billDisAmt: c.billDisAmt,
        pdis: c.pdisPct,
        gst: c.gstRate,
        cross: c.gstcrossamt,
        tax: c.gst,
        half: c.cgst,
        rate: c.rate,
      };
    });
    // Negative when returned items are worth more than the new ones: money goes back (see posTenders).
    const total = calc.payable;
    if (!bill.previewOnly && bill.expectedTotal !== undefined &&
        (!Number.isFinite(bill.expectedTotal) || Math.abs(total - bill.expectedTotal) >= 0.01)) {
      throw new SqlPosError(
        `The bill total changed from the previewed ₹${r2(bill.expectedTotal)} to ₹${total}. Preview the bill again before saving.`,
        409,
      );
    }
    const payment = bill.tenders
      ? posTenders({ ...bill.tenders, total })
      : bill.payment ?? { cash: 0, card: 0, upi: 0, credit: 0 };
    // tot_qty counts the items going out, as Textilesoft's exchange bills do (A74: 3 sold + 1 back -> 3).
    const qty = lines.reduce((s, l) => s + Math.max(0, l.qty), 0);
    const taxAt = (rate: number) =>
      f2(lines.filter((l) => l.gst === rate).reduce((s, l) => s + l.tax, 0));

    if (bill.previewOnly) {
      await tx.commit();
      return {
        billNo: "",
        billno: 0,
        sysidandbill: "",
        date: d,
        datetime: String(now.dt),
        total,
        counter,
        preview: {
          counter,
          total,
          gross,
          productDiscount: calc.productDiscount,
          billDiscount: discount,
          billLess: calc.billLess,
          roundOff: calc.roundOff,
          tax: r2(lines.reduce((sum, line) => sum + line.tax, 0)),
          gstByRate: calc.gstByRate,
          lines: lines.map((line) => ({
            name: line.name,
            barcode: line.barcode,
            qty: line.qty,
            payable: r2(line.net - line.billDisAmt),
            gstRate: line.gst,
            tax: line.tax,
          })),
        },
      };
    }

    const [ts] = await q("SELECT CONVERT(varchar(19), @dt, 126) AS iso", {
      dt: now.dt,
    });

    // 5. Insert header.
    const insert = async (
      table: string,
      cols: Set<string>,
      values: Record<string, unknown>,
    ) => {
      const keys = Object.keys(values).filter(
        (k) => cols.has(k) && values[k] !== undefined,
      );
      const params: Record<string, unknown> = {};
      keys.forEach((k, i) => {
        params[`v${i}`] = values[k];
      });
      await q(
        `INSERT INTO dbo.[${table}] (${keys.map((k) => `[${k}]`).join(", ")}) VALUES (${keys.map((_, i) => `@v${i}`).join(", ")})`,
        params,
      );
    };
    const nextNo = async (
      table: string,
      cols: Set<string>,
    ): Promise<number | undefined> => {
      if (!cols.has("No")) return undefined; // identity (or absent): SQL Server assigns it
      const [m] = await q(
        `SELECT ISNULL(MAX([No]), 0) + 1 AS n FROM dbo.[${table}] WITH (UPDLOCK, HOLDLOCK)`,
      );
      return Number(m.n);
    };

    await insert("sales2", salesCols, {
      No: await nextNo("sales2", salesCols),
      billno,
      mode,
      Lmode: `K${mode}`,
      date: d,
      datetime: now.dt,
      sysidandbill: sysid,
      systemname: counter,
      countername: counter,
      UserID: bill.userId,
      cus_name: bill.customerName || undefined,
      mbl_no: bill.phone || undefined,
      tot_qty: whole(qty),
      tot_netamnt: whole(total),
      notdislesamt: f2(gross),
      totnetsub: f2(gross),
      crs_amount: f2(total),
      CM_Amt: f2(total),
      upnet: whole(total),
      upsat: "0",
      bill_disc: discount ? f2(discount) : "0.00",
      bill_disc1: discount ? f2(discount) : "0.00",
      bill_less: bill.billLess ? f2(bill.billLess) : "0.00",
      bill_less1: bill.billLess ? f2(bill.billLess) : "0.00",
      roundoff: f2(calc.roundOff),
      gst5: taxAt(5),
      gst12: lines.some((l) => l.gst === 12) ? taxAt(12) : undefined,
      gst18: lines.some((l) => l.gst === 18) ? taxAt(18) : undefined,
      gst28: lines.some((l) => l.gst === 28) ? taxAt(28) : undefined,
      tmtr: f2(calc.totalMtr),
      pdisamtot: f2(calc.productDiscount),
      tot_pdis: calc.productDiscount ? f2(calc.productDiscount) : "0",
      paymenttype: "0",
      status: "0",
      SBillStatus: "1",
      s_recevied_cashamt: whole(payment.cash),
      s_card_amt: whole(payment.card),
      s_googlepay: whole(payment.upi),
      s_credit_amt: whole(payment.credit),
      s_selfamt: "0",
      s_balance_amt: "0",
    });

    // 6. Insert lines.
    // All lines of one bill share the bill-level running numbers (as in Textilesoft's own bills).
    const idBill = nextOf(lastLine?.count_IDBillno);
    const compNo = nextOf(lastLine?.comp_continu_billno);
    const cmyNo = nextOf(lastLine?.cmy_wo_continu_billno);
    for (const l of lines) {
      const returnLineNo = await nextNo("salsntry", lineCols);
      const salesmanCode = String(l.salesmanCode ?? bill.salesmanCode ?? "1").trim() || "1";
      await insert("salsntry", lineCols, {
        No: returnLineNo,
        srl_no: String(l.srl),
        sls_man: salesmanCode,
        barcode: l.barcode || "",
        p_name: l.name,
        PrintNameEng: l.name,
        rate: f2(l.rate),
        qty: whole(l.qty),
        amount: f2(l.amount),
        amt: f2(l.amount),
        pdis: l.pdis ? String(l.pdis) : undefined,
        pdis_amount: l.pdis ? f2(l.pdisAmt) : undefined,
        less: f2(l.billDisAmt),
        dis: f2(l.amount ? (l.billDisAmt / Math.abs(l.amount)) * 100 : 0),
        net_amount: f2(l.net - l.billDisAmt),
        pre_bill_amnt: f2(l.net - l.billDisAmt),
        upnet: f2(l.net - l.billDisAmt),
        tax: f2(l.tax),
        cgst: f2(l.half),
        sgst: f2(l.half),
        gstcrossamt: f2(l.cross),
        hdngst: String(l.gst),
        gst_group: l.groupName || `GST${l.gst}`,
        hsncode: l.hsn || undefined,
        hdnunit: /^(MTR|METER|METRE)$/i.test(String(l.unit || "PCS").trim()) ? "MTR" : (l.unit || "PCS").toUpperCase(),
        mrp: f2(l.unitPriceIncl), // price charged (incl. GST)
        upmrp: f2(l.unitPriceIncl),
        Sub_Mrp: f2(l.unitPriceIncl),
        c_Mrp: whole(l.unitPriceIncl),
        c_Amt: whole(l.amount),
        upsta: "0",
        bil_cl_qty: "0",
        EMIAMOUNT: "0",
        billno,
        mode,
        Lmode: `K${mode}`,
        date: d,
        SystemDate: d,
        LLDate: d,
        datetime: now.dt,
        systemidbill: sysid,
        systemname: counter,
        status: "0",
        UserID: bill.userId,
        cmnyname: companyName || undefined,
        company_name: companyName || undefined,
        cmny_bill: cmnyBill || undefined,
        ProGroupName: l.group || undefined,
        count_IDBillno: idBill,
        company_code: 0,
        comp_continu_billno: compNo,
        cmy_wo_continu_billno: cmyNo,
        cmy_wo_cont_idbillno: 0,
      });
      if (l.sourceSaleLineNo && (await erpTableExists(q, "sales_return_allocation"))) {
        if (!returnLineNo || !l.sourceSaleSysId)
          throw new SqlPosError("Could not link the returned line to its original sale line.", 503);
        await q(
          `INSERT INTO erp.sales_return_allocation
             (source_sysidandbill, source_sale_line_no, return_sysidandbill, return_sale_line_no,
              barcode, quantity, paid_amount, gst_rate)
           VALUES (@sourceSys, @sourceLine, @returnSys, @returnLine, @barcode, @quantity, @paid, @gst)`,
          {
            sourceSys: l.sourceSaleSysId,
            sourceLine: l.sourceSaleLineNo,
            returnSys: sysid,
            returnLine: returnLineNo,
            barcode: l.barcode,
            quantity: Math.abs(l.qty),
            paid: f2(Math.abs(l.cross) + Math.abs(l.tax)),
            gst: l.gst,
          },
        );
      }
    }

    if (useIdempotency) await q(
      `INSERT INTO erp.sales_idempotency
         (scope, idempotency_key, request_hash, sysidandbill, billno, mode, counter_name, total_amount, bill_datetime)
       VALUES (@scope, @key, @hash, @sysid, @billno, @mode, @counter, @total, @datetime)`,
      {
        scope: bill.idempotencyScope || `${bill.userId}:${counter}`,
        key: bill.idempotencyKey,
        hash: bill.requestHash || "",
        sysid,
        billno: String(billno),
        mode,
        counter,
        total: f2(total),
        datetime: String(ts?.iso ?? d),
      },
    );

    await tx.commit();
    info(
      `[sql-pos] wrote bill ${mode} (${sysid}) at ${counter}: ${lines.length} line(s), total ${total}`,
    );
    return {
      billNo: mode,
      billno,
      sysidandbill: sysid,
      date: d,
      datetime: String(ts?.iso ?? d),
      total,
      counter,
    };
  } catch (err) {
    await tx.rollback().catch(() => undefined);
    if (err instanceof SqlPosError) throw err;
    const msg = (err as Error).message || String(err);
    // Permission problems are a setup issue, not a bad bill -- but retrying won't help either.
    if (/permission|denied/i.test(msg)) {
      throw new SqlPosError(
        `The shop database refused the write (${msg}). Set TEXTILESOFT_DB_WRITE_USER/PASSWORD to a login that may insert into dbo.sales2 and dbo.salsntry.`,
        503,
      );
    }
    throw new SqlPosError(
      `Writing the bill to the shop database failed: ${msg}`,
      503,
    );
  }
}
