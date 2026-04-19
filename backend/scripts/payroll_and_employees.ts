import { connectDB, disconnectDB } from "./utils/db.js";
import mongoose from "mongoose";
import Tenant from "../src/modules/core/models/Tenant.js";
import Employee from "../src/modules/hr/models/Employee.js";
import DailyAttendance from "../src/modules/hr/models/DailyAttendance.js";
import SalaryAdvance from "../src/modules/hr/models/SalaryAdvance.js";
import PayrollRun from "../src/modules/hr/models/PayrollRun.js";
import Payslip from "../src/modules/hr/models/Payslip.js";
import SalaryComponent from "../src/modules/hr/models/SalaryComponent.js";

async function processPayroll(tenantSlug: string) {
    await connectDB();
    try {
        const tenant = await Tenant.findOne({ slug: tenantSlug });
        if (!tenant) throw new Error(`Tenant ${tenantSlug} not found`);

        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const periodStart = new Date(year, month, 1);
        const periodEnd = new Date(year, month + 1, 0);
        const daysInMonth = periodEnd.getDate();
        const allowedPaidLeaves = Math.floor(daysInMonth / 7);

        console.log(`Processing Payroll for ${tenantSlug}...`);

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

            const proratedSalary = Math.round(((emp.baseSalary || 0) / daysInMonth) * payableDays);

            const pendingAdvances = await SalaryAdvance.find({
                tenantId: tenant._id,
                employeeId: emp._id,
                status: 'PENDING'
            });

            let totalAdvanceDeduction = 0;
            for (const adv of pendingAdvances) {
                totalAdvanceDeduction += adv.amount;
                adv.status = 'RECOVERED';
                adv.payrollRunId = payrollRun._id as mongoose.Types.ObjectId;
                await adv.save();
            }

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

        console.log('\n--- PAYROLL SUMMARY ---');
        console.table(payrollSummary);
        console.log(`Total Batch Amount: ₹${totalAmount.toLocaleString()}`);

    } catch (err: any) {
        console.error("Error processing payroll:", err.message);
    } finally {
        await disconnectDB();
    }
}

async function manageEmployees(tenantSlug: string, action: string) {
    await connectDB();
    try {
        const tenant = await Tenant.findOne({ slug: tenantSlug });
        if (!tenant) throw new Error(`Tenant ${tenantSlug} not found`);

        if (action === 'list') {
            const employees = await Employee.find({ tenantId: tenant._id });
            const summary = employees.map(e => ({
                Name: e.name,
                Mobile: e.mobile,
                Role: e.role,
                Salary: e.baseSalary,
                Active: e.isActive
            }));
            console.table(summary);
        }
    } catch (err: any) {
        console.error("Error managing employees:", err.message);
    } finally {
        await disconnectDB();
    }
}

async function addSalaryComponent(tenantSlug: string, name: string, value: number) {
    await connectDB();
    try {
        const tenant = await Tenant.findOne({ slug: tenantSlug });
        if (!tenant) throw new Error(`Tenant ${tenantSlug} not found`);

        const existing = await SalaryComponent.findOne({
            tenantId: tenant._id,
            name: name
        });

        if (existing) {
            console.log(`Component '${name}' already exists for this tenant.`);
        } else {
            const newComponent = await SalaryComponent.create({
                tenantId: tenant._id,
                name: name,
                type: 'EARNING',
                calculationType: 'FIXED',
                defaultValue: value,
                isActive: true,
                isTaxable: true
            });
            console.log(`Successfully created component: '${name}' (ID: ${newComponent._id})`);
        }
    } catch (err: any) {
        console.error("Error adding salary component:", err.message);
    } finally {
        await disconnectDB();
    }
}

async function recordAdvance(tenantSlug: string, mobile: string, amount: number, type: string = 'ADVANCE', notes: string = "") {
    await connectDB();
    try {
        const tenant = await Tenant.findOne({ slug: tenantSlug });
        if (!tenant) throw new Error(`Tenant ${tenantSlug} not found`);

        const employee = await Employee.findOne({ tenantId: tenant._id, mobile });
        if (!employee) throw new Error(`Employee with mobile ${mobile} not found`);

        const advance = await SalaryAdvance.create({
            tenantId: tenant._id,
            employeeId: employee._id,
            amount,
            type,
            notes,
            date: new Date()
        });

        console.log(`✅ Recorded ₹${amount} ${type} for ${employee.name}`);
        return advance;
    } catch (err: any) {
        console.error("Error recording advance:", err.message);
    } finally {
        await disconnectDB();
    }
}

// CLI Routing
const [command, slug, ...args] = process.argv.slice(2);

switch (command) {
    case 'payroll':
        processPayroll(slug || 'vijaya-laxmi');
        break;
    case 'employees':
        manageEmployees(slug || 'vijaya-laxmi', args[0] || 'list');
        break;
    case 'add-component':
        addSalaryComponent(slug || 'vijaya-laxmi', args[0] || 'Tea Allowance', parseInt(args[1]) || 15);
        break;
    case 'advance':
        recordAdvance(slug || 'vijaya-laxmi', args[0], parseInt(args[1]), args[2], args[3]);
        break;
    default:
        console.log('Usage: npx tsx scripts/payroll_and_employees.ts [payroll|employees|add-component|advance] [tenant-slug]');
}
