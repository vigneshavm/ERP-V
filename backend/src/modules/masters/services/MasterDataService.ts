import { injectable } from "tsyringe";
import {
  MasterType,
  isMasterType,
  PARENT_TYPE_OF,
  DEFAULT_SEEDS,
} from "../masterTypes.js";
import { AppError } from "../../../utils/AppError.js";
import { info } from "../../../config/logger.js";
import {
  SQL_MASTER_TYPES,
  isSqlMasterId,
  listSqlMaster,
  createSqlMaster,
  updateSqlMaster,
  deleteSqlMaster,
} from "../../../integrations/textilesoft/sqlMasters.js";
import {
  listMasterEntries,
  findMasterEntryByName,
  seedMasterEntries,
  createMasterEntry,
  updateMasterEntry,
  hasChildMasterEntries,
  deleteMasterEntry,
  type MasterEntryRow,
} from "../../../integrations/textilesoft/erpMasterEntry.js";

// Types Textilesoft keeps in its own tables (units, groups, GST groups, floors, product attributes,
// warehouses, counters) are read and written there directly -- see sqlMasters.ts. The rest live in
// erp.master_entry (single-shop: no tenantId) -- see erpMasterEntry.ts.

@injectable()
export class MasterDataService {
  async listByType(
    _tenantId: string,
    type: string,
    parentId?: string,
  ): Promise<MasterEntryRow[]> {
    if (SQL_MASTER_TYPES.has(type))
      return (await listSqlMaster(type, parentId)) as unknown as MasterEntryRow[];
    if (!isMasterType(type)) {
      throw new AppError(`Unknown master type: ${type}`, 400);
    }

    let rows = await listMasterEntries(type, parentId);

    // Seed sensible defaults the first time this type is read with zero rows yet -- keeps a freshly-
    // migrated screen (e.g. Customer Groups) from looking empty/broken. Top-level types only.
    if (rows.length === 0 && !parentId && DEFAULT_SEEDS[type as MasterType]) {
      const seeds = DEFAULT_SEEDS[type as MasterType]!;
      await seedMasterEntries(type, seeds);
      info(`Seeded ${seeds.length} default "${type}" master entries`);
      rows = await listMasterEntries(type, parentId);
    }

    return rows;
  }

  async create(
    _tenantId: string,
    type: string,
    data: any,
    userId?: string,
  ): Promise<MasterEntryRow> {
    if (SQL_MASTER_TYPES.has(type))
      return (await createSqlMaster(type, data)) as unknown as MasterEntryRow;
    if (!isMasterType(type)) {
      throw new AppError(`Unknown master type: ${type}`, 400);
    }
    if (!data.name || !String(data.name).trim()) {
      throw new AppError("Name is required", 400);
    }

    const requiredParentType = PARENT_TYPE_OF[type as MasterType];
    if (requiredParentType && !data.parentId) {
      throw new AppError(
        `${type} requires a parentId (a ${requiredParentType} entry)`,
        400,
      );
    }

    const existing = await findMasterEntryByName(type, String(data.name).trim());
    if (existing) {
      throw new AppError(`"${data.name}" already exists`, 400);
    }

    return createMasterEntry({
      type,
      name: String(data.name).trim(),
      description: data.description,
      parentId: data.parentId || undefined,
      meta: data.meta || {},
      createdBy: userId,
    });
  }

  async update(id: string, _tenantId: string, data: any): Promise<MasterEntryRow> {
    if (isSqlMasterId(id))
      return (await updateSqlMaster(id, data)) as unknown as MasterEntryRow;
    const entry = await updateMasterEntry(id, {
      name: data.name !== undefined ? String(data.name).trim() : undefined,
      description: data.description,
      meta: data.meta,
      isActive: data.isActive,
    });
    if (!entry) {
      throw new AppError("Entry not found", 404);
    }
    return entry;
  }

  async remove(id: string, _tenantId: string): Promise<void> {
    if (isSqlMasterId(id)) return deleteSqlMaster(id);
    // A child row (e.g. TRANSACTION_NAME) referencing this one via parentId would be
    // orphaned by deletion -- block that rather than silently leaving a dangling reference.
    if (await hasChildMasterEntries(id)) {
      throw new AppError(
        "Cannot delete: other entries are grouped under this one",
        400,
      );
    }
    const deleted = await deleteMasterEntry(id);
    if (!deleted) {
      throw new AppError("Entry not found", 404);
    }
  }
}

