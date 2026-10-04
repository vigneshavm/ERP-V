import { describe, it, expect, jest, beforeEach, afterEach } from "@jest/globals";
import mongoose, { Types } from "mongoose";
import { RateRevisionService } from "../services/RateRevisionService.js";
import type { RequestContext } from "../../../utils/requestContext.js";

const oid = () => new Types.ObjectId();
const tenantId = oid();
const userId = oid();
const ctx: RequestContext = { tenantId, userId, user: { _id: userId } as any, requestId: "req-2" };
const revisionId = oid();
const itemId = oid();
const supplierId = oid();

const pendingRevision = () => ({
    _id: revisionId, itemId, supplierId, batchNumber: "LOT-5", oldRate: 100, newRate: 120, affectedQty: 10, diffAmount: 200, status: "PENDING",
});

type Mocked = Record<string, jest.Mock<(...args: any[]) => any>>;
let repo: Mocked, suppliers: Mocked, inventory: Mocked, payables: Mocked;
let service: RateRevisionService;
const session = { withTransaction: async (fn: () => Promise<void>) => fn(), endSession: async () => undefined };

beforeEach(() => {
    jest.spyOn(mongoose, "startSession").mockResolvedValue(session as any);
    repo = {
        create: jest.fn(async (d: any) => ({ _id: oid(), ...d })),
        list: jest.fn(async () => []),
        findById: jest.fn(async () => pendingRevision()),
        decide: jest.fn(async (_t: any, _id: any, status: any) => ({ ...pendingRevision(), status })),
    };
    suppliers = { findRawByIdForTenant: jest.fn(async () => ({ _id: supplierId, businessName: "Acme", creditPeriod: 15 })) };
    inventory = { updateBatchCost: jest.fn(async () => undefined) };
    payables = { postSupplierCharge: jest.fn(async () => ({ billId: oid() })) };
    service = new RateRevisionService(repo as any, suppliers as any, inventory as any, payables as any);
});
afterEach(() => {
    jest.restoreAllMocks();
});

describe("RateRevisionService.approveRevision", () => {
    it("updates the batch cost and adds the difference to what we owe the supplier", async () => {
        const approved: any = await service.approveRevision(ctx, String(revisionId));
        expect(inventory.updateBatchCost).toHaveBeenCalledWith(String(itemId), "LOT-5", 120, tenantId.toString(), ctx.user);
        expect(repo.decide).toHaveBeenCalledWith(tenantId.toString(), String(revisionId), "APPROVED", String(userId));
        expect(payables.postSupplierCharge).toHaveBeenCalledWith(expect.objectContaining({
            tenantId, userId, amount: 200, supplier: expect.objectContaining({ _id: supplierId }), session,
        }));
        expect(approved.status).toBe("APPROVED");
    });

    it("refuses a revision that is not pending, without touching cost or payables", async () => {
        repo.findById.mockResolvedValueOnce({ ...pendingRevision(), status: "APPROVED" });
        await expect(service.approveRevision(ctx, String(revisionId))).rejects.toMatchObject({ statusCode: 409, code: "RATE_REVISION_DECIDED" });
        expect(inventory.updateBatchCost).not.toHaveBeenCalled();
        expect(payables.postSupplierCharge).not.toHaveBeenCalled();
    });

    it("posts nothing and restores the cost when another approval won the race", async () => {
        repo.decide.mockResolvedValueOnce(null);
        await expect(service.approveRevision(ctx, String(revisionId))).rejects.toMatchObject({ code: "RATE_REVISION_DECIDED" });
        expect(payables.postSupplierCharge).not.toHaveBeenCalled();
        expect(inventory.updateBatchCost).toHaveBeenLastCalledWith(String(itemId), "LOT-5", 100, tenantId.toString(), ctx.user);
    });

    it("restores the batch cost when posting the payable fails", async () => {
        payables.postSupplierCharge.mockRejectedValueOnce(new Error("db down"));
        await expect(service.approveRevision(ctx, String(revisionId))).rejects.toThrow("db down");
        expect(inventory.updateBatchCost).toHaveBeenCalledTimes(2);
        expect(inventory.updateBatchCost).toHaveBeenLastCalledWith(String(itemId), "LOT-5", 100, tenantId.toString(), ctx.user);
    });
});

describe("RateRevisionService.rejectRevision", () => {
    it("404s for a revision outside the tenant", async () => {
        repo.decide.mockResolvedValueOnce(null);
        repo.findById.mockResolvedValueOnce(null);
        await expect(service.rejectRevision(ctx, String(revisionId))).rejects.toMatchObject({ statusCode: 404 });
    });
});

describe("RateRevisionService.createRevision", () => {
    it("rejects a supplier from another tenant", async () => {
        suppliers.findRawByIdForTenant.mockResolvedValueOnce(null);
        await expect(service.createRevision(ctx, {
            itemId: String(itemId), supplierId: String(supplierId), batchNumber: "LOT-5", oldRate: 100, newRate: 120, affectedQty: 10,
        })).rejects.toMatchObject({ statusCode: 404, code: "SUPPLIER_NOT_FOUND" });
        expect(repo.create).not.toHaveBeenCalled();
    });
});
