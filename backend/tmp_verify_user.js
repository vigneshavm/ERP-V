
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: 'c:/Users/avmvi/Project/ERP/backend/.env' });

const MONGO_URI = process.env.MONGO_URI;

const userSchema = new mongoose.Schema({
    email: String,
    name: String,
    tenantId: mongoose.Schema.Types.ObjectId,
}, { strict: false });

const User = mongoose.model('User', userSchema);

async function verify() {
    try {
        console.log('Connecting to MongoDB...');
        if (!MONGO_URI) {
            console.error('MONGO_URI not found in .env');
            process.exit(1);
        }
        await mongoose.connect(MONGO_URI);
        console.log('Connected.');

        const user = await User.findOne({ email: 'vignesh@vijayalaxmi.com' });
        if (user) {
            console.log('USER_FOUND:', JSON.stringify({
                _id: user._id,
                email: user.email,
                name: user.name,
                tenantId: user.tenantId,
                status: user.status
            }, null, 2));
        } else {
            console.log('USER_NOT_FOUND');
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error('ERROR:', error);
        process.exit(1);
    }
}

verify();
