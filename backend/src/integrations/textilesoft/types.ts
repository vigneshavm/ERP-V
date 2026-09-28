/**
 * Textilesoft ("SSS" SQL Server database) -> ERP item adapter: shared types.
 *
 * The adapter is mapping-driven: nothing here hard-codes the legacy table/column names, because
 * the deployed Textilesoft has no source and no schema documentation. Run
 * `npm run discover:textilesoft` against the shop server to generate a suggested mapping, review
 * it, then point `npm run sync:textilesoft` at it.
 */

/** ERP Item fields the adapter can populate from the shop database. */
export const ITEM_FIELDS = [
    "name",
    "sku",
    "barcode",
    "category",
    "brand",
    "hsnCode",
    "gstRate",
    "unit",
    "color",
    "size",
    "design",
    "pattern",
    "modelNo",
    "fashionName",
    "shelfCode",
    "costPrice",
    "sellingPrice",
    "wholesaleRate",
    "stockQty",
    "lowStockLimit",
    "isActive",
] as const;

export type ItemField = (typeof ITEM_FIELDS)[number];

export type FilterOp = "=" | "<>" | ">" | ">=" | "<" | "<=";

export interface SourceFilter {
    column: string;
    op: FilterOp;
    value: string | number | boolean;
}

export interface StockMovement {
    table: string;
    keyColumn: string;
    qtyColumn: string;
    sign: 1 | -1;
    filters?: SourceFilter[];
}

export interface Lookup {
    table: string;
    /** Column in the lookup table. */
    key: string;
    /** Column in the source (product) table it joins to. */
    sourceKey: string;
    /** ERP field -> column in the lookup table. */
    columns: Partial<Record<ItemField, string>>;
}

/** Optional: where the dashboard's sales / purchase / expense numbers live in the shop DB. */
export interface DashboardMapping {
    sales: {
        table: string;
        dateColumn: string;
        /** Bill total (net of discount/tax as printed on the bill). */
        amountColumn: string;
        /** Exclude e.g. cancelled bills. */
        filters?: SourceFilter[];
        /** Label shown in the payment-mix chart -> column holding the amount paid that way. */
        payments?: Record<string, string>;
    };
    purchases?: {
        table: string;
        dateColumn: string;
        amountColumn: string;
        supplierColumn: string;
        referenceColumn?: string;
        /** Tie-breaker for "latest first" (e.g. an identity column). */
        orderColumn?: string;
        filters?: SourceFilter[];
    };
    /** Cash-out / expense entries. Left out until the expense table is identified. */
    expenses?: {
        table: string;
        dateColumn: string;
        amountColumn: string;
        categoryColumn?: string;
        filters?: SourceFilter[];
    };
}

export interface ShopDbMapping {
    /** Product master table (or view) in the shop DB. */
    source: { table: string; filters?: SourceFilter[] };
    /** ERP field -> column in `source.table`. `name` and `sellingPrice` are required. */
    columns: Partial<Record<ItemField, string>>;
    /**
     * Optional: stock lives in a separate table (one or many rows per product, e.g. per
     * batch/godown). Quantities are SUMmed per key and joined onto the product row, and override
     * `columns.stockQty`.
     */
    stock?: {
        table: string;
        /** Column in the stock table that identifies the product. */
        keyColumn: string;
        /** Column in the product table it joins to. */
        sourceKeyColumn: string;
        qtyColumn: string;
        filters?: SourceFilter[];
        /**
         * Further ledgers whose SUMmed quantity per key is added (sign 1) or subtracted (sign -1)
         * from the base quantity, e.g. purchases (base) minus sales, minus purchase returns. All
         * join to the product row through `sourceKeyColumn`.
         */
        movements?: StockMovement[];
        /** Only return products whose resulting stock is > 0. */
        inStockOnly?: boolean;
    };
    /**
     * Optional LEFT JOINs to enrich the product row from another table, e.g. category from the
     * product master. Rows are grouped by `key` (MAX of each column) so duplicate master rows can
     * never multiply product rows. A field may come from `columns` or from a lookup, not both.
     */
    lookups?: Lookup[];
    dashboard?: DashboardMapping;
    defaults?: { unit?: string; gstRate?: number; lowStockLimit?: number; uniqueNames?: boolean };
}

/** A cleaned product row, ready to upsert into the ERP. */
export interface ShopItem {
    name: string;
    sku?: string;
    barcode?: string;
    category?: string;
    brand?: string;
    hsnCode?: string;
    gstRate?: 0 | 5 | 12 | 18 | 28;
    unit: string;
    color?: string;
    size?: string;
    design?: string;
    pattern?: string;
    modelNo?: string;
    fashionName?: string;
    shelfCode?: string;
    costPrice: number;
    sellingPrice: number;
    wholesaleRate?: number;
    stockQty?: number;
    lowStockLimit?: number;
    isActive?: boolean;
}

export type TransformResult =
    | { ok: true; item: ShopItem; warnings: string[] }
    | { ok: false; reason: string };

export type StockMode = "off" | "initial-only" | "overwrite";

export interface SyncReport {
    read: number;
    inserted: number;
    updated: number;
    unchanged: number;
    stockAdjusted: number;
    skipped: number;
    duplicates: number;
    renamed: number;
    warnings: number;
    errors: { row?: number; message: string }[];
}
