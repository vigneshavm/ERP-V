import 'reflect-metadata';
import mongoose from 'mongoose';
import { connect, closeDatabase, clearDatabase } from './setup.js';

// Validates the Inventory Search & Filter requirement: "As an Inventory Manager, I need to
// find the available quantity of shirts in inventory and filter them by size, brand,
// shelf/full-or-half shelf, and color." Exercises the REAL, compiled InventoryService against a
// real in-memory MongoDB (via tests/setup.js), inserting genuine Item documents rather than
// mocking the model -- so these tests also catch real query-building bugs (see INV-SRCH-007,
// which failed before this fix: combining a product-name search with a shelf filter silently
// dropped the search text because both filters wrote to the same top-level `query.$or` key).

let Item;
let InventoryService;
let InventoryRepository;
let inventoryService;

const TENANT_ID = new mongoose.Types.ObjectId().toString();

beforeAll(async () => {
    await connect();
    Item = (await import('../dist/modules/inventory/models/Item.js')).default;
    ({ InventoryService } = await import('../dist/modules/inventory/services/InventoryService.js'));
    ({ InventoryRepository } = await import('../dist/repositories/InventoryRepository.js'));
    // Constructed directly (bypassing the tsyringe container InventoryController normally resolves
    // through) since InventoryRepository has no dependencies of its own -- @inject()/@injectable()
    // are only metadata for automatic DI resolution, nothing stops calling the real constructors
    // directly, and doing so here keeps this test independent of the DI container's setup.
    inventoryService = new InventoryService(new InventoryRepository());
}, 60000);

afterEach(async () => {
    await clearDatabase();
});

afterAll(async () => {
    await closeDatabase();
});

// Minimal set of shirt variants covering every filter dimension the requirement calls out
// (brand, size, color, shelf code, shelf type), plus one non-shirt item and one out-of-stock
// item, matching the wireframe's own example data (Peter England / Allen Solly, M, Blue, A-03/A-04).
async function seedShirtVariants(overrides = {}) {
    const addedBy = new mongoose.Types.ObjectId().toString();
    const base = { tenantId: TENANT_ID, addedBy, category: 'Clothing', costPrice: 500, sellingPrice: 1000, unit: 'pcs' };

    await Item.create([
        { ...base, name: 'Cotton Formal Shirt', sku: 'SHIRT-PE-BLU-M', brand: 'Peter England', size: 'M', color: 'Blue', shelfCode: 'A-03', shelfType: 'FULL', stockQty: 24, reservedStock: 0 },
        { ...base, name: 'Casual Denim Shirt', sku: 'SHIRT-AS-BLU-M', brand: 'Allen Solly', size: 'M', color: 'Blue', shelfCode: 'A-04', shelfType: 'HALF', stockQty: 12, reservedStock: 0 },
        { ...base, name: 'Executive White Shirt', sku: 'SHIRT-VH-WHT-L', brand: 'Van Heusen', size: 'L', color: 'White', shelfCode: 'A-03', shelfType: 'FULL', stockQty: 18, reservedStock: 0 },
        { ...base, name: 'Slim Fit Black Shirt', sku: 'SHIRT-LP-BLK-XL', brand: 'Louis Philippe', size: 'XL', color: 'Black', shelfCode: 'B-02', shelfType: 'HALF', stockQty: 8, reservedStock: 0 },
        // Same brand/size/color as "Cotton Formal Shirt" above but a DIFFERENT shelf/SKU --
        // this is the "same shirt stocked on multiple shelves" case (INV-SRCH-009/013), and its
        // reservedStock also covers the "available quantity accounts for reservations" case (INV-SRCH-012).
        { ...base, name: 'Reserved Blue Shirt', sku: 'SHIRT-PE-BLU-M-2', brand: 'Peter England', size: 'M', color: 'Blue', shelfCode: 'A-05', shelfType: 'FULL', stockQty: 10, reservedStock: 4 },
        { ...base, name: 'Sold Out Blue Shirt', sku: 'SHIRT-PE-BLU-S', brand: 'Peter England', size: 'S', color: 'Blue', shelfCode: 'A-03', shelfType: 'FULL', stockQty: 0, reservedStock: 0 },
        { ...base, name: 'Classmate Notebook A4', sku: 'STAT-NB-A4', brand: 'Classmate', size: 'A4', color: 'White', shelfCode: 'C-01', shelfType: 'FULL', stockQty: 500, reservedStock: 0 },
        ...(overrides.extra || []),
    ]);
}

describe('Inventory Variant Search (INV-SRCH-001 to INV-SRCH-014)', () => {
    test('INV-SRCH-001: search "shirt" returns all shirt inventory, not the notebook', async () => {
        await seedShirtVariants();
        const result = await inventoryService.getAllItemsWithPagination(TENANT_ID, { search: 'shirt' });
        expect(result.items.length).toBe(6);
        expect(result.items.every((i) => i.name.toLowerCase().includes('shirt'))).toBe(true);
    });

    test('INV-SRCH-002: filtering by size=M returns only M-size shirts', async () => {
        await seedShirtVariants();
        const result = await inventoryService.getAllItemsWithPagination(TENANT_ID, { search: 'shirt', size: 'M' });
        expect(result.items.length).toBe(3); // Peter England M, Allen Solly M, Reserved Blue Shirt M
        expect(result.items.every((i) => i.size === 'M')).toBe(true);
    });

    test('INV-SRCH-003: filtering by brand returns only that brand', async () => {
        await seedShirtVariants();
        const result = await inventoryService.getAllItemsWithPagination(TENANT_ID, { brand: 'Van Heusen' });
        expect(result.items.length).toBe(1);
        expect(result.items[0].brand).toBe('Van Heusen');
    });

    test('INV-SRCH-004: filtering by color returns only that color', async () => {
        await seedShirtVariants();
        const result = await inventoryService.getAllItemsWithPagination(TENANT_ID, { color: 'Black' });
        expect(result.items.length).toBe(1);
        expect(result.items[0].color).toBe('Black');
    });

    test('INV-SRCH-005: filtering by shelfType=FULL returns only full-shelf inventory', async () => {
        await seedShirtVariants();
        const result = await inventoryService.getAllItemsWithPagination(TENANT_ID, { search: 'shirt', shelfType: 'FULL' });
        expect(result.items.every((i) => i.shelfType === 'FULL')).toBe(true);
        expect(result.items.some((i) => i.shelfType === 'HALF')).toBe(false);
    });

    test('INV-SRCH-006: filtering by shelfType=HALF returns only half-shelf inventory', async () => {
        await seedShirtVariants();
        const result = await inventoryService.getAllItemsWithPagination(TENANT_ID, { search: 'shirt', shelfType: 'HALF' });
        expect(result.items.length).toBe(2); // Allen Solly (A-04) + Louis Philippe (B-02)
        expect(result.items.every((i) => i.shelfType === 'HALF')).toBe(true);
    });

    test('INV-SRCH-007: combining product search + brand + size + color + shelf + shelfType returns only the exact match (regression: search text must not be dropped when a shelf filter is also active)', async () => {
        await seedShirtVariants();
        const result = await inventoryService.getAllItemsWithPagination(TENANT_ID, {
            search: 'shirt',
            brand: 'Peter England',
            size: 'M',
            color: 'Blue',
            shelf: 'A-03',
            shelfType: 'FULL',
        });
        expect(result.items.length).toBe(1);
        expect(result.items[0].sku).toBe('SHIRT-PE-BLU-M');

        // Sanity check on the regression itself: search "shirt" + shelf A-03 (which also holds the
        // non-matching Van Heusen shirt, plus the Sold Out one) must still exclude the Classmate
        // notebook that's on a different shelf entirely -- proving the text search half of the
        // combined filter is real, not silently ignored.
        const shelfOnly = await inventoryService.getAllItemsWithPagination(TENANT_ID, { search: 'shirt', shelf: 'A-03' });
        expect(shelfOnly.items.length).toBe(3); // Cotton Formal Shirt, Executive White Shirt, Sold Out Blue Shirt (all on A-03)
        expect(shelfOnly.items.every((i) => i.name.toLowerCase().includes('shirt'))).toBe(true);
    });

    test('INV-SRCH-008: a filter combination matching nothing returns an empty result, not an error', async () => {
        await seedShirtVariants();
        const result = await inventoryService.getAllItemsWithPagination(TENANT_ID, { brand: 'Peter England', color: 'Green' });
        expect(result.items).toEqual([]);
        expect(result.pagination.total).toBe(0);
    });

    test('INV-SRCH-009 / INV-SRCH-013: the same product variant carried on multiple shelves (same brand/size/color, different shelf + SKU) is returned as separate rows with correct per-shelf quantities', async () => {
        await seedShirtVariants();
        const result = await inventoryService.getAllItemsWithPagination(TENANT_ID, { brand: 'Peter England', size: 'M', color: 'Blue' });
        // "Cotton Formal Shirt" (shelf A-03) and "Reserved Blue Shirt" (shelf A-05) are both
        // Peter England / M / Blue -- the same variant an Inventory Manager would think of as
        // "one shirt", but stocked on two different shelves with independent quantities.
        expect(result.items.length).toBe(2);
        const byShelf = Object.fromEntries(result.items.map((i) => [i.shelfCode, i.availableQuantity]));
        expect(byShelf).toEqual({ 'A-03': 24, 'A-05': 6 }); // A-05's 10 stockQty - 4 reserved = 6 available
        const skus = result.items.map((i) => i.sku).sort();
        expect(skus).toEqual(['SHIRT-PE-BLU-M', 'SHIRT-PE-BLU-M-2']);
    });

    test('INV-SRCH-010: an item with stockQty = 0 is still returned by a matching search, with availableQuantity 0', async () => {
        await seedShirtVariants();
        const result = await inventoryService.getAllItemsWithPagination(TENANT_ID, { search: 'Sold Out' });
        expect(result.items.length).toBe(1);
        expect(result.items[0].stockQty).toBe(0);
        expect(result.items[0].availableQuantity).toBe(0);
    });

    test('INV-SRCH-011: stock received through a GRN-style update (stockQty increased) is immediately reflected in a subsequent search', async () => {
        await seedShirtVariants();
        const before = await inventoryService.getAllItemsWithPagination(TENANT_ID, { search: 'Sold Out' });
        expect(before.items[0].availableQuantity).toBe(0);

        // Simulate a GRN increasing stock the same way InventoryService.addStock/updateItem would
        await Item.findOneAndUpdate({ sku: 'SHIRT-PE-BLU-S', tenantId: TENANT_ID }, { $set: { stockQty: 15 } });

        const after = await inventoryService.getAllItemsWithPagination(TENANT_ID, { search: 'Sold Out' });
        expect(after.items[0].stockQty).toBe(15);
        expect(after.items[0].availableQuantity).toBe(15);
    });

    test('INV-SRCH-012: a completed sale (reservedStock raised / stockQty reduced) immediately reduces availableQuantity', async () => {
        await seedShirtVariants();
        const before = await inventoryService.getAllItemsWithPagination(TENANT_ID, { search: 'Reserved Blue Shirt' });
        expect(before.items[0].stockQty).toBe(10);
        expect(before.items[0].availableQuantity).toBe(6); // 10 - 4 reserved

        // Simulate the sale completing: stock physically leaves, reservation clears
        await Item.findOneAndUpdate(
            { sku: 'SHIRT-PE-BLU-M-2', tenantId: TENANT_ID },
            { $set: { stockQty: 6, reservedStock: 0 } }
        );

        const after = await inventoryService.getAllItemsWithPagination(TENANT_ID, { search: 'Reserved Blue Shirt' });
        expect(after.items[0].stockQty).toBe(6);
        expect(after.items[0].availableQuantity).toBe(6);
    });

    test('INV-SRCH-014: clearing filters (no query params) restores the full inventory list', async () => {
        await seedShirtVariants();
        const filtered = await inventoryService.getAllItemsWithPagination(TENANT_ID, { brand: 'Peter England' });
        expect(filtered.items.length).toBeLessThan(7);

        const cleared = await inventoryService.getAllItemsWithPagination(TENANT_ID, {});
        expect(cleared.items.length).toBe(7); // all seeded items, including the notebook
    });
});

describe('Inventory Filter Options (GET /api/inventory/filters backing data)', () => {
    test('getFilterOptions returns real DB-backed brand/size/color/shelf values, not hardcoded ones, and is empty when nothing exists', async () => {
        const empty = await inventoryService.getFilterOptions(TENANT_ID);
        expect(empty).toEqual({ brands: [], sizes: [], colors: [], shelves: [] });

        await seedShirtVariants();
        const populated = await inventoryService.getFilterOptions(TENANT_ID);
        expect(populated.brands).toEqual(expect.arrayContaining(['Peter England', 'Allen Solly', 'Van Heusen', 'Louis Philippe']));
        expect(populated.sizes).toEqual(expect.arrayContaining(['M', 'L', 'XL', 'S']));
        expect(populated.colors).toEqual(expect.arrayContaining(['Blue', 'White', 'Black']));
        const shelfCodes = populated.shelves.map((s) => s.shelfCode);
        expect(shelfCodes).toEqual(expect.arrayContaining(['A-03', 'A-04', 'B-02']));
        const a04 = populated.shelves.find((s) => s.shelfCode === 'A-04');
        expect(a04.shelfType).toBe('HALF');
    });

    test('getFilterOptions never leaks another tenant\'s brand/size/color/shelf values that only exist on their Items', async () => {
        await seedShirtVariants();
        const otherTenantId = new mongoose.Types.ObjectId().toString();
        await Item.create({
            tenantId: otherTenantId,
            addedBy: new mongoose.Types.ObjectId().toString(),
            name: 'Other Tenant Exclusive Jacket',
            category: 'Clothing',
            costPrice: 100,
            sellingPrice: 200,
            unit: 'pcs',
            brand: 'OtherTenantOnlyBrand',
            size: 'XXL',
            color: 'Purple',
            shelfCode: 'Z-99',
            shelfType: 'FULL',
            stockQty: 3,
        });

        const options = await inventoryService.getFilterOptions(TENANT_ID);
        expect(options.brands).not.toContain('OtherTenantOnlyBrand');
        expect(options.colors).not.toContain('Purple');
        expect(options.shelves.map((s) => s.shelfCode)).not.toContain('Z-99');
    });
});
