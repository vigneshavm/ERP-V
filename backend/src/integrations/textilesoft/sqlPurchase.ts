/**
 * Purchase / GRN entry written straight into Textilesoft's tables, the way its NewPurchaseentry screen does:
 *   purgrnentry      one header per GRN
 *   purentrydetails  one row per line; every line is its own barcode (one barcode = one purchase lot)
 *   stockdetails     a copy of each line (Textilesoft's stock is purchased qty from here minus sales/returns)
 * All three are written in ONE transaction, so a GRN is either saved completely or not at all.
 *
 * Formats, decoded from the shop's own data (SSS_copy, Sep 2026) and grndetail:
 *   GRN no.   grndetail.grn prefix of the company + running number: VJ114098 -> VJ114099, V13696 -> V13697
 *   barcode   <prefix><running number of the day>, prefix = first 2 digits of the reversed year + reversed month
 *             + reversed day + counter serial:  26/09/2026 -> "62"+"9"+"62"+"1" = 629621 -> 6296211, 6296212 ...
 *             barLen = prefix length. The number continues across GRNs and companies within the day.
 *   pratecode purchase rate enciphered with grndetail.pur_code (1-9 = letters 1-9, 0 = 10th, "." = 11th):
 *             750.00 with VSAPLMKTRNX -> KLNXNN
 *   sr_per    selling margin over purchase rate, from MRP less GST, rounded like Textilesoft (2 decimals)
 * Numbers are allocated inside the transaction under an update lock (sqlWrite.ts), so the ERP and Textilesoft
 * can't hand out the same GRN or barcode; a barcode that already exists anywhere is skipped.
 *
 * Shop conventions copied as-is: pay_type CASH, agent/incharge "0" when none, model = supplier name,
 * silver = product group, gold/diamond = company, invoce_amount = the supplier's invoice NUMBER.
 */
import {
  withSqlTransaction,
  sqlRead,
  SqlWriteError,
  tsDate,
  txt,
  type Row,
  type SqlTx,
} from "./sqlWrite.js";
import { findGrnBarcodeReferences, describeReferences } from "./sqlReferences.js";
import { warn, info } from "../../config/logger.js";

// ------------------------------------------------------------------------------------------------
// Pure helpers (exported for tests)
// ------------------------------------------------------------------------------------------------

export const r2 = (n: number): number =>
  Math.round((n + Number.EPSILON) * 100) / 100;
export const f2 = (n: number): string => r2(n).toFixed(2);
const whole = (n: number): string =>
  Number.isInteger(r2(n)) ? String(r2(n)) : f2(n);
const reverse = (s: string): string => s.split("").reverse().join("");

export type BarcodePart = "year" | "month" | "day";

/**
 * Order of the date parts in the barcode, from grndetail (year_pos / month_pos / date_pos). Default (and what the shop
 * uses today): year, month, day. Only what the shop's data proves is supported: reverse_con = Yes and *_con / month_gen
 * = No (decoded from SSS_copy, Oct 2026); any other setting is refused instead of guessed.
 */
export function barcodeOrder(row?: Row): BarcodePart[] {
  if (!row) return ["year", "month", "day"];
  const yes = (v: unknown) => /^yes$/i.test(txt(v));
  const settingsKeys = ["date_con", "month_con", "year_con", "month_gen"] as const;
  const odd = settingsKeys.filter((k) => yes(row[k]));
  if (odd.length || (txt(row.reverse_con) && !yes(row.reverse_con)))
    throw new SqlWriteError(
      `This company's barcode setting in Textilesoft (${odd.length ? odd.join(", ") + " = Yes" : "reverse_con = No"}) is not supported by the ERP yet. Create the purchase in Textilesoft.`,
      409,
      "BARCODE_SETTING_UNSUPPORTED",
    );
  const pos: [BarcodePart, number][] = [
    ["year", Number(txt(row.year_pos))],
    ["month", Number(txt(row.month_pos))],
    ["day", Number(txt(row.date_pos))],
  ];
  if (pos.some(([, n]) => !Number.isInteger(n)) || new Set(pos.map(([, n]) => n)).size !== 3 || pos.some(([, n]) => n < 1 || n > 3))
    return ["year", "month", "day"];
  return pos.sort((x, y) => x[1] - y[1]).map(([k]) => k);
}

/** Barcode date prefix: "62"+"9"+"62"+"1" for 26/09/2026 with counter serial 1 (parts reversed, in the configured order). */
export function barcodePrefix(d: Date, serial = "1", order: BarcodePart[] = ["year", "month", "day"]): string {
  const part: Record<BarcodePart, string> = {
    year: reverse(String(d.getFullYear())).slice(0, 2),
    month: reverse(String(d.getMonth() + 1)),
    day: reverse(String(d.getDate())),
  };
  return order.map((k) => part[k]).join("") + serial;
}

/** Purchase-rate cipher: digits 1..9 -> key[0..8], 0 -> key[9], "." -> key[10]. */
export function prateCode(prate: number, key: string): string {
  if (!key || key.length < 11) return "";
  return prate
    .toFixed(2)
    .replace(/[0-9.]/g, (c) =>
      c === "." ? key[10] : c === "0" ? key[9] : key[Number(c) - 1],
    );
}

export interface LineInput {
  productCode: string;
  qty: number;
  /** Metres per piece for metre items (amount = rate x qty x mtr). */
  mtr?: number;
  freeQty?: number;
  prate: number;
  mrp: number;
  discountPercent?: number;
  /** Purchase "less" amount taken off the line before discount. */
  less?: number;
  /** Overrides the product's GST group rate. */
  gstPercent?: number;
  hsnCode?: string;
  brand?: string;
  pattern?: string;
  size?: string;
  color?: string;
  style?: string;
  design?: string;
  rack?: string;
  fashion?: string;
  model?: string;
}

export interface LineMath {
  units: number;
  amount: number;
  plamt: number;
  disAmount: number;
  gstAmount: number;
  netAmount: number;
  nrate: number;
  srPer: number;
  srRate: number;
}

/** Textilesoft's purchase-line maths (NewPurchaseentryJS/Calc.js). */
export function lineMath(
  l: {
    qty: number;
    mtr?: number;
    prate: number;
    mrp: number;
    discountPercent?: number;
    less?: number;
  },
  gstPercent: number,
): LineMath {
  const units = l.mtr && l.mtr > 0 ? l.qty * l.mtr : l.qty;
  const amount = r2(l.prate * units);
  const plamt = r2(amount - (l.less ?? 0));
  const disAmount = r2((plamt * (l.discountPercent ?? 0)) / 100);
  const gstAmount = r2(((plamt - disAmount) * gstPercent) / 100);
  const netAmount = r2(plamt - disAmount + gstAmount);
  const nrate = units ? r2(netAmount / units) : 0;
  // Selling margin/rate exactly as Textilesoft's Calc.js computes them -- rate + rate x % / 100, then JavaScript
  // toFixed -- so the stored values match its own to the paisa (checked on 10 real rows: 750/800 -> 761.92).
  const fix = (n: number) => Number(n.toFixed(2));
  const srPer = l.prate
    ? fix(((l.mrp * 100) / (100 + gstPercent) / l.prate) * 100 - 100)
    : 0;
  const srRate = fix(l.prate + (l.prate * srPer) / 100);
  return {
    units,
    amount,
    plamt,
    disAmount,
    gstAmount,
    netAmount,
    nrate,
    srPer,
    srRate,
  };
}

/** GST % of a gstgroup row for a per-unit amount (Textilesoft's groups can have up to four slabs). */
export function gstForAmount(group: Row, amount: number): number {
  for (const s of ["", "1", "2", "3"]) {
    const gst = txt(group[`gst${s}`]);
    if (gst === "") continue;
    const from = Number(txt(group[`from_amount${s}`]) || 0);
    const to = Number(txt(group[`to_amount${s}`]) || Infinity);
    if (amount >= from && amount <= to) return Number(gst);
  }
  return Number(txt(group.gst) || 0);
}

// ------------------------------------------------------------------------------------------------
// Options for the entry screen
// ------------------------------------------------------------------------------------------------

export async function purchaseOptions() {
  const [companies, grn, warehouses, suppliers, agents, products, gstGroups] =
    await Promise.all([
      sqlRead(
        "SELECT LTRIM(RTRIM(cmy_name_eng)) AS name FROM dbo.[companydetail] ORDER BY TRY_CAST(cmy_cd AS int)",
      ),
      sqlRead(
        "SELECT LTRIM(RTRIM(cmy_name)) AS company, LTRIM(RTRIM(grn)) AS prefix FROM dbo.[grndetail]",
      ),
      sqlRead(
        "SELECT LTRIM(RTRIM(ware_name_eng)) AS name FROM dbo.[warehousedetail] WHERE NULLIF(LTRIM(RTRIM(ware_name_eng)), '') IS NOT NULL ORDER BY TRY_CAST(ware_cd AS int)",
      ),
      sqlRead(
        "SELECT LTRIM(RTRIM(sup_name)) AS name, MAX(LTRIM(RTRIM(ISNULL(NULLIF(city, ''), Address2)))) AS city FROM dbo.[supplierdetail] WHERE NULLIF(LTRIM(RTRIM(sup_name)), '') IS NOT NULL GROUP BY LTRIM(RTRIM(sup_name)) ORDER BY name",
      ),
      sqlRead(
        "SELECT LTRIM(RTRIM(eng_name)) AS name FROM dbo.[agentdetail] WHERE NULLIF(LTRIM(RTRIM(eng_name)), '') IS NOT NULL ORDER BY name",
      ),
      sqlRead(
        "SELECT LTRIM(RTRIM(code)) AS code, LTRIM(RTRIM(name)) AS name, LTRIM(RTRIM(unit_de)) AS unit, LTRIM(RTRIM(group_name)) AS grp, LTRIM(RTRIM(gst_group)) AS gstGroup, LTRIM(RTRIM(ProductHSNCode)) AS hsn, LTRIM(RTRIM(cmy_name)) AS company FROM dbo.[newproduct] WHERE NULLIF(LTRIM(RTRIM(name)), '') IS NOT NULL ORDER BY TRY_CAST(code AS int)",
      ),
      sqlRead("SELECT * FROM dbo.[gstgroup]"),
    ]);
  const prefix = new Map(
    grn.map((g) => [txt(g.company).toUpperCase(), txt(g.prefix)]),
  );
  return {
    companies: companies.map((c) => ({
      name: txt(c.name),
      grnPrefix: prefix.get(txt(c.name).toUpperCase()) ?? "",
    })),
    warehouses: warehouses.map((w) => txt(w.name)),
    suppliers: suppliers.map((s) => ({ name: txt(s.name), city: txt(s.city) })),
    agents: agents.map((a) => txt(a.name)),
    products: products.map((p) => ({
      code: txt(p.code),
      name: txt(p.name),
      unit: txt(p.unit),
      group: txt(p.grp),
      gstGroup: txt(p.gstGroup),
      hsnCode: txt(p.hsn),
      company: txt(p.company),
    })),
    gstGroups: gstGroups.map((g) => ({
      name: txt(g.gst_name),
      slabs: ["", "1", "2", "3"]
        .map((s) => ({
          from: Number(txt(g[`from_amount${s}`]) || 0),
          to: Number(txt(g[`to_amount${s}`]) || 0),
          gst: txt(g[`gst${s}`]),
        }))
        .filter((x) => x.gst !== "")
        .map((x) => ({ ...x, gst: Number(x.gst) })),
    })),
  };
}

// ------------------------------------------------------------------------------------------------
// Save
// ------------------------------------------------------------------------------------------------

export interface PurchaseInput {
  company: string;
  warehouse: string;
  supplier: string;
  agent?: string;
  incharge?: string;
  invoiceNo: string;
  invoiceDate?: string;
  /** Purchase (GRN) date, yyyy-mm-dd; today when empty. Also decides the barcodes. */
  date?: string;
  lines: LineInput[];
  /** Save even though this supplier's invoice number is already entered (the user confirmed). */
  allowDuplicateInvoice?: boolean;
}

export interface SavedPurchase {
  grnNo: string;
  date: string;
  lines: {
    slNo: number;
    barcode: string;
    productCode: string;
    productName: string;
    qty: number;
    prate: number;
    mrp: number;
    netAmount: number;
  }[];
  totals: { qty: number; amount: number; gst: number; net: number };
}

const num = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
};

function parseDate(s: string | undefined, label: string): Date {
  if (!s) {
    const t = new Date();
    return new Date(t.getFullYear(), t.getMonth(), t.getDate());
  }
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
  if (!m) throw new SqlWriteError(`${label} must be a date (yyyy-mm-dd).`, 400);
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

/** A date at midnight, as SQL datetime text (no timezone shift). */
const sqlDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T00:00:00`;

async function one(
  tx: SqlTx,
  text: string,
  params: Row,
  error: string,
  status = 400,
): Promise<Row> {
  const [r] = await tx.query(text, params);
  if (!r) throw new SqlWriteError(error, status);
  return r;
}

export async function createPurchase(
  input: PurchaseInput,
): Promise<SavedPurchase> {
  const company = txt(input.company).toUpperCase();
  const warehouse = txt(input.warehouse).toUpperCase();
  const supplier = txt(input.supplier).toUpperCase();
  const invoiceNo = txt(input.invoiceNo);
  const lines = Array.isArray(input.lines) ? input.lines : [];
  // Textilesoft's own messages.
  if (!invoiceNo) throw new SqlWriteError("Please Enter Invoice No..", 400);
  if (!lines.length)
    throw new SqlWriteError(
      "Empty Purchase not allowed. Please Enter Data...",
      400,
    );
  if (!company) throw new SqlWriteError("Select the company.", 400);
  if (!warehouse) throw new SqlWriteError("Select the warehouse.", 400);
  if (!supplier) throw new SqlWriteError("Select the supplier.", 400);
  const date = parseDate(input.date, "Purchase date");
  const invoiceDate = input.invoiceDate
    ? parseDate(input.invoiceDate, "Invoice date")
    : date;

  lines.forEach((l, i) => {
    const n = i + 1;
    if (!txt(l.productCode))
      throw new SqlWriteError(`Line ${n}: choose a product.`, 400);
    if (!(num(l.qty) > 0))
      throw new SqlWriteError(`Line ${n}: enter the quantity.`, 400);
    if (!(num(l.prate) > 0))
      throw new SqlWriteError(`Line ${n}: enter the purchase rate.`, 400);
    if (!(num(l.mrp) > 0))
      throw new SqlWriteError(`Line ${n}: Please Enter MRP..`, 400);
    if (num(l.mrp) < num(l.prate))
      throw new SqlWriteError(
        `Line ${n}: MRP (${l.mrp}) is below the purchase rate (${l.prate}).`,
        400,
      );
    for (const k of [
      "mtr",
      "freeQty",
      "discountPercent",
      "less",
      "gstPercent",
    ] as const) {
      if (l[k] !== undefined && l[k] !== null && !(num(l[k]) >= 0))
        throw new SqlWriteError(`Line ${n}: ${k} must be a number.`, 400);
    }
  });

  return withSqlTransaction("Saving the purchase", async (tx) => {
    await one(
      tx,
      "SELECT 1 AS ok FROM dbo.[companydetail] WHERE LTRIM(RTRIM(cmy_name_eng)) = @c",
      { c: company },
      `Company "${company}" is not in Textilesoft.`,
    );
    await one(
      tx,
      "SELECT 1 AS ok FROM dbo.[warehousedetail] WHERE LTRIM(RTRIM(ware_name_eng)) = @w",
      { w: warehouse },
      `Warehouse "${warehouse}" is not in Textilesoft.`,
    );
    const sup = await one(
      tx,
      "SELECT TOP 1 LTRIM(RTRIM(ISNULL(NULLIF(city, ''), Address2))) AS city FROM dbo.[supplierdetail] WHERE LTRIM(RTRIM(sup_name)) = @s",
      { s: supplier },
      `Supplier "${supplier}" is not in Textilesoft's supplier list.`,
    );
    // The same supplier bill entered twice doubles stock and the amount owed. Textilesoft doesn't check;
    // the ERP asks first (409 DUPLICATE_INVOICE) and saves only when the user confirms it's a different bill.
    if (!input.allowDuplicateInvoice) {
      const [dup] = await tx.query(
        `SELECT TOP 1 LTRIM(RTRIM(grn_no)) AS grn, entry_date FROM dbo.[purgrnentry]
          WHERE LTRIM(RTRIM(suplier_name)) = @s AND LTRIM(RTRIM(invoce_amount)) = @i ORDER BY entry_date DESC`,
        { s: supplier, i: invoiceNo },
      );
      if (dup) {
        const on =
          dup.entry_date instanceof Date
            ? ` on ${dup.entry_date.toISOString().slice(0, 10)}`
            : "";
        throw new SqlWriteError(
          `Invoice ${invoiceNo} of ${supplier} is already entered as GRN ${txt(dup.grn)}${on}. Save again only if this is a different bill.`,
          409,
          "DUPLICATE_INVOICE",
        );
      }
    }
    const agent = txt(input.agent).toUpperCase();
    if (agent)
      await one(
        tx,
        "SELECT 1 AS ok FROM dbo.[agentdetail] WHERE LTRIM(RTRIM(eng_name)) = @a",
        { a: agent },
        `Agent "${agent}" is not in Textilesoft.`,
      );
    const settings = await one(
      tx,
      "SELECT TOP 1 LTRIM(RTRIM(grn)) AS grn, LTRIM(RTRIM(pur_code)) AS purCode, LTRIM(RTRIM(sys_name)) AS sysName, date_con, date_pos, month_con, month_pos, year_con, year_pos, reverse_con, month_gen FROM dbo.[grndetail] WHERE LTRIM(RTRIM(cmy_name)) = @c",
      { c: company },
      `No GRN numbering is set up for ${company} in Textilesoft (grndetail).`,
    );
    const grnPrefix = txt(settings.grn);
    const [ctr] = await tx.query(
      "SELECT TOP 1 LTRIM(RTRIM(sl_no)) AS sl FROM dbo.[countername] WHERE LTRIM(RTRIM(counter_name)) = @n",
      { n: txt(settings.sysName) || "SERVER" },
    );
    const serial = txt(ctr?.sl) || "1";

    // Products (per company) + their GST groups.
    const codes = Array.from(new Set(lines.map((l) => txt(l.productCode))));
    const products = new Map<string, Row>();
    for (const code of codes) {
      const p = await one(
        tx,
        "SELECT TOP 1 * FROM dbo.[newproduct] WHERE LTRIM(RTRIM(code)) = @c AND LTRIM(RTRIM(cmy_name)) = @m",
        { c: code, m: company },
        `Product ${code} is not set up for ${company}.`,
      );
      products.set(code, p);
    }
    const gstGroups = new Map<string, Row>();
    for (const g of await tx.query("SELECT * FROM dbo.[gstgroup]"))
      gstGroups.set(txt(g.gst_name).toUpperCase(), g);

    // GRN number: company prefix + running number (locked until commit).
    const [g] = await tx.query(
      `SELECT MAX(TRY_CAST(SUBSTRING(grn_no, LEN(@p) + 1, 20) AS bigint)) AS n FROM dbo.[purgrnentry] WITH (UPDLOCK, HOLDLOCK)
             WHERE LTRIM(RTRIM(cmy_name)) = @c AND grn_no LIKE @p + '[0-9]%'`,
      { p: grnPrefix, c: company },
    );
    let grnNumber = Number(g?.n ?? 0) + 1;
    let grnNo = `${grnPrefix}${grnNumber}`;
    while (
      (
        await tx.query("SELECT 1 FROM dbo.[purgrnentry] WHERE grn_no = @g", {
          g: grnNo,
        })
      ).length
    )
      grnNo = `${grnPrefix}${++grnNumber}`;

    // Barcodes: prefix of the day + running number of the day (locked until commit).
    const prefix = barcodePrefix(date, serial, barcodeOrder(settings));
    const dayText = tsDate(date);
    const [b] = await tx.query(
      `SELECT MAX(TRY_CAST(SUBSTRING(barcode, LEN(@p) + 1, 20) AS bigint)) AS n FROM dbo.[purentrydetails] WITH (UPDLOCK, HOLDLOCK)
             WHERE date = @d AND LEFT(barcode, LEN(@p)) = @p AND LEN(barcode) > LEN(@p)`,
      { p: prefix, d: dayText },
    );
    let seq = Number(b?.n ?? 0);
    const nextBarcode = async (): Promise<string> => {
      for (;;) {
        const code = `${prefix}${++seq}`;
        // Short prefixes can overlap other days' codes (e.g. 62991+12 = 629911+2): never reuse a barcode.
        const clash = await tx.query(
          "SELECT TOP 1 1 AS x FROM dbo.[purentrydetails] WHERE barcode = @b UNION ALL SELECT TOP 1 1 FROM dbo.[stockdetails] WHERE barcode = @b",
          { b: code },
        );
        if (!clash.length) return code;
      }
    };

    const saved: SavedPurchase["lines"] = [];
    const gstBuckets: Record<string, number> = {
      "5": 0,
      "12": 0,
      "18": 0,
      "28": 0,
    };
    let totQty = 0,
      totAmount = 0,
      totTaxable = 0,
      totGst = 0,
      totNet = 0,
      totMtr = 0;
    const rates = new Set<number>();

    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      const p = products.get(txt(l.productCode)) as Row;
      const qty = num(l.qty),
        prate = num(l.prate),
        mrp = num(l.mrp);
      const mtr = num(l.mtr ?? 0) || 0;
      const group = gstGroups.get(txt(p.gst_group).toUpperCase());
      const gst =
        l.gstPercent !== undefined &&
        l.gstPercent !== null &&
        `${l.gstPercent}` !== ""
          ? num(l.gstPercent)
          : group
            ? gstForAmount(group, prate)
            : 0;
      const m = lineMath(
        {
          qty,
          mtr,
          prate,
          mrp,
          discountPercent: num(l.discountPercent ?? 0) || 0,
          less: num(l.less ?? 0) || 0,
        },
        gst,
      );
      const barcode = await nextBarcode();
      const slNo = i + 1;
      const productName = txt(p.name);
      const line: Row = {
        grn_no: grnNo,
        sl_no: String(slNo),
        barcode,
        orgbar: barcode,
        barLen: String(prefix.length),
        code: txt(p.code),
        pname: productName,
        hsncode: txt(l.hsnCode) || txt(p.ProductHSNCode),
        prate: f2(prate),
        pratecode: prateCode(prate, txt(settings.purCode)),
        mtr: mtr ? String(mtr) : "",
        qty: String(qty),
        fqty: String(num(l.freeQty ?? 0) || 0),
        TotalMeter: whole(m.units),
        amount: f2(m.amount),
        pless: f2(num(l.less ?? 0) || 0),
        plamt: f2(m.plamt),
        dis_per: f2(num(l.discountPercent ?? 0) || 0),
        dis_amount: f2(m.disAmount),
        gst_per: whole(gst),
        gst_amount: f2(m.gstAmount),
        nrate: f2(m.nrate),
        net_amount: f2(m.netAmount),
        sr_per: f2(m.srPer),
        mrp: whole(mrp),
        sr_rate: f2(m.srRate),
        cr_per: "",
        cr_rate: "",
        mrpdisper: "",
        mrpdisamt: "",
        smpper: "",
        design: txt(l.design).toUpperCase(),
        brand: txt(l.brand).toUpperCase(),
        patrn: txt(l.pattern).toUpperCase(),
        size: txt(l.size).toUpperCase(),
        color: txt(l.color).toUpperCase(),
        style: txt(l.style).toUpperCase(),
        rackno: txt(l.rack).toUpperCase(),
        fashion: txt(l.fashion).toUpperCase(),
        model: txt(l.model).toUpperCase() || supplier,
        date: dayText,
        entry_date: sqlDate(date),
        pro_group_name: txt(p.gst_group),
        unit_details: txt(p.unit_de),
        silver: txt(p.group_name),
        gold: company,
        diamond: company,
      };
      await tx.insert("purentrydetails", { ...line, billstatus: 1 });
      await tx.insert("stockdetails", line);

      totQty += qty;
      totAmount += m.amount;
      totTaxable += m.plamt - m.disAmount;
      totGst += m.gstAmount;
      totNet += m.netAmount;
      if (mtr) totMtr += m.units;
      if (String(gst) in gstBuckets) gstBuckets[String(gst)] += m.gstAmount;
      rates.add(gst);
      saved.push({
        slNo,
        barcode,
        productCode: txt(p.code),
        productName,
        qty,
        prate,
        mrp,
        netAmount: m.netAmount,
      });
    }

    const gstTotal = r2(totGst);
    await tx.insert("purgrnentry", {
      cmy_name: company,
      warehouse,
      suplier_name: supplier,
      agent_name: agent || "0",
      incharge: txt(input.incharge).toUpperCase() || "0",
      grn_no: grnNo,
      invoce_amount: invoiceNo,
      invoce_date: sqlDate(invoiceDate),
      entry_date: sqlDate(date),
      date: sqlDate(date),
      pay_type: "CASH",
      pnet_tot: whole(totTaxable),
      totnetamot: f2(totTaxable),
      CTotal: f2(totTaxable),
      TotSchemaDisGrossAmt: whole(totTaxable),
      tot_qut: whole(totQty),
      CQty: whole(totQty),
      totBillQty: whole(totQty),
      CMtr: f2(totMtr),
      gst5: f2(gstBuckets["5"]),
      gst12: f2(gstBuckets["12"]),
      gst18: f2(gstBuckets["18"]),
      gst28: f2(gstBuckets["28"]),
      CGst: f2(gstTotal),
      tot_less: String(Math.round(gstTotal)),
      gst_in: rates.size === 1 ? whole([...rates][0]) : "",
      com_per: "",
      com_amount: "0.00",
      pack_char: "",
      oter_char: "",
      char_tot: "0.00",
      char_qut_amou: "0.00",
      bdis_in: "",
      gst_exe: "",
      igst_in: "",
      brand: "",
      sales: "",
      cross_amount: "",
      less: "",
      mrpdisperh: "",
      pack_charless: "",
      AddchargeAmt: "",
      AddchargePer: "",
      AddcharegeGST: "",
      AddchargeWOGST: "",
      IGSTAmt: "",
      Supplier_City: txt(sup.city),
      ViewStatus: "NewPurchaseEntry",
      PreDisamt: "0.00",
      gstOther: "0.00",
      SchemaDiscount: "",
      TotSchemaDisAmount: "0.00",
    });

    return {
      grnNo,
      date: dayText,
      lines: saved,
      totals: {
        qty: totQty,
        amount: r2(totAmount),
        gst: gstTotal,
        net: r2(totNet),
      },
    };
  });
}

// ------------------------------------------------------------------------------------------------
// Read
// ------------------------------------------------------------------------------------------------

export interface PurchaseListQuery {
  from?: string;
  to?: string;
  supplier?: string;
  company?: string;
  q?: string;
  page?: number;
  limit?: number;
}

export async function listPurchases(q: PurchaseListQuery = {}) {
  const where: string[] = ["1 = 1"];
  const params: Row = {};
  if (q.from) {
    where.push("h.entry_date >= @from");
    params.from = q.from;
  }
  if (q.to) {
    where.push("h.entry_date < DATEADD(day, 1, CONVERT(date, @to))");
    params.to = q.to;
  }
  if (q.supplier) {
    where.push("LTRIM(RTRIM(h.suplier_name)) = @sup");
    params.sup = q.supplier.trim();
  }
  if (q.company) {
    where.push("LTRIM(RTRIM(h.cmy_name)) = @cmy");
    params.cmy = q.company.trim();
  }
  if (q.q) {
    where.push(
      "(h.grn_no LIKE @q OR h.suplier_name LIKE @q OR h.invoce_amount LIKE @q)",
    );
    params.q = `%${q.q.trim()}%`;
  }
  const limit = Math.min(Math.max(Number(q.limit) || 50, 1), 500);
  const page = Math.max(Number(q.page) || 1, 1);
  params.off = (page - 1) * limit;
  params.lim = limit;
  const [count] = await sqlRead(
    `SELECT COUNT(*) AS n FROM dbo.[purgrnentry] h WHERE ${where.join(" AND ")}`,
    params,
  );
  const rows = await sqlRead(
    `SELECT h.ID, h.grn_no, h.cmy_name, h.warehouse, h.suplier_name, h.invoce_amount, h.invoce_date, h.entry_date, h.tot_qut, h.totnetamot, h.CGst
         FROM dbo.[purgrnentry] h WHERE ${where.join(" AND ")} ORDER BY h.entry_date DESC, h.ID DESC OFFSET @off ROWS FETCH NEXT @lim ROWS ONLY`,
    params,
  );
  const iso = (v: unknown) =>
    v instanceof Date ? v.toISOString().slice(0, 10) : txt(v);
  return {
    data: rows.map((r) => {
      const taxable = Number(txt(r.totnetamot) || 0),
        gst = Number(txt(r.CGst) || 0);
      return {
        grnNo: txt(r.grn_no),
        company: txt(r.cmy_name),
        warehouse: txt(r.warehouse),
        supplier: txt(r.suplier_name),
        invoiceNo: txt(r.invoce_amount),
        invoiceDate: iso(r.invoce_date),
        date: iso(r.entry_date),
        qty: Number(txt(r.tot_qut) || 0),
        taxable,
        gst,
        total: r2(taxable + gst),
      };
    }),
    pagination: { page, limit, total: Number(count?.n ?? 0) },
  };
}

export async function getPurchase(grnNo: string) {
  const [h] = await sqlRead(
    "SELECT TOP 1 * FROM dbo.[purgrnentry] WHERE grn_no = @g",
    { g: grnNo.trim() },
  );
  if (!h) return null;
  const lines = await sqlRead(
    "SELECT * FROM dbo.[purentrydetails] WHERE grn_no = @g ORDER BY TRY_CAST(sl_no AS int), ID",
    { g: grnNo.trim() },
  );
  const stockRows = await sqlRead(
    "SELECT s.barcode FROM dbo.[stockdetails] s WHERE EXISTS (SELECT 1 FROM dbo.[purentrydetails] d WHERE d.grn_no = @g AND LTRIM(RTRIM(d.barcode)) = LTRIM(RTRIM(s.barcode)))",
    { g: grnNo.trim() },
  );
  const stockBarcodes = new Set(stockRows.map((r) => txt(r.barcode)));
  const iso = (v: unknown) =>
    v instanceof Date ? v.toISOString().slice(0, 10) : txt(v);
  return {
    grnNo: txt(h.grn_no),
    company: txt(h.cmy_name),
    warehouse: txt(h.warehouse),
    supplier: txt(h.suplier_name),
    supplierCity: txt(h.Supplier_City),
    agent: txt(h.agent_name) === "0" ? "" : txt(h.agent_name),
    incharge: txt(h.incharge) === "0" ? "" : txt(h.incharge),
    invoiceNo: txt(h.invoce_amount),
    invoiceDate: iso(h.invoce_date),
    date: iso(h.entry_date),
    totals: {
      qty: Number(txt(h.tot_qut) || 0),
      taxable: Number(txt(h.totnetamot) || 0),
      gst: Number(txt(h.CGst) || 0),
    },
    lines: lines.map((d) => ({
      slNo: Number(txt(d.sl_no)),
      barcode: txt(d.barcode),
      stockLinked: stockBarcodes.has(txt(d.barcode)),
      productCode: txt(d.code),
      productName: txt(d.pname),
      hsnCode: txt(d.hsncode),
      qty: Number(txt(d.qty) || 0),
      mtr: Number(txt(d.mtr) || 0),
      freeQty: Number(txt(d.fqty) || 0),
      prate: Number(txt(d.prate) || 0),
      amount: Number(txt(d.amount) || 0),
      discountPercent: Number(txt(d.dis_per) || 0),
      gstPercent: Number(txt(d.gst_per) || 0),
      gstAmount: Number(txt(d.gst_amount) || 0),
      netAmount: Number(txt(d.net_amount) || 0),
      mrp: Number(txt(d.mrp) || 0),
      unit: txt(d.unit_details),
      brand: txt(d.brand),
      pattern: txt(d.patrn),
      size: txt(d.size),
      color: txt(d.color),
      style: txt(d.style),
      design: txt(d.design),
      rack: txt(d.rackno),
      fashion: txt(d.fashion),
      model: txt(d.model),
    })),
  };
}

// ------------------------------------------------------------------------------------------------
// Delete (only while nothing downstream uses its barcodes)
// ------------------------------------------------------------------------------------------------

export async function deletePurchase(grnNo: string): Promise<void> {
  await withSqlTransaction("Deleting the purchase", async (tx) => {
    const g = grnNo.trim();
    const [h] = await tx.query(
      "SELECT COUNT(*) AS n FROM dbo.[purgrnentry] WHERE grn_no = @g",
      { g },
    );
    if (!Number(h?.n)) throw new SqlWriteError("Purchase not found.", 404);
    // Lines are keyed by grn_no only (no company column): with two headers sharing the number, deleting
    // would take both GRNs' lines and stock. None in the shop's data (SSS_copy, Sep 2026) -- guard anyway.
    if (Number(h.n) > 1)
      throw new SqlWriteError(
        `GRN ${g} is used by ${h.n} purchases, so it can't be deleted safely here. Delete it in Textilesoft.`,
        409,
      );
    const [u] = await tx.query(
      `SELECT CASE WHEN EXISTS (SELECT 1 FROM dbo.[salsntry] s JOIN dbo.[purentrydetails] d ON d.barcode = s.barcode WHERE d.grn_no = @g) THEN 'sold'
                         WHEN EXISTS (SELECT 1 FROM dbo.[purretrun] r JOIN dbo.[purentrydetails] d ON d.barcode = r.barcode WHERE d.grn_no = @g)
                           OR EXISTS (SELECT 1 FROM dbo.[PurchaseReturnDetails] r JOIN dbo.[purentrydetails] d ON d.barcode = r.barcode WHERE d.grn_no = @g) THEN 'returned'
                         ELSE '' END AS used`,
      { g },
    );
    if (txt(u?.used))
      throw new SqlWriteError(
        `Items of ${g} have already been ${txt(u?.used)}, so the purchase can't be deleted.`,
        409,
      );
    // Beyond Textilesoft: any other table holding one of its barcodes (other bills, sales/purchase
    // returns, transfers, damage/missing stock, stock-take, printed labels ...).
    const used = await findGrnBarcodeReferences(tx, g);
    if (used.length)
      throw new SqlWriteError(
        `Items of ${g} are used in ${describeReferences(used)}, so the purchase can't be deleted.`,
        409,
      );
    await tx.remove("stockdetails", { grn_no: g });
    await tx.remove("purentrydetails", { grn_no: g });
    await tx.remove("purgrnentry", { grn_no: g });
  });
}

// ------------------------------------------------------------------------------------------------
// Startup check: duplicate barcodes / GRN numbers
// ------------------------------------------------------------------------------------------------

/**
 * Barcodes on more than one purchase line in the last `days` days, and GRN numbers on more than one header.
 * The ERP allocates both under a lock, but Textilesoft's desktop reads MAX() without one, so a purchase
 * saved in both at the same moment can take the same number. Older duplicates exist in legacy data
 * (05_purchase.md §101), so barcodes are only checked for recent days.
 */
export async function purchaseNumberClashes(days = 60): Promise<{
  barcodes: { barcode: string; n: number }[];
  grns: { grnNo: string; n: number }[];
}> {
  const [barcodes, grns] = await Promise.all([
    sqlRead(
      `SELECT TOP 50 LTRIM(RTRIM(barcode)) AS barcode, COUNT(*) AS n FROM dbo.[purentrydetails]
        WHERE entry_date >= DATEADD(day, -@days, CAST(GETDATE() AS date)) AND NULLIF(LTRIM(RTRIM(barcode)), '') IS NOT NULL
        GROUP BY LTRIM(RTRIM(barcode)) HAVING COUNT(*) > 1 ORDER BY LTRIM(RTRIM(barcode))`,
      { days },
    ),
    sqlRead(
      `SELECT TOP 50 LTRIM(RTRIM(grn_no)) AS grn, COUNT(*) AS n FROM dbo.[purgrnentry]
        WHERE NULLIF(LTRIM(RTRIM(grn_no)), '') IS NOT NULL GROUP BY LTRIM(RTRIM(grn_no)) HAVING COUNT(*) > 1`,
    ),
  ]);
  return {
    barcodes: barcodes.map((r) => ({ barcode: txt(r.barcode), n: Number(r.n) })),
    grns: grns.map((r) => ({ grnNo: txt(r.grn), n: Number(r.n) })),
  };
}

/** Startup log line; never throws. */
export async function logPurchaseNumberClashes(): Promise<void> {
  try {
    const { barcodes, grns } = await purchaseNumberClashes();
    if (!barcodes.length && !grns.length) {
      info("[purchase] No duplicate barcodes (last 60 days) or GRN numbers.");
      return;
    }
    if (barcodes.length)
      warn(
        `[purchase] Barcodes on more than one purchase line (last 60 days): ${barcodes
          .slice(0, 10)
          .map((b) => `${b.barcode} x${b.n}`)
          .join(", ")}${barcodes.length > 10 ? ", ..." : ""}. Check stock and sales for these items.`,
      );
    if (grns.length)
      warn(
        `[purchase] GRN numbers used by more than one purchase: ${grns
          .slice(0, 10)
          .map((g) => `${g.grnNo} x${g.n}`)
          .join(", ")}. These GRNs can't be deleted from the ERP.`,
      );
  } catch (err) {
    warn(`[purchase] duplicate check skipped - ${(err as Error).message}`);
  }
}



