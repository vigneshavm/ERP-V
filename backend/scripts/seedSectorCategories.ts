import mongoose from 'mongoose';
import { connectDB, disconnectDB } from './utils/db.js';
import BusinessSector from '../src/modules/core/models/BusinessSector.js';
import ProductCategoryModel from '../src/modules/inventory/models/ProductCategory.js';

const SECTOR_MAPPINGS = [
    {
        sectorName: 'Textile & Garments Retail',
        description: 'Apparel, Fabrics, Sarees, Readymade Garments & Fashion Retail',
        categories: [
            { name: 'Clothing', description: 'Apparel, Readymade & Tailoring Items' },
            { name: 'Saree & Ethnic Wear', description: 'Traditional Sarees, Dhotis, & Kurtas' },
            { name: 'Shirts & Tops', description: 'Formal, Casual Shirts & Tops' },
            { name: 'Pants & Bottoms', description: 'Trousers, Jeans & Leggings' },
            { name: 'Bit Items & Accessories', description: 'Fabric Cutpieces, Buttons & Accessories' }
        ]
    },
    {
        sectorName: 'Electronics Store',
        description: 'Consumer Electronics, Appliances, Smartphones & Accessories',
        categories: [
            { name: 'Electronics', description: 'General Electronics & Appliances' },
            { name: 'Smartphones & Mobile', description: 'Mobile Phones & Accessories' },
            { name: 'Televisions & Audio', description: 'Smart TVs, Speakers & Soundbars' },
            { name: 'Laptops & Computers', description: 'Laptops, Peripherals & Storage' }
        ]
    },
    {
        sectorName: 'Pharmacy',
        description: 'Pharmaceuticals, Medicines, Healthcare & Medical Devices',
        categories: [
            { name: 'Medicines', description: 'Prescription & OTC Pharmaceutical Drugs' },
            { name: 'Supplements & Vitamins', description: 'Nutritional & Dietary Supplements' },
            { name: 'Medical Devices & First Aid', description: 'Thermometers, Monitors & Surgical Essentials' }
        ]
    },
    {
        sectorName: 'Supermarket',
        description: 'FMCG, Groceries, Fresh Produce, Dairy & Daily Staples',
        categories: [
            { name: 'Dairy', description: 'Milk, Butter, Cheese, Curd & Paneer' },
            { name: 'Groceries', description: 'General Provisions & Packaged Foods' },
            { name: 'Staples & Grains', description: 'Rice, Atta, Pulses, Oils & Spices' },
            { name: 'Beverages', description: 'Tea, Coffee, Juices & Soft Drinks' }
        ]
    }
];

export async function seedSectorCategories() {
    await connectDB();
    try {
        console.log('\n======================================================');
        console.log('  Seeding Business Sectors & Product Categories to DB ');
        console.log('======================================================\n');

        for (const mapping of SECTOR_MAPPINGS) {
            // Upsert Business Sector
            let sector = await BusinessSector.findOne({ name: mapping.sectorName });
            if (!sector) {
                sector = await BusinessSector.create({
                    name: mapping.sectorName,
                    description: mapping.description,
                    status: 'ACTIVE'
                });
                console.log(`[+] Created Sector: ${sector.name}`);
            } else {
                console.log(`[*] Existing Sector found: ${sector.name}`);
            }

            // Upsert Product Categories for this sector
            for (const catData of mapping.categories) {
                let category = await ProductCategoryModel.findOne({
                    name: catData.name,
                    businessSectorId: sector._id
                });

                if (!category) {
                    category = await ProductCategoryModel.create({
                        name: catData.name,
                        description: catData.description,
                        businessSectorId: sector._id,
                        status: 'ACTIVE'
                    });
                    console.log(`   └─ [+] Created Category: ${category.name}`);
                } else {
                    console.log(`   └─ [*] Existing Category: ${category.name}`);
                }
            }
        }

        console.log('\n✅ Business Sectors & Product Categories successfully seeded!\n');
    } catch (error: any) {
        console.error('❌ Error seeding sectors and categories:', error);
    } finally {
        await disconnectDB();
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    seedSectorCategories();
}
