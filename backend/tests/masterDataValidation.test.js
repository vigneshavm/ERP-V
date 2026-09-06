import { expect } from 'expect';

// Mirrors the pure validation logic in MasterDataService (src/modules/masters/services/
// MasterDataService.ts) without importing it directly, since that file pulls in Mongoose models
// that need a live Mongo connection to construct -- same approach as the other *.test.js files
// in this directory.

const MASTER_TYPES = [
    'CUSTOMER_GROUP', 'CUSTOMER_RELATIONSHIP_TYPE', 'EMPLOYEE_CATEGORY', 'EMPLOYEE_GROUP',
    'EMPLOYEE_SECTION', 'TRANSACTION_GROUP', 'TRANSACTION_NAME', 'CASH_GROUP', 'CASH_NAME',
    'PAYMENT_TYPE', 'BOOKING_GROUP', 'GST_TYPE', 'GST_GROUP', 'PRODUCT_DESIGN', 'PRODUCT_PATTERN',
    'PRODUCT_FASHION_NAME', 'PRODUCT_MODEL_NO', 'PRODUCT_SUBGROUP', 'UNIT',
];
const isMasterType = (val) => MASTER_TYPES.includes(val);

const PARENT_TYPE_OF = { TRANSACTION_NAME: 'TRANSACTION_GROUP', CASH_NAME: 'CASH_GROUP' };

function validateCreate(type, data) {
    if (!isMasterType(type)) return { error: 'UNKNOWN_TYPE' };
    if (!data.name || !String(data.name).trim()) return { error: 'NAME_REQUIRED' };
    const requiredParentType = PARENT_TYPE_OF[type];
    if (requiredParentType && !data.parentId) return { error: 'PARENT_REQUIRED', requiredParentType };
    return null;
}

function isDuplicateName(existingNames, candidateName) {
    const needle = candidateName.trim().toLowerCase();
    return existingNames.some((n) => n.trim().toLowerCase() === needle);
}

describe('Master Data Validation', () => {
    it('rejects an unknown master type', () => {
        expect(validateCreate('NOT_A_TYPE', { name: 'X' }).error).toBe('UNKNOWN_TYPE');
    });

    it('rejects a missing or blank name', () => {
        expect(validateCreate('UNIT', {}).error).toBe('NAME_REQUIRED');
        expect(validateCreate('UNIT', { name: '   ' }).error).toBe('NAME_REQUIRED');
    });

    it('accepts a valid flat-type entry with just a name', () => {
        expect(validateCreate('PAYMENT_TYPE', { name: 'UPI' })).toBeNull();
    });

    it('requires a parentId for a two-tier child type', () => {
        const result = validateCreate('TRANSACTION_NAME', { name: 'Advance Received' });
        expect(result.error).toBe('PARENT_REQUIRED');
        expect(result.requiredParentType).toBe('TRANSACTION_GROUP');
    });

    it('accepts a two-tier child type once parentId is supplied', () => {
        expect(validateCreate('TRANSACTION_NAME', { name: 'Advance Received', parentId: 'grp1' })).toBeNull();
    });

    it('flags a case-insensitive duplicate name within the same type', () => {
        expect(isDuplicateName(['Wholesale', 'VIP'], 'wholesale')).toBe(true);
    });

    it('does not flag a distinct name as a duplicate', () => {
        expect(isDuplicateName(['Wholesale', 'VIP'], 'Retail')).toBe(false);
    });
});
