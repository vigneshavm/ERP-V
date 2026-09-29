/**
 * Restore that keeps recent local bills.
 *
 * Restoring the shop backup over SSS_copy would erase bills that exist only locally: bills made after the
 * backup's last bill, and every ERP POS bill (those are written only to SSS_copy, never to the shop DB the
 * backup comes from). This restores the backup into a side copy, carries those bills over by their unique
 * key, verifies, and only then swaps the side copy in as the target database:
 *
 *   1. RESTORE the .bak into <target>__incoming (the target is not touched)
 *   2. last bill time in the backup (B) vs in the local target (L), using sales2.[datetime]
 *   3. freeze the target (RESTRICTED_USER: the ERP's logins can't write; POS bills queue and retry)
 *   4. pick local bills to keep: newer than B, or written by the ERP (UserID = TEXTILESOFT_POS_USERID),
 *      and NOT already in the backup -- matched on sysidandbill, so nothing is copied twice
 *   5. save them to a JSON file (backups/restore-carryover/...) before anything else changes
 *   6. insert them (header + lines) into the incoming copy in one transaction
 *   7. verify: each carried bill present exactly once with all its lines; latest bill >= L
 *   8. swap: target -> <target>__previous (rollback copy), incoming -> target
 * Any failure before step 8 drops the incoming copy and leaves the target exactly as it was.
 */
import fs from "fs";
import path from "path";
import { info, warn } from "../../config/logger.js";
import type { ShopDbConfig } from "./shopDbReader.js";

export interface CarryoverReport {
    /** Latest bill in the backup (sales2.[datetime]), ISO. */
    backupLastBillAt: string | null;
    /** Latest bill in the local database before the restore, ISO. */
    localLastBillAt: string | null;
    localWasNewer: boolean;
    /** Bills carried over from the local database (sysidandbill). */
    carried: { key: string; billNo: string; at: string | null; lines: number; userId: string }[];
    /** Local bills whose key already exists in the backup with different content: kept out, listed here. */
    conflicts: { key: string; localAt: string | null; backupAt: string | null }[];
    /** Latest bill after the restore, ISO. */
    finalLastBillAt: string | null;
    verified: boolean;
    savedTo?: string;
    previousDatabase?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

const q = (name: string): string => `[${name.replace(/]/g, "]]")}]`;
const iso = (v: unknown): string | null => (v ? new Date(v as string).toISOString() : null);
const BILL_TIME = (alias: string) => `COALESCE(${alias}.[datetime], CAST(${alias}.[date] AS datetime))`;

async function columns(pool: Any, db: string, table: string): Promise<{ name: string; identity: boolean }[]> {
    const req = pool.request();
    req.input("t", table);
    const res = await req.query(
        `SELECT c.name, c.is_identity AS ident FROM ${q(db)}.sys.columns c ` +
            `JOIN ${q(db)}.sys.tables t ON t.object_id = c.object_id JOIN ${q(db)}.sys.schemas s ON s.schema_id = t.schema_id ` +
            `WHERE s.name = 'dbo' AND t.name = @t AND c.is_computed = 0 AND TYPE_NAME(c.system_type_id) NOT IN ('timestamp', 'rowversion')`,
    );
    return res.recordset.map((r: Any) => ({ name: String(r.name), identity: Boolean(r.ident) }));
}

async function lastBillAt(pool: Any, db: string): Promise<Date | null> {
    const res = await pool.request().query(`SELECT MAX(${BILL_TIME("s")}) AS t FROM ${q(db)}.dbo.[sales2] AS s`);
    return res.recordset[0]?.t ? new Date(res.recordset[0].t) : null;
}

async function dbExists(pool: Any, db: string): Promise<boolean> {
    const req = pool.request();
    req.input("d", db);
    return (await req.query("SELECT DB_ID(@d) AS id")).recordset[0]?.id != null;
}

async function dropDb(pool: Any, db: string): Promise<void> {
    await pool.request().batch(
        `IF DB_ID(N'${db}') IS NOT NULL BEGIN ALTER DATABASE ${q(db)} SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE ${q(db)}; END`,
    );
}

/** RESTORE the .bak into `db` under new physical file names (so it can sit next to the target). */
async function restoreInto(pool: Any, mssql: Any, bakPath: string, db: string): Promise<void> {
    const fl = pool.request();
    fl.input("p", mssql.NVarChar, bakPath);
    const files = (await fl.query("RESTORE FILELISTONLY FROM DISK = @p")).recordset as Any[];
    const [dirs] = (await pool.request().query(
        "SELECT CAST(SERVERPROPERTY('InstanceDefaultDataPath') AS nvarchar(400)) AS data, CAST(SERVERPROPERTY('InstanceDefaultLogPath') AS nvarchar(400)) AS log, " +
            "(SELECT TOP 1 physical_name FROM sys.master_files WHERE database_id = 1 AND file_id = 1) AS master",
    )).recordset;
    const fallback = path.win32.dirname(String(dirs.master || "C:\\")) + "\\";
    const dataDir = String(dirs.data || fallback);
    const logDir = String(dirs.log || dataDir);
    // Unique per restore: after the swap these files belong to the live database, so the next restore
    // must not reuse their names.
    const stamp = new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
    const moves = files.map((f, i) => {
        const ext = String(f.Type) === "L" ? ".ldf" : i === 0 ? ".mdf" : ".ndf";
        const target = `${String(f.Type) === "L" ? logDir : dataDir}${db}_${stamp}_${i}${ext}`;
        return `MOVE N'${String(f.LogicalName).replace(/'/g, "''")}' TO N'${target.replace(/'/g, "''")}'`;
    });
    const req = pool.request();
    req.input("p", mssql.NVarChar, bakPath);
    await req.query(`RESTORE DATABASE ${q(db)} FROM DISK = @p WITH ${moves.join(", ")}, REPLACE, RECOVERY`);
}

export async function restoreWithCarryover(bakPath: string, target: string, cfg: ShopDbConfig): Promise<CarryoverReport> {
    const incoming = `${target}__incoming`;
    const previous = `${target}__previous`;
    const erpUser = (process.env.TEXTILESOFT_POS_USERID || "ERP").trim();

    const mssql = (await import("mssql")).default;
    const pool = new mssql.ConnectionPool({
        server: cfg.server,
        port: cfg.instanceName ? undefined : cfg.port,
        database: "master",
        user: cfg.user,
        password: cfg.password,
        connectionTimeout: cfg.connectionTimeoutMs,
        requestTimeout: 1_800_000, // restores of a large shop DB can take a while
        options: { instanceName: cfg.instanceName, encrypt: cfg.encrypt, trustServerCertificate: cfg.trustServerCertificate },
    });
    await pool.connect();

    const report: CarryoverReport = {
        backupLastBillAt: null, localLastBillAt: null, localWasNewer: false, carried: [], conflicts: [], finalLastBillAt: null, verified: false,
    };
    let targetFrozen = false;
    try {
        // 1. Backup -> side copy.
        await dropDb(pool, incoming);
        info(`[sql-restore] restoring backup into side copy [${incoming}]...`);
        await restoreInto(pool, mssql, bakPath, incoming);

        // 2. Compare last bill times.
        const B = await lastBillAt(pool, incoming);
        report.backupLastBillAt = iso(B);
        const hasTarget = await dbExists(pool, target);
        let L: Date | null = null;

        if (hasTarget) {
            // 3. Freeze writes on the target so no bill is made between the copy and the swap.
            await pool.request().batch(`ALTER DATABASE ${q(target)} SET RESTRICTED_USER WITH ROLLBACK IMMEDIATE`);
            targetFrozen = true;
            L = await lastBillAt(pool, target);
            report.localLastBillAt = iso(L);
            report.localWasNewer = Boolean(L && (!B || L > B));
            info(`[sql-restore] last bill: backup ${report.backupLastBillAt ?? "none"}, local ${report.localLastBillAt ?? "none"}${report.localWasNewer ? " (local is newer)" : ""}`);

            const headCols = await columns(pool, target, "sales2");
            const incHead = new Set((await columns(pool, incoming, "sales2")).map((c) => c.name));
            const lineCols = await columns(pool, target, "salsntry");
            const incLine = new Set((await columns(pool, incoming, "salsntry")).map((c) => c.name));
            const hasUser = headCols.some((c) => c.name === "UserID");

            // 4. Bills to keep: newer than the backup, or ERP-written; and not already in the backup.
            const pick = pool.request();
            pick.input("b", mssql.DateTime, B ?? new Date(0));
            pick.input("u", mssql.NVarChar, erpUser);
            const candidates = (await pick.query(
                `SELECT t.[sysidandbill] AS k, t.[mode] AS billNo, ${BILL_TIME("t")} AS at, ${hasUser ? "LTRIM(RTRIM(t.[UserID]))" : "''"} AS userId, ` +
                    `x.[sysidandbill] AS inBackup, ${BILL_TIME("x")} AS backupAt, ` +
                    `(SELECT COUNT(*) FROM ${q(target)}.dbo.[salsntry] l WHERE l.[systemidbill] = t.[sysidandbill]) AS lines ` +
                    `FROM ${q(target)}.dbo.[sales2] AS t ` +
                    `LEFT JOIN ${q(incoming)}.dbo.[sales2] AS x ON x.[sysidandbill] = t.[sysidandbill] ` +
                    `WHERE NULLIF(LTRIM(RTRIM(t.[sysidandbill])), '') IS NOT NULL AND (${BILL_TIME("t")} > @b${hasUser ? " OR LTRIM(RTRIM(t.[UserID])) = @u" : ""})`,
            )).recordset as Any[];

            const toCarry = candidates.filter((c) => c.inBackup == null);
            // Same key already in the backup: identical bill if the time matches (nothing to do), else a clash.
            report.conflicts = candidates
                .filter((c) => c.inBackup != null && iso(c.at) !== iso(c.backupAt))
                .map((c) => ({ key: String(c.k), localAt: iso(c.at), backupAt: iso(c.backupAt) }));

            const keys = toCarry.map((c) => String(c.k));
            // 5. Save the bills being kept AND any clashing ones (headers + lines) before anything changes.
            const saveKeys = [...keys, ...report.conflicts.map((c) => c.key)];
            if (saveKeys.length) {
                const dump: Any = {
                    target, backupFile: bakPath, backupLastBillAt: report.backupLastBillAt, savedAt: new Date().toISOString(),
                    conflictKeys: report.conflicts.map((c) => c.key), bills: [],
                };
                for (let i = 0; i < saveKeys.length; i += 500) {
                    const chunk = saveKeys.slice(i, i + 500);
                    const r1 = pool.request();
                    const r2 = pool.request();
                    const ph = chunk.map((k, j) => { r1.input(`k${j}`, k); r2.input(`k${j}`, k); return `@k${j}`; }).join(",");
                    const heads = (await r1.query(`SELECT * FROM ${q(target)}.dbo.[sales2] WHERE [sysidandbill] IN (${ph})`)).recordset;
                    const lines = (await r2.query(`SELECT * FROM ${q(target)}.dbo.[salsntry] WHERE [systemidbill] IN (${ph})`)).recordset;
                    for (const h of heads) dump.bills.push({ header: h, lines: lines.filter((l: Any) => l.systemidbill === h.sysidandbill) });
                }
                const dir = path.resolve(process.cwd(), "backups", "restore-carryover");
                await fs.promises.mkdir(dir, { recursive: true });
                report.savedTo = path.join(dir, `${target}_${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
                await fs.promises.writeFile(report.savedTo, JSON.stringify(dump, null, 1), "utf8");
                info(`[sql-restore] saved ${saveKeys.length} local bill(s) to ${report.savedTo}`);
            }

            if (keys.length) {

                // 6. Re-apply into the side copy: one transaction; [No] renumbered after the backup's own rows
                //    (unless it's an identity column, which SQL Server fills in).
                const tx = new mssql.Transaction(pool);
                await tx.begin();
                try {
                    const copy = async (table: string, cols: { name: string; identity: boolean }[], incCols: Set<string>, keyCol: string) => {
                        const usable = cols.filter((c) => !c.identity && incCols.has(c.name));
                        const noCol = usable.find((c) => c.name === "No");
                        const list = usable.map((c) => q(c.name)).join(", ");
                        const sel = usable
                            .map((c) => (c === noCol
                                ? `(SELECT ISNULL(MAX([No]), 0) FROM ${q(incoming)}.dbo.${q(table)}) + ROW_NUMBER() OVER (ORDER BY t.[No])`
                                : `t.${q(c.name)}`))
                            .join(", ");
                        for (let i = 0; i < keys.length; i += 500) {
                            const chunk = keys.slice(i, i + 500);
                            const req = new mssql.Request(tx);
                            const ph = chunk.map((k, j) => { req.input(`k${j}`, k); return `@k${j}`; }).join(",");
                            await req.query(
                                `INSERT INTO ${q(incoming)}.dbo.${q(table)} (${list}) SELECT ${sel} FROM ${q(target)}.dbo.${q(table)} AS t ` +
                                    `WHERE t.${q(keyCol)} IN (${ph}) ` +
                                    // never twice: skip keys the side copy already has
                                    `AND NOT EXISTS (SELECT 1 FROM ${q(incoming)}.dbo.${q(table)} AS x WHERE x.${q(keyCol)} = t.${q(keyCol)})`,
                            );
                        }
                    };
                    await copy("sales2", headCols, incHead, "sysidandbill");
                    await copy("salsntry", lineCols, incLine, "systemidbill");
                    await tx.commit();
                } catch (err) {
                    await tx.rollback().catch(() => undefined);
                    throw err;
                }
                report.carried = toCarry.map((c) => ({ key: String(c.k), billNo: String(c.billNo ?? ""), at: iso(c.at), lines: Number(c.lines) || 0, userId: String(c.userId ?? "") }));
            }
        }

        // 7. Verify.
        const F = await lastBillAt(pool, incoming);
        report.finalLastBillAt = iso(F);
        const problems: string[] = [];
        if (L && (!F || F < L)) problems.push(`latest bill after restore (${report.finalLastBillAt}) is older than before (${report.localLastBillAt})`);
        for (let i = 0; i < report.carried.length; i += 500) {
            const chunk = report.carried.slice(i, i + 500);
            const req = pool.request();
            chunk.forEach((c, j) => req.input(`k${j}`, c.key));
            const rows = (await req.query(
                `SELECT h.k, (SELECT COUNT(*) FROM ${q(incoming)}.dbo.[sales2] s WHERE s.[sysidandbill] = h.k) AS heads, ` +
                    `(SELECT COUNT(*) FROM ${q(incoming)}.dbo.[salsntry] l WHERE l.[systemidbill] = h.k) AS lines ` +
                    `FROM (VALUES ${chunk.map((_, j) => `(@k${j})`).join(",")}) AS h(k)`,
            )).recordset as Any[];
            for (const r of rows) {
                const want = chunk.find((c) => c.key === r.k);
                if (Number(r.heads) !== 1) problems.push(`bill ${r.k} is present ${r.heads} times`);
                else if (want && Number(r.lines) !== want.lines) problems.push(`bill ${r.k} has ${r.lines} of ${want.lines} lines`);
            }
        }
        if (problems.length) throw new Error(`Restore check failed, nothing was changed: ${problems.slice(0, 5).join("; ")}${problems.length > 5 ? ` (+${problems.length - 5} more)` : ""}`);
        report.verified = true;

        // 8. Swap: keep the old database as <target>__previous for rollback.
        if (hasTarget) {
            await dropDb(pool, previous);
            await pool.request().batch(
                `ALTER DATABASE ${q(target)} SET SINGLE_USER WITH ROLLBACK IMMEDIATE;\n` +
                    `ALTER DATABASE ${q(target)} MODIFY NAME = ${q(previous)};\n` +
                    `ALTER DATABASE ${q(previous)} SET MULTI_USER;`,
            );
            targetFrozen = false;
            report.previousDatabase = previous;
        }
        try {
            await pool.request().batch(`ALTER DATABASE ${q(incoming)} MODIFY NAME = ${q(target)};`);
        } catch (err) {
            // Put the old database back under its name.
            if (hasTarget) await pool.request().batch(`ALTER DATABASE ${q(previous)} MODIFY NAME = ${q(target)};`).catch(() => undefined);
            throw err;
        }
        info(`[sql-restore] [${target}] now = backup + ${report.carried.length} carried bill(s); latest bill ${report.finalLastBillAt}`);
        return report;
    } catch (err) {
        warn(`[sql-restore] restore aborted - ${(err as Error).message}`);
        await dropDb(pool, incoming).catch(() => undefined);
        throw err;
    } finally {
        if (targetFrozen) await pool.request().batch(`ALTER DATABASE ${q(target)} SET MULTI_USER`).catch(() => undefined);
        await pool.close();
    }
}
