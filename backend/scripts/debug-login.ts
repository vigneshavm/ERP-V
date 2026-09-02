
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../src/modules/core/models/User.js";
import path from "path";
import { fileURLToPath } from 'url';

// Hack for ESM __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const run = async () => {
    try {
        console.log("🔄 Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI as string);
        console.log("✅ Connected");

        const email = "@gmail";
        const password = ""; // The one user claimed to use

        console.log(`\n🔍 Searching for user: ${email}`);
        const user = await User.findOne({ email });

        if (!user) {
            console.log("❌ User NOT FOUND in database.");
            process.exit(0);
        }

        console.log(`✅ User found: ${user._id}`);
        console.log(`   Name: ${user.name}`);
        // @ts-expect-error -- tenantId isn't declared on the User schema type but is present on stored documents
        console.log(`   TenantId: ${user.tenantId}`);
        console.log(`   Role: ${user.role}`);

        console.log("\n🔐 Testing password match...");

        const isMatch = await user.matchPassword(password);
        console.log(`   Result: ${isMatch ? "MATCH ✅" : "MISMATCH ❌"}`);

        if (!isMatch) {
            console.log("\n⚠️  Attempting to reset password to the provided one...");
            user.password = password;
            await user.save();
            console.log("✅ Password reset. Try logging in again.");
        }

        process.exit(0);

    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
};

run();
