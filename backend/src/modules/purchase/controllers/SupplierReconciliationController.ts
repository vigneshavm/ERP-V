import { Response } from "express";
import { injectable, inject } from "tsyringe";
import { SupplierReconciliationService } from "../services/SupplierReconciliationService.js";
import { AppError } from "../../../utils/AppError.js";
import { AuthenticatedRequest } from "../../../middlewares/authMiddleware.js";

@injectable()
export class SupplierReconciliationController {
    constructor(
        @inject(SupplierReconciliationService) private reconciliationService: SupplierReconciliationService
    ) { }

    public markReconciled = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const tenantId = req.tenantId;
            const userId = req.user._id;

            const reconciliation = await this.reconciliationService.markReconciled(
                tenantId,
                userId,
                req.body
            );
            res.status(200).json({ success: true, data: reconciliation });
        } catch (err) {
            if (err instanceof AppError) {
                res.status(err.statusCode).json({ success: false, message: err.message });
            } else {
                res.status(500).json({ success: false, message: (err as Error).message });
            }
        }
    };

    public getReconciliationStatus = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const tenantId = req.tenantId;
            const { supplierId } = req.query;

            const statuses = await this.reconciliationService.getReconciliationStatus(
                supplierId as string,
                tenantId
            );

            const statusMap: Record<string, any> = {};
            statuses.forEach(item => {
                statusMap[item.transactionId] = {
                    status: item.status,
                    notes: item.notes
                };
            });

            res.status(200).json({ success: true, data: statusMap });
        } catch (err) {
            if (err instanceof AppError) {
                res.status(err.statusCode).json({ success: false, message: err.message });
            } else {
                res.status(500).json({ success: false, message: (err as Error).message });
            }
        }
    };

    public unreconcile = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const tenantId = req.tenantId;
            const userId = req.user._id;
            const { transactionId } = req.params;

            await this.reconciliationService.unreconcile(String(transactionId), tenantId, userId);
            res.status(200).json({ success: true, message: "Transaction unreconciled" });
        } catch (err) {
            if (err instanceof AppError) {
                res.status(err.statusCode).json({ success: false, message: err.message });
            } else {
                res.status(500).json({ success: false, message: (err as Error).message });
            }
        }
    };
}
