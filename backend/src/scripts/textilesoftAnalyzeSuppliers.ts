/* eslint-disable no-console */
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { loadDbConfig, openPool, queryAll, type ShopDbPool } from "../integrations/textilesoft/shopDbReader.js";

dotenv.config();

/**
 * Finds where Textilesoft keeps the supplier master and supplier payments (for the Suppliers / payables pages).
 *   npm run analyze:textilesoft:suppliers  ->  textilesoft-discovery/analysis-suppliers.json
 * Read-only.
 */
const PREFIX = "SET NOCOUNT ON; SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED; ";
type Row = Record<string, unknown>;
const q = (pool: ShopDbPool, sql: string): Promise<Row[]> => queryAll(pool, PREFIX + sql) as Promise<Row[]>;
const clip = (row: Row): Row => Object.fromEntries(Object.entries(row).filter(([, v]) => v !== null && v !== "" && v !== undefined).slice(0, 40).map(([k, v]) => [k, typeof v === "string" && v.length > 50 ? v.slice(0, 50) + "…" : v instanceof Date ? v.toISOString() : v]));
const HINT = /supp|suplier|agent|vendor|purch|pur_|payable|paid|payment|pay_|cheque|check|creditor|ledger/i;

async function main() {
    const out: Record<string, unknown> = { generatedAt: new Date().toISOString() };
    const pool = await openPool(loadDbConfig());
    try {
        const counts = (await q(pool, `SELECT t.name AS name, SUM(p.rows) AS n FROM sys.tables t JOIN sys.partitions p ON p.object_id=t.object_id AND p.index_id IN (0,1) GROUP BY t.name HAVING SUM(p.rows)>0 ORDER BY SUM(p.rows) DESC`)) as { name: string; n: number }[];
        const cand = counts.filter((c) => HINT.test(c.name) && !/^TMP_/i.test(c.name) && !/^(purentrydetails|purgrnentry)$/i.test(c.name));
        out.candidateTables = cand;
        const samples: Record<string, unknown> = {};
        for (const t of [...cand.slice(0, 30), ...counts.filter((c) => /^TMP_(PURCH|SUPP)/i.test(c.name))]) {
            if (!/^[A-Za-z0-9_]+$/.test(t.name)) continue;
            try {
                const cols = await q(pool, `SELECT COLUMN_NAME AS name, DATA_TYPE AS type FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='dbo' AND TABLE_NAME='${t.name}' ORDER BY ORDINAL_POSITION`);
                const rows = await q(pool, `SELECT TOP 3 * FROM dbo.[${t.name}] ORDER BY 1 DESC`);
                samples[t.name] = { rows: t.n, columns: cols.map((c) => `${c.name}:${c.type}`).slice(0, 80), sample: rows.map(clip) };
            } catch (e) {
                samples[t.name] = { error: (e as Error).message };
            }
        }
        out.samples = samples;
        out.payTypes = await q(pool, `SELECT TOP 20 pay_type AS payType, COUNT(*) AS grns, SUM(TRY_CAST(totnetamot AS float)) AS total FROM dbo.purgrnentry GROUP BY pay_type ORDER BY COUNT(*) DESC`);
        out.supplierCount = (await q(pool, `SELECT COUNT(DISTINCT suplier_name) AS n FROM dbo.purgrnentry`))[0];
    } finally {
        await pool.close();
    }
    const dir = path.resolve(process.cwd(), "textilesoft-discovery");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "analysis-suppliers.json"), JSON.stringify(out, null, 1));
    console.log(`Wrote ${path.join(dir, "analysis-suppliers.json")}`);
    console.log("Done. Tell Claude it is ready.");
}

main().catch((e) => {
    console.error("Failed:", e instanceof Error ? e.message : e);
    process.exit(1);
});
