/**
 * ERP-only master-list types (erp.master_entry) -- the ~15 MASTER_TYPES with no Textilesoft table
 * (customer groups, transaction/cash groups, GST type, HSN catalog, sales counters, ...). The other
 * 15 Textilesoft-tied types (PRODUCT_BRAND, GST_GROUP, WAREHOUSE, ...) stay on sqlMasters.ts/dbo,
 * unchanged -- see SQL_MASTER_TYPES in that file. Single-shop: no tenantId.
 */
import { query, tx } from "./erpDb.js";

export interface MasterEntryRow {
  _id: string;
  id: string;
  type: string;
  name: string;
  description?: string;
  parentId?: string;
  meta: Record<string, unknown>;
  isActive: boolean;
  createdBy?: string;
  createdAt: Date;
}

function toEntry(row: Record<string, unknown>): MasterEntryRow {
  let meta: Record<string, unknown> = {};
  try {
    meta = row.meta ? JSON.parse(String(row.meta)) : {};
  } catch {
    meta = {};
  }
  return {
    _id: String(row.id),
    id: String(row.id),
    type: String(row.entry_type),
    name: String(row.name),
    description: row.description == null ? undefined : String(row.description),
    parentId: row.parent_id == null ? undefined : String(row.parent_id),
    meta,
    isActive: !!row.is_active,
    createdBy: row.created_by == null ? undefined : String(row.created_by),
    createdAt: row.created_at ? new Date(String(row.created_at)) : new Date(),
  };
}

export async function listMasterEntries(type: string, parentId?: string): Promise<MasterEntryRow[]> {
  const rows = parentId
    ? await query(
        "SELECT * FROM erp.master_entry WHERE entry_type = @type AND parent_id = @parentId ORDER BY name",
        { type, parentId: Number(parentId) },
      )
    : await query(
        "SELECT * FROM erp.master_entry WHERE entry_type = @type ORDER BY name",
        { type },
      );
  return rows.map(toEntry);
}

export async function findMasterEntryByName(type: string, name: string): Promise<MasterEntryRow | null> {
  const rows = await query(
    "SELECT * FROM erp.master_entry WHERE entry_type = @type AND LOWER(name) = LOWER(@name)",
    { type, name },
  );
  return rows.length ? toEntry(rows[0]) : null;
}

export async function seedMasterEntries(
  type: string,
  seeds: Array<{ name: string; description?: string; meta?: Record<string, unknown> }>,
): Promise<void> {
  await tx("seed master entries", async (t) => {
    for (const s of seeds) {
      await t.query(
        `INSERT INTO erp.master_entry (entry_type, name, description, meta)
         VALUES (@type, @name, @description, @meta)`,
        {
          type,
          name: s.name,
          description: s.description ?? null,
          meta: JSON.stringify(s.meta ?? {}),
        },
      );
    }
  });
}

export async function createMasterEntry(data: {
  type: string;
  name: string;
  description?: string;
  parentId?: string;
  meta?: Record<string, unknown>;
  createdBy?: string;
}): Promise<MasterEntryRow> {
  const rows = await query(
    `INSERT INTO erp.master_entry (entry_type, name, description, parent_id, meta, created_by)
     OUTPUT INSERTED.*
     VALUES (@type, @name, @description, @parentId, @meta, @createdBy)`,
    {
      type: data.type,
      name: data.name,
      description: data.description ?? null,
      parentId: data.parentId ? Number(data.parentId) : null,
      meta: JSON.stringify(data.meta ?? {}),
      createdBy: data.createdBy ?? null,
    },
  );
  return toEntry(rows[0]);
}

export async function updateMasterEntry(
  id: string,
  data: { name?: string; description?: string; meta?: Record<string, unknown>; isActive?: boolean },
): Promise<MasterEntryRow | null> {
  const sets: string[] = [];
  const params: Record<string, unknown> = { id: Number(id) };
  if (data.name !== undefined) {
    sets.push("name = @name");
    params.name = data.name.trim();
  }
  if (data.description !== undefined) {
    sets.push("description = @description");
    params.description = data.description;
  }
  if (data.meta !== undefined) {
    sets.push("meta = @meta");
    params.meta = JSON.stringify(data.meta);
  }
  if (data.isActive !== undefined) {
    sets.push("is_active = @isActive");
    params.isActive = data.isActive;
  }
  if (!sets.length) {
    const rows = await query("SELECT * FROM erp.master_entry WHERE id = @id", { id: Number(id) });
    return rows.length ? toEntry(rows[0]) : null;
  }
  sets.push("updated_at = SYSUTCDATETIME()");
  const rows = await query(
    `UPDATE erp.master_entry SET ${sets.join(", ")} OUTPUT INSERTED.* WHERE id = @id`,
    params,
  );
  return rows.length ? toEntry(rows[0]) : null;
}

export async function hasChildMasterEntries(id: string): Promise<boolean> {
  const rows = await query(
    "SELECT TOP 1 id FROM erp.master_entry WHERE parent_id = @id",
    { id: Number(id) },
  );
  return rows.length > 0;
}

export async function deleteMasterEntry(id: string): Promise<boolean> {
  const rows = await query(
    "DELETE FROM erp.master_entry OUTPUT DELETED.id WHERE id = @id",
    { id: Number(id) },
  );
  return rows.length > 0;
}
