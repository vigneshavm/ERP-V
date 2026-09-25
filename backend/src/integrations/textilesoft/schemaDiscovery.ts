import { queryAll, type ShopDbPool } from "./shopDbReader.js";
import type { ItemField, ShopDbMapping } from "./types.js";

export interface DiscoveredColumn {
    name: string;
    type: string;
}

export interface DiscoveredTable {
    table: string; // schema.table
    rows: number;
    columns: DiscoveredColumn[];
    /** Higher = more likely to be the product master / stock table. */
    score: number;
}

// Column-name heuristics for the (undocumented) Textilesoft schema. Suggestions only -- a human
// reviews the generated mapping before anything is synced.
const FIELD_PATTERNS: Record<ItemField, RegExp[]> = {
    name: [/^item_?name$/i, /^product_?name$/i, /^prod_?name$/i, /^item_?desc(ription)?$/i, /^description$/i, /^name$/i],
    sku: [/^item_?code$/i, /^prod(uct)?_?code$/i, /^sku$/i, /^code$/i],
    barcode: [/^bar_?code(no)?$/i, /barcode/i],
    category: [/^category(_?name)?$/i, /^cat_?name$/i, /^main_?group$/i, /^group_?name$/i],
    brand: [/^brand(_?name)?$/i],
    hsnCode: [/hsn/i],
    gstRate: [/^gst_?(per|percent|percentage|rate)?$/i, /^tax_?(per|percent|rate)$/i],
    unit: [/^unit(_?name)?$/i, /^uom$/i],
    color: [/colou?r/i],
    size: [/^size(_?name)?$/i],
    design: [/^(pur_?)?design$/i],
    pattern: [/^(pur_?)?pattern$/i],
    modelNo: [/^model_?no$/i],
    fashionName: [/^fashion_?name$/i],
    shelfCode: [/^(shelf|rack)(_?code|_?no)?$/i],
    costPrice: [/^(pur(chase)?_?(rate|price)|cost(_?price)?|buy_?rate)$/i],
    sellingPrice: [/^(sale|sales|selling)_?(rate|price)$/i, /^mrp$/i, /^retail_?(rate|price)$/i, /^rate$/i],
    wholesaleRate: [/whole_?sale/i],
    stockQty: [/^(stock_?)?(qty|quantity)$/i, /^(closing|balance|available)_?(stock|qty)$/i, /^stock$/i],
    lowStockLimit: [/^(min|reorder)_?(stock|qty|level)$/i],
    isActive: [/^(is_?)?active$/i, /^status$/i],
};

const TABLE_HINT = /item|product|stock|inventory|barcode|prod|goods|material/i;
const COLUMN_HINT = /barcode|item|product|rate|price|mrp|qty|stock|hsn|gst|size|colou?r|brand/i;

export function scoreTable(table: string, columns: DiscoveredColumn[]): number {
    let score = TABLE_HINT.test(table) ? 5 : 0;
    score += columns.filter((c) => COLUMN_HINT.test(c.name)).length;
    return score;
}

export function suggestColumns(columns: DiscoveredColumn[]): Partial<Record<ItemField, string>> {
    const out: Partial<Record<ItemField, string>> = {};
    for (const field of Object.keys(FIELD_PATTERNS) as ItemField[]) {
        outer: for (const pattern of FIELD_PATTERNS[field]) {
            for (const c of columns) {
                if (pattern.test(c.name)) {
                    out[field] = c.name;
                    break outer;
                }
            }
        }
    }
    return out;
}

/** Lists base tables, columns and row counts of the connected database using catalog views only. */
export async function discoverSchema(pool: ShopDbPool): Promise<DiscoveredTable[]> {
    const cols = await queryAll(
        pool,
        `SELECT c.TABLE_SCHEMA AS s, c.TABLE_NAME AS t, c.COLUMN_NAME AS c, c.DATA_TYPE AS d
         FROM INFORMATION_SCHEMA.COLUMNS c
         JOIN INFORMATION_SCHEMA.TABLES tb ON tb.TABLE_SCHEMA = c.TABLE_SCHEMA AND tb.TABLE_NAME = c.TABLE_NAME
         WHERE tb.TABLE_TYPE = 'BASE TABLE'
         ORDER BY c.TABLE_SCHEMA, c.TABLE_NAME, c.ORDINAL_POSITION`,
    );

    const counts = new Map<string, number>();
    try {
        const rows = await queryAll(
            pool,
            `SELECT sc.name AS s, t.name AS t, SUM(p.rows) AS n
             FROM sys.tables t
             JOIN sys.schemas sc ON sc.schema_id = t.schema_id
             JOIN sys.partitions p ON p.object_id = t.object_id AND p.index_id IN (0, 1)
             GROUP BY sc.name, t.name`,
        );
        for (const r of rows) counts.set(`${r.s}.${r.t}`, Number(r.n));
    } catch {
        // Row counts are a nicety; a login without catalog access still gets the column listing.
    }

    const byTable = new Map<string, DiscoveredColumn[]>();
    for (const r of cols) {
        const key = `${r.s}.${r.t}`;
        const list = byTable.get(key) ?? [];
        list.push({ name: String(r.c), type: String(r.d) });
        byTable.set(key, list);
    }

    return [...byTable.entries()]
        .map(([table, columns]) => ({ table, columns, rows: counts.get(table) ?? -1, score: scoreTable(table, columns) }))
        .sort((a, b) => b.score - a.score || b.rows - a.rows);
}

/** A starting-point mapping for the best-scoring table. Must be reviewed and edited by a person. */
export function suggestMapping(table: DiscoveredTable): ShopDbMapping & { _comment: string } {
    return {
        _comment: `AUTO-GENERATED GUESS from table ${table.table} (${table.rows} rows). Verify every column with --sample, add a "stock" block if quantities live in another table, then save as textilesoft.mapping.json.`,
        source: { table: table.table },
        columns: suggestColumns(table.columns),
    };
}
