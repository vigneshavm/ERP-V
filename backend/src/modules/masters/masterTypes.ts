// Shared list of "simple master" list-types managed through one generic model/CRUD stack instead
// of a dozen-plus near-identical ones. Covers the taxonomy layer flagged as thin/missing against
// Textilesoft: customer groups & relationship types, employee structure, transaction/cash/payment/
// booking groups, GST type/group, and textile-specific product descriptors.
export const MASTER_TYPES = [
    'CUSTOMER_GROUP',
    'CUSTOMER_RELATIONSHIP_TYPE',
    'EMPLOYEE_CATEGORY',
    'EMPLOYEE_GROUP',
    'EMPLOYEE_SECTION',
    'TRANSACTION_GROUP',
    'TRANSACTION_NAME',
    'CASH_GROUP',
    'CASH_NAME',
    'PAYMENT_TYPE',
    'BOOKING_GROUP',
    'EXPENSE_GROUP',
    'GST_TYPE',
    'GST_GROUP',
    'PRODUCT_DESIGN',
    'PRODUCT_PATTERN',
    'PRODUCT_FASHION_NAME',
    'PRODUCT_MODEL_NO',
    'PRODUCT_GROUP',
    'PRODUCT_SUBGROUP',
    'PRODUCT_BRAND',
    'PRODUCT_COLOR',
    'PRODUCT_SIZE',
    'PRODUCT_RACK',
    'UNIT',
    'WAREHOUSE',
] as const;

export type MasterType = typeof MASTER_TYPES[number];

export const isMasterType = (val: string): val is MasterType =>
    (MASTER_TYPES as readonly string[]).includes(val);

// Two-tier types: the child type's rows must carry a parentId pointing at a row of the mapped
// parent type (e.g. a TRANSACTION_NAME row belongs under a TRANSACTION_GROUP row) -- mirrors
// Textilesoft's TransactionGroup+TransactionNameEntry / CashGroupName+CashNameEntry pairs.
export const PARENT_TYPE_OF: Partial<Record<MasterType, MasterType>> = {
    TRANSACTION_NAME: 'TRANSACTION_GROUP',
    CASH_NAME: 'CASH_GROUP',
    PRODUCT_SUBGROUP: 'PRODUCT_GROUP',
};

// Seeded on first read per tenant (only when that tenant has zero rows of the type) so the
// admin screen and any dependent picker isn't an empty list on day one. CUSTOMER_GROUP mirrors
// the four groups the old CustomerGroups.tsx mock hardcoded, so migrating off the mock doesn't
// change what a tenant sees.
export const DEFAULT_SEEDS: Partial<Record<MasterType, Array<{ name: string; description?: string; meta?: Record<string, any> }>>> = {
    CUSTOMER_GROUP: [
        { name: 'Retail', description: 'Walk-in retail customers', meta: { discountPercent: 0, creditLimit: 5000, paymentTermsDays: 0, color: '#3b82f6' } },
        { name: 'Wholesale', description: 'Bulk purchase customers', meta: { discountPercent: 10, creditLimit: 50000, paymentTermsDays: 30, color: '#8b5cf6' } },
        { name: 'VIP', description: 'Premium loyalty customers', meta: { discountPercent: 15, creditLimit: 100000, paymentTermsDays: 45, color: '#f59e0b' } },
        { name: 'Corporate', description: 'Business accounts', meta: { discountPercent: 12, creditLimit: 200000, paymentTermsDays: 60, color: '#10b981' } },
    ],
    PAYMENT_TYPE: [
        { name: 'Cash' }, { name: 'Card' }, { name: 'UPI' }, { name: 'Cheque' }, { name: 'Bank Transfer' }, { name: 'Credit' },
    ],
    GST_TYPE: [
        { name: 'Regular' }, { name: 'Composition' }, { name: 'Exempt' }, { name: 'SEZ' },
    ],
    UNIT: [
        { name: 'Pcs' }, { name: 'Mtr' }, { name: 'Kg' }, { name: 'Box' }, { name: 'Set' }, { name: 'Pair' },
    ],
    // Matches Item.warehouseId's existing default ('MAIN_WAREHOUSE') so a freshly-seeded tenant's
    // one real warehouse lines up with what items already point at.
    WAREHOUSE: [
        { name: 'Main Warehouse', meta: { code: 'MAIN_WAREHOUSE' } },
    ],
};
