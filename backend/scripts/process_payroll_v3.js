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

const SalaryAdvanceSchema = new mongoose.Schema({
    tenantId: mongoose.Schema.Types.ObjectId,
    employeeId: mongoose.Schema.Types.ObjectId,
    amount: Number,
    status: { type: String, enum: ['PENDING', 'RECOVERED', 'CANCELLED'], default: 'PENDING' },
    payrollRunId: mongoose.Schema.Types.ObjectId
});

const PayrollRunSchema = new mongoose.Schema({
    tenantId: mongoose.Schema.Types.ObjectId,
    periodStart: Date,
    periodEnd: Date,
    status: String,
    totalAmount: Number,
    totalEmployees: Number
}, { timestamps: true });

const PayslipSchema = new mongoose.Schema({
    tenantId: mongoose.Schema.Types.ObjectId,
    payrollRunId: mongoose.Schema.Types.ObjectId,
    employeeId: mongoose.Schema.Types.ObjectId,
    basicSalary: Number,
    netPay: Number,
    daysPresent: Number,
    daysTotal: Number,
    leavesTaken: Number,
    allowedPaidLeaves: Number,
    advanceDeduction: { type: Number, default: 0 },
    paymentStatus: String
}, { timestamps: true });

const TenantSchema = new mongoose.Schema({ slug: String });

const Employee = mongoose.models.Employee || mongoose.model('Employee', EmployeeSchema);
const DailyAttendance = mongoose.models.DailyAttendance || mongoose.model('DailyAttendance', DailyAttendanceSchema);
const SalaryAdvance = mongoose.models.SalaryAdvance || mongoose.model('SalaryAdvance', SalaryAdvanceSchema);
const PayrollRun = mongoose.models.PayrollRun || mongoose.model('PayrollRun', PayrollRunSchema);
const Payslip = mongoose.models.Payslip || mongoose.model('Payslip', PayslipSchema);
const Tenant = mongoose.models.Tenant || mongoose.model('Tenant', TenantSchema);

const main = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const tenantSlug = 'vijaya-laxmi';
        const tenant = await Tenant.findOne({ slug: tenantSlug });
        if (!tenant) throw new Error(`Tenant ${tenantSlug} not found`);

        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const periodStart = new Date(year, month, 1);
        const periodEnd = new Date(year, month + 1, 0);
        const daysInMonth = periodEnd.getDate();
        const allowedPaidLeaves = Math.floor(daysInMonth / 7);

        console.log(`Processing Payroll (v3) for ${tenantSlug} with Advance Recovery...`);

        const employees = await Employee.find({ tenantId: tenant._id });
        let totalAmount = 0;

        const payrollRun = await PayrollRun.create({
            tenantId: tenant._id,
            periodStart,
            periodEnd,
            status: 'DRAFT',
            totalAmount: 0,
            totalEmployees: employees.length
        });

        const payrollSummary = [];

        for (const emp of employees) {
            // 1. Attendance Calculation
            const logs = await DailyAttendance.find({
                tenantId: tenant._id,
                employeeId: emp._id,
                date: { $gte: periodStart, $lte: periodEnd }
            });

            let absentDays = 0;
            let halfDays = 0;
            logs.forEach(log => {
                if (log.status === 'ABSENT' || log.status === 'ON_LEAVE') absentDays += 1;
                else if (log.status === 'HALF_DAY') halfDays += 0.5;
            });

            const totalLeavesTaken = absentDays + halfDays;
            const deductibleLeaves = Math.max(0, totalLeavesTaken - allowedPaidLeaves);
            const payableDays = daysInMonth - deductibleLeaves;

            // 2. Prorated Salary
            const proratedSalary = Math.round((emp.baseSalary / daysInMonth) * payableDays);

            // 3. Advance Recovery
            const pendingAdvances = await SalaryAdvance.find({
                tenantId: tenant._id,
                employeeId: emp._id,
                status: 'PENDING'
            });

            let totalAdvanceDeduction = 0;
            for (const adv of pendingAdvances) {
                totalAdvanceDeduction += adv.amount;
                adv.status = 'RECOVERED';
                adv.payrollRunId = payrollRun._id;
                await adv.save();
            }

            // 4. Final Net Pay
            const netPay = proratedSalary - totalAdvanceDeduction;

            await Payslip.create({
                tenantId: tenant._id,
                payrollRunId: payrollRun._id,
                employeeId: emp._id,
                basicSalary: emp.baseSalary,
                netPay,
                daysPresent: payableDays,
                daysTotal: daysInMonth,
                allowedPaidLeaves,
                actualLeavesTaken: totalLeavesTaken,
                advanceDeduction: totalAdvanceDeduction,
                paymentStatus: 'PENDING'
            });

            totalAmount += netPay;

            payrollSummary.push({
                Name: emp.name,
                'Prorated Salary': `₹${proratedSalary.toLocaleString()}`,
                'Advances Recovered': `₹${totalAdvanceDeduction.toLocaleString()}`,
                'Final Net Pay': `₹${netPay.toLocaleString()}`
            });
        }

        payrollRun.totalAmount = totalAmount;
        await payrollRun.save();

        console.log('\n--- PAYROLL WITH ADVANCE RECOVERY SUMMARY ---');
        console.table(payrollSummary);
        console.log(`Total Batch Amount: ₹${totalAmount.toLocaleString()}`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

main();
