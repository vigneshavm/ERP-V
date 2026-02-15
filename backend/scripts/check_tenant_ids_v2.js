
import mongoose from 'mongoose';

const MONGODB_URI = "mongodb://localhost:27017/bizzai";

// Models
const TenantSchema = new mongoose.Schema({
    name: String,
    _id: mongoose.Schema.Types.ObjectId
}, { strict: false });

const UserSchema = new mongoose.Schema({
    email: String,
    name: String,
    tenantId: String,
    role: String
}, { strict: false });

const Tenant = mongoose.model('Tenant', TenantSchema);
const User = mongoose.model('User', UserSchema);

async function checkIds() {
    console.log('Starting script...');
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
        console.log('Connected!');

        const tenant = await Tenant.findOne({ name: /Vijaya Laxmi/i });
        if (!tenant) {
            console.log('Tenant NOT FOUND');
        } else {
            console.log(`Tenant: ${tenant.name}, ID: ${tenant._id}`);
        }

        const users = await User.find({
            email: { $in: ['vignesh@bizzai.com', 'madhan@bizzai.com', 'manikandan@bizzai.com'] }
        });

        console.log(`Found ${users.length} users`);
        users.forEach(u => {
            console.log(`User: ${u.email}, Role: ${u.role}, TenantId: ${u.tenantId}`);
            if (tenant && u.tenantId !== tenant._id.toString()) {
                console.log(`MISMATCH: User TenantId ${u.tenantId} != Tenant ID ${tenant._id}`);
            } else {
                console.log('MATCH OK');
            }
        });

    } catch (error) {
        console.error('ERROR:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Done');
    }
}

checkIds();
