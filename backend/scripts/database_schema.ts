import { connectDB, disconnectDB } from "./utils/db.js";
import mongoose from "mongoose";

const createCollection = async (db: mongoose.mongo.Db, collectionName: string, options: any) => {
    try {
        await db.createCollection(collectionName, options);
        console.log(`  ✓ Created collection: ${collectionName}`);
    } catch (error: any) {
        if (error.codeName === 'NamespaceExists') {
            console.log(`  ○ Collection exists: ${collectionName} (skipped)`);
        } else {
            console.error(`  ✗ Error creating ${collectionName}:`, error.message);
        }
    }
};

const createIndexes = async (db: mongoose.mongo.Db, collectionName: string, indexes: any[]) => {
    try {
        const collection = db.collection(collectionName);
        for (const idx of indexes) {
            await collection.createIndex(idx.key, idx.options);
        }
        console.log(`    → Created ${indexes.length} index(es) for ${collectionName}`);
    } catch (error: any) {
        console.error(`    ✗ Error creating indexes for ${collectionName}:`, error.message);
    }
};

const setupSchema = async () => {
    await connectDB();
    try {
        const db = mongoose.connection.db;
        if (!db) throw new Error("DB connection failed");

        console.log('\n📦 Setting up MongoDB Collections and Indexes...\n');

        // Core Collections (simplified for migration script, real logic is in models)
        await createCollection(db, 'users', {});
        await createIndexes(db, 'users', [{ key: { email: 1 }, options: { unique: true } }]);

        await createCollection(db, 'tenants', {});
        await createIndexes(db, 'tenants', [{ key: { slug: 1 }, options: { unique: true } }]);

        await createCollection(db, 'items', {});
        await createIndexes(db, 'items', [{ key: { name: 1, addedBy: 1 }, options: { unique: true } }]);

        await createCollection(db, 'customers', {});
        await createIndexes(db, 'customers', [{ key: { phone: 1, owner: 1 }, options: { unique: true } }]);

        await createCollection(db, 'employees', {});
        await createIndexes(db, 'employees', [{ key: { tenantId: 1, mobile: 1 }, options: { unique: true } }]);

        console.log('\n✅ Core schema setup complete!');

    } catch (err: any) {
        console.error("Error setting up schema:", err.message);
    } finally {
        await disconnectDB();
    }
};

setupSchema();
