import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '../.env');
dotenv.config({ path: envPath });

// Import models
import Supplier from '../src/modules/purchase/models/Supplier.js';
import Tenant from '../src/modules/core/models/Tenant.js';

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI as string);
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error: any) {
        console.error(`❌ Error: ${error.message}`);
        process.exit(1);
    }
};

const listSuppliers = async () => {
    try {
        console.log('Connecting to database...');
        await connectDB();

        console.log(`\n📋 Listing all Suppliers\n`);

        console.log('Fetching suppliers...');
        const suppliers = await Supplier.find({}).lean();
        console.log(`Found ${suppliers.length} suppliers.`);

        if (suppliers.length === 0) {
            console.log('No suppliers found.');
            process.exit(0);
        }

        // Fetch all tenants to map tenant names
        const tenants = await Tenant.find({}).lean();
        const tenantMap = tenants.reduce((acc, t) => {
            acc[t._id.toString()] = t.name;
            return acc;
        }, {} as Record<string, string>);

        console.table(suppliers.map(s => ({
            "ID": s.supplierId,
            "Business Name": s.businessName,
            "Contact Person": s.contactPersonName || 'N/A',
            "Contact No": s.contactNo || 'N/A',
            "Email": s.email || 'N/A',
            "Status": s.status,
            "Tenant": tenantMap[s.tenantId?.toString()] || s.tenantId,
            "Raw Tenant ID": s.tenantId
        })));

        process.exit(0);

    } catch (error: any) {
        console.error(`❌ Script failed: ${error.message}`);
        process.exit(1);
    }
};

listSuppliers();
