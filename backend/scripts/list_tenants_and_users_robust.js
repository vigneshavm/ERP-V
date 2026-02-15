import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const TenantSchema = new mongoose.Schema({
    name: String,
    slug: String,
    status: String
});

const UserSchema = new mongoose.Schema({
    fullName: String,
    email: String,
    mobile: String,
    role: { type: mongoose.Schema.Types.Mixed },
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant' }
});

const Tenant = mongoose.models.Tenant || mongoose.model('Tenant', TenantSchema);
const User = mongoose.models.User || mongoose.model('User', UserSchema);

const run = async () => {
    try {
        if (!process.env.MONGO_URI) {
            console.error('MONGO_URI not found in .env');
            process.exit(1);
        }
        await mongoose.connect(process.env.MONGO_URI);

        const tenants = await Tenant.find({}, 'name slug status').lean();
        const users = await User.find({}, 'fullName email mobile tenantId role').populate('tenantId', 'name').lean();

        console.log('--- ALL TENANTS ---');
        console.table(tenants);

        console.log('\n--- ALL USERS ---');
        const formattedUsers = users.map(u => ({
            Name: u.fullName,
            Email: u.email,
            Mobile: u.mobile,
            Tenant: u.tenantId ? u.tenantId.name : 'N/A',
            Role: typeof u.role === 'object' ? u.role.name : u.role
        }));
        console.table(formattedUsers);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

run();
