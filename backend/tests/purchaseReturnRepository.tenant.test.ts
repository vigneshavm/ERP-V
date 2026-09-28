import { describe, it, expect, beforeAll, afterAll, afterEach } from "@jest/globals";
import { Types } from "mongoose";
import { startMongo, clearMongo, stopMongo } from "./support/memoryMongo.js";
import PurchaseReturn from "../src/modules/purchase/models/PurchaseReturn.js";
import { PurchaseReturnRepository } from "../src/modules/purchase/repositories/PurchaseReturnRepository.js";

/**
 * Tenant isolation for purchase returns (docs/backend-architecture.md §6):
 * tenant A can never read or delete tenant B's returns, and a user's legacy returns
 * (created before returns carried a tenantId) stay visible only to that user.
 */
const repo = new PurchaseReturnRepository();
const tenantA = new Types.ObjectId();
const tenantB = new Types.ObjectId();
const userA = new Types.ObjectId();
const userA2 = new Types.ObjectId();
const userB = new Types.ObjectId();
const scopeA = { tenantId: tenantA, userId: userA };
const scopeA2 = { tenantId: tenantA, userId: userA2 };
const scopeB = { tenantId: tenantB, userId: userB };

const makeReturn = (fields: Record<string, unknown>) =>
    PurchaseReturn.create({
        returnId: `PR-${Math.floor(Math.random() * 90000 + 10000)}`,
        supplier: new Types.ObjectId(),
        items: [{ productName: "Shirt", quantity: 1, rate: 100, tax: 0, amount: 100, reason: "Damaged" }],
        subtotal: 100,
        totalAmount: 100,
        ...fields,
    });

beforeAll(startMongo, 120000);
afterEach(clearMongo);
afterAll(stopMongo);

describe("PurchaseReturnRepository tenant isolation", () => {
    it("lists only the caller's tenant", async () => {
        await makeReturn({ tenantId: tenantA, createdBy: userA });
        await makeReturn({ tenantId: tenantB, createdBy: userB });
        const seenByA = await repo.list(scopeA);
        expect(seenByA).toHaveLength(1);
        expect(String(seenByA[0].tenantId)).toBe(String(tenantA));
    });

    it("cannot read another tenant's return by id", async () => {
        const other = await makeReturn({ tenantId: tenantB, createdBy: userB });
        expect(await repo.findById(scopeA, String(other._id))).toBeNull();
        expect(await repo.findRawById(scopeA, String(other._id))).toBeNull();
    });

    it("cannot delete another tenant's return", async () => {
        const other = await makeReturn({ tenantId: tenantB, createdBy: userB });
        await repo.delete(scopeA, String(other._id));
        expect(await PurchaseReturn.countDocuments({ _id: other._id })).toBe(1);
    });

    it("shows a legacy (tenant-less) return only to the user who created it", async () => {
        const legacy = await makeReturn({ createdBy: userA });
        expect(await repo.findById(scopeA, String(legacy._id))).not.toBeNull();
        expect(await repo.findById(scopeA2, String(legacy._id))).toBeNull();
        expect(await repo.findById(scopeB, String(legacy._id))).toBeNull();
    });

    it("numbers after the highest existing return the caller can see", async () => {
        await makeReturn({ tenantId: tenantA, createdBy: userA2, returnId: "PR-00004" });
        await makeReturn({ createdBy: userA, returnId: "PR-00009" }); // caller's legacy return
        await makeReturn({ tenantId: tenantB, createdBy: userB, returnId: "PR-00050" }); // other tenant: ignored
        expect(await repo.nextReturnId(scopeA)).toBe("PR-00010");
        expect(await repo.nextReturnId(scopeA2)).toBe("PR-00005");
    });
});
