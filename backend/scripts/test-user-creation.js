
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../src/modules/core/models/User.js";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const runTest = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
        console.log("Connected");

        const testEmail = `test_${Date.now()}@example.com`;
        const testPass = "Test@123";

        console.log("Creating test user...");
        const user = await User.create({
            name: "Test User",
            email: testEmail,
            password: testPass,
            tenantId: new mongoose.Types.ObjectId() // Dummy
        });

        console.log("User created. Password in DB starts with:", user.password.substring(0, 7));

        const isMatch = await user.matchPassword(testPass);
        console.log("Match check:", isMatch ? "SUCCESS ✅" : "FAILED ❌");

        // Cleanup
        await User.deleteOne({ _id: user._id });
        console.log("Cleanup done.");

        process.exit(0);
    } catch (err) {
        console.error("Error:", err.message);
        process.exit(1);
    }
};

runTest();
