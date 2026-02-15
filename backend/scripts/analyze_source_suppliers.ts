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

const TARGET_TENANT_ID = '69761b0971da0390f468f318';

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI as string);

        const suppliers = await Supplier.find({ tenantId: { $ne: TARGET_TENANT_ID } }).lean();
        console.log(`Found ${suppliers.length} suppliers NOT in target tenant.`);

        for (const s of suppliers) {
            const purchaseCount = await Purchase.countDocuments({ vendorId: s._id });
            const billCount = await Bill.countDocuments({ supplier: s._id });
            const paymentCount = await PaymentOut.countDocuments({ supplierId: s._id });

            console.log(`Supplier: ${s.businessName} (${s._id}) | Tenant: ${s.tenantId}`);
            console.log(`  Purchases: ${purchaseCount}`);
            console.log(`  Bills: ${billCount}`);
            console.log(`  Payments: ${paymentCount}`);
        }

        process.exit(0);
    } catch (err: any) {
        console.error(err);
        process.exit(1);
    }
};

run();
