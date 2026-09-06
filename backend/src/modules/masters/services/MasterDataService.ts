import { injectable } from "tsyringe";
import MasterEntry, { IMasterEntry } from "../models/MasterEntry.js";
import { MasterType, isMasterType, PARENT_TYPE_OF, DEFAULT_SEEDS } from "../masterTypes.js";
import { AppError } from "../../../utils/AppError.js";
import { info } from "../../../config/logger.js";

@injectable()
export class MasterDataService {
    async listByType(tenantId: string, type: string, parentId?: string): Promise<IMasterEntry[]> {
        if (!isMasterType(type)) {
            throw new AppError(`Unknown master type: ${type}`, 400);
        }

        const query: Record<string, any> = { tenantId, type };
        if (parentId) query.parentId = parentId;

        let rows = await MasterEntry.find(query).sort({ name: 1 });

        // Seed sensible defaults the first time a tenant reads a type that has zero rows yet --
        // keeps a freshly-migrated screen (e.g. Customer Groups) from looking empty/broken.
        // Only applies to top-level types (no parentId requested) with a defined seed list.
        if (rows.length === 0 && !parentId && DEFAULT_SEEDS[type as MasterType]) {
            const seeds = DEFAULT_SEEDS[type as MasterType]!;
            await MasterEntry.insertMany(
                seeds.map((s) => ({ tenantId, type, name: s.name, description: s.description, meta: s.meta || {} }))
            );
            info(`Seeded ${seeds.length} default "${type}" master entries for tenant ${tenantId}`);
            rows = await MasterEntry.find(query).sort({ name: 1 });
        }

        return rows;
    }

    async create(tenantId: string, type: string, data: any, userId?: string): Promise<IMasterEntry> {
        if (!isMasterType(type)) {
            throw new AppError(`Unknown master type: ${type}`, 400);
        }
        if (!data.name || !String(data.name).trim()) {
            throw new AppError("Name is required", 400);
        }

        const requiredParentType = PARENT_TYPE_OF[type as MasterType];
        if (requiredParentType && !data.parentId) {
            throw new AppError(`${type} requires a parentId (a ${requiredParentType} entry)`, 400);
        }

        const existing = await MasterEntry.findOne({
            tenantId,
            type,
            name: { $regex: `^${String(data.name).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: "i" },
        });
        if (existing) {
            throw new AppError(`"${data.name}" already exists`, 400);
        }

        return MasterEntry.create({
            tenantId,
            type,
            name: String(data.name).trim(),
            description: data.description,
            parentId: data.parentId || undefined,
            meta: data.meta || {},
            createdBy: userId,
        });
    }

    async update(id: string, tenantId: string, data: any): Promise<IMasterEntry> {
        const entry = await MasterEntry.findOneAndUpdate(
            { _id: id, tenantId },
            {
                ...(data.name !== undefined ? { name: String(data.name).trim() } : {}),
                ...(data.description !== undefined ? { description: data.description } : {}),
                ...(data.meta !== undefined ? { meta: data.meta } : {}),
                ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
            },
            { new: true }
        );
        if (!entry) {
            throw new AppError("Entry not found", 404);
        }
        return entry;
    }

    async remove(id: string, tenantId: string): Promise<void> {
        // A child row (e.g. TRANSACTION_NAME) referencing this one via parentId would be
        // orphaned by deletion -- block that rather than silently leaving a dangling reference.
        const hasChildren = await MasterEntry.exists({ parentId: id, tenantId });
        if (hasChildren) {
            throw new AppError("Cannot delete: other entries are grouped under this one", 400);
        }
        const result = await MasterEntry.findOneAndDelete({ _id: id, tenantId });
        if (!result) {
            throw new AppError("Entry not found", 404);
        }
    }
}
