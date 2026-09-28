import { Response } from "express";
import { singleton, inject } from "tsyringe";
import { SerializedUnitService } from "../services/SerializedUnitService.js";
import { error } from "../../../config/logger.js";
import { AuthenticatedRequest } from "../../../middlewares/authMiddleware.js";

@singleton()
export class SerializedUnitController {
    constructor(
        @inject(SerializedUnitService) private serializedUnitService: SerializedUnitService
    ) { }

    public addUnits = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const { itemId, units } = req.body;
            const result = await this.serializedUnitService.addUnits(itemId, req.tenantId.toString(), units, req.user._id.toString());
            res.status(201).json(result);
        } catch (err: any) {
            error(`Add Serialized Units Error: ${err.message}`);
            res.status(err.statusCode || 500).json({ message: err.message });
        }
    };

    public getUnitsByItem = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const result = await this.serializedUnitService.getUnitsByItem(req.params.itemId as string, req.tenantId.toString(), req.query.status as string);
            res.status(200).json(result);
        } catch (err: any) {
            error(`Get Serialized Units Error: ${err.message}`);
            res.status(500).json({ message: "Server Error", error: err.message });
        }
    };

    public lookup = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const result = await this.serializedUnitService.lookup(req.params.value as string, req.tenantId.toString());
            res.status(200).json(result);
        } catch (err: any) {
            error(`Serialized Unit Lookup Error: ${err.message}`);
            res.status(err.statusCode || 500).json({ message: err.message });
        }
    };

    public updateStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const { status, soldInvoiceId } = req.body;
            const result = await this.serializedUnitService.updateStatus(req.params.id as string, req.tenantId.toString(), status, soldInvoiceId);
            res.status(200).json(result);
        } catch (err: any) {
            error(`Update Unit Status Error: ${err.message}`);
            res.status(err.statusCode || 500).json({ message: err.message });
        }
    };

    public deleteUnit = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            await this.serializedUnitService.deleteUnit(req.params.id as string, req.tenantId.toString());
            res.status(200).json({ message: "Unit deleted" });
        } catch (err: any) {
            error(`Delete Unit Error: ${err.message}`);
            res.status(err.statusCode || 500).json({ message: err.message });
        }
    };
}

