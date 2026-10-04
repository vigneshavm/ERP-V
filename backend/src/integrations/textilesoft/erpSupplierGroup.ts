/**
 * Supplier groups (erp.supplier_group). Single-shop: no tenantId.
 */
import { query } from "./erpDb.js";

export interface SupplierGroupEntry {
  _id: string;
  id: string;
  name: string;
  description?: string;
  color: string;
  nature: string;
  region: string;
  financialCategory: string;
  priority: string;
  taxType: string;
  paymentTerms: number;
  creditLimit: number;
  discountPercent: number;
  icon: string;
}

function toEntry(row: Record<string, unknown>): SupplierGroupEntry {
  return {
    _id: String(row.id),
    id: String(row.id),
    name: String(row.name),
    description: row.description == null ? undefined : String(row.description),
    color: String(row.color ?? "#3b82f6"),
    nature: String(row.nature ?? "Raw Material"),
    region: String(row.region ?? "Local"),
    financialCategory: String(row.financial_category ?? "Credit"),
    priority: String(row.priority ?? "Medium"),
    taxType: String(row.tax_type ?? "GST"),
    paymentTerms: Number(row.payment_terms ?? 30),
    creditLimit: Number(row.credit_limit ?? 0),
    discountPercent: Number(row.discount_percent ?? 0),
    icon: String(row.icon ?? "truck"),
  };
}

const COLUMN_BY_FIELD: Record<string, string> = {
  name: "name",
  description: "description",
  color: "color",
  nature: "nature",
  region: "region",
  financialCategory: "financial_category",
  priority: "priority",
  taxType: "tax_type",
  paymentTerms: "payment_terms",
  creditLimit: "credit_limit",
  discountPercent: "discount_percent",
  icon: "icon",
};

export async function createSupplierGroup(data: Partial<SupplierGroupEntry>): Promise<SupplierGroupEntry> {
  const rows = await query(
    `INSERT INTO erp.supplier_group
       (name, description, color, nature, region, financial_category, priority, tax_type, payment_terms, credit_limit, discount_percent, icon)
     OUTPUT INSERTED.*
     VALUES (@name, @description, @color, @nature, @region, @financialCategory, @priority, @taxType, @paymentTerms, @creditLimit, @discountPercent, @icon)`,
    {
      name: data.name,
      description: data.description ?? null,
      color: data.color || "#3b82f6",
      nature: data.nature || "Raw Material",
      region: data.region || "Local",
      financialCategory: data.financialCategory || "Credit",
      priority: data.priority || "Medium",
      taxType: data.taxType || "GST",
      paymentTerms: data.paymentTerms ?? 30,
      creditLimit: data.creditLimit ?? 0,
      discountPercent: data.discountPercent ?? 0,
      icon: data.icon || "truck",
    },
  );
  return toEntry(rows[0]);
}

export async function findSupplierGroupById(id: string): Promise<SupplierGroupEntry | null> {
  const rows = await query("SELECT * FROM erp.supplier_group WHERE id = @id", { id: Number(id) });
  return rows.length ? toEntry(rows[0]) : null;
}

export async function findSupplierGroupByName(name: string): Promise<SupplierGroupEntry | null> {
  const rows = await query(
    "SELECT * FROM erp.supplier_group WHERE LOWER(name) = LOWER(@name)",
    { name },
  );
  return rows.length ? toEntry(rows[0]) : null;
}

export async function listSupplierGroups(): Promise<SupplierGroupEntry[]> {
  const rows = await query("SELECT * FROM erp.supplier_group ORDER BY name");
  return rows.map(toEntry);
}

export async function updateSupplierGroup(
  id: string,
  data: Partial<SupplierGroupEntry>,
): Promise<SupplierGroupEntry | null> {
  const sets: string[] = [];
  const params: Record<string, unknown> = { id: Number(id) };
  for (const [field, column] of Object.entries(COLUMN_BY_FIELD)) {
    if (!(field in data)) continue;
    sets.push(`${column} = @${field}`);
    params[field] = (data as Record<string, unknown>)[field];
  }
  if (!sets.length) return findSupplierGroupById(id);
  sets.push("updated_at = SYSUTCDATETIME()");
  const rows = await query(
    `UPDATE erp.supplier_group SET ${sets.join(", ")} OUTPUT INSERTED.* WHERE id = @id`,
    params,
  );
  return rows.length ? toEntry(rows[0]) : null;
}

export async function deleteSupplierGroup(id: string): Promise<boolean> {
  const rows = await query(
    "DELETE FROM erp.supplier_group OUTPUT DELETED.id WHERE id = @id",
    { id: Number(id) },
  );
  return rows.length > 0;
}
