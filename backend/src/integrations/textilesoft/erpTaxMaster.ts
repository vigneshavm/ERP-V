/**
 * Tax codes and rates (erp.tax_master). Single-shop: no tenant scoping. gst_type_id/gst_group_id are
 * additive links to erp.master_entry for reporting hierarchy only -- live tax computation (Item.gstRate,
 * invoice/GSTR) is unchanged and does not depend on this table.
 */
import { query } from "./erpDb.js";

export interface TaxMasterEntry {
  _id: string;
  id: string;
  taxCode: string;
  taxName: string;
  percentage: number;
  isActive: boolean;
}

function toEntry(row: Record<string, unknown>): TaxMasterEntry {
  return {
    _id: String(row.id),
    id: String(row.id),
    taxCode: String(row.tax_code),
    taxName: String(row.tax_name),
    percentage: Number(row.percentage),
    isActive: !!row.is_active,
  };
}

/** Reads the active percentage for a tax code, or `fallbackRate` if not found. */
export async function getTaxPercentage(taxCode: string, fallbackRate: number): Promise<number> {
  const rows = await query(
    "SELECT percentage FROM erp.tax_master WHERE tax_code = @taxCode AND is_active = 1",
    { taxCode },
  );
  return rows.length ? Number(rows[0].percentage) : fallbackRate;
}

/** Upserts a tax code's name/percentage (activates it). */
export async function setTaxMaster(
  taxCode: string,
  taxName: string,
  percentage: number,
): Promise<TaxMasterEntry> {
  const rows = await query(
    `MERGE erp.tax_master AS target
     USING (SELECT @taxCode AS tax_code) AS src
     ON target.tax_code = src.tax_code
     WHEN MATCHED THEN UPDATE SET tax_name = @taxName, percentage = @percentage, is_active = 1, updated_at = SYSUTCDATETIME()
     WHEN NOT MATCHED THEN INSERT (tax_code, tax_name, percentage) VALUES (@taxCode, @taxName, @percentage)
     OUTPUT INSERTED.*;`,
    { taxCode, taxName, percentage },
  );
  return toEntry(rows[0]);
}
