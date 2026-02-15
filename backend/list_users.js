
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

// Define Minimal Models to avoid importing whole backend if complicated
const userSchema = new mongoose.Schema({}, { strict: false, collection: 'users' });
const tenantSchema = new mongoose.Schema({}, { strict: false, collection: 'tenants' });

const User = mongoose.model('User', userSchema);
const Tenant = mongoose.model('Tenant', tenantSchema);

async function listAll() {
    try {
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) throw new Error('MONGO_URI is not defined');

        await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 10000, // 10 seconds timeout
            connectTimeoutMS: 10000
        });

        console.log('Connected to MongoDB');

        const tenants = await Tenant.find({}).lean();
        const users = await User.find({}).lean();

        console.log(`Total Tenants: ${tenants.length}`);
        console.log(`Total Users: ${users.length}`);

        const tenantsMap = {};
        tenants.forEach(t => {
            tenantsMap[t._id.toString()] = t.name || t.shopName || 'Unnamed Tenant';
        });

        const usersByTenant = {};
        users.forEach(u => {
            const tId = u.tenantId ? u.tenantId.toString() : 'No Tenant';
            if (!usersByTenant[tId]) usersByTenant[tId] = [];
            usersByTenant[tId].push({
                name: u.name,
                email: u.email,
                role: u.role
            });
        });

        console.log('\n--- Users by Tenant ---');
        for (const tId in usersByTenant) {
            const tenantName = tenantsMap[tId] || `Tenant (${tId})`;
            console.log(`\nTenant: ${tenantName}`);
            usersByTenant[tId].forEach(u => {
                console.log(`  - ${u.name} <${u.email}> (${u.role})`);
            });
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err);
    }
}

listAll();
