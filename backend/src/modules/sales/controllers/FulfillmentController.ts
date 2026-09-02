import { Response } from "express";
import Invoice from "../models/Invoice.js";
import { AuthenticatedRequest } from "../../../middlewares/authMiddleware.js";

export const updateFulfillmentStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { invoiceId } = req.params;
        const { fulfillmentStatus, courierName, trackingNumber } = req.body;
        const tenantId = req.user?.tenantId;

        if (!tenantId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const invoice = await Invoice.findOne({ _id: invoiceId, tenantId });
        if (!invoice) {
            res.status(404).json({ message: "Invoice/Order not found" });
            return;
        }

        if (fulfillmentStatus) {
            invoice.fulfillmentStatus = fulfillmentStatus;
            if (fulfillmentStatus === 'SHIPPED') {
                invoice.shippedAt = new Date();
            } else if (fulfillmentStatus === 'DELIVERED') {
                invoice.deliveredAt = new Date();
            }
        }

        if (courierName) invoice.courierName = courierName;
        if (trackingNumber) invoice.trackingNumber = trackingNumber;

        await invoice.save();

        res.json({
            success: true,
            message: `Order fulfillment status updated to ${fulfillmentStatus}`,
            invoice
        });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};
