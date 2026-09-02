import { Request, Response } from 'express';
import BusinessSector from '../models/BusinessSector.js';
import ProductCategoryModel from '../../inventory/models/ProductCategory.js';
import { SECTOR_CATEGORY_SEED_DATA, SECTOR_SHORT_CODES } from '../data/sectorCategorySeedData.js';

// Fallback dataset guarantees zero offline failure. Both the sector list and
// the per-sector category list are derived from the same
// SECTOR_CATEGORY_SEED_DATA that seedSectorCategories.ts writes into Mongo,
// so "DB down" and "DB freshly seeded" never disagree about what a sector's
// categories are (e.g. Textile & Garments Retail's real Product Type list,
// not a handful of made-up placeholder names).
const slugify = (name: string): string => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const FALLBACK_SECTORS = Object.keys(SECTOR_CATEGORY_SEED_DATA).map(name => ({
    _id: `sec-${slugify(name)}`,
    id: `sec-${slugify(name)}`,
    name,
    status: 'ACTIVE',
    shortCode: SECTOR_SHORT_CODES[name]
}));

const FALLBACK_CATEGORIES: Record<string, Array<{ _id: string; id: string; name: string; businessSectorId: string; status: string; gstRate?: number; defaultUnit?: string }>> =
    Object.fromEntries(
        Object.entries(SECTOR_CATEGORY_SEED_DATA).map(([sectorName, categories]) => {
            const sectorId = `sec-${slugify(sectorName)}`;
            return [
                sectorName,
                categories.map(cat => ({
                    _id: `cat-${slugify(sectorName)}-${slugify(cat.name)}`,
                    id: `cat-${slugify(sectorName)}-${slugify(cat.name)}`,
                    name: cat.name,
                    businessSectorId: sectorId,
                    status: 'ACTIVE',
                    gstRate: cat.gstRate,
                    defaultUnit: cat.defaultUnit
                }))
            ];
        })
    );

export const getBusinessSectors = async (_req: Request, res: Response): Promise<void> => {
    try {
        const sectors = await BusinessSector.find({ status: 'ACTIVE' }).sort({ name: 1 });
        if (sectors && sectors.length > 0) {
            // shortCode is only ever written by seedSectorCategories.ts -- a
            // BusinessSector document created any other way (or seeded
            // before that field existed) can have name/status set with no
            // shortCode at all. Settings.tsx and the POS Product Type list
            // both resolve tenant.sector by looking up a sector's shortCode
            // here, so a document missing it left that resolution
            // permanently stuck at blank no matter how often Settings was
            // saved. Fall back to the same SECTOR_SHORT_CODES map the seed
            // script itself uses, keyed by the document's own name, instead
            // of returning shortCode as missing/undefined.
            const enriched = sectors.map(sector => {
                const obj = sector.toObject();
                if (!obj.shortCode) {
                    obj.shortCode = SECTOR_SHORT_CODES[obj.name];
                }
                return obj;
            });
            res.status(200).json({ success: true, data: enriched });
            return;
        }
    } catch (error) {
        console.warn('MongoDB connection unavailable, using seeded fallback Business Sectors');
    }
    res.status(200).json({ success: true, data: FALLBACK_SECTORS });
};

export const getProductCategories = async (req: Request, res: Response): Promise<void> => {
    const { sectorId, sectorName } = req.query;

    try {
        const filter: any = { status: 'ACTIVE' };

        if (sectorId) {
            filter.businessSectorId = sectorId;
        } else if (sectorName) {
            const sector = await BusinessSector.findOne({
                name: { $regex: new RegExp(`^${sectorName}$`, 'i') },
                status: 'ACTIVE'
            });
            if (sector) {
                filter.businessSectorId = sector._id;
            }
        }

        const categories = await ProductCategoryModel.find(filter)
            .populate('businessSectorId', 'name')
            .sort({ name: 1 });

        if (categories && categories.length > 0) {
            res.status(200).json({ success: true, data: categories });
            return;
        }
    } catch (error) {
        console.warn('MongoDB connection unavailable, using seeded fallback Product Categories');
    }

    // Fallback logic by sectorName or sectorId
    let nameToLookup = (sectorName as string) || '';
    if (sectorId) {
        const foundSector = FALLBACK_SECTORS.find(s => s._id === sectorId || s.id === sectorId);
        if (foundSector) nameToLookup = foundSector.name;
    }

    const fallbackCatList = FALLBACK_CATEGORIES[nameToLookup] || Object.values(FALLBACK_CATEGORIES).flat();

    res.status(200).json({
        success: true,
        data: fallbackCatList
    });
};
