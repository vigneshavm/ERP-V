import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const DailyAttendanceSchema = new mongoose.Schema({
    tenantId: mongoose.Schema.Types.ObjectId,
    employeeId: mongoose.Schema.Types.ObjectId,
    date: Date,
    status: String
});
const DailyAttendance = mongoose.models.DailyAttendance || mongoose.model('DailyAttendance', DailyAttendanceSchema);

const EmployeeSchema = new mongoose.Schema({
    tenantId: mongoose.Schema.Types.ObjectId,
    name: String,
    mobile: String
});
const Employee = mongoose.models.Employee || mongoose.model('Employee', EmployeeSchema);

const TenantSchema = new mongoose.Schema({ slug: String });
const Tenant = mongoose.models.Tenant || mongoose.model('Tenant', TenantSchema);

const main = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const tenantSlug = 'vijaya-laxmi';
        const tenant = await Tenant.findOne({ slug: tenantSlug });
        const employees = await Employee.find({ tenantId: tenant._id });

        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const lastDay = new Date(year, month + 1, 0).getDate();

        console.log(`Populating attendance logs for ${tenantSlug} - ${month + 1}/${year}...`);

        for (const emp of employees) {
            const attendance = [];
            // Randomly decide how many leaves this specific employee takes (0 to 8 days)
            const leavesTarget = Math.floor(Math.random() * 9);
            let leavesCount = 0;

            for (let d = 1; d <= lastDay; d++) {
                const date = new Date(year, month, d);
                date.setHours(0, 0, 0, 0);

                // Sundays are weekly off (counts as present for this logic usually, or just ignored)
                // Let's mark them as PRESENT for simplicity or skip. User said "1 day for each week leave".
                // We'll mark most as PRESENT.

                let status = 'PRESENT';
                if (date.getDay() === 0) { // Sunday
                    status = 'PRESENT'; // Treat Sunday as paid weekly off
                } else if (leavesCount < leavesTarget && Math.random() < 0.2) {
                    status = 'ABSENT';
                    leavesCount++;
                }

                attendance.push({
                    tenantId: tenant._id,
                    employeeId: emp._id,
                    date,
                    status
                });
            }

            // Bulk update for this employee
            for (const log of attendance) {
                await DailyAttendance.findOneAndUpdate(
                    { tenantId: log.tenantId, employeeId: log.employeeId, date: log.date },
                    { $set: { status: log.status } },
                    { upsert: true }
                );
            }
            console.log(`✅ Populated ${lastDay} days for ${emp.name} (${leavesCount} leaves taken)`);
        }

        console.log('--- POPULATION COMPLETE ---');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

main();
