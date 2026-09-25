import dotenv from "dotenv";
dotenv.config();
import { loadDbConfig, openPool, queryAll } from "./src/integrations/textilesoft/shopDbReader.js";

async function main() {
    const pool = await openPool(loadDbConfig());
    try {
        const slsman = await queryAll(pool, `SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED; SELECT TOP 20 sls_man, COUNT(*) AS cnt FROM dbo.salsntry WHERE date >= DATEADD(day, -90, GETDATE()) GROUP BY sls_man ORDER BY cnt DESC`);
        console.log("sls_man distribution (last 90d):");
        console.table(slsman);

        const counters = await queryAll(pool, `SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED; SELECT TOP 20 countername, systemname, COUNT(*) AS cnt FROM dbo.sales2 WHERE date >= DATEADD(day, -90, GETDATE()) GROUP BY countername, systemname ORDER BY cnt DESC`);
        console.log("countername/systemname distribution (last 90d):");
        console.table(counters);
    } finally {
        await pool.close();
    }
}
main().catch((e) => { console.error(e); process.exit(1); });
