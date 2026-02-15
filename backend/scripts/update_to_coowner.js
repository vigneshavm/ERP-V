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
        const User = mongoose.model('User', new mongoose.Schema({
            email: String,
            role: String
        }));

        const emails = [
            'vignesh@bizzai.com',
            'madhan@bizzai.com',
            'manikandan@bizzai.com'
        ];

        console.log('Updating roles to co-owner...');

        for (const email of emails) {
            const result = await User.updateOne(
                { email },
                { $set: { role: 'co-owner' } }
            );
            if (result.matchedCount > 0) {
                console.log(`✅ Updated ${email} to co-owner`);
            } else {
                console.log(`⚠️ User ${email} not found`);
            }
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

run();
