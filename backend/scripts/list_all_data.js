
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: 'frontend/.env' });

// Fallback if env not loaded
const MONGODB_URI = process.env.VITE_MONGO_URI || "mongodb://localhost:27017/bizzai";

// Models
const TenantSchema = new mongoose.Schema({}, { strict: false });
const UserSchema = new mongoose.Schema({}, { strict: false });

const Tenant = mongoose.model('Tenant', TenantSchema);
const User = mongoose.model('User', UserSchema);

async function listData() {
    console.log('Connecting to:', MONGODB_URI);
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected!');

        const tenants = await Tenant.find({}, { name: 1, _id: 1 });
        console.log('\n--- Tenants ---');
        if (tenants.length === 0) console.log('No tenants found.');
        tenants.forEach(t => console.log(`${t.name}: ${t._id}`));

        const users = await User.find({ email: /@bizzai.com/ }, { name: 1, email: 1, role: 1, tenantId: 1 });
        console.log('\n--- BizzAI Users ---');
        if (users.length === 0) console.log('No bizzai users found.');
        users.forEach(u => console.log(`${u.email}: tenantId=${u.tenantId}, role=${u.role}`));

        // Also check for 'users' collection generally
        const count = await User.countDocuments();
        console.log(`\nTotal Users in DB: ${count}`);

    } catch (error) {
        console.error('ERROR:', error);
    } finally {
        await mongoose.disconnect();
    }
}

listData();
