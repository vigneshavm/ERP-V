import { Request, Response } from 'express';
import { singleton } from 'tsyringe';
import Tenant from '../models/Tenant.js';
import SubscriptionPlan from '../models/SubscriptionPlan.js';

interface AuthenticatedRequest extends Request {
    tenantId?: string;
    user?: {
        _id: string;
        role: string;
    };
}

@singleton()
export class ShopController {
    /**
     * @swagger
     * /api/shop/settings:
     *   get:
     *     summary: Get shop settings (plan, ecommerce status)
     *     tags: [Shop]
     *     responses:
     *       200:
     *         description: Shop settings
     */
    public getSettings = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const tenantId = req.tenantId;
            if (!tenantId) {
                res.status(400).json({ success: false, message: 'Tenant context missing' });
                return;
            }

            const tenant = await Tenant.findById(tenantId).populate('subscriptionPlan');
            if (!tenant) {
                res.status(404).json({ success: false, message: 'Tenant not found' });
                return;
            }

            // Construct response matching frontend expectations
            const data = {
                plan: (tenant.subscriptionPlan as any)?.name || 'Free', // Map to name or default
                planCode: (tenant.subscriptionPlan as any)?.code,
                shopEnabled: tenant.ecommerce?.enabled || false,
                domain: tenant.ecommerce?.domain,
                theme: tenant.ecommerce?.theme
            };

            res.status(200).json({ success: true, data });
        } catch (error) {
            console.error('Get Shop Settings Error:', error);
            res.status(500).json({ success: false, message: 'Server Error', error: (error as Error).message });
        }
    };

    /**
     * @swagger
     * /api/shop/settings:
     *   put:
     *     summary: Update shop settings (upgrade plan, enable shop)
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
            const tenantId = req.tenantId;
            const { plan, shopEnabled } = req.body;

            if (!tenantId) {
                res.status(400).json({ success: false, message: 'Tenant context missing' });
                return;
            }

            const tenant = await Tenant.findById(tenantId).populate('subscriptionPlan');
            if (!tenant) {
                res.status(404).json({ success: false, message: 'Tenant not found' });
                return;
            }

            let updated = false;

            if (plan) {
                // Try to find plan by name or code
                const targetPlan = await SubscriptionPlan.findOne({
                    $or: [{ name: plan }, { code: plan }]
                });

                if (targetPlan) {
                    tenant.subscriptionPlan = targetPlan._id as any;
                    updated = true;
                } else {
                    res.status(400).json({ success: false, message: `Invalid plan: ${plan}` });
                    return;
                }
            }

            if (shopEnabled !== undefined) {
                if (!tenant.ecommerce) {
                    tenant.ecommerce = { enabled: shopEnabled };
                } else {
                    tenant.ecommerce.enabled = shopEnabled;
                }
                updated = true;
            }

            if (updated) {
                await tenant.save();
            }

            // Return updated data
            const updatedTenant = await Tenant.findById(tenantId).populate('subscriptionPlan');
            const data = {
                plan: (updatedTenant?.subscriptionPlan as any)?.name,
                planCode: (updatedTenant?.subscriptionPlan as any)?.code,
                shopEnabled: updatedTenant?.ecommerce?.enabled || false,
                domain: updatedTenant?.ecommerce?.domain,
                theme: updatedTenant?.ecommerce?.theme
            };

            res.status(200).json({ success: true, message: 'Settings updated successfully', data });
        } catch (error) {
            console.error('Update Shop Settings Error:', error);
            res.status(500).json({ success: false, message: 'Server Error', error: (error as Error).message });
        }
    };
}
