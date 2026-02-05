import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '../.env');
dotenv.config({ path: envPath });

// Import models
import Tenant from '../src/modules/core/models/Tenant.js';
import Purchase from '../src/modules/purchase/models/Purchase.js';
import Supplier from '../src/modules/purchase/models/Supplier.js'; // Needed to register model if not already

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI as string);
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error: any) {
        console.error(`❌ Error: ${error.message}`);
        process.exit(1);
    }
};

const showTotals = async () => {
    try {
        await connectDB();

        const tenantName = 'Default Organization';
        const tenant = await Tenant.findOne({
            name: { $regex: new RegExp(tenantName, 'i') }
        });

        if (!tenant) {
            console.error('Tenant not found');
            process.exit(1);
        }

        console.log(`\n📊 Supplier Bill Totals for: ${tenant.name}\n`);

        const totals = await Purchase.aggregate([
            { $match: { tenantId: tenant._id.toString(), status: 'COMPLETED' } },
            {
                $group: {
                    _id: "$vendorId",
                    totalAmount: { $sum: "$totalAmount" },
                    billCount: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: "suppliers",
                    localField: "_id",
                    foreignField: "_id",
                    as: "supplier"
                }
            },
            { $unwind: "$supplier" },
            {
                $project: {
                    _id: 1,
                    supplierName: "$supplier.businessName",
                    totalAmount: 1,
                    billCount: 1
                }
            },
            { $sort: { totalAmount: -1 } }
        ]);

        console.table(totals.map(t => ({
            "Supplier": t.supplierName,
            "Bills": t.billCount,
            "Total Amount": t.totalAmount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })
        })));

        process.exit(0);

    } catch (error: any) {
        console.error(`❌ Script failed: ${error.message}`);
        process.exit(1);
    }
};

showTotals();
