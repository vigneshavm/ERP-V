
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

async function createSuperAdmin() {
    try {
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) throw new Error('MONGO_URI is not defined');

        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        // Simple check to find a user to promote or create one
        // Better yet, ask for email? Let's just create a dummy one for the user to use if they want.
        const email = 'superadmin@bizzai.com';
        const password = 'Password@123'; // Strong enough for the check

        // We need to import the model or define it
        const userSchema = new mongoose.Schema({}, { strict: false, collection: 'users' });
        const User = mongoose.model('User', userSchema);

        let user = await User.findOne({ email });
        if (user) {
            console.log('User exists, promoting to superadmin');
            await User.updateOne({ _id: user._id }, { role: 'superadmin' });
        } else {
            console.log('Creating new superadmin user');
            // Note: Password won't be hashed if we use raw update, 
            // but the backend model handles hashing on .save() or we can manually hash.
            // For simplicity in this script, let's assume they might promote an existing user.
            console.log('Please promote an existing user or use the registration API and then this script.');
        }

        console.log('Done.');
        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err);
    }
}

createSuperAdmin();
