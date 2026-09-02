// Single source of truth for the Business Sector -> Product Category mapping
// used by /settings/general. Both the live seed script (seedSectorCategories.ts)
// and the offline fallback in SectorCategoryController.ts import this same
// data, so the two can never drift apart.
//
// The "Textile & Garments Retail" category list is not invented placeholder
// data - it's the same 114-item Product Type master (SAREE, DHOTHIE, SHIRT,
// SILK, ...) that POS Quick Entry mode already uses from
// frontend/src/data/productTypes.ts, carried over here with its real GST
// rates and default units so the two features agree with each other instead
// of each keeping its own separate list of "categories" for the same sector.
export interface SectorCategorySeed {
    name: string;
    description?: string;
    gstRate?: number;
    defaultUnit?: string;
}

// The rest of the app (Tenant.sector, POS template selection, the Inventory
// Categories page's sector filter) identifies a sector by a short code from
// frontend/src/types/common.ts's Sector enum ('Textile', 'Electronics',
// 'Pharmacy', 'Supermarket', ...) - not by this file's long display names
// ('Textile & Garments Retail', 'Electronics Store', ...). This map lets
// anything that only has the short code (e.g. category.service.ts merging
// sector-mapped categories into /inventory/categories) find the matching
// BusinessSector document, which is seeded with both name and shortCode.
export const SECTOR_SHORT_CODES: Record<string, string> = {
    'Textile & Garments Retail': 'Textile',
    'Electronics Store': 'Electronics',
    'Pharmacy': 'Pharmacy',
    'Supermarket': 'Supermarket'
};

export const SHORT_CODE_TO_FULL_NAME: Record<string, string> = Object.fromEntries(
    Object.entries(SECTOR_SHORT_CODES).map(([longName, shortCode]) => [shortCode, longName])
);

export const SECTOR_CATEGORY_SEED_DATA: Record<string, SectorCategorySeed[]> = {
    'Textile & Garments Retail': [
        { name: 'Pillaiyar Parivattam', gstRate: 5, defaultUnit: 'pcs' },
        { name: 'Amman Pattu', gstRate: 5, defaultUnit: 'pcs' },
        { name: 'Thombu Pcs', gstRate: 5, defaultUnit: 'pcs' },
        { name: 'Saree', gstRate: 5, defaultUnit: 'pcs' },
        { name: 'Fancy Saree', gstRate: 5, defaultUnit: 'pcs' },
        { name: 'Cotton Saree', gstRate: 5, defaultUnit: 'pcs' },
        { name: 'Pattu Saree', gstRate: 5, defaultUnit: 'pcs' },
        { name: 'Blouse Bit', gstRate: 5, defaultUnit: 'mtr' },
        { name: 'Saree Bit', gstRate: 5, defaultUnit: 'mtr' },
        { name: 'Chudi Cotton', gstRate: 5, defaultUnit: 'pcs' },
        { name: 'Chudi Design', gstRate: 5, defaultUnit: 'pcs' },
        { name: 'Chudidar', gstRate: 5, defaultUnit: 'pcs' },
        { name: 'Chudidar Material', gstRate: 5, defaultUnit: 'pcs' },
        { name: 'Night Dress', gstRate: 5, defaultUnit: 'pcs' },
        { name: 'Lungi', gstRate: 5, defaultUnit: 'pcs' },
        { name: 'Fancy Lungi', gstRate: 5, defaultUnit: 'pcs' },
        { name: 'Dhothie', gstRate: 5, defaultUnit: 'pcs' },
        { name: 'Cotton Dhothie', gstRate: 5, defaultUnit: 'pcs' },
        { name: 'Silk Dhothie', gstRate: 5, defaultUnit: 'pcs' },
        { name: 'Towel', gstRate: 5, defaultUnit: 'pcs' },
        { name: 'Cotton Towel', gstRate: 5, defaultUnit: 'pcs' },
        { name: 'Bath Towel', gstRate: 5, defaultUnit: 'pcs' },
        { name: 'Hand Kerchief', gstRate: 5, defaultUnit: 'pcs' },
        { name: 'Bed Sheet', gstRate: 5, defaultUnit: 'pcs' },
        { name: 'Pillow Cover', gstRate: 5, defaultUnit: 'pcs' },
        { name: 'Shirt', gstRate: 5, defaultUnit: 'pcs' },
        { name: 'Full Shirt', gstRate: 5, defaultUnit: 'pcs' },
        { name: 'Half Shirt', gstRate: 5, defaultUnit: 'pcs' },
        { name: 'Gents Pant', gstRate: 5, defaultUnit: 'pcs' },
        { name: 'Jeans Pant', gstRate: 5, defaultUnit: 'pcs' },
        { name: 'Bermuda', gstRate: 5, defaultUnit: 'pcs' },
        { name: 'T-Shirt', gstRate: 5, defaultUnit: 'pcs' },
        { name: 'Gents T-Shirt', gstRate: 5, defaultUnit: 'pcs' },
        { name: 'Shirtting', gstRate: 5, defaultUnit: 'mtr' },
        { name: 'Suitting', gstRate: 5, defaultUnit: 'mtr' },
        { name: 'Shirtting Bit', gstRate: 5, defaultUnit: 'mtr' },
        { name: 'Suitting Bit', gstRate: 5, defaultUnit: 'mtr' },
        { name: 'Wedding Dhothie Shirt', gstRate: 5, defaultUnit: 'set' },
        { name: 'Wedding Set', gstRate: 5, defaultUnit: 'set' },
        { name: 'Kids Wear', gstRate: 5, defaultUnit: 'pcs' },
        { name: 'Boys T-Shirt', gstRate: 5, defaultUnit: 'pcs' },
        { name: 'Boys Short', gstRate: 5, defaultUnit: 'pcs' },
        { name: 'Girls Dress', gstRate: 5, defaultUnit: 'pcs' },
        { name: 'Dupatta', gstRate: 5, defaultUnit: 'pcs' },
        { name: 'Stole', gstRate: 5, defaultUnit: 'pcs' },
        { name: 'Scarf', gstRate: 5, defaultUnit: 'pcs' },
        { name: 'Inner Wear', gstRate: 5, defaultUnit: 'pcs' },
        { name: 'Ladies Inner', gstRate: 5, defaultUnit: 'pcs' },
        { name: 'Gents Inner', gstRate: 5, defaultUnit: 'pcs' },
        { name: 'Socks', gstRate: 5, defaultUnit: 'pcs' },
        { name: 'Belt', gstRate: 12, defaultUnit: 'pcs' },
        { name: 'Wallet', gstRate: 12, defaultUnit: 'pcs' },
        { name: 'Bag', gstRate: 12, defaultUnit: 'pcs' },
        { name: 'Umbrella', gstRate: 12, defaultUnit: 'pcs' },
        { name: 'Angavasthiram', gstRate: 5, defaultUnit: 'pcs' },
        { name: 'Velvet', gstRate: 5, defaultUnit: 'mtr' },
        { name: 'Coat Material', gstRate: 5, defaultUnit: 'mtr' },
        { name: 'Lace', gstRate: 5, defaultUnit: 'mtr' },
        { name: 'Button', gstRate: 5, defaultUnit: 'pcs' },
        { name: 'Zipper', gstRate: 5, defaultUnit: 'pcs' },
        { name: 'Thread', gstRate: 5, defaultUnit: 'pcs' },
        { name: 'Saree Fall', gstRate: 5, defaultUnit: 'pcs' },
        { name: 'Saree Petticoat', gstRate: 5, defaultUnit: 'pcs' },
        { name: 'Legging', gstRate: 5, defaultUnit: 'pcs' },
        { name: 'Ladies Top', gstRate: 5, defaultUnit: 'pcs' },
        { name: 'Kurti', gstRate: 5, defaultUnit: 'pcs' },
        { name: 'Palazzo', gstRate: 5, defaultUnit: 'pcs' },
        { name: 'Plazo Set', gstRate: 5, defaultUnit: 'set' },
        { name: 'Maxi', gstRate: 5, defaultUnit: 'pcs' },
        { name: 'Gown', gstRate: 5, defaultUnit: 'pcs' },
        { name: 'Curtain', gstRate: 5, defaultUnit: 'pcs' },
        { name: 'Curtain Cloth', gstRate: 5, defaultUnit: 'mtr' },
        { name: 'Sofa Cover', gstRate: 5, defaultUnit: 'pcs' },
        { name: 'Table Cover', gstRate: 5, defaultUnit: 'pcs' },
        { name: 'Door Mat', gstRate: 5, defaultUnit: 'pcs' },
        { name: 'Floor Mat', gstRate: 5, defaultUnit: 'pcs' },
        { name: 'Carpet', gstRate: 12, defaultUnit: 'pcs' },
        { name: 'Blanket', gstRate: 5, defaultUnit: 'pcs' },
        { name: 'Bed Cover', gstRate: 5, defaultUnit: 'pcs' },
        { name: 'Quilt', gstRate: 5, defaultUnit: 'pcs' },
        { name: 'Mosquito Net', gstRate: 5, defaultUnit: 'pcs' },
        { name: 'Pavadai', gstRate: 5, defaultUnit: 'pcs' },
        { name: 'Pure Cotton', gstRate: 5, defaultUnit: 'mtr' },
        { name: 'Georgette', gstRate: 5, defaultUnit: 'mtr' },
        { name: 'Chiffon', gstRate: 5, defaultUnit: 'mtr' },
        { name: 'Crepe', gstRate: 5, defaultUnit: 'mtr' },
        { name: 'Silk', gstRate: 5, defaultUnit: 'mtr' },
        { name: 'Kanchipuram Silk', gstRate: 5, defaultUnit: 'pcs' },
        { name: 'Mysore Silk', gstRate: 5, defaultUnit: 'pcs' },
        { name: 'Banarasi Silk', gstRate: 5, defaultUnit: 'pcs' },
        { name: 'Chanderi', gstRate: 5, defaultUnit: 'pcs' },
        { name: 'Kota Doria', gstRate: 5, defaultUnit: 'pcs' },
        { name: 'Linen', gstRate: 5, defaultUnit: 'mtr' },
        { name: 'Khadi', gstRate: 0, defaultUnit: 'mtr' },
        { name: 'Handloom', gstRate: 0, defaultUnit: 'mtr' },
        { name: 'Readymade', gstRate: 5, defaultUnit: 'pcs' },
        { name: 'Ladies Readymade', gstRate: 5, defaultUnit: 'pcs' },
        { name: 'Gents Readymade', gstRate: 5, defaultUnit: 'pcs' },
        { name: 'Kids Readymade', gstRate: 5, defaultUnit: 'pcs' },
        { name: 'Embroidery Material', gstRate: 5, defaultUnit: 'mtr' },
        { name: 'Fancy Material', gstRate: 5, defaultUnit: 'mtr' },
        { name: 'Printed Material', gstRate: 5, defaultUnit: 'mtr' },
        { name: 'Plain Material', gstRate: 5, defaultUnit: 'mtr' },
        { name: 'Poplin', gstRate: 5, defaultUnit: 'mtr' },
        { name: 'Polyester', gstRate: 5, defaultUnit: 'mtr' },
        { name: 'Skirt', gstRate: 5, defaultUnit: 'pcs' },
        { name: 'Lehanga', gstRate: 5, defaultUnit: 'pcs' },
        { name: 'Anarkali', gstRate: 5, defaultUnit: 'pcs' },
        { name: 'Jacket', gstRate: 5, defaultUnit: 'pcs' },
        { name: 'Blazer', gstRate: 5, defaultUnit: 'pcs' },
        { name: 'Suit', gstRate: 5, defaultUnit: 'set' },
        { name: 'Formal Wear', gstRate: 5, defaultUnit: 'pcs' },
        { name: 'Casual Wear', gstRate: 5, defaultUnit: 'pcs' },
        { name: 'Work Wear', gstRate: 5, defaultUnit: 'pcs' }
    ],
    'Electronics Store': [
        { name: 'Electronics', gstRate: 18, defaultUnit: 'pcs' },
        { name: 'Smartphones & Mobile', gstRate: 18, defaultUnit: 'pcs' },
        { name: 'Televisions & Audio', gstRate: 18, defaultUnit: 'pcs' },
        { name: 'Laptops & Computers', gstRate: 18, defaultUnit: 'pcs' }
    ],
    'Pharmacy': [
        { name: 'Medicines', gstRate: 12, defaultUnit: 'pcs' },
        { name: 'Supplements & Vitamins', gstRate: 12, defaultUnit: 'pcs' },
        { name: 'Medical Devices & First Aid', gstRate: 12, defaultUnit: 'pcs' }
    ],
    'Supermarket': [
        { name: 'Dairy', gstRate: 5, defaultUnit: 'pcs' },
        { name: 'Groceries', gstRate: 5, defaultUnit: 'kg' },
        { name: 'Staples & Grains', gstRate: 5, defaultUnit: 'kg' },
        { name: 'Beverages', gstRate: 12, defaultUnit: 'pcs' }
    ]
};
