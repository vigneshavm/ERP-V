import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

import Supplier from '../src/modules/purchase/models/Supplier.js';
import Purchase from '../src/modules/purchase/models/Purchase.js';
import Bill from '../src/modules/finance/models/Bill.js';
import PaymentOut from '../src/modules/purchase/models/PaymentOut.js';
import PurchaseReturn from '../src/modules/purchase/models/PurchaseReturn.js';
import DebitNote from '../src/modules/purchase/models/DebitNote.js';

const TARGET_TENANT_ID = '69761b0971da0390f468f318';

const connectDB = async () => {
    try {
        const mongoUri = (process.env.MONGO_URI || "").trim();
        console.log(`Connecting to: ${mongoUri.split('@')[1]}`); // Log only the host part for security

        await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 10000, // 10 seconds timeout
            socketTimeoutMS: 10000
        });
        console.log(`✅ MongoDB Connected`);
    } catch (error: any) {
        console.error(`❌ Connection Error: ${error.message}`);
        process.exit(1);
    }
};

const run = async () => {
    try {
        await connectDB();
        // console.log('✅ Connected to MongoDB'); // This line is now handled by connectDB
        console.log('\n--- Step 1: Mapping all records to target tenant ---');

        const modelsWithTenant = [
            { model: Supplier, name: 'Supplier' },
            { model: Purchase, name: 'Purchase' },
            { model: Bill, name: 'Bill' },
            { model: PaymentOut, name: 'PaymentOut' }
        ];

        for (const item of modelsWithTenant) {
            const result = await item.model.updateMany(
                { tenantId: { $ne: TARGET_TENANT_ID } },
                { $set: { tenantId: TARGET_TENANT_ID } }
            );
            console.log(`Updated ${result.modifiedCount} ${item.name} records to tenant ${TARGET_TENANT_ID}`);
        }

        // Step 2: Deduplication
        console.log('\n--- Step 2: Deduplicating suppliers ---');
        const suppliers = await Supplier.find({ tenantId: TARGET_TENANT_ID }).sort({ createdAt: 1 }).lean();

        const groups: Record<string, any[]> = {};
        suppliers.forEach(s => {
            const key = s.businessName.trim().toLowerCase();
            if (!groups[key]) groups[key] = [];
            groups[key].push(s);
        });

        for (const key in groups) {
            const group = groups[key];
            if (group.length > 1) {
                console.log(`\nFound duplicate group for: "${group[0].businessName}" (${group.length} records)`);

                // Keep the "best" one: Prefer those with SUP- IDs or the oldest one
                const primary = group.find(s => s.supplierId.startsWith('SUP-')) || group[0];
                const secondaries = group.filter(s => s._id.toString() !== primary._id.toString());

                console.log(`  Keeping primary: ${primary.businessName} [${primary._id}] (${primary.supplierId})`);

                for (const sec of secondaries) {
                    console.log(`  Merging secondary: ${sec.businessName} [${sec._id}] (${sec.supplierId})`);

                    const secId = sec._id;
                    const priId = primary._id;

                    // Update references in associated models
                    const associations = [
                        { model: Purchase, field: 'vendorId', name: 'Purchase' },
                        { model: Bill, field: 'supplier', name: 'Bill' },
                        { model: PaymentOut, field: 'supplierId', name: 'PaymentOut' },
                        { model: PurchaseReturn, field: 'supplier', name: 'PurchaseReturn' },
                        { model: DebitNote, field: 'vendorId', name: 'DebitNote' }
                    ];

                    for (const assoc of associations) {
                        const res = await assoc.model.updateMany(
                            { [assoc.field]: secId },
                            { $set: { [assoc.field]: priId } }
                        );
                        if (res.modifiedCount > 0) {
                            console.log(`    Moved ${res.modifiedCount} ${assoc.name} records to primary`);
                        }
                    }

                    // Delete the secondary supplier
                    await Supplier.deleteOne({ _id: secId });
                    console.log(`    Deleted secondary supplier ${secId}`);
                }
            }
        }

        console.log('\n✅ Migration and deduplication completed.');
        process.exit(0);
    } catch (err: any) {
        console.error('❌ Error during migration:', err);
        process.exit(1);
    }
};

run();
