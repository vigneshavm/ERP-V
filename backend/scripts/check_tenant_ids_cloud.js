
import mongoose from 'mongoose';

// Correct Cloud URI from backend/.env
const MONGODB_URI = "mongodb+srv://avmvignesh0207_db_user:XB5qPLz5l08d6FvL@cluster0.kxzqtht.mongodb.net/bizzai?retryWrites=true&w=majority";

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
        console.log('Connecting to Cloud MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected!');

        const tenant = await Tenant.findOne({ name: /Vijaya Laxmi/i });
        if (!tenant) {
            console.log('Tenant "Vijaya Laxmi" NOT FOUND');
        } else {
            console.log(`\nTenant Found: ${tenant.name}`);
            console.log(`Tenant ID: ${tenant._id}`);
        }

        const users = await User.find({
            email: { $in: ['vignesh@bizzai.com', 'madhan@bizzai.com', 'manikandan@bizzai.com'] }
        });

        console.log(`\nFound ${users.length} users`);
        users.forEach(u => {
            console.log(`\nUser: ${u.email}`);
            console.log(`Role: ${u.role}`);
            console.log(`Stored TenantId: ${u.tenantId}`);

            if (tenant) {
                const match = u.tenantId === tenant._id.toString();
                if (!match) {
                    console.log(`❌ MISMATCH DETECTED! Expected ${tenant._id}, found ${u.tenantId}`);
                } else {
                    console.log('✅ MATCH OK');
                }
            }
        });

    } catch (error) {
        console.error('ERROR:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDone');
    }
}

checkIds();
