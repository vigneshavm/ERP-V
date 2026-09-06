import { expect } from 'expect';

// Mirrors the pure computeCountedCash logic in PettyCashController
// (src/modules/finance/controllers/PettyCashController.ts) without importing it directly, since
// that file pulls in Mongoose models that need a live Mongo connection to construct -- same
// approach as dueDate.test.ts / comboOfferPricing.test.js / serializedUnitValidation.test.js.

const CASH_DENOMINATIONS = [2000, 500, 200, 100, 50, 20, 10];

function computeCountedCash(d) {
    const notesTotal = CASH_DENOMINATIONS.reduce((sum, denom) => {
        const key = `d${denom}`;
        return sum + denom * (Number(d[key]) || 0);
    }, 0);
    return notesTotal + (Number(d.coinsAmount) || 0);
}

function computeVariance(countedCash, expectedCash) {
    return countedCash - expectedCash;
}

describe('Petty Cash Denomination Count', () => {
    it('sums each denomination count by its face value', () => {
        const denominations = { d2000: 1, d500: 2, d200: 0, d100: 5, d50: 0, d20: 0, d10: 0, coinsAmount: 0 };
        // 2000*1 + 500*2 + 100*5 = 2000 + 1000 + 500 = 3500
        expect(computeCountedCash(denominations)).toBe(3500);
    });

    it('includes the lump-sum coins amount in the total', () => {
        const denominations = { d2000: 0, d500: 1, d200: 0, d100: 0, d50: 0, d20: 0, d10: 0, coinsAmount: 47.5 };
        expect(computeCountedCash(denominations)).toBe(547.5);
    });

    it('treats missing/undefined denomination keys as zero', () => {
        const denominations = { d500: 1 };
        expect(computeCountedCash(denominations)).toBe(500);
    });

    it('returns 0 for an all-empty count', () => {
        expect(computeCountedCash({})).toBe(0);
    });

    it('computes a positive variance as a cash surplus', () => {
        expect(computeVariance(5200, 5000)).toBe(200);
    });

    it('computes a negative variance as a cash shortage', () => {
        expect(computeVariance(4800, 5000)).toBe(-200);
    });
});
