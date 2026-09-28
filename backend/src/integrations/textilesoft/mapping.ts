import { ITEM_FIELDS, type DashboardMapping, type FilterOp, type ItemField, type Lookup, type ShopDbMapping, type SourceFilter, type StockMovement } from "./types.js";

/**
 * Identifiers (table / column names) come from a mapping *file* and are interpolated into SQL,
 * so they are validated against a strict allow-list and always bracket-quoted. Values never are
 * interpolated -- they go through query parameters.
 */
const IDENT = /^[A-Za-z0-9_][A-Za-z0-9_ ]*$/;
const OPS: readonly FilterOp[] = ["=", "<>", ">", ">=", "<", "<="];

const quotePart = (part: string): string => {
    if (!IDENT.test(part)) throw new Error(`Unsafe SQL identifier in mapping: ${JSON.stringify(part)}`);
    return `[${part}]`;
};

export const quoteColumn = (c: string): string => quotePart(c);

/** `dbo.Item` -> `[dbo].[Item]`; a bare `Item` -> `[Item]`. At most schema.table. */
export const quoteTable = (t: string): string => {
    const parts = t.split(".");
    if (parts.length > 2) throw new Error(`Table must be "table" or "schema.table": ${JSON.stringify(t)}`);
    return parts.map(quotePart).join(".");
};

const isRecord = (v: unknown): v is Record<string, unknown> =>
    typeof v === "object" && v !== null && !Array.isArray(v);

const requireString = (v: unknown, where: string): string => {
    if (typeof v !== "string" || v.trim() === "") throw new Error(`Mapping: ${where} must be a non-empty string`);
    return v.trim();
};

const parseFilters = (raw: unknown, where: string): SourceFilter[] | undefined => {
    if (raw === undefined) return undefined;
    if (!Array.isArray(raw)) throw new Error(`Mapping: ${where} must be an array`);
    return raw.map((f, i) => {
        if (!isRecord(f)) throw new Error(`Mapping: ${where}[${i}] must be an object`);
        const column = requireString(f.column, `${where}[${i}].column`);
        quoteColumn(column);
        const op = f.op as FilterOp;
        if (!OPS.includes(op)) throw new Error(`Mapping: ${where}[${i}].op must be one of ${OPS.join(" ")}`);
        const value = f.value;
        if (typeof value !== "string" && typeof value !== "number" && typeof value !== "boolean") {
            throw new Error(`Mapping: ${where}[${i}].value must be a string, number or boolean`);
        }
        return { column, op, value };
    });
};

export function validateMapping(raw: unknown): ShopDbMapping {
    if (!isRecord(raw)) throw new Error("Mapping must be a JSON object");

    if (!isRecord(raw.source)) throw new Error("Mapping: `source` is required");
    const table = requireString(raw.source.table, "source.table");
    quoteTable(table);
    const source = { table, filters: parseFilters(raw.source.filters, "source.filters") };

    if (!isRecord(raw.columns)) throw new Error("Mapping: `columns` is required");
    const columns: Partial<Record<ItemField, string>> = {};
    for (const [field, col] of Object.entries(raw.columns)) {
        if (field.startsWith("_")) continue; // allow "_comment" style keys
        if (!(ITEM_FIELDS as readonly string[]).includes(field)) {
            throw new Error(`Mapping: unknown ERP field "${field}" in columns (allowed: ${ITEM_FIELDS.join(", ")})`);
        }
        const name = requireString(col, `columns.${field}`);
        quoteColumn(name);
        columns[field as ItemField] = name;
    }
    if (!columns.name) throw new Error("Mapping: columns.name is required");
    if (!columns.sellingPrice) throw new Error("Mapping: columns.sellingPrice is required");
    if (!columns.barcode && !columns.sku) {
        throw new Error("Mapping: map at least one of columns.barcode / columns.sku so re-syncs can match existing items");
    }

    let stock: ShopDbMapping["stock"];
    if (raw.stock !== undefined) {
        if (!isRecord(raw.stock)) throw new Error("Mapping: `stock` must be an object");
        const s = raw.stock;
        const stockTable = requireString(s.table, "stock.table");
        quoteTable(stockTable);
        stock = {
            table: stockTable,
            keyColumn: quoteColumnChecked(requireString(s.keyColumn, "stock.keyColumn")),
            sourceKeyColumn: quoteColumnChecked(requireString(s.sourceKeyColumn, "stock.sourceKeyColumn")),
            qtyColumn: quoteColumnChecked(requireString(s.qtyColumn, "stock.qtyColumn")),
            filters: parseFilters(s.filters, "stock.filters"),
            movements: parseMovements(s.movements),
            inStockOnly: s.inStockOnly === true,
        };
    }

    const lookups = parseLookups(raw.lookups, columns);
    const dashboard = parseDashboard(raw.dashboard);

    let defaults: ShopDbMapping["defaults"];
    if (raw.defaults !== undefined) {
        if (!isRecord(raw.defaults)) throw new Error("Mapping: `defaults` must be an object");
        const d = raw.defaults;
        defaults = {};
        if (d.unit !== undefined) defaults.unit = requireString(d.unit, "defaults.unit");
        if (d.gstRate !== undefined) {
            if (![0, 5, 12, 18, 28].includes(d.gstRate as number)) throw new Error("Mapping: defaults.gstRate must be 0, 5, 12, 18 or 28");
            defaults.gstRate = d.gstRate as number;
        }
        if (d.uniqueNames !== undefined) {
            if (typeof d.uniqueNames !== "boolean") throw new Error("Mapping: defaults.uniqueNames must be true or false");
            defaults.uniqueNames = d.uniqueNames;
        }
        if (d.lowStockLimit !== undefined) {
            if (typeof d.lowStockLimit !== "number" || d.lowStockLimit < 0) throw new Error("Mapping: defaults.lowStockLimit must be a number >= 0");
            defaults.lowStockLimit = d.lowStockLimit;
        }
    }

    return { source, columns, stock, lookups, dashboard, defaults };
}

function parseDashboard(raw: unknown): DashboardMapping | undefined {
    if (raw === undefined) return undefined;
    if (!isRecord(raw)) throw new Error("Mapping: `dashboard` must be an object");
    const col = (o: Record<string, unknown>, key: string, where: string): string => quoteColumnChecked(requireString(o[key], `${where}.${key}`));
    const optCol = (o: Record<string, unknown>, key: string, where: string): string | undefined => (o[key] === undefined ? undefined : col(o, key, where));
    const section = (key: string): Record<string, unknown> | undefined => {
        if (raw[key] === undefined) return undefined;
        if (!isRecord(raw[key])) throw new Error(`Mapping: dashboard.${key} must be an object`);
        return raw[key] as Record<string, unknown>;
    };
    const tbl = (o: Record<string, unknown>, where: string): string => {
        const t = requireString(o.table, `${where}.table`);
        quoteTable(t);
        return t;
    };

    const s = section("sales");
    if (!s) throw new Error("Mapping: dashboard.sales is required when `dashboard` is present");
    let payments: Record<string, string> | undefined;
    if (s.payments !== undefined) {
        if (!isRecord(s.payments)) throw new Error("Mapping: dashboard.sales.payments must be an object");
        payments = {};
        for (const [label, c] of Object.entries(s.payments)) {
            if (!/^[A-Za-z][A-Za-z0-9 ]{0,29}$/.test(label)) throw new Error(`Mapping: dashboard.sales.payments label ${JSON.stringify(label)} must be letters/digits/spaces`);
            payments[label] = quoteColumnChecked(requireString(c, `dashboard.sales.payments.${label}`));
        }
    }
    const out: DashboardMapping = {
        sales: { table: tbl(s, "dashboard.sales"), dateColumn: col(s, "dateColumn", "dashboard.sales"), amountColumn: col(s, "amountColumn", "dashboard.sales"), filters: parseFilters(s.filters, "dashboard.sales.filters"), payments },
    };
    const p = section("purchases");
    if (p) {
        out.purchases = {
            table: tbl(p, "dashboard.purchases"), dateColumn: col(p, "dateColumn", "dashboard.purchases"), amountColumn: col(p, "amountColumn", "dashboard.purchases"),
            supplierColumn: col(p, "supplierColumn", "dashboard.purchases"), referenceColumn: optCol(p, "referenceColumn", "dashboard.purchases"),
            orderColumn: optCol(p, "orderColumn", "dashboard.purchases"), filters: parseFilters(p.filters, "dashboard.purchases.filters"),
        };
    }
    const e = section("expenses");
    if (e) {
        out.expenses = {
            table: tbl(e, "dashboard.expenses"), dateColumn: col(e, "dateColumn", "dashboard.expenses"), amountColumn: col(e, "amountColumn", "dashboard.expenses"),
            categoryColumn: optCol(e, "categoryColumn", "dashboard.expenses"), filters: parseFilters(e.filters, "dashboard.expenses.filters"),
        };
    }
    return out;
}

function parseMovements(raw: unknown): StockMovement[] | undefined {
    if (raw === undefined) return undefined;
    if (!Array.isArray(raw)) throw new Error("Mapping: stock.movements must be an array");
    return raw.map((m, i) => {
        if (!isRecord(m)) throw new Error(`Mapping: stock.movements[${i}] must be an object`);
        const table = requireString(m.table, `stock.movements[${i}].table`);
        quoteTable(table);
        if (m.sign !== 1 && m.sign !== -1) throw new Error(`Mapping: stock.movements[${i}].sign must be 1 or -1`);
        return {
            table,
            keyColumn: quoteColumnChecked(requireString(m.keyColumn, `stock.movements[${i}].keyColumn`)),
            qtyColumn: quoteColumnChecked(requireString(m.qtyColumn, `stock.movements[${i}].qtyColumn`)),
            sign: m.sign,
            filters: parseFilters(m.filters, `stock.movements[${i}].filters`),
        };
    });
}

function parseLookups(raw: unknown, columns: Partial<Record<ItemField, string>>): Lookup[] | undefined {
    if (raw === undefined) return undefined;
    if (!Array.isArray(raw)) throw new Error("Mapping: lookups must be an array");
    const seen = new Set<string>(Object.keys(columns));
    return raw.map((l, i) => {
        if (!isRecord(l)) throw new Error(`Mapping: lookups[${i}] must be an object`);
        const table = requireString(l.table, `lookups[${i}].table`);
        quoteTable(table);
        const key = quoteColumnChecked(requireString(l.key, `lookups[${i}].key`));
        const sourceKey = quoteColumnChecked(requireString(l.sourceKey, `lookups[${i}].sourceKey`));
        if (!isRecord(l.columns)) throw new Error(`Mapping: lookups[${i}].columns is required`);
        const cols: Partial<Record<ItemField, string>> = {};
        for (const [field, col] of Object.entries(l.columns)) {
            if (field.startsWith("_")) continue;
            if (!(ITEM_FIELDS as readonly string[]).includes(field)) throw new Error(`Mapping: lookups[${i}]: unknown ERP field "${field}"`);
            if (seen.has(field)) throw new Error(`Mapping: ERP field "${field}" is mapped more than once (columns/lookups)`);
            seen.add(field);
            cols[field as ItemField] = quoteColumnChecked(requireString(col, `lookups[${i}].columns.${field}`));
        }
        if (Object.keys(cols).length === 0) throw new Error(`Mapping: lookups[${i}].columns must map at least one field`);
        return { table, key, sourceKey, columns: cols };
    });
}

// Returns the raw name after checking it is a safe identifier (quoting happens in buildSelect).
function quoteColumnChecked(c: string): string {
    quoteColumn(c);
    return c;
}

export interface QueryParam {
    name: string;
    value: string | number | boolean;
}

export interface BuiltQuery {
    text: string;
    params: QueryParam[];
}

export const whereFor = (alias: string, filters: SourceFilter[] | undefined, prefix: string, params: QueryParam[]): string => {
    if (!filters || filters.length === 0) return "";
    const clauses = filters.map((f, i) => {
        const name = `${prefix}${i}`;
        params.push({ name, value: f.value });
        return `${alias}${quoteColumn(f.column)} ${f.op} @${name}`;
    });
    return ` WHERE ${clauses.join(" AND ")}`;
};

/** The plain `SELECT ... FROM ... [WHERE]` (no session prefix) shared by the sync and the live reader. */
function buildBase(mapping: ShopDbMapping): { select: string; params: QueryParam[] } {
    const params: QueryParam[] = [];
    const select: string[] = [];

    for (const field of ITEM_FIELDS) {
        if (field === "stockQty" && mapping.stock) continue; // filled from the stock join below
        const col = mapping.columns[field];
        if (col) select.push(`p.${quoteColumn(col)} AS [${field}]`);
    }

    let from = `${quoteTable(mapping.source.table)} AS p`;
    if (mapping.stock) {
        const st = mapping.stock;
        const ledger = (alias: string, table: string, keyColumn: string, qtyColumn: string, filters: SourceFilter[] | undefined, prefix: string, on: string): string =>
            ` LEFT JOIN (SELECT ${quoteColumn(keyColumn)} AS k, SUM(TRY_CAST(${quoteColumn(qtyColumn)} AS float)) AS q` +
            ` FROM ${quoteTable(table)}${whereFor("", filters, prefix, params)} GROUP BY ${quoteColumn(keyColumn)}) AS ${alias}` +
            ` ON ${alias}.k = p.${quoteColumn(on)}`;
        from += ledger("stk", st.table, st.keyColumn, st.qtyColumn, st.filters, "s", st.sourceKeyColumn);
        let qty = "ISNULL(stk.q, 0)";
        (st.movements ?? []).forEach((m, i) => {
            from += ledger(`mv${i}`, m.table, m.keyColumn, m.qtyColumn, m.filters, `mv${i}_`, st.sourceKeyColumn);
            qty += ` ${m.sign === -1 ? "-" : "+"} ISNULL(mv${i}.q, 0)`;
        });
        select.push(`${qty} AS [stockQty]`);
    }
    (mapping.lookups ?? []).forEach((lk, j) => {
        const entries = Object.entries(lk.columns) as [ItemField, string][];
        from +=
            ` LEFT JOIN (SELECT ${quoteColumn(lk.key)} AS k, ${entries.map(([, c], n) => `MAX(${quoteColumn(c)}) AS c${n}`).join(", ")}` +
            ` FROM ${quoteTable(lk.table)} GROUP BY ${quoteColumn(lk.key)}) AS lk${j} ON lk${j}.k = p.${quoteColumn(lk.sourceKey)}`;
        entries.forEach(([field], n) => select.push(`lk${j}.c${n} AS [${field}]`));
    });

    const where = whereFor("p.", mapping.source.filters, "f", params);
    return { select: `SELECT ${select.join(", ")} FROM ${from}${where}`, params };
}

export const SESSION_PREFIX = "SET NOCOUNT ON; SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED; ";

/**
 * Builds the single read-only SELECT the sync runs. READ UNCOMMITTED so a long product scan never
 * blocks (or is blocked by) billing on the live shop server.
 */
export function buildSelect(mapping: ShopDbMapping): BuiltQuery {
    const { select, params } = buildBase(mapping);
    const text = mapping.stock?.inStockOnly ? `SELECT y.* FROM (${select}) AS y WHERE y.[stockQty] > 0` : select;
    return { text: SESSION_PREFIX + text, params };
}

// ---------------------------------------------------------------------------------------------
// Live reads (ITEM_DATA_SOURCE=sql). Same base SELECT, wrapped so the ERP's list/search/lookup
// filters run inside SQL Server. Filters only apply to fields the mapping actually provides.
// ---------------------------------------------------------------------------------------------

export interface ItemQueryOptions {
    search?: string;
    category?: string;
    brand?: string;
    size?: string;
    color?: string;
    barcode?: string;
    sku?: string;
    lowStockOnly?: boolean;
    /** Low-stock threshold used when the mapping has no per-item lowStockLimit column. */
    lowStockDefault?: number;
    offset?: number;
    limit?: number;
}

const escapeLike = (v: string): string => v.replace(/[\\%_[]/g, (c) => `\\${c}`);

const numCol = (alias: string, field: string): string => `TRY_CAST(${alias}.[${field}] AS float)`;

/** True when the built SELECT exposes this ERP field (from columns, the stock join or a lookup). */
function hasField(mapping: ShopDbMapping, f: ItemField): boolean {
    if (f === "stockQty") return !!(mapping.stock || mapping.columns.stockQty);
    return !!mapping.columns[f] || (mapping.lookups ?? []).some((l) => !!l.columns[f]);
}

function buildWrapped(mapping: ShopDbMapping, opts: ItemQueryOptions): { base: string; where: string; params: QueryParam[] } {
    const { select, params } = buildBase(mapping);
    const has = (f: ItemField): boolean => hasField(mapping, f);
    const clauses: string[] = [];
    if (mapping.stock?.inStockOnly) clauses.push("x.[stockQty] > 0");

    if (opts.search) {
        const parts = ["name", "sku", "barcode"].filter((f) => has(f as ItemField)).map((f) => `x.[${f}] LIKE @q ESCAPE '\\'`);
        if (parts.length) {
            params.push({ name: "q", value: `%${escapeLike(opts.search)}%` });
            clauses.push(`(${parts.join(" OR ")})`);
        }
    }
    const eq = (field: ItemField, param: string, value: string | undefined): void => {
        if (!value || !has(field)) return;
        params.push({ name: param, value });
        clauses.push(`x.[${field}] = @${param}`);
    };
    eq("category", "cat", opts.category);
    eq("brand", "brd", opts.brand);
    eq("size", "siz", opts.size);
    eq("color", "clr", opts.color);
    eq("barcode", "bc", opts.barcode);
    eq("sku", "sk", opts.sku);

    if (opts.lowStockOnly && has("stockQty")) {
        params.push({ name: "lowDefault", value: opts.lowStockDefault ?? 5 });
        const limit = has("lowStockLimit") ? `ISNULL(${numCol("x", "lowStockLimit")}, @lowDefault)` : "@lowDefault";
        clauses.push(`ISNULL(${numCol("x", "stockQty")}, 0) <= ${limit}`);
    }
    return { base: select, where: clauses.length ? ` WHERE ${clauses.join(" AND ")}` : "", params };
}

/** The item base as a derived-table body (`SELECT x.* FROM (...) AS x [WHERE in stock]`) for report joins. */
export function buildItemsDerived(mapping: ShopDbMapping): { text: string; params: QueryParam[] } {
    const { base, where, params } = buildWrapped(mapping, {});
    return { text: `SELECT x.* FROM (${base}) AS x${where}`, params };
}

/** One page of items plus the matching total. */
export function buildItemPageQueries(mapping: ShopDbMapping, opts: ItemQueryOptions): { page: BuiltQuery; count: BuiltQuery } {
    const { base, where, params } = buildWrapped(mapping, opts);
    const order = ["name", "barcode", "sku"].filter((f) => hasField(mapping, f as ItemField)).map((f) => `x.[${f}]`).join(", ");
    const pageParams = [...params, { name: "off", value: Math.max(0, opts.offset ?? 0) }, { name: "lim", value: Math.min(Math.max(1, opts.limit ?? 20), 1000) }];
    return {
        page: {
            text: `${SESSION_PREFIX}SELECT x.* FROM (${base}) AS x${where} ORDER BY ${order} OFFSET @off ROWS FETCH NEXT @lim ROWS ONLY`,
            params: pageParams,
        },
        count: { text: `${SESSION_PREFIX}SELECT COUNT(*) AS total FROM (${base}) AS x${where}`, params },
    };
}

/** Inventory metrics (same three numbers as the Mongo aggregation), computed inside SQL Server. */
export function buildStatsQuery(mapping: ShopDbMapping, lowStockDefault: number): BuiltQuery {
    const { base, params } = buildWrapped(mapping, {});
    const hasStock = hasField(mapping, "stockQty");
    const cost = hasField(mapping, "costPrice") ? numCol("x", "costPrice") : "0";
    const qty = hasStock ? `ISNULL(${numCol("x", "stockQty")}, 0)` : "0";
    const limit = hasField(mapping, "lowStockLimit") ? `ISNULL(${numCol("x", "lowStockLimit")}, @lowDefault)` : "@lowDefault";
    return {
        text:
            `${SESSION_PREFIX}SELECT COUNT(*) AS totalItems, ISNULL(SUM(${qty}), 0) AS totalStockQuantity, ` +
            `ISNULL(SUM(${qty} * ISNULL(${cost}, 0)), 0) AS totalValuation, ` +
            `ISNULL(SUM(CASE WHEN ${qty} <= ${limit} THEN 1 ELSE 0 END), 0) AS lowStockCount ` +
            `FROM (${base}) AS x`,
        params: [...params, { name: "lowDefault", value: lowStockDefault }],
    };
}
