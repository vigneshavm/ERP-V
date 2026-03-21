var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import mongoose from 'mongoose';
import { singleton } from 'tsyringe';
import Customer from '../models/Customer.js';
import Transaction from '@smarterp/core/modules/sales/models/Transaction.js';
import { info } from '@smarterp/shared/config/logger.js';
// Shared utilities — replaces local AuthenticatedRequest re-declaration,
// manual try/catch, and inline res.status() constructions.
import { asyncHandler } from '@smarterp/shared/utils/asyncHandler.js';
import { ok, created, paginated } from '@smarterp/shared/utils/response.js';
import { parsePagination, parseSort } from '@smarterp/shared/utils/pagination.js';
import { requireUserId } from '@smarterp/shared/utils/tenantContext.js';
import { AppError } from '@smarterp/shared/utils/AppError.js';
/** Guard that req.params.id is a valid ObjectId — throws AppError 400 otherwise. */
const validId = (id) => {
    if (!mongoose.Types.ObjectId.isValid(id))
        throw new AppError('Invalid ID format', 400);
    return new mongoose.Types.ObjectId(id);
};
let CustomerController = class CustomerController {
    /**
     * POST /api/v1/crm/customers
     * Create a customer scoped to the authenticated user.
     */
    addCustomer = asyncHandler(async (req, res) => {
        const userId = requireUserId(req);
        const { name, phone, email, address, referredBy } = req.body;
        if (!name || !phone)
            throw new AppError('Name and phone are required', 400);
        if (phone.length !== 10 || !/^\d+$/.test(phone))
            throw new AppError('Phone must be exactly 10 digits', 400);
        const [existingPhone, existingEmail] = await Promise.all([
            Customer.exists({ phone, owner: userId }),
            email ? Customer.exists({ email, owner: userId }) : null,
        ]);
        if (existingPhone)
            throw new AppError('Phone number already exists in your customer list', 400);
        if (existingEmail)
            throw new AppError('Email already exists in your customer list', 400);
        const customer = await Customer.create({
            name, phone, email, address,
            referredBy: referredBy ?? null,
            owner: userId,
        });
        info(`New customer added by ${req.user.name}: ${name} (${email ?? 'no email'})`);
        created(res, customer, 'Customer created successfully');
    });
    /**
     * GET /api/v1/crm/customers
     * Paginated customer list with transaction summary via aggregation.
     */
    getAllCustomers = asyncHandler(async (req, res) => {
        const userId = requireUserId(req);
        const { page, limit, skip } = parsePagination(req.query, 50);
        const sort = parseSort(req.query.sort, 'name');
        const match = { owner: new mongoose.Types.ObjectId(userId) };
        const [customers, total] = await Promise.all([
            Customer.aggregate([
                { $match: match },
                {
                    $lookup: {
                        from: 'transactions', localField: '_id',
                        foreignField: 'customer', as: 'transactions',
                    },
                },
                {
                    $addFields: {
                        purchaseCount: { $size: { $filter: { input: '$transactions', as: 'tx', cond: { $eq: ['$$tx.type', 'sale'] } } } },
                        totalPurchases: { $sum: '$transactions.amount' },
                        lastPurchase: { $max: '$transactions.createdAt' },
                    },
                },
                { $project: { transactions: 0 } },
                { $sort: sort },
                { $skip: skip },
                { $limit: limit },
            ]),
            Customer.countDocuments(match),
        ]);
        paginated(res, customers, total, page, limit);
    });
    /**
     * GET /api/v1/crm/customers/:id
     * Single customer with 360-degree transaction metrics.
     */
    getCustomerById = asyncHandler(async (req, res) => {
        const userId = requireUserId(req);
        const customerId = validId(req.params.id);
        const [result] = await Customer.aggregate([
            { $match: { _id: customerId, owner: new mongoose.Types.ObjectId(userId) } },
            { $lookup: { from: 'transactions', localField: '_id', foreignField: 'customer', as: 'transactions' } },
            { $lookup: { from: 'customers', localField: 'referredBy', foreignField: '_id', as: 'referredByDoc' } },
            {
                $addFields: {
                    referredBy: { $arrayElemAt: ['$referredByDoc', 0] },
                    purchaseCount: {
                        $size: { $filter: { input: '$transactions', as: 'tx', cond: { $eq: ['$$tx.type', 'sale'] } } },
                    },
                    totalPurchases: {
                        $sum: { $map: {
                                input: { $filter: { input: '$transactions', as: 'tx', cond: { $eq: ['$$tx.type', 'sale'] } } },
                                as: 'tx', in: '$$tx.amount',
                            } },
                    },
                    lastPurchase: {
                        $max: { $map: {
                                input: { $filter: { input: '$transactions', as: 'tx', cond: { $eq: ['$$tx.type', 'sale'] } } },
                                as: 'tx', in: '$$tx.createdAt',
                            } },
                    },
                },
            },
            { $project: { transactions: 0, referredByDoc: 0 } },
        ]);
        if (!result)
            throw new AppError('Customer not found or unauthorized', 404);
        ok(res, result);
    });
    /**
     * PUT /api/v1/crm/customers/:id
     * Update customer — checks duplicate phone/email before committing.
     */
    updateCustomer = asyncHandler(async (req, res) => {
        const userId = requireUserId(req);
        const customerId = validId(req.params.id);
        const customer = await Customer.findOne({ _id: customerId, owner: userId });
        if (!customer)
            throw new AppError('Customer not found or unauthorized', 404);
        const { phone, email } = req.body;
        // Run duplicate checks only on changed fields, in parallel
        const [dupPhone, dupEmail] = await Promise.all([
            phone && phone !== customer.phone
                ? Customer.exists({ phone, owner: userId, _id: { $ne: customerId } })
                : null,
            email && email !== customer.email
                ? Customer.exists({ email, owner: userId, _id: { $ne: customerId } })
                : null,
        ]);
        if (dupPhone)
            throw new AppError('Phone number already exists', 400);
        if (dupEmail)
            throw new AppError('Email already exists', 400);
        req.originalEntity = customer.toObject();
        const updated = await Customer.findByIdAndUpdate(customerId, req.body, { new: true, runValidators: true });
        if (!updated)
            throw new AppError('Customer not found', 404);
        req.updatedEntity = updated.toObject();
        info(`Customer updated by ${req.user.name}: ${updated.name}`);
        ok(res, updated, 'Customer updated successfully');
    });
    /**
     * DELETE /api/v1/crm/customers/:id
     */
    deleteCustomer = asyncHandler(async (req, res) => {
        const userId = requireUserId(req);
        const customerId = validId(req.params.id);
        const customer = await Customer.findOne({ _id: customerId, owner: userId });
        if (!customer)
            throw new AppError('Customer not found or unauthorized', 404);
        req.deletedEntity = customer.toObject();
        await Customer.findByIdAndDelete(customerId);
        info(`Customer deleted by ${req.user.name}: ${customer.name}`);
        ok(res, null, 'Customer deleted');
    });
    /**
     * GET /api/v1/crm/customers/:id/transactions
     */
    getCustomerTransactions = asyncHandler(async (req, res) => {
        const userId = requireUserId(req);
        const customerId = validId(req.params.id);
        const customer = await Customer.findOne({ _id: customerId, owner: userId }).lean();
        if (!customer)
            throw new AppError('Customer not found or unauthorized', 404);
        const transactions = await Transaction.find({ customer: customerId })
            .sort({ createdAt: -1 })
            .populate('invoice', 'invoiceNo totalAmount paymentStatus')
            .lean();
        ok(res, { customer: { name: customer.name, phone: customer.phone }, transactions });
    });
};
CustomerController = __decorate([
    singleton()
], CustomerController);
export { CustomerController };
