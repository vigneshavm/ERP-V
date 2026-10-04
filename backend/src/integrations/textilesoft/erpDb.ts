/**
 * Data access for the ERP's own tables (schema `erp`, same database as Textilesoft's `dbo` -- see
 * LEGACYTOMODERN_SQL_ONLY_STRATEGY.md section 6.1). Reuses the existing write pool (sqlWriter, logged in
 * as TEXTILESOFT_DB_WRITE_USER) so there is still exactly one mssql pool per process; `erp.*` grants for
 * that login are applied by ensureErpDbAccess (sqlDbAccess.ts).
 *
 * Every `erp` table access should go through query()/tx() here, not a fresh ConnectionPool, so retries,
 * transactions and the deadlock-retry policy stay consistent.
 */
import { sqlWriter, SqlWriteError } from "./sqlWrite.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Row = Record<string, any>;

/** SQL Server error number for "transaction was deadlocked"; safe to retry. */
const DEADLOCK_ERROR_NUMBER = 1205;

/** Parameterised query against `erp.*` on the shared write pool (no transaction). */
export async function query(
  text: string,
  params: Record<string, unknown> = {},
): Promise<Row[]> {
  const { pool } = await sqlWriter();
  const req = pool.request();
  for (const [k, v] of Object.entries(params))
    req.input(k, v === undefined ? null : v);
  const res = await req.query(text);
  return res?.recordset ?? [];
}

export interface ErpTx {
  query(text: string, params?: Record<string, unknown>): Promise<Row[]>;
}

/**
 * Runs fn in one SQL transaction against `erp.*`. Commits if fn resolves, rolls back if it throws.
 * Retries once on a deadlock (error 1205), which is the only failure it's safe to retry blindly.
 */
export async function tx<T>(
  label: string,
  fn: (t: ErpTx) => Promise<T>,
): Promise<T> {
  for (let attempt = 1; attempt <= 2; attempt++) {
    const { mssql, pool } = await sqlWriter();
    const trx = new mssql.Transaction(pool);
    await trx.begin();
    try {
      const t: ErpTx = {
        async query(text, params = {}) {
          const req = new mssql.Request(trx);
          for (const [k, v] of Object.entries(params))
            req.input(k, v === undefined ? null : v);
          const res = await req.query(text);
          return res?.recordset ?? [];
        },
      };
      const result = await fn(t);
      await trx.commit();
      return result;
    } catch (err) {
      try {
        await trx.rollback();
      } catch {
        /* connection already gone -- nothing more to roll back */
      }
      const isDeadlock = (err as { number?: number })?.number === DEADLOCK_ERROR_NUMBER;
      if (isDeadlock && attempt === 1) continue;
      if (err instanceof SqlWriteError) throw err;
      throw new SqlWriteError(
        `${label} failed: ${(err as Error).message}`,
        503,
      );
    }
  }
  // Unreachable (loop always returns or throws), kept for TypeScript's control-flow analysis.
  throw new SqlWriteError(`${label} failed after retry.`, 503);
}
