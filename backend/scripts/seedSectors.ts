// Run with: node backend/scripts/seedSectors.js

import mongoose from "mongoose";
import dotenv from "dotenv";
import { SECTOR_SEEDS } from "../src/utils/sectorSeeds.js";
// We need to handle the import of the model. Since it's TS, running this via node might be tricky without ts-node or transpilation.
// simplest way for a script is to define the schema inline or use tsx if available.
// package.json shows "start:ts": "tsx src/server.ts", so we can use `npx tsx scripts/seedSectors.ts` if we rename this.

dotenv.config();

const runSeed = async () => {
    try {
        console.log("🔄 Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI || "");
        console.log("✅ Connected to MongoDB");

        // Define generic schema inline to avoid import issues in pure JS run, 
        // BUT if we use tsx we can import the model. Let's try to use tsx approach by saving as .ts

        // Dynamic import to bypass some build restrictions if run as node js
        // const Sector = await import("../src/models/Sector.js"); 

        // Actually, let's just use the db connection directly to insert, simpler for a migration script
        if (!mongoose.connection.db) {
            throw new Error("Database connection execution failed");
        }
        const db = mongoose.connection.db;
        const collection = db.collection("sectors");

        const sectors = Object.keys(SECTOR_SEEDS).map(key => ({
            name: key.charAt(0).toUpperCase() + key.slice(1), // Capitalize
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        }));

        console.log(`📋 Found ${sectors.length} sectors to seed:`, sectors.map(s => s.name).join(", "));

        // Upsert to avoid duplicates
        for (const sector of sectors) {
            await collection.updateOne(
                { name: sector.name },
                { $set: sector },
                { upsert: true }
            );
        }

        console.log("✅ Sectors seeded successfully!");
        process.exit(0);

    } catch (error) {
        console.error("❌ Seeding failed:", error);
        process.exit(1);
    }
};

runSeed();
