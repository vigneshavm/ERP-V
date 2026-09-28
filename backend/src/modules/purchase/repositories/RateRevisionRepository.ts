import { injectable } from "tsyringe";
import { ClientSession } from "mongoose";
import RateRevision, { IRateRevision } from "../models/RateRevision.js";
import type { IdRef } from "../../../interfaces/TenantRef.js";

/** Rate revisions are tenant-owned; every method takes tenantId (RateRevision.tenantId is a string). */
@injectable()
export class RateRevisionRepository {
    async create(data: Partial<IRateRevision>): Promise<IRateRevision> {
        return RateRevision.create(data);
    }

    async findById(tenantId: string, id: string): Promise<IRateRevision | null> {
        return RateRevision.findOne({ _id: id, tenantId });
    }

    async list(tenantId: string): Promise<IRateRevision[]> {
        return RateRevision.find({ tenantId })
            .populate("itemId", "name sku")
            .populate("supplierId", "businessName")
            .populate("createdBy", "name")
            .sort({ createdAt: -1 });
    }

    /**
     * Moves a PENDING revision to APPROVED/REJECTED in one atomic update. Returns null when it is
     * not PENDING any more (already decided, e.g. a double click), so it can never be decided twice.
     */
    async decide(
        tenantId: string,
        id: string,
        status: "APPROVED" | "REJECTED",
        decidedBy: IdRef,
        session?: ClientSession,
    ): Promise<IRateRevision | null> {
        return RateRevision.findOneAndUpdate(
            { _id: id, tenantId, status: "PENDING" },
            { $set: { status, approvedBy: decidedBy } },
            { new: true, session },
        );
    }
}
