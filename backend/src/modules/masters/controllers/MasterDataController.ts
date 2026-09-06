import { Request, Response } from "express";
import { singleton, inject } from "tsyringe";
import { MasterDataService } from "../services/MasterDataService.js";
import { MASTER_TYPES } from "../masterTypes.js";
import { error } from "../../../config/logger.js";

@singleton()
export class MasterDataController {
    constructor(
        @inject(MasterDataService) private masterDataService: MasterDataService
    ) { }

    public listTypes = async (_req: Request, res: Response): Promise<void> => {
        res.status(200).json(MASTER_TYPES);
    };

    public list = async (req: Request, res: Response): Promise<void> => {
        const authReq = req as any;
        try {
            const rows = await this.masterDataService.listByType(
                authReq.tenantId as string,
                req.params.type as string,
                req.query.parentId as string | undefined
            );
            res.status(200).json(rows);
        } catch (err: any) {
            error(`Master Data List Error: ${err.message}`);
            res.status(err.statusCode || 500).json({ message: err.message });
        }
    };

    public create = async (req: Request, res: Response): Promise<void> => {
        const authReq = req as any;
        try {
            const entry = await this.masterDataService.create(
                authReq.tenantId as string,
                req.params.type as string,
                authReq.body,
                authReq.user?._id
            );
            res.status(201).json(entry);
        } catch (err: any) {
            error(`Master Data Create Error: ${err.message}`);
            res.status(err.statusCode || 500).json({ message: err.message });
        }
    };

    public update = async (req: Request, res: Response): Promise<void> => {
        const authReq = req as any;
        try {
            const entry = await this.masterDataService.update(req.params.id as string, authReq.tenantId as string, authReq.body);
            res.status(200).json(entry);
        } catch (err: any) {
            error(`Master Data Update Error: ${err.message}`);
            res.status(err.statusCode || 500).json({ message: err.message });
        }
    };

    public remove = async (req: Request, res: Response): Promise<void> => {
        const authReq = req as any;
        try {
            await this.masterDataService.remove(req.params.id as string, authReq.tenantId as string);
            res.status(200).json({ message: "Deleted" });
        } catch (err: any) {
            error(`Master Data Delete Error: ${err.message}`);
            res.status(err.statusCode || 500).json({ message: err.message });
        }
    };
}
