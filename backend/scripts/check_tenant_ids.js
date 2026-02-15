
import mongoose from 'mongoose';
import path from 'path';

// Models
const TenantSchema = new mongoose.Schema({
    name: String,
    _id: mongoose.Schema.Types.ObjectId
}, { strict: false });

const UserSchema = new mongoose.Schema({
    email: String,
    name: String,
    tenantId: String, // Stored as string usually in this system based on past files
    role: String
}, { strict: false });

const Tenant = mongoose.model('Tenant', TenantSchema);
const User = mongoose.model('User', UserSchema);

async function checkIds() {
    try {
        // Connect to DB
        const MONGODB_URI = "mongodb://localhost:27017/bizzai";
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // 1. Find Vijaya Laxmi Tenant
        const tenant = await Tenant.findOne({ name: /Vijaya Laxmi/i });
        if (!tenant) {
            console.log('ERROR: Tenant "Vijaya Laxmi" not found!');
        } else {
            console.log(`\nTenant Found:`);
            console.log(`Name: ${tenant.name}`);
            console.log(`ID: ${tenant._id.toString()}`);
        }

        // 2. Find Users for this tenant
        const users = await User.find({
            email: { $in: ['vignesh@bizzai.com', 'madhan@bizzai.com', 'manikandan@bizzai.com'] }
        });

        console.log(`\nUsers Found: ${users.length}`);
        users.forEach(u => {
            console.log(`\nUser: ${u.name} (${u.email})`);
            console.log(`Role: ${u.role}`);
            console.log(`User.tenantId: ${u.tenantId}`);

            if (tenant) {
                const match = u.tenantId.toString() === tenant._id.toString();
                console.log(`Match with Tenant ID? ${match ? 'YES' : 'NO'}`);
                if (!match) {
                    console.log(`MISMATCH DETECTED! User has ${u.tenantId} but Tenant is ${tenant._id}`);
                }
            }
        });

        // 3. List ALL tenants to see if there's confusion
        const allTenants = await Tenant.find({}, { name: 1, _id: 1 });
        console.log('\n--- All Tenants in DB ---');
        allTenants.forEach(t => {
            console.log(`${t.name}: ${t._id}`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected');
    }
}

checkIds();
