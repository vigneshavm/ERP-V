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

        const suppliers = await Supplier.find({}).lean();
        const results = suppliers.map(s => {
            const tid = s.tenantId?.toString() || 'undefined';
            return {
                _id: s._id.toString(),
                supplierId: s.supplierId,
                name: s.businessName,
                tenantId: tid,
                isTarget: tid === TARGET_TENANT_ID
            };
        });

        const report = [];
        for (const s of results) {
            const purchaseCount = await Purchase.countDocuments({ vendorId: s._id });
            const billCount = await Bill.countDocuments({ supplier: s._id });
            const paymentCount = await PaymentOut.countDocuments({ supplierId: s._id });

            report.push({
                ...s,
                purchases: purchaseCount,
                bills: billCount,
                payments: paymentCount,
                totalRecords: purchaseCount + billCount + paymentCount
            });
        }

        console.log(JSON.stringify(report, null, 2));

        process.exit(0);
    } catch (err: any) {
        console.error(err);
        process.exit(1);
    }
};

run();
