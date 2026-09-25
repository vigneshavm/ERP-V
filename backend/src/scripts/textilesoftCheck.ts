/* eslint-disable no-console */
import dotenv from "dotenv";
import { loadDbConfig, openPool, queryAll } from "../integrations/textilesoft/shopDbReader.js";

dotenv.config();

/**
 * Connectivity + sanity check for the Textilesoft SQL Server database. Read-only.
 *   npm run check:textilesoft
 */
const KEY_TABLES = ["Barcode", "PurchaseStock", "stockdetails", "newproduct"];

async function main() {
    const cfg = loadDbConfig();
    console.log(`Connecting to ${cfg.server}${cfg.instanceName ? "\\" + cfg.instanceName : cfg.port ? ":" + cfg.port : ""} / ${cfg.database} as ${cfg.user} ...`);
    const pool = await openPool(cfg);
    try {
        const [info] = await queryAll(pool, "SELECT @@VERSION AS v, DB_NAME() AS db, SUSER_SNAME() AS login_name");
        console.log(`Connected. Database: ${info.db}, login: ${info.login_name}`);
        console.log(String(info.v).split("\n")[0]);
        for (const t of KEY_TABLES) {
            try {
                const [r] = await queryAll(pool, `SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED; SELECT COUNT(*) AS n FROM dbo.[${t}]`);
                console.log(`  dbo.${t.padEnd(14)} ${r.n} rows`);
            } catch (e) {
                console.log(`  dbo.${t.padEnd(14)} not readable: ${(e as Error).message}`);
            }
        }
        console.log("\nOK. Next: npm run discover:textilesoft -- --sample dbo.Barcode");
    } finally {
        await pool.close();
    }
}

main().catch((err) => {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Connection check failed:", msg);
    if (/ESOCKET|ETIMEOUT|ECONNREFUSED|Failed to connect/i.test(msg)) {
        console.error("Hints: enable TCP/IP for SQLEXPRESS in SQL Server Configuration Manager and restart the service; start the 'SQL Server Browser' service (needed for named instances), or set TEXTILESOFT_DB_PORT to the instance's fixed port and clear TEXTILESOFT_DB_INSTANCE.");
    } else if (/Login failed/i.test(msg)) {
        console.error("Hints: create the erp_readonly login, check the password, and enable 'SQL Server and Windows Authentication mode' (then restart the service).");
    }
    process.exit(1);
});
