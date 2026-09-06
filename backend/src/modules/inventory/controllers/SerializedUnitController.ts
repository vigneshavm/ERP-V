import { Request, Response } from "express";
import { singleton, inject } from "tsyringe";
import { SerializedUnitService } from "../services/SerializedUnitService.js";
import { error } from "../../../config/logger.js";

@singleton()
export class SerializedUnitController {
    constructor(
        @inject(SerializedUnitService) private serializedUnitService: SerializedUnitService
    ) { }

    public addUnits = async (req: Request, res: Response): Promise<void> => {
        const authReq = req as any;
        try {
            const { itemId, units } = authReq.body;
            const result = await this.serializedUnitService.addUnits(itemId, authReq.tenantId, units, authReq.user._id);
            res.status(201).json(result);
        } catch (err: any) {
            error(`Add Serialized Units Error: ${err.message}`);
            res.status(err.statusCode || 500).json({ message: err.message });
        }
    };

    public getUnitsByItem = async (req: Request, res: Response): Promise<void> => {
        const authReq = req as any;
        try {
            const result = await this.serializedUnitService.getUnitsByItem(authReq.params.itemId, authReq.tenantId, req.query.status as string);
            res.status(200).json(result);
        } catch (err: any) {
            error(`Get Serialized Units Error: ${err.message}`);
            res.status(500).json({ message: "Server Error", error: err.message });
        }
    };

    public lookup = async (req: Request, res: Response): Promise<void> => {
        const authReq = req as any;
        try {
            const result = await this.serializedUnitService.lookup(authReq.params.value, authReq.tenantId);
            res.status(200).json(result);
        } catch (err: any) {
            error(`Serialized Unit Lookup Error: ${err.message}`);
            res.status(err.statusCode || 500).json({ message: err.message });
        }
    };

    public updateStatus = async (req: Request, res: Response): Promise<void> => {
        const authReq = req as any;
        try {
            const { status, soldInvoiceId } = authReq.body;
            const result = await this.serializedUnitService.updateStatus(authReq.params.id, authReq.tenantId, status, soldInvoiceId);
            res.status(200).json(result);
        } catch (err: any) {
            error(`Update Unit Status Error: ${err.message}`);
            res.status(err.statusCode || 500).json({ message: err.message });
        }
    };

    public deleteUnit = async (req: Request, res: Response): Promise<void> => {
        const authReq = req as any;
        try {
            await this.serializedUnitService.deleteUnit(authReq.params.id, authReq.tenantId);
            res.status(200).json({ message: "Unit deleted" });
        } catch (err: any) {
            error(`Delete Unit Error: ${err.message}`);
            res.status(err.statusCode || 500).json({ message: err.message });
        }
    };
}
