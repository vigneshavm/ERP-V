import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

// Inline Schemas
const EmployeeSchema = new mongoose.Schema({
    tenantId: mongoose.Schema.Types.ObjectId,
    name: String,
    mobile: String,
    baseSalary: { type: Number, default: 0 }
});

const DailyAttendanceSchema = new mongoose.Schema({
    tenantId: mongoose.Schema.Types.ObjectId,
    employeeId: mongoose.Schema.Types.ObjectId,
    date: Date,
    status: String
});

const TenantSchema = new mongoose.Schema({ slug: String });

const Employee = mongoose.models.Employee || mongoose.model('Employee', EmployeeSchema);
const DailyAttendance = mongoose.models.DailyAttendance || mongoose.model('DailyAttendance', DailyAttendanceSchema);
const Tenant = mongoose.models.Tenant || mongoose.model('Tenant', TenantSchema);

const main = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const tenantSlug = 'vijaya-laxmi';
        const tenant = await Tenant.findOne({ slug: tenantSlug });
        if (!tenant) throw new Error(`Tenant ${tenantSlug} not found`);

        const TEA_ALLOWANCE_PER_DAY = 15;

        // Period: Last 7 days (Weekly Pay)
        const now = new Date();
        const periodEnd = new Date(now);
        periodEnd.setHours(23, 59, 59, 999);
        const periodStart = new Date(now);
        periodStart.setDate(periodStart.getDate() - 6);
        periodStart.setHours(0, 0, 0, 0);

        console.log(`Processing Weekly Pay for ${tenantSlug}`);
        console.log(`Period: ${periodStart.toISOString().split('T')[0]} to ${periodEnd.toISOString().split('T')[0]}`);

        const employees = await Employee.find({ tenantId: tenant._id });
        const weeklyRecords = [];

        for (const emp of employees) {
            const logs = await DailyAttendance.find({
                tenantId: tenant._id,
                employeeId: emp._id,
                date: { $gte: periodStart, $lte: periodEnd }
            });

            let presentDays = 0;
            logs.forEach(log => {
                if (log.status === 'PRESENT') presentDays += 1;
                else if (log.status === 'HALF_DAY') presentDays += 0.5;
            });

            // Weekly Base Pay calculation (Monthly Salary / 4 for illustration)
            const weeklyBasePay = Math.round(emp.baseSalary / 4);

            // Tea Allowance
            // User requested: "based on attendance" - typically ₹15 for every single day present/half-day
            // We'll give 15 full for half day too as it's a "day tea allowance"
            const totalTeaAllowance = Math.ceil(presentDays) * TEA_ALLOWANCE_PER_DAY;

            const totalWeeklyPay = weeklyBasePay + totalTeaAllowance;

            weeklyRecords.push({
                Name: emp.name,
                'Present Days': presentDays,
                'Weekly Salary': `₹${weeklyBasePay.toLocaleString()}`,
                'Tea Allowance': `₹${totalTeaAllowance}`,
                'Total Payout': `₹${totalWeeklyPay.toLocaleString()}`
            });
        }

        console.log('\n--- WEEKLY PAYROLL SUMMARY (WITH TEA ALLOWANCE) ---');
        console.table(weeklyRecords);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

main();
