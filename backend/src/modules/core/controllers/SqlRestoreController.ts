import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../../middlewares/authMiddleware.js";
import { AppError } from "../../../utils/AppError.js";
import {
    getAdminDbConfig,
    listBackupFiles,
    verifyBackupHeader,
    restoreDatabaseFromFile,
} from "../../../integrations/textilesoft/sqlRestoreService.js";
import { ensureErpDbAccess, adminConfigured } from "../../../integrations/textilesoft/sqlDbAccess.js";
import { loadDbConfig } from "../../../integrations/textilesoft/shopDbReader.js";

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
        const { filePath, targetDbName } = req.body;
        if (!filePath) {
            throw new AppError("filePath is required", 400);
        }

        const result = await restoreDatabaseFromFile(filePath, {
            targetDbName,
        });

        res.status(200).json({
            success: true,
            data: result,
        });
    } catch (err) {
        next(err);
    }
};

/** Re-applies the ERP logins' database access (the same grants applied after a restore) -- replaces running a GRANT script by hand. */
export const applyErpDbAccess = async (_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        if (!adminConfigured())
            throw new AppError("TEXTILESOFT_ADMIN_USER / TEXTILESOFT_ADMIN_PASSWORD are not set in the backend .env, so access can't be applied from here.", 400);
        const result = await ensureErpDbAccess();
        res.json({
            success: true,
            data: result,
            message: `ERP database access applied on [${result.database}]${result.skipped.length ? ` (skipped: ${result.skipped.join(", ")})` : ""}.`,
        });
    } catch (err) {
        next(err);
    }
};
