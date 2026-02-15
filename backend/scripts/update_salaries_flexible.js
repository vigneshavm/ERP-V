import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const EmployeeSchema = new mongoose.Schema({
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
    name: { type: String, required: true },
    role: { type: String, required: true },
    mobile: { type: String, required: true },
    baseSalary: { type: Number, default: 0 },
    dailyRate: { type: Number, default: 0 },
    wageType: { type: String, enum: ['DAILY', 'MONTHLY', 'HOURLY', 'COMMISSION', 'HYBRID'], default: 'DAILY' },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

const TenantSchema = new mongoose.Schema({
    slug: String
});

const Employee = mongoose.models.Employee || mongoose.model('Employee', EmployeeSchema);
const Tenant = mongoose.models.Tenant || mongoose.model('Tenant', TenantSchema);

/**
 * Update salary for all employees in a tenant irrespective of role
 */
export const updateAllSalaries = async (tenantSlug, newSalary, wageType = 'MONTHLY') => {
    try {
        if (!process.env.MONGO_URI) throw new Error('MONGO_URI not found');
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGO_URI);
        }

        const tenant = await Tenant.findOne({ slug: tenantSlug });
        if (!tenant) throw new Error(`Tenant ${tenantSlug} not found`);

        const result = await Employee.updateMany(
            { tenantId: tenant._id },
            { $set: { baseSalary: newSalary, wageType: wageType } }
        );

        console.log(`✅ Updated ${result.modifiedCount} employees with a flat salary of ₹${newSalary}`);
        return result;
    } catch (err) {
        console.error('Error updating salaries:', err.message);
        throw err;
    }
};

/**
 * Update specific employee salary by mobile
 */
export const updateEmployeeSalary = async (tenantSlug, mobile, salary) => {
    try {
        if (mongoose.connection.readyState === 0) await mongoose.connect(process.env.MONGO_URI);
        const tenant = await Tenant.findOne({ slug: tenantSlug });
        const result = await Employee.updateOne(
            { tenantId: tenant._id, mobile },
            { $set: { baseSalary: salary } }
        );
        console.log(`✅ Updated salary for ${mobile} to ₹${salary}`);
        return result;
    } catch (err) {
        console.error(err.message);
        throw err;
    }
};

// If run directly - Example: Update all to a flat 30000
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const main = async () => {
        const tenantSlug = 'vijaya-laxmi';
        const flatSalary = 30000;

        try {
            console.log(`Setting all employees in ${tenantSlug} to ₹${flatSalary} salary...`);
            await updateAllSalaries(tenantSlug, flatSalary);

            console.log('\n--- VERIFICATION ---');
            const tenant = await Tenant.findOne({ slug: tenantSlug });
            const allEmps = await Employee.find({ tenantId: tenant._id }, 'name role baseSalary mobile').lean();
            console.table(allEmps.map(e => ({
                Name: e.name,
                Role: e.role,
                Salary: `₹${e.baseSalary.toLocaleString()}`,
                Mobile: e.mobile
            })));

            process.exit(0);
        } catch (err) {
            process.exit(1);
        }
    };
    main();
}
