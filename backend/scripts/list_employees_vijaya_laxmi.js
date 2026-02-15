import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const EmployeeSchema = new mongoose.Schema({
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant' },
    name: String,
    role: String,
    mobile: String
});

const TenantSchema = new mongoose.Schema({
    slug: String
});

const Employee = mongoose.models.Employee || mongoose.model('Employee', EmployeeSchema);
const Tenant = mongoose.models.Tenant || mongoose.model('Tenant', TenantSchema);

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const tenant = await Tenant.findOne({ slug: 'vijaya-laxmi' });
        if (!tenant) throw new Error('Tenant not found');

        const employees = await Employee.find({ tenantId: tenant._id }, 'name role mobile').sort({ createdAt: 1 }).lean();

        console.log('--- VIJAYA LAXMI EMPLOYEES ---');
        console.table(employees.map(e => ({
            Name: e.name,
            Role: e.role,
            Mobile: e.mobile
        })));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

run();
