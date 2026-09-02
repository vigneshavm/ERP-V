// Migration: 001-multi-tenant-init.js
// Goal: Initialize Multi-Tenancy (Default Tenant) and backfill data

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';

// Fix for __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from backend root (assuming script is in backend/scripts/migrations)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const run = async () => {
    try {
        console.log("🔄 Connecting to MongoDB...");
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI not found in .env");
        }
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected to MongoDB");

        const db = mongoose.connection.db;

        // 1. Find or Create Default Tenant
        console.log("\n🏢 Checking for Default Tenant...");
        let defaultTenant = await db.collection("tenants").findOne({ slug: "default-tenant" });

        if (!defaultTenant) {
            console.log("⚠️  Default Tenant not found. Creating one...");
            // Need an owner for the tenant. Find first admin/user.
            const firstUser = await db.collection("users").findOne({});
            if (!firstUser) {
                console.error("❌ No users found to assign as tenant owner. Please create a user manually first.");
                process.exit(1);
            }

            const now = new Date();
            const result = await db.collection("tenants").insertOne({
                name: "Default Organization",
                slug: "default-tenant",
                ownerId: firstUser._id, // Assign to first user
                status: "ACTIVE",
                config: {
                    currency: "USD",
                    timezone: "UTC",
                    theme: { primaryColor: "#007bff", logoUrl: "" }
                },
                createdAt: now,
                updatedAt: now
            });
            defaultTenant = await db.collection("tenants").findOne({ _id: result.insertedId });
            console.log(`✅ Created Default Tenant: ${defaultTenant.name} (${defaultTenant._id})`);
        } else {
            console.log(`✅ Found Default Tenant: ${defaultTenant.name} (${defaultTenant._id})`);
        }

        const tenantId = defaultTenant._id;

        // 2. Create Default Branch
        console.log("\n🌿 Checking for Default Branch...");
        const defaultBranch = await db.collection("branches").findOne({ tenantId: tenantId, isMain: true });

        if (!defaultBranch) {
            console.log("⚠️  Default Branch not found. Creating one...");
            const now = new Date();
            await db.collection("branches").insertOne({
                name: "Main Branch",
                address: "Headquarters",
                isMain: true,
                tenantId: tenantId,
                createdAt: now,
                updatedAt: now
            });
            console.log("✅ Created Default Branch");
        } else {
            console.log("✅ Found Default Branch");
        }

        // 3. Backfill tenantId on Collections
        const collectionsToUpdate = [
            "users",
            "items",
            "customers",
            "invoices", // Sales Invoice
            "salesorders",
            "deliverychallans",
            "bankaccounts",
            "employees",
            "suppliers",
            "expenses",
            "purchases"
        ];

        console.log("\n📦 Backfilling tenantId...");

        for (const colName of collectionsToUpdate) {
            try {
                const collection = db.collection(colName);
                // Check if collection exists
                const count = await collection.countDocuments({});
                if (count === 0) {
                    console.log(`   - ${colName}: Empty, skipping.`);
                    continue;
                }

                const result = await collection.updateMany(
                    { tenantId: { $exists: false } },
                    { $set: { tenantId: tenantId } }
                );

                if (result.modifiedCount > 0) {
                    console.log(`   ✅ ${colName}: Updated ${result.modifiedCount} documents.`);
                } else {
                    console.log(`   - ${colName}: All documents already have tenantId.`);
                }

            } catch (err) {
                // Collection might not exist, which is fine
                // e.g. "ns not found"
                console.log(`   ⚠️  ${colName}: Skipped (may not exist or error: ${err.message})`);
            }
        }

        // 4. Special Case: Users also need activeTenantId or similar if using it for session context
        await db.collection("users").updateMany(
            { tenantId: { $exists: false } },
            { $set: { tenantId: tenantId } }
        );
        // Also ensure they have a role if missing?

        console.log("\n🎉 Migration 001-multi-tenant-init completed successfully!");
        process.exit(0);

    } catch (error) {
        console.error("\n❌ Migration failed:", error);
        process.exit(1);
    }
};

run();
