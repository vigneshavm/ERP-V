var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { singleton } from 'tsyringe';
import Tenant from '../models/Tenant.js';
import SubscriptionPlan from '../models/SubscriptionPlan.js';
let ShopController = class ShopController {
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
    getSettings = async (req, res) => {
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
            plan: tenant.subscriptionPlan?.name || 'Free',
            planCode: tenant.subscriptionPlan?.code || 'FREE',
            shopEnabled: tenant.ecommerce?.enabled || false,
            domain: tenant.ecommerce?.domain,
            theme: tenant.ecommerce?.theme,
            subscriptionStartDate: tenant.subscriptionStartDate,
            subscriptionEndDate: tenant.subscriptionEndDate
        };
        res.status(200).json({ success: true, data });
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
    updateSettings = async (req, res) => {
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
                const currentPlan = tenant.subscriptionPlan;
                const now = new Date();
                const isActive = tenant.subscriptionEndDate && tenant.subscriptionEndDate > now;
                if (isActive && currentPlan) {
                    // Downgrade Check
                    if (targetPlan.price < currentPlan.price) {
                        res.status(400).json({
                            success: false,
                            message: 'Downgrades are not allowed during an active subscription duration.'
                        });
                        return;
                    }
                    // Upgrade Check
                    if (targetPlan.price > currentPlan.price) {
                        const remainingDays = Math.ceil((tenant.subscriptionEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                        const cycleDays = currentPlan.billingCycle === 'yearly' ? 365 : 30;
                        const dailyRateDiff = (targetPlan.price - currentPlan.price) / cycleDays;
                        const upgradeAmount = Math.max(0, dailyRateDiff * remainingDays);
                        // In a real app, you'd process payment here.
                        // For now, we update and log the "balance due".
                        console.log(`Upgrade from ${currentPlan.code} to ${targetPlan.code}. Balance to pay: ${upgradeAmount.toFixed(2)}`);
                        // Extend the subscription from now based on new plan cycle
                        tenant.subscriptionStartDate = now;
                        const newEnd = new Date(now);
                        if (targetPlan.billingCycle === 'yearly') {
                            newEnd.setFullYear(newEnd.getFullYear() + 1);
                        }
                        else if (targetPlan.billingCycle === 'monthly') {
                            newEnd.setMonth(newEnd.getMonth() + 1);
                        }
                        else {
                            // Lifetime or other
                            newEnd.setFullYear(newEnd.getFullYear() + 100);
                        }
                        tenant.subscriptionEndDate = newEnd;
                    }
                }
                else {
                    // No active subscription or first time setting
                    tenant.subscriptionStartDate = now;
                    const newEnd = new Date(now);
                    if (targetPlan.billingCycle === 'yearly') {
                        newEnd.setFullYear(newEnd.getFullYear() + 1);
                    }
                    else {
                        newEnd.setMonth(newEnd.getMonth() + 1);
                    }
                    tenant.subscriptionEndDate = newEnd;
                }
                tenant.subscriptionPlan = targetPlan._id;
                updated = true;
            }
            else {
                res.status(400).json({ success: false, message: `Invalid plan: ${plan}` });
                return;
            }
        }
        if (shopEnabled !== undefined) {
            if (!tenant.ecommerce) {
                tenant.ecommerce = { enabled: shopEnabled };
            }
            else {
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
            plan: updatedTenant?.subscriptionPlan?.name || 'Free',
            planCode: updatedTenant?.subscriptionPlan?.code || 'FREE',
            shopEnabled: updatedTenant?.ecommerce?.enabled || false,
            domain: updatedTenant?.ecommerce?.domain,
            theme: updatedTenant?.ecommerce?.theme,
            subscriptionStartDate: updatedTenant?.subscriptionStartDate,
            subscriptionEndDate: updatedTenant?.subscriptionEndDate
        };
        res.status(200).json({ success: true, message: 'Settings updated successfully', data });
    };
};
ShopController = __decorate([
    singleton()
], ShopController);
export { ShopController };
