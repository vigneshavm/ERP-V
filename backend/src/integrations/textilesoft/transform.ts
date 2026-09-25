import type { ShopDbMapping, ShopItem, TransformResult } from "./types.js";

type Raw = Record<string, unknown>;

const GST_SLABS = [0, 5, 12, 18, 28] as const;

const UNIT_ALIASES: Record<string, string> = {
    nos: "pcs", no: "pcs", pc: "pcs", pcs: "pcs", piece: "pcs", pieces: "pcs", each: "pcs",
    mtr: "m", mtrs: "m", meter: "m", meters: "m", metre: "m", metres: "m", m: "m",
    kg: "kg", kgs: "kg", g: "g", gm: "g", gms: "g",
    pair: "pair", pairs: "pair", set: "set", sets: "set", box: "box", pack: "pack", dozen: "dozen", doz: "dozen",
};

export const str = (v: unknown): string | undefined => {
    if (v === null || v === undefined) return undefined;
    const s = String(v).trim();
    return s === "" ? undefined : s;
};

export const num = (v: unknown): number | undefined => {
    if (v === null || v === undefined || v === "") return undefined;
    if (typeof v === "number") return Number.isFinite(v) ? v : undefined;
    const n = Number(String(v).replace(/,/g, "").trim());
    return Number.isFinite(n) ? n : undefined;
};

const bool = (v: unknown): boolean | undefined => {
    if (v === null || v === undefined || v === "") return undefined;
    if (typeof v === "boolean") return v;
    if (typeof v === "number") return v !== 0;
    const s = String(v).trim().toLowerCase();
    if (["1", "y", "yes", "true", "t", "active", "a"].includes(s)) return true;
    if (["0", "n", "no", "false", "f", "inactive", "i", "d", "deleted"].includes(s)) return false;
    return undefined;
};

const round = (n: number, dp: number): number => {
    const f = 10 ** dp;
    return Math.round(n * f) / f;
};

export function normalizeUnit(raw: string | undefined, fallback: string): string {
    if (!raw) return fallback;
    return UNIT_ALIASES[raw.toLowerCase().replace(/\./g, "")] ?? fallback;
}

/** Turns one raw shop-DB row (keyed by ERP field name, as aliased by buildSelect) into a ShopItem. */
export function transformRow(row: Raw, mapping: ShopDbMapping): TransformResult {
    const warnings: string[] = [];
    const name = str(row.name);
    if (!name) return { ok: false, reason: "missing item name" };

    const sellingPrice = num(row.sellingPrice);
    if (sellingPrice === undefined || sellingPrice < 0) return { ok: false, reason: `invalid selling price for "${name}"` };

    let costPrice = num(row.costPrice);
    if (costPrice === undefined || costPrice < 0) {
        // The ERP requires costPrice; the legacy DB may not track it per product.
        costPrice = 0;
        if (mapping.columns.costPrice) warnings.push(`"${name}": no valid cost price, using 0`);
    }

    let gstRate: ShopItem["gstRate"];
    const rawGst = num(row.gstRate);
    if (rawGst !== undefined) {
        const slab = GST_SLABS.find((s) => s === rawGst);
        if (slab === undefined) warnings.push(`"${name}": GST ${rawGst}% is not a standard slab, ignored`);
        else gstRate = slab;
    }
    if (gstRate === undefined && mapping.defaults?.gstRate !== undefined) {
        gstRate = mapping.defaults.gstRate as ShopItem["gstRate"];
    }

    let stockQty = num(row.stockQty);
    if (stockQty !== undefined) {
        if (stockQty < 0) {
            warnings.push(`"${name}": negative stock ${stockQty} in shop DB, clamped to 0`);
            stockQty = 0;
        }
        stockQty = round(stockQty, 3); // fabric is sold by the metre -- keep fractions
    }

    const wholesaleRate = num(row.wholesaleRate);
    const lowStockLimit = num(row.lowStockLimit) ?? mapping.defaults?.lowStockLimit;

    // Legacy stock is per barcode/lot and many lots share a product name, but the ERP needs unique
    // item names; appending the barcode makes that deterministic instead of order-dependent.
    const barcode = str(row.barcode);
    const item: ShopItem = {
        name: mapping.defaults?.uniqueNames && barcode ? `${name} - ${barcode}` : name,
        sku: str(row.sku),
        barcode,
        category: str(row.category),
        brand: str(row.brand),
        hsnCode: str(row.hsnCode),
        gstRate,
        unit: normalizeUnit(str(row.unit), mapping.defaults?.unit ?? "pcs"),
        color: str(row.color),
        size: str(row.size),
        design: str(row.design),
        pattern: str(row.pattern),
        modelNo: str(row.modelNo),
        fashionName: str(row.fashionName),
        shelfCode: str(row.shelfCode),
        costPrice: round(costPrice, 2),
        sellingPrice: round(sellingPrice, 2),
        wholesaleRate: wholesaleRate !== undefined && wholesaleRate >= 0 ? round(wholesaleRate, 2) : undefined,
        stockQty,
        lowStockLimit: lowStockLimit !== undefined && lowStockLimit >= 0 ? lowStockLimit : undefined,
        isActive: bool(row.isActive),
    };
    return { ok: true, item, warnings };
}
