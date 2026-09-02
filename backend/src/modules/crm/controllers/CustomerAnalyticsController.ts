import { Response } from "express";
import CustomerAnalyticsService from "../services/CustomerAnalyticsService.js";
import Customer from "../models/Customer.js";
import { AuthenticatedRequest } from "../../../middlewares/authMiddleware.js";

export const getCustomer360 = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { customerId } = req.params;
        const tenantId = req.user?.tenantId?.toString();
        if (!tenantId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const targetCustId = Array.isArray(customerId) ? customerId[0] : customerId;
        const data = await CustomerAnalyticsService.getCustomer360Profile(tenantId, targetCustId);
        res.json({ success: true, data });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const getMarketingAudience = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const tenantId = req.user?.tenantId?.toString();
        if (!tenantId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const segmentFilter = typeof req.query.segment === 'string' ? req.query.segment : undefined;
        const audience = await CustomerAnalyticsService.getMarketingEligibleAudience(tenantId, segmentFilter);
        res.json({ success: true, ...audience });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const getCRMDashboardSummary = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const tenantId = req.user?.tenantId?.toString();
        if (!tenantId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const totalCustomers = await Customer.countDocuments({ tenantId });
        const optedInCustomers = await Customer.countDocuments({ tenantId, 'marketingConsent.optIn': true });
        const highValueCustomers = await Customer.countDocuments({ tenantId, segment: 'HIGH_VALUE' });
        const loyalCustomers = await Customer.countDocuments({ tenantId, segment: 'LOYAL' });

        res.json({
            success: true,
            data: {
                totalCustomers,
                optedInCustomers,
                optInRatePercent: totalCustomers > 0 ? Number(((optedInCustomers / totalCustomers) * 100).toFixed(1)) : 0,
                highValueCustomers,
                loyalCustomers
            }
        });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
};
