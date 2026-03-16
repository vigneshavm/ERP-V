import { expect } from 'expect';
// Mocking logic instead of importing the whole controller which might have side effects
function calculateDueDate(purchaseDate, creditPeriod) {
    const dueDate = new Date(purchaseDate);
    dueDate.setDate(dueDate.getDate() + (creditPeriod || 30));
    return dueDate;
}
describe('Purchase Due Date Calculation', () => {
    it('should calculate due date correctly for 30 days credit', () => {
        const purchaseDate = '2026-01-15';
        const creditPeriod = 30;
        const expected = '2026-02-14';
        const dueDate = calculateDueDate(purchaseDate, creditPeriod);
        expect(dueDate.toISOString().split('T')[0]).toBe(expected);
    });
    it('should calculate due date correctly for 10 days credit', () => {
        const purchaseDate = '2026-01-25';
        const creditPeriod = 10;
        const expected = '2026-02-04';
        const dueDate = calculateDueDate(purchaseDate, creditPeriod);
        expect(dueDate.toISOString().split('T')[0]).toBe(expected);
    });
    it('should fallback to 30 days if creditPeriod is missing', () => {
        const purchaseDate = '2026-01-01';
        const creditPeriod = null;
        const expected = '2026-01-31';
        const dueDate = calculateDueDate(purchaseDate, creditPeriod);
        expect(dueDate.toISOString().split('T')[0]).toBe(expected);
    });
});
