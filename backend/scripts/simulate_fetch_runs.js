
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    tenantId: mongoose.Schema.Types.ObjectId,
    role: String
});
const PayrollRunSchema = new mongoose.Schema({
    tenantId: mongoose.Schema.Types.ObjectId,
    month: Number,
    year: Number,
    runDate: Date,
    totalPayout: Number,
    status: String,
    generatedAt: Date
}, { strict: false }); // strict: false to see all fields

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const PayrollRun = mongoose.models.PayrollRun || mongoose.model('PayrollRun', PayrollRunSchema);

const simulateFetchRuns = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI not found");
        }
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        // 1. Find the User
        const email = 'vignesh@bizzai.com';
        const user = await User.findOne({ email });
        if (!user) {
            console.error(`User ${email} not found!`);
            process.exit(1);
        }
        console.log(`User TenantID: ${user.tenantId}`);

        // 2. Fetch Runs
        const runs = await PayrollRun.find({ tenantId: user.tenantId }).sort({ _id: -1 });

        console.log(`\nFound ${runs.length} Payroll Runs:`);

        runs.forEach((r, i) => {
            console.log(`\nRun #${i + 1} (ID: ${r._id})`);
            console.log(`  Month: ${r.month} (${typeof r.month})`);
            console.log(`  Year: ${r.year} (${typeof r.year})`);
            console.log(`  Run Date: ${r.runDate} (${typeof r.runDate})`);
            console.log(`  Generated At: ${r.generatedAt} (${typeof r.generatedAt})`);
            console.log(`  Total Payout: ${r.totalPayout}`);
            console.log(`  Status: ${r.status}`);
            console.log(`  Raw:`, JSON.stringify(r.toJSON(), null, 2));
        });

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

simulateFetchRuns();
