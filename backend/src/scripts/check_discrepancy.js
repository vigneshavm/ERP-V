
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const BillSchema = new mongoose.Schema({
    billNo: String,
    amount: Number,
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
    purchaseOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Purchase' },
    status: String
});

const Bill = mongoose.model('Bill', BillSchema);

const SupplierSchema = new mongoose.Schema({
    businessName: String
});
const Supplier = mongoose.model('Supplier', SupplierSchema);

async function checkDiscrepancy() {
    try {
        info("Current Dir:", __dirname);
        info("Env Path:", path.resolve(__dirname, '../../.env'));

        if (!process.env.MONGO_URI) {
            console.error("❌ MONGO_URI is missing!");
            process.exit(1);
        } else {
            info("✅ MONGO_URI found (starts with):", process.env.MONGO_URI.substring(0, 15) + "...");
        }

        info("Connecting to DB...");
        await mongoose.connect(process.env.MONGO_URI);
        info("Connected to DB");

        // Find Bills without purchaseOrderId
        const directBills = await Bill.find({
            $or: [
                { purchaseOrderId: { $exists: false } },
                { purchaseOrderId: null }
            ],
            status: { $nin: ['draft', 'rejected', 'cancelled'] }
        }).populate('supplier');

        info(`Found ${directBills.length} Direct Bills (No PO Linked)`);

        let totalDirectValue = 0;
        directBills.forEach(b => {
            const supName = b.supplier?.businessName || 'Unknown';
            info(`- Bill: ${b.billNo} | Amount: ${b.amount} | Supplier: ${supName}`);
            totalDirectValue += b.amount || 0;
        });

        info(`Total Value of Direct Bills: ${totalDirectValue}`);
        info("These amounts appear in Supplier Directory but NOT in Purchase Register.");

        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

checkDiscrepancy();
