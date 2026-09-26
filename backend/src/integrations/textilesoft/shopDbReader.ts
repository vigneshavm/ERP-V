import type { BuiltQuery } from "./mapping.js";

/**
 * Read-only access to the Textilesoft SQL Server database ("SSS" on the shop server).
 *
 * Credentials come from the environment -- never from Textilesoft's web.config. Use a dedicated
 * SQL login that has only `db_datareader` on SSS: the adapter only ever issues SELECTs, and the
 * database permission is what actually guarantees that.
 */
export interface ShopDbConfig {
    server: string;
    port?: number;
    /** Named instance, e.g. SQLEXPRESS (needs the SQL Browser service; prefer a fixed port). */
    instanceName?: string;
    database: string;
    user: string;
    password: string;
    encrypt: boolean;
    trustServerCertificate: boolean;
    connectionTimeoutMs: number;
}

export function loadDbConfig(env: NodeJS.ProcessEnv = process.env): ShopDbConfig {
    const missing = ["TEXTILESOFT_DB_HOST", "TEXTILESOFT_DB_USER", "TEXTILESOFT_DB_PASSWORD"].filter((k) => !env[k]);
    if (missing.length) throw new Error(`Missing environment variable(s): ${missing.join(", ")}`);
    const flag = (v: string | undefined, dflt: boolean) => (v === undefined ? dflt : ["1", "true", "yes"].includes(v.toLowerCase()));
    return {
        server: env.TEXTILESOFT_DB_HOST as string,
        port: env.TEXTILESOFT_DB_PORT ? Number(env.TEXTILESOFT_DB_PORT) : undefined,
        instanceName: env.TEXTILESOFT_DB_INSTANCE || undefined,
        database: env.TEXTILESOFT_DB_NAME || "SSS",
        user: env.TEXTILESOFT_DB_USER as string,
        password: env.TEXTILESOFT_DB_PASSWORD as string,
        // Old SQL Express installs typically have no valid TLS certificate.
        encrypt: flag(env.TEXTILESOFT_DB_ENCRYPT, false),
        trustServerCertificate: flag(env.TEXTILESOFT_DB_TRUST_CERT, true),
        connectionTimeoutMs: Number(env.TEXTILESOFT_DB_TIMEOUT_MS || 15000),
    };
}

export interface ShopDbPool {
    request(): ShopDbRequest;
    close(): Promise<void>;
}

// Minimal structural types so this file (and its callers) don't depend on @types/mssql details.
export interface ShopDbRequest {
    stream: boolean;
    input(name: string, value: unknown): unknown;
    query(text: string): Promise<{ recordset: Record<string, unknown>[] }> | void;
    on(event: string, handler: (...args: any[]) => void): unknown; // eslint-disable-line @typescript-eslint/no-explicit-any
    pause(): void;
    resume(): void;
}

export async function openPool(cfg: ShopDbConfig): Promise<ShopDbPool> {
    const mssql = (await import("mssql")).default;
    const pool = new mssql.ConnectionPool({
        server: cfg.server,
        port: cfg.instanceName ? undefined : cfg.port,
        database: cfg.database,
        user: cfg.user,
        password: cfg.password,
        connectionTimeout: cfg.connectionTimeoutMs,
        requestTimeout: 0, // large product scans on an old server: no client-side cut-off
        // max was 2: the background catalogue mirror (ensureMirror/mirrorAll, see sqlItemSource.ts)
        // holds one connection for 30-40s+ on every run, and with only 2 in the pool that alone was
        // enough to starve every other concurrent read (report queries, item lookups) for the same
        // stretch -- those reads don't fail loudly, they throw "operation timed out for an unknown
        // reason" while waiting for a free pool connection, get caught, and fall back to Mongo/local
        // data, which looks identical in the UI to the range genuinely having no sales. Confirmed via
        // logs/combined.log: "[sql-reports] shop sales report failed ... timed out" lines lining up
        // with concurrent "[sql-items] mirrored ... in 3Xs" lines. Widening the pool gives background
        // syncs and foreground reads separate room instead of fighting over 2 slots.
        pool: { max: 6, min: 0 },
        options: {
            instanceName: cfg.instanceName,
            encrypt: cfg.encrypt,
            trustServerCertificate: cfg.trustServerCertificate,
            readOnlyIntent: true,
        },
    });
    await pool.connect();
    return pool as unknown as ShopDbPool;
}

/** Runs a small discovery/sample query and returns all rows. Only used with fixed SQL from this package. */
export async function queryAll(pool: ShopDbPool, text: string): Promise<Record<string, unknown>[]> {
    const req = pool.request();
    const result = await req.query(text);
    return result ? result.recordset : [];
}

/**
 * Streams a (potentially large) product query in batches so the whole table is never held in
 * memory, applying back-pressure to the SQL Server socket while the caller is busy.
 */
export async function* streamRows(
    pool: ShopDbPool,
    query: BuiltQuery,
    batchSize = 500,
): AsyncGenerator<Record<string, unknown>[]> {
    const req = pool.request();
    req.stream = true;
    for (const p of query.params) req.input(p.name, p.value);

    const queue: Record<string, unknown>[][] = [];
    let current: Record<string, unknown>[] = [];
    let done = false;
    let failure: Error | undefined;
    let wake: (() => void) | undefined;
    const notify = () => {
        const w = wake;
        wake = undefined;
        w?.();
    };

    req.on("row", (row: Record<string, unknown>) => {
        current.push(row);
        if (current.length >= batchSize) {
            queue.push(current);
            current = [];
            if (queue.length >= 2) req.pause();
            notify();
        }
    });
    req.on("error", (err: Error) => {
        failure = err;
        notify();
    });
    req.on("done", () => {
        if (current.length) queue.push(current);
        current = [];
        done = true;
        notify();
    });
    req.query(query.text);

    for (;;) {
        const next = queue.shift();
        if (next) {
            yield next;
            req.resume();
            continue;
        }
        if (failure) throw failure;
        if (done) return;
        await new Promise<void>((resolve) => {
            wake = resolve;
        });
    }
}
