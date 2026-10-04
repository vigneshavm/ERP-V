/**
 * Where the ERP reads its item catalogue and stock levels from.
 *
 *   ITEM_DATA_SOURCE=sql - the shop's Textilesoft SQL Server database.
 *
 * Routes without a reviewed existing SQL mapping are disabled by the application route allowlist.
 */
export type ItemDataSource = "sql";

export function getItemDataSource(
  env: NodeJS.ProcessEnv = process.env,
): ItemDataSource {
  const raw = (env.ITEM_DATA_SOURCE ?? "sql").trim().toLowerCase();
  if (raw === "sql" || raw === "sqlserver" || raw === "textilesoft") return "sql";
  throw new Error(
    `Invalid ITEM_DATA_SOURCE "${env.ITEM_DATA_SOURCE}" - this build supports SQL only`,
  );
}

export const isSqlItemSource = (): boolean => getItemDataSource() === "sql";
