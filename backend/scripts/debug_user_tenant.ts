
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Supplier from '../src/modules/purchase/models/Supplier.js';
import Tenant from '../src/modules/core/models/Tenant.js';

// Load env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const debug = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI as string);
        console.log('Connected to DB');

        console.log('\n--- Tenants ---');
        const tenants = await Tenant.find({});
        tenants.forEach(t => console.log(`ID: ${t._id}, Name: ${t.name}, Slug: ${t.slug}`));

        console.log('\n--- Suppliers ---');
        const supplier = await Supplier.findOne({});
        if (supplier) {
            console.log(`Sample Supplier: ${supplier.businessName}`);
            // Explicitly logging as string and type
            console.log(`TenantID Value: ${supplier.tenantId}`);
            console.log(`TenantID Type: ${typeof supplier.tenantId}`);
            // @ts-ignore
            console.log(`TenantID Constructor: ${supplier.tenantId?.constructor?.name}`);
        } else {
            console.log("No suppliers found.");
        }

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
};

debug();
