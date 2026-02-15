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

        const purchaseStats = await Purchase.aggregate([
            { $group: { _id: '$vendorId', count: { $sum: 1 } } }
        ]);
        const billStats = await Bill.aggregate([
            { $group: { _id: '$supplier', count: { $sum: 1 } } }
        ]);
        const paymentStats = await PaymentOut.aggregate([
            { $group: { _id: '$supplierId', count: { $sum: 1 } } }
        ]);

        const statsMap = {
            purchases: Object.fromEntries(purchaseStats.map(s => [s._id?.toString(), s.count])),
            bills: Object.fromEntries(billStats.map(s => [s._id?.toString(), s.count])),
            payments: Object.fromEntries(paymentStats.map(s => [s._id?.toString(), s.count]))
        };

        const report = suppliers.map(s => {
            const sid = s._id.toString();
            const tid = s.tenantId?.toString() || 'undefined';
            return {
                _id: sid,
                supplierId: s.supplierId,
                name: s.businessName,
                tenantId: tid,
                isTarget: tid === TARGET_TENANT_ID,
                purchases: statsMap.purchases[sid] || 0,
                bills: statsMap.bills[sid] || 0,
                payments: statsMap.payments[sid] || 0
            };
        });

        console.log(JSON.stringify(report, null, 2));

        process.exit(0);
    } catch (err: any) {
        console.error(err);
        process.exit(1);
    }
};

run();
