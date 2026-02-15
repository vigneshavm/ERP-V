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

        // Generate 22 employees with varied histories
        for (let i = 1; i <= 22; i++) {
            const hasHistory = i % 5 === 0; // Every 5th employee has multiple stints
            const history = [];

            if (hasHistory) {
                // Stint 1: 5 years ago to 3 years ago
                const start1 = new Date();
                start1.setFullYear(start1.getFullYear() - 5);
                const end1 = new Date();
                end1.setFullYear(end1.getFullYear() - 3);
                history.push({ startDate: start1, endDate: end1, reasonForLeaving: 'Other Opportunity' });

                // Stint 2 (Active): 1 year ago to now
                const start2 = new Date();
                start2.setFullYear(start2.getFullYear() - 1);
                history.push({ startDate: start2, endDate: null });
            } else {
                // Single active stint
                const yearsAgo = Math.floor(Math.random() * 5) + 1;
                const start = new Date();
                start.setFullYear(start.getFullYear() - yearsAgo);
                history.push({ startDate: start, endDate: null });
            }

            employees.push({
                name: `Employee ${i}`,
                role: i <= 5 ? 'Sales' : (i <= 10 ? 'Inventory' : 'Staff'),
                mobile: `99000000${i.toString().padStart(2, '0')}`,
                employmentHistory: history,
                dailyRate: 500 + (i * 10),
                wageType: 'DAILY'
            });
        }

        try {
            console.log(`Updating 22 employees in ${tenantSlug} with history support...`);
            await bulkAddEmployees(tenantSlug, employees);

            console.log('\n--- CALCULATING EXPERIENCE (WITH MULTIPLE STINTS) ---');
            const tenant = await Tenant.findOne({ slug: tenantSlug });
            const allEmps = await Employee.find({ tenantId: tenant._id });

            const expTable = allEmps.map(e => {
                const years = calculateExperience(e.employmentHistory);
                const stints = e.employmentHistory.length;
                return {
                    Name: e.name,
                    Stints: stints,
                    'Total Exp (Years)': years
                };
            });
            console.table(expTable);

            console.log('--- DONE ---');
            process.exit(0);
        } catch (err) {
            console.error(err);
            process.exit(1);
        }
    };
    main();
}
