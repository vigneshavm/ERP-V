
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    tenantId: mongoose.Schema.Types.ObjectId,
    role: String
});
const TenantSchema = new mongoose.Schema({ slug: String, name: String });

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Tenant = mongoose.models.Tenant || mongoose.model('Tenant', TenantSchema);

const listAllUsers = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI not found");
        }
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        const users = await User.find({});
        const tenants = await Tenant.find({});
        const tenantMap = tenants.reduce((acc, t) => {
            acc[t._id.toString()] = t;
            return acc;
        }, {});

        console.log(`\nFound ${users.length} Users:\n`);

        const tableData = users.map(u => {
            const t = u.tenantId ? tenantMap[u.tenantId.toString()] : null;
            return {
                Name: u.name,
                Email: u.email,
                'Tenant Name': t ? t.name : 'Unknown/None',
                'Tenant ID': u.tenantId ? u.tenantId.toString() : 'N/A'
            };
        });

        console.table(tableData);

        console.log("\nAvailable Tenants:");
        console.table(tenants.map(t => ({ Name: t.name, ID: t._id.toString(), Slug: t.slug })));

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

listAllUsers();
