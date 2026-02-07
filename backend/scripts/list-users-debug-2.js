
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
        console.log("Connecting to:", process.env.MONGO_URI?.split('@')[1] || "URI hidden");
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 10000,
        });
        console.log("Connected. Fetching users...");
        const users = await User.find({}, 'email name role').limit(10).sort({ createdAt: -1 });
        console.log("Users found:", users.length);
        console.log(JSON.stringify(users, null, 2));
        process.exit(0);
    } catch (err) {
        console.error("Connection error:", err.message);
        process.exit(1);
    }
};

listUsers();
