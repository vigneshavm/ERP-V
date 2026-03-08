
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const testConnection = async (uri, label) => {
    try {
        console.log(`\nTesting ${label}...`);
        // Mask password for logging
        const maskedUri = uri.replace(/:([^@]+)@/, ':****@');
        console.log(`URI: ${maskedUri}`);
        
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
        console.log(`✅ ${label} WORKED!`);
        
        const UserSchema = new mongoose.Schema({ email: String, name: String }, { strict: false });
        const User = mongoose.models.User || mongoose.model('User', UserSchema);
        const count = await User.countDocuments();
        console.log(`Found ${count} users.`);
        
        if (count > 0) {
            const users = await User.find({}).limit(5).lean();
            console.table(users.map(u => ({ Name: u.name || u.fullName, Email: u.email, Role: u.role })));
        }

        await mongoose.disconnect();
        return true;
    } catch (err) {
        console.error(`❌ ${label} FAILED: ${err.message}`);
        return false;
    }
};

const runTests = async () => {
    const password = "6oP5NGXiiirUfgSn";
    const passwordWithBrackets = "<6oP5NGXiiirUfgSn>";
    const host = "cluster0.kxzqtht.mongodb.net";
    const db = "bizzai";

    // 1. SRV with plain password
    await testConnection(`mongodb+srv://avmvignesh0207_db_user:${password}@${host}/${db}`, "SRV Plain");

    // 2. SRV with brackets (just in case)
    await testConnection(`mongodb+srv://avmvignesh0207_db_user:${passwordWithBrackets}@${host}/${db}`, "SRV with Brackets");

    // 3. Standard URI (non-SRV) - guessing the shard host from logs
    const shardHost = "ac-xoh2y1d-shard-00-00.kxzqtht.mongodb.net";
    await testConnection(`mongodb://avmvignesh0207_db_user:${password}@${shardHost}:27017/${db}?authSource=admin&ssl=true`, "Standard Shard Host");

    process.exit(0);
};

runTests();
