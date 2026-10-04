import dns from 'dns';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { brandRepo, colorRepo, sizeRepo } from '../integrations/textilesoft/erpCatalogs.js';
import Shelf from '../modules/inventory/models/Shelf.js';
import { info } from '../config/logger.js';

dotenv.config();

// Same fix as backend/src/config/database.ts / seedSectorCategories.ts: on some
// Windows machines the OS-configured DNS resolver can't answer the SRV lookup a
// mongodb+srv:// URI needs, even though the app server connects fine because
// connectDB() already forces these resolvers. This standalone script bypasses
// connectDB(), so it needs the same fix applied directly.
dns.setServers(["1.1.1.1", "8.8.8.8"]);

// Starter catalog for the Inventory Variant Search filter dropdowns (Brand/Size/
// Color/Shelf). This is real, DB-persisted reference data -- it replaces what used
// to be hardcoded arrays baked directly into InventoryVariantSearch.tsx. It's a
// starting point, not a ceiling: GET /api/inventory/filters unions this catalog
// with whatever brand/size/color/shelf values a tenant's own Items already use, so
// the dropdowns stay accurate even for values never added here.
const BRANDS = ['Peter England', 'Allen Solly', 'Van Heusen', 'Louis Philippe', 'Classmate', 'Sony', 'Apple'];
const SIZES = [
    { name: 'S' }, { name: 'M' }, { name: 'L' }, { name: 'XL' }, { name: 'XXL' }, { name: 'Free Size' }
];
const COLORS: { name: string; hexCode: string }[] = [
    { name: 'Blue', hexCode: '#3b82f6' },
    { name: 'White', hexCode: '#ffffff' },
    { name: 'Black', hexCode: '#000000' },
    { name: 'Red', hexCode: '#ef4444' },
    { name: 'Green', hexCode: '#10b981' },
    { name: 'Yellow', hexCode: '#eab308' },
    { name: 'Grey', hexCode: '#6b7280' },
];
const SHELVES: { shelfCode: string; shelfType: 'FULL' | 'HALF' }[] = [
    { shelfCode: 'A-01', shelfType: 'FULL' },
    { shelfCode: 'A-02', shelfType: 'FULL' },
    { shelfCode: 'A-03', shelfType: 'FULL' },
    { shelfCode: 'A-04', shelfType: 'HALF' },
    { shelfCode: 'B-01', shelfType: 'FULL' },
    { shelfCode: 'B-02', shelfType: 'HALF' },
    { shelfCode: 'C-01', shelfType: 'FULL' },
];

const seedInventoryFilters = async () => {
    try {
        info('Connecting to MongoDB...', process.env.MONGO_URI ? 'URI Found' : 'URI Missing');
        await mongoose.connect(process.env.MONGO_URI as string, { family: 4 });
        info('Connected to MongoDB');

        for (const name of BRANDS) {
            const existing = await brandRepo.list(false);
            if (!existing.some((b) => b.name === name)) await brandRepo.create({ name });
            info(`Seeded brand: ${name}`);
        }

        for (const size of SIZES) {
            const existing = await sizeRepo.list(false);
            if (!existing.some((s) => s.name === size.name)) await sizeRepo.create(size);
            info(`Seeded size: ${size.name}`);
        }

        for (const color of COLORS) {
            const existing = await colorRepo.list(false);
            if (!existing.some((c) => c.name === color.name)) await colorRepo.create(color);
            info(`Seeded color: ${color.name}`);
        }

        for (const shelf of SHELVES) {
            await Shelf.findOneAndUpdate(
                { shelfCode: shelf.shelfCode, warehouseId: 'MAIN_WAREHOUSE' },
                { ...shelf, warehouseId: 'MAIN_WAREHOUSE', isActive: true },
                { upsert: true, new: true }
            );
            info(`Seeded shelf: ${shelf.shelfCode} (${shelf.shelfType})`);
        }

        info('Inventory filter catalog (Brand/Size/Color/Shelf) seeding completed.');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding inventory filter catalog:', error);
        process.exit(1);
    }
};

seedInventoryFilters();
