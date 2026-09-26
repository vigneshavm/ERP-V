import { SESSION_PREFIX, quoteColumn, quoteTable, whereFor, type QueryParam } from "./mapping.js";
import { getMapping, getPool } from "./sqlItemSource.js";
import type { DashboardMapping, ShopDbMapping } from "./types.js";

/**
 * ITEM_DATA_SOURCE=sql: dashboard numbers (revenue, sales trend, payment mix, purchases, expenses) read
 * from the shop DB, driven by the `dashboard` section of the mapping file. Read-only.
 *
 * "Last 30 days" / "last 6 months" are counted back from the newest sale in the data (`asOf`), not from
 * today, so a restored backup that ends weeks ago still fills the charts.
 */

export interface SqlDashboardStats {
    asOf: string | null;
    totalInvoices: number;
    totalRevenue: number;
    dailySales: { _id: string; totalSales: number }[];
    monthlyRevenue: { month: string; revenue: number }[];
    monthlyExpenses?: { month: string; expenses: number }[];
    totalExpenses?: number;
    expenseByCategory?: { category: string; amount: number }[];
    paymentMethods: { _id: string; count: number; amount: number }[];
    recentPurchases: { id: string; supplier: string; amount: number; date: string; status: string }[];
    source: "sql";
}

type Row = Record<string, unknown>;
const num = (v: unknown): number => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
};
const round2 = (n: number): number => Math.round(n * 100) / 100;

async function run(text: string, params: QueryParam[]): Promise<Row[]> {
    const req = (await getPool()).request();
    for (const p of params) req.input(p.name, p.value);
    const res = await req.query(SESSION_PREFIX + text);
    return res ? res.recordset : [];
}

/** `(SELECT date AS d, amount AS a FROM table WHERE filters) x` -- typed date + numeric amount. */
function base(t: { table: string; dateColumn: string; amountColumn: string; filters?: DashboardMapping["sales"]["filters"] }, prefix: string, params: QueryParam[], extra = ""): string {
    return `(SELECT CAST(${quoteColumn(t.dateColumn)} AS date) AS d, TRY_CAST(${quoteColumn(t.amountColumn)} AS float) AS a${extra} FROM ${quoteTable(t.table)}${whereFor("", t.filters, prefix, params)}) AS x`;
}

const cache = new Map<string, { at: number; value: SqlDashboardStats }>();
const TTL_MS = 60_000;

export function hasSqlDashboard(mapping: ShopDbMapping = getMapping()): boolean {
    return !!mapping.dashboard;
}

export async function sqlDashboardStats(): Promise<SqlDashboardStats> {
    const mapping = getMapping();
    const cfg = mapping.dashboard;
    if (!cfg) throw new Error("mapping has no `dashboard` section");
    const hit = cache.get("stats");
    if (hit && Date.now() - hit.at < TTL_MS) return hit.value;

    // 1) totals + the anchor date
    let p: QueryParam[] = [];
    const [tot] = await run(`SELECT COUNT(*) AS n, ISNULL(SUM(a), 0) AS total, CONVERT(varchar(10), MAX(d), 23) AS asOf FROM ${base(cfg.sales, "sf", p)}`, p);
    const asOf = tot?.asOf ? String(tot.asOf) : null;

    let dailySales: SqlDashboardStats["dailySales"] = [];
    let monthlyRevenue: SqlDashboardStats["monthlyRevenue"] = [];
    let paymentMethods: SqlDashboardStats["paymentMethods"] = [];

    if (asOf) {
        // 2) last 30 days
        p = [];
        const daily = await run(
            `SELECT CONVERT(varchar(10), d, 23) AS day, SUM(a) AS total FROM ${base(cfg.sales, "sf", p)} WHERE d > DATEADD(day, -30, CAST(@asOf AS date)) AND d <= CAST(@asOf AS date) GROUP BY CONVERT(varchar(10), d, 23) ORDER BY 1`,
            [...p, { name: "asOf", value: asOf }],
        );
        dailySales = daily.map((r) => ({ _id: String(r.day), totalSales: round2(num(r.total)) }));

        // 3) last 6 months (calendar months ending at asOf's month)
        p = [];
        const monthly = await run(
            `SELECT CONVERT(varchar(7), d, 23) AS month, SUM(a) AS total FROM ${base(cfg.sales, "sf", p)} WHERE d >= DATEADD(month, -5, DATEFROMPARTS(YEAR(CAST(@asOf AS date)), MONTH(CAST(@asOf AS date)), 1)) AND d <= CAST(@asOf AS date) GROUP BY CONVERT(varchar(7), d, 23) ORDER BY 1`,
            [...p, { name: "asOf", value: asOf }],
        );
        monthlyRevenue = monthly.map((r) => ({ month: String(r.month), revenue: round2(num(r.total)) }));
    }

    // 4) payment mix (bills where that method was used / amount taken that way)
    const pay = Object.entries(cfg.sales.payments ?? {});
    if (pay.length) {
        p = [];
        const cols = pay.map(([, c]) => `TRY_CAST(${quoteColumn(c)} AS float)`);
        const sel = pay.map((_, i) => `COUNT(CASE WHEN c${i} > 0 THEN 1 END) AS n${i}, ISNULL(SUM(c${i}), 0) AS s${i}`).join(", ");
        const inner = `(SELECT ${cols.map((c, i) => `${c} AS c${i}`).join(", ")} FROM ${quoteTable(cfg.sales.table)}${whereFor("", cfg.sales.filters, "sf", p)}) AS x`;
        const [r] = await run(`SELECT ${sel} FROM ${inner}`, p);
        paymentMethods = pay
            .map(([label], i) => ({ _id: label, count: num(r?.[`n${i}`]), amount: round2(num(r?.[`s${i}`])) }))
            .filter((m) => m.amount > 0);
    }

    // 5) latest purchases
    let recentPurchases: SqlDashboardStats["recentPurchases"] = [];
    if (cfg.purchases) {
        const pu = cfg.purchases;
        p = [];
        const ref = pu.referenceColumn ? `, ${quoteColumn(pu.referenceColumn)} AS ref` : ", NULL AS ref";
        const order = pu.orderColumn ? `, ${quoteColumn(pu.orderColumn)} AS ord` : ", 0 AS ord";
        const inner = `(SELECT CAST(${quoteColumn(pu.dateColumn)} AS date) AS d, TRY_CAST(${quoteColumn(pu.amountColumn)} AS float) AS a, ${quoteColumn(pu.supplierColumn)} AS sup${ref}${order} FROM ${quoteTable(pu.table)}${whereFor("", pu.filters, "pf", p)}) AS x`;
        const rows = await run(`SELECT TOP 10 CONVERT(varchar(10), d, 23) AS day, a, sup, ref FROM ${inner} ORDER BY d DESC, ord DESC`, p);
        recentPurchases = rows.map((r) => ({
            id: r.ref === null || r.ref === undefined ? "" : String(r.ref),
            supplier: String(r.sup ?? "").trim() || "Unknown Vendor",
            amount: round2(num(r.a)),
            date: String(r.day ?? ""),
            status: "RECEIVED",
        }));
    }

    // 6) expenses (only when the mapping has an expense table)
    let monthlyExpenses: SqlDashboardStats["monthlyExpenses"];
    let totalExpenses: number | undefined;
    let expenseByCategory: SqlDashboardStats["expenseByCategory"];
    if (cfg.expenses && asOf) {
        const ex = cfg.expenses;
        p = [];
        const cat = ex.categoryColumn ? `, ${quoteColumn(ex.categoryColumn)} AS cat` : ", NULL AS cat";
        const xbase = `(SELECT CAST(${quoteColumn(ex.dateColumn)} AS date) AS d, TRY_CAST(${quoteColumn(ex.amountColumn)} AS float) AS a${cat} FROM ${quoteTable(ex.table)}${whereFor("", ex.filters, "ef", p)}) AS x`;
        const m = await run(
            `SELECT CONVERT(varchar(7), d, 23) AS month, SUM(a) AS total FROM ${xbase} WHERE d >= DATEADD(month, -5, DATEFROMPARTS(YEAR(CAST(@asOf AS date)), MONTH(CAST(@asOf AS date)), 1)) AND d <= CAST(@asOf AS date) GROUP BY CONVERT(varchar(7), d, 23) ORDER BY 1`,
            [...p, { name: "asOf", value: asOf }],
        );
        monthlyExpenses = m.map((r) => ({ month: String(r.month), expenses: round2(num(r.total)) }));
        totalExpenses = round2(monthlyExpenses.reduce((s, r) => s + r.expenses, 0));
        if (ex.categoryColumn) {
            const c = await run(
                `SELECT TOP 12 ISNULL(NULLIF(LTRIM(RTRIM(cat)), ''), 'Other') AS category, SUM(a) AS total FROM ${xbase} WHERE d >= DATEADD(month, -5, DATEFROMPARTS(YEAR(CAST(@asOf AS date)), MONTH(CAST(@asOf AS date)), 1)) AND d <= CAST(@asOf AS date) GROUP BY ISNULL(NULLIF(LTRIM(RTRIM(cat)), ''), 'Other') ORDER BY SUM(a) DESC`,
                [...p, { name: "asOf", value: asOf }],
            );
            expenseByCategory = c.map((r) => ({ category: String(r.category), amount: round2(num(r.total)) }));
        }
    }

    const value: SqlDashboardStats = {
        asOf,
        totalInvoices: num(tot?.n),
        totalRevenue: round2(num(tot?.total)),
        dailySales,
        monthlyRevenue,
        monthlyExpenses,
        totalExpenses,
        expenseByCategory,
        paymentMethods,
        recentPurchases,
        source: "sql",
    };
    cache.set("stats", { at: Date.now(), value });
    return value;
}
