import { Response } from "express";
import ShopSettings from "../models/ShopSettings.js";
import { AuthenticatedRequest } from "../../../middlewares/authMiddleware.js";

export const getShopSettings = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const tenantId = req.user.tenantId;
        let settings = await ShopSettings.findOne({ tenantId });

        if (!settings) {
            settings = await ShopSettings.create({
                tenantId,
                shopEnabled: false,
                plan: 'Starter',
                productsLimit: 50
            });
        }

        res.status(200).json({
            success: true,
            data: settings
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const updateShopSettings = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const tenantId = req.user.tenantId;
        const settingsData = req.body;

        const settings = await ShopSettings.findOneAndUpdate(
            { tenantId },
            { $set: settingsData },
            { new: true, runValidators: true, upsert: true }
        );

        res.status(200).json({
            success: true,
            data: settings
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
