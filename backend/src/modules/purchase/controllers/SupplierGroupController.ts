import { Response } from "express";
import { injectable, inject } from "tsyringe";
import { SupplierGroupService } from "../services/SupplierGroupService.js";
import { AppError } from "../../../utils/AppError.js";
import { AuthenticatedRequest } from "../../../middlewares/authMiddleware.js";

@injectable()
export class SupplierGroupController {
    constructor(
        @inject(SupplierGroupService) private supplierGroupService: SupplierGroupService
    ) { }

    public createGroup = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const tenantId = req.tenantId.toString();

            const group = await this.supplierGroupService.createGroup(tenantId, req.body);
            res.status(201).json({ success: true, data: group });
        } catch (err) {
            if (err instanceof AppError) {
                res.status(err.statusCode).json({ success: false, message: err.message });
            } else {
                res.status(500).json({ success: false, message: (err as Error).message });
            }
        }
    };

    public getGroups = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const tenantId = req.tenantId.toString();

            const groups = await this.supplierGroupService.getGroups(tenantId);
            res.status(200).json({ success: true, data: groups });
        } catch (err) {
            if (err instanceof AppError) {
                res.status(err.statusCode).json({ success: false, message: err.message });
            } else {
                res.status(500).json({ success: false, message: (err as Error).message });
            }
        }
    };

    public updateGroup = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const { id } = req.params;
            const tenantId = req.tenantId.toString();

            const group = await this.supplierGroupService.updateGroup(String(id), tenantId, req.body);
            res.status(200).json({ success: true, data: group });
        } catch (err) {
            if (err instanceof AppError) {
                res.status(err.statusCode).json({ success: false, message: err.message });
            } else {
                res.status(500).json({ success: false, message: (err as Error).message });
            }
        }
    };

    public deleteGroup = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const { id } = req.params;
            const tenantId = req.tenantId.toString();

            await this.supplierGroupService.deleteGroup(String(id), tenantId);
            res.status(200).json({ success: true, message: "Group deleted successfully" });
        } catch (err) {
            if (err instanceof AppError) {
                res.status(err.statusCode).json({ success: false, message: err.message });
            } else {
                res.status(500).json({ success: false, message: (err as Error).message });
            }
        }
    };
}
