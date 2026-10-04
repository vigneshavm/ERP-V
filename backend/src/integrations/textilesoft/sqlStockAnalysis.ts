import { SESSION_PREFIX } from "./mapping.js";
import { getPool } from "./sqlItemSource.js";
import { shopAsOf } from "./sqlShopClock.js";
import { getStockSnapshot } from "./sqlStockReports.js";
import {
    MGMT_CLASSES,
    SELL_THROUGH_BANDS,
    STOCK_AGE_BUCKETS,
    addDaysIso,
    bucketLabel,
    classify,
    daysBetween,
    derivePriceBands,
    groupBy,
    kidsSegment,
    metricsFor,
    priceBandOf,
    reorderRows,
    settingsComplete,
    type AnalysisLot,
    type ClassifiedLot,
    type ReorderSettings,
} from "../../modules/inventory/services/stockAnalysis.js";

/**
 * Inventory / Stock Aging & Sales Analysis (read-only).
 * ONE grouped SQL scan (purchases, sales, purchase returns, product master, each aggregated per barcode
 * before joining) -- no per-row queries and no raw transaction history in Node. Tables/columns are the ones
 * the stock reports already use: purentrydetails, purgrnentry, stockdetails, newproduct, salsntry, purretrun,
 * PurchaseReturnDetails. Stock = purchased - sold (status <> '1') - purchase returns, same as the stock reports.
 */

type Row = Record<string, unknown>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Doc = Record<string, any>;

const num = (v: unknown): number => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
};
const str = (v: unknown): string | null => {
    const s = v == null ? "" : String(v).trim();
    return s ? s : null;
};
const validDate = (v: unknown): string | undefined => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined);
const optNum = (v: unknown): number | null => {
    if (v === undefined || v === null || v === "") return null;
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? n : null;
};

const LOT_SQL = `
WITH pur AS (
  SELECT LTRIM(RTRIM(p.[barcode])) AS bc, MIN(p.[entry_date]) AS fp, MAX(p.[entry_date]) AS lp,
         SUM(ISNULL(TRY_CAST(p.[qty] AS float), 0) + ISNULL(TRY_CAST(p.[fqty] AS float), 0)) AS pq,
         MAX(g.[sup]) AS sup, MIN(CAST(p.[grn_no] AS varchar(50))) AS grn, COUNT(*) AS pn
  FROM dbo.[purentrydetails] AS p
  LEFT JOIN (SELECT [grn_no] AS grn, MAX([suplier_name]) AS sup FROM dbo.[purgrnentry] GROUP BY [grn_no]) AS g ON g.grn = p.[grn_no]
  WHERE p.[STATUS] IS NULL AND p.[entry_date] < DATEADD(day, 1, CAST(@asOf AS date))
  GROUP BY LTRIM(RTRIM(p.[barcode]))
), sal AS (
  SELECT LTRIM(RTRIM([barcode])) AS bc,
         SUM(ISNULL(TRY_CAST([qty] AS float), 0)) AS sq, MIN([date]) AS fs, MAX([date]) AS ls,
         SUM(CASE WHEN [date] >= CAST(@from AS date) AND [date] < DATEADD(day, 1, CAST(@to AS date)) THEN ISNULL(TRY_CAST([qty] AS float), 0) ELSE 0 END) AS pqty,
         SUM(CASE WHEN [date] >= CAST(@from AS date) AND [date] < DATEADD(day, 1, CAST(@to AS date)) THEN ISNULL(TRY_CAST([net_amount] AS float), 0) ELSE 0 END) AS pval,
         SUM(CASE WHEN [date] >= CAST(@from AS date) AND [date] < DATEADD(day, 1, CAST(@to AS date)) THEN 1 ELSE 0 END) AS pbills
  FROM dbo.[salsntry]
  WHERE [status] <> '1' AND [date] < DATEADD(day, 1, CAST(@asOf AS date))
  GROUP BY LTRIM(RTRIM([barcode]))
), ret AS (
  SELECT bc, SUM(q) AS rq FROM (
    SELECT LTRIM(RTRIM([barcode])) AS bc, ISNULL(TRY_CAST([qty] AS float), 0) AS q FROM dbo.[purretrun] WHERE [date] < DATEADD(day, 1, CAST(@asOf AS date))
    UNION ALL
    SELECT LTRIM(RTRIM([barcode])), ISNULL(TRY_CAST([qty] AS float), 0) FROM dbo.[PurchaseReturnDetails] WHERE [entry_date] < DATEADD(day, 1, CAST(@asOf AS date))
  ) AS r GROUP BY bc
), prod AS (
  SELECT LTRIM(RTRIM([code])) AS code, MAX([group_name]) AS grp, MAX([sub_group_name]) AS sub
  FROM dbo.[newproduct] GROUP BY LTRIM(RTRIM([code]))
), sd AS (
  SELECT LTRIM(RTRIM([barcode])) AS bc, MAX([pname]) AS pname, MAX(LTRIM(RTRIM([code]))) AS code, MAX([brand]) AS brand,
         MAX([size]) AS size, MAX([color]) AS color, MAX(TRY_CAST([prate] AS float)) AS prate, MAX(TRY_CAST([mrp] AS float)) AS mrp,
         SUM(ISNULL(TRY_CAST([qty] AS float), 0)) AS q, COUNT(*) AS sdn
  FROM dbo.[stockdetails] GROUP BY LTRIM(RTRIM([barcode]))
)
SELECT y.* FROM (
  SELECT sd.bc AS barcode, sd.pname AS name, prod.grp AS category, prod.sub AS subCategory, sd.brand, sd.size, sd.color,
         pur.sup AS supplier, pur.grn AS grnNo, CONVERT(varchar(10), pur.fp, 23) AS firstPurchase, CONVERT(varchar(10), pur.lp, 23) AS lastPurchase,
         ISNULL(pur.pq, sd.q) AS purchasedQty, ISNULL(ret.rq, 0) AS purchaseReturnQty, ISNULL(sal.sq, 0) AS soldQty,
         CONVERT(varchar(10), sal.fs, 23) AS firstSale, CONVERT(varchar(10), sal.ls, 23) AS lastSale,
         ISNULL(sal.pqty, 0) AS periodSoldQty, ISNULL(sal.pval, 0) AS periodSalesValue, ISNULL(sal.pbills, 0) AS periodBillLines,
         ISNULL(sd.prate, 0) AS costPrice, ISNULL(sd.mrp, 0) AS mrp,
         (CASE WHEN @live = 1 THEN sd.q ELSE ISNULL(pur.pq, sd.q) END) - ISNULL(sal.sq, 0) - ISNULL(ret.rq, 0) AS stockQty,
         ISNULL(pur.pn, 0) AS purchaseRows, sd.sdn AS stockRows
  FROM sd
  LEFT JOIN pur ON pur.bc = sd.bc
  LEFT JOIN sal ON sal.bc = sd.bc
  LEFT JOIN ret ON ret.bc = sd.bc
  LEFT JOIN prod ON prod.code = sd.code
) AS y
WHERE y.stockQty <> 0 OR y.periodSoldQty > 0`;

interface Loaded {
    lots: ClassifiedLot[];
    quality: { duplicateStockRows: number; multiPurchaseBarcodes: number };
}
const cache = new Map<string, { at: number; value: Promise<Loaded> }>();

async function loadLots(asOf: string, from: string, to: string, live: boolean, refresh: boolean): Promise<Loaded> {
    const key = `${asOf}|${from}|${to}|${live ? 1 : 0}`;
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < 60_000 && !refresh) return hit.value;
    const value = (async (): Promise<Loaded> => {
        const req = (await getPool()).request();
        req.input("asOf", asOf);
        req.input("from", from);
        req.input("to", to);
        req.input("live", live ? 1 : 0);
        const res = await req.query(SESSION_PREFIX + LOT_SQL);
        const rows: Row[] = res ? res.recordset : [];
        let duplicateStockRows = 0;
        let multiPurchaseBarcodes = 0;
        const lots = rows.map((r): ClassifiedLot => {
            if (num(r.stockRows) > 1) duplicateStockRows += 1;
            if (num(r.purchaseRows) > 1) multiPurchaseBarcodes += 1;
            const lot: AnalysisLot = {
                barcode: String(r.barcode ?? ""),
                name: str(r.name) ?? String(r.barcode ?? ""),
                category: str(r.category),
                subCategory: str(r.subCategory),
                brand: str(r.brand),
                size: str(r.size),
                color: str(r.color),
                supplier: str(r.supplier),
                grnNo: str(r.grnNo),
                firstPurchase: str(r.firstPurchase),
                lastPurchase: str(r.lastPurchase),
                purchasedQty: num(r.purchasedQty),
                purchaseReturnQty: num(r.purchaseReturnQty),
                soldQty: num(r.soldQty),
                firstSale: str(r.firstSale),
                lastSale: str(r.lastSale),
                periodSoldQty: num(r.periodSoldQty),
                periodSalesValue: num(r.periodSalesValue),
                periodBillLines: num(r.periodBillLines),
                costPrice: num(r.costPrice),
                mrp: num(r.mrp),
                stockQty: Math.round(num(r.stockQty) * 1000) / 1000,
            };
            return classify(lot, asOf);
        });
        return { lots, quality: { duplicateStockRows, multiPurchaseBarcodes } };
    })();
    cache.set(key, { at: Date.now(), value });
    try {
        return await value;
    } catch (err) {
        cache.delete(key);
        throw err;
    }
}

export interface StockAnalysisQuery {
    asOf?: string;
    days?: string; // 7 | 30 | 60 | 90 | 180 | 365
    from?: string; // custom sales period
    to?: string;
    category?: string;
    subCategory?: string;
    product?: string;
    brand?: string;
    supplier?: string;
    barcode?: string;
    size?: string;
    color?: string;
    stockStatus?: string; // in-stock | never-sold | sold-out
    bucket?: string;
    mgmtClass?: string;
    sellThrough?: string;
    by?: string; // drill: category | subCategory | product | variant | barcode
    page?: string;
    limit?: string;
    leadDays?: string;
    safetyDays?: string;
    coverDays?: string;
    soonDays?: string;
    overstockDays?: string;
    refresh?: string;
    reconcile?: string;
}

const eq = (a: string | null, b: string | undefined): boolean => !b || (a ?? "").toLowerCase() === b.toLowerCase();
const UNSET = "(not set)";

function applyFilters(lots: ClassifiedLot[], q: StockAnalysisQuery): ClassifiedLot[] {
    const bc = (q.barcode ?? "").trim().toLowerCase();
    return lots.filter((l) => {
        if (!eq(l.category, q.category) && !(q.category === UNSET && !l.category)) return false;
        if (!eq(l.subCategory, q.subCategory) && !(q.subCategory === UNSET && !l.subCategory)) return false;
        if (q.product && l.name.toLowerCase() !== q.product.toLowerCase()) return false;
        if (!eq(l.brand, q.brand) || !eq(l.supplier, q.supplier) || !eq(l.size, q.size) || !eq(l.color, q.color)) return false;
        if (bc && !l.barcode.toLowerCase().includes(bc)) return false;
        if (q.stockStatus === "in-stock" && l.stockQty <= 0) return false;
        if (q.stockStatus === "never-sold" && !l.neverSold) return false;
        if (q.stockStatus === "sold-out" && l.stockQty > 0) return false;
        if (q.bucket && (l.stockQty <= 0 || l.bucket !== q.bucket)) return false;
        if (q.mgmtClass && (l.stockQty <= 0 || l.mgmtClass !== q.mgmtClass)) return false;
        if (q.sellThrough && (l.stockQty <= 0 || l.sellThroughBand !== q.sellThrough)) return false;
        return true;
    });
}

const distinct = (lots: ClassifiedLot[], f: (l: ClassifiedLot) => string | null): string[] =>
    [...new Set(lots.map(f).filter((v): v is string => !!v))].sort((a, b) => a.localeCompare(b)).slice(0, 500);

const isFast = (l: ClassifiedLot): boolean => l.stockQty > 0 && (l.sellThroughPct ?? 0) >= 76;
const isSlow = (l: ClassifiedLot): boolean => l.stockQty > 0 && (l.mgmtClass === "SLOW" || l.mgmtClass === "VERY SLOW" || l.mgmtClass === "DEAD / CLEARANCE REVIEW");

const r2 = (n: number): number => Math.round(n * 100) / 100;
const slim = (l: ClassifiedLot): Doc => ({ ...l });

export async function sqlStockAnalysis(q: StockAnalysisQuery): Promise<Doc> {
    const shop = await shopAsOf();
    if (!shop) return { asOf: null, message: "No sales found in the shop database.", source: "sql" };
    const asOf = validDate(q.asOf) ?? shop;

    // Sales analysis period: preset days, else a custom range, else 90 days. Always ends on/before the as-of date.
    const presets = [7, 30, 60, 90, 180, 365];
    let to = validDate(q.to) ?? asOf;
    let from = validDate(q.from);
    if (to > asOf) to = asOf;
    if (!from) {
        const d = Number(q.days);
        const days = presets.includes(d) ? d : 90;
        from = addDaysIso(to, -(days - 1));
    }
    if (from > to) [from, to] = [to, from];
    const periodDays = (daysBetween(from, to) ?? 0) + 1;

    // The scan can take longer than the 30s HTTP limit on a big shop database: wait up to 20s, otherwise answer
    // "loading" and let the screen ask again (the scan keeps running and is cached for 60s once done).
    const pending = loadLots(asOf, from, to, asOf >= shop, q.refresh === "1");
    const loaded = await Promise.race([pending, new Promise<null>((resolve) => setTimeout(() => resolve(null), 20_000))]);
    if (!loaded) {
        pending.catch(() => undefined);
        return { loading: true, asOf, period: { from, to, days: periodDays }, source: "sql" };
    }
    const all = loaded.lots;
    const filtered = applyFilters(all, q);
    const inStock = filtered.filter((l) => l.stockQty > 0);

    const settings: ReorderSettings = {
        leadDays: optNum(q.leadDays),
        safetyDays: optNum(q.safetyDays),
        coverDays: optNum(q.coverDays),
        soonDays: optNum(q.soonDays),
        overstockDays: optNum(q.overstockDays),
    };
    const base = {
        asOf,
        period: { from, to, days: periodDays },
        filters: Object.fromEntries(Object.entries(q).filter(([k, v]) => v && !["page", "limit", "by", "refresh"].includes(k))),
        source: "sql",
    };

    // ---- Drill-down (Overall -> Category -> Product -> Variant -> Barcode) -------------------------------
    if (q.by) {
        const keyOf: Record<string, (l: ClassifiedLot) => string> = {
            category: (l) => l.category ?? UNSET,
            subCategory: (l) => l.subCategory ?? UNSET,
            product: (l) => l.name,
            variant: (l) => `${l.size ?? "—"} · ${l.color ?? "—"}`,
        };
        if (q.by === "barcode") {
            const sorted = [...filtered].sort((a, b) => b.stockCostValue - a.stockCostValue || (b.ageDays ?? -1) - (a.ageDays ?? -1));
            const limit = Math.min(Math.max(Number(q.limit) || 100, 1), 50_000);
            const page = Math.max(Number(q.page) || 1, 1);
            return { ...base, by: "barcode", items: sorted.slice((page - 1) * limit, page * limit).map(slim), pagination: { page, limit, total: sorted.length, pages: Math.max(1, Math.ceil(sorted.length / limit)) } };
        }
        const fn = keyOf[q.by];
        if (!fn) return { ...base, message: "Unknown drill level.", items: [] };
        return { ...base, by: q.by, items: groupBy(filtered, fn, periodDays) };
    }

    // ---- Summary --------------------------------------------------------------------------------------
    const total = metricsFor("Total", filtered, periodDays);
    const never = inStock.filter((l) => l.neverSold);
    const reorder = reorderRows(filtered, periodDays, settings);
    const reorderNeeded = reorder.filter((r) => r.status === "REORDER NOW" || r.status === "REORDER SOON").length;
    const sumCost = (xs: ClassifiedLot[]): number => r2(xs.reduce((a, l) => a + l.stockCostValue, 0));
    const sumQty = (xs: ClassifiedLot[]): number => Math.round(xs.reduce((a, l) => a + l.stockQty, 0) * 1000) / 1000;
    const dead = inStock.filter((l) => l.clearance === "DEAD STOCK");

    const kpis = {
        stockQty: total.stockQty,
        stockCostValue: total.stockCostValue,
        stockMrpValue: total.stockMrpValue,
        periodSalesValue: total.periodSalesValue,
        periodSoldQty: total.periodSoldQty,
        grossProfit: total.grossProfit,
        grossMarginPct: total.grossMarginPct,
        sellThroughPct: total.sellThroughPct,
        value90: total.value90,
        value180: total.value180,
        value365: total.value365,
        deadStockValue: sumCost(dead),
        fastMoving: { lots: inStock.filter(isFast).length, qty: sumQty(inStock.filter(isFast)), value: sumCost(inStock.filter(isFast)) },
        slowMoving: { lots: inStock.filter(isSlow).length, qty: sumQty(inStock.filter(isSlow)), value: sumCost(inStock.filter(isSlow)) },
        neverSold: { lots: never.length, qty: sumQty(never), value: sumCost(never) },
        itemsRequiringReorder: settingsComplete(settings) ? reorderNeeded : null,
        turnover: total.turnover,
        avgDailySales: total.avgDailySales,
        daysOfCover: total.daysOfCover,
    };

    const bucketRows = STOCK_AGE_BUCKETS.map(({ key }) => {
        const xs = inStock.filter((l) => l.bucket === key);
        return { key, ...bucketLabel(key, asOf), lots: xs.length, qty: sumQty(xs), costValue: sumCost(xs), mrpValue: r2(xs.reduce((a, l) => a + l.stockMrpValue, 0)) };
    });
    const classRows = MGMT_CLASSES.map(({ key, range }) => {
        const xs = inStock.filter((l) => l.mgmtClass === key);
        return { key, range, lots: xs.length, qty: sumQty(xs), costValue: sumCost(xs), mrpValue: r2(xs.reduce((a, l) => a + l.stockMrpValue, 0)) };
    });
    const stBands = [...SELL_THROUGH_BANDS, "n/a" as const].map((key) => {
        const xs = inStock.filter((l) => l.sellThroughBand === key);
        return { key, lots: xs.length, qty: sumQty(xs), costValue: sumCost(xs) };
    });

    // Price bands: derived from the data (cut points returned so management can see them).
    const bands = derivePriceBands(filtered);
    const priceBands = bands.cuts ? groupBy(filtered, (l) => priceBandOf(l, bands.cuts as [number, number], bands.basis), periodDays) : [];

    // Kids segments (by the real category names; segments with no matching category simply do not appear).
    const kidsLots = filtered.filter((l) => kidsSegment(l.category));
    const segOf = (l: ClassifiedLot): string => kidsSegment(l.category) as string;
    const cuts = bands.cuts;
    const kidsDim = (label: string, f: (l: ClassifiedLot) => string): Doc[] =>
        groupBy(kidsLots, (l) => `${segOf(l)} · ${f(l)}`, periodDays).slice(0, 60).map((m) => ({ dimension: label, ...m }));
    const kids = {
        categoriesUsed: distinct(kidsLots, (l) => l.category),
        segments: groupBy(kidsLots, segOf, periodDays),
        byProduct: kidsDim("Product", (l) => l.name),
        bySize: kidsDim("Size", (l) => l.size ?? "—"),
        byPriceBand: cuts ? kidsDim("Price band", (l) => priceBandOf(l, cuts, bands.basis)) : [],
        bySupplier: kidsDim("Supplier", (l) => l.supplier ?? UNSET),
    };

    // Suppliers (+ fast / slow moving barcode counts).
    const suppliers = groupBy(filtered, (l) => l.supplier ?? UNSET, periodDays).map((m) => {
        const xs = inStock.filter((l) => (l.supplier ?? UNSET) === m.key);
        return { ...m, fastLots: xs.filter(isFast).length, slowLots: xs.filter(isSlow).length };
    });

    const clearanceLots = inStock.filter((l) => l.clearance);
    const rank = (l: ClassifiedLot): number => l.stockCostValue * (l.ageDays ?? 0);
    const clearanceCounts = ["WATCH", "MARKDOWN REVIEW", "CLEARANCE REVIEW", "DEAD STOCK"].map((key) => {
        const xs = clearanceLots.filter((l) => l.clearance === key);
        return { key, lots: xs.length, qty: sumQty(xs), costValue: sumCost(xs) };
    });
    const order: Record<string, number> = { "REORDER NOW": 0, "REORDER SOON": 1, "CONFIG NEEDED": 2, OVERSTOCKED: 3, HEALTHY: 4, "NO RECENT SALES": 5 };

    // Reconciliation with the existing Stock Status / Aged Stock numbers (only meaningful for the live as-of).
    let reconciliation: Doc | null = null;
    if (asOf >= shop && q.reconcile === "1") {
        const snap = await getStockSnapshot("stock-analysis", q.refresh === "1");
        if (snap) {
            const mineQty = all.filter((l) => l.stockQty > 0).reduce((a, l) => a + l.stockQty, 0);
            const mineVal = all.filter((l) => l.stockQty > 0).reduce((a, l) => a + l.stockCostValue, 0);
            const theirQty = snap.rows.reduce((a, r) => a + r.remainingQty, 0);
            const theirVal = snap.rows.reduce((a, r) => a + r.value, 0);
            reconciliation = {
                thisReportQty: Math.round(mineQty * 1000) / 1000,
                stockReportsQty: Math.round(theirQty * 1000) / 1000,
                qtyDifference: Math.round((mineQty - theirQty) * 1000) / 1000,
                thisReportCostValue: r2(mineVal),
                stockReportsCostValue: r2(theirVal),
                valueDifference: r2(mineVal - theirVal),
                note: "Unfiltered, stock > 0. A non-zero difference means the two reports disagree and must be explained before the numbers are used.",
            };
        }
    }

    return {
        ...base,
        kpis,
        ageBuckets: bucketRows,
        mgmtClasses: classRows,
        sellThroughBands: stBands,
        categories: groupBy(filtered, (l) => l.category ?? UNSET, periodDays),
        subCategories: groupBy(filtered, (l) => `${l.category ?? UNSET} › ${l.subCategory ?? UNSET}`, periodDays).slice(0, 200),
        kids,
        priceBands: { basis: bands.basis, cuts: bands.cuts, rows: priceBands },
        suppliers,
        neverSold: {
            totals: { lots: never.length, qty: sumQty(never), costValue: sumCost(never) },
            items: [...never].sort((a, b) => b.stockCostValue - a.stockCostValue).slice(0, 300).map(slim),
        },
        clearance: { counts: clearanceCounts, items: [...clearanceLots].sort((a, b) => rank(b) - rank(a)).slice(0, 300).map(slim) },
        reorder: {
            settings,
            configMissing: !settingsComplete(settings),
            note: settingsComplete(settings)
                ? "Reorder point = average daily sales x (lead days + safety days). Safety stock is entered as days of sales."
                : "Lead time, safety days, target cover, 'soon' window and overstock cover are not stored anywhere in the shop database. Enter them above; nothing is guessed.",
            rows: reorder.sort((a, b) => order[a.status] - order[b.status] || b.periodSoldQty - a.periodSoldQty).slice(0, 300),
        },
        filterOptions: {
            categories: distinct(all, (l) => l.category),
            subCategories: distinct(all, (l) => l.subCategory),
            brands: distinct(all, (l) => l.brand),
            suppliers: distinct(all, (l) => l.supplier),
            sizes: distinct(all, (l) => l.size),
            colors: distinct(all, (l) => l.color),
        },
        unavailable: [
            { field: "Gender / Age group", reason: "No column for it in the product tables checked so far. Boys/Girls/Baby are derived from the category name only." },
            { field: "Traditional vs casual wear", reason: "No style/occasion attribute is known to exist." },
            { field: "Branch / store", reason: "Single shop database; no branch column." },
            { field: "Stock adjustments", reason: "No adjustment table has been found; stock is purchased - sold - purchase returns." },
            { field: "Sales returns", reason: "Not deducted from sold quantity here until salsntryReturn is verified; sell-through may be slightly understated." },
            { field: "Open purchase orders", reason: "Not included in the recommended order quantity yet." },
        ],
        dataQuality: {
            stockLotsWithoutPurchaseDate: inStock.filter((l) => !l.firstPurchase).length,
            negativeStockBarcodes: all.filter((l) => l.stockQty < 0).length,
            stockLotsWithoutCategory: inStock.filter((l) => !l.category).length,
            stockLotsWithoutSupplier: inStock.filter((l) => !l.supplier).length,
            barcodesWithMultiplePurchaseRows: loaded.quality.multiPurchaseBarcodes,
            barcodesDuplicatedInStockdetails: loaded.quality.duplicateStockRows,
            costNote: "Gross profit uses sale value minus (pieces sold x the barcode's current purchase rate); the sale lines carry no cost.",
        },
        reconciliation,
    };
}
