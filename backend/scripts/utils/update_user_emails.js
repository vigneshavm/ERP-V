import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import dns from 'dns';

// Force Node.js to use Google & Cloudflare DNS to resolve MongoDB Atlas SRV records
dns.setServers(['8.8.8.8', '1.1.1.1']);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.join(__dirname, '.env') });

// Define Minimal Model
const userSchema = new mongoose.Schema({}, { strict: false, collection: 'users' });
const User = mongoose.model('User', userSchema);

async function updateEmails() {
    try {
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) throw new Error('MONGO_URI is not defined');

        await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 10000,
            connectTimeoutMS: 10000
        });

        console.log('Connected to MongoDB');

        // Email mapping as requested
        const emailUpdates = [
            { old: 'vijayalaxmi@bizzai.com', new: 'athimoolam@vijayalaxmi.com' },
            { old: 'vignesh@bizzai.com', new: 'vignesh@vijayalaxmi.com' },
            { old: 'madhan@bizzai.com', new: 'madhan@vijayalaxmi.com' },
            { old: 'manikandan@bizzai.com', new: 'manikandan@vijayalaxmi.com' }
        ];

        for (const update of emailUpdates) {
            console.log(`\nProcessing: ${update.old} -> ${update.new}`);

            const user = await User.findOne({ email: update.old });

            if (user) {
                const result = await User.updateOne(
                    { email: update.old },
                    { $set: { email: update.new } }
                );

                if (result.modifiedCount > 0) {
                    console.log(`✅ Successfully updated email to: ${update.new}`);
                } else {
                    console.log(`⚠️ Email was not updated (maybe already updated or no changes needed)`);
                }
            } else {
                console.log(`❌ User with email ${update.old} not found in database!`);
            }
        }

        console.log('\n--- Final Verification ---');
        // Let's verify by listing users from that tenant
        const updatedUsersList = [
            'athimoolam@vijayalaxmi.com',
            'vignesh@vijayalaxmi.com',
            'madhan@vijayalaxmi.com',
            'manikandan@vijayalaxmi.com'
        ];

        for (const email of updatedUsersList) {
            const foundUser = await User.findOne({ email });
            if (foundUser) {
                console.log(`Found: ${foundUser.name || 'Unknown'} <${foundUser.email}>`);
            }
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err);
    }
}

updateEmails();
