/* eslint-disable no-console */
import { parseArgs } from "util";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { closeSqlItemSource, mirrorAll } from "../integrations/textilesoft/sqlItemSource.js";

dotenv.config();

/**
 * Copies the whole shop catalogue (as ITEM_DATA_SOURCE=sql sees it, with ERP movements layered on) into
 * MongoDB right now, instead of waiting for the first inventory request.
 *   npm run mirror:textilesoft -- --tenant <tenantId>
 */
async function main() {
    const { values } = parseArgs({ options: { tenant: { type: "string" } } });
    if (!values.tenant) throw new Error("--tenant <tenantId> is required");
    if (!process.env.MONGO_URI) throw new Error("MONGO_URI is not set");
    await mongoose.connect(process.env.MONGO_URI);
    try {
        const result = await mirrorAll(values.tenant);
        console.log(result.error ? `Mirror failed: ${result.error}` : `Mirrored ${result.items} items (${result.skipped} skipped) in ${result.seconds}s.`);
        if (result.error) process.exitCode = 1;
    } finally {
        await closeSqlItemSource();
        await mongoose.disconnect();
    }
}

main().catch((e) => {
    console.error("Mirror failed:", e instanceof Error ? e.message : e);
    process.exit(1);
});
