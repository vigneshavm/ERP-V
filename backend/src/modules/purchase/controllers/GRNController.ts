import { Response } from "express";
import { singleton, inject } from "tsyringe";
import { GRNService } from "../services/GRNService.js";
import { AuthenticatedRequest } from "../../../middlewares/authMiddleware.js";
import { AppError } from "../../../utils/AppError.js";

/** HTTP translation only -- GRN intake transaction, stock receipt and PO status live in GRNService. */
@singleton()
export class GRNController {
    constructor(
        @inject(GRNService) private grnService: GRNService,
    ) { }

    public createGRN = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const grn = await this.grnService.createGRN(req.user, req.body);
            res.status(201).json({ success: true, message: "GRN created and stock updated for accepted items", grn });
        } catch (err: any) {
            res.status(err instanceof AppError ? err.statusCode : 500).json({ success: false, message: err.message });
        }
    };

    public getGRNs = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const grns = await this.grnService.getGRNs(req.tenantId.toString(), {
                vendorId: req.query.vendorId as string | undefined,
                purchaseId: req.query.purchaseId as string | undefined,
            });
            res.json({ success: true, data: grns });
        } catch (err: any) {
            res.status(500).json({ success: false, message: err.message });
        }
    };
}

