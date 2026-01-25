
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const createEmployeeTable = async () => {
    try {
        console.log("🔄 Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI || "");
        console.log("✅ Connected to MongoDB");

        const db = mongoose.connection.db;

        if (!db) {
            throw new Error("Database connection failed");
        }

        // Check if collection exists
        const collections = await db.listCollections({ name: "employees" }).toArray();
        if (collections.length === 0) {
            console.log("✨ Creating 'employees' collection...");
            await db.createCollection("employees");
            console.log("✅ Collection 'employees' created.");
        } else {
            console.log("ℹ️  Collection 'employees' already exists.");
        }

        // Create Indexes
        console.log("🔧 Creating Indexes for 'employees'...");
        const collection = db.collection("employees");

        // Unique compound index: One mobile number per tenant
        await collection.createIndex({ tenantId: 1, mobile: 1 }, { unique: true });
        console.log("✅ Index created: { tenantId: 1, mobile: 1 } (Unique)");

        // Index for querying by role (optional but good for performance)
        await collection.createIndex({ role: 1 });
        console.log("✅ Index created: { role: 1 }");

        // Index for querying by branch (optional)
        await collection.createIndex({ branchId: 1 });
        console.log("✅ Index created: { branchId: 1 }");

        console.log("\n🎉 Employee Table (Collection) setup complete!");
        process.exit(0);

    } catch (error: any) {
        console.error("\n❌ Setup failed:", error.message);
        process.exit(1);
    }
};

createEmployeeTable();
