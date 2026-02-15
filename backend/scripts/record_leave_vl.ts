import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import models using dynamic Import if needed, or define simple schemas
const MONGO_URI = 'mongodb+srv://avmvignesh0207_db_user:XB5qPLz5l08d6FvL@cluster0.kxzqtht.mongodb.net/bizzai';

const attendanceSummarySchema = new mongoose.Schema({
    tenantId: mongoose.Schema.Types.ObjectId,
    employeeId: mongoose.Schema.Types.ObjectId,
    month: Number,
    year: Number,
    totalDays: Number,
    workedDays: Number,
    leavesTaken: Number,
    notes: String
}, { timestamps: true });

const AttendanceSummary = mongoose.models.AttendanceSummary || mongoose.model('AttendanceSummary', attendanceSummarySchema);

const employeeSchema = new mongoose.Schema({
    name: String,
    tenantId: mongoose.Schema.Types.ObjectId,
}, { strict: false });

const Employee = mongoose.models.Employee || mongoose.model('Employee', employeeSchema);

const recordLeave = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        // 1. Find the employee
        const employeeName = 'Lakshmi Priya';
        const employee = await Employee.findOne({ name: employeeName });

        if (!employee) {
            console.error(`Employee '${employeeName}' not found.`);
            process.exit(1);
        }

        console.log(`Found Employee: ${employee.name} (${employee._id})`);
        console.log(`Tenant ID: ${employee.tenantId}`);

        // 2. Setup period (February 2026)
        const month = 1; // 0-indexed February
        const year = 2026;
        const totalDays = 28;
        const workedDays = 23;
        const leavesTaken = 5;

        // 3. Upsert Attendance Summary
        const summary = await AttendanceSummary.findOneAndUpdate(
            { employeeId: employee._id, month, year, tenantId: employee.tenantId },
            {
                totalDays,
                workedDays,
                leavesTaken,
                notes: 'Recorded 5 days leave for demonstration.'
            },
            { upsert: true, new: true }
        );

        console.log('Attendance Summary recorded successfully:');
        console.log(JSON.stringify(summary, null, 2));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

recordLeave();
