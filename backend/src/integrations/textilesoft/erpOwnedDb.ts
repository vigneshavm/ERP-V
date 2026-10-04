import sql from "mssql";
import { loadErpOwnedDbConfig } from "./erpOwnedDbConfig.js";

let poolPromise: Promise<sql.ConnectionPool> | undefined;

/** Opens a distinct pool for ERP-owned data, never the configured Textilesoft database. */
export async function erpOwnedPool(): Promise<sql.ConnectionPool> {
  if (!poolPromise) {
    const cfg = loadErpOwnedDbConfig();
    const pool = new sql.ConnectionPool({
      server: cfg.server,
      port: cfg.instanceName ? undefined : cfg.port,
      database: cfg.database,
      user: cfg.user,
      password: cfg.password,
      connectionTimeout: cfg.connectionTimeoutMs,
      options: {
        instanceName: cfg.instanceName,
        encrypt: cfg.encrypt,
        trustServerCertificate: cfg.trustServerCertificate,
      },
    });
    poolPromise = pool.connect().catch((error: unknown) => {
      poolPromise = undefined;
      throw error;
    });
  }
  return poolPromise;
}

/** Close the dedicated pool, primarily for one-shot scripts and orderly shutdown. */
export async function closeErpOwnedPool(): Promise<void> {
  if (!poolPromise) return;
  const pool = await poolPromise;
  poolPromise = undefined;
  await pool.close();
}
