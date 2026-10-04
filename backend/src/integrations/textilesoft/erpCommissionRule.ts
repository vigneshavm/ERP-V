/**
 * Commission rules (erp.commission_rule). Single-shop: no tenantId. `itemId` display fields are
 * snapshotted from MongoDB's Item (Item isn't migrating this wave) so the list read doesn't need a
 * cross-database join; `employeeId` has no name snapshot because Invoice.createdBy/User linkage
 * already has no live MongoDB User document for Textilesoft-authenticated users since Wave 1 (a
 * pre-existing gap, not something this migration can fix).
 */
import { query } from "./erpDb.js";

export type CommissionScope = "ITEM" | "CATEGORY" | "ALL";
export type CommissionRateType = "PERCENT" | "FLAT";

export interface CommissionRuleEntry {
  _id: string;
  id: string;
  name: string;
  employeeId?: { _id: string } | null;
  scope: CommissionScope;
  itemId?: { _id: string; name: string; sku?: string; category?: string } | null;
  category?: string;
  rateType: CommissionRateType;
  rateValue: number;
  status: "active" | "inactive";
  createdAt: Date;
}

function toEntry(row: Record<string, unknown>): CommissionRuleEntry {
  return {
    _id: String(row.id),
    id: String(row.id),
    name: String(row.name),
    employeeId: row.employee_id == null ? null : { _id: String(row.employee_id) },
    scope: row.scope as CommissionScope,
    itemId:
      row.item_id == null
        ? null
        : {
            _id: String(row.item_id),
            name: String(row.item_name ?? ""),
            sku: row.item_sku == null ? undefined : String(row.item_sku),
            category: row.category == null ? undefined : String(row.category),
          },
    category: row.category == null ? undefined : String(row.category),
    rateType: row.rate_type as CommissionRateType,
    rateValue: Number(row.rate_value),
    status: (row.status as "active" | "inactive") ?? "active",
    createdAt: row.created_at ? new Date(String(row.created_at)) : new Date(),
  };
}

export async function listCommissionRules(): Promise<CommissionRuleEntry[]> {
  const rows = await query("SELECT * FROM erp.commission_rule ORDER BY created_at DESC");
  return rows.map(toEntry);
}

export async function listActiveCommissionRules(): Promise<CommissionRuleEntry[]> {
  const rows = await query("SELECT * FROM erp.commission_rule WHERE status = 'active'");
  return rows.map(toEntry);
}

export async function findCommissionRuleById(id: string): Promise<CommissionRuleEntry | null> {
  const rows = await query("SELECT * FROM erp.commission_rule WHERE id = @id", { id: Number(id) });
  return rows.length ? toEntry(rows[0]) : null;
}

export async function createCommissionRule(data: {
  name: string;
  employeeId?: string;
  scope: CommissionScope;
  itemId?: string;
  category?: string;
  rateType: CommissionRateType;
  rateValue: number;
}): Promise<CommissionRuleEntry> {
  const rows = await query(
    `INSERT INTO erp.commission_rule (name, employee_id, scope, item_id, item_name, item_sku, category, rate_type, rate_value)
     OUTPUT INSERTED.*
     VALUES (@name, @employeeId, @scope, @itemId, @itemName, @itemSku, @category, @rateType, @rateValue)`,
    {
      name: data.name,
      employeeId: data.employeeId ?? null,
      scope: data.scope,
      itemId: data.scope === "ITEM" ? data.itemId ?? null : null,
      itemName: null,
      itemSku: null,
      category: data.scope === "CATEGORY" ? data.category ?? null : null,
      rateType: data.rateType,
      rateValue: data.rateValue,
    },
  );
  return toEntry(rows[0]);
}

export async function updateCommissionRule(
  id: string,
  data: Partial<{
    name: string;
    employeeId: string | null;
    scope: CommissionScope;
    itemId: string | null;
    category: string | null;
    rateType: CommissionRateType;
    rateValue: number;
    status: "active" | "inactive";
  }>,
): Promise<CommissionRuleEntry | null> {
  const sets: string[] = [];
  const params: Record<string, unknown> = { id: Number(id) };
  if (data.name !== undefined) {
    sets.push("name = @name");
    params.name = data.name;
  }
  if (data.employeeId !== undefined) {
    sets.push("employee_id = @employeeId");
    params.employeeId = data.employeeId;
  }
  if (data.scope !== undefined) {
    sets.push("scope = @scope");
    params.scope = data.scope;
  }
  if (data.itemId !== undefined) {
    sets.push("item_id = @itemId", "item_name = @itemName", "item_sku = @itemSku");
    params.itemId = data.itemId;
    params.itemName = null;
    params.itemSku = null;
  }
  if (data.category !== undefined) {
    sets.push("category = @category");
    params.category = data.category;
  }
  if (data.rateType !== undefined) {
    sets.push("rate_type = @rateType");
    params.rateType = data.rateType;
  }
  if (data.rateValue !== undefined) {
    sets.push("rate_value = @rateValue");
    params.rateValue = data.rateValue;
  }
  if (data.status !== undefined) {
    sets.push("status = @status");
    params.status = data.status;
  }
  if (!sets.length) return findCommissionRuleById(id);
  sets.push("updated_at = SYSUTCDATETIME()");
  const rows = await query(
    `UPDATE erp.commission_rule SET ${sets.join(", ")} OUTPUT INSERTED.* WHERE id = @id`,
    params,
  );
  return rows.length ? toEntry(rows[0]) : null;
}

export async function deleteCommissionRule(id: string): Promise<boolean> {
  const rows = await query(
    "DELETE FROM erp.commission_rule OUTPUT DELETED.id WHERE id = @id",
    { id: Number(id) },
  );
  return rows.length > 0;
}
