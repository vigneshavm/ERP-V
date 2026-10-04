import fs from "fs";
import path from "path";
import { warn } from "../../config/logger.js";
import {
  buildItemPageQueries,
  buildStatsQuery,
  buildDistinctQuery,
  validateMapping,
  type BuiltQuery,
  type ItemQueryOptions,
} from "./mapping.js";
import type { ShopDbPool } from "./shopDbReader.js";
import {
  getShopPool as getPool,
  closeShopPool as closeSqlItemSource,
} from "./shopDbPool.js";
import { transformRow } from "./transform.js";
import type { ShopDbMapping, ShopItem } from "./types.js";

/**
 * ITEM_DATA_SOURCE=sql: serves the ERP's item reads from the Textilesoft SQL Server database.
 * Read-only towards the shop DB.
 *
 * Environment:
 *   TEXTILESOFT_DB_*            connection (see shopDbReader.ts)
 *   TEXTILESOFT_MAPPING_FILE    mapping JSON (default ./textilesoft.mapping.json, relative to the backend folder)
 *   TEXTILESOFT_LOW_STOCK_DEFAULT  threshold when the shop DB has no per-item reorder level (default 5)
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Doc = Record<string, any>;

let mappingCache:
  { file: string; mtimeMs: number; mapping: ShopDbMapping } | undefined;
export { getPool, closeSqlItemSource };

/** Loads (and re-loads when the file changes) the validated mapping. */
export function getMapping(): ShopDbMapping {
  const file = path.resolve(
    process.cwd(),
    process.env.TEXTILESOFT_MAPPING_FILE || "textilesoft.mapping.json",
  );
  let mtimeMs: number;
  try {
    mtimeMs = fs.statSync(file).mtimeMs;
  } catch {
    throw new Error(
      `Mapping file not found: ${file} (set TEXTILESOFT_MAPPING_FILE, or copy one of the textilesoft.mapping.*.json examples)`,
    );
  }
  if (
    !mappingCache ||
    mappingCache.file !== file ||
    mappingCache.mtimeMs !== mtimeMs
  ) {
    mappingCache = {
      file,
      mtimeMs,
      mapping: validateMapping(JSON.parse(fs.readFileSync(file, "utf8"))),
    };
  }
  return mappingCache.mapping;
}

const lowStockDefault = (mapping: ShopDbMapping): number =>
  Number(process.env.TEXTILESOFT_LOW_STOCK_DEFAULT) ||
  mapping.defaults?.lowStockLimit ||
  5;

async function run(
  pool: ShopDbPool,
  q: BuiltQuery,
): Promise<Record<string, unknown>[]> {
  const req = pool.request();
  for (const p of q.params) req.input(p.name, p.value);
  const result = await req.query(q.text);
  return result ? result.recordset : [];
}

function toShopItems(
  rows: Record<string, unknown>[],
  mapping: ShopDbMapping,
): ShopItem[] {
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

const skipAll = (v: string | undefined): string | undefined =>
  v && v !== "ALL" ? v : undefined;

/** Same response shape as InventoryService.getAllItemsWithPagination. */
type ListResult = { items: Doc[]; pagination: Doc; source: "sql" };
const listCache = new Map<string, { at: number; value: Promise<ListResult> }>();

/**
 * Item list. Each page + count query recomputes stock from the whole sales table, and the app asks for the
 * full catalogue on every load, so identical requests share one result for 30s (in-flight ones share the
 * same query) instead of each running its own scan.
 */
export async function listItems(tenantId: string, params: SqlListParams): Promise<ListResult> {
  const key = JSON.stringify(params ?? {});
  const hit = listCache.get(key);
  if (hit && Date.now() - hit.at < 30_000) return hit.value;
  const value = listItemsUncached(tenantId, params);
  listCache.set(key, { at: Date.now(), value });
  value.catch(() => {
    if (listCache.get(key)?.value === value) listCache.delete(key);
  });
  if (listCache.size > 50) listCache.delete(listCache.keys().next().value as string);
  return value;
}

async function listItemsUncached(
  _tenantId: string,
  params: SqlListParams,
): Promise<ListResult> {
  const mapping = getMapping();
  const page = Math.max(1, parseInt(String(params.page)) || 1);
  const limit = Math.min(1000, Math.max(1, parseInt(String(params.limit)) || 20));
  const opts: ItemQueryOptions = {
    search: params.search || undefined,
    category: skipAll(params.category),
    brand: skipAll(params.brand),
    size: skipAll(params.size),
    color: skipAll(params.color),
    lowStockOnly:
      params.lowStockOnly === true || params.lowStockOnly === "true",
    lowStockDefault: lowStockDefault(mapping),
    offset: (page - 1) * limit,
    limit,
  };
  const pool = await getPool();
  const queries = buildItemPageQueries(mapping, opts);
  const [rows, countRows] = await Promise.all([
    run(pool, queries.page),
    run(pool, queries.count),
  ]);
  const total = Number(countRows[0]?.total ?? 0);
  const items = toShopItems(rows, mapping).map((item) => {
    const id = String(item.barcode || item.sku || "");
    return { ...item, _id: id, id } as Doc;
  }).filter((item) => item._id);
  return {
    items,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    source: "sql",
  };
}

/** Read a shop item without materializing it into MongoDB. Used by SQL-only POS lookup and billing. */
export async function findByKeyDirect(
  key: { barcode?: string; sku?: string },
): Promise<(ShopItem & { _id: string; id: string }) | undefined> {
  const mapping = getMapping();
  if (
    (key.barcode && !mapping.columns.barcode) ||
    (key.sku && !mapping.columns.sku) ||
    (!key.barcode && !key.sku)
  ) return undefined;
  const pool = await getPool();
  const rows = await run(pool, buildItemPageQueries(mapping, {
    ...key,
    limit: 1,
    lowStockDefault: lowStockDefault(mapping),
  }).page);
  const [item] = toShopItems(rows, mapping);
  if (!item) return undefined;
  // Barcode is the stable transaction key in the shop database; do not invent a Mongo ObjectId.
  const id = String(item.barcode || item.sku || "");
  return id ? { ...item, _id: id, id } : undefined;
}

/** Category values for SQL-backed item selectors, without mirroring products into MongoDB. */
export async function distinctItemCategories(): Promise<string[]> {
  const first = await listItems("", { page: 1, limit: 1000 });
  const categories = new Set(first.items.map((item) => String(item.category ?? "").trim()).filter(Boolean));
  for (let page = 2; page <= Number(first.pagination.pages ?? 1); page++) {
    const result = await listItems("", { page, limit: 1000 });
    for (const item of result.items) {
      const category = String(item.category ?? "").trim();
      if (category) categories.add(category);
    }
  }
  return [...categories].sort((a, b) => a.localeCompare(b));
}

export async function lowStockItems(
  tenantId: string,
  cap = 500,
): Promise<Doc[]> {
  const { items } = await listItems(tenantId, {
    page: 1,
    limit: cap,
    lowStockOnly: true,
  });
  return items;
}

export async function inventoryStats(): Promise<{
  totalItems: number;
  totalStockQuantity: number;
  totalValuation: number;
  lowStockCount: number;
}> {
  const mapping = getMapping();
  const pool = await getPool();
  const [row] = await run(
    pool,
    buildStatsQuery(mapping, lowStockDefault(mapping)),
  );
  return {
    totalItems: Number(row?.totalItems ?? 0),
    totalStockQuantity:
      Math.round(Number(row?.totalStockQuantity ?? 0) * 1000) / 1000,
    totalValuation: Math.round(Number(row?.totalValuation ?? 0) * 100) / 100,
    lowStockCount: Number(row?.lowStockCount ?? 0),
  };
}

/** Brand / size / colour values that exist in the shop's items, for the inventory filter dropdowns. */
export async function itemFilterOptions(): Promise<{ brands: string[]; sizes: string[]; colors: string[]; shelves: never[] }> {
  const mapping = getMapping();
  const pool = await getPool();
  const values = async (field: "brand" | "size" | "color"): Promise<string[]> => {
    const q = buildDistinctQuery(mapping, field);
    if (!q) return [];
    try {
      return (await run(pool, q)).map((r) => String(r.v ?? "")).filter(Boolean);
    } catch (err) {
      warn(`[inventory] ${field} filter values unavailable: ${(err as Error).message}`);
      return [];
    }
  };
  const [brands, sizes, colors] = await Promise.all([values("brand"), values("size"), values("color")]);
  return { brands, sizes, colors, shelves: [] };
}
