import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { Types } from "mongoose";
import { DebitNoteService } from "../services/DebitNoteService.js";
import type { RequestContext } from "../../../utils/requestContext.js";

const oid = () => new Types.ObjectId();
const tenantId = oid();
const userId = oid();
const ctx: RequestContext = { tenantId, userId, user: { _id: userId } as any, requestId: "req-3" };
const vendorId = oid().toString();
const itemId = oid().toString();

type Mocked = Record<string, jest.Mock<(...args: any[]) => any>>;
let repo: Mocked, suppliers: Mocked, inventory: Mocked;
let service: DebitNoteService;

const note = (fields: Record<string, unknown> = {}) => ({
    _id: oid(), noteId: "DN-000001", reason: "QUALITY", status: "DRAFT", vendorName: "Acme",
    items: [{ itemId: new Types.ObjectId(itemId), name: "Shirt", qty: 3, amount: 300 }], ...fields,
});

beforeEach(() => {
    repo = {
        nextNoteId: jest.fn(async () => "DN-000009"),
        create: jest.fn(async (d: any) => ({ _id: oid(), ...d })),
        findAll: jest.fn(async () => []),
        findById: jest.fn(async () => note()),
        transitionStatus: jest.fn(async (_t: any, _id: any, _from: any, to: any) => ({ ...note(), status: to })),
        delete: jest.fn(async () => null),
    };
    suppliers = { findRawByIdForTenant: jest.fn(async () => ({ _id: vendorId, businessName: "Acme Textiles" })) };
    inventory = { assertStockAvailable: jest.fn(async () => undefined), reduceStock: jest.fn(async () => undefined) };
    service = new DebitNoteService(repo as any, suppliers as any, inventory as any);
});

describe("DebitNoteService.createDebitNote", () => {
    it("takes the supplier name and total from the server, not the browser", async () => {
        const created: any = await service.createDebitNote(ctx, {
            vendorId, reason: "PRICE_DIFF",
            items: [{ name: "Rate diff", qty: 2, amount: 150 }, { name: "Freight", qty: 1, amount: 50 }],
        });
        expect(created).toMatchObject({ noteId: "DN-000009", tenantId, vendorName: "Acme Textiles", totalAmount: 200, status: "DRAFT", createdBy: userId });
        expect(inventory.reduceStock).not.toHaveBeenCalled();
    });

    it("rejects a supplier from another tenant", async () => {
        suppliers.findRawByIdForTenant.mockResolvedValueOnce(null);
        await expect(service.createDebitNote(ctx, { vendorId, reason: "OTHER", items: [{ name: "x", qty: 1, amount: 1 }] }))
            .rejects.toMatchObject({ statusCode: 404, code: "SUPPLIER_NOT_FOUND" });
        expect(repo.create).not.toHaveBeenCalled();
    });

    it("checks stock before saving an approved stock note, then takes it out", async () => {
        await service.createDebitNote(ctx, { vendorId, reason: "RETURN", status: "APPROVED", items: [{ itemId, name: "Shirt", qty: 3, amount: 300 }] });
        expect(inventory.assertStockAvailable).toHaveBeenCalledWith([{ itemId, quantity: 3, label: "Shirt" }], tenantId);
        expect(inventory.reduceStock).toHaveBeenCalledWith(itemId, 3, tenantId, ctx.user, "DEBIT_NOTE_RETURN");
    });

    it("saves nothing when stock is short", async () => {
        inventory.assertStockAvailable.mockRejectedValueOnce(Object.assign(new Error("Not enough stock"), { statusCode: 400, code: "INSUFFICIENT_STOCK" }));
        await expect(service.createDebitNote(ctx, { vendorId, reason: "RETURN", status: "APPROVED", items: [{ itemId, name: "Shirt", qty: 99, amount: 1 }] }))
            .rejects.toMatchObject({ code: "INSUFFICIENT_STOCK" });
        expect(repo.create).not.toHaveBeenCalled();
    });
});

describe("DebitNoteService.changeStatus", () => {
    it("approving a stock note takes stock out once", async () => {
        const updated: any = await service.changeStatus(ctx, "id1", "APPROVED");
        expect(repo.transitionStatus).toHaveBeenCalledWith(tenantId, "id1", ["DRAFT"], "APPROVED");
        expect(inventory.reduceStock).toHaveBeenCalledTimes(1);
        expect(updated.status).toBe("APPROVED");
    });

    it("an approved note is final", async () => {
        repo.findById.mockResolvedValueOnce(note({ status: "APPROVED" }));
        await expect(service.changeStatus(ctx, "id1", "REJECTED")).rejects.toMatchObject({ statusCode: 409, code: "DEBIT_NOTE_INVALID_TRANSITION" });
        expect(repo.transitionStatus).not.toHaveBeenCalled();
    });

    it("a double-clicked approve that lost the race moves no stock", async () => {
        repo.transitionStatus.mockResolvedValueOnce(null);
        await expect(service.changeStatus(ctx, "id1", "APPROVED")).rejects.toMatchObject({ statusCode: 409, code: "DEBIT_NOTE_CHANGED" });
        expect(inventory.reduceStock).not.toHaveBeenCalled();
    });

    it("puts the status back if stock can't be taken out", async () => {
        inventory.reduceStock.mockRejectedValueOnce(new Error("Insufficient stock"));
        await expect(service.changeStatus(ctx, "id1", "APPROVED")).rejects.toThrow("Insufficient stock");
        expect(repo.transitionStatus).toHaveBeenLastCalledWith(tenantId, "id1", ["APPROVED"], "DRAFT");
    });

    it("a price-difference note moves no stock on approval", async () => {
        repo.findById.mockResolvedValueOnce(note({ reason: "PRICE_DIFF" }));
        await service.changeStatus(ctx, "id1", "APPROVED");
        expect(inventory.assertStockAvailable).not.toHaveBeenCalled();
        expect(inventory.reduceStock).not.toHaveBeenCalled();
    });
});

describe("DebitNoteService.deleteDebitNote", () => {
    it("refuses to delete an approved note", async () => {
        repo.findById.mockResolvedValueOnce(note({ status: "APPROVED" }));
        await expect(service.deleteDebitNote(ctx, "id1")).rejects.toMatchObject({ statusCode: 409, code: "DEBIT_NOTE_APPROVED" });
        expect(repo.delete).not.toHaveBeenCalled();
    });
});
