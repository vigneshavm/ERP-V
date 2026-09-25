/* eslint-disable no-console */
import fs from "fs";
import path from "path";
import { parseArgs } from "util";
import dotenv from "dotenv";
import { quoteTable } from "../integrations/textilesoft/mapping.js";
import { discoverSchema, suggestMapping } from "../integrations/textilesoft/schemaDiscovery.js";
import { loadDbConfig, openPool, queryAll } from "../integrations/textilesoft/shopDbReader.js";

dotenv.config();

/**
 * Read-only exploration of the shop's Textilesoft database (SQL Server "SSS").
 *
 *   npm run discover:textilesoft                     list tables, write report + suggested mapping
 *   npm run discover:textilesoft -- --sample dbo.X   show 5 rows of a table to verify columns
 */
async function main() {
    const { values } = parseArgs({
        options: {
            sample: { type: "string" },
            out: { type: "string", default: "textilesoft-discovery" },
            top: { type: "string", default: "10" },
        },
    });

    const pool = await openPool(loadDbConfig());
    try {
        if (values.sample) {
            const rows = await queryAll(pool, `SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED; SELECT TOP 5 * FROM ${quoteTable(values.sample)}`);
            console.table(rows);
            return;
        }

        const tables = await discoverSchema(pool);
        const top = Number(values.top);
        console.log(`Found ${tables.length} tables. Most likely product/stock tables:\n`);
        for (const t of tables.slice(0, top)) {
            console.log(`  [score ${String(t.score).padStart(2)}] ${t.table}  (${t.rows >= 0 ? t.rows : "?"} rows)`);
            console.log(`             ${t.columns.map((c) => c.name).join(", ")}`);
        }

        const outDir = path.resolve(process.cwd(), values.out as string);
        fs.mkdirSync(outDir, { recursive: true });
        fs.writeFileSync(path.join(outDir, "schema-report.json"), JSON.stringify(tables, null, 2));
        if (tables[0]) {
            fs.writeFileSync(path.join(outDir, "textilesoft.mapping.suggested.json"), JSON.stringify(suggestMapping(tables[0]), null, 2));
        }
        console.log(`\nWrote ${outDir}${path.sep}schema-report.json and textilesoft.mapping.suggested.json`);
        console.log("Next: verify with  --sample <schema.table>, then copy/edit the suggestion to textilesoft.mapping.json");
    } finally {
        await pool.close();
    }
}

main().catch((err) => {
    console.error("Discovery failed:", err instanceof Error ? err.message : err);
    process.exit(1);
});
