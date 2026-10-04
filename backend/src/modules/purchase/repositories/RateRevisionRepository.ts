import { injectable } from "tsyringe";
import {
    createRateRevision,
    findRateRevisionById,
    listRateRevisions,
    decideRateRevision,
    type RateRevisionEntry,
} from "../../../integrations/textilesoft/erpRateRevision.js";

/** Rate revisions are single-shop (no tenantId); params kept for minimal call-site changes. */
@injectable()
export class RateRevisionRepository {
    async create(data: Parameters<typeof createRateRevision>[0]): Promise<RateRevisionEntry> {
        return createRateRevision(data);
    }

    async findById(_tenantId: string, id: string): Promise<RateRevisionEntry | null> {
        return findRateRevisionById(id);
    }

    async list(_tenantId: string): Promise<RateRevisionEntry[]> {
        return listRateRevisions();
    }

    /**
     * Moves a PENDING revision to APPROVED/REJECTED in one atomic update. Returns null when it is
     * not PENDING any more (already decided, e.g. a double click), so it can never be decided twice.
     */
    async decide(
        _tenantId: string,
        id: string,
        status: "APPROVED" | "REJECTED",
        decidedBy: string,
    ): Promise<RateRevisionEntry | null> {
        return decideRateRevision(id, status, decidedBy);
    }
}
