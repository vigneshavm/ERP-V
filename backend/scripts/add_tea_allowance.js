import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const TenantSchema = new mongoose.Schema({ slug: String });
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

        const tenantSlug = 'vijaya-laxmi';
        const tenant = await Tenant.findOne({ slug: tenantSlug });

        if (!tenant) {
            console.error(`Tenant '${tenantSlug}' not found!`);
            process.exit(1);
        }

        console.log(`Found tenant: ${tenantSlug} (${tenant._id})`);

        const componentName = "Tea Allowance";

        // Check if exists
        const existing = await SalaryComponent.findOne({
            tenantId: tenant._id,
            name: componentName
        });

        if (existing) {
            console.log(`Component '${componentName}' already exists.`);
        } else {
            const newComponent = await SalaryComponent.create({
                tenantId: tenant._id,
                name: componentName,
                type: 'EARNING',
                calculationType: 'FIXED', // It's a daily fixed rate, but structurally 'FIXED' fits best as it's not % of Basic
                defaultValue: 15,
                isActive: true,
                isTaxable: true // Usually allowances are taxable unless specific exemption
            });
            console.log(`Successfully created component: '${componentName}'`);
        }

        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
};

main();
