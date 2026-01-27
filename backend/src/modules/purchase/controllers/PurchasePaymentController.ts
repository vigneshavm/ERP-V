import { Request, Response } from 'express';
import PurchasePayment from '../models/PurchasePayment.js';
import { info, error } from '../../../config/logger.js';

interface AuthenticatedRequest extends Request {
    user?: {
        _id: string;
        tenantId?: string;
        name?: string;
        [key: string]: any;
    };
}

export const createPayment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { supplierId, paymentDate, paymentMethod, amount, notes, paymentNo } = req.body;

        if (!supplierId || !amount) {
            res.status(400).json({ message: "Supplier and amount are required" });
            return;
        }

        const payment = new PurchasePayment({
            paymentNo: paymentNo || `PAY-${Date.now()}`,
            paymentDate: paymentDate || new Date(),
            supplierId,
            paymentMethod: paymentMethod || 'cash',
            amount,
            notes,
            tenantId: req.user?.tenantId || 'default',
            createdBy: req.user?._id
        });

        await payment.save();

        info(`Purchase payment recorded for supplier ${supplierId}: ₹${amount}`);
        res.status(201).json({
            success: true,
            message: "Payment recorded successfully",
            payment
        });
    } catch (err: any) {
        error(`Create Purchase Payment Error: ${err.message}`);
        res.status(500).json({ message: err.message });
    }
};

export const getAllPayments = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const payments = await PurchasePayment.find({ createdBy: req.user?._id })
            .populate('supplierId', 'businessName')
            .sort({ paymentDate: -1 });
        res.json(payments);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

export default {
    createPayment,
    getAllPayments
};
