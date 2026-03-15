import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { singleton } from 'tsyringe';

import Customer from '../models/Customer.js';

import Transaction from '@smarterp/core/modules/sales/models/Transaction.js';
import { info, error } from '@smarterp/shared/config/logger.js';

/**
 * Request interface with authenticated user
 */
interface AuthenticatedRequest extends Request {
    user?: {
        _id: string;
        name?: string;
        [key: string]: any;
    };
    originalEntity?: any;
    updatedEntity?: any;
    deletedEntity?: any;
}

@singleton()
export class CustomerController {
    /**
     * @swagger
     * /api/customers:
     *   post:
     *     summary: Add a new customer
     *     tags: [Customers]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true,
     *       content:
     *         application/json:
     *           schema:
     *             type: object,
     *             required: [name, phone]
     *             properties:
     *               name: { type: string }
     *               phone: { type: string }
     *               email: { type: string }
     *               address: { type: string }
     *               referredBy: { type: string }
     *     responses:
     *       201:
     *         description: Customer created successfully
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Customer'
     *       400:
     *         description: Validation error
     */
    public addCustomer = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const { name, phone, email, address, referredBy } = req.body;

            if (!name || !phone) {
                res.status(400).json({ message: 'Name and phone are required' });
                return;
            }

            if (phone.length > 10 || phone.length < 10 || !Number(phone)) {
                res.status(400).json({ message: 'Phone is not valid' });
                return;
            }

            // Check for duplicate phone
            const existingPhone = await Customer.findOne({
                phone,
                owner: req.user?._id,
            });

            if (existingPhone) {
                res.status(400).json({ message: 'Phone number already exists in your customer list' });
                return;
            }

            // Check for duplicate email if provided
            if (email) {
                const existingEmail = await Customer.findOne({
                    email,
                    owner: req.user?._id,
                });

                if (existingEmail) {
                    res.status(400).json({ message: 'Email already exists in your customer list' });
                    return;
                }
            }

            // Create customer with owner reference
            const customer = await Customer.create({
                name,
                phone,
                email,
                address,
                referredBy: referredBy || null,
                owner: req.user?._id,
            });

            info(`New customer added by ${req.user?.name}: ${name} (${email || 'no email'})`);
            res.status(201).json(customer);
        } catch (err) {
            error(`Add Customer Error: ${(err as Error).message}`);
            res.status(500).json({ message: 'Server Error', error: (err as Error).message });
        }
    };

    /**
     * @swagger
     * /api/customers/{id}:
     *   put:
     *     summary: Update an existing customer
     *     tags: [Customers]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true,
     *         schema:
     *           type: string
     *     requestBody:
     *       required: true,
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/Customer'
     *     responses:
     *       200:
     *         description: Customer updated successfully
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Customer'
     *       404:
     *         description: Customer not found
     */
    public updateCustomer = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            if (!mongoose.Types.ObjectId.isValid(req.params.id as string)) {
                res.status(400).json({ message: 'Invalid customer ID format' });
                return;
            }

            const customer = await Customer.findOne({
                _id: req.params.id,
                owner: req.user?._id,
            });

            if (!customer) {
                res.status(404).json({ message: 'Customer not found or unauthorized' });
                return;
            }

            // Check for duplicate phone if being updated
            if (req.body.phone && req.body.phone !== customer.phone) {
                const existingPhone = await Customer.findOne({
                    phone: req.body.phone,
                    owner: req.user?._id,
                    _id: { $ne: req.params.id },
                });

                if (existingPhone) {
                    res.status(400).json({ message: 'Phone number already exists' });
                    return;
                }
            }

            // Check for duplicate email if being updated
            if (req.body.email && req.body.email !== customer.email) {
                const existingEmail = await Customer.findOne({
                    email: req.body.email,
                    owner: req.user?._id,
                    _id: { $ne: req.params.id },
                });

                if (existingEmail) {
                    res.status(400).json({ message: 'Email already exists' });
                    return;
                }
            }

            // Attach for audit middleware (before update)
            req.originalEntity = customer.toObject();

            const updated = await Customer.findByIdAndUpdate(req.params.id, req.body, {
                new: true,
            });

            if (!updated) {
                res.status(404).json({ message: 'Customer not found' });
                return;
            }

            // Attach for audit middleware (after update)
            req.updatedEntity = updated.toObject();

            info(`Customer updated by ${req.user?.name}: ${updated.name} (${updated.email || 'no email'})`);
            res.status(200).json(updated);
        } catch (err) {
            error(`Update Customer Error: ${(err as Error).message}`);
            res.status(500).json({ message: 'Server Error', error: (err as Error).message });
        }
    };

    /**
     * @swagger
     * /api/customers:
     *   get:
     *     summary: Get all customers for the authenticated user
     *     tags: [Customers]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: List of customers retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: array,
     *               items:
     *                 $ref: '#/components/schemas/Customer'
     */
    public getAllCustomers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const customers = await Customer.aggregate([
                { $match: { owner: new mongoose.Types.ObjectId(req.user?._id) } },
                {
                    $lookup: {
                        from: 'transactions',
                        localField: '_id',
                        foreignField: 'customer',
                        as: 'transactions'
                    }
                },
                {
                    $addFields: {
                        purchaseCount: {
                            $size: {
                                $filter: {
                                    input: '$transactions',
                                    as: 'tx',
                                    cond: { $eq: ['$$tx.type', 'sale'] }
                                }
                            }
                        },
                        totalPurchases: {
                            $sum: {
                                $map: {
                                    input: {
                                        $filter: {
                                            input: '$transactions',
                                            as: 'tx',
                                            cond: { $eq: ['$$tx.type', 'sale'] }
                                        }
                                    },
                                    as: 'tx',
                                    in: '$$tx.amount'
                                }
                            }
                        },
                        lastPurchase: {
                            $max: {
                                $map: {
                                    input: {
                                        $filter: {
                                            input: '$transactions',
                                            as: 'tx',
                                            cond: { $eq: ['$$tx.type', 'sale'] }
                                        }
                                    },
                                    as: 'tx',
                                    in: '$$tx.createdAt'
                                }
                            }
                        }
                    }
                },
                { $project: { transactions: 0 } },
                { $sort: { name: 1 } }
            ]);

            res.status(200).json(customers);
        } catch (err) {
            error(`Get All Customers Error: ${(err as Error).message}`);
            res.status(500).json({ message: 'Server Error', error: (err as Error).message });
        }
    };

    /**
     * @swagger
     * /api/customers/{id}:
     *   get:
     *     summary: Get a single customer by ID with 360 metrics
     *     tags: [Customers]
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
     *         description: Customer details retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Customer'
     *       404:
     *         description: Customer not found
     */
    public getCustomerById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            if (!mongoose.Types.ObjectId.isValid(req.params.id as string)) {
                res.status(400).json({ message: 'Invalid customer ID format' });
                return;
            }

            const customerId = new mongoose.Types.ObjectId(req.params.id as string);

            const results = await Customer.aggregate([
                { $match: { _id: customerId, owner: new mongoose.Types.ObjectId(req.user?._id) } },
                {
                    $lookup: {
                        from: 'transactions',
                        localField: '_id',
                        foreignField: 'customer',
                        as: 'transactions'
                    }
                },
                {
                    $lookup: {
                        from: 'customers',
                        localField: 'referredBy',
                        foreignField: '_id',
                        as: 'referredBy'
                    }
                },
                {
                    $addFields: {
                        referredBy: { $arrayElemAt: ['$referredBy', 0] },
                        purchaseCount: {
                            $size: {
                                $filter: {
                                    input: '$transactions',
                                    as: 'tx',
                                    cond: { $eq: ['$$tx.type', 'sale'] }
                                }
                            }
                        },
                        totalPurchases: {
                            $sum: {
                                $map: {
                                    input: {
                                        $filter: {
                                            input: '$transactions',
                                            as: 'tx',
                                            cond: { $eq: ['$$tx.type', 'sale'] }
                                        }
                                    },
                                    as: 'tx',
                                    in: '$$tx.amount'
                                }
                            }
                        },
                        lastPurchase: {
                            $max: {
                                $map: {
                                    input: {
                                        $filter: {
                                            input: '$transactions',
                                            as: 'tx',
                                            cond: { $eq: ['$$tx.type', 'sale'] }
                                        }
                                    },
                                    as: 'tx',
                                    in: '$$tx.createdAt'
                                }
                            }
                        }
                    }
                },
                { $project: { transactions: 0 } }
            ]);

            if (!results || results.length === 0) {
                res.status(404).json({ message: 'Customer not found or unauthorized' });
                return;
            }

            res.status(200).json(results[0]);
        } catch (err) {
            error(`Get Customer By Id Error: ${(err as Error).message}`);
            res.status(500).json({ message: 'Server Error', error: (err as Error).message });
        }
    };

    /**
     * @swagger
     * /api/customers/{id}:
     *   delete:
     *     summary: Delete a customer
     *     tags: [Customers]
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
     *         description: Customer deleted successfully
     *       404:
     *         description: Customer not found
     */
    public deleteCustomer = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            if (!mongoose.Types.ObjectId.isValid(req.params.id as string)) {
                res.status(400).json({ message: 'Invalid customer ID format' });
                return;
            }

            const customer = await Customer.findOne({
                _id: req.params.id,
                owner: req.user?._id,
            });

            if (!customer) {
                res.status(404).json({ message: 'Customer not found or unauthorized' });
                return;
            }

            // Attach for audit middleware (before deletion)
            req.deletedEntity = customer.toObject();

            await Customer.findByIdAndDelete(req.params.id as string);
            info(`Customer deleted by ${req.user?.name}: ${customer.name}`);
            res.status(200).json({ message: 'Customer deleted' });
        } catch (err) {
            error(`Delete Customer Error: ${(err as Error).message}`);
            res.status(500).json({ message: 'Server Error', error: (err as Error).message });
        }
    };

    /**
     * @swagger
     * /api/customers/{id}/transactions:
     *   get:
     *     summary: Get transaction history for a customer
     *     tags: [Customers]
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
     *         description: Transaction history retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object,
     *               properties:
     *                 customer: { type: object, properties: { name: { type: string }, phone: { type: string } } }
     *                 transactions: { type: array, items: { $ref: '#/components/schemas/Transaction' } }
     */
    public getCustomerTransactions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            if (!mongoose.Types.ObjectId.isValid(req.params.id as string)) {
                res.status(400).json({ message: 'Invalid customer ID format' });
                return;
            }

            const customer = await Customer.findOne({
                _id: req.params.id,
                owner: req.user?._id,
            });

            if (!customer) {
                res.status(404).json({ message: 'Customer not found or unauthorized' });
                return;
            }

            const transactions = await Transaction.find({
                customer: req.params.id,
            })
                .sort({ createdAt: -1 })
                .populate('invoice', 'invoiceNo totalAmount paymentStatus');

            res.status(200).json({
                customer: { name: customer.name, phone: customer.phone },
                transactions: transactions.length ? transactions : [],
            });
        } catch (err) {
            error(`Get Customer Transactions Error: ${(err as Error).message}`);
            res.status(500).json({ message: 'Server Error', error: (err as Error).message });
        }
    };
}
