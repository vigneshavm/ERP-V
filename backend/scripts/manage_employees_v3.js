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
    employmentHistory: [{
        startDate: { type: Date, required: true },
        endDate: { type: Date, default: null },
        reasonForLeaving: { type: String, default: "" }
    }],
    baseSalary: { type: Number, default: 0 },
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
 * Reusable function to calculate total experience in years
 */
export const calculateExperience = (employmentHistory) => {
    if (!employmentHistory || employmentHistory.length === 0) return 0;

    const now = new Date();
    let totalMs = 0;

    for (const stint of employmentHistory) {
        const start = new Date(stint.startDate);
        const end = stint.endDate ? new Date(stint.endDate) : now;
        totalMs += (end.getTime() - start.getTime());
    }

    return (totalMs / (1000 * 60 * 60 * 24 * 365.25)).toFixed(1);
};

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

        // Update 22 employees with salary values
        for (let i = 1; i <= 22; i++) {
            // Salary based on role
            let baseSalary = 15000 + (i * 1000);
            if (i === 1) baseSalary = 75000; // Manager
            else if (i <= 5) baseSalary = 45000; // Senior Sales

            employees.push({
                name: `Employee ${i}`,
                mobile: `99000000${i.toString().padStart(2, '0')}`,
                baseSalary: baseSalary,
                wageType: i <= 10 ? 'MONTHLY' : 'DAILY'
            });
        }

        try {
            console.log(`Updating 22 employees in ${tenantSlug} with salary data...`);
            await bulkAddEmployees(tenantSlug, employees);

            console.log('\n--- EMPLOYEE PAYROLL SUMMARY (VIJAYA LAXMI) ---');
            const tenant = await Tenant.findOne({ slug: tenantSlug });
            const allEmps = await Employee.find({ tenantId: tenant._id });

            const salaryTable = allEmps.map(e => {
                return {
                    Name: e.name,
                    Role: e.role,
                    'Wage Type': e.wageType,
                    'Base Salary': `₹${e.baseSalary.toLocaleString()}`,
                    'Daily Rate': `₹${e.dailyRate}`
                };
            });
            console.table(salaryTable);

            console.log('--- DONE ---');
            process.exit(0);
        } catch (err) {
            console.error(err);
            process.exit(1);
        }
    };
    main();
}
