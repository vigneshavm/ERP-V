import dns from 'dns';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import BusinessSector from '../modules/core/models/BusinessSector.js';
import ProductCategoryModel from '../modules/inventory/models/ProductCategory.js';
import { SECTOR_CATEGORY_SEED_DATA, SECTOR_SHORT_CODES } from '../modules/core/data/sectorCategorySeedData.js';

dotenv.config();

// Same fix as backend/src/config/database.ts: on some Windows machines the
// OS-configured DNS resolver can't answer the SRV lookup a mongodb+srv://
// URI needs ("querySrv ECONNREFUSED _mongodb._tcp....mongodb.net"), even
// though the app server connects fine because connectDB() already forces
// these resolvers. This standalone script bypasses connectDB(), so it needs
// the same fix applied directly.
dns.setServers(["1.1.1.1", "8.8.8.8"]);

const seedSectorCategories = async () => {
    try {
        console.log('Connecting to MongoDB...', process.env.MONGO_URI ? 'URI Found' : 'URI Missing');
        await mongoose.connect(process.env.MONGO_URI as string, { family: 4 });
        console.log('Connected to MongoDB');

        for (const [sectorName, categories] of Object.entries(SECTOR_CATEGORY_SEED_DATA)) {
            const sector = await BusinessSector.findOneAndUpdate(
                { name: sectorName },
                { name: sectorName, status: 'ACTIVE', shortCode: SECTOR_SHORT_CODES[sectorName] },
                { upsert: true, new: true }
            );
            console.log(`Seeded business sector: ${sector.name} (shortCode: ${sector.shortCode})`);

            for (const category of categories) {
                await ProductCategoryModel.findOneAndUpdate(
                    { name: category.name, businessSectorId: sector._id },
                    {
                        name: category.name,
                        description: category.description,
                        businessSectorId: sector._id,
                        status: 'ACTIVE',
                        gstRate: category.gstRate,
                        defaultUnit: category.defaultUnit
                    },
                    { upsert: true, new: true }
                );
                console.log(`  -> Seeded product category: ${category.name}`);
            }
        }

        console.log('Business Sector / Product Category seeding completed.');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding business sectors / product categories:', error);
        process.exit(1);
    }
};

seedSectorCategories();
