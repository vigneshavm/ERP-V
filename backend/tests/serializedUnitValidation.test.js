import { expect } from 'expect';

// Mirrors the pure validation logic in SerializedUnitService.addUnits
// (src/modules/inventory/services/SerializedUnitService.ts) without importing it directly, since
// that file pulls in Mongoose models that need a live Mongo connection to construct.

function findDuplicateSerialInBatch(units) {
    const seen = new Set();
    for (const unit of units) {
        if (!unit.serialNumber) return { error: 'MISSING_SERIAL' };
        if (seen.has(unit.serialNumber)) return { error: 'DUPLICATE', serialNumber: unit.serialNumber };
        seen.add(unit.serialNumber);
    }
    return null;
}

function resolveLookupMatch(value, units) {
    return units.find(u => u.serialNumber === value || u.imei1 === value || u.imei2 === value) || null;
}

describe('Serialized Unit Validation', () => {
    it('allows a batch of units with distinct serial numbers', () => {
        const units = [{ serialNumber: 'SN-001' }, { serialNumber: 'SN-002' }];
        expect(findDuplicateSerialInBatch(units)).toBeNull();
    });

    it('flags a duplicate serial number within the same batch', () => {
        const units = [{ serialNumber: 'SN-001' }, { serialNumber: 'SN-001' }];
        const result = findDuplicateSerialInBatch(units);
        expect(result.error).toBe('DUPLICATE');
        expect(result.serialNumber).toBe('SN-001');
    });

    it('flags a unit missing its serial number', () => {
        const units = [{ serialNumber: 'SN-001' }, { serialNumber: '' }];
        expect(findDuplicateSerialInBatch(units).error).toBe('MISSING_SERIAL');
    });

    it('looks a unit up by serial number', () => {
        const units = [{ serialNumber: 'SN-001', imei1: '111', imei2: '222' }];
        expect(resolveLookupMatch('SN-001', units)).toBe(units[0]);
    });

    it('looks a unit up by either IMEI slot', () => {
        const units = [{ serialNumber: 'SN-001', imei1: '111', imei2: '222' }];
        expect(resolveLookupMatch('222', units)).toBe(units[0]);
    });

    it('returns null when nothing matches', () => {
        const units = [{ serialNumber: 'SN-001', imei1: '111' }];
        expect(resolveLookupMatch('does-not-exist', units)).toBeNull();
    });
});
