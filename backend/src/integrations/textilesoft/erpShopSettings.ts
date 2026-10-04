/**
 * Shop (online store) settings -- single-shop deployment, so this is always exactly one row
 * (erp.shop_settings), not one per tenant/user like the old Mongo ShopSettings.
 */
import { query } from "./erpDb.js";

export interface ShopSettingsEntry {
  _id: string;
  id: string;
  shopEnabled: boolean;
  customDomain: string;
  theme: string;
  supportEmail: string;
  plan: string;
  productsLimit: number;
  apiAccess: boolean;
  whiteLabeling: boolean;
}

function toEntry(row: Record<string, unknown>): ShopSettingsEntry {
  return {
    _id: String(row.id),
    id: String(row.id),
    shopEnabled: !!row.shop_enabled,
    customDomain: String(row.custom_domain ?? ""),
    theme: String(row.theme ?? "Basic"),
    supportEmail: String(row.support_email ?? ""),
    plan: String(row.plan ?? "Starter"),
    productsLimit: Number(row.products_limit ?? 50),
    apiAccess: !!row.api_access,
    whiteLabeling: !!row.white_labeling,
  };
}

/** Reads the single settings row, creating the default one on first use. */
export async function getShopSettings(): Promise<ShopSettingsEntry> {
  const rows = await query("SELECT TOP 1 * FROM erp.shop_settings ORDER BY id");
  if (rows.length) return toEntry(rows[0]);
  const created = await query(
    `INSERT INTO erp.shop_settings DEFAULT VALUES;
     SELECT TOP 1 * FROM erp.shop_settings ORDER BY id DESC`,
  );
  return toEntry(created[0]);
}

const COLUMN_BY_FIELD: Record<string, string> = {
  shopEnabled: "shop_enabled",
  customDomain: "custom_domain",
  theme: "theme",
  supportEmail: "support_email",
  plan: "plan",
  productsLimit: "products_limit",
  apiAccess: "api_access",
  whiteLabeling: "white_labeling",
};

/** Updates whichever fields are present in `data`, creating the row first if needed. */
export async function updateShopSettings(
  data: Record<string, unknown>,
): Promise<ShopSettingsEntry> {
  const current = await getShopSettings();
  const sets: string[] = [];
  const params: Record<string, unknown> = { id: Number(current.id) };
  for (const [field, column] of Object.entries(COLUMN_BY_FIELD)) {
    if (!(field in data)) continue;
    sets.push(`${column} = @${field}`);
    params[field] = data[field];
  }
  if (!sets.length) return current;
  sets.push("updated_at = SYSUTCDATETIME()");
  const rows = await query(
    `UPDATE erp.shop_settings SET ${sets.join(", ")} OUTPUT INSERTED.* WHERE id = @id`,
    params,
  );
  return toEntry(rows[0]);
}
