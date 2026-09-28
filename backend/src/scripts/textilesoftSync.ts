/* eslint-disable no-console */
import fs from "fs";
import path from "path";
import { parseArgs } from "util";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { validateMapping } from "../integrations/textilesoft/mapping.js";
import { loadDbConfig, openPool } from "../integrations/textilesoft/shopDbReader.js";
import { runSync } from "../integrations/textilesoft/syncService.js";
import type { StockMode } from "../integrations/textilesoft/types.js";

dotenv.config();

/**
 * One-way sync: Textilesoft SQL Server "SSS" -> ERP items/stock (MongoDB). Never writes to SSS.
 *
 *   npm run sync:textilesoft -- --tenant <tenantId> --dry-run
 *   npm run sync:textilesoft -- --tenant <tenantId> --stock overwrite
 *
 * Daily-backup routine (Textilesoft is the source of truth, ERP mirrors it):
 *   restore the new backup into SSS_copy, then  npm run sync:textilesoft -- --tenant <id> --stock overwrite
 * Sold-out lots are included by default so their stock is set to 0 in the ERP; pass --in-stock-only
 * to skip them (they would keep whatever stock they had at the previous sync).
 */
async function main() {
    const { values } = parseArgs({
        options: {
            tenant: { type: "string" },
            mapping: { type: "string", default: "textilesoft.mapping.json" },
            user: { type: "string", default: "textilesoft-sync" },
            stock: { type: "string", default: "initial-only" },
            "batch-size": { type: "string", default: "500" },
            "dry-run": { type: "boolean", default: false },
            "in-stock-only": { type: "boolean", default: false },
        },
    });

    if (!values.tenant) throw new Error("--tenant <tenantId> is required");
    if (!["off", "initial-only", "overwrite"].includes(values.stock as string)) {
        throw new Error("--stock must be one of: off | initial-only | overwrite");
    }
    if (!process.env.MONGO_URI) throw new Error("MONGO_URI is not set");

    const mappingPath = path.resolve(process.cwd(), values.mapping as string);
    const mapping = validateMapping(JSON.parse(fs.readFileSync(mappingPath, "utf8")));
    // A sync must also see lots that are now sold out, otherwise their old stock never drops to 0.
    if (mapping.stock) mapping.stock.inStockOnly = Boolean(values["in-stock-only"]);

    const pool = await openPool(loadDbConfig());
    await mongoose.connect(process.env.MONGO_URI);
    try {
        const dryRun = Boolean(values["dry-run"]);
        console.log(`${dryRun ? "[DRY RUN] " : ""}Syncing ${mapping.source.table} -> tenant ${values.tenant} (stock: ${values.stock})`);
        const report = await runSync(pool, mapping, {
            tenantId: values.tenant,
            addedBy: values.user as string,
            dryRun,
            stockMode: values.stock as StockMode,
            batchSize: Number(values["batch-size"]),
            log: (m) => process.stdout.write(`\r${m}      `),
        });
        console.log("\n");
        const { errors, ...counts } = report;
        console.table(counts);
        if (errors.length) {
            console.log(`${errors.length} issue(s); first 20:`);
            errors.slice(0, 20).forEach((e) => console.log(`  ${e.row ? `row ${e.row}: ` : ""}${e.message}`));
        }
        if (dryRun) console.log("\nDry run: nothing was written to the ERP database.");
    } finally {
        await mongoose.disconnect();
        await pool.close();
    }
}

main().catch((err) => {
    console.error("Sync failed:", err instanceof Error ? err.message : err);
    process.exit(1);
});
