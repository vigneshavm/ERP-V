import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Supplier from '../src/modules/purchase/models/Supplier.js';
import Purchase from '../src/modules/purchase/models/Purchase.js';
import Bill from '../src/modules/finance/models/Bill.js';
import User from '../src/modules/core/models/User.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runTest() {
    try {
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) {
            throw new Error('MONGO_URI is not defined in .env');
        }

        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        // 1. Get/Create a test user
        let user = await User.findOne({ email: 'admin@bizzai.com' });
        if (!user) {
            // Find any user if admin@bizzai.com doesn't exist
            user = await User.findOne({});
        }

        if (!user) {
            console.log('No users found in database. Please register a user first.');
            process.exit(1);
        }

        const tenantId = user.tenantId || 'test-tenant';
        console.log(`Using User: ${user.email} (Tenant: ${tenantId})`);

        // 2. Create Supplier "Ramraj"
        console.log('Creating/Updating Supplier Ramraj...');
        let supplier = await Supplier.findOne({ tenantId, businessName: 'Ramraj' });
        if (supplier) {
            supplier.creditPeriod = 30;
            await supplier.save();
        } else {
            supplier = await Supplier.create({
                tenantId,
                businessName: 'Ramraj',
                contactPersonName: 'Ramraj Admin',
                supplierType: 'wholesaler',
                creditPeriod: 30,
                status: 'active',
                owner: user._id
            });
        }
        console.log(`Supplier Ramraj (ID: ${supplier._id}) ready with creditPeriod: ${supplier.creditPeriod}`);

        // 3. Helper to create purchase
        const createTestPurchase = async (date, amount, invoiceNo) => {
            const purchaseNumber = `TEST-PUR-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            const purchase = await Purchase.create({
                purchaseNumber,
                tenantId,
                vendorId: supplier._id,
                date: new Date(date),
                invoiceNo,
                subtotal: amount,
                totalAmount: amount,
                status: 'COMPLETED',
                createdBy: user._id,
                items: [] // Mocking items
            });

            // Replicating logic from PurchaseController (Simplified)
            const dueDate = new Date(purchase.date);
            dueDate.setDate(dueDate.getDate() + (supplier.creditPeriod || 30));

            const bill = await Bill.create({
                billNo: `BILL-${purchaseNumber}`,
                date: purchase.date,
                supplier: purchase.vendorId,
                amount: purchase.totalAmount,
                status: 'unpaid',
                paymentMethod: 'cash',
                createdBy: user._id,
                description: `Generated from Purchase ${purchaseNumber}`,
                paymentStatus: 'unpaid',
                dueDate: dueDate
            });

            return { purchase, bill };
        };

        // 4. Create Invoices
        console.log('Creating Invoice 1: 50000 on Jan 15, 2026...');
        const res1 = await createTestPurchase('2026-01-15', 50000, 'INV-001');

        console.log('Creating Invoice 2: 75000 on Jan 25, 2026...');
        const res2 = await createTestPurchase('2026-01-25', 75000, 'INV-002');

        // 5. Verify Results
        console.log('\n--- Test Results ---');
        [res1, res2].forEach((res, index) => {
            console.log(`Invoice ${index + 1}:`);
            console.log(`  Amount: ${res.bill.amount}`);
            console.log(`  Purchase Date: ${res.bill.date.toISOString().split('T')[0]}`);
            console.log(`  Due Date: ${res.bill.dueDate.toISOString().split('T')[0]}`);

            const expectedDueDate = new Date(res.bill.date);
            expectedDueDate.setDate(expectedDueDate.getDate() + 30);
            const isCorrect = res.bill.dueDate.getTime() === expectedDueDate.getTime();
            console.log(`  Correct Calculation: ${isCorrect ? '✅' : '❌'}`);
        });

        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    } catch (error) {
        console.error('Test Execution Error:', error);
        process.exit(1);
    }
}

runTest();
