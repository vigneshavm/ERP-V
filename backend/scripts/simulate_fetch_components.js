
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
const SalaryComponentSchema = new mongoose.Schema({
    tenantId: mongoose.Schema.Types.ObjectId,
    name: String,
    type: String,
    calculationType: String,
    defaultValue: Number,
    isActive: Boolean,
    isTaxable: Boolean
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Tenant = mongoose.models.Tenant || mongoose.model('Tenant', TenantSchema);
const SalaryComponent = mongoose.models.SalaryComponent || mongoose.model('SalaryComponent', SalaryComponentSchema);

const simulateFetch = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI not found");
        }
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        // 1. Find the User
        const email = 'vignesh@bizzai.com';
        const user = await User.findOne({ email });
        if (!user) {
            console.error(`User ${email} not found!`);
            process.exit(1);
        }
        console.log(`User: ${user.name} (${user._id})`);
        console.log(`User TenantID: ${user.tenantId}`);

        // 2. Simulate Controller Logic
        const tenantId = user.tenantId;
        const components = await SalaryComponent.find({ tenantId, isActive: true });

        console.log(`\nFound ${components.length} Active Components for Tenant ${tenantId}:`);
        console.table(components.map(c => ({
            id: c._id.toString(),
            name: c.name,
            type: c.type
        })));

        // 3. Verify 'Tea Allowance' specifically
        const tea = components.find(c => c.name === 'Tea Allowance');
        if (tea) {
            console.log("✅ Tea Allowance is PRESENT and ACTIVE.");
        } else {
            console.error("❌ Tea Allowance is MISSING from the list.");
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

simulateFetch();
