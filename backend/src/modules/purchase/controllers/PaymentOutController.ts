import { Response } from "express";
import { injectable, inject } from "tsyringe";
import { PaymentOutService } from "../services/PaymentOutService.js";
import { AppError } from "../../../utils/AppError.js";
import { AuthenticatedRequest } from "../../../middlewares/authMiddleware.js";

@injectable()
export class PaymentOutController {
    constructor(
        @inject(PaymentOutService) private paymentOutService: PaymentOutService
    ) { }

    public createPayment = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const tenantId = req.tenantId.toString();
            const userId = req.user._id.toString();

            const payment = await this.paymentOutService.createPayment(tenantId, userId, req.body);
            res.status(201).json({ success: true, data: payment });
        } catch (err) {
            if (err instanceof AppError) {
                res.status(err.statusCode).json({ success: false, message: err.message });
            } else {
                res.status(500).json({ success: false, message: (err as Error).message });
            }
        }
    };

    public getPayments = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const tenantId = req.tenantId.toString();

            const payments = await this.paymentOutService.getPayments(tenantId);
            res.status(200).json({ success: true, data: payments });
        } catch (err) {
            if (err instanceof AppError) {
                res.status(err.statusCode).json({ success: false, message: err.message });
            } else {
                res.status(500).json({ success: false, message: (err as Error).message });
            }
        }
    };

    public updatePaymentStatus = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const { id } = req.params;
            const tenantId = req.tenantId.toString();
            const { status } = req.body;

            const payment = await this.paymentOutService.updatePaymentStatus(String(id), tenantId, status);
            res.status(200).json({ success: true, data: payment });
        } catch (err) {
            if (err instanceof AppError) {
                res.status(err.statusCode).json({ success: false, message: err.message });
            } else {
                res.status(500).json({ success: false, message: (err as Error).message });
            }
        }
    };
}
