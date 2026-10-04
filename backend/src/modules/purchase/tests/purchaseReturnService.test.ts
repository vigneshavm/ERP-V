import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { Types } from "mongoose";
import { PurchaseReturnService, CreatePurchaseReturnInput } from "../services/PurchaseReturnService.js";
import type { RequestContext } from "../../../utils/requestContext.js";

/**
 * Business rules of purchase returns, with every collaborator mocked (no database).
 * Tenant isolation of the repository itself is covered separately against a real MongoDB.
 */

const oid = () => new Types.ObjectId();
const tenantId = oid();
const userId = oid();
const ctx: RequestContext = { tenantId, userId, user: { _id: userId, name: "Tester" } as any, requestId: "req-1" };
const supplierId = oid().toString();
const itemA = oid().toString();
const itemB = oid().toString();

type Mocked = Record<string, jest.Mock<(...args: any[]) => any>>;
let purchaseReturnRepository: Mocked;
let debitNoteRepository: Mocked;
let supplierRepository: Mocked;
let grnRepository: Mocked;
let inventoryService: Mocked;
let serializedUnitService: Mocked;
let cashBankService: Mocked;
let service: PurchaseReturnService;

const baseInput = (overrides: Partial<CreatePurchaseReturnInput> = {}): CreatePurchaseReturnInput => ({
    supplierId,
    items: [{ itemId: itemA, productName: "Shirt", quantity: 2, rate: 100, tax: 5 }],
    ...overrides,
});

beforeEach(() => {
    purchaseReturnRepository = {
        nextReturnId: jest.fn(async () => "PR-00007"),
        create: jest.fn(async (data: any) => ({ _id: oid(), ...data })),
        quantityReturnedAgainstGrn: jest.fn(async () => 0),
        list: jest.fn(async () => []),
        findById: jest.fn(async () => null),
        findRawById: jest.fn(async () => null),
        delete: jest.fn(async () => undefined),
    };
    debitNoteRepository = {
        nextNoteId: jest.fn(async () => "DN-000003"),
        create: jest.fn(async (data: any) => ({ _id: oid(), ...data })),
        cancel: jest.fn(async () => ({})),
    };
    supplierRepository = { findRawByIdForTenant: jest.fn(async () => ({ _id: supplierId, businessName: "Acme Textiles" })) };
    grnRepository = { findByIdForTenant: jest.fn(async () => null) };
    inventoryService = {
        bulkAdjustStock: jest.fn(async () => 1),
        reduceStockFromBatch: jest.fn(async () => undefined),
        removeReturnedUnit: jest.fn(async () => undefined),
        restoreReturnedUnit: jest.fn(async () => undefined),
        restoreBatchFromReturn: jest.fn(async () => undefined),
    };
    serializedUnitService = {
        findUnitOfItem: jest.fn(async () => null),
        updateStatus: jest.fn(async () => ({})),
    };
    cashBankService = {
        recordPurchaseReturnRefund: jest.fn(async () => undefined),
        reversePurchaseReturnBankRefund: jest.fn(async () => undefined),
        reversePurchaseReturnCashRefund: jest.fn(async () => undefined),
    };
    service = new PurchaseReturnService(
        purchaseReturnRepository as any,
        debitNoteRepository as any,
        supplierRepository as any,
        grnRepository as any,
        inventoryService as any,
        serializedUnitService as any,
        cashBankService as any,
    );
});

const stockCalls = () =>
    inventoryService.bulkAdjustStock.mock.calls.length +
    inventoryService.reduceStockFromBatch.mock.calls.length +
    inventoryService.removeReturnedUnit.mock.calls.length +
    serializedUnitService.updateStatus.mock.calls.length;

describe("PurchaseReturnService.createPurchaseReturn", () => {
    it("rejects a supplier that is not in the tenant, before touching anything", async () => {
        supplierRepository.findRawByIdForTenant.mockResolvedValueOnce(null);
        await expect(service.createPurchaseReturn(ctx, baseInput())).rejects.toMatchObject({ statusCode: 404, code: "SUPPLIER_NOT_FOUND" });
        expect(supplierRepository.findRawByIdForTenant).toHaveBeenCalledWith(supplierId, tenantId.toString());
        expect(stockCalls()).toBe(0);
        expect(debitNoteRepository.create).not.toHaveBeenCalled();
    });

    it("rejects a GRN that belongs to another supplier", async () => {
        const grnId = oid().toString();
        grnRepository.findByIdForTenant.mockResolvedValueOnce({ _id: grnId, vendorId: oid(), items: [] });
        await expect(service.createPurchaseReturn(ctx, baseInput({ grnId }))).rejects.toMatchObject({ statusCode: 400, code: "GRN_SUPPLIER_MISMATCH" });
        expect(stockCalls()).toBe(0);
    });

    it("validates every item before moving any stock", async () => {
        const grnId = oid();
        grnRepository.findByIdForTenant.mockResolvedValueOnce({
            _id: grnId,
            vendorId: supplierId,
            items: [{ productId: itemB, lotNumber: "LOT-1", acceptedQty: 5 }],
        });
        purchaseReturnRepository.quantityReturnedAgainstGrn.mockResolvedValueOnce(3); // 2 left
        const input = baseInput({
            grnId: grnId.toString(),
            items: [
                { itemId: itemA, productName: "Shirt", quantity: 1, rate: 100 },                          // valid, plain stock
                { itemId: itemB, productName: "Saree", quantity: 3, rate: 500, batchNumber: "LOT-1" },    // exceeds what is left
            ],
        });
        await expect(service.createPurchaseReturn(ctx, input)).rejects.toMatchObject({ statusCode: 400, code: "RETURN_EXCEEDS_RECEIVED" });
        expect(stockCalls()).toBe(0);
    });

    it("counts repeated lines of the same GRN batch together", async () => {
        const grnId = oid();
        grnRepository.findByIdForTenant.mockResolvedValueOnce({
            _id: grnId,
            vendorId: supplierId,
            items: [{ productId: itemB, lotNumber: "LOT-1", acceptedQty: 3 }],
        });
        const line = { itemId: itemB, productName: "Saree", quantity: 2, rate: 500, batchNumber: "LOT-1" };
        await expect(service.createPurchaseReturn(ctx, baseInput({ grnId: grnId.toString(), items: [line, line] })))
            .rejects.toMatchObject({ code: "RETURN_EXCEEDS_RECEIVED" });
        expect(stockCalls()).toBe(0);
    });

    it("refuses a serialized unit that is no longer in stock", async () => {
        serializedUnitService.findUnitOfItem.mockResolvedValueOnce({ serialNumber: "IMEI-1", status: "SOLD" });
        const input = baseInput({ items: [{ itemId: itemA, productName: "Phone", quantity: 1, rate: 9000, serializedUnitId: oid().toString() }] });
        await expect(service.createPurchaseReturn(ctx, input)).rejects.toMatchObject({ statusCode: 400, code: "UNIT_NOT_RETURNABLE" });
        expect(stockCalls()).toBe(0);
    });

    it("takes the stock out, raises an approved debit note for the tenant and saves the linked return", async () => {
        const result: any = await service.createPurchaseReturn(ctx, baseInput({ discount: 10 }));

        // 2 x 100 = 200, 5% tax = 10, less 10 discount = 200
        expect(inventoryService.bulkAdjustStock).toHaveBeenCalledWith([itemA], 2, "SUBTRACT", tenantId.toString(), ctx.user);

        const debitNote: any = debitNoteRepository.create.mock.calls[0][0];
        expect(debitNote).toMatchObject({
            noteId: "DN-000003",
            vendorName: "Acme Textiles",
            reason: "RETURN",
            status: "APPROVED",
            totalAmount: 200,
            createdBy: String(userId),
        });
        expect(debitNote.items[0]).toMatchObject({ name: "Shirt", qty: 2, amount: 210 });

        expect(result).toMatchObject({ returnId: "PR-00007", tenantId, subtotal: 200, taxAmount: 10, discountAmount: 10, totalAmount: 200, refundMethod: "credit" });
        expect(String(result.debitNoteId)).toBeTruthy();
        expect(cashBankService.recordPurchaseReturnRefund).toHaveBeenCalledWith(
            expect.objectContaining({ refundMethod: "credit", amount: 200, returnId: "PR-00007" }),
        );
    });

    it("treats a missing tax rate as 0 instead of producing NaN", async () => {
        const result: any = await service.createPurchaseReturn(ctx, baseInput({ items: [{ itemId: itemA, productName: "Shirt", quantity: 3, rate: 50 }] }));
        expect(result.taxAmount).toBe(0);
        expect(result.totalAmount).toBe(150);
    });

    it("uses the GRN batch path for batch-scoped lines", async () => {
        const grnId = oid();
        grnRepository.findByIdForTenant.mockResolvedValueOnce({
            _id: grnId,
            vendorId: supplierId,
            items: [{ productId: itemB, lotNumber: "LOT-9", acceptedQty: 10 }],
        });
        await service.createPurchaseReturn(ctx, baseInput({
            grnId: grnId.toString(),
            items: [{ itemId: itemB, productName: "Saree", quantity: 4, rate: 500, batchNumber: "LOT-9" }],
        }));
        expect(inventoryService.reduceStockFromBatch).toHaveBeenCalledWith(itemB, 4, "LOT-9", tenantId.toString(), ctx.user, "PURCHASE_RETURN");
        expect(inventoryService.bulkAdjustStock).not.toHaveBeenCalled();
    });
});

describe("PurchaseReturnService.deletePurchaseReturn", () => {
    it("404s when the return is not visible to the caller", async () => {
        await expect(service.deletePurchaseReturn(ctx, oid().toString())).rejects.toMatchObject({ statusCode: 404, code: "PURCHASE_RETURN_NOT_FOUND" });
        expect(purchaseReturnRepository.delete).not.toHaveBeenCalled();
    });

    it("reverses a bank refund before deleting", async () => {
        const id = oid().toString();
        const bankAccount = oid();
        purchaseReturnRepository.findRawById.mockResolvedValueOnce({ _id: id, returnId: "PR-00002", refundMethod: "bank_transfer", bankAccount, totalAmount: 750 });
        await service.deletePurchaseReturn(ctx, id);
        expect(cashBankService.reversePurchaseReturnBankRefund).toHaveBeenCalledWith({ bankAccountId: bankAccount, amount: 750, returnId: "PR-00002", userId });
        expect(purchaseReturnRepository.delete).toHaveBeenCalledWith({ tenantId, userId }, id);
    });

    it("fully reverses: stock back by the same route, debit note cancelled, cash refund reversed", async () => {
        const id = oid().toString();
        const unitId = oid();
        const debitNoteId = oid();
        const grnId = oid();
        const supplier = oid();
        serializedUnitService.findUnitOfItem.mockResolvedValueOnce({ serialNumber: "IMEI-7", status: "RETURNED" });
        purchaseReturnRepository.findRawById.mockResolvedValueOnce({
            _id: id, returnId: "PR-00011", refundMethod: "cash", totalAmount: 1300, debitNoteId, grnId, supplier,
            items: [
                { itemId: itemA, quantity: 2, rate: 100 },                                   // plain quantity
                { itemId: itemB, quantity: 1, rate: 500, batchNumber: "LOT-3" },             // GRN batch
                { itemId: itemA, quantity: 1, rate: 600, serializedUnitId: unitId },         // serialized unit
            ],
        });

        await service.deletePurchaseReturn(ctx, id);

        expect(inventoryService.bulkAdjustStock).toHaveBeenCalledWith([itemA], 2, "ADD", tenantId.toString(), ctx.user);
        expect(inventoryService.restoreBatchFromReturn).toHaveBeenCalledWith(itemB, 1, "LOT-3", 500, supplier, tenantId, userId);
        expect(serializedUnitService.updateStatus).toHaveBeenCalledWith(String(unitId), tenantId.toString(), "IN_STOCK");
        expect(inventoryService.restoreReturnedUnit).toHaveBeenCalledWith(itemA, tenantId, "IMEI-7", userId);
        expect(debitNoteRepository.cancel).toHaveBeenCalledWith(tenantId, debitNoteId, expect.stringContaining("PR-00011"));
        expect(cashBankService.reversePurchaseReturnCashRefund).toHaveBeenCalledWith({ amount: 1300, returnId: "PR-00011", userId });
        expect(purchaseReturnRepository.delete).toHaveBeenCalled();
    });

    it("refuses to reverse when a returned unit has since left RETURNED status, and changes nothing", async () => {
        serializedUnitService.findUnitOfItem.mockResolvedValueOnce({ serialNumber: "IMEI-8", status: "SOLD" });
        purchaseReturnRepository.findRawById.mockResolvedValueOnce({
            _id: "x", returnId: "PR-00012", refundMethod: "credit", totalAmount: 100, debitNoteId: oid(),
            items: [
                { itemId: itemB, quantity: 1, rate: 100 },
                { itemId: itemA, quantity: 1, rate: 600, serializedUnitId: oid() },
            ],
        });
        await expect(service.deletePurchaseReturn(ctx, "x")).rejects.toMatchObject({ statusCode: 409, code: "RETURN_NOT_REVERSIBLE" });
        expect(stockCalls()).toBe(0);
        expect(debitNoteRepository.cancel).not.toHaveBeenCalled();
        expect(purchaseReturnRepository.delete).not.toHaveBeenCalled();
    });
});
