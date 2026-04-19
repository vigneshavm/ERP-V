import { connectDB, disconnectDB } from "./utils/db.js";
import mongoose from "mongoose";
import User from "../src/modules/core/models/User.js";
import Tenant from "../src/modules/core/models/Tenant.js";
import bcrypt from "bcryptjs";

async function testConnection() {
    console.log("Testing MongoDB connection...");
    await connectDB();
    console.log("Connection successful!");
    const db = mongoose.connection.db;
    if (db) {
        const collections = await db.listCollections().toArray();
        console.log(`Found ${collections.length} collections:`, collections.map(c => c.name).join(", "));
    }
    await disconnectDB();
}

async function verifyLogin(email: string, password: string) {
    await connectDB();
    try {
        const user = await User.findOne({ email });
        if (!user) {
            console.error(`User ${email} not found.`);
            return;
        }

        const isMatch = await bcrypt.compare(password, user.password);
        console.log(`\nLogin Verification for ${email}:`);
        console.log(`User ID: ${user._id}`);
        console.log(`Tenant ID: ${user.tenantId}`);
        console.log(`Role: ${user.role}`);
        console.log(`Status: ${user.status}`);
        console.log(`Password Match: ${isMatch ? "✅ YES" : "❌ NO"}`);

        if (user.tenantId) {
            const tenant = await Tenant.findById(user.tenantId);
            console.log(`Tenant Name: ${tenant ? tenant.name : "Not Found"}`);
        }
    } catch (err: any) {
        console.error("Error verifying login:", err.message);
    } finally {
        await disconnectDB();
    }
}

async function listCollections() {
    await connectDB();
    try {
        const db = mongoose.connection.db;
        if (!db) throw new Error("DB not connected");
        const collections = await db.listCollections().toArray();
        for (const col of collections) {
            const count = await db.collection(col.name).countDocuments();
            console.log(`${col.name.padEnd(25)}: ${count} documents`);
        }
    } catch (err: any) {
        console.error("Error listing collections:", err.message);
    } finally {
        await disconnectDB();
    }
}

// CLI Routing
const [command, arg1, arg2] = process.argv.slice(2);

switch (command) {
    case 'test-db':
        testConnection();
        break;
    case 'login':
        verifyLogin(arg1 || 'demo@bizzai.com', arg2 || 'Demo@123');
        break;
    case 'collections':
        listCollections();
        break;
    default:
        console.log('Usage: npx tsx scripts/diagnostics.ts [test-db|login|collections] [arg1] [arg2]');
}
