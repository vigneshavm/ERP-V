import { Request, Response } from 'express';
import ConfigService from '../services/ConfigService.js';
import SystemConfig from '../models/SystemConfig.js';
import TaxMaster from '../models/TaxMaster.js';
import LoyaltyRule from '../models/LoyaltyRule.js';
import SegmentRule from '../models/SegmentRule.js';

export const getConfigs = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).user.tenantId || 'default';
        const { group } = req.query;

        const query: any = { tenantId };
        if (group) query.group = group;

        const configs = await SystemConfig.find(query).lean();
        res.status(200).json({ success: true, data: configs });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateConfig = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).user.tenantId || 'default';
        const { key, value, group } = req.body;

        if (!key || value === undefined) {
            return res.status(400).json({ success: false, message: "key and value are required" });
        }

        const config = await ConfigService.set(tenantId, key, value, group);
        ConfigService.clearCache();

        res.status(200).json({ success: true, data: config });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateTaxMaster = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).user.tenantId || 'default';
        const { taxCode, taxName, percentage } = req.body;

        const tax = await TaxMaster.findOneAndUpdate(
            { tenantId, taxCode },
            { $set: { taxName, percentage, isActive: true } },
            { upsert: true, new: true }
        );

        ConfigService.clearCache();
        res.status(200).json({ success: true, data: tax });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateLoyaltyRule = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).user.tenantId || 'default';
        const { ruleId, ruleName, spendPerPoint, rupeesPer100Points } = req.body;

        const rule = await LoyaltyRule.findOneAndUpdate(
            { tenantId, ruleId: ruleId || 'DEFAULT_LOYALTY' },
            { $set: { ruleName: ruleName || 'Default Loyalty Rule', spendPerPoint, rupeesPer100Points, isActive: true } },
            { upsert: true, new: true }
        );

        ConfigService.clearCache();
        res.status(200).json({ success: true, data: rule });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateSegmentRule = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).user.tenantId || 'default';
        const { segmentName, minSpend, minOrders, inactiveDaysThreshold } = req.body;

        const rule = await SegmentRule.findOneAndUpdate(
            { tenantId, segmentName },
            { $set: { minSpend, minOrders, inactiveDaysThreshold, isActive: true } },
            { upsert: true, new: true }
        );

        ConfigService.clearCache();
        res.status(200).json({ success: true, data: rule });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
