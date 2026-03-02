import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import dns from 'dns';
import bcrypt from 'bcryptjs';

// Force Node.js to use Google & Cloudflare DNS to resolve MongoDB Atlas SRV records
dns.setServers(['8.8.8.8', '1.1.1.1']);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.join(__dirname, '.env') });

// Define Minimal Model
const userSchema = new mongoose.Schema({}, { strict: false, collection: 'users' });
const User = mongoose.model('User', userSchema);

async function updatePasswords() {
    try {
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) throw new Error('MONGO_URI is not defined');

        await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 10000,
            connectTimeoutMS: 10000
        });

        console.log('Connected to MongoDB');

        // Target Users
        const targetEmails = [
            'athimoolam@vijayalaxmi.com',
            'vignesh@vijayalaxmi.com',
            'madhan@vijayalaxmi.com',
            'manikandan@vijayalaxmi.com'
        ];

        const newPassword = 'Password@123';

        // Hash the new password properly like a backend usually would (salting rounds = 10 is standard)
        console.log('\nHashing new password...');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        console.log(`Password hashed successfully.`);

        for (const email of targetEmails) {
            console.log(`\nProcessing: ${email}`);

            const user = await User.findOne({ email });

            if (user) {
                const result = await User.updateOne(
                    { email: email },
                    { $set: { password: hashedPassword } }
                );

                if (result.modifiedCount > 0) {
                    console.log(`✅ Successfully updated password for: ${email}`);
                } else {
                    console.log(`⚠️ Password was not updated for ${email} (maybe already this password?)`);
                }
            } else {
                console.log(`❌ User with email ${email} not found in database!`);
            }
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err);
    }
}

updatePasswords();
