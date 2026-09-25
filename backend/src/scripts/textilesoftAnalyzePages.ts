/* eslint-disable no-console */
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { loadDbConfig, openPool, queryAll, type ShopDbPool } from "../integrations/textilesoft/shopDbReader.js";

dotenv.config();

/**
 * Read-only inventory of EVERY non-empty table in the shop DB (columns, types, row count, 2 sample rows),
 * used to decide which Textilesoft tables can feed which ERP page.
 *   npm run analyze:textilesoft:pages  ->  textilesoft-discovery/schema-full.json
 * Sample values are clipped; nothing is written to SQL Server.
 */
const PREFIX = "SET NOCOUNT ON; SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED; ";
type Row = Record<string, unknown>;
const q = (pool: ShopDbPool, sql: string): Promise<Row[]> => queryAll(pool, PREFIX + sql) as Promise<Row[]>;
const clip = (v: unknown): unknown => (typeof v === "string" ? (v.length > 40 ? v.slice(0, 40) + "…" : v) : v instanceof Date ? v.toISOString().slice(0, 19) : v);

async function main() {
    const pool = await openPool(loadDbConfig());
    const out: Record<string, unknown> = { generatedAt: new Date().toISOString() };
    try {
        const counts = (await q(
            pool,
            `SELECT t.name AS name, SUM(p.rows) AS n FROM sys.tables t JOIN sys.partitions p ON p.object_id=t.object_id AND p.index_id IN (0,1) GROUP BY t.name HAVING SUM(p.rows)>0 ORDER BY SUM(p.rows) DESC`,
        )) as { name: string; n: number }[];
        const empty = (await q(pool, `SELECT COUNT(*) AS n FROM sys.tables`))[0]?.n;
        out.totalTables = empty;
        out.nonEmptyTables = counts.length;

        const cols = await q(pool, `SELECT TABLE_NAME AS t, COLUMN_NAME AS c, DATA_TYPE AS d FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='dbo' ORDER BY TABLE_NAME, ORDINAL_POSITION`);
        const colMap = new Map<string, string[]>();
        for (const c of cols) {
            const k = String(c.t);
            if (!colMap.has(k)) colMap.set(k, []);
            colMap.get(k)!.push(`${c.c}:${c.d}`);
        }

        const tables: Record<string, unknown> = {};
        for (const t of counts) {
            if (!/^[A-Za-z0-9_]+$/.test(t.name)) continue;
            const columns = colMap.get(t.name) ?? [];
            let sample: Row[] = [];
            if (!/^TMP_/i.test(t.name)) {
                try {
                    const rows = await q(pool, `SELECT TOP 2 * FROM dbo.[${t.name}]`);
                    sample = rows.map((r) => Object.fromEntries(Object.entries(r).filter(([, v]) => v !== null && v !== "" && v !== undefined).slice(0, 30).map(([k, v]) => [k, clip(v)])));
                } catch (e) {
                    sample = [{ error: (e as Error).message }];
                }
            }
            tables[t.name] = { rows: Number(t.n), columns: columns.slice(0, 70), sample };
        }
        out.tables = tables;
    } finally {
        await pool.close();
    }
    const dir = path.resolve(process.cwd(), "textilesoft-discovery");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "schema-full.json"), JSON.stringify(out, null, 1));
    console.log(`Wrote ${path.join(dir, "schema-full.json")}`);
    console.log("Done. Tell Claude it is ready.");
}

main().catch((e) => {
    console.error("Failed:", e instanceof Error ? e.message : e);
    process.exit(1);
});
