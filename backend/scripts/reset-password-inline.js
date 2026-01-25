
import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs"; // Assuming bcryptjs is used
import path from "path";
import { fileURLToPath } from 'url';

// Hack for ESM __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const run = async () => {
    try {
        console.log("🔄 Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected");

        const email = "@gmail.com";
        const password = "";

        console.log(`\n🔍 Searching for user: ${email}`);
        // Minimal schema to interact with users collection
        const userSchema = new mongoose.Schema({
            email: String,
            password: String
        });
        // Point to existing collection 'users'
        const User = mongoose.model('User', userSchema, 'users');

        const user = await User.findOne({ email });

        if (!user) {
            console.log("❌ User NOT FOUND in database. Listing all users:");
            const users = await User.find({});
            users.forEach(u => console.log(` - ${u.email} (${u.name})`));
            process.exit(0);
        }

        console.log(`✅ User found: ${user._id}`);

        // Hash password
        console.log("🔐 Resetting password...");
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user.password = hashedPassword;
        await user.save();

        console.log("✅ Password successfully reset to: " + password);
        process.exit(0);

    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
};

run();
