import { Types } from "mongoose";
import Item from "../../modules/inventory/models/Item.js";
import StockLog from "../../modules/inventory/models/StockLog.js";
import { buildSelect } from "./mapping.js";
import { streamRows, type ShopDbPool } from "./shopDbReader.js";
import { transformRow } from "./transform.js";
import type { ShopDbMapping, ShopItem, StockMode, SyncReport } from "./types.js";

export interface SyncOptions {
    tenantId: string;
    /** Recorded as `addedBy` / stock-log `performedBy`. */
    addedBy: string;
    dryRun: boolean;
    /**
     * off           - never touch stockQty
     * initial-only  - set stock only for newly created items (safe once the ERP itself is selling)
     * overwrite     - shop DB is the source of truth: stockQty is set to the shop value every run
     */
    stockMode: StockMode;
    batchSize?: number;
    log?: (message: string) => void;
}

interface RunState {
    tenantId: Types.ObjectId;
    seenKeys: Set<string>;
    seenNames: Set<string>;
}

// Fields refreshed on existing items (name is never rewritten: it carries the per-tenant unique index).
const UPDATABLE = [
    "category", "brand", "hsnCode", "gstRate", "unit", "color", "size", "design", "pattern",
    "modelNo", "fashionName", "shelfCode", "costPrice", "sellingPrice", "wholesaleRate",
    "lowStockLimit", "isActive",
] as const;

const emptyReport = (): SyncReport => ({
    read: 0, inserted: 0, updated: 0, unchanged: 0, stockAdjusted: 0,
    skipped: 0, duplicates: 0, renamed: 0, warnings: 0, errors: [],
});

const lower = (s: string | undefined) => (s ? s.toLowerCase() : undefined);
const identity = (i: ShopItem) => lower(i.barcode) ?? lower(i.sku) ?? `name:${i.name.toLowerCase()}`;
const sameNumber = (a: unknown, b: unknown) => typeof a === "number" && typeof b === "number" && Math.abs(a - b) < 0.0005;

/** Reads the shop DB in batches and upserts into the ERP tenant. Never writes to the shop DB. */
export async function runSync(pool: ShopDbPool, mapping: ShopDbMapping, opts: SyncOptions): Promise<SyncReport> {
    if (!Types.ObjectId.isValid(opts.tenantId)) throw new Error(`Invalid tenant id: ${opts.tenantId}`);
    const report = emptyReport();
    const state: RunState = { tenantId: new Types.ObjectId(opts.tenantId), seenKeys: new Set(), seenNames: new Set() };
    const query = buildSelect(mapping);
    let rowNo = 0;

    for await (const rows of streamRows(pool, query, opts.batchSize ?? 500)) {
        const items: ShopItem[] = [];
        for (const row of rows) {
            rowNo++;
            report.read++;
            const result = transformRow(row, mapping);
            if (!result.ok) {
                report.skipped++;
                report.errors.push({ row: rowNo, message: result.reason });
                continue;
            }
            report.warnings += result.warnings.length;
            const key = identity(result.item);
            if (state.seenKeys.has(key)) {
                report.duplicates++;
                report.errors.push({ row: rowNo, message: `duplicate barcode/SKU/name in shop DB, kept first: "${result.item.name}"` });
                continue;
            }
            state.seenKeys.add(key);
            items.push(result.item);
        }
        if (items.length) await syncBatch(items, state, opts, report);
        opts.log?.(`read ${report.read} | +${report.inserted} new, ${report.updated} updated, ${report.unchanged} unchanged, ${report.skipped} skipped`);
    }
    return report;
}

async function syncBatch(items: ShopItem[], state: RunState, opts: SyncOptions, report: SyncReport): Promise<void> {
    const barcodes = items.map((i) => i.barcode).filter((v): v is string => !!v);
    const skus = items.map((i) => i.sku).filter((v): v is string => !!v);
    const names = items.map((i) => i.name);
    const or: Record<string, unknown>[] = [{ name: { $in: names } }];
    if (barcodes.length) or.push({ barcode: { $in: barcodes } });
    if (skus.length) or.push({ sku: { $in: skus } });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing: any[] = await Item.find({ tenantId: state.tenantId, $or: or }).lean();
    const byBarcode = new Map<string, any>(); // eslint-disable-line @typescript-eslint/no-explicit-any
    const bySku = new Map<string, any>(); // eslint-disable-line @typescript-eslint/no-explicit-any
    const byName = new Map<string, any>(); // eslint-disable-line @typescript-eslint/no-explicit-any
    for (const ex of existing) {
        if (ex.barcode) byBarcode.set(String(ex.barcode).toLowerCase(), ex);
        if (ex.sku) bySku.set(String(ex.sku).toLowerCase(), ex);
        byName.set(String(ex.name).toLowerCase(), ex);
        state.seenNames.add(String(ex.name).toLowerCase());
    }

    const ops: Record<string, unknown>[] = [];
    const logs: Record<string, unknown>[] = [];

    for (const item of items) {
        let match = (item.barcode && byBarcode.get(item.barcode.toLowerCase())) || (item.sku && bySku.get(item.sku.toLowerCase())) || undefined;
        if (!match) {
            // Same-name item is the same product only if it doesn't carry a *different* barcode/SKU
            // (legacy data has many size/colour variants sharing one name).
            const byNameHit = byName.get(item.name.toLowerCase());
            if (
                byNameHit &&
                (!item.barcode || !byNameHit.barcode || lower(item.barcode) === lower(byNameHit.barcode)) &&
                (!item.sku || !byNameHit.sku || lower(item.sku) === lower(byNameHit.sku))
            ) {
                match = byNameHit;
            }
        }

        if (match) {
            const $set: Record<string, unknown> = {};
            for (const f of UPDATABLE) {
                const v = item[f];
                if (v === undefined) continue;
                const cur = match[f];
                if (typeof v === "number" ? !sameNumber(cur, v) : cur !== v) $set[f] = v;
            }
            if (item.barcode && !match.barcode) $set.barcode = item.barcode;
            if (item.sku && !match.sku) $set.sku = item.sku;

            let stockDelta = 0;
            if (opts.stockMode === "overwrite" && item.stockQty !== undefined && !sameNumber(match.stockQty, item.stockQty)) {
                stockDelta = item.stockQty - (match.stockQty ?? 0);
                $set.stockQty = item.stockQty;
            }

            if (Object.keys($set).length === 0) {
                report.unchanged++;
                continue;
            }
            report.updated++;
            ops.push({ updateOne: { filter: { _id: match._id }, update: { $set } } });
            if (stockDelta !== 0) {
                report.stockAdjusted++;
                logs.push(stockLog(match._id, state.tenantId, "ADJUST", stockDelta, item.stockQty as number, opts));
            }
            continue;
        }

        // New item. The ERP enforces unique names per tenant, so disambiguate variants that share a name.
        let name = item.name;
        if (state.seenNames.has(name.toLowerCase())) {
            const suffix = item.sku ?? item.barcode ?? "";
            let candidate = suffix ? `${item.name} - ${suffix}` : item.name;
            for (let n = 2; state.seenNames.has(candidate.toLowerCase()); n++) candidate = `${item.name} - ${suffix || "dup"} (${n})`;
            name = candidate;
            report.renamed++;
        }
        state.seenNames.add(name.toLowerCase());

        const _id = new Types.ObjectId();
        const qty = opts.stockMode === "off" ? 0 : item.stockQty ?? 0;
        const document: Record<string, unknown> = { _id, tenantId: state.tenantId, addedBy: opts.addedBy, name, stockQty: qty };
        for (const f of UPDATABLE) if (item[f] !== undefined) document[f] = item[f];
        if (item.barcode) document.barcode = item.barcode;
        if (item.sku) document.sku = item.sku;
        report.inserted++;
        ops.push({ insertOne: { document } });
        if (qty > 0) logs.push(stockLog(_id, state.tenantId, "INIT", qty, qty, opts));
    }

    if (opts.dryRun || ops.length === 0) return;

    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await Item.bulkWrite(ops as any, { ordered: false });
    } catch (err) {
        // ordered:false keeps going after a failing op; report which ones failed.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const writeErrors: any[] = (err as any)?.writeErrors ?? [];
        if (writeErrors.length === 0) throw err;
        for (const we of writeErrors) report.errors.push({ message: `write failed: ${we.errmsg ?? we.err?.errmsg ?? "unknown error"}` });
    }
    if (logs.length) {
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await StockLog.insertMany(logs as any, { ordered: false });
        } catch (err) {
            report.errors.push({ message: `stock log write failed: ${(err as Error).message}` });
        }
    }
}

function stockLog(itemId: unknown, tenantId: Types.ObjectId, type: "INIT" | "ADJUST", delta: number, finalQty: number, opts: SyncOptions) {
    return { itemId, tenantId, type, delta, finalQty, reason: "Textilesoft sync", performedBy: opts.addedBy };
}
