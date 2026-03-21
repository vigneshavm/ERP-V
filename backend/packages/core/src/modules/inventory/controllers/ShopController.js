import ShopSettings from "../models/ShopSettings.js";
import { asyncHandler } from '@smarterp/shared/utils/asyncHandler.js';
export const getShopSettings = asyncHandler(async (req, res) => {
    const userId = req.user._id;
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
});
export const updateShopSettings = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const settingsData = req.body;
    const settings = await ShopSettings.findOneAndUpdate({ userId }, { $set: settingsData }, { new: true, runValidators: true, upsert: true });
    res.status(200).json({
        success: true,
        data: settings
    });
});
