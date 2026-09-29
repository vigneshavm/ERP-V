import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../../middlewares/authMiddleware.js";
import { AppError } from "../../../utils/AppError.js";
import {
    getAdminDbConfig,
    listBackupFiles,
    verifyBackupHeader,
    restoreDatabaseFromFile,
} from "../../../integrations/textilesoft/sqlRestoreService.js";
import { loadDbConfig, openPool } from "../../../integrations/textilesoft/shopDbReader.js";
import { validateMapping } from "../../../integrations/textilesoft/mapping.js";
import { runSync } from "../../../integrations/textilesoft/syncService.js";
import Backup from "../models/Backup.js";
import path from "path";
import fs from "fs";

export const getSqlRestoreConfig = async (_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const config = getAdminDbConfig();
        const baseConfig = loadDbConfig();

        res.json({
            success: true,
            data: {
                server: config.server,
                port: config.port,
                instanceName: config.instanceName,
                targetDatabase: baseConfig.database,
                defaultBackupDir: config.defaultBackupDir,
                hasAdminCredentials: Boolean(config.user && config.password),
            },
        });
    } catch (err) {
        next(err);
    }
};

export const getDiscoveredBackupFiles = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const directory = (req.query.directory || req.body?.directory) as string | undefined;
        const files = await listBackupFiles(directory);

        res.json({
            success: true,
            data: files,
        });
    } catch (err) {
        next(err);
    }
};

export const verifyBackupFile = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { filePath } = req.body;
        if (!filePath) {
            throw new AppError("filePath is required", 400);
        }

        const details = await verifyBackupHeader(filePath);

        res.json({
            success: true,
            data: details,
        });
    } catch (err) {
        next(err);
    }
};

export const restoreSqlDatabase = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { filePath, targetDbName, autoSync = true, stockMode = "overwrite" } = req.body;
        const tenantId = req.user?.tenantId?.toString() || req.tenantId?.toString();
        const userId = req.user?._id?.toString() || req.user?.id?.toString() || "system";

        if (!filePath) {
            throw new AppError("filePath is required", 400);
        }

        const result = await restoreDatabaseFromFile(filePath, {
            targetDbName,
            autoSync: Boolean(autoSync),
            tenantId,
            userId,
            stockMode,
        });

        // Record history in Backup collection
        if (tenantId) {
            try {
                const now = new Date();
                await Backup.create({
                    tenantId,
                    date: now.toISOString().slice(0, 10),
                    time: now.toTimeString().slice(0, 5),
                    size: result.headerDetails?.backupSizeBytes || 0,
                    destination: "LOCAL",
                    status: "COMPLETED",
                    modules: ["TEXTILE_SQL_RESTORE"],
                    log: `Restored ${path.basename(filePath)} into [${result.targetDatabase}] in ${(result.durationMs / 1000).toFixed(1)}s.${result.syncReport ? ` Synced: ${result.syncReport.read} items.` : ""}`,
                });
            } catch {
                // Non-critical logging failure
            }
        }

        res.status(200).json({
            success: true,
            data: result,
        });
    } catch (err) {
        next(err);
    }
};

export const triggerTextileSync = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const tenantId = req.user?.tenantId?.toString() || req.tenantId?.toString();
        const userId = req.user?._id?.toString() || req.user?.id?.toString() || "manual-sync";
        const { stockMode = "overwrite" } = req.body;

        if (!tenantId) {
            throw new AppError("Tenant context required", 400);
        }

        const mappingPath = path.resolve(process.cwd(), "textilesoft.mapping.json");
        if (!fs.existsSync(mappingPath)) {
            throw new AppError("textilesoft.mapping.json not found on server", 500);
        }

        const mapping = validateMapping(JSON.parse(await fs.promises.readFile(mappingPath, "utf8")));
        const dbConfig = loadDbConfig();
        const pool = await openPool(dbConfig);

        let report;
        try {
            report = await runSync(pool, mapping, {
                tenantId,
                addedBy: userId,
                dryRun: false,
                stockMode: stockMode as any,
                batchSize: 500,
            });
        } finally {
            await pool.close();
        }

        res.json({
            success: true,
            data: report,
            message: `Sync completed: Read ${report.read} records, inserted ${report.inserted}, updated ${report.updated}, adjusted stock for ${report.stockAdjusted}.`,
        });
    } catch (err) {
        next(err);
    }
};
