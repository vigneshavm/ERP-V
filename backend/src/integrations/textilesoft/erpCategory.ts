/**
 * Inventory categories (erp.category). Single-shop: no tenantId. Merged at the service layer
 * (category.service.ts) with Item-derived categories and sector-mapped master data, which stay on
 * MongoDB for now (Item hasn't migrated; BusinessSector/ProductCategoryModel are a separate concern).
 */
import { query } from "./erpDb.js";

export interface CategoryEntry {
  _id: string;
  id: string;
  name: string;
  description?: string;
  color: string;
  gstRate: number;
  defaultUnit: string;
  isActive: boolean;
  createdAt: Date;
}

function toEntry(row: Record<string, unknown>): CategoryEntry {
  return {
    _id: String(row.id),
    id: String(row.id),
    name: String(row.name),
    description: row.description == null ? undefined : String(row.description),
    color: String(row.color ?? "#6366f1"),
    gstRate: Number(row.gst_rate ?? 5),
    defaultUnit: String(row.default_unit ?? "pcs"),
    isActive: !!row.is_active,
    createdAt: row.created_at ? new Date(String(row.created_at)) : new Date(),
  };
}

export async function listCategories(search?: string): Promise<CategoryEntry[]> {
  const rows = search
    ? await query("SELECT * FROM erp.category WHERE name LIKE @search ORDER BY name", { search: `%${search}%` })
    : await query("SELECT * FROM erp.category ORDER BY name");
  return rows.map(toEntry);
}

export async function listCategoryNames(): Promise<string[]> {
  const rows = await query("SELECT name FROM erp.category");
  return rows.map((r) => String(r.name));
}

export async function findCategoryByName(name: string): Promise<CategoryEntry | null> {
  const rows = await query(
    "SELECT * FROM erp.category WHERE LOWER(name) = LOWER(@name)",
    { name },
  );
  return rows.length ? toEntry(rows[0]) : null;
}

export async function createCategory(data: {
  name: string;
  description?: string;
  color?: string;
  gstRate?: number;
  defaultUnit?: string;
}): Promise<CategoryEntry> {
  const rows = await query(
    `INSERT INTO erp.category (name, description, color, gst_rate, default_unit, is_active)
     OUTPUT INSERTED.*
     VALUES (@name, @description, @color, @gstRate, @defaultUnit, 1)`,
    {
      name: data.name,
      description: data.description ?? null,
      color: data.color || "#6366f1",
      gstRate: data.gstRate ?? 5,
      defaultUnit: data.defaultUnit || "pcs",
    },
  );
  return toEntry(rows[0]);
}
