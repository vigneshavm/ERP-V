import Item from "../../inventory/models/Item.js";
import { SECTOR_SEEDS } from "../../../utils/sectorSeeds.js";
import { info, error } from '../../../config/logger.js';

/**
 * Seeds inventory items for a user based on their business sector/category.
 * Only seeds if the user has no items to avoid polluting existing data.
 */
export const seedInventory = async (userId: string, sector: string) => {
    try {
        if (!userId || !sector) return;

        // Check if user already has items
        const existingItemsCount = await Item.countDocuments({ addedBy: userId });
        if (existingItemsCount > 0) {
            info(`User ${userId} already has inventory items. Skipping seed.`);
            return;
        }

        const normalizedSector = sector.toLowerCase().trim();
        // Map similar sectors if needed, or rely on SECTOR_SEEDS keys
        let seedKey = normalizedSector;

        // Handle variations map
        const sectorMap: Record<string, string> = {
            'manufacturing': 'retail', // Fallback or custom
            'services': 'retail',      // Fallback
            'logistics': 'wholesale',  // Fallback
        };

        if (sectorMap[seedKey]) {
            seedKey = sectorMap[seedKey];
        }

        const seeds = SECTOR_SEEDS[seedKey];

        if (!seeds || seeds.length === 0) {
            info(`No seeds found for sector: ${sector}`);
            return;
        }

        const itemsToInsert = seeds.map((item: any) => ({
            ...item,
            addedBy: userId,
            // Add unique postfix to SKU ensuring no clashes if they somehow re-seed
            // though we check for existing items, clean DBs might have issues if unique indexes are global (our index is compound name+addedBy so it's fine)
        }));

        await Item.insertMany(itemsToInsert);
        info(`Seeded ${itemsToInsert.length} items for user ${userId} in sector ${sector}`);

    } catch (err) {
        error('Error seeding inventory:', err);
        // Do not throw, seeding is a background enhancement
    }
};
