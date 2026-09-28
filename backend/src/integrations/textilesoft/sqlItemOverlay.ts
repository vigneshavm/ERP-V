import { Types } from "mongoose";
import Item from "../../modules/inventory/models/Item.js";
import StockLog from "../../modules/inventory/models/StockLog.js";
import type { ShopItem } from "./types.js";

/**
 * SQL mode keeps the shop database read-only, but the ERP still has to record sales, purchases and
 * adjustments against stable item ids. So every item read from SQL is mirrored ("materialised") as a
 * MongoDB Item, and:
 *
 *   catalogue fields (name aside), prices, GST, etc.  -> always refreshed from the shop DB
 *   stock shown / stored in Mongo                      -> shop stock  +  ERP movements
 *
 * "ERP movements" are the StockLog deltas the ERP itself wrote (sales, returns, purchases, manual
 * adjustments). Logs created by the SQL mirroring (reason starts with "Textilesoft") and INIT logs
 * are the baseline, not movements, so they are excluded. Because Mongo's stockQty is rewritten on
 * every read, the ERP's existing stock checks (which read Mongo) always see the effective stock.
 */

export const MIRROR_ACTOR = "textilesoft-sql";
const MIRROR_REASON = "Textilesoft SQL baseline";

// Fields refreshed on existing items (name is never rewritten: it carries the per-tenant unique index).
const UPDATABLE = [
    "category", "brand", "hsnCode", "gstRate", "unit", "color", "size", "design", "pattern",
    "modelNo", "fashionName", "shelfCode", "costPrice", "sellingPrice", "wholesaleRate",
    "lowStockLimit", "isActive",
] as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MirroredItem = Record<string, any>;

const lower = (s: unknown): string | undefined => (s ? String(s).toLowerCase() : undefined);
const round3 = (n: number): number => Math.round(n * 1000) / 1000;
const sameNumber = (a: unknown, b: unknown): boolean => typeof a === "number" && typeof b === "number" && Math.abs(a - b) < 0.0005;

/** Sum of ERP-side stock movements per item id (string). */
async function erpMovements(tenantId: Types.ObjectId, itemIds: Types.ObjectId[]): Promise<Map<string, number>> {
    if (itemIds.length === 0) return new Map();
    const rows: { _id: Types.ObjectId; delta: number }[] = await StockLog.aggregate([
        {
            $match: {
                tenantId,
                itemId: { $in: itemIds },
                type: { $ne: "INIT" },
                reason: { $not: /^Textilesoft/ },
            },
        },
        { $group: { _id: "$itemId", delta: { $sum: "$delta" } } },
    ]);
    return new Map(rows.map((r) => [String(r._id), r.delta]));
}

/**
 * Mirrors shop items into Mongo and returns the Mongo documents (lean objects, same order as the
 * input) with effective stock and `availableQuantity` filled in.
 */
export async function materializeShopItems(shopItems: ShopItem[], tenantIdStr: string): Promise<MirroredItem[]> {
    if (shopItems.length === 0) return [];
    const tenantId = new Types.ObjectId(tenantIdStr);

    const barcodes = shopItems.map((i) => i.barcode).filter((v): v is string => !!v);
    const skus = shopItems.map((i) => i.sku).filter((v): v is string => !!v);
    const or: Record<string, unknown>[] = [{ name: { $in: shopItems.map((i) => i.name) } }];
    if (barcodes.length) or.push({ barcode: { $in: barcodes } });
    if (skus.length) or.push({ sku: { $in: skus } });

    const existing: MirroredItem[] = await Item.find({ tenantId, $or: or }).lean();
    const byBarcode = new Map<string, MirroredItem>();
    const bySku = new Map<string, MirroredItem>();
    const byName = new Map<string, MirroredItem>();
    const takenNames = new Set<string>();
    for (const ex of existing) {
        if (ex.barcode) byBarcode.set(lower(ex.barcode) as string, ex);
        if (ex.sku) bySku.set(lower(ex.sku) as string, ex);
        byName.set(lower(ex.name) as string, ex);
        takenNames.add(lower(ex.name) as string);
    }

    const findMatch = (item: ShopItem): MirroredItem | undefined => {
        const hit = (item.barcode && byBarcode.get(item.barcode.toLowerCase())) || (item.sku && bySku.get(item.sku.toLowerCase())) || undefined;
        if (hit) return hit;
        // Same-name item is the same product only if it doesn't carry a *different* barcode/SKU.
        const n = byName.get(item.name.toLowerCase());
        if (n && (!item.barcode || !n.barcode || lower(item.barcode) === lower(n.barcode)) && (!item.sku || !n.sku || lower(item.sku) === lower(n.sku))) return n;
        return undefined;
    };

    const matches = shopItems.map(findMatch);
    const movements = await erpMovements(tenantId, matches.filter((m): m is MirroredItem => !!m).map((m) => m._id as Types.ObjectId));

    const ops: Record<string, unknown>[] = [];
    const logs: Record<string, unknown>[] = [];
    const out: MirroredItem[] = [];

    shopItems.forEach((item, idx) => {
        const match = matches[idx];
        const shopQty = item.stockQty ?? 0;

        if (match) {
            const effective = Math.max(round3(shopQty + (movements.get(String(match._id)) ?? 0)), 0);
            const $set: Record<string, unknown> = {};
            for (const f of UPDATABLE) {
                const v = item[f];
                if (v === undefined) continue;
                const cur = match[f];
                if (typeof v === "number" ? !sameNumber(cur, v) : cur !== v) $set[f] = v;
            }
            if (item.barcode && !match.barcode) $set.barcode = item.barcode;
            if (item.sku && !match.sku) $set.sku = item.sku;
            if (item.stockQty !== undefined && !sameNumber(match.stockQty, effective)) $set.stockQty = effective;
            if (Object.keys($set).length) ops.push({ updateOne: { filter: { _id: match._id }, update: { $set } } });
            out.push({ ...match, ...$set });
            return;
        }

        // New item. Names are unique per tenant, so disambiguate variants that share a name.
        let name = item.name;
        if (takenNames.has(name.toLowerCase())) {
            const suffix = item.sku ?? item.barcode ?? "";
            let candidate = suffix ? `${item.name} - ${suffix}` : item.name;
            for (let n = 2; takenNames.has(candidate.toLowerCase()); n++) candidate = `${item.name} - ${suffix || "dup"} (${n})`;
            name = candidate;
        }
        takenNames.add(name.toLowerCase());

        const _id = new Types.ObjectId();
        const qty = Math.max(round3(shopQty), 0);
        const document: MirroredItem = { _id, tenantId, addedBy: MIRROR_ACTOR, name, stockQty: qty };
        for (const f of UPDATABLE) if (item[f] !== undefined) document[f] = item[f];
        if (item.barcode) document.barcode = item.barcode;
        if (item.sku) document.sku = item.sku;
        ops.push({ insertOne: { document } });
        if (qty > 0) logs.push({ itemId: _id, tenantId, type: "INIT", delta: qty, finalQty: qty, reason: MIRROR_REASON, performedBy: MIRROR_ACTOR });
        out.push(document);
    });

    if (ops.length) {
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await Item.bulkWrite(ops as any, { ordered: false });
        } catch (err) {
            // A failed insert (e.g. unique-name race) must not break the read; the row is still
            // returned from SQL data, just without the Mongo id until the next read.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const writeErrors: any[] = (err as any)?.writeErrors ?? [];
            if (writeErrors.length === 0) throw err;
        }
    }
    if (logs.length) await StockLog.insertMany(logs as any, { ordered: false }).catch(() => undefined); // eslint-disable-line @typescript-eslint/no-explicit-any

    return out.map((doc) => ({ ...doc, availableQuantity: Math.max((doc.stockQty || 0) - (doc.reservedStock || 0), 0) }));
}
