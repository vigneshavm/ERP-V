import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { singleton } from 'tsyringe';
import Customer from '../models/Customer.js';
import LoyaltyTransaction from '../models/LoyaltyTransaction.js';
import { error } from '../config/logger.js';

interface AuthenticatedRequest extends Request {
    user?: {
        _id: string;
        name?: string;
        [key: string]: any;
    };
}

@singleton()
export class LoyaltyController {
    /**
     * @swagger
     * /api/loyalty/customer/{id}:
     *   get:
     *     summary: Get loyalty points and tier for a customer
     *     tags: [Loyalty]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true,
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Customer loyalty data retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object,
     *               properties:
     *                 name: { type: string }
     *                 points: { type: number }
     *                 tier: { type: string }
     *       404:
     *         description: Customer not found
     */
    public getCustomerLoyalty = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            if (!mongoose.Types.ObjectId.isValid(id as string)) {
                res.status(400).json({ message: 'Invalid customer ID' });
                return;
            }

            const customer = await Customer.findOne({
                _id: id as string,
                owner: req.user?._id
            }).select('name points tier');

            if (!customer) {
                res.status(404).json({ message: 'Customer not found' });
                return;
            }

            res.status(200).json(customer);
        } catch (err) {
            error(`Get Customer Loyalty Error: ${(err as Error).message}`);
            res.status(500).json({ message: 'Server Error' });
        }
    };

    /**
     * @swagger
     * /api/loyalty/transactions/{id}:
     *   get:
     *     summary: Get loyalty transaction history for a customer
     *     tags: [Loyalty]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true,
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Loyalty transaction history retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: array,
     *               items:
     *                 $ref: '#/components/schemas/LoyaltyTransaction'
     */
    public getLoyaltyHistory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            if (!mongoose.Types.ObjectId.isValid(id as string)) {
                res.status(400).json({ message: 'Invalid customer ID' });
                return;
            }

            const transactions = await LoyaltyTransaction.find({
                customer: id as string,
                owner: req.user?._id
            }).sort({ createdAt: -1 });

            res.status(200).json(transactions);
        } catch (err) {
            error(`Get Loyalty History Error: ${(err as Error).message}`);
            res.status(500).json({ message: 'Server Error' });
        }
    };

    /**
     * @swagger
     * /api/loyalty/adjustment:
     *   post:
     *     summary: Manually adjust loyalty points for a customer
     *     tags: [Loyalty]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true,
     *       content:
     *         application/json:
     *           schema:
     *             type: object,
     *             required: [customerId, points]
     *             properties:
     *               customerId: { type: string }
     *               points: { type: number }
     *               type: { type: string, enum: [EARNED, REDEEMED, EXPIRED, BONUS] }
     *               description: { type: string }
     *     responses:
     *       200:
     *         description: Loyalty points adjusted successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object,
     *               properties:
     *                 message: { type: string }
     *                 points: { type: number }
     *                 tier: { type: string }
     *       404:
     *         description: Customer not found
     */
    public adjustPoints = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const { customerId, points, type, description } = req.body;

            if (!mongoose.Types.ObjectId.isValid(customerId)) {
                res.status(400).json({ message: 'Invalid customer ID' });
                return;
            }

            const customer = await Customer.findOne({
                _id: customerId,
                owner: req.user?._id
            });

            if (!customer) {
                res.status(404).json({ message: 'Customer not found' });
                return;
            }

            // Update customer points
            customer.points += points;

            // Basic tier logic (can be expanded)
            if (customer.points >= 5000) customer.tier = 'Platinum';
            else if (customer.points >= 2000) customer.tier = 'Gold';
            else if (customer.points >= 500) customer.tier = 'Silver';
            else customer.tier = 'Bronze';

            await customer.save();

            // Record transaction
            await LoyaltyTransaction.create({
                customer: customerId,
                type: type || (points >= 0 ? 'BONUS' : 'REDEEMED'),
                points: Math.abs(points),
                description: description || 'Manual adjustment',
                owner: req.user?._id
            });

            res.status(200).json({
                message: 'Loyalty points adjusted',
                points: customer.points,
                tier: customer.tier
            });
        } catch (err) {
            error(`Adjust Points Error: ${(err as Error).message}`);
            res.status(500).json({ message: 'Server Error' });
        }
    };
}
