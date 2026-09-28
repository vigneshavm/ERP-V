import { describe, it, expect, jest, beforeEach, afterEach } from "@jest/globals";
import mongoose, { Types } from "mongoose";
import { GRNTransferService } from "../services/GRNTransferService.js";
import type { RequestContext } from "../../../utils/requestContext.js";

const oid = () => new Types.ObjectId();
const tenantId = oid();
const userId = oid();
const ctx: RequestContext = { tenantId, userId, user: { _id: userId } as any, requestId: "req-4" };
const grnId = oid().toString();
const itemA = oid().toString();
const itemB = oid().toString();

type Mocked = Record<string, jest.Mock<(...args: any[]) => any>>;
let transfers: Mocked, grns: Mocked, inventory: Mocked;
let service: GRNTransferService;
const session = { withTransaction: async (fn: () => Promise<void>) => fn(), endSession: async () => undefined };

const input = (items = [{ productId: itemA, quantity: 5 }]) => ({ sourceGrnId: grnId, fromWarehouseId: "W1", toWarehouseId: "W2", items });

beforeEach(() => {
    jest.spyOn(mongoose, "startSession").mockResolvedValue(session as any);
    transfers = {
        create: jest.fn(async (d: any) => ({ _id: oid(), ...d })),
        list: jest.fn(async () => []),
        findById: jest.fn(async () => null),
        latestNumberWithPrefix: jest.fn(async () => null),
    };
    grns = { findByIdForTenant: jest.fn(async () => ({ _id: grnId, grnNumber: "GRN-7", items: [{ productId: itemA, productName: "Shirt", lotNumber: "L1" }] })) };
    inventory = { moveBetweenWarehouses: jest.fn(async () => undefined) };
    service = new GRNTransferService(transfers as any, grns as any, inventory as any);
});
afterEach(() => {
    jest.restoreAllMocks();
});

describe("GRNTransferService.createTransfer", () => {
    it("moves the stock between warehouses and records the transfer", async () => {
        const created: any = await service.createTransfer(ctx, input());
        expect(inventory.moveBetweenWarehouses).toHaveBeenCalledWith(itemA, 5, "W1", "W2", tenantId, "GRN GRN-7: W1 -> W2", userId, session);
        expect(created.transferNumber).toMatch(/^GTR-\d{8}-0001$/);
        expect(created).toMatchObject({ tenantId: tenantId.toString(), fromWarehouseId: "W1", toWarehouseId: "W2" });
        expect(created.items[0]).toMatchObject({ productName: "Shirt", quantity: 5, batchNumber: "L1" });
    });

    it("continues the day's numbering from the highest number", async () => {
        transfers.latestNumberWithPrefix.mockImplementationOnce(async (_t: any, prefix: any) => `${prefix}0041`);
        const created: any = await service.createTransfer(ctx, input());
        expect(created.transferNumber).toMatch(/-0042$/);
    });

    it("refuses a GRN outside the tenant", async () => {
        grns.findByIdForTenant.mockResolvedValueOnce(null);
        await expect(service.createTransfer(ctx, input())).rejects.toMatchObject({ statusCode: 404, code: "GRN_NOT_FOUND" });
        expect(inventory.moveBetweenWarehouses).not.toHaveBeenCalled();
    });

    it("refuses an item that was not received on the GRN (whole transfer rolls back)", async () => {
        await expect(service.createTransfer(ctx, input([{ productId: itemA, quantity: 1 }, { productId: itemB, quantity: 1 }])))
            .rejects.toMatchObject({ statusCode: 400, code: "ITEM_NOT_ON_GRN" });
        expect(transfers.create).not.toHaveBeenCalled();
    });

    it("refuses the same warehouse on both sides", async () => {
        await expect(service.createTransfer(ctx, { ...input(), toWarehouseId: "W1" })).rejects.toMatchObject({ code: "SAME_WAREHOUSE" });
    });
});
