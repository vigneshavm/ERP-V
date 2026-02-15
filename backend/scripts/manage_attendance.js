import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const DailyAttendanceSchema = new mongoose.Schema({
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    date: { type: Date, required: true },
    status: { type: String, enum: ['PRESENT', 'ABSENT', 'HALF_DAY', 'ON_LEAVE'], default: 'PRESENT' },
    checkInTime: Date,
    checkOutTime: Date,
    notes: String
}, { timestamps: true });

DailyAttendanceSchema.index({ tenantId: 1, employeeId: 1, date: 1 }, { unique: true });

const EmployeeSchema = new mongoose.Schema({
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant' },
    name: String,
    mobile: String
});

const TenantSchema = new mongoose.Schema({
    slug: String
});

const DailyAttendance = mongoose.models.DailyAttendance || mongoose.model('DailyAttendance', DailyAttendanceSchema);
const Employee = mongoose.models.Employee || mongoose.model('Employee', EmployeeSchema);
const Tenant = mongoose.models.Tenant || mongoose.model('Tenant', TenantSchema);

/**
 * Mark daily attendance for an employee
 */
export const markAttendance = async (tenantSlug, mobile, date, status, notes = "") => {
    try {
        if (!process.env.MONGO_URI) throw new Error('MONGO_URI not found');
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGO_URI);
        }

        const tenant = await Tenant.findOne({ slug: tenantSlug });
        if (!tenant) throw new Error(`Tenant ${tenantSlug} not found`);

        const employee = await Employee.findOne({ tenantId: tenant._id, mobile });
        if (!employee) throw new Error(`Employee with mobile ${mobile} not found for tenant ${tenantSlug}`);

        const attendanceDate = new Date(date);
        attendanceDate.setHours(0, 0, 0, 0);

        const result = await DailyAttendance.findOneAndUpdate(
            { tenantId: tenant._id, employeeId: employee._id, date: attendanceDate },
            { $set: { status, notes } },
            { upsert: true, new: true }
        );

        console.log(`✅ Marked ${status} for ${employee.name} on ${attendanceDate.toISOString().split('T')[0]}`);
        return result;
    } catch (err) {
        console.error(`Error marking attendance for ${mobile}:`, err.message);
        throw err;
    }
};

/**
 * Bulk mark attendance
 */
export const bulkMarkAttendance = async (tenantSlug, date, attendanceList) => {
    for (const item of attendanceList) {
        await markAttendance(tenantSlug, item.mobile, date, item.status, item.notes);
    }
};

// If run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const main = async () => {
        const tenantSlug = 'vijaya-laxmi';
        const today = new Date();
        const attendanceList = [];

        // Generate attendance for 22 employees for today
        for (let i = 1; i <= 22; i++) {
            const mobile = `99000000${i.toString().padStart(2, '0')}`;
            // Randomly assign status: 80% Present, 10% Absent, 5% Half Day, 5% On Leave
            const rand = Math.random();
            let status = 'PRESENT';
            if (rand < 0.1) status = 'ABSENT';
            else if (rand < 0.15) status = 'HALF_DAY';
            else if (rand < 0.2) status = 'ON_LEAVE';

            attendanceList.push({ mobile, status, notes: status !== 'PRESENT' ? 'Batch marking' : '' });
        }

        try {
            console.log(`Marking daily attendance for today (${today.toISOString().split('T')[0]}) in ${tenantSlug}...`);
            await bulkMarkAttendance(tenantSlug, today, attendanceList);

            console.log('\n--- ATTENDANCE SUMMARY (TODAY) ---');
            const tenant = await Tenant.findOne({ slug: tenantSlug });
            const todayStart = new Date(today);
            todayStart.setHours(0, 0, 0, 0);

            const stats = await DailyAttendance.aggregate([
                { $match: { tenantId: tenant._id, date: todayStart } },
                { $group: { _id: "$status", count: { $sum: 1 } } }
            ]);

            console.table(stats.map(s => ({ Status: s._id, Count: s.count })));

            process.exit(0);
        } catch (err) {
            console.error(err);
            process.exit(1);
        }
    };
    main();
}
