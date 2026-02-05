import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

console.log('🚀 Script starting...');

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
console.log(`📂 Script directory: ${__dirname}`);
const envPath = path.join(__dirname, '../.env');
console.log(`📄 Loading .env from: ${envPath}`);
dotenv.config({ path: envPath });

// Import models
// Note: Using .js extension for imports as per project convention for ES modules
import Tenant from '../src/modules/core/models/Tenant.js';
import Supplier from '../src/modules/purchase/models/Supplier.js';

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI as string);
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error: any) {
        console.error(`❌ Error: ${error.message}`);
        process.exit(1);
    }
};

const suppliersToAdd = [
    { businessName: 'Ramraj', supplierType: 'manufacturer' },
    { businessName: 'MCR', supplierType: 'manufacturer' },
    { businessName: 'Auruguga mudhari', supplierType: 'wholesaler' },
    { businessName: 'Hema', supplierType: 'wholesaler' },
    { businessName: 'Pothys', supplierType: 'distributor' },
    { businessName: 'Flora', supplierType: 'manufacturer' },
    { businessName: 'Zebronics', supplierType: 'distributor' },
    { businessName: 'Dell', supplierType: 'manufacturer' },
    { businessName: 'HP', supplierType: 'manufacturer' },
    { businessName: 'Logitech', supplierType: 'distributor' }
];

const seedSuppliers = async () => {
    try {
        await connectDB();

        // 1. Find the Tenant
        // Using regex for case-insensitive flexible matching
        const tenantName = 'Default Organization'; // Updated per user request
        const tenant = await Tenant.findOne({
            name: { $regex: new RegExp(tenantName, 'i') }
        });

        const User = mongoose.model('User', new mongoose.Schema({ name: String, email: String })); // Minimal schema for listing

        if (!tenant) {
            console.error(`❌ Tenant matching "${tenantName}" not found!`);
            console.log('Available tenants:');
            const tenants = await Tenant.find({}, 'name slug shopName');
            tenants.forEach(t => console.log(` - Name: ${t.name}, Slug: ${t.slug}, Shop: ${t.shopName}`));

            console.log('\nAvailable Users (Potential Owners):');
            // Assuming User collection exists and fields match
            try {
                const users = await mongoose.connection.db?.collection('users').find({}).toArray();
                users?.forEach((u: any) => console.log(` - ${u.name} (${u.email})`));
            } catch (err) {
                console.log(' - Could not list users');
            }

            process.exit(1);
        }

        console.log(`✅ Found tenant: ${tenant.name} (${tenant._id})`);

        // 2. Add Suppliers
        let addedCount = 0;
        for (const sup of suppliersToAdd) {
            // Check if supplier already exists for this tenant
            const existing = await Supplier.findOne({
                tenantId: tenant._id,
                businessName: sup.businessName
            });

            if (existing) {
                console.log(`⚠️ Supplier "${sup.businessName}" already exists. Skipping.`);
                continue;
            }

            // Create new supplier
            // Filling required fields with placeholders if necessary
            await Supplier.create({
                tenantId: tenant._id,
                supplierId: `SUP-${Date.now()}-${Math.floor(Math.random() * 1000)}`, // Generate unique ID
                businessName: sup.businessName,
                supplierType: sup.supplierType,
                // Required fields based on schema, assuming defaults or placeholders
                contactPersonName: 'Manager',
                contactNo: `9${Math.floor(100000000 + Math.random() * 900000000)}`, // Random Indian mobile number
                email: `contact@${sup.businessName.toLowerCase().replace(/\s+/g, '')}.com`,
                physicalAddress: 'Address Pending',
                gstNo: '29AAAAA0000A1Z5', // Dummy GST
                status: 'active',
                owner: tenant.ownerId // Assigning to tenant owner if applicable, schema has owner field
            });

            console.log(`✅ Added supplier: ${sup.businessName}`);
            addedCount++;
        }

        console.log(`\n🎉 Process Completed. Added ${addedCount} new suppliers.`);
        process.exit(0);

    } catch (error: any) {
        console.error(`❌ Script failed: ${error.message}`);
        console.error(error);
        process.exit(1);
    }
};

seedSuppliers();
