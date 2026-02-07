
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../src/modules/core/models/User.js";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const listUsers = async () => {
    try {
        console.log("1. Starting script...");
        const uri = process.env.MONGO_URI;
        if (!uri) {
            console.error("❌ MONGO_URI is missing in .env");
            process.exit(1);
        }
        console.log("2. URI found (masked):", uri.split('@')[1] || "URI format unexpected");

        console.log("3. Attempting to connect...");
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 5000,
        });
        console.log("4. Connected successfully");

        console.log("5. Fetching users...");
        const users = await User.find({}, 'email name role').limit(5).lean();
        console.log(`6. Query complete. Found ${users.length} users.`);

        users.forEach((u, i) => {
            console.log(`   [${i + 1}] ${u.email} (${u.role})`);
        });

        console.log("7. Closing connection...");
        await mongoose.connection.close();
        console.log("8. Done.");
        process.exit(0);
    } catch (err) {
        console.error("❌ ERROR:", err.message);
        process.exit(1);
    }
};

listUsers();
