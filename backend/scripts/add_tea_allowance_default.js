
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

const main = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI not found in environment variables");
        }
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        // Target: Default Organization
        const targetTenantId = '69761b0971da0390f468f318';
        const tenant = await Tenant.findById(targetTenantId);

        if (!tenant) {
            console.error(`Tenant '${targetTenantId}' not found!`);
            process.exit(1);
        }

        console.log(`Found tenant: ${tenant.name} (${tenant._id})`);

        const componentName = "Tea Allowance";

        // Check if exists
        const existing = await SalaryComponent.findOne({
            tenantId: tenant._id,
            name: componentName
        });

        if (existing) {
            console.log(`Component '${componentName}' already exists for this tenant.`);
        } else {
            const newComponent = await SalaryComponent.create({
                tenantId: tenant._id,
                name: componentName,
                type: 'EARNING',
                calculationType: 'FIXED',
                defaultValue: 15,
                isActive: true,
                isTaxable: true
            });
            console.log(`Successfully created component: '${componentName}' (ID: ${newComponent._id})`);
        }

        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
};

main();
