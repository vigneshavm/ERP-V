import { loadDbConfig, type ShopDbConfig } from "./shopDbReader.js";

/** Connection settings for ERP-owned records in a database separate from Textilesoft SSS. */
export function loadErpOwnedDbConfig(
  env: NodeJS.ProcessEnv = process.env,
): ShopDbConfig {
  const shop = loadDbConfig(env);
  const database = env.ERP_SQL_DB_NAME?.trim();
  const user = env.ERP_SQL_DB_USER?.trim();
  const password = env.ERP_SQL_DB_PASSWORD;

  if (!database)
    throw new Error("ERP_SQL_DB_NAME must name the separate ERP SQL database.");
  if (database.toLowerCase() === shop.database.toLowerCase())
    throw new Error("ERP_SQL_DB_NAME must not be the Textilesoft SSS database.");
  if (!user || !password)
    throw new Error("ERP_SQL_DB_USER and ERP_SQL_DB_PASSWORD are required.");

  return { ...shop, database, user, password };
}

