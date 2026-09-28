// Test fixtures for receipt generation. Kept out of services/receiptDataService.ts so production
// code can't fall back to this invented shop, sale and line items.
import { Sale, CartItem } from '../types/sales';
import { Tenant, Branch } from '../types/tenant';
import { Sector, TaxMode } from '../types/common';

/**
 * Builds a test Tenant object with sensible defaults and optional overrides.
 */
export const buildDynamicTenant = (overrides?: Partial<Tenant>): Tenant => {
    return {
        id: 'T-DYN-001',
        name: 'Vijayalakshmi Textiles & Readymades',
        sector: Sector.TEXTILE,
        companyDetails: {
            addressLine1: 'Mela Periya Veethi, Mukkudal',
            phone: '04634-274206',
            city: 'Mukkudal',
            state: 'Tamil Nadu',
            stateCode: '33',
            country: 'India',
            pincode: '627415',
            email: 'contact@vijayalaxmi.com'
        },
        taxDetails: {
            gstin: '33AFNPA6099M1ZZ',
            taxSystem: 'GST',
            isGstEnabled: true
        },
        ...overrides
    };
};

/**
 * Builds a test Branch object with sensible defaults and optional overrides.
 */
export const buildDynamicBranch = (overrides?: Partial<Branch>): Branch => {
    return {
        id: 'B-DYN-001',
        name: 'Main Branch',
        city: 'Mukkudal',
        address: 'Mela Periya Veethi, Mukkudal',
        phone: '04634-274206',
        config: {},
        ...overrides
    };
};

/**
 * Builds dynamic CartItem items with customizable rates and specs.
 */
export const buildDynamicItems = (itemOverrides?: Partial<CartItem>[]): CartItem[] => {
    const defaults: CartItem[] = [
        {
            id: 'ITEM-001',
            name: 'BRA',
            price: 135.00,
            qty: 1,
            sku: 'BRA001',
            category: 'Innerwear',
            sector: Sector.TEXTILE,
            stockQty: 10,
            costPrice: 100,
            sellingPrice: 135.00,
            unit: 'Pcs',
            tenantId: 'T-DYN-001'
        },
        {
            id: 'ITEM-002',
            name: 'INSKIRT',
            price: 140.00,
            qty: 1,
            sku: 'INS001',
            category: 'Innerwear',
            sector: Sector.TEXTILE,
            stockQty: 10,
            costPrice: 100,
            sellingPrice: 140.00,
            unit: 'Pcs',
            tenantId: 'T-DYN-001'
        },
        {
            id: 'ITEM-003',
            name: 'INSKIRT',
            price: 175.00,
            qty: 1,
            sku: 'INS002',
            category: 'Innerwear',
            sector: Sector.TEXTILE,
            stockQty: 10,
            costPrice: 120,
            sellingPrice: 175.00,
            unit: 'Pcs',
            tenantId: 'T-DYN-001'
        }
    ];

    if (!itemOverrides || itemOverrides.length === 0) {
        return defaults;
    }

    return itemOverrides.map((override, index) => {
        const fallback = defaults[index % defaults.length];
        return { ...fallback, ...override };
    });
};

/**
 * Builds a test Sale object with calculated totals and optional overrides.
 */
export const buildDynamicSale = (overrides?: Partial<Sale>, itemOverrides?: Partial<CartItem>[]): Sale => {
    const items = buildDynamicItems(itemOverrides);
    const calculatedTotal = items.reduce((sum, item) => sum + (item.price * item.qty), 0);

    return {
        id: 'A42-206704',
        date: new Date().toISOString(),
        items,
        total: overrides?.total ?? calculatedTotal,
        customerName: 'KATE',
        customerId: 'CUST-001',
        sector: Sector.TEXTILE,
        branchId: 'B-DYN-001',
        taxMode: TaxMode.INCLUSIVE,
        status: 'COMPLETED',
        paymentStatus: 'PAID',
        ...overrides
    };
};
