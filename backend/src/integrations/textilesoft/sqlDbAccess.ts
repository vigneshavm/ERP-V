/**
 * Gives the ERP's own SQL logins their access to the shop database again. A RESTORE ... WITH REPLACE
 * replaces the whole database, including its user list, so after every restore of SSS_copy the ERP's
 * database users are gone (the server-level logins survive). This re-creates them and re-grants:
 *   - TEXTILESOFT_DB_USER        (reads):  SELECT on schema dbo
 *   - TEXTILESOFT_DB_WRITE_USER  (POS bills, if set): SELECT on dbo + INSERT on dbo.sales2, dbo.salsntry
 * It runs as TEXTILESOFT_ADMIN_USER (needs rights to create users in the database, e.g. sysadmin).
 * Safe to run any number of times.
 */
import { loadDbConfig } from "./shopDbReader.js";
import { info, warn } from "../../config/logger.js";

export interface DbAccessResult {
    database: string;
    applied: string[];
    skipped: string[];
}

const SAFE_NAME = /^[A-Za-z0-9_.-]{1,128}$/;
const quote = (name: string): string => `[${name.replace(/]/g, "]]")}]`;

/** True when separate admin credentials are configured (needed to create users / run restores). */
export function adminConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
    return Boolean(env.TEXTILESOFT_ADMIN_USER && env.TEXTILESOFT_ADMIN_PASSWORD);
}

export async function ensureErpDbAccess(targetDb?: string): Promise<DbAccessResult> {
    const cfg = loadDbConfig();
    const database = targetDb || cfg.database;
    if (!/^[a-zA-Z0-9_]+$/.test(database)) throw new Error(`Invalid database name '${database}'.`);
    if (!adminConfigured()) {
        throw new Error("TEXTILESOFT_ADMIN_USER / TEXTILESOFT_ADMIN_PASSWORD are not set, so the ERP logins' database access can't be restored automatically.");
    }
    const adminUser = String(process.env.TEXTILESOFT_ADMIN_USER);

    const grants: { login: string; statements: string[] }[] = [];
    const readUser = cfg.user;
    const writeUser = process.env.TEXTILESOFT_DB_WRITE_USER;
    if (readUser) grants.push({ login: readUser, statements: ["GRANT SELECT ON SCHEMA::dbo TO {u};"] });
    if (writeUser) {
        grants.push({
            login: writeUser,
            statements: ["GRANT SELECT ON SCHEMA::dbo TO {u};", "GRANT INSERT ON dbo.sales2 TO {u};", "GRANT INSERT ON dbo.salsntry TO {u};"],
        });
    }

    const mssql = (await import("mssql")).default;
    const pool = new mssql.ConnectionPool({
        server: cfg.server,
        port: cfg.instanceName ? undefined : cfg.port,
        database: "master",
        user: adminUser,
        password: String(process.env.TEXTILESOFT_ADMIN_PASSWORD),
        connectionTimeout: cfg.connectionTimeoutMs,
        requestTimeout: 60000,
        options: { instanceName: cfg.instanceName, encrypt: cfg.encrypt, trustServerCertificate: cfg.trustServerCertificate },
    });
    await pool.connect();

    const result: DbAccessResult = { database, applied: [], skipped: [] };
    try {
        for (const g of grants) {
            const login = g.login.trim();
            if (!SAFE_NAME.test(login)) {
                result.skipped.push(`${login} (unsupported characters in login name)`);
                continue;
            }
            // The admin login and 'sa' already have full access; creating a user for them would fail.
            if (login.toLowerCase() === adminUser.toLowerCase() || login.toLowerCase() === "sa") {
                result.skipped.push(`${login} (admin login)`);
                continue;
            }
            const req = pool.request();
            req.input("login", login);
            const [exists] = (await req.query("SELECT SUSER_ID(@login) AS id")).recordset;
            if (exists?.id == null) {
                result.skipped.push(`${login} (no such login on the server -- create it once with CREATE LOGIN)`);
                continue;
            }
            const u = quote(login);
            // CREATE USER if missing; if the restored database brought a same-named user from the shop's
            // server, re-link it to this server's login (fixes "orphaned" users).
            const batch = [
                `USE ${quote(database)};`,
                `IF DATABASE_PRINCIPAL_ID(N'${login}') IS NULL CREATE USER ${u} FOR LOGIN ${u};`,
                `ELSE ALTER USER ${u} WITH LOGIN = ${u};`,
                ...g.statements.map((s) => s.split("{u}").join(u)),
            ].join("\n");
            await pool.request().batch(batch);
            result.applied.push(login);
        }
    } finally {
        await pool.close();
    }
    info(`[sql-access] ${database}: access restored for ${result.applied.join(", ") || "no logins"}${result.skipped.length ? `; skipped ${result.skipped.join("; ")}` : ""}`);
    return result;
}

/** Errors that mean "this login can't use the database" -- typically right after a restore. */
export function isDbAccessError(err: unknown): boolean {
    const msg = (err as Error)?.message || String(err);
    return /Cannot open database|Failed to open the explicitly specified database|permission was denied|is not able to access the database/i.test(msg);
}

let lastHealAt = 0;

/**
 * Called when a connection or query was refused for lack of database access: if admin credentials are
 * configured, re-applies access (at most once every 2 minutes) and returns true so the caller can retry.
 */
export async function healDbAccess(err: unknown): Promise<boolean> {
    if (!isDbAccessError(err) || !adminConfigured()) return false;
    if (Date.now() - lastHealAt < 120_000) return false;
    lastHealAt = Date.now();
    try {
        warn(`[sql-access] access refused (${(err as Error)?.message}); re-applying ERP database access...`);
        const res = await ensureErpDbAccess();
        return res.applied.length > 0;
    } catch (e) {
        warn(`[sql-access] could not re-apply access - ${(e as Error).message}`);
        return false;
    }
}
