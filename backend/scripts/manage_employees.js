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
    joiningDate: { type: Date, default: null },
    dailyRate: { type: Number, default: 0 },
    wageType: { type: String, enum: ['DAILY', 'MONTHLY', 'HOURLY', 'COMMISSION', 'HYBRID'], default: 'DAILY' },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

EmployeeSchema.index({ tenantId: 1, mobile: 1 }, { unique: true });

const TenantSchema = new mongoose.Schema({
    name: String,
    slug: String
});

const Employee = mongoose.models.Employee || mongoose.model('Employee', EmployeeSchema);
const Tenant = mongoose.models.Tenant || mongoose.model('Tenant', TenantSchema);

/**
 * Reusable function to upsert (add/update) employee
 */
export const upsertEmployee = async (tenantSlug, employeeData) => {
    try {
        if (!process.env.MONGO_URI) throw new Error('MONGO_URI not found');
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGO_URI);
        }

        const tenant = await Tenant.findOne({ slug: tenantSlug });
        if (!tenant) throw new Error(`Tenant with slug "${tenantSlug}" not found`);

        const { mobile } = employeeData;
        const result = await Employee.findOneAndUpdate(
            { tenantId: tenant._id, mobile },
            { $set: { ...employeeData, tenantId: tenant._id } },
            { upsert: true, new: true }
        );

        console.log(`✅ ${result.wasNew ? 'Created' : 'Updated'} Employee: ${employeeData.name} (${mobile})`);
        return result;
    } catch (err) {
        console.error(`Error managing employee ${employeeData.name}:`, err.message);
        throw err;
    }
};

/**
 * Bulk add employees
 */
export const bulkAddEmployees = async (tenantSlug, employeesList) => {
    for (const emp of employeesList) {
        await upsertEmployee(tenantSlug, emp);
    }
};

// If run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const main = async () => {
        const tenantSlug = 'vijaya-laxmi';
        const employees = [];

        // Generate 22 employees
        for (let i = 1; i <= 22; i++) {
            // Random joining date between 1 and 5 years ago
            const yearsAgo = Math.floor(Math.random() * 5) + 1;
            const joiningDate = new Date();
            joiningDate.setFullYear(joiningDate.getFullYear() - yearsAgo);
            joiningDate.setMonth(Math.floor(Math.random() * 12));

            employees.push({
                name: `Employee ${i}`,
                role: i <= 5 ? 'Sales' : (i <= 10 ? 'Inventory' : 'Staff'),
                mobile: `99000000${i.toString().padStart(2, '0')}`,
                joiningDate: joiningDate,
                dailyRate: 500 + (i * 10),
                wageType: 'DAILY'
            });
        }

        try {
            console.log(`Updating 22 employees in ${tenantSlug} with joining dates...`);
            await bulkAddEmployees(tenantSlug, employees);

            console.log('\n--- CALCULATING EXPERIENCE ---');
            const Employee = mongoose.models.Employee;
            const tenant = await Tenant.findOne({ slug: tenantSlug });
            const allEmps = await Employee.find({ tenantId: tenant._id });

            const expTable = allEmps.map(e => {
                const now = new Date();
                const join = new Date(e.joiningDate);
                const diff = now.getTime() - join.getTime();
                const years = (diff / (1000 * 60 * 60 * 24 * 365.25)).toFixed(1);
                return {
                    Name: e.name,
                    'Joining Date': join.toISOString().split('T')[0],
                    'Exp (Years)': years
                };
            });
            console.table(expTable);

            console.log('--- DONE ---');
            process.exit(0);
        } catch (err) {
            process.exit(1);
        }
    };
    main();
}
