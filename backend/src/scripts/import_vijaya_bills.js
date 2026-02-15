import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Parse Data
const RAW_DATA = [
    { date: '28/01/26', vendor: 'Jeyaram Agency', billNo: '22914', amount: '161,739' },
    { date: '26/01/26', vendor: 'R.G. Trendz', billNo: '424', amount: '29,447' },
    { date: '24/01/26', vendor: 'GL Fashions', billNo: 'MISSING-001', amount: '40,156' }, // Handled missing bill no
    { date: '24/01/26', vendor: 'E.G. Subbiah Dresses', billNo: '433', amount: '27,221' },
    { date: '27/01/26', vendor: 'E.G. Subbiah Dresses', billNo: '435', amount: '22,418' },
    { date: '27/01/26', vendor: 'E.G. Subbiah Dresses', billNo: '437', amount: '36,226' },
    { date: '26/01/26', vendor: 'Mahesh & Co', billNo: '474', amount: '26,460' },
    { date: '26/01/26', vendor: 'B & B Textile', billNo: '67213', amount: '5,906' }, // Took first part of 67213 / BB2526
    { date: '11/01/26', vendor: 'Aatarsh Clothing Company', billNo: '11464', amount: '58,958' },
    { date: '07/01/26', vendor: 'A.R.G Garments', billNo: '1261', amount: '31,563' },
    { date: '01/01/26', vendor: 'A. Arumuga Mudaliar & Sons', billNo: '780', amount: '14,860' },
    { date: '01/01/26', vendor: 'Jeyaram Agency', billNo: '23026', amount: '7,049' },
    { date: '01/01/26', vendor: 'Jeyaram Agency', billNo: '23049', amount: '10,779' },
    { date: '01/01/26', vendor: 'Jeyaram Agency', billNo: '22935', amount: '12,209' },
    { date: '01/01/26', vendor: 'SPE Fashion', billNo: '468', amount: '29,247' },
    { date: '01/01/26', vendor: 'Viver Enterprise', billNo: '477', amount: '35,981' },
    { date: '01/01/26', vendor: 'A. Arumuga Mudaliar & Sons', billNo: '796', amount: '30,475' }
];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// --- Schemas ---
const TenantSchema = new mongoose.Schema({ name: String }, { strict: false });
const UserSchema = new mongoose.Schema({ email: String, tenantId: String }, { strict: false });

const SupplierSchema = new mongoose.Schema({
    tenantId: { type: String, required: true },
    supplierId: { type: String, required: true }, // Unique string
    businessName: { type: String, required: true },
    contactPersonName: String,
    contactNo: String,
    openingBalance: { type: Number, default: 0 },
    status: { type: String, default: 'active' }
}, { strict: false, timestamps: true });

const BillSchema = new mongoose.Schema({
    billNo: { type: String, required: true },
    vendorInvoiceNo: { type: String, required: true },
    tenantId: { type: String, required: true },
    branchId: { type: String },
    date: { type: Date, required: true },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier", required: true },
    amount: { type: Number, required: true },
    status: { type: String, default: 'unpaid' },
    paymentStatus: { type: String, default: 'unpaid' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [], // Empty items as we only have totals
    subTotal: Number,
    description: String,
    gstReconciliationStatus: { type: String, default: 'PENDING' },
    itcStatus: { type: String, default: 'UNCLAIMED' }
}, { strict: false, timestamps: true });

// --- Models ---
const Tenant = mongoose.model('Tenant', TenantSchema);
const User = mongoose.model('User', UserSchema);
const Supplier = mongoose.model('Supplier', SupplierSchema);
const Bill = mongoose.model('Bill', BillSchema);

async function run() {
    try {
        if (!process.env.MONGO_URI) throw new Error("No Mongo URI");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        // 1. Get Tenant
        const tenant = await Tenant.findOne({ name: { $regex: /Vijaya Laxmi/i } });
        if (!tenant) throw new Error("Tenant 'Vijaya Laxmi' not found");
        console.log(`Found Tenant: ${tenant.name} (${tenant._id})`);

        // 2. Get User (Creator) - Try by email first
        let user = await User.findOne({ email: 'vignesh@bizzai.com' });
        if (user) {
            console.log(`Found User by email: ${user.email} (Tenant: ${user.tenantId})`);
            if (user.tenantId && user.tenantId.toString() !== tenant._id.toString()) {
                console.warn("User tenant mismatch! Using user anyway for creation.");
            }
        } else {
            user = await User.findOne({ tenantId: tenant._id }).sort({ createdAt: 1 });
        }

        if (!user) {
            console.log("Dumping all users for debug:");
            const allUsers = await User.find({}).limit(5);
            allUsers.forEach(u => console.log(`- ${u.email} (${u.tenantId})`));
            throw new Error("No user found for tenant");
        }

        // 3. Process Data
        for (const record of RAW_DATA) {
            // Cleanup Data
            const amount = parseFloat(record.amount.replace(/,/g, ''));
            const [day, month, year] = record.date.split('/');
            const date = new Date(`20${year}-${month}-${day}`); // Assuming 26 -> 2026

            // Upsert Supplier
            // Generate a supplierId based on name (slugify)
            const supplierSlug = record.vendor.toUpperCase().replace(/[^A-Z0-9]/g, '');
            const supplierId = `SUP-${supplierSlug.substring(0, 5)}-${Date.now().toString().slice(-4)}`;

            let supplier = await Supplier.findOne({
                tenantId: tenant._id,
                businessName: record.vendor
            });

            if (!supplier) {
                // Generate dummy contact to appease unique index { contactNo: 1, owner: 1 }
                // Use a part of supplierId to ensure uniqueness
                const dummyContact = '99' + supplierId.replace(/[^0-9]/g, '').slice(-8);

                supplier = await Supplier.create({
                    tenantId: tenant._id,
                    supplierId: supplierId,
                    businessName: record.vendor,
                    openingBalance: 0,
                    status: 'active',
                    owner: user._id, // Assign owner
                    contactNo: dummyContact, // Unique dummy contact
                    email: `vendor.${supplierId.toLowerCase()}@example.com` // Unique dummy email
                });
                console.log(`Created Vendor: ${supplier.businessName} (Contact: ${dummyContact})`);
            } else {
                console.log(`Found Vendor: ${supplier.businessName}`);
            }

            // Check if Bill exists
            const existingBill = await Bill.findOne({
                tenantId: tenant._id,
                vendorInvoiceNo: record.billNo,
                supplier: supplier._id
            });

            if (existingBill) {
                console.log(`Bill ${record.billNo} already exists. Skipping.`);
                continue;
            }

            // Create Bill
            await Bill.create({
                billNo: `BILL-${record.billNo}-${Date.now().toString().slice(-4)}`, // Internal ID
                vendorInvoiceNo: record.billNo,
                tenantId: tenant._id,
                // branchId: ??? (Optional, skipping for now)
                date: date,
                supplier: supplier._id,
                amount: amount,
                subTotal: amount,
                status: 'approved', // Historical bill, likely approved
                paymentStatus: 'unpaid', // Assuming pending
                createdBy: user._id,
                description: `Imported bill from legacy data. Date: ${record.date}`
            });
            console.log(`Created Bill: ${record.billNo} for ₹${amount}`);
        }

        console.log("Import Completed Successfully.");
        process.exit(0);

    } catch (e) {
        console.error("Error:", e);
        process.exit(1);
    }
}

run();
