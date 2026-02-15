import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGO_URI;

async function test() {
    console.log("URI:", MONGO_URI ? "FOUND" : "NOT FOUND");
    try {
        console.log("Connecting...");
        await mongoose.connect(MONGO_URI, {
            serverSelectionTimeoutMS: 15000,
            connectTimeoutMS: 15000
        });
        console.log("✅ Success!");
        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error("❌ Failed:", err.message);
        process.exit(1);
    }
}

test();
