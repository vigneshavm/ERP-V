import { Response } from 'express';
import { singleton } from 'tsyringe';
import { getShopSettings, updateShopSettings } from '../../../integrations/textilesoft/erpShopSettings.js';
import { AuthenticatedRequest } from '../../../middlewares/authMiddleware.js';
import { error } from '../../../config/logger.js';

@singleton()
export class ShopController {
    /**
     * @swagger
     * /api/shop/settings:
     *   get:
     *     summary: Get shop (online store) settings
     *     tags: [Shop]
     *     responses:
     *       200:
     *         description: Shop settings
     */
    public getSettings = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const data = await getShopSettings();
            res.status(200).json({ success: true, data });
        } catch (err) {
            error('Get Shop Settings Error:', err);
            res.status(500).json({ success: false, message: 'Server Error', error: (err as Error).message });
        }
    };

    /**
     * @swagger
     * /api/shop/settings:
     *   put:
     *     summary: Update shop (online store) settings
     *     tags: [Shop]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               plan: { type: string }
     *               shopEnabled: { type: boolean }
     *     responses:
     *       200:
     *         description: Settings updated
     */
    public updateSettings = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const data = await updateShopSettings(req.body);
            res.status(200).json({ success: true, message: 'Settings updated successfully', data });
        } catch (err) {
            error('Update Shop Settings Error:', err);
            res.status(500).json({ success: false, message: 'Server Error', error: (err as Error).message });
        }
    };
}
