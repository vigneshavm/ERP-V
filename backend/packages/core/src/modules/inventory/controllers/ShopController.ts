import { Request, Response } from "express";
import ShopSettings from "../models/ShopSettings.js";

export const getShopSettings = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user._id;
        let settings = await ShopSettings.findOne({ userId });

        if (!settings) {
            settings = await ShopSettings.create({
                userId,
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

export const updateShopSettings = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user._id;
        const settingsData = req.body;

        const settings = await ShopSettings.findOneAndUpdate(
            { userId },
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
