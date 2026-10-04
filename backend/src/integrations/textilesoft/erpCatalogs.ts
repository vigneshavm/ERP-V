/**
 * Reference catalogs (erp.brand/color/size) unioned with Item-derived values in the UI -- see
 * InventoryService.getFilterOptions(). Separate from Textilesoft's own dbo.brand/size/color, which
 * sqlMasters.ts already serves for product-attribute masters.
 *
 * All three tables share the same shape (name + one extra field + is_active), so one factory builds
 * all three repositories instead of three near-duplicate files.
 */
import { query } from "./erpDb.js";

export interface CatalogEntry {
  _id: string;
  id: string;
  name: string;
  isActive: boolean;
  [extra: string]: unknown;
}

interface CatalogRepo {
  list(activeOnly?: boolean): Promise<CatalogEntry[]>;
  create(data: Record<string, unknown>): Promise<CatalogEntry>;
}

function toEntry(row: Record<string, unknown>, extraSqlCol: string, extraJsKey: string): CatalogEntry {
  return {
    _id: String(row.id),
    id: String(row.id),
    name: String(row.name),
    isActive: !!row.is_active,
    [extraJsKey]: row[extraSqlCol] ?? null,
  };
}

function makeCatalogRepo(table: "brand" | "color" | "size", extraSqlCol: string, extraJsKey: string): CatalogRepo {
  return {
    async list(activeOnly = true): Promise<CatalogEntry[]> {
      const rows = await query(
        `SELECT id, name, ${extraSqlCol}, is_active FROM erp.${table}
         ${activeOnly ? "WHERE is_active = 1" : ""} ORDER BY name`,
      );
      return rows.map((r) => toEntry(r, extraSqlCol, extraJsKey));
    },
    async create(data: Record<string, unknown>): Promise<CatalogEntry> {
      const rows = await query(
        `INSERT INTO erp.${table} (name, ${extraSqlCol}, is_active)
         OUTPUT INSERTED.id, INSERTED.name, INSERTED.${extraSqlCol}, INSERTED.is_active
         VALUES (@name, @extra, @isActive)`,
        {
          name: String(data.name ?? "").trim(),
          extra: data[extraJsKey] ?? null,
          isActive: data.isActive !== false,
        },
      );
      return toEntry(rows[0], extraSqlCol, extraJsKey);
    },
  };
}

export const brandRepo = makeCatalogRepo("brand", "description", "description");
export const colorRepo = makeCatalogRepo("color", "hex_code", "hexCode");
export const sizeRepo = makeCatalogRepo("size", "code", "code");
