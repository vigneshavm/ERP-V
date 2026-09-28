import { injectable } from "tsyringe";
import { ClientSession } from "mongoose";
import GRNTransfer, { IGRNTransfer } from "../models/GRNTransfer.js";

/** GRN transfers are tenant-owned (GRNTransfer.tenantId is a string); every method takes tenantId. */
@injectable()
export class GRNTransferRepository {
    async create(data: Partial<IGRNTransfer>, session?: ClientSession): Promise<IGRNTransfer> {
        const [transfer] = await GRNTransfer.create([data], { session });
        return transfer;
    }

    async list(tenantId: string, filter: { sourceGrnId?: string } = {}): Promise<IGRNTransfer[]> {
        return GRNTransfer.find({ tenantId, ...(filter.sourceGrnId ? { sourceGrnId: filter.sourceGrnId } : {}) })
            .sort({ createdAt: -1 })
            .populate("sourceGrnId", "grnNumber");
    }

    async findById(tenantId: string, id: string): Promise<IGRNTransfer | null> {
        return GRNTransfer.findOne({ _id: id, tenantId })
            .populate("sourceGrnId", "grnNumber")
            .populate("createdBy", "name");
    }

    /** Latest transfer number for today's `GTR-YYYYMMDD-` prefix (highest, not newest). */
    async latestNumberWithPrefix(tenantId: string, prefix: string, session?: ClientSession): Promise<string | null> {
        const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const latest = await GRNTransfer.findOne({ tenantId, transferNumber: new RegExp(`^${escaped}\\d{4}$`) })
            .sort({ transferNumber: -1 })
            .select("transferNumber")
            .session(session ?? null)
            .lean<{ transferNumber: string }>();
        return latest?.transferNumber ?? null;
    }
}
