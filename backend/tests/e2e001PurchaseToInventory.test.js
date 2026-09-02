import 'reflect-metadata';
import { jest } from '@jest/globals';
import mongoose from 'mongoose';

// E2E-001 - Complete B2B to Inventory (from the QA test-plan doc):
//   1. Create vendor.  2. Create product.  3. Create Purchase Order.  4. Submit PO.
//   5. Approve PO.     6. Send PO to vendor. 7. Receive vendor shipment. 8. Accept qty.
//   9. Create Goods Receipt. 10. Update inventory.
// Expected: PO = Fully/Partially Received; Inventory increased by accepted qty;
// Inventory Transaction (StockLog) created.
//
// This runs the REAL controllers straight from dist - PurchaseController.createPurchase,
// PurchaseController.updatePOStatus (now reachable via the PATCH /api/purchases/:id/status
// route this fix wired up in purchaseRoutes.ts - it existed on the controller before but had
// no route), and GRNController.createGRN - against fakes at the Mongoose I/O boundary
// (Purchase, GRN, Item, Supplier), the same pattern as posControllerCreateInvoice.test.js and
// inventoryServiceReduceStock.test.js. No live MongoDB is reachable from this sandbox, so this
// is the closest thing to a real end-to-end run: every business-logic line these three handlers
// contain executes for real, only the database calls are swapped for controllable fakes.

const mockSupplierFindById = jest.fn();
const mockItemFindById = jest.fn();
const mockItemFindOne = jest.fn();
const mockItemFindByIdAndUpdate = jest.fn();
const mockStockLogCreate = jest.fn();
const mockPurchaseFindOne = jest.fn();
const mockPurchaseInstanceSave = jest.fn(async function () { return this; });
const mockGRNFindOne = jest.fn();
const mockGRNInstanceSave = jest.fn(async function () { return this; });

let capturedPurchase = null;
let capturedGRN = null;

// A fake Mongoose query node that is BOTH chainable (.sort()/.session()) AND directly
// awaitable, since the real controllers use it three different ways:
//   generatePurchaseNumber:      await Purchase.findOne({...}).sort({...})
//   updatePOStatus:              await Purchase.findOne({...})               (bare)
//   GRNController.createGRN:     await Purchase.findOne({...}).session(session)
function chainable(resolvedValue) {
    const node = {
        session: jest.fn(() => Promise.resolve(resolvedValue)),
        sort: jest.fn(() => node),
        then: (resolve, reject) => Promise.resolve(resolvedValue).then(resolve, reject),
        catch: (reject) => Promise.resolve(resolvedValue).catch(reject),
    };
    return node;
}

jest.unstable_mockModule('../dist/modules/purchase/models/Supplier.js', () => ({
    default: { findById: mockSupplierFindById },
}));

jest.unstable_mockModule('../dist/modules/inventory/models/Item.js', () => ({
    default: {
        findById: mockItemFindById,
        findOne: mockItemFindOne,
        findByIdAndUpdate: mockItemFindByIdAndUpdate,
    },
}));

jest.unstable_mockModule('../dist/modules/inventory/models/StockLog.js', () => ({
    default: { create: mockStockLogCreate },
}));

// Not exercised by this scenario (only used when a PO is created with status:'COMPLETED',
// which E2E-001 never does - it walks the DRAFT->SUBMITTED->APPROVED->SENT_TO_VENDOR path) but
// PurchaseController imports them unconditionally at module load, so they need to resolve.
jest.unstable_mockModule('../dist/modules/finance/models/Bill.js', () => ({
    default: { countDocuments: jest.fn(), aggregate: jest.fn() },
}));
jest.unstable_mockModule('../dist/modules/finance/models/JournalEntry.js', () => ({
    default: function JournalEntry() {},
}));
jest.unstable_mockModule('../dist/modules/core/models/Tenant.js', () => ({
    default: { findOne: jest.fn() },
}));

// Purchase needs BOTH a constructor (createPurchase does `new Purchase(...)`) and a static
// findOne (the number-uniqueness probe, updatePOStatus's lookup, and GRNController's lookup).
// Since there's no real DB, the SAME instance `new Purchase()` builds is what every later
// findOne() call returns - so status mutations made by updatePOStatus (and later by
// GRNController) persist into the next stage exactly like a real persisted document would.
function MockPurchase(doc) {
    Object.assign(this, doc);
    this._id = doc._id || 'PURCHASE_ID_1';
    this.items = doc.items || [];
    this.save = mockPurchaseInstanceSave;
    capturedPurchase = this;
}
MockPurchase.findOne = mockPurchaseFindOne;

jest.unstable_mockModule('../dist/modules/purchase/models/Purchase.js', () => ({
    default: MockPurchase,
}));

function MockGRN(doc) {
    Object.assign(this, doc);
    this._id = doc._id || 'GRN_ID_1';
    this.save = mockGRNInstanceSave;
    capturedGRN = this;
}
MockGRN.findOne = mockGRNFindOne;

jest.unstable_mockModule('../dist/modules/purchase/models/GRN.js', () => ({
    default: MockGRN,
}));

const { createPurchase, updatePOStatus } = await import('../dist/modules/purchase/controllers/PurchaseController.js');
const { createGRN } = await import('../dist/modules/purchase/controllers/GRNController.js');

const tenantId = 'TENANT_1';
const userId = 'USER_1';
const vendorId = 'VENDOR_1';
const productId = 'PRODUCT_1';

function makeRes() {
    return {
        statusCode: undefined,
        jsonBody: undefined,
        status(code) { this.statusCode = code; return this; },
        json(body) { this.jsonBody = body; return this; },
    };
}

let fakeSession;

beforeEach(() => {
    capturedPurchase = null;
    capturedGRN = null;
    [
        mockSupplierFindById, mockItemFindById, mockItemFindOne, mockItemFindByIdAndUpdate,
        mockStockLogCreate, mockPurchaseFindOne, mockPurchaseInstanceSave, mockGRNFindOne,
        mockGRNInstanceSave,
    ].forEach((fn) => fn.mockReset());

    fakeSession = {
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(async () => {}),
        abortTransaction: jest.fn(async () => {}),
        endSession: jest.fn(),
    };
    // Both createPurchase and createGRN call mongoose.startSession() directly; a real one needs
    // a live DB connection, so the shared mongoose singleton's method is stubbed for this test.
    mongoose.startSession = jest.fn(async () => fakeSession);

    // Step 1: vendor already exists (an active supplier with no credit-limit constraint).
    mockSupplierFindById.mockReturnValue(chainable({
        _id: vendorId, businessName: 'Acme Textiles', shortCode: 'ACM', status: 'active', creditLimit: 0,
    }));

    // Step 2: product already exists with 50 units on hand at a WAC cost of 100.
    const productDoc = { _id: productId, name: 'Cotton Fabric Roll', stockQty: 50, costPrice: 100, batches: [] };
    mockItemFindById.mockReturnValue(chainable(productDoc));
    mockItemFindOne.mockReturnValue(chainable(productDoc));
    mockItemFindByIdAndUpdate.mockReturnValue(chainable({}));
    mockStockLogCreate.mockResolvedValue([{}]);

    mockPurchaseFindOne.mockImplementation((query) => {
        if (query && Object.prototype.hasOwnProperty.call(query, 'purchaseNumber')) {
            // generatePurchaseNumber's uniqueness probe - no prior PO with today's prefix.
            return chainable(null);
        }
        // updatePOStatus (bare await) and GRNController (.session()-chained) both look the PO
        // up by _id/tenantId - hand back whatever createPurchase most recently constructed, with
        // every status mutation applied so far.
        return chainable(capturedPurchase);
    });

    mockGRNFindOne.mockReturnValue(chainable(null)); // no prior GRN for this tenant -> ...-0001
});

describe('E2E-001 — Complete B2B to Inventory (real controllers, mocked DB boundary)', () => {
    test('vendor -> product -> PO -> submit -> approve -> send to vendor -> GRN -> inventory', async () => {
        // --- Steps 1-3: vendor + product already exist (mocked above); create the PO ---
        const createReq = {
            user: { _id: userId, tenantId },
            body: {
                p_vendor_id: vendorId,
                details: {
                    date: '2026-08-20',
                    subtotal: 5000,
                    tax_amount: 250,
                    discount_amount: 0,
                    shipping_amount: 200,
                    total_amount: 5450,
                    notes: 'E2E-001 test PO',
                },
                items: [
                    { product_id: productId, product_name: 'Cotton Fabric Roll', quantity: 100, rate: 50, tax_percent: 5, amount: 5000 },
                ],
                // status omitted -> PurchaseController defaults new POs to 'DRAFT'
            },
        };
        const createRes = makeRes();
        await createPurchase(createReq, createRes);

        expect(createRes.statusCode).toBe(201);
        expect(createRes.jsonBody?.success).toBe(true);
        expect(capturedPurchase).not.toBeNull();
        expect(capturedPurchase.status).toBe('DRAFT');
        const poId = capturedPurchase._id;

        // A DRAFT PO must not have touched inventory yet.
        expect(mockItemFindByIdAndUpdate).not.toHaveBeenCalled();
        expect(mockStockLogCreate).not.toHaveBeenCalled();

        // --- Step 4: Submit PO ---
        await updatePOStatus(
            { params: { id: poId }, body: { status: 'SUBMITTED' }, user: { _id: userId, tenantId } },
            makeRes()
        );
        expect(capturedPurchase.status).toBe('SUBMITTED');

        // --- Step 5: Approve PO ---
        const approveRes = makeRes();
        await updatePOStatus(
            { params: { id: poId }, body: { status: 'APPROVED' }, user: { _id: userId, tenantId } },
            approveRes
        );
        expect(capturedPurchase.status).toBe('APPROVED');
        expect(capturedPurchase.approvedBy).toBe(userId);
        expect(capturedPurchase.approvedAt).toBeInstanceOf(Date);
        expect(approveRes.jsonBody?.purchase?.status).toBe('APPROVED');

        // --- Step 6: Send PO to vendor ---
        await updatePOStatus(
            { params: { id: poId }, body: { status: 'SENT_TO_VENDOR' }, user: { _id: userId, tenantId } },
            makeRes()
        );
        expect(capturedPurchase.status).toBe('SENT_TO_VENDOR');
        expect(capturedPurchase.sentToVendorAt).toBeInstanceOf(Date);

        // --- Steps 7-10: Receive vendor shipment, accept quantity (95 received, 5 damaged ->
        // 90 accepted out of 100 ordered - a partial receipt), create the Goods Receipt, and let
        // GRNController move inventory for the accepted quantity. ---
        const grnReq = {
            user: { _id: userId, tenantId },
            body: {
                purchaseId: poId,
                deliveryNoteNo: 'DN-9001',
                items: [
                    { productId, productName: 'Cotton Fabric Roll', receivedQty: 95, damagedQty: 5, rejectedQty: 0 },
                ],
            },
        };
        const grnRes = makeRes();
        await createGRN(grnReq, grnRes);

        expect(grnRes.statusCode).toBe(201);
        expect(grnRes.jsonBody?.success).toBe(true);

        // Expected Result 1: PO = Fully/Partially Received.
        // 90 accepted out of 100 ordered -> PARTIALLY_RECEIVED (not fully, since 10 units
        // were damaged/short and never entered stock).
        expect(capturedPurchase.status).toBe('PARTIALLY_RECEIVED');
        expect(capturedGRN).not.toBeNull();
        expect(capturedGRN.status).toBe('PARTIAL');
        expect(capturedGRN.items[0]).toMatchObject({ orderedQty: 100, receivedQty: 95, acceptedQty: 90, damagedQty: 5 });

        // Expected Result 2: Inventory = Increased by Accepted Quantity (90, not the 95
        // received - the 5 damaged units correctly never reach stockQty).
        expect(mockItemFindByIdAndUpdate).toHaveBeenCalledTimes(1);
        const [updatedItemId, updatePayload] = mockItemFindByIdAndUpdate.mock.calls[0];
        expect(updatedItemId).toBe(productId);
        expect(updatePayload.$inc).toEqual({ stockQty: 90 });
        // WAC cost also recalculated (existing 50 units @ 100 blended with 90 new units at the
        // GRN's landed rate) - just assert it moved off the original 100, the exact math is
        // InventoryService's own responsibility and already covered by
        // inventoryServiceReduceStock.test.js's WAC-adjacent addStock logic.
        expect(updatePayload.$set.costPrice).not.toBe(100);

        // Expected Result 3: Inventory Transaction = Created (the StockLog audit entry).
        expect(mockStockLogCreate).toHaveBeenCalledTimes(1);
        const [logDocs, logOpts] = mockStockLogCreate.mock.calls[0];
        expect(logDocs[0]).toMatchObject({ itemId: productId, tenantId, type: 'PURCHASE', delta: 90 });
        expect(logOpts).toEqual({ session: fakeSession });

        // Both transactions (createPurchase's and createGRN's) ran to completion, never aborted.
        expect(fakeSession.commitTransaction).toHaveBeenCalled();
        expect(fakeSession.abortTransaction).not.toHaveBeenCalled();
        expect(fakeSession.endSession).toHaveBeenCalled();
    });

    test('a fully-accepted receipt completes the PO (Fully Received branch of the expected result)', async () => {
        const createReq = {
            user: { _id: userId, tenantId },
            body: {
                p_vendor_id: vendorId,
                details: { date: '2026-08-20', subtotal: 1000, tax_amount: 50, shipping_amount: 0, total_amount: 1050 },
                items: [{ product_id: productId, product_name: 'Cotton Fabric Roll', quantity: 20, rate: 50, tax_percent: 5, amount: 1000 }],
            },
        };
        await createPurchase(createReq, makeRes());
        const poId = capturedPurchase._id;

        await updatePOStatus({ params: { id: poId }, body: { status: 'SUBMITTED' }, user: { _id: userId, tenantId } }, makeRes());
        await updatePOStatus({ params: { id: poId }, body: { status: 'APPROVED' }, user: { _id: userId, tenantId } }, makeRes());
        await updatePOStatus({ params: { id: poId }, body: { status: 'SENT_TO_VENDOR' }, user: { _id: userId, tenantId } }, makeRes());

        const grnRes = makeRes();
        await createGRN({
            user: { _id: userId, tenantId },
            body: {
                purchaseId: poId,
                items: [{ productId, productName: 'Cotton Fabric Roll', receivedQty: 20, damagedQty: 0, rejectedQty: 0 }],
            },
        }, grnRes);

        expect(grnRes.statusCode).toBe(201);
        expect(capturedPurchase.status).toBe('COMPLETED');
        expect(capturedGRN.status).toBe('ACCEPTED');
        expect(mockItemFindByIdAndUpdate.mock.calls[0][1].$inc).toEqual({ stockQty: 20 });
    });

    test('cannot create a GRN against a cancelled PO', async () => {
        const createReq = {
            user: { _id: userId, tenantId },
            body: {
                p_vendor_id: vendorId,
                details: { date: '2026-08-20', subtotal: 1000, tax_amount: 0, shipping_amount: 0, total_amount: 1000 },
                items: [{ product_id: productId, product_name: 'Cotton Fabric Roll', quantity: 10, rate: 100, tax_percent: 0, amount: 1000 }],
            },
        };
        await createPurchase(createReq, makeRes());
        const poId = capturedPurchase._id;
        await updatePOStatus({ params: { id: poId }, body: { status: 'CANCELLED' }, user: { _id: userId, tenantId } }, makeRes());

        const grnRes = makeRes();
        await createGRN({
            user: { _id: userId, tenantId },
            body: { purchaseId: poId, items: [{ productId, productName: 'Cotton Fabric Roll', receivedQty: 10 }] },
        }, grnRes);

        expect(grnRes.statusCode).toBe(500);
        expect(grnRes.jsonBody?.message).toMatch(/cancelled Purchase Order/i);
        // Nothing should have moved.
        expect(mockItemFindByIdAndUpdate).not.toHaveBeenCalled();
        expect(fakeSession.abortTransaction).toHaveBeenCalled();
    });
});
