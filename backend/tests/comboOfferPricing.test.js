import { expect } from 'expect';

// Mirrors the pure computation in ComboOfferService (src/modules/combo/services/ComboOfferService.ts)
// without importing it directly, since that file pulls in Mongoose models and tsyringe DI that
// need a live Mongo connection to construct -- same approach as dueDate.test.ts.

function computeRegularPrice(items, priceById) {
    return items.reduce((sum, line) => sum + (priceById[line.itemId] || 0) * line.quantity, 0);
}

function computeDiscountPercent(regularPrice, offerPrice) {
    if (!regularPrice) return 0;
    return Math.max(0, Math.round(((regularPrice - offerPrice) / regularPrice) * 10000) / 100);
}

function isOfferPriceValid(offerPrice, regularPrice) {
    return offerPrice <= regularPrice;
}

describe('Combo Offer Pricing', () => {
    const priceById = { 'item-1': 500, 'item-2': 300 };

    it('sums each line item price by quantity for the regular price', () => {
        const items = [{ itemId: 'item-1', quantity: 2 }, { itemId: 'item-2', quantity: 1 }];
        expect(computeRegularPrice(items, priceById)).toBe(1300); // 500*2 + 300*1
    });

    it('computes the discount percent between regular and offer price', () => {
        expect(computeDiscountPercent(1300, 999)).toBe(23.15);
    });

    it('returns 0% discount when regular price is 0 (guards against divide-by-zero)', () => {
        expect(computeDiscountPercent(0, 0)).toBe(0);
    });

    it('never reports a negative discount even if offer price somehow exceeds regular price', () => {
        expect(computeDiscountPercent(1000, 1200)).toBe(0);
    });

    it('accepts an offer price at or below the regular price', () => {
        expect(isOfferPriceValid(999, 1300)).toBe(true);
        expect(isOfferPriceValid(1300, 1300)).toBe(true);
    });

    it('rejects an offer price above the regular price', () => {
        expect(isOfferPriceValid(1301, 1300)).toBe(false);
    });
});
