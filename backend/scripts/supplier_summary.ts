import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

import Supplier from '../src/modules/purchase/models/Supplier.js';
import Tenant from '../src/modules/core/models/Tenant.js';

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI as string);

        const tenants = await Tenant.find({}).lean();
        const tenantMap = tenants.reduce((acc, t) => {
            acc[t._id.toString()] = t.name;
            return acc;
        }, {} as Record<string, string>);

        const suppliers = await Supplier.find({}).lean();
        console.log(`Total Suppliers in DB: ${suppliers.length}`);

        const summary: Record<string, any> = {};

        for (const s of suppliers) {
            const tid = s.tenantId?.toString() || 'undefined';
            const tname = tenantMap[tid] || 'Unknown Tenant';

            if (!summary[tid]) {
                summary[tid] = { name: tname, count: 0, suppliers: [] };
            }
            summary[tid].count++;
            summary[tid].suppliers.push({
                id: s.supplierId,
                name: s.businessName,
                _id: s._id
            });
        }

        console.log(JSON.stringify(summary, null, 2));

        process.exit(0);
    } catch (err: any) {
        console.error(err);
        process.exit(1);
    }
};

run();
