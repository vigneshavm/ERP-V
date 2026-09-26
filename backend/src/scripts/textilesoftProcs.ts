/* eslint-disable no-console */
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { loadDbConfig, openPool, queryAll } from "../integrations/textilesoft/shopDbReader.js";

dotenv.config();

/**
 * Dumps the SQL of Textilesoft's own stock stored procedures / views, so the ERP can reuse the exact
 * stock formula its stock reports use.   npm run analyze:textilesoft:procs
 * Needs VIEW DEFINITION for the reader login (see the message printed when nothing is found).
 */
async function main() {
    const pool = await openPool(loadDbConfig());
    let rows: Record<string, unknown>[] = [];
    try {
        rows = await queryAll(
            pool,
            `SET NOCOUNT ON;
             SELECT o.name AS name, o.type_desc AS type, m.definition AS definition
             FROM sys.sql_modules m JOIN sys.objects o ON o.object_id = m.object_id
             WHERE o.is_ms_shipped = 0 AND (o.name LIKE 'stock%' OR o.name LIKE '%stock%' OR o.name LIKE 'Citystock%' OR o.name LIKE '%balance%'
                OR m.definition LIKE '%stockdetails%')
             ORDER BY o.name`,
        );
    } finally {
        await pool.close();
    }
    const list = rows.map((r) => ({ name: String(r.name), type: String(r.type), chars: String(r.definition ?? "").length, definition: String(r.definition ?? "").slice(0, 30000) }));
    const dir = path.resolve(process.cwd(), "textilesoft-discovery");
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, "procs.json");
    fs.writeFileSync(file, JSON.stringify(list, null, 2), "utf8");
    if (list.length === 0) {
        console.log("Found 0 procedures/views (or the login cannot see them). In SSMS, run once:\n  USE SSS_copy; GRANT VIEW DEFINITION TO erp_readonly;\nthen re-run this command.");
    } else {
        console.log(`Found ${list.length} objects: ${list.map((l) => l.name).join(", ")}`);
    }
    console.log(`\nDone. Report written to ${file}\nTell Claude it is ready.`);
}

main().catch((e) => {
    console.error("Failed:", e.message);
    process.exit(1);
});
