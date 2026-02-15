import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const EmployeeSchema = new mongoose.Schema({
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant' },
    name: String,
    role: String,
    mobile: String
});

const TenantSchema = new mongoose.Schema({
    slug: String
});

const Employee = mongoose.models.Employee || mongoose.model('Employee', EmployeeSchema);
const Tenant = mongoose.models.Tenant || mongoose.model('Tenant', TenantSchema);

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const tenant = await Tenant.findOne({ slug: 'vijaya-laxmi' });
        if (!tenant) throw new Error('Tenant not found');

        const roleUpdates = [
            { mobile: '9900000001', role: 'manager' },
            { mobile: '9900000002', role: 'senior sales staff' },
            { mobile: '9900000003', role: 'junior staff' },
            { mobile: '9900000004', role: 'new join staff' },
            { mobile: '9900000005', role: 'biller' }
        ];

        console.log('Updating employee roles...');

        for (const update of roleUpdates) {
            const result = await Employee.updateOne(
                { tenantId: tenant._id, mobile: update.mobile },
                { $set: { role: update.role } }
            );
            if (result.matchedCount > 0) {
                console.log(`✅ Updated employee with mobile ${update.mobile} to role: ${update.role}`);
            } else {
                console.log(`⚠️ Employee with mobile ${update.mobile} not found`);
            }
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

run();
