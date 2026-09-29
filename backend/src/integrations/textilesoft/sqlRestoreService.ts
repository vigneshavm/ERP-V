import fs from "fs";
import path from "path";
import { info, error, warn } from "../../config/logger.js";
import { loadDbConfig, openPool, type ShopDbConfig } from "./shopDbReader.js";
import { validateMapping } from "./mapping.js";
import { runSync } from "./syncService.js";
import { ensureErpDbAccess, adminConfigured, type DbAccessResult } from "./sqlDbAccess.js";
import { restoreWithCarryover, type CarryoverReport } from "./sqlRestoreCarryover.js";
import type { SyncReport } from "./types.js";

export interface BackupFileInfo {
    fileName: string;
    fullPath: string;
    sizeBytes: number;
    sizeMB: number;
    modifiedAt: Date;
}

export interface BackupHeaderDetails {
    databaseName: string;
    backupStartDate?: Date;
    backupFinishDate?: Date;
    backupSizeBytes?: number;
    backupSizeMB?: number;
    serverName?: string;
    compatibilityLevel?: number;
    softwareVersion?: string;
    isValid: boolean;
}

export interface RestoreResult {
    success: boolean;
    targetDatabase: string;
    filePath: string;
    durationMs: number;
    headerDetails?: BackupHeaderDetails;
    syncReport?: SyncReport;
    /** Local bills kept across the restore, with the before/after last-bill times and the check result. */
    carryover?: CarryoverReport;
    /** ERP logins whose database access was re-created after the restore. */
    access?: DbAccessResult;
    accessError?: string;
    message: string;
}

export interface SqlRestoreOptions {
    targetDbName?: string;
    autoSync?: boolean;
    tenantId?: string;
    userId?: string;
    stockMode?: "overwrite" | "initial-only";
}

/**
 * Returns connection configuration for the admin/master SQL Server connection.
 */
export function getAdminDbConfig(): ShopDbConfig & { defaultBackupDir: string } {
    const baseConfig = loadDbConfig();
    const defaultBackupDir = process.env.TEXTILESOFT_BACKUP_DIR || "C:\\Textilesoft\\Backup";

    return {
        ...baseConfig,
        user: process.env.TEXTILESOFT_ADMIN_USER || baseConfig.user,
        password: process.env.TEXTILESOFT_ADMIN_PASSWORD || baseConfig.password,
        database: "master", // Restores must execute from master database
        defaultBackupDir,
    };
}

/**
 * List .bak files from specified directory or common default backup folders.
 */
export async function listBackupFiles(customDir?: string): Promise<BackupFileInfo[]> {
    const candidateDirs = [
        customDir,
        process.env.TEXTILESOFT_BACKUP_DIR,
        "C:\\Textilesoft\\Backup",
        "C:\\Textile\\Backup",
        "C:\\Backups",
        "D:\\Backups",
        "C:\\Backup",
        "D:\\Backup",
        path.join(process.cwd(), "backups"),
    ].filter((dir): dir is string => !!dir && fs.existsSync(dir));

    const filesFound: BackupFileInfo[] = [];
    const seenPaths = new Set<string>();

    for (const dir of candidateDirs) {
        try {
            const entries = await fs.promises.readdir(dir, { withFileTypes: true });
            for (const entry of entries) {
                if (entry.isFile() && entry.name.toLowerCase().endsWith(".bak")) {
                    const fullPath = path.join(dir, entry.name);
                    if (!seenPaths.has(fullPath)) {
                        seenPaths.add(fullPath);
                        try {
                            const stat = await fs.promises.stat(fullPath);
                            filesFound.push({
                                fileName: entry.name,
                                fullPath,
                                sizeBytes: stat.size,
                                sizeMB: Math.round((stat.size / (1024 * 1024)) * 100) / 100,
                                modifiedAt: stat.mtime,
                            });
                        } catch {
                            // Ignore unreadable individual file
                        }
                    }
                }
            }
        } catch (err) {
            warn(`[sql-restore] Error scanning backup directory '${dir}': ${(err as Error).message}`);
        }
    }

    // Sort latest backups first
    return filesFound.sort((a, b) => b.modifiedAt.getTime() - a.modifiedAt.getTime());
}

/**
 * Validates a .bak file header via SQL Server without restoring it.
 */
export async function verifyBackupHeader(filePath: string): Promise<BackupHeaderDetails> {
    if (!fs.existsSync(filePath)) {
        throw new Error(`Backup file does not exist at path: ${filePath}`);
    }

    const adminConfig = getAdminDbConfig();
    const mssql = (await import("mssql")).default;

    const pool = new mssql.ConnectionPool({
        server: adminConfig.server,
        port: adminConfig.instanceName ? undefined : adminConfig.port,
        database: "master",
        user: adminConfig.user,
        password: adminConfig.password,
        connectionTimeout: adminConfig.connectionTimeoutMs,
        requestTimeout: 60000,
        options: {
            instanceName: adminConfig.instanceName,
            encrypt: adminConfig.encrypt,
            trustServerCertificate: adminConfig.trustServerCertificate,
        },
    });

    await pool.connect();

    try {
        const request = pool.request();
        request.input("filePath", mssql.NVarChar, filePath);
        const result = await request.query("RESTORE HEADERONLY FROM DISK = @filePath");

        const row = result.recordset?.[0] as Record<string, any> | undefined; // eslint-disable-line @typescript-eslint/no-explicit-any
        if (!row) {
            return {
                databaseName: "UNKNOWN",
                isValid: false,
            };
        }

        const sizeBytes = Number(row.BackupSize || row.CompressedBackupSize || 0);

        return {
            databaseName: String(row.DatabaseName || "UNKNOWN"),
            backupStartDate: row.BackupStartDate ? new Date(row.BackupStartDate) : undefined,
            backupFinishDate: row.BackupFinishDate ? new Date(row.BackupFinishDate) : undefined,
            backupSizeBytes: sizeBytes,
            backupSizeMB: Math.round((sizeBytes / (1024 * 1024)) * 100) / 100,
            serverName: row.ServerName ? String(row.ServerName) : undefined,
            compatibilityLevel: row.CompatibilityLevel ? Number(row.CompatibilityLevel) : undefined,
            softwareVersion: row.SoftwareVersionMajor ? `${row.SoftwareVersionMajor}.${row.SoftwareVersionMinor}` : undefined,
            isValid: true,
        };
    } finally {
        await pool.close();
    }
}

/**
 * Restores a SQL Server backup (.bak) file into the target database with REPLACE.
 * Kicks existing connections by temporarily setting SINGLE_USER, restores, and sets MULTI_USER.
 */
export async function restoreDatabaseFromFile(
    filePath: string,
    options: SqlRestoreOptions = {}
): Promise<RestoreResult> {
    const normalizedPath = path.resolve(filePath);

    if (!fs.existsSync(normalizedPath)) {
        throw new Error(`Backup file not found at: ${normalizedPath}`);
    }

    const baseDbConfig = loadDbConfig();
    const targetDb = options.targetDbName || baseDbConfig.database;

    // Strict validation of database name (only alphanumeric and underscores to prevent SQL injection)
    if (!/^[a-zA-Z0-9_]+$/.test(targetDb)) {
        throw new Error(`Invalid target database name '${targetDb}'. Only letters, numbers, and underscores are allowed.`);
    }

    info(`[sql-restore] Starting restore of '${normalizedPath}' into database '${targetDb}'...`);
    const startTime = Date.now();

    // 1. Verify backup header first
    const headerDetails = await verifyBackupHeader(normalizedPath);
    info(`[sql-restore] Verified backup header: Database='${headerDetails.databaseName}', Size=${headerDetails.backupSizeMB}MB`);

    // 2. Restore without losing local bills: backup -> side copy, carry over local bills that are newer
    //    than the backup or were written by the ERP (matched by bill key), verify, then swap it in.
    //    The target is only replaced once the check passes (see sqlRestoreCarryover.ts).
    const adminConfig = getAdminDbConfig();
    const carryover = await restoreWithCarryover(normalizedPath, targetDb, adminConfig);
    info(`[sql-restore] SQL Server restore completed in ${Date.now() - startTime}ms (${carryover.carried.length} local bill(s) kept).`);

    // 2b. The restore replaced the database's user list: give the ERP's read (and POS write) logins
    // their access back straight away, so reading and POS billing keep working without SSMS.
    let access: DbAccessResult | undefined;
    let accessError: string | undefined;
    if (adminConfigured()) {
        try {
            access = await ensureErpDbAccess(targetDb);
        } catch (err) {
            accessError = (err as Error).message;
            warn(`[sql-restore] restored, but re-applying ERP login access failed - ${accessError}`);
        }
    } else {
        accessError = "TEXTILESOFT_ADMIN_USER is not set, so ERP login access was not re-applied.";
    }

    let syncReport: SyncReport | undefined;

    // 3. Trigger ERP catalog sync if requested
    if (options.autoSync && options.tenantId) {
        info(`[sql-restore] Auto-sync requested for tenant ${options.tenantId}. Initiating ERP sync from restored [${targetDb}]...`);
        try {
            const mappingPath = path.resolve(process.cwd(), "textilesoft.mapping.json");
            if (fs.existsSync(mappingPath)) {
                const mappingContent = JSON.parse(await fs.promises.readFile(mappingPath, "utf8"));
                const mapping = validateMapping(mappingContent);

                // Open pool to the newly restored target database
                const syncDbConfig: ShopDbConfig = {
                    ...baseDbConfig,
                    database: targetDb,
                };

                const targetPool = await openPool(syncDbConfig);
                try {
                    syncReport = await runSync(targetPool, mapping, {
                        tenantId: options.tenantId,
                        addedBy: options.userId || "sql-restore",
                        dryRun: false,
                        stockMode: options.stockMode || "overwrite",
                        batchSize: 500,
                    });
                    info(`[sql-restore] Sync completed: Read=${syncReport.read}, Inserted=${syncReport.inserted}, Updated=${syncReport.updated}, StockAdjusted=${syncReport.stockAdjusted}`);
                } finally {
                    await targetPool.close();
                }
            } else {
                warn(`[sql-restore] Mapping file not found at ${mappingPath}. Skipping sync.`);
            }
        } catch (syncErr) {
            error(`[sql-restore] Sync after restore encountered an error: ${(syncErr as Error).message}`);
        }
    }

    const durationMs = Date.now() - startTime;

    return {
        success: true,
        targetDatabase: targetDb,
        filePath: normalizedPath,
        durationMs,
        headerDetails,
        syncReport,
        carryover,
        access,
        accessError,
        message: `Database '${targetDb}' successfully restored from '${path.basename(normalizedPath)}' in ${(durationMs / 1000).toFixed(1)}s.${syncReport ? ` Synced ${syncReport.read} items (${syncReport.updated} updated, ${syncReport.inserted} inserted).` : ""}` +
            ` Last bill: backup ${carryover.backupLastBillAt ?? "none"}, local ${carryover.localLastBillAt ?? "none"}, now ${carryover.finalLastBillAt ?? "none"}.` +
            (carryover.carried.length ? ` Kept ${carryover.carried.length} local bill(s) not in the backup (verified, each once).` : " No local bills needed keeping.") +
            (carryover.conflicts.length ? ` ${carryover.conflicts.length} local bill(s) share a bill key with a different backup bill and were NOT copied; see carryover.conflicts.` : "") +
            (carryover.previousDatabase ? ` Previous database kept as [${carryover.previousDatabase}].` : "") +
            (access ? ` ERP access re-applied for: ${access.applied.join(", ") || "none"}.` : "") +
            (accessError ? ` Warning: ${accessError}` : ""),
    };
}
