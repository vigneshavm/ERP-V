import { Response } from 'express';
import ConfigService from '../services/ConfigService.js';
import { listConfigs } from '../../../integrations/textilesoft/erpSystemConfig.js';
import { setTaxMaster } from '../../../integrations/textilesoft/erpTaxMaster.js';
import { AuthenticatedRequest } from '../../../middlewares/authMiddleware.js';

export const getConfigs = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { group } = req.query;
        const configs = await listConfigs(typeof group === 'string' ? group : undefined);
        res.status(200).json({ success: true, data: configs });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateConfig = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { key, value, group } = req.body;

        if (!key || value === undefined) {
            return res.status(400).json({ success: false, message: "key and value are required" });
        }

        const config = await ConfigService.set(key, value, group);
        ConfigService.clearCache();

        res.status(200).json({ success: true, data: config });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateTaxMaster = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { taxCode, taxName, percentage } = req.body;

        const tax = await setTaxMaster(taxCode, taxName, percentage);

        ConfigService.clearCache();
        res.status(200).json({ success: true, data: tax });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateLoyaltyRule = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const tenantId = req.user.tenantId ? req.user.tenantId.toString() : 'default';
        const { ruleId, ruleName, spendPerPoint, rupeesPer100Points } = req.body;

        const rule = await ConfigService.saveLoyaltyRule(tenantId, {
            ruleId: ruleId || 'DEFAULT_LOYALTY',
            ruleName: ruleName || 'Default Loyalty Rule',
            spendPerPoint,
            rupeesPer100Points,
        });

        ConfigService.clearCache();
        res.status(200).json({ success: true, data: rule });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateSegmentRule = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const tenantId = req.user.tenantId ? req.user.tenantId.toString() : 'default';
        const { segmentName, minSpend, minOrders, inactiveDaysThreshold } = req.body;

        const rule = await ConfigService.saveSegmentRule(tenantId, {
            segmentName,
            minSpend,
            minOrders,
            inactiveDaysThreshold,
        });

        ConfigService.clearCache();
        res.status(200).json({ success: true, data: rule });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
