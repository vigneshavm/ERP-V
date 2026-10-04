/**
 * Shared write access to the Textilesoft shop database (TEXTILESOFT_DB_NAME) for everything the ERP saves
 * into Textilesoft's own dbo tables: POS bills, masters (company, branch, warehouse, counter, product,
 * attributes) and purchases.
 *
 * - One pool, logged in as TEXTILESOFT_DB_WRITE_USER (the normal ERP login is read-only). Existing permissions are
 *   inspected separately; this code never repairs database users or grants.
 * - Every save runs inside withSqlTransaction(): all rows are written or none are.
 * - Only columns that actually exist in the target table are written (Textilesoft installs differ).
 * - Codes that Textilesoft numbers as MAX+1 are allocated with nextNumber(), which takes an update lock on
 *   the table for the rest of the transaction, so the ERP and Textilesoft can't hand out the same number.
 */
import { loadDbConfig } from "./shopDbReader.js";
import { getShopPool } from "./shopDbPool.js";
import { info } from "../../config/logger.js";

/** Error with an HTTP status: 400/404/409 = the request is wrong (not retried), 503 = shop DB unavailable. */
export class SqlWriteError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    /** Machine-readable reason for the client (e.g. DUPLICATE_INVOICE); sent as `code`. */
    public code?: string,
  ) {
    super(message);
  }
}

// The tables the write login may change are listed in sqlDbAccess.ts (WRITE_TABLES).

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Mssql = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Pool = any;

let writerPromise: Promise<{
  mssql: Mssql;
  pool: Pool;
  database: string;
}> | null = null;

export async function sqlWriter(): Promise<{
  mssql: Mssql;
  pool: Pool;
  database: string;
}> {
  if (!writerPromise) {
    writerPromise = (async () => {
      const cfg = loadDbConfig();
      const mssql = (await import("mssql")).default;
      const makePool = () =>
        new mssql.ConnectionPool({
          server: cfg.server,
          port: cfg.instanceName ? undefined : cfg.port,
          database: cfg.database,
          user: process.env.TEXTILESOFT_DB_WRITE_USER || cfg.user,
          password: process.env.TEXTILESOFT_DB_WRITE_PASSWORD || cfg.password,
          connectionTimeout: cfg.connectionTimeoutMs,
          requestTimeout: 30000,
          pool: { max: 5, min: 0 },
          options: {
            instanceName: cfg.instanceName,
            encrypt: cfg.encrypt,
            trustServerCertificate: cfg.trustServerCertificate,
          },
        });
      const pool = makePool();
      try {
        await pool.connect();
      } catch (err) {
        await pool.close().catch(() => undefined);
        throw err;
      }
      info(`[sql-write] writer connected to database '${cfg.database}'`);
      return { mssql, pool, database: cfg.database };
    })().catch((err) => {
      writerPromise = null;
      throw err;
    });
  }
  return writerPromise;
}

// ------------------------------------------------------------------------------------------------
// Table columns
// ------------------------------------------------------------------------------------------------

const columnCache = new Map<string, Set<string>>();

/** Columns of dbo.<table> (identity columns are prefixed "#identity:" so they're never written). */
export async function tableColumns(
  pool: Pool,
  table: string,
): Promise<Set<string>> {
  const cached = columnCache.get(table);
  if (cached) return cached;
  const req = pool.request();
  req.input("t", table);
  const res = await req.query(
    "SELECT COLUMN_NAME AS c, COLUMNPROPERTY(OBJECT_ID('dbo.' + TABLE_NAME), COLUMN_NAME, 'IsIdentity') AS ident FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = @t",
  );
  const set = new Set<string>();
  for (const r of res.recordset)
    set.add(Number(r.ident) === 1 ? `#identity:${String(r.c)}` : String(r.c));
  if (set.size === 0)
    throw new SqlWriteError(
      `Table dbo.${table} was not found in the shop database.`,
      503,
    );
  columnCache.set(table, set);
  return set;
}

// ------------------------------------------------------------------------------------------------
// Transactions
// ------------------------------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Row = Record<string, any>;

export interface SqlTx {
  /** Parameterised query inside the transaction. */
  query(text: string, params?: Record<string, unknown>): Promise<Row[]>;
  /** INSERT into dbo.<table>; keys that aren't columns of the table are skipped. */
  insert(table: string, row: Row): Promise<void>;
  /** UPDATE dbo.<table> SET <set> WHERE <where> (equality on each key); returns rows affected. */
  update(table: string, set: Row, where: Row): Promise<number>;
  /** DELETE FROM dbo.<table> WHERE <where>; returns rows affected. */
  remove(table: string, where: Row): Promise<number>;
  /** Textilesoft-style MAX+1 for a numeric code column, under an update lock (see top of file). */
  nextNumber(table: string, column: string, where?: Row): Promise<number>;
}

const ident = (name: string): string => {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name))
    throw new SqlWriteError(`Unsupported column name: ${name}`, 400);
  return `[${name}]`;
};

const whereClause = (
  where: Row,
  prefix: string,
  params: Record<string, unknown>,
): string => {
  const keys = Object.keys(where);
  if (!keys.length)
    throw new SqlWriteError(
      "Refusing to update/delete without a WHERE condition.",
      400,
    );
  return keys
    .map((k, i) => {
      params[`${prefix}${i}`] = where[k];
      // Textilesoft stores most keys as padded varchar: compare trimmed text.
      return `LTRIM(RTRIM(CONVERT(nvarchar(4000), ${ident(k)}))) = LTRIM(RTRIM(CONVERT(nvarchar(4000), @${prefix}${i})))`;
    })
    .join(" AND ");
};

/** Runs fn in one SQL transaction on the write login. Commits if fn resolves, rolls back if it throws. */
export async function withSqlTransaction<T>(
  label: string,
  fn: (tx: SqlTx) => Promise<T>,
): Promise<T> {
  let w;
  try {
    w = await sqlWriter();
  } catch (err) {
    throw new SqlWriteError(
      `Could not connect to the shop database for writing: ${(err as Error).message}`,
      503,
    );
  }
  const { mssql, pool } = w;
  const trx = new mssql.Transaction(pool);
  await trx.begin();

  const query = async (
    text: string,
    params: Record<string, unknown> = {},
  ): Promise<Row[]> => {
    const req = new mssql.Request(trx);
    for (const [k, v] of Object.entries(params))
      req.input(k, v === undefined ? null : v);
    const res = await req.query(text);
    return res.recordset ?? [];
  };
  const affected = async (
    text: string,
    params: Record<string, unknown>,
  ): Promise<number> => {
    const req = new mssql.Request(trx);
    for (const [k, v] of Object.entries(params))
      req.input(k, v === undefined ? null : v);
    const res = await req.query(text);
    return Array.isArray(res.rowsAffected)
      ? res.rowsAffected.reduce((a: number, b: number) => a + b, 0)
      : 0;
  };

  const tx: SqlTx = {
    query,
    async insert(table, row) {
      const cols = await tableColumns(pool, table);
      const keys = Object.keys(row).filter(
        (k) => cols.has(k) && row[k] !== undefined,
      );
      if (!keys.length)
        throw new SqlWriteError(`Nothing to insert into dbo.${table}.`, 400);
      const params: Record<string, unknown> = {};
      keys.forEach((k, i) => (params[`v${i}`] = row[k]));
      await query(
        `INSERT INTO dbo.${ident(table)} (${keys.map(ident).join(", ")}) VALUES (${keys.map((_, i) => `@v${i}`).join(", ")})`,
        params,
      );
    },
    async update(table, set, where) {
      const cols = await tableColumns(pool, table);
      const keys = Object.keys(set).filter(
        (k) => cols.has(k) && set[k] !== undefined,
      );
      if (!keys.length) return 0;
      const params: Record<string, unknown> = {};
      keys.forEach((k, i) => (params[`s${i}`] = set[k]));
      const w2 = whereClause(where, "w", params);
      return affected(
        `UPDATE dbo.${ident(table)} SET ${keys.map((k, i) => `${ident(k)} = @s${i}`).join(", ")} WHERE ${w2}`,
        params,
      );
    },
    async remove(table, where) {
      const params: Record<string, unknown> = {};
      return affected(
        `DELETE FROM dbo.${ident(table)} WHERE ${whereClause(where, "w", params)}`,
        params,
      );
    },
    async nextNumber(table, column, where) {
      const params: Record<string, unknown> = {};
      const cond =
        where && Object.keys(where).length
          ? ` WHERE ${whereClause(where, "n", params)}`
          : "";
      // UPDLOCK + HOLDLOCK keeps the range locked until commit, so a concurrent save (ERP or Textilesoft)
      // waits instead of reading the same MAX.
      const [r] = await query(
        `SELECT ISNULL(MAX(TRY_CAST(${ident(column)} AS bigint)), 0) + 1 AS n FROM dbo.${ident(table)} WITH (UPDLOCK, HOLDLOCK)${cond}`,
        params,
      );
      return Number(r?.n ?? 1);
    },
  };

  try {
    const result = await fn(tx);
    await trx.commit();
    return result;
  } catch (err) {
    await trx.rollback().catch(() => undefined);
    if (err instanceof SqlWriteError) throw err;
    const msg = (err as Error).message || String(err);
    if (/permission|denied/i.test(msg)) {
      throw new SqlWriteError(
        `The shop database refused the change (${msg}). Check TEXTILESOFT_DB_WRITE_USER's permissions.`,
        503,
      );
    }
    throw new SqlWriteError(
      `${label} failed in the shop database: ${msg}`,
      503,
    );
  }
}

/** Read helper on the write pool (sees the ERP's own just-committed rows immediately). */
// Reads use the read pool (erp_readonly), NOT the small write pool, so a slow report can never starve
// POS checkout. Identical reads that are already running are shared (a page load or a refresh fires the
// same report several times; each used to take its own connection and pile up behind the slow one).
const readInflight = new Map<string, Promise<Row[]>>();
export async function sqlRead(
  text: string,
  params: Record<string, unknown> = {},
): Promise<Row[]> {
  const key = `${text}\u0000${JSON.stringify(params, (_k, v) => (v instanceof Date ? v.toISOString() : v))}`;
  const running = readInflight.get(key);
  if (running) return running;
  const p = (async () => {
    let pool;
    try {
      pool = await getShopPool();
    } catch (err) {
      throw new SqlWriteError(
        `Could not connect to the shop database: ${(err as Error).message}`,
        503,
      );
    }
    const req = pool.request();
    for (const [k, v] of Object.entries(params))
      req.input(k, v === undefined ? null : v);
    const res = (await req.query(text)) as { recordset?: Row[] };
    return res.recordset ?? [];
  })();
  readInflight.set(key, p);
  try {
    return await p;
  } finally {
    readInflight.delete(key);
  }
}

/** Textilesoft stores dates in text columns as dd/MM/yyyy. */
export function tsDate(d: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export const txt = (v: unknown): string =>
  v === null || v === undefined ? "" : String(v).trim();
