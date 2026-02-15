
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

const listComponents = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI not found in environment variables");
        }
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        // Try finding tenant by slug first
        let tenant = await Tenant.findOne({ slug: 'vijaya-laxmi' });
        if (!tenant) {
            console.log("Tenant not found by slug 'vijaya-laxmi', trying name 'Vijaya Laxmi'...");
            tenant = await Tenant.findOne({ name: "Vijaya Laxmi" });
        }

        if (!tenant) {
            console.error("Tenant 'Vijaya Laxmi' not found!");
            process.exit(1);
        }

        console.log(`Listing components for Tenant: ${tenant.name} (${tenant.slug}) - ID: ${tenant._id}`);

        const components = await SalaryComponent.find({ tenantId: tenant._id });

        if (components.length === 0) {
            console.log("No components found.");
        } else {
            console.table(components.map(c => ({
                id: c._id.toString(),
                name: c.name,
                type: c.type,
                active: c.isActive,
                taxable: c.isTaxable
            })));
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

listComponents();
