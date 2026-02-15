
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

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

const Tenant = mongoose.models.Tenant || mongoose.model('Tenant', TenantSchema);
const SalaryComponent = mongoose.models.SalaryComponent || mongoose.model('SalaryComponent', SalaryComponentSchema);

const checkVijayaLaxmi = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI not found");
        }
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        // Target: Vijaya Laxmi
        const targetTenantId = '6990b6cfc5b06f43a8a0ee71';
        const tenant = await Tenant.findById(targetTenantId);

        if (!tenant) {
            console.error(`Tenant '${targetTenantId}' not found!`);
            process.exit(1);
        }

        console.log(`Checking components for: ${tenant.name} (${tenant._id})`);

        const components = await SalaryComponent.find({ tenantId: tenant._id });

        if (components.length === 0) {
            console.log("No components found.");
        } else {
            console.table(components.map(c => ({
                id: c._id.toString(),
                name: c.name,
                type: c.type,
                active: c.isActive,
                default: c.defaultValue
            })));
        }

        // Check specifically for Tea Allowance
        const tea = components.find(c => c.name === 'Tea Allowance');
        if (tea) {
            console.log(`\n✅ Tea Allowance found: ID ${tea._id} (Active: ${tea.isActive})`);
        } else {
            console.log(`\n❌ Tea Allowance NOT found for this tenant.`);
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

checkVijayaLaxmi();
