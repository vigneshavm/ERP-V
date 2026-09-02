import mongoose from 'mongoose';
import { connectDB, disconnectDB } from './utils/db.js';
import Brand from '../src/modules/inventory/models/Brand.js';
import Size from '../src/modules/inventory/models/Size.js';
import Color from '../src/modules/inventory/models/Color.js';
import Shelf from '../src/modules/inventory/models/Shelf.js';
import Item from '../src/modules/inventory/models/Item.js';

const BRANDS = ['Peter England', 'Allen Solly', 'Van Heusen', 'Louis Philippe', 'Classmate', 'Sony'];
const SIZES = ['S', 'M', 'L', 'XL', 'XXL', 'Free Size'];
const COLORS = ['Blue', 'White', 'Black', 'Red', 'Green', 'Yellow'];
const SHELVES = [
    { shelfCode: 'A-01', shelfType: 'FULL' },
    { shelfCode: 'A-02', shelfType: 'FULL' },
    { shelfCode: 'A-03', shelfType: 'FULL' },
    { shelfCode: 'A-04', shelfType: 'HALF' },
    { shelfCode: 'B-01', shelfType: 'FULL' },
    { shelfCode: 'B-02', shelfType: 'HALF' },
    { shelfCode: 'C-01', shelfType: 'FULL' }
];

const VARIANT_ITEMS = [
    // INV-SRCH-007 / INV-SRCH-013: Peter England, Size M, Color Blue, Shelf A-03 (FULL) -> Qty 24
    {
        name: 'Cotton Formal Shirt',
        sku: 'SHIRT-PE-BLU-M-A03',
        category: 'Clothing',
        brand: 'Peter England',
        size: 'M',
        color: 'Blue',
        shelfCode: 'A-03',
        shelfType: 'FULL',
        stockQty: 24,
        costPrice: 800,
        sellingPrice: 1499,
        unit: 'pcs'
    },
    // INV-SRCH-013: Same shirt variant on Shelf A-04 (HALF) -> Qty 12
    {
        name: 'Cotton Formal Shirt',
        sku: 'SHIRT-PE-BLU-M-A04',
        category: 'Clothing',
        brand: 'Peter England',
        size: 'M',
        color: 'Blue',
        shelfCode: 'A-04',
        shelfType: 'HALF',
        stockQty: 12,
        costPrice: 800,
        sellingPrice: 1499,
        unit: 'pcs'
    },
    // Allen Solly, Size M, Color Blue, Shelf A-04 (HALF) -> Qty 12
    {
        name: 'Casual Denim Shirt',
        sku: 'SHIRT-AS-BLU-M',
        category: 'Clothing',
        brand: 'Allen Solly',
        size: 'M',
        color: 'Blue',
        shelfCode: 'A-04',
        shelfType: 'HALF',
        stockQty: 12,
        costPrice: 950,
        sellingPrice: 1899,
        unit: 'pcs'
    },
    // Van Heusen, Size L, Color White, Shelf A-03 (FULL) -> Qty 18
    {
        name: 'Executive White Shirt',
        sku: 'SHIRT-VH-WHT-L',
        category: 'Clothing',
        brand: 'Van Heusen',
        size: 'L',
        color: 'White',
        shelfCode: 'A-03',
        shelfType: 'FULL',
        stockQty: 18,
        costPrice: 1100,
        sellingPrice: 1999,
        unit: 'pcs'
    },
    // Louis Philippe, Size XL, Color Black, Shelf B-02 (HALF) -> Qty 8
    {
        name: 'Slim Fit Black Shirt',
        sku: 'SHIRT-LP-BLK-XL',
        category: 'Clothing',
        brand: 'Louis Philippe',
        size: 'XL',
        color: 'Black',
        shelfCode: 'B-02',
        shelfType: 'HALF',
        stockQty: 8,
        costPrice: 1300,
        sellingPrice: 2499,
        unit: 'pcs'
    },
    // INV-SRCH-010: Out of Stock Shirt (Qty = 0)
    {
        name: 'Linen Summer Shirt',
        sku: 'SHIRT-PE-RED-S-OOS',
        category: 'Clothing',
        brand: 'Peter England',
        size: 'S',
        color: 'Red',
        shelfCode: 'A-01',
        shelfType: 'FULL',
        stockQty: 0,
        costPrice: 700,
        sellingPrice: 1299,
        unit: 'pcs'
    }
];

export async function seedInventoryVariants() {
    await connectDB();
    try {
        console.log('\n======================================================');
        console.log('  Seeding Normalized Brands, Sizes, Colors, Shelves   ');
        console.log('======================================================\n');

        // Seed Brands
        for (const brandName of BRANDS) {
            await Brand.findOneAndUpdate(
                { name: brandName },
                { name: brandName, isActive: true },
                { upsert: true, new: true }
            );
            console.log(`[+] Seeded Brand: ${brandName}`);
        }

        // Seed Sizes
        for (const sizeName of SIZES) {
            await Size.findOneAndUpdate(
                { name: sizeName },
                { name: sizeName, isActive: true },
                { upsert: true, new: true }
            );
            console.log(`[+] Seeded Size: ${sizeName}`);
        }

        // Seed Colors
        for (const colorName of COLORS) {
            await Color.findOneAndUpdate(
                { name: colorName },
                { name: colorName, isActive: true },
                { upsert: true, new: true }
            );
            console.log(`[+] Seeded Color: ${colorName}`);
        }

        // Seed Shelves
        for (const sh of SHELVES) {
            await Shelf.findOneAndUpdate(
                { shelfCode: sh.shelfCode },
                { shelfCode: sh.shelfCode, shelfType: sh.shelfType, warehouseId: 'MAIN_WAREHOUSE', isActive: true },
                { upsert: true, new: true }
            );
            console.log(`[+] Seeded Shelf: ${sh.shelfCode} (${sh.shelfType})`);
        }

        console.log('\n✅ Normalized master data seeded successfully!\n');
    } catch (error: any) {
        console.error('❌ Error seeding inventory variants:', error);
    } finally {
        await disconnectDB();
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    seedInventoryVariants();
}
