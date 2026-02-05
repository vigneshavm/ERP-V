import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '../.env');
console.log(`📄 Loading .env from: ${envPath}`);
dotenv.config({ path: envPath });

// Import models
import Tenant from '../src/modules/core/models/Tenant.js';
import Supplier from '../src/modules/purchase/models/Supplier.js';
import Purchase from '../src/modules/purchase/models/Purchase.js';
import Item from '../src/modules/inventory/models/Item.js'; // Corrected path

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI as string);
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error: any) {
        console.error(`❌ Error: ${error.message}`);
        process.exit(1);
    }
};

const seedPurchaseBills = async () => {
    try {
        await connectDB();

        // 1. Find Tenant
        const tenantName = 'Default Organization';
        const tenant = await Tenant.findOne({
            name: { $regex: new RegExp(tenantName, 'i') }
        });

        if (!tenant) {
            console.error(`❌ Tenant "${tenantName}" not found!`);
            process.exit(1);
        }
        console.log(`✅ Tenant: ${tenant.name}`);

        // 2. Find Suppliers
        const suppliers = await Supplier.find({ tenantId: tenant._id });
        if (suppliers.length === 0) {
            console.error('❌ No suppliers found! Run the supplier seed script first.');
            process.exit(1);
        }
        console.log(`✅ Found ${suppliers.length} suppliers`);

        // 3. Ensure Cloth Products Exist
        const clothItems = [
            { name: 'Kid Wear Set', sku: 'CLOTH-KID-001', category: 'Kids', costPrice: 300, sellingPrice: 500, unit: 'set' },
            { name: 'Baby Sheet', sku: 'CLOTH-BBY-001', category: 'Baby', costPrice: 150, sellingPrice: 250, unit: 'pcs' },
            { name: 'Saree (Silk)', sku: 'CLOTH-SAR-001', category: 'Women', costPrice: 1200, sellingPrice: 2000, unit: 'pcs' },
            { name: 'Chudi Top', sku: 'CLOTH-CHD-001', category: 'Women', costPrice: 400, sellingPrice: 700, unit: 'pcs' },
            { name: 'Cotton Shirt', sku: 'CLOTH-SHR-001', category: 'Men', costPrice: 500, sellingPrice: 800, unit: 'pcs' },
            { name: 'Jeans', sku: 'CLOTH-JNS-001', category: 'Unisex', costPrice: 800, sellingPrice: 1200, unit: 'pcs' }
        ];

        const availableItems: any[] = [];

        console.log('🧵 Ensuring cloth items exist...');
        for (const item of clothItems) {
            // Check by SKU OR Name to prevent duplicate key errors
            let product = await Item.findOne({
                $or: [
                    { sku: item.sku, tenantId: tenant._id },
                    { name: item.name, tenantId: tenant._id }
                ]
            });

            if (!product) {
                product = await Item.create({
                    ...item,
                    addedBy: tenant.ownerId,
                    tenantId: tenant._id,
                    stockQty: 100 // Initial stock
                });
                console.log(`   - Created: ${item.name}`);
            } else {
                console.log(`   - Found: ${item.name}`);
            }
            availableItems.push(product);
        }

        // 4. Cleanup & Create Bills
        let billCount = 0;
        const targetSuppliers = [
            'Ramraj', 'MCR', 'Auruguga mudhari', 'Hema', 'Pothys',
            'Flora', 'Zebronics', 'Dell', 'HP', 'Logitech'
        ];

        for (const supplier of suppliers) {
            if (!targetSuppliers.some(name => new RegExp(name, 'i').test(supplier.businessName))) {
                continue;
            }

            console.log(`Processing bills for ${supplier.businessName}...`);

            // Cleanup old bills for this supplier
            await Purchase.deleteMany({ vendorId: supplier._id });

            // 3 Bills with different dates
            const dates = [
                new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
                new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
                new Date()                                      // Today
            ];

            for (let i = 0; i < 3; i++) {
                // Pick a random cloth item
                const product = availableItems[Math.floor(Math.random() * availableItems.length)];

                const qty = Math.floor(Math.random() * 50) + 10;
                const cost = product.costPrice || 100;
                const total = qty * cost;

                await Purchase.create({
                    purchaseNumber: `PO-${supplier.shortCode || 'SUP'}-${Date.now()}-${i}-${Math.floor(Math.random() * 1000)}`,
                    tenantId: tenant._id,
                    vendorId: supplier._id,
                    date: dates[i],
                    subtotal: total,
                    taxAmount: 0,
                    discountAmount: 0,
                    totalAmount: total,
                    status: 'COMPLETED',
                    createdBy: tenant.ownerId,
                    items: [{
                        productId: product._id,
                        productName: product.name,
                        quantity: qty,
                        rate: cost,
                        amount: total,
                        unitId: product.unit || 'pcs'
                    }]
                });
                billCount++;
            }
        }

        console.log(`\n🎉 Replaced old bills. Created ${billCount} new purchase bills with cloth items.`);
        process.exit(0);

    } catch (error: any) {
        console.error(`❌ Script failed: ${error.message}`);
        console.error(error);
        process.exit(1);
    }
};

seedPurchaseBills();
