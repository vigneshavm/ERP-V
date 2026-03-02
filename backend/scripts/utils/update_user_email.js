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

async function updateUserEmail() {
    try {
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) throw new Error('MONGO_URI is not defined');

        await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 10000,
            connectTimeoutMS: 10000
        });

        console.log('Connected to MongoDB');

        const oldEmail = 'vijayalaxmi@bizzai.com';
        const newEmail = 'athimoolam@vijayalaxmi.com';

        // Check if user exists
        const user = await User.findOne({ email: oldEmail });

        if (user) {
            console.log(`Found user: ${user.name || 'Unknown'} <${user.email}>`);

            // Update the email
            const result = await User.updateOne(
                { email: oldEmail },
                { $set: { email: newEmail } }
            );

            if (result.modifiedCount > 0) {
                console.log(`✅ Successfully updated email to: ${newEmail}`);
            } else {
                console.log(`⚠️ Email was not updated (maybe already updated or no changes needed)`);
            }
        } else {
            console.log(`❌ User with email ${oldEmail} not found!`);
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err);
    }
}

updateUserEmail();
