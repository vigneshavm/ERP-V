import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

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
    mobile: String
});

const TenantSchema = new mongoose.Schema({ slug: String });

const SalaryAdvance = mongoose.models.SalaryAdvance || mongoose.model('SalaryAdvance', SalaryAdvanceSchema);
const Employee = mongoose.models.Employee || mongoose.model('Employee', EmployeeSchema);
const Tenant = mongoose.models.Tenant || mongoose.model('Tenant', TenantSchema);

/**
 * Record a salary advance for an employee
 */
export const recordAdvance = async (tenantSlug, mobile, amount, type = 'ADVANCE', notes = "") => {
    try {
        if (!process.env.MONGO_URI) throw new Error('MONGO_URI not found');
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGO_URI);
        }

        const tenant = await Tenant.findOne({ slug: tenantSlug });
        if (!tenant) throw new Error(`Tenant ${tenantSlug} not found`);

        const employee = await Employee.findOne({ tenantId: tenant._id, mobile });
        if (!employee) throw new Error(`Employee ${mobile} not found`);

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
    } catch (err) {
        console.error(`Error recording advance:`, err.message);
        throw err;
    }
};

// If run directly - Record some sample advances
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const main = async () => {
        const tenantSlug = 'vijaya-laxmi';
        try {
            // Employee 1 takes 5000 advance
            await recordAdvance(tenantSlug, '9900000001', 5000, 'ADVANCE', 'Emergency requirement');

            // Employee 5 takes 2000 part payment
            await recordAdvance(tenantSlug, '9900000005', 2000, 'PART_PAYMENT', 'Regular part pay');

            console.log('\n--- ALL PENDING ADVANCES ---');
            const tenant = await Tenant.findOne({ slug: tenantSlug });
            const advances = await SalaryAdvance.find({ tenantId: tenant._id, status: 'PENDING' }).populate('employeeId', 'name mobile');

            console.table(advances.map(a => ({
                Employee: a.employeeId?.name || 'Unknown',
                Mobile: a.employeeId?.mobile || 'N/A',
                Amount: `₹${a.amount}`,
                Type: a.type,
                Date: a.date.toISOString().split('T')[0]
            })));

            process.exit(0);
        } catch (err) {
            process.exit(1);
        }
    };
    main();
}
