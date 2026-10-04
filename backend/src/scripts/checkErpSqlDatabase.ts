import "dotenv/config";
import { closeErpOwnedPool, erpOwnedPool } from "../integrations/textilesoft/erpOwnedDb.js";
import { loadErpOwnedDbConfig } from "../integrations/textilesoft/erpOwnedDbConfig.js";

async function main(): Promise<void> {
  const expected = loadErpOwnedDbConfig().database;
  try {
    const pool = await erpOwnedPool();
    const result = await pool.request().query<{ databaseName: string }>("SELECT DB_NAME() AS databaseName");
    const actual = result.recordset[0]?.databaseName;
    if (!actual || actual.toLowerCase() !== expected.toLowerCase()) {
      throw new Error("Connected database does not match ERP_SQL_DB_NAME.");
    }
    process.stdout.write(`ERP SQL connection verified for database '${actual}'. No schema changes were made.\n`);
  } finally {
    await closeErpOwnedPool();
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`ERP SQL connection check failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
