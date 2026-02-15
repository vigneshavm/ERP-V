import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

// Define Schemas Inline to avoid Build/Import issues
const SupplierSchema = new mongoose.Schema({
    tenantId: String,
    supplierId: String,
    businessName: String,
    contactNo: String,
    openingBalance: Number,
    balanceType: String,
    manualTotalInvoiced: Number,
    manualTotalPaid: Number
}, { strict: false });

const BillSchema = new mongoose.Schema({
    tenantId: String,
    branchId: String,
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
    billNo: String, // Corrected field name
    date: Date,
    dueDate: Date,
    amount: Number,
    status: String,
    items: Array,
    createdBy: mongoose.Schema.Types.ObjectId
}, { strict: false });

const PaymentOutSchema = new mongoose.Schema({
    tenantId: String,
    branchId: String,
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
    paymentNumber: String,
    paymentDate: Date,
    amount: Number,
    paymentMode: String,
    status: String,
    reference: String,
    createdBy: mongoose.Schema.Types.ObjectId
}, { strict: false });

const UserSchema = new mongoose.Schema({
    email: String,
    branchId: String
}, { strict: false });

const Supplier = mongoose.models.Supplier || mongoose.model('Supplier', SupplierSchema);
const Bill = mongoose.models.Bill || mongoose.model('Bill', BillSchema);
const PaymentOut = mongoose.models.PaymentOut || mongoose.model('PaymentOut', PaymentOutSchema);
const User = mongoose.models.User || mongoose.model('User', UserSchema);

const connectDB = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');
    } catch (err) {
        console.error('MongoDB Connection Error:', err);
        process.exit(1);
    }
};

const ledgerData = [
    { date: '2025-04-01', type: 'BILL', ref: 'Inv No: 01', amount: 143511 },
    { date: '2025-04-01', type: 'BILL', ref: 'Inv No: 05', amount: 31998 },
    { date: '2025-04-01', type: 'PAYMENT', ref: 'Cash payment', amount: 5000 },
    { date: '2025-04-03', type: 'BILL', ref: 'Inv No: 16', amount: 21927 },
    { date: '2025-04-08', type: 'BILL', ref: 'Inv No: 24', amount: 13412 },
    { date: '2025-04-12', type: 'BILL', ref: 'Inv No: 36', amount: 14859 },
    { date: '2025-04-17', type: 'PAYMENT', ref: 'Cheque No: 352', amount: 100000 },
    { date: '2025-04-18', type: 'BILL', ref: 'Inv No: 49', amount: 73179 },
    { date: '2025-04-17', type: 'BILL', ref: 'Inv No: 48', amount: 57780 },
    { date: '2025-04-21', type: 'BILL', ref: 'Inv No: 50', amount: 26352 },
    { date: '2025-04-23', type: 'BILL', ref: 'Inv No: 55', amount: 26772 },
    { date: '2025-04-29', type: 'BILL', ref: 'Inv No: 70', amount: 17206 },
    { date: '2025-05-01', type: 'BILL', ref: 'Inv No: 77', amount: 7459 },
    { date: '2025-05-02', type: 'PAYMENT', ref: 'Cheque No: 499', amount: 100000 },
    { date: '2025-05-06', type: 'BILL', ref: 'Inv No: 35676', amount: 35676 }, // Assuming ref was typo in chat, using amount as ID if ref missing? No, user calc: "06Inv No:35676" -> Inv No is likely missing, 35676 is amount. I'll use MISSING-MAY-06
    { date: '2025-05-08', type: 'BILL', ref: 'Inv No: 107', amount: 32648 },
    { date: '2025-05-07', type: 'BILL', ref: 'Inv No: 100', amount: 17408 },
    { date: '2025-05-13', type: 'BILL', ref: 'Inv No: 127', amount: 32265 },
    { date: '2025-05-14', type: 'BILL', ref: 'Inv No: 132', amount: 45038 },
    { date: '2025-05-16', type: 'PAYMENT', ref: 'Cheque No: 958', amount: 150000 },
    { date: '2025-05-19', type: 'BILL', ref: 'Inv No: 150', amount: 60271 },
    { date: '2025-05-26', type: 'BILL', ref: 'Inv No: 192', amount: 55621 },
    { date: '2025-05-27', type: 'BILL', ref: 'Inv No: 205', amount: 7009 },
    { date: '2025-05-29', type: 'BILL', ref: 'Inv No: 211', amount: 13078 },
    { date: '2025-05-30', type: 'BILL', ref: 'Inv No: 224', amount: 16749 },
    { date: '2025-05-31', type: 'BILL', ref: 'Inv No: 230', amount: 21056 },
    { date: '2025-05-23', type: 'BILL', ref: 'Inv No: MISSING-MAY-23', amount: 16522 },
    { date: '2025-05-31', type: 'PAYMENT', ref: 'Payment', amount: 150000 },
    { date: '2025-06-02', type: 'BILL', ref: 'Inv No: 233', amount: 27319 },
    { date: '2025-06-02', type: 'BILL', ref: 'Inv No: 242', amount: 18827 },
    { date: '2025-06-02', type: 'BILL', ref: 'Inv No: 262', amount: 17848 }
];

const importLedger = async () => {
    await connectDB();
    const supplierName = "A. Arumuga Mudaliar & Sons";

    // Find Supplier
    const supplier = await Supplier.findOne({ businessName: supplierName });
    if (!supplier) {
        console.log(`Supplier ${supplierName} not found.`);
        process.exit(1);
    }

    // Find User (Admin) for audit
    const adminUser = await User.findOne({ email: 'vignesh@bizzai.com' });
    if (!adminUser) {
        console.log('Admin user not found');
        process.exit(1);
    }

    // 1. Set Opening Balance
    // Calculation: First Balance (962226) - First Bill (143511) = 818715
    const computedOpeningBalance = 818715;

    // Update Supplier Opening Balance
    supplier.openingBalance = computedOpeningBalance;
    supplier.balanceType = 'payable';
    supplier.manualTotalInvoiced = 0;
    supplier.manualTotalPaid = 0;
    await supplier.save();
    console.log(`Updated Opening Balance to ${computedOpeningBalance}`);

    let billsProcessed = 0;
    let paymentsProcessed = 0;

    for (const entry of ledgerData) {
        if (entry.type === 'BILL') {
            let billNo = entry.ref.replace('Inv No:', '').replace('Inv No :', '').trim();
            if (entry.ref === 'Inv No: 35676') billNo = 'MISSING-MAY-06'; // Special handling for the typo line

            // Upsert Bill
            const billData = {
                tenantId: supplier.tenantId,
                branchId: adminUser.branchId || 'Main',
                supplier: supplier._id,
                billNo: billNo,
                date: new Date(entry.date),
                dueDate: new Date(new Date(entry.date).getTime() + 30 * 24 * 60 * 60 * 1000),
                amount: entry.amount,
                status: 'unpaid',
                items: [{
                    name: 'Historical Import',
                    quantity: 1,
                    price: entry.amount,
                    amount: entry.amount
                }],
                createdBy: adminUser._id
            };

            const existingBill = await Bill.findOne({
                tenantId: supplier.tenantId,
                billNo: billNo,
                createdBy: adminUser._id
            });

            if (existingBill) {
                console.log(`Updating existing bill: ${billNo}`);
                Object.assign(existingBill, billData);
                await existingBill.save();
            } else {
                console.log(`Creating new bill: ${billNo}`);
                await Bill.create(billData);
            }
            billsProcessed++;

        } else if (entry.type === 'PAYMENT') {
            const paymentNo = entry.ref.replace('Cheque No:', '').replace('Cheque No :', '').trim();

            const paymentData = {
                tenantId: supplier.tenantId,
                branchId: adminUser.branchId || 'Main',
                supplierId: supplier._id,
                paymentNumber: paymentNo === 'Payment' || paymentNo === 'Cash payment' ? `PAY-${entry.date}-${entry.amount}` : paymentNo,
                paymentDate: new Date(entry.date),
                amount: entry.amount,
                paymentMode: entry.ref.toLowerCase().includes('cheque') ? 'Cheque' : 'Cash',
                status: 'cleared',
                reference: entry.ref,
                createdBy: adminUser._id
            };

            const existingPayment = await PaymentOut.findOne({
                tenantId: supplier.tenantId,
                supplierId: supplier._id,
                paymentNumber: paymentData.paymentNumber
            });

            if (existingPayment) {
                console.log(`Updating existing payment: ${paymentData.paymentNumber}`);
                Object.assign(existingPayment, paymentData);
                await existingPayment.save();
            } else {
                console.log(`Creating new payment: ${paymentData.paymentNumber}`);
                await PaymentOut.create(paymentData);
            }
            paymentsProcessed++;
        }
    }

    console.log(`Import Verification: Processed ${billsProcessed} Bills and ${paymentsProcessed} Payments.`);
    process.exit(0);
};

importLedger();
