/* eslint-disable no-console */
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { loadDbConfig, openPool, queryAll, type ShopDbPool } from "../integrations/textilesoft/shopDbReader.js";

dotenv.config();

/**
 * Finds where Textilesoft keeps expenses / cash-out entries and customer credit, for the dashboard mapping.
 *   npm run analyze:textilesoft:expenses  ->  textilesoft-discovery/analysis-expenses.json
 */
const PREFIX = "SET NOCOUNT ON; SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED; ";
type Row = Record<string, unknown>;
const q = (pool: ShopDbPool, sql: string): Promise<Row[]> => queryAll(pool, PREFIX + sql) as Promise<Row[]>;
const HINT = /expen|expan|cash|inout|petty|patty|paid|payment|voucher|ledger|transaction|customer|custom|credit|due|collection/i;
const clip = (row: Row): Row =>
    Object.fromEntries(Object.entries(row).map(([k, v]) => [k, typeof v === "string" && v.length > 50 ? v.slice(0, 50) + "…" : v instanceof Date ? v.toISOString() : v]));

async function main() {
    const out: Record<string, unknown> = { generatedAt: new Date().toISOString() };
    const pool = await openPool(loadDbConfig());
    try {
        const counts = (await q(pool, `SELECT t.name AS name, SUM(p.rows) AS n FROM sys.tables t JOIN sys.partitions p ON p.object_id=t.object_id AND p.index_id IN (0,1) GROUP BY t.name HAVING SUM(p.rows)>0 ORDER BY SUM(p.rows) DESC`)) as { name: string; n: number }[];
        const hinted = counts.filter((c) => HINT.test(c.name) && !/^TMP_/i.test(c.name)).slice(0, 40);
        out.candidateTables = hinted;
        const samples: Record<string, unknown> = {};
        for (const t of hinted.slice(0, 25)) {
            if (!/^[A-Za-z0-9_]+$/.test(t.name)) continue;
            try {
                const cols = await q(pool, `SELECT COLUMN_NAME AS name, DATA_TYPE AS type FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='dbo' AND TABLE_NAME='${t.name}' ORDER BY ORDINAL_POSITION`);
                const rows = await q(pool, `SELECT TOP 4 * FROM dbo.[${t.name}] ORDER BY 1 DESC`);
                const used = cols.filter((c) => rows.some((r) => r[String(c.name)] !== null && r[String(c.name)] !== "" && r[String(c.name)] !== undefined)).map((c) => String(c.name));
                samples[t.name] = { rows: t.n, columns: cols.map((c) => `${c.name}:${c.type}`).slice(0, 60), sample: rows.map((r) => Object.fromEntries(used.slice(0, 25).map((k) => [k, clip(r)[k]]))) };
            } catch (e) {
                samples[t.name] = { error: (e as Error).message };
            }
        }
        out.samples = samples;
    } finally {
        await pool.close();
    }
    const dir = path.resolve(process.cwd(), "textilesoft-discovery");
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, "analysis-expenses.json");
    fs.writeFileSync(file, JSON.stringify(out, null, 2), "utf8");
    console.log(`\nDone. Report written to ${file}\nTell Claude it is ready.`);
}

main().catch((e) => {
    console.error("Failed:", e.message);
    process.exit(1);
});
