import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

// Inline Schemas
const SalaryAdvanceSchema = new mongoose.Schema({
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    type: { type: String, enum: ['ADVANCE', 'PART_PAYMENT'], default: 'ADVANCE' },
    status: { type: String, enum: ['PENDING', 'RECOVERED', 'CANCELLED'], default: 'PENDING' },
    notes: String
}, { timestamps: true });

const EmployeeSchema = new mongoose.Schema({
    tenantId: mongoose.Schema.Types.ObjectId,
    name: String,
    mobile: String,
    baseSalary: Number
});

const TenantSchema = new mongoose.Schema({ slug: String });

const SalaryAdvance = mongoose.models.SalaryAdvance || mongoose.model('SalaryAdvance', SalaryAdvanceSchema);
const Employee = mongoose.models.Employee || mongoose.model('Employee', EmployeeSchema);
const Tenant = mongoose.models.Tenant || mongoose.model('Tenant', TenantSchema);

const main = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const tenantSlug = 'vijaya-laxmi';
        const tenant = await Tenant.findOne({ slug: tenantSlug });

        // Scenario: Employee 10 (or any) wants multiple payments
        const mobile = '9900000010';
        const employee = await Employee.findOne({ tenantId: tenant._id, mobile });
        console.log(`Setting up multi-payment scenario for ${employee.name} (Base Salary: ₹${employee.baseSalary})`);

        // 1. Clear existing pending for this employee for a clean demo
        await SalaryAdvance.deleteMany({ employeeId: employee._id, status: 'PENDING' });

        // 2. Record multiple advances
        const payments = [
            { amount: 5000, date: '2026-02-10', notes: 'First part payment (10th)' },
            { amount: 1000, date: '2026-02-15', notes: 'Second part payment (15th)' },
            { amount: 2000, date: '2026-02-20', notes: 'Third part payment (20th)' }
        ];

        for (const p of payments) {
            await SalaryAdvance.create({
                tenantId: tenant._id,
                employeeId: employee._id,
                amount: p.amount,
                date: new Date(p.date),
                type: 'PART_PAYMENT',
                status: 'PENDING',
                notes: p.notes
            });
            console.log(`✅ Recorded ₹${p.amount} on ${p.date}`);
        }

        // 3. Monitor the Ledger
        console.log(`\n--- ADVANCE LEDGER: ${employee.name} ---`);
        const ledger = await SalaryAdvance.find({ employeeId: employee._id }).sort({ date: 1 });

        let totalPending = 0;
        const tableData = ledger.map(l => {
            if (l.status === 'PENDING') totalPending += l.amount;
            return {
                Date: l.date.toISOString().split('T')[0],
                Amount: `₹${l.amount}`,
                Status: l.status,
                Notes: l.notes
            };
        });

        console.table(tableData);
        console.log(`\nTotal Accumulated Pending: ₹${totalPending.toLocaleString()}`);
        console.log(`Remaining Balance from Salary: ₹${(employee.baseSalary - totalPending).toLocaleString()}`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

main();
