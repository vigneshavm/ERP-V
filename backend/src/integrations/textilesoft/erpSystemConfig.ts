/**
 * Key-value system configuration (erp.system_config). Single-shop: no tenant scoping, one row per key.
 */
import { query } from "./erpDb.js";

function parseValue<T>(raw: string): T {
  return JSON.parse(raw) as T;
}

/** Reads one config value by key, or `fallbackValue` if unset (mirrors the old ConfigService.get). */
export async function getConfig<T>(key: string, fallbackValue: T): Promise<T> {
  const rows = await query(
    "SELECT value FROM erp.system_config WHERE config_key = @key",
    { key },
  );
  if (!rows.length) return fallbackValue;
  try {
    return parseValue<T>(String(rows[0].value));
  } catch {
    return fallbackValue;
  }
}

export interface SystemConfigEntry {
  _id: string;
  id: string;
  key: string;
  value: unknown;
  description: string;
  group: string;
}

function toEntry(row: Record<string, unknown>): SystemConfigEntry {
  let value: unknown = null;
  try {
    value = JSON.parse(String(row.value));
  } catch {
    value = row.value;
  }
  return {
    _id: String(row.id),
    id: String(row.id),
    key: String(row.config_key),
    value,
    description: String(row.description ?? ""),
    group: String(row.config_group ?? "GENERAL"),
  };
}

export async function listConfigs(group?: string): Promise<SystemConfigEntry[]> {
  const rows = group
    ? await query("SELECT * FROM erp.system_config WHERE config_group = @group ORDER BY config_key", { group })
    : await query("SELECT * FROM erp.system_config ORDER BY config_key");
  return rows.map(toEntry);
}

/** Upserts one config key (mirrors the old ConfigService.set). */
export async function setConfig(
  key: string,
  value: unknown,
  group = "GENERAL",
  updatedBy?: string,
): Promise<SystemConfigEntry> {
  const json = JSON.stringify(value);
  const rows = await query(
    `MERGE erp.system_config AS target
     USING (SELECT @key AS config_key) AS src
     ON target.config_key = src.config_key
     WHEN MATCHED THEN UPDATE SET value = @value, config_group = @group, updated_by = @updatedBy, updated_at = SYSUTCDATETIME()
     WHEN NOT MATCHED THEN INSERT (config_key, value, config_group, updated_by) VALUES (@key, @value, @group, @updatedBy)
     OUTPUT INSERTED.*;`,
    { key, value: json, group, updatedBy: updatedBy ?? null },
  );
  return toEntry(rows[0]);
}
