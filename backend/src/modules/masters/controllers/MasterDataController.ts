import { Request, Response } from "express";
import { singleton, inject } from "tsyringe";
import { MasterDataService } from "../services/MasterDataService.js";
import { MASTER_TYPES } from "../masterTypes.js";
import { error } from "../../../config/logger.js";
import { AuthenticatedRequest } from "../../../middlewares/authMiddleware.js";

@singleton()
export class MasterDataController {
    constructor(
        @inject(MasterDataService) private masterDataService: MasterDataService
    ) { }

    public listTypes = async (_req: Request, res: Response): Promise<void> => {
        res.status(200).json(MASTER_TYPES);
    };

    public list = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const rows = await this.masterDataService.listByType(
                req.tenantId.toString(),
                req.params.type as string,
                req.query.parentId as string | undefined
            );
            res.status(200).json(rows);
        } catch (err: any) {
            error(`Master Data List Error: ${err.message}`);
            res.status(err.statusCode || 500).json({ message: err.message });
        }
    };

    public create = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const entry = await this.masterDataService.create(
                req.tenantId.toString(),
                req.params.type as string,
                req.body,
                req.user._id.toString()
            );
            res.status(201).json(entry);
        } catch (err: any) {
            error(`Master Data Create Error: ${err.message}`);
            res.status(err.statusCode || 500).json({ message: err.message });
        }
    };

    public update = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const entry = await this.masterDataService.update(req.params.id as string, req.tenantId.toString(), req.body);
            res.status(200).json(entry);
        } catch (err: any) {
            error(`Master Data Update Error: ${err.message}`);
            res.status(err.statusCode || 500).json({ message: err.message });
        }
    };

    public remove = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            await this.masterDataService.remove(req.params.id as string, req.tenantId.toString());
            res.status(200).json({ message: "Deleted" });
        } catch (err: any) {
            error(`Master Data Delete Error: ${err.message}`);
            res.status(err.statusCode || 500).json({ message: err.message });
        }
    };
}

