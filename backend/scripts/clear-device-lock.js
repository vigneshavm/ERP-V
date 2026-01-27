
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        const User = mongoose.model('User', new mongoose.Schema({
            email: String,
            activeDeviceId: String
        }), 'users');

        const email = 'avmvignesh0207@gmail.com';
        const result = await User.updateOne({ email }, { $set: { activeDeviceId: null } });

        console.log(`Cleared activeDeviceId for ${email}. Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`);

        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
};

run();
