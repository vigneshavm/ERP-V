/**
 * 004 -- tenant ownership for purchase returns and debit notes.
 *
 * Why: returns used to be scoped by `createdBy` and had no tenantId; debit notes gained a required
 * tenantId in the backend refactor. Records created before that are invisible to tenant-scoped
 * screens (purchase-return list, debit notes, supplier ledger links) until they get a tenantId.
 * Debit-note numbers also move from globally unique to unique per tenant.
 *
 * What it does:
 *   1. purchasereturns without tenantId  -> tenantId of the user in createdBy
 *   2. debitnotes without tenantId       -> tenantId of the user in createdBy
 *   3. debitnotes index: drop global unique `noteId_1`, create unique { tenantId, noteId }
 *      (skipped, with a report, if a tenant already has duplicate note numbers)
 *   4. report (never changes) user accounts with no tenantId: `protect` now rejects them (403
 *      TENANT_REQUIRED) unless they are superadmins
 *
 * Safe to re-run. Dry run by default -- prints what would change and writes nothing:
 *   node scripts/migrations/004-backfill-purchase-return-tenant.js
 *   node scripts/migrations/004-backfill-purchase-return-tenant.js --apply
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../../.env") });

const APPLY = process.argv.includes("--apply");
const log = (...args) => console.log(...args);

const backfillFromCreator = async (db, collectionName) => {
    const col = db.collection(collectionName);
    const missing = await col.find({ tenantId: { $exists: false } }, { projection: { _id: 1, createdBy: 1 } }).toArray();
    log(`\n${collectionName}: ${missing.length} record(s) without tenantId`);
    if (missing.length === 0) return;

    const creatorIds = [...new Set(missing.map((d) => String(d.createdBy)).filter((id) => mongoose.Types.ObjectId.isValid(id)))];
    const users = await db.collection("users")
        .find({ _id: { $in: creatorIds.map((id) => new mongoose.Types.ObjectId(id)) } }, { projection: { tenantId: 1 } })
        .toArray();
    const tenantOfUser = new Map(users.filter((u) => u.tenantId).map((u) => [String(u._id), u.tenantId]));

    const ops = [];
    const unresolved = [];
    for (const doc of missing) {
        const tenantId = tenantOfUser.get(String(doc.createdBy));
        if (tenantId) {
            ops.push({ updateOne: { filter: { _id: doc._id, tenantId: { $exists: false } }, update: { $set: { tenantId } } } });
        } else {
            unresolved.push(String(doc._id));
        }
    }
    log(`  resolvable from creator: ${ops.length}`);
    if (unresolved.length) log(`  NOT resolvable (creator missing or has no tenant): ${unresolved.length} -> ${unresolved.slice(0, 20).join(", ")}${unresolved.length > 20 ? " ..." : ""}`);
    if (APPLY && ops.length) {
        const res = await col.bulkWrite(ops, { ordered: false });
        log(`  updated: ${res.modifiedCount}`);
    }
};

const rekeyDebitNoteIndex = async (db) => {
    const col = db.collection("debitnotes");
    const dupes = await col.aggregate([
        { $match: { tenantId: { $exists: true } } },
        { $group: { _id: { tenantId: "$tenantId", noteId: "$noteId" }, n: { $sum: 1 }, ids: { $push: "$_id" } } },
        { $match: { n: { $gt: 1 } } },
    ]).toArray();
    const indexes = await col.indexes();
    const hasGlobal = indexes.some((i) => i.name === "noteId_1");
    const hasPerTenant = indexes.some((i) => i.key && i.key.tenantId === 1 && i.key.noteId === 1);
    log(`\ndebitnotes indexes: global noteId_1=${hasGlobal}, per-tenant {tenantId,noteId}=${hasPerTenant}`);
    if (dupes.length) {
        log(`  ${dupes.length} duplicate note number(s) within a tenant -- fix these first, index change skipped:`);
        dupes.slice(0, 20).forEach((d) => log(`    tenant ${d._id.tenantId} ${d._id.noteId}: ${d.ids.join(", ")}`));
        return;
    }
    if (!APPLY) return;
    if (!hasPerTenant) {
        await col.createIndex({ tenantId: 1, noteId: 1 }, { unique: true });
        log("  created unique { tenantId: 1, noteId: 1 }");
    }
    if (hasGlobal) {
        await col.dropIndex("noteId_1");
        log("  dropped global noteId_1");
    }
};

const reportUsersWithoutTenant = async (db) => {
    const users = await db.collection("users")
        .find({ tenantId: { $exists: false }, role: { $ne: "superadmin" } }, { projection: { email: 1, role: 1 } })
        .toArray();
    log(`\nusers without a tenant (will be refused sign-in to shop screens): ${users.length}`);
    users.slice(0, 50).forEach((u) => log(`  ${u._id} ${u.email || "(no email)"} role=${u.role || "?"}`));
};

const run = async () => {
    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error("MONGO_URI is not set (backend/.env)");
    log(APPLY ? "Mode: APPLY (writing changes)" : "Mode: DRY RUN (no changes written; add --apply to write)");
    await mongoose.connect(uri);
    const db = mongoose.connection.db;
    try {
        await backfillFromCreator(db, "purchasereturns");
        await backfillFromCreator(db, "debitnotes");
        await rekeyDebitNoteIndex(db);
        await reportUsersWithoutTenant(db);
        log("\nDone.");
    } finally {
        await mongoose.disconnect();
    }
};

run().catch((err) => {
    console.error("Migration 004 failed:", err);
    process.exitCode = 1;
});
