/* eslint-disable no-console */
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { loadDbConfig, openPool, queryAll } from "../integrations/textilesoft/shopDbReader.js";

dotenv.config();

/**
 * Which Textilesoft tables and fields actually hold data. Read-only (SELECT only, READ UNCOMMITTED).
 *   npm run analyze:textilesoft:fields
 *
 * For every table: row count. For every column of every non-empty table: how many rows have a real value
 * (not NULL, not blank, not a zero like "0" / "0.00"), plus up to 3 example values. One scan per table.
 * Writes textilesoft-discovery/field-usage.json and field-usage.csv (open the CSV in Excel).
 */

const BLANKS = "('', '0', '0.0', '0.00', '0.000', '0.0000')";
const BINARY = new Set(["image", "varbinary", "binary", "timestamp", "rowversion", "geography", "geometry", "hierarchyid", "sql_variant", "xml"]);
const q = (id: string) => `[${id.replace(/]/g, "]]")}]`;

interface Col { name: string; type: string }

async function main() {
    const cfg = loadDbConfig();
    console.log(`Connecting to ${cfg.database} ...`);
    const pool = await openPool(cfg);
    let superbill: unknown = null;
    const out: { table: string; rows: number; columns: { name: string; type: string; filled: number; filledPct: number; examples: string[] }[] }[] = [];
    try {
        const cols = await queryAll(pool,
            "SELECT c.TABLE_NAME AS t, c.COLUMN_NAME AS c, c.DATA_TYPE AS d FROM INFORMATION_SCHEMA.COLUMNS c " +
            "JOIN INFORMATION_SCHEMA.TABLES t ON t.TABLE_NAME = c.TABLE_NAME AND t.TABLE_SCHEMA = c.TABLE_SCHEMA " +
            "WHERE t.TABLE_TYPE = 'BASE TABLE' AND c.TABLE_SCHEMA = 'dbo' ORDER BY c.TABLE_NAME, c.ORDINAL_POSITION");
        const byTable = new Map<string, Col[]>();
        for (const r of cols) {
            const list = byTable.get(String(r.t)) ?? [];
            list.push({ name: String(r.c), type: String(r.d).toLowerCase() });
            byTable.set(String(r.t), list);
        }
        console.log(`${byTable.size} tables, ${cols.length} columns`);
        let i = 0;
        for (const [table, list] of byTable) {
            i++;
            const [cnt] = await queryAll(pool, `SET NOCOUNT ON; SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED; SELECT COUNT_BIG(*) AS n FROM dbo.${q(table)}`);
            const rows = Number(cnt?.n ?? 0);
            const entry = { table, rows, columns: [] as { name: string; type: string; filled: number; filledPct: number; examples: string[] }[] };
            if (rows > 0) {
                // One scan: a filled-count per column (binary columns: just NOT NULL).
                const parts = list.map((c, j) =>
                    BINARY.has(c.type)
                        ? `SUM(CASE WHEN ${q(c.name)} IS NULL THEN 0 ELSE 1 END) AS f${j}`
                        : `SUM(CASE WHEN ${q(c.name)} IS NULL OR LTRIM(RTRIM(CONVERT(nvarchar(4000), ${q(c.name)}))) IN ${BLANKS} THEN 0 ELSE 1 END) AS f${j}`);
                const [f] = await queryAll(pool, `SET NOCOUNT ON; SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED; SELECT ${parts.join(", ")} FROM dbo.${q(table)}`);
                for (let j = 0; j < list.length; j++) {
                    const c = list[j];
                    const filled = Number(f?.[`f${j}`] ?? 0);
                    let examples: string[] = [];
                    if (filled > 0 && !BINARY.has(c.type)) {
                        const ex = await queryAll(pool,
                            // First few non-blank values (no DISTINCT: stops at the first matches instead of scanning the table).
                            `SET NOCOUNT ON; SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED; SELECT TOP 3 LEFT(CONVERT(nvarchar(4000), ${q(c.name)}), 60) AS v FROM dbo.${q(table)} ` +
                            `WHERE ${q(c.name)} IS NOT NULL AND LTRIM(RTRIM(CONVERT(nvarchar(4000), ${q(c.name)}))) NOT IN ${BLANKS}`);
                        examples = ex.map((e) => String(e.v));
                    }
                    entry.columns.push({ name: c.name, type: c.type, filled, filledPct: Math.round((filled / rows) * 1000) / 10, examples });
                }
            } else {
                entry.columns = list.map((c) => ({ name: c.name, type: c.type, filled: 0, filledPct: 0, examples: [] }));
            }
            out.push(entry);
            if (i % 25 === 0) console.log(`  ${i}/${byTable.size} tables ...`);
        }
        // "Super/bulk sale" bills (GstSuperSalesEntry / SuperBill pages) live in superbill1/superbill2, which the ERP
        // does not read. How big are they, do they duplicate sales2, and are their barcodes stock the ERP counts?
        try {
            const RUN = "SET NOCOUNT ON; SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED; ";
            const [hdr] = await queryAll(pool, RUN +
                "SELECT COUNT(*) AS bills, SUM(CASE WHEN [status] <> '1' THEN 1 ELSE 0 END) AS liveBills, ISNULL(SUM(CASE WHEN [status] <> '1' THEN TRY_CAST([tot_netamnt] AS float) END), 0) AS liveValue, " +
                "CONVERT(varchar(10), MIN([date]), 23) AS firstDate, CONVERT(varchar(10), MAX([date]), 23) AS lastDate, " +
                "SUM(CASE WHEN [sysidandbill] IN (SELECT [sysidandbill] FROM dbo.[sales2]) THEN 1 ELSE 0 END) AS alsoInSales2 FROM dbo.[superbill2]");
            const [ln] = await queryAll(pool, RUN +
                "SELECT COUNT(*) AS lines, ISNULL(SUM(TRY_CAST(l.[qty] AS float)), 0) AS qty, " +
                "SUM(CASE WHEN l.[barcode] IN (SELECT [barcode] FROM dbo.[stockdetails]) THEN 1 ELSE 0 END) AS linesWithStockBarcode, " +
                "ISNULL(SUM(CASE WHEN l.[barcode] IN (SELECT [barcode] FROM dbo.[stockdetails]) THEN TRY_CAST(l.[qty] AS float) END), 0) AS qtyOnStockBarcodes " +
                "FROM dbo.[superbill1] AS l WHERE l.[status] <> '1'");
            superbill = { header: hdr, lines: ln };
            console.log("\nSuper bills (not read by the ERP):", JSON.stringify(superbill));
        } catch (e) {
            console.log("Super bill check skipped:", (e as Error).message);
        }
    } finally {
        await pool.close();
    }

    const dir = path.resolve(process.cwd(), "textilesoft-discovery");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "field-usage.json"), JSON.stringify({ generatedAt: new Date().toISOString(), superbill, tables: out }, null, 1));
    const esc = (v: unknown) => { const s = String(v ?? ""); return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
    const lines = ["table,table_rows,column,type,filled_rows,filled_pct,examples"];
    for (const t of out) for (const c of t.columns) lines.push([t.table, t.rows, c.name, c.type, c.filled, c.filledPct, c.examples.join(" | ")].map(esc).join(","));
    fs.writeFileSync(path.join(dir, "field-usage.csv"), "﻿" + lines.join("\r\n"));

    const nonEmpty = out.filter((t) => t.rows > 0);
    const deadCols = nonEmpty.reduce((s, t) => s + t.columns.filter((c) => c.filled === 0).length, 0);
    const allCols = nonEmpty.reduce((s, t) => s + t.columns.length, 0);
    console.log(`\nTables: ${out.length} (${nonEmpty.length} with data, ${out.length - nonEmpty.length} empty)`);
    console.log(`Columns in tables with data: ${allCols}, never filled: ${deadCols}`);
    console.log(`Written: ${path.join(dir, "field-usage.json")} and field-usage.csv`);
}

main().catch((err) => {
    console.error("Field usage analysis failed:", err instanceof Error ? err.message : err);
    process.exit(1);
});
