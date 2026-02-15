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

        console.log(`Tenant: ${tenant.name}`);
        console.log(`Tenant ID: ${tenant._id} (Type: ${typeof tenant._id})`);

        // Try finding specific user
        const specificUser = await User.findOne({ email: 'vignesh@bizzai.com' });
        if (specificUser) {
            console.log(`Found 'vignesh@bizzai.com':`);
            console.log(`- TenantID: ${specificUser.tenantId} (Type: ${typeof specificUser.tenantId})`);
            console.log(`- Role: ${specificUser.role}`);

            // Compare
            console.log(`Match? ${specificUser.tenantId == tenant._id}`);
        } else {
            console.log("Could not find 'vignesh@bizzai.com'");
        }

        console.log("Checking specific emails:");
        const emails = ['vignesh@bizzai.com', 'madhan@bizzai.com', 'manikandan@bizzai.com'];

        for (const email of emails) {
            const u = await User.findOne({ email });
            if (u) {
                console.log(`- ${u.email}: Role=${u.systemRole}/${u.role}, TenantID=${u.tenantId}`);
                console.log(`  Match Tenant? ${u.tenantId == tenant._id}`);
            } else {
                console.log(`- ${email}: NOT FOUND`);
            }
        }

        console.log(`Querying users with tenantId: ${tenant._id.toString()}`);
        const users = await User.find({ tenantId: tenant._id.toString() });
        console.log(`\nUsers found: ${users.length}`);

        users.forEach(u => {
            console.log(`- Name: ${u.name}`);
            console.log(`  Email: ${u.email}`);
            console.log(`  Role: ${u.systemRole} / ${u.role}`);
            console.log('---');
        });

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

run();
