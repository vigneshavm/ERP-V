import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const TenantSchema = new mongoose.Schema({ name: String }, { strict: false });
const UserSchema = new mongoose.Schema({
    email: String,
    tenantId: String,
    name: String,
    systemRole: String,
    role: String
}, { strict: false });

const Tenant = mongoose.model('Tenant', TenantSchema);
const User = mongoose.model('User', UserSchema);

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const tenant = await Tenant.findOne({ name: { $regex: /Vijaya Laxmi/i } });
        if (!tenant) throw new Error("Tenant not found");

        info(`Tenant: ${tenant.name}`);
        info(`Tenant ID: ${tenant._id} (Type: ${typeof tenant._id})`);

        // Try finding specific user
        const specificUser = await User.findOne({ email: 'vignesh@bizzai.com' });
        if (specificUser) {
            info(`Found 'vignesh@bizzai.com':`);
            info(`- TenantID: ${specificUser.tenantId} (Type: ${typeof specificUser.tenantId})`);
            info(`- Role: ${specificUser.role}`);

            // Compare
            info(`Match? ${specificUser.tenantId == tenant._id}`);
        } else {
            info("Could not find 'vignesh@bizzai.com'");
        }

        info("Checking specific emails:");
        const emails = ['vignesh@bizzai.com', 'madhan@bizzai.com', 'manikandan@bizzai.com'];

        for (const email of emails) {
            const u = await User.findOne({ email });
            if (u) {
                info(`- ${u.email}: Role=${u.systemRole}/${u.role}, TenantID=${u.tenantId}`);
                info(`  Match Tenant? ${u.tenantId == tenant._id}`);
            } else {
                info(`- ${email}: NOT FOUND`);
            }
        }

        info(`Querying users with tenantId: ${tenant._id.toString()}`);
        const users = await User.find({ tenantId: tenant._id.toString() });
        info(`\nUsers found: ${users.length}`);

        users.forEach(u => {
            info(`- Name: ${u.name}`);
            info(`  Email: ${u.email}`);
            info(`  Role: ${u.systemRole} / ${u.role}`);
            info('---');
        });

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

run();
