import { injectable, singleton } from "tsyringe";
import { ClientSession } from "mongoose";
import GRN, { IGRN } from "../modules/purchase/models/GRN.js";

export interface GRNListQuery {
    tenantId: string;
    vendorId?: string;
    purchaseId?: string;
}

@injectable()
@singleton()
export class GRNRepository {
    /** Latest GRN for a tenant, used to derive the next grnNumber sequence. */
    async findLatestForTenant(tenantId: string, session?: ClientSession): Promise<IGRN | null> {
        return GRN.findOne({ tenantId }).sort({ createdAt: -1 }).session(session ?? null);
    }

    /** One GRN, only if it belongs to the tenant. */
    async findByIdForTenant(id: string, tenantId: string, session?: ClientSession): Promise<IGRN | null> {
        return GRN.findOne({ _id: id, tenantId }).session(session ?? null);
    }

    async create(data: Partial<IGRN>, session?: ClientSession): Promise<IGRN> {
        const grn = new GRN(data);
        await grn.save({ session });
        return grn;
    }

    async findAll(query: GRNListQuery): Promise<IGRN[]> {
        const filter: Record<string, unknown> = { tenantId: query.tenantId };
        if (query.vendorId) filter.vendorId = query.vendorId;
        if (query.purchaseId) filter.purchaseId = query.purchaseId;

        return GRN.find(filter)
            .sort({ createdAt: -1 })
            .populate("vendorId", "businessName shortCode")
            .populate("purchaseId", "purchaseNumber");
    }
}
