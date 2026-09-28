import fs from "fs";
import path from "path";
import { Types } from "mongoose";
import Item from "../../modules/inventory/models/Item.js";
import { AppError } from "../../utils/AppError.js";
import { info, warn } from "../../config/logger.js";
import { buildItemPageQueries, buildSelect, buildStatsQuery, validateMapping, type BuiltQuery, type ItemQueryOptions } from "./mapping.js";
import { loadDbConfig, openPool, streamRows, type ShopDbPool } from "./shopDbReader.js";
import { materializeShopItems } from "./sqlItemOverlay.js";
import { transformRow } from "./transform.js";
import type { ShopDbMapping, ShopItem } from "./types.js";

/**
 * ITEM_DATA_SOURCE=sql: serves the ERP's item reads from the Textilesoft SQL Server database.
 * Read-only towards the shop DB; see sqlItemOverlay.ts for how ERP-side stock movements are layered on.
 *
 * Environment:
 *   TEXTILESOFT_DB_*            connection (see shopDbReader.ts)
 *   TEXTILESOFT_MAPPING_FILE    mapping JSON (default ./textilesoft.mapping.json, relative to the backend folder)
 *   TEXTILESOFT_LOW_STOCK_DEFAULT  threshold when the shop DB has no per-item reorder level (default 5)
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Doc = Record<string, any>;

let poolPromise: Promise<ShopDbPool> | undefined;
let mappingCache: { file: string; mtimeMs: number; mapping: ShopDbMapping } | undefined;

export async function getPool(): Promise<ShopDbPool> {
    if (!poolPromise) {
        poolPromise = openPool(loadDbConfig()).catch((err) => {
            poolPromise = undefined; // retry on the next request instead of caching the failure
            throw err;
        });
    }
    return poolPromise;
}

export async function closeSqlItemSource(): Promise<void> {
    const p = poolPromise;
    poolPromise = undefined;
    if (p) await (await p.catch(() => undefined))?.close();
}

/** Loads (and re-loads when the file changes) the validated mapping. */
export function getMapping(): ShopDbMapping {
    const file = path.resolve(process.cwd(), process.env.TEXTILESOFT_MAPPING_FILE || "textilesoft.mapping.json");
    let mtimeMs: number;
    try {
        mtimeMs = fs.statSync(file).mtimeMs;
    } catch {
        throw new Error(`Mapping file not found: ${file} (set TEXTILESOFT_MAPPING_FILE, or copy one of the textilesoft.mapping.*.json examples)`);
    }
    if (!mappingCache || mappingCache.file !== file || mappingCache.mtimeMs !== mtimeMs) {
        mappingCache = { file, mtimeMs, mapping: validateMapping(JSON.parse(fs.readFileSync(file, "utf8"))) };
    }
    return mappingCache.mapping;
}

const lowStockDefault = (mapping: ShopDbMapping): number =>
    Number(process.env.TEXTILESOFT_LOW_STOCK_DEFAULT) || mapping.defaults?.lowStockLimit || 5;

async function run(pool: ShopDbPool, q: BuiltQuery): Promise<Record<string, unknown>[]> {
    const req = pool.request();
    for (const p of q.params) req.input(p.name, p.value);
    const result = await req.query(q.text);
    return result ? result.recordset : [];
}

function toShopItems(rows: Record<string, unknown>[], mapping: ShopDbMapping): ShopItem[] {
    const items: ShopItem[] = [];
    for (const row of rows) {
        const r = transformRow(row, mapping);
        if (r.ok) items.push(r.item);
        else warn(`[sql-items] skipped shop row: ${r.reason}`);
    }
    return items;
}

export interface SqlListParams {
    page?: string | number;
    limit?: string | number;
    search?: string;
    category?: string;
    brand?: string;
    size?: string;
    color?: string;
    lowStockOnly?: string | boolean;
}

const skipAll = (v: string | undefined): string | undefined => (v && v !== "ALL" ? v : undefined);

/** Same response shape as InventoryService.getAllItemsWithPagination. */
export async function listItems(tenantId: string, params: SqlListParams): Promise<{ items: Doc[]; pagination: Doc; source: "sql" }> {
    const mapping = getMapping();
    const page = parseInt(String(params.page)) || 1;
    const limit = parseInt(String(params.limit)) || 20;
    const opts: ItemQueryOptions = {
        search: params.search || undefined,
        category: skipAll(params.category),
        brand: skipAll(params.brand),
        size: skipAll(params.size),
        color: skipAll(params.color),
        lowStockOnly: params.lowStockOnly === true || params.lowStockOnly === "true",
        lowStockDefault: lowStockDefault(mapping),
        offset: (page - 1) * limit,
        limit,
    };
    const pool = await getPool();
    const queries = buildItemPageQueries(mapping, opts);
    const [rows, countRows] = await Promise.all([run(pool, queries.page), run(pool, queries.count)]);
    const total = Number(countRows[0]?.total ?? 0);
    const items = await materializeShopItems(toShopItems(rows, mapping), tenantId);
    return { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) }, source: "sql" };
}

/** Returns the mirrored item for a barcode/SKU, or undefined when the shop DB doesn't have it. */
export async function findByKey(tenantId: string, key: { barcode?: string; sku?: string }): Promise<Doc | undefined> {
    const mapping = getMapping();
    // A key the mapping doesn't provide would silently match every row -- never look up by it.
    if ((key.barcode && !mapping.columns.barcode) || (key.sku && !mapping.columns.sku) || (!key.barcode && !key.sku)) return undefined;
    const opts: ItemQueryOptions = { ...key, limit: 1, lowStockDefault: lowStockDefault(mapping) };
    const pool = await getPool();
    const rows = await run(pool, buildItemPageQueries(mapping, opts).page);
    const [doc] = await materializeShopItems(toShopItems(rows, mapping), tenantId);
    return doc;
}

/** Refreshes one item (by Mongo id) from SQL. ERP-only items (not in the shop DB) come back unchanged. */
export async function refreshById(itemId: string, tenantId: string): Promise<Doc | null> {
    if (!Types.ObjectId.isValid(itemId)) return null;
    const doc: Doc | null = await Item.findOne({ _id: itemId, tenantId }).lean();
    if (!doc) return null;
    const key = doc.barcode ? { barcode: String(doc.barcode) } : doc.sku ? { sku: String(doc.sku) } : undefined;
    if (!key) return doc;
    return (await findByKey(tenantId, key)) ?? doc;
}

export async function lowStockItems(tenantId: string, cap = 500): Promise<Doc[]> {
    const { items } = await listItems(tenantId, { page: 1, limit: cap, lowStockOnly: true });
    return items;
}

export async function inventoryStats(): Promise<{ totalItems: number; totalStockQuantity: number; totalValuation: number; lowStockCount: number }> {
    const mapping = getMapping();
    const pool = await getPool();
    const [row] = await run(pool, buildStatsQuery(mapping, lowStockDefault(mapping)));
    return {
        totalItems: Number(row?.totalItems ?? 0),
        totalStockQuantity: Math.round(Number(row?.totalStockQuantity ?? 0) * 1000) / 1000,
        totalValuation: Math.round(Number(row?.totalValuation ?? 0) * 100) / 100,
        lowStockCount: Number(row?.lowStockCount ?? 0),
    };
}

/** Wraps a SQL read so a shop-DB outage degrades to the (last mirrored) Mongo data instead of a 500. */
export async function withMongoFallback<T>(label: string, sql: () => Promise<T>, mongo: () => Promise<T>): Promise<T> {
    try {
        return await sql();
    } catch (err) {
        if (err instanceof AppError) throw err;
        warn(`[sql-items] ${label}: shop DB read failed, serving MongoDB data instead - ${(err as Error).message}`);
        return mongo();
    }
}

// ---------------------------------------------------------------------------------------------
// Full mirror. Reports, stock aging, filters, purchase/POS screens read MongoDB directly, so in SQL
// mode the whole shop catalogue is copied into MongoDB in the background (once per tenant after
// start-up, then every TEXTILESOFT_MIRROR_INTERVAL_MIN minutes, default 60; 0 = only once).
// ---------------------------------------------------------------------------------------------

export interface MirrorResult {
    items: number;
    skipped: number;
    seconds: number;
    finishedAt: string;
    error?: string;
}

interface MirrorState {
    running?: Promise<MirrorResult>;
    last?: MirrorResult;
    lastStartedAt?: number;
}
const mirrors = new Map<string, MirrorState>();

/** Mirrors already-fetched batches of raw shop rows (exported for tests). */
export async function mirrorRows(tenantId: string, batches: AsyncIterable<Record<string, unknown>[]>, mapping: ShopDbMapping): Promise<{ items: number; skipped: number }> {
    let items = 0;
    let skipped = 0;
    for await (const rows of batches) {
        const shopItems: ShopItem[] = [];
        for (const row of rows) {
            const r = transformRow(row, mapping);
            if (r.ok) shopItems.push(r.item);
            else skipped++;
        }
        await materializeShopItems(shopItems, tenantId);
        items += shopItems.length;
    }
    return { items, skipped };
}

export function mirrorAll(tenantId: string): Promise<MirrorResult> {
    const state = mirrors.get(tenantId) ?? {};
    mirrors.set(tenantId, state);
    if (state.running) return state.running;
    state.lastStartedAt = Date.now();
    const started = Date.now();
    state.running = (async (): Promise<MirrorResult> => {
        try {
            const mapping = getMapping();
            // Include sold-out lots so their stock in MongoDB drops to 0 instead of going stale.
            const wide: ShopDbMapping = mapping.stock ? { ...mapping, stock: { ...mapping.stock, inStockOnly: false } } : mapping;
            const pool = await getPool();
            const { items, skipped } = await mirrorRows(tenantId, streamRows(pool, buildSelect(wide), 1000), mapping);
            const result: MirrorResult = { items, skipped, seconds: Math.round((Date.now() - started) / 100) / 10, finishedAt: new Date().toISOString() };
            info(`[sql-items] mirrored ${items} items (${skipped} skipped) for tenant ${tenantId} in ${result.seconds}s`);
            state.last = result;
            return result;
        } catch (err) {
            const result: MirrorResult = { items: 0, skipped: 0, seconds: Math.round((Date.now() - started) / 100) / 10, finishedAt: new Date().toISOString(), error: (err as Error).message };
            warn(`[sql-items] mirror failed for tenant ${tenantId}: ${result.error}`);
            state.last = result;
            return result;
        } finally {
            state.running = undefined;
        }
    })();
    return state.running;
}

/** Fire-and-forget: starts a mirror if none has run yet (or the last one is older than the interval). */
export function ensureMirror(tenantId: string): void {
    const state = mirrors.get(tenantId);
    if (state?.running) return;
    const everyMin = Number(process.env.TEXTILESOFT_MIRROR_INTERVAL_MIN ?? 60);
    const due = !state?.lastStartedAt || (everyMin > 0 && Date.now() - state.lastStartedAt > everyMin * 60_000);
    if (due) void mirrorAll(tenantId);
}

export function mirrorStatus(tenantId: string): { running: boolean; last?: MirrorResult } {
    const s = mirrors.get(tenantId);
    return { running: !!s?.running, last: s?.last };
}
