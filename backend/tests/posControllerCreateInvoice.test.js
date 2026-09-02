import 'reflect-metadata';
import { jest } from '@jest/globals';
import mongoose from 'mongoose';

// End-to-end (mocked-DB) test of the actual B2C checkout endpoint handler:
// POST /api/pos/invoice -> PosController.createInvoice.
//
// A live MongoDB isn't reachable from this sandbox, so the Mongoose model layer is swapped for
// fakes at the same boundary a real DB would sit behind - everything above that boundary
// (createInvoice itself, the real InventoryService, the real InventoryRepository) runs
// unmodified, straight from dist. This is what proves the fix end to end: the checkout handler
// now reduces stock through the transactional, audited path instead of the old raw decrement,
// and does so atomically with invoice + cashbank creation.

const mockItemFindOne = jest.fn();
const mockItemFindByIdAndUpdate = jest.fn();
const mockStockLogCreate = jest.fn();
const mockInvoiceFindOne = jest.fn();
const mockInvoiceCreate = jest.fn();
const mockCustomerFindOne = jest.fn();
const mockCashbankCreate = jest.fn();
const mockBankAccountFindOneAndUpdate = jest.fn();
const mockLoyaltyEarnPoints = jest.fn();
const mockLoyaltyRedeemPoints = jest.fn();

jest.unstable_mockModule('../dist/modules/inventory/models/Item.js', () => ({
    default: { findOne: mockItemFindOne, findByIdAndUpdate: mockItemFindByIdAndUpdate },
}));
jest.unstable_mockModule('../dist/modules/inventory/models/StockLog.js', () => ({
    default: { create: mockStockLogCreate },
}));
jest.unstable_mockModule('../dist/modules/sales/models/Invoice.js', () => ({
    default: { findOne: mockInvoiceFindOne, create: mockInvoiceCreate },
}));
jest.unstable_mockModule('../dist/modules/crm/models/Customer.js', () => ({
    default: { findOne: mockCustomerFindOne },
}));
jest.unstable_mockModule('../dist/modules/finance/models/CashbankTransaction.js', () => ({
    default: { create: mockCashbankCreate },
}));
jest.unstable_mockModule('../dist/modules/finance/models/BankAccount.js', () => ({
    default: { findOneAndUpdate: mockBankAccountFindOneAndUpdate },
}));
jest.unstable_mockModule('../dist/modules/crm/services/LoyaltyService.js', () => ({
    LoyaltyService: { earnPoints: mockLoyaltyEarnPoints, redeemPoints: mockLoyaltyRedeemPoints },
}));

const { createInvoice } = await import('../dist/modules/sales/controllers/PosController.js');

const tenantId = 'TENANT_1';
const itemId = '507f1f77bcf86cd799439011';
const customerId = '507f1f77bcf86cd799439099';
const userId = '507f1f77bcf86cd799439001';

function makeRes() {
    return {
        statusCode: undefined,
        jsonBody: undefined,
        status(code) { this.statusCode = code; return this; },
        json(body) { this.jsonBody = body; return this; },
    };
}

function chainable(resolvedValue) {
    const node = {
        session: jest.fn(() => Promise.resolve(resolvedValue)),
        sort: jest.fn(() => node),
    };
    return node;
}

let fakeSession;

beforeEach(() => {
    mockItemFindOne.mockReset();
    mockItemFindByIdAndUpdate.mockReset();
    mockStockLogCreate.mockReset();
    mockInvoiceFindOne.mockReset();
    mockInvoiceCreate.mockReset();
    mockCustomerFindOne.mockReset();
    mockCashbankCreate.mockReset();
    mockBankAccountFindOneAndUpdate.mockReset();
    mockLoyaltyEarnPoints.mockReset();
    mockLoyaltyRedeemPoints.mockReset();

    fakeSession = {
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(async () => {}),
        abortTransaction: jest.fn(async () => {}),
        endSession: jest.fn(),
    };
    // PosController calls mongoose.startSession() directly; a real one needs a live DB
    // connection, so the same shared mongoose singleton's method is stubbed for this test.
    mongoose.startSession = jest.fn(async () => fakeSession);

    mockItemFindByIdAndUpdate.mockReturnValue(chainable({}));
    mockStockLogCreate.mockResolvedValue([{}]);
    mockInvoiceFindOne.mockReturnValue(chainable(null)); // no prior invoice -> INV-...-00001
    mockCashbankCreate.mockResolvedValue([{ _id: 'CASHBANK_1' }]);
    mockLoyaltyEarnPoints.mockResolvedValue(0);
});

describe('PosController.createInvoice — POST /api/pos/invoice end to end (mocked DB)', () => {
    test('a cash sale reduces stock through InventoryService and persists an invoice + cashbank entry', async () => {
        const item = { _id: itemId, name: 'Basmati Rice 5kg', stockQty: 20, batches: [] };
        mockItemFindOne.mockReturnValue(chainable(item));

        const customer = {
            _id: customerId, dues: 0, points: 0, totalSpend: 0, totalOrders: 0,
            averageOrderValue: 0, firstPurchaseDate: null, lastPurchaseDate: null,
            save: jest.fn(async () => {}),
        };
        mockCustomerFindOne.mockReturnValue(chainable(customer));

        const newInvoiceDoc = { _id: 'INVOICE_1', invoiceNo: 'INV-2026-00001' };
        mockInvoiceCreate.mockResolvedValue([newInvoiceDoc]);

        const req = {
            tenantId,
            user: { _id: userId, name: 'Cashier One' },
            body: {
                customerId,
                items: [{ item: itemId, name: 'Basmati Rice 5kg', quantity: 3, price: 200, tax: 5 }],
                paymentMethod: 'cash',
                paidAmount: 630, // 3 * 200 = 600 + 5% tax(30) = 630
                changeReturned: 0,
            },
        };
        const res = makeRes();

        await createInvoice(req, res);

        // Transaction lifecycle: began, committed, never aborted, always ended.
        expect(fakeSession.startTransaction).toHaveBeenCalled();
        expect(fakeSession.commitTransaction).toHaveBeenCalled();
        expect(fakeSession.abortTransaction).not.toHaveBeenCalled();
        expect(fakeSession.endSession).toHaveBeenCalled();

        // Stock was reduced through InventoryService.reduceStock (not a raw stockQty -= write) -
        // this is the actual regression the B2C fix closes.
        expect(mockItemFindByIdAndUpdate).toHaveBeenCalledTimes(1);
        const [, updatePayload] = mockItemFindByIdAndUpdate.mock.calls[0];
        expect(updatePayload.$inc).toEqual({ stockQty: -3 });

        // Audit trail written with a schema-valid type (see stockLogEnum.test.js).
        expect(mockStockLogCreate).toHaveBeenCalledTimes(1);
        expect(mockStockLogCreate.mock.calls[0][0][0]).toMatchObject({ type: 'SALES', delta: -3 });

        // Invoice persisted with the right totals and marked paid.
        expect(mockInvoiceCreate).toHaveBeenCalledTimes(1);
        const [invoiceDocs] = mockInvoiceCreate.mock.calls[0];
        expect(invoiceDocs[0]).toMatchObject({
            subtotal: 600,
            tax: 30,
            totalAmount: 630,
            paidAmount: 630,
            paymentStatus: 'paid',
        });

        // Cashbank money-in entry recorded against the new invoice.
        expect(mockCashbankCreate).toHaveBeenCalledTimes(1);
        expect(mockCashbankCreate.mock.calls[0][0][0]).toMatchObject({ type: 'in', amount: 630 });

        // HTTP response.
        expect(res.statusCode).toBe(201);
        expect(res.jsonBody.success).toBe(true);
    });

    test('insufficient stock aborts the whole transaction — no invoice, no cashbank entry, stock untouched', async () => {
        const item = { _id: itemId, name: 'Basmati Rice 5kg', stockQty: 1, batches: [] };
        mockItemFindOne.mockReturnValue(chainable(item));

        const req = {
            tenantId,
            user: { _id: userId, name: 'Cashier One' },
            body: {
                items: [{ item: itemId, name: 'Basmati Rice 5kg', quantity: 5, price: 200, tax: 0 }],
                paymentMethod: 'cash',
                paidAmount: 1000,
                changeReturned: 0,
            },
        };
        const res = makeRes();

        await createInvoice(req, res);

        expect(fakeSession.abortTransaction).toHaveBeenCalled();
        expect(fakeSession.commitTransaction).not.toHaveBeenCalled();

        expect(mockItemFindByIdAndUpdate).not.toHaveBeenCalled();
        expect(mockStockLogCreate).not.toHaveBeenCalled();
        expect(mockInvoiceCreate).not.toHaveBeenCalled();
        expect(mockCashbankCreate).not.toHaveBeenCalled();

        // Regression check for the other PosController fix in this change: the error handler now
        // forwards AppError's real statusCode (400) instead of always answering 500.
        expect(res.statusCode).toBe(400);
        expect(res.jsonBody.success).toBe(false);
        expect(res.jsonBody.message).toMatch(/Insufficient stock/i);
    });

    test('an empty cart is rejected before any session work happens', async () => {
        const req = { tenantId, user: { _id: userId, name: 'Cashier One' }, body: { items: [] } };
        const res = makeRes();

        await createInvoice(req, res);

        expect(res.statusCode).toBe(400);
        expect(res.jsonBody.message).toMatch(/Cart is empty/i);
        expect(mockItemFindOne).not.toHaveBeenCalled();
    });
});
