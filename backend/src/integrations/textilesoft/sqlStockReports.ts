import {
  SESSION_PREFIX,
  buildItemsDerived,
  type QueryParam,
} from "./mapping.js";
import type { ShopDbMapping } from "./types.js";
import {
  applyStockFilters,
  deadStock,
  lowStock,
  rackWise,
  singleCity,
  stockFilterOptions,
  stockStatus,
  type StockFilterQuery,
} from "../../modules/inventory/services/stockReports.js";
import { getMapping, getPool } from "./sqlItemSource.js";
import { shopAsOf } from "./sqlShopClock.js";
export { shopAsOf };
import {
  classifyLots,
  filterByPurchaseDate,
  pageRows,
  summarize,
  summarizeMonths,
  type StockAgeLot,
  type StockAgeQuery,
  type StockAgeRow,
} from "../../modules/inventory/services/stockAgeBuckets.js";

/**
 * ITEM_DATA_SOURCE=sql: stock reports read straight from the Textilesoft tables (read-only):
 *   - stock movement log   (purchases in, sales out, purchase returns out)
 *   - per-item stock history
 *   - aged stock           (days since the lot was last sold / bought)
 *
 * These use Textilesoft's own table names (purentrydetails, purgrnentry, salsntry, purretrun), which are
 * fixed identifiers below -- never taken from user input. Values are always bound as parameters.
 * Ages are counted back from the newest sale in the data (`asOf`), so a restored backup still fills the screens.
 */

type Row = Record<string, unknown>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Doc = Record<string, any>;

const num = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const round3 = (n: number): number => Math.round(n * 1000) / 1000;
const iso = (v: unknown): string =>
  v instanceof Date
    ? v.toISOString().slice(0, 10)
    : String(v ?? "").slice(0, 10);

async function run(text: string, params: QueryParam[]): Promise<Row[]> {
  const req = (await getPool()).request();
  for (const p of params) req.input(p.name, p.value);
  const res = await req.query(SESSION_PREFIX + text);
  return res ? res.recordset : [];
}

const addDays = (isoDate: string, days: number): string => {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};
const validDate = (v: unknown): string | undefined =>
  typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined;
const escapeLike = (v: string): string =>
  v.replace(/[\\%_[]/g, (c) => `\\${c}`);

/** Purchases (IN), sales (OUT) and purchase returns (OUT) as one log. */
function movementUnion(withBarcode: boolean): string {
  const bc = (col: string): string => (withBarcode ? ` AND ${col} = @bc` : "");
  return (
    `SELECT CAST(p.[entry_date] AS date) AS d, p.[barcode] AS barcode, p.[pname] AS name, ` +
    `ISNULL(TRY_CAST(p.[qty] AS float), 0) + ISNULL(TRY_CAST(p.[fqty] AS float), 0) AS qty, 'IN' AS kind, ` +
    `p.[grn_no] AS ref, g.[sup] AS party, 'Purchase' AS reason ` +
    `FROM dbo.[purentrydetails] AS p LEFT JOIN (SELECT [grn_no] AS grn, MAX([suplier_name]) AS sup FROM dbo.[purgrnentry] GROUP BY [grn_no]) AS g ON g.grn = p.[grn_no] ` +
    `WHERE p.[STATUS] IS NULL AND p.[entry_date] >= CAST(@from AS date) AND p.[entry_date] <= CAST(@to AS date)${bc("p.[barcode]")} ` +
    `UNION ALL ` +
    `SELECT CAST(s.[date] AS date), s.[barcode], s.[p_name], ISNULL(TRY_CAST(s.[qty] AS float), 0), 'OUT', ` +
    `ISNULL(NULLIF(s.[mode], ''), CAST(s.[billno] AS varchar(20))), '', 'Sale' ` +
    `FROM dbo.[salsntry] AS s WHERE s.[status] <> '1' AND s.[date] >= CAST(@from AS date) AND s.[date] <= CAST(@to AS date)${bc("s.[barcode]")} ` +
    `UNION ALL ` +
    `SELECT CAST(r.[date] AS date), r.[barcode], r.[pr_name], ISNULL(TRY_CAST(r.[qty] AS float), 0), 'OUT', ` +
    `r.[sup_retu_grn], r.[supp_name], 'Purchase return' ` +
    `FROM dbo.[purretrun] AS r WHERE r.[date] >= CAST(@from AS date) AND r.[date] <= CAST(@to AS date)${bc("r.[barcode]")} ` +
    // This shop's Textilesoft (and the ERP) keep purchase returns in PurchaseReturnDetails; grn_no there is the
    // return number, the supplier is on the return header. purretrun is kept for installations that use it.
    `UNION ALL ` +
    `SELECT d.[entry_date], d.[barcode], d.[pname], ISNULL(TRY_CAST(d.[qty] AS float), 0), 'OUT', ` +
    `d.[grn_no], h.[sup], 'Purchase return' ` +
    `FROM dbo.[PurchaseReturnDetails] AS d LEFT JOIN (SELECT [grn_no] AS doc, MAX([suplier_name]) AS sup FROM dbo.[PurchaseReturnHeader] GROUP BY [grn_no]) AS h ON h.doc = d.[grn_no] ` +
    `WHERE d.[entry_date] >= CAST(@from AS date) AND d.[entry_date] <= CAST(@to AS date)${bc("d.[barcode]")}`
  );
}

export interface MovementParams {
  page?: string | number;
  limit?: string | number;
  type?: string; // IN | OUT | All
  search?: string;
  from?: string;
  to?: string;
}

export async function sqlStockMovements(params: MovementParams): Promise<Doc> {
  const asOf = await shopAsOf();
  const page = Math.max(1, parseInt(String(params.page)) || 1);
  const limit = Math.min(
    200,
    Math.max(1, parseInt(String(params.limit)) || 50),
  );
  const to =
    validDate(params.to) ?? asOf ?? new Date().toISOString().slice(0, 10);
  const from = validDate(params.from) ?? addDays(to, -30);

  const p: QueryParam[] = [
    { name: "from", value: from },
    { name: "to", value: to },
  ];
  const clauses: string[] = [];
  if (params.type === "IN" || params.type === "OUT") {
    p.push({ name: "kind", value: params.type });
    clauses.push("u.kind = @kind");
  }
  if (params.search) {
    p.push({ name: "q", value: `%${escapeLike(params.search)}%` });
    clauses.push(
      "(u.name LIKE @q ESCAPE '\\' OR u.barcode LIKE @q ESCAPE '\\' OR u.ref LIKE @q ESCAPE '\\')",
    );
  }
  const where = clauses.length ? ` WHERE ${clauses.join(" AND ")}` : "";
  const src = `(${movementUnion(false)}) AS u`;

  const [totals] = await run(
    `SELECT COUNT(*) AS total, ISNULL(SUM(CASE WHEN u.kind = 'IN' THEN u.qty END), 0) AS inQty, ISNULL(SUM(CASE WHEN u.kind = 'OUT' THEN u.qty END), 0) AS outQty FROM ${src}${where}`,
    p,
  );
  const rows = await run(
    `SELECT u.d, u.barcode, u.name, u.qty, u.kind, u.ref, u.party, u.reason FROM ${src}${where} ORDER BY u.d DESC, u.ref DESC, u.barcode OFFSET @off ROWS FETCH NEXT @lim ROWS ONLY`,
    [
      ...p,
      { name: "off", value: (page - 1) * limit },
      { name: "lim", value: limit },
    ],
  );
  const total = num(totals?.total);
  return {
    items: rows.map((r, i) => ({
      id: `${iso(r.d)}-${r.kind}-${r.ref}-${r.barcode}-${(page - 1) * limit + i}`,
      date: iso(r.d),
      item: String(r.name ?? "").trim() || String(r.barcode ?? ""),
      sku: String(r.barcode ?? ""),
      type: String(r.kind),
      qty: round3(num(r.qty)),
      ref: String(r.ref ?? ""),
      party: String(r.party ?? "").trim(),
      reason: String(r.reason ?? ""),
    })),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    totals: {
      transactions: total,
      inQty: round3(num(totals?.inQty)),
      outQty: round3(num(totals?.outQty)),
    },
    range: { from, to },
    asOf,
    source: "sql",
  };
}

/** Per-item history in the shape the stock-history drawer renders. The item id is its barcode. */
export async function sqlItemHistory(
  itemId: string,
  _tenantId?: string,
): Promise<Doc[]> {
  const barcode = String(itemId ?? "").trim();
  if (!barcode) return [];
  const item = { _id: barcode, barcode };

  let shop: Doc[] = [];
  {
    const rows = await run(
      `SELECT u.d, u.qty, u.kind, u.ref, u.party, u.reason FROM (${movementUnion(true)}) AS u ORDER BY u.d ASC, CASE WHEN u.kind = 'IN' THEN 0 ELSE 1 END, u.ref`,
      [
        { name: "from", value: "1900-01-01" },
        { name: "to", value: "2999-12-31" },
        { name: "bc", value: String(item.barcode) },
      ],
    );
    let balance = 0;
    shop = rows.map((r, i) => {
      const qty = num(r.qty);
      const delta = r.kind === "IN" ? qty : -qty;
      balance = round3(balance + delta);
      const who = String(r.party ?? "").trim();
      return {
        _id: `sql-${i}`,
        itemId: item._id,
        type:
          r.reason === "Purchase"
            ? "PURCHASE"
            : r.reason === "Sale"
              ? "SALES"
              : "RETURN",
        delta: round3(delta),
        finalQty: balance,
        reason: `${r.reason} ${r.ref}${who ? ` - ${who}` : ""}`,
        createdAt: new Date(`${iso(r.d)}T00:00:00Z`),
        source: "sql",
      };
    });
  }
  return shop.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

/**
 * Lots still in stock whose last sale (or, if never sold, purchase) is oldest. Returns the shape the aged-stock
 * page reads; capped so the screen stays responsive on a 55k-lot catalogue.
 */
export async function sqlAgingReport(
  _tenantId: string,
  minDays = 60,
  cap = 500,
): Promise<Doc[]> {
  const asOf = await shopAsOf();
  if (!asOf) return [];
  const derived = buildItemsDerived(getMapping());
  const age = "DATEDIFF(day, ISNULL(ls.ld, pe.ed), CAST(@asOf AS date))";
  const rows = await run(
    `SELECT TOP (@cap) it.[barcode] AS barcode, it.[name] AS name, TRY_CAST(it.[stockQty] AS float) AS stockQty, TRY_CAST(it.[costPrice] AS float) AS costPrice, ` +
      `CONVERT(varchar(10), pe.ed, 23) AS entryDate, CONVERT(varchar(10), ls.ld, 23) AS lastSold, ${age} AS ageDays ` +
      `FROM (${derived.text}) AS it ` +
      `LEFT JOIN (SELECT [barcode] AS bc, MIN([entry_date]) AS ed FROM dbo.[purentrydetails] GROUP BY [barcode]) AS pe ON pe.bc = it.[barcode] ` +
      `LEFT JOIN (SELECT [barcode] AS bc, MAX([date]) AS ld FROM dbo.[salsntry] WHERE [status] <> '1' GROUP BY [barcode]) AS ls ON ls.bc = it.[barcode] ` +
      `WHERE TRY_CAST(it.[stockQty] AS float) > 0 AND ${age} >= @minDays ORDER BY ${age} DESC`,
    [
      ...derived.params,
      { name: "asOf", value: asOf },
      { name: "minDays", value: minDays },
      { name: "cap", value: Math.min(Math.max(1, cap), 2000) },
    ],
  );
  if (rows.length === 0) return [];

  return rows.map((r) => {
    const days = Math.max(0, num(r.ageDays));
    const stockQty = num(r.stockQty);
    const cost = num(r.costPrice);
    const lastActivity = r.lastSold
      ? String(r.lastSold)
      : r.entryDate
        ? String(r.entryDate)
        : null;
    return {
      _id: String(r.barcode ?? ""),
      name: String(r.name ?? r.barcode),
      sku: String(r.barcode ?? ""),
      barcode: String(r.barcode ?? ""),
      stockQty,
      stock: stockQty,
      costPrice: cost,
      valuation: round3(stockQty * cost),
      value: round3(stockQty * cost),
      oldestStockDate: r.entryDate ?? null,
      lastSoldDate: lastActivity,
      neverSold: !r.lastSold,
      ageInDays: days,
      daysSinceLastSold: days,
      status: "DEAD_STOCK",
      asOf,
    };
  });
}

/* ------------------------------------------------------------------------------------------------ *
 * Stock age by calendar-month bucket ("purchased but not sold").
 * One barcode = one purchase lot, so remaining stock per barcode is the unsold part of that purchase.
 * Bucketing rules live in stockAgeBuckets.ts; this section only loads the lots.
 * ------------------------------------------------------------------------------------------------ */

/** True when the mapping exposes this item field (directly or via a lookup table). */
const mapsField = (m: ShopDbMapping, f: string): boolean =>
  !!(
    (m.columns as Record<string, string | undefined>)[f] ||
    (m.lookups ?? []).some(
      (l) => (l.columns as Record<string, string | undefined>)[f],
    )
  );

/** Per-lot purchase / sale / return totals, keyed by barcode. `where` filters the lots (it.*). */
function stockAgeLotQuery(
  derivedText: string,
  where: string,
  mapping: ShopDbMapping,
): string {
  // Optional item fields: only selected when the mapping provides them (NULL otherwise), so a shop DB
  // without, say, brands still works.
  const opt = (f: string, expr: string): string =>
    mapsField(mapping, f) ? `${expr} AS ${f}` : `NULL AS ${f}`;
  return (
    `SELECT it.[barcode] AS barcode, it.[name] AS name, TRY_CAST(it.[stockQty] AS float) AS stockQty, TRY_CAST(it.[costPrice] AS float) AS costPrice, ` +
    `${opt("category", "it.[category]")}, ${opt("brand", "it.[brand]")}, ${opt("sellingPrice", "TRY_CAST(it.[sellingPrice] AS float)")}, ${opt("shelfCode", "it.[shelfCode]")}, ` +
    `CONVERT(varchar(10), pe.ed, 23) AS entryDate, pe.pq AS purchasedQty, pe.sup AS supplier, pe.n AS purchaseRows, pe.grn AS grnNo, ` +
    `ISNULL(sa.sq, 0) AS soldQty, CONVERT(varchar(10), sa.ld, 23) AS lastSold, ISNULL(pr.rq, 0) AS returnedQty ` +
    `FROM (${derivedText}) AS it ` +
    // Active purchase rows only (STATUS IS NULL), same as the movement log. qty + free qty = pieces received.
    `LEFT JOIN (SELECT p.[barcode] AS bc, MIN(p.[entry_date]) AS ed, COUNT(*) AS n, MAX(g.[sup]) AS sup, MIN(CAST(p.[grn_no] AS varchar(50))) AS grn, ` +
    `SUM(ISNULL(TRY_CAST(p.[qty] AS float), 0) + ISNULL(TRY_CAST(p.[fqty] AS float), 0)) AS pq ` +
    `FROM dbo.[purentrydetails] AS p LEFT JOIN (SELECT [grn_no] AS grn, MAX([suplier_name]) AS sup FROM dbo.[purgrnentry] GROUP BY [grn_no]) AS g ON g.grn = p.[grn_no] ` +
    `WHERE p.[STATUS] IS NULL GROUP BY p.[barcode]) AS pe ON pe.bc = it.[barcode] ` +
    `LEFT JOIN (SELECT [barcode] AS bc, SUM(ISNULL(TRY_CAST([qty] AS float), 0)) AS sq, MAX([date]) AS ld FROM dbo.[salsntry] WHERE [status] <> '1' GROUP BY [barcode]) AS sa ON sa.bc = it.[barcode] ` +
    // Purchase returns: PurchaseReturnDetails (this shop) + purretrun (other installations).
    `LEFT JOIN (SELECT bc, SUM(q) AS rq FROM (` +
    `SELECT [barcode] AS bc, ISNULL(TRY_CAST([qty] AS float), 0) AS q FROM dbo.[purretrun] ` +
    `UNION ALL SELECT [barcode], ISNULL(TRY_CAST([qty] AS float), 0) FROM dbo.[PurchaseReturnDetails]` +
    `) AS rr GROUP BY bc) AS pr ON pr.bc = it.[barcode] ` +
    `WHERE ${where}`
  );
}

interface StockAgeSnapshot {
  asOf: string;
  rows: StockAgeRow[];
  multiPurchaseBarcodes: number;
  lowStockLimit: number;
}

const stockAgeCache = new Map<
  string,
  { at: number; value: Promise<StockAgeSnapshot> }
>();

async function loadStockAge(): Promise<StockAgeSnapshot | null> {
  const asOf = await shopAsOf();
  if (!asOf) return null;
  const mapping = getMapping();
  const derived = buildItemsDerived(mapping);
  const raw = await run(
    stockAgeLotQuery(
      derived.text,
      "TRY_CAST(it.[stockQty] AS float) > 0",
      mapping,
    ),
    derived.params,
  );

  let multiPurchaseBarcodes = 0;
  const lots: StockAgeLot[] = raw.map((r) => {
    const barcode = String(r.barcode ?? "");
    if (num(r.purchaseRows) > 1) multiPurchaseBarcodes += 1;
    return {
      barcode,
      name: String(r.name ?? "").trim() || barcode,
      purchaseDate: r.entryDate ? String(r.entryDate) : null,
      supplier: String(r.supplier ?? "").trim(),
      grnNo: r.grnNo == null ? null : String(r.grnNo).trim() || null,
      purchasedQty: round3(num(r.purchasedQty)),
      soldQty: round3(num(r.soldQty)),
      returnedQty: round3(num(r.returnedQty)),
      remainingQty: round3(num(r.stockQty)),
      costPrice: num(r.costPrice),
      category: r.category == null ? null : String(r.category).trim() || null,
      brand: r.brand == null ? null : String(r.brand).trim() || null,
      sellingPrice: num(r.sellingPrice),
      lastSoldDate: r.lastSold ? String(r.lastSold) : null,
      rack: r.shelfCode == null ? null : String(r.shelfCode).trim() || null,
    };
  });
  return {
    asOf,
    rows: classifyLots(lots, asOf),
    multiPurchaseBarcodes,
    lowStockLimit:
      Number(process.env.TEXTILESOFT_LOW_STOCK_DEFAULT) ||
      mapping.defaults?.lowStockLimit ||
      2,
  };
}

/**
 * The per-lot snapshot shared by Aged Stock and the stock reports, cached per tenant for 60s (one scan of the
 * shop DB serves every report and page). `refresh` forces a reload.
 */
export async function getStockSnapshot(
  tenantId: string,
  refresh = false,
): Promise<StockAgeSnapshot | null> {
  const key = String(tenantId);
  const hit = stockAgeCache.get(key);
  if (hit && Date.now() - hit.at < 60_000 && !refresh) return hit.value;
  const value = loadStockAge();
  stockAgeCache.set(key, {
    at: Date.now(),
    value: value as Promise<StockAgeSnapshot>,
  });
  try {
    const snapshot = await value;
    if (!snapshot) stockAgeCache.delete(key);
    return snapshot;
  } catch (err) {
    stockAgeCache.delete(key);
    throw err;
  }
}

/**
 * GET /api/inventory/stock-age. Summary over every lot with stock (no cap) + one page of the chosen bucket.
 * The lot list is cached per tenant for 60s so paging and switching buckets don't re-run the scan.
 */
export async function sqlStockAgeBuckets(
  tenantId: string,
  q: StockAgeQuery & { refresh?: string },
): Promise<Doc> {
  // req.tenantId is an ObjectId at runtime (from the user doc): key the cache by its string form, not the object.
  tenantId = String(tenantId);
  const snapshot = await getStockSnapshot(tenantId, q.refresh === "1");
  if (!snapshot)
    return {
      asOf: null,
      buckets: [],
      totals: { lots: 0, qty: 0, value: 0 },
      items: [],
      pagination: { page: 1, limit: 50, total: 0, pages: 1 },
      bucket: "all",
      source: "sql",
    };

  const { asOf, multiPurchaseBarcodes } = snapshot;
  const { rows, from, to } = filterByPurchaseDate(snapshot.rows, q);
  const { buckets, totals } = summarize(rows, asOf);
  const { items, pagination, bucket, selection, detail } = pageRows(rows, q);

  return {
    asOf,
    buckets,
    totals,
    bucket,
    selection,
    detail,
    months: summarizeMonths(rows),
    items: items.map((r) => ({
      ...r,
      _id: r.barcode,
      category: r.category ?? null,
      sellingPrice: r.sellingPrice ?? null,
    })),
    pagination,
    range: { from, to },
    checks: { multiPurchaseBarcodes },
    source: "sql",
  };
}

/* ------------------------------------------------------------------------------------------------ *
 * Inventory reports (Reports > Inventory): Stock Status, Low Stock, Dead Stock -- all from the snapshot.
 * ------------------------------------------------------------------------------------------------ */

export interface StockReportQuery extends StockFilterQuery {
  search?: string;
  category?: string;
  sort?: string;
  dir?: string;
  page?: string;
  limit?: string;
  threshold?: string;
  days?: string;
  neverSold?: string;
  refresh?: string;
}

const EMPTY_REPORT = { asOf: null, source: "sql" };

export async function sqlStockStatusReport(
  tenantId: string,
  q: StockReportQuery,
): Promise<Doc> {
  const snap = await getStockSnapshot(tenantId, q.refresh === "1");
  if (!snap) return { ...EMPTY_REPORT, ...stockStatus([]) };
  return {
    asOf: snap.asOf,
    source: "sql",
    ...stockStatus(applyStockFilters(snap.rows, q)),
  };
}

export async function sqlLowStockReport(
  tenantId: string,
  q: StockReportQuery,
): Promise<Doc> {
  const snap = await getStockSnapshot(tenantId, q.refresh === "1");
  if (!snap) return { ...EMPTY_REPORT, ...lowStock([], q) };
  return {
    asOf: snap.asOf,
    source: "sql",
    ...lowStock(applyStockFilters(snap.rows, q), q, snap.lowStockLimit),
  };
}

export async function sqlDeadStockReport(
  tenantId: string,
  q: StockReportQuery,
): Promise<Doc> {
  const snap = await getStockSnapshot(tenantId, q.refresh === "1");
  if (!snap)
    return {
      ...EMPTY_REPORT,
      ...deadStock([], new Date().toISOString().slice(0, 10), q),
    };
  return {
    asOf: snap.asOf,
    source: "sql",
    ...deadStock(applyStockFilters(snap.rows, q), snap.asOf, q),
  };
}

/** Floor/Rack-wise stock from the shared snapshot (rack = stockdetails.rackno). */
export async function sqlRackWiseStock(
  tenantId: string,
  q: StockReportQuery = {},
): Promise<Doc> {
  const snap = await getStockSnapshot(tenantId, q.refresh === "1");
  if (!snap) return { asOf: null, source: "sql", ...rackWise([]) };
  return {
    asOf: snap.asOf,
    source: "sql",
    ...rackWise(applyStockFilters(snap.rows, q)),
  };
}

/**
 * City-wise stock. The shop database has no store/city per barcode and this is a single-shop ERP, so all stock is in
 * one city: SHOP_CITY from .env (default "Main shop").
 */
export async function sqlCityWiseStock(
  tenantId: string,
  q: StockReportQuery = {},
): Promise<Doc | null> {
  const snap = await getStockSnapshot(tenantId, q.refresh === "1");
  if (!snap) return { asOf: null, source: "sql", rows: [] };
  const city = String(process.env.SHOP_CITY ?? "").trim() || "Main shop";
  return {
    asOf: snap.asOf,
    source: "sql",
    singleStore: true,
    rows: singleCity(applyStockFilters(snap.rows, q), city),
  };
}

/** Values for the common stock-report filter bar (categories, brands, suppliers, purchase-date range). */
export async function sqlStockFilterOptions(tenantId: string): Promise<Doc> {
  const snap = await getStockSnapshot(tenantId);
  if (!snap) return { asOf: null, source: "sql", ...stockFilterOptions([]) };
  return { asOf: snap.asOf, source: "sql", ...stockFilterOptions(snap.rows) };
}
