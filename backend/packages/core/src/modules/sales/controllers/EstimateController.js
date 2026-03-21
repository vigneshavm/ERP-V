import mongoose from 'mongoose';
import Estimate from '../models/Estimate.js';
import Item from '@smarterp/core/modules/inventory/models/Item.js';
import Customer from '@smarterp/core/modules/crm/models/Customer.js';
import { info } from '@smarterp/shared/config/logger.js';
import { asyncHandler } from '@smarterp/shared/utils/asyncHandler.js';
/**
 * @swagger
 * /api/estimates:
 *   post:
 *     summary: Create a new estimate
 *     tags: [Sales - Estimates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [items]
 *             properties:
 *               customerId: { type: string }
 *               items: { type: array, items: { type: object } }
 *     responses:
 *       201:
 *         description: Estimate created successfully
 */
export const createEstimate = asyncHandler(async (req, res) => {
    const { customerId, items, discount = 0, notes = '', validUntil } = req.body;
    if (!items || items.length === 0) {
        res.status(400).json({ message: 'No items in estimate' });
        return;
    }
    // Calculate totals
    let subtotal = 0;
    for (const it of items) {
        subtotal += it.quantity * it.price;
    }
    const totalAmount = subtotal - discount;
    // Verify all items exist (read-only check, NO stock deduction)
    for (const it of items) {
        if (it.itemId && mongoose.Types.ObjectId.isValid(it.itemId)) {
            const item = await Item.findOne({ _id: it.itemId, addedBy: req.user._id });
            if (!item) {
                res.status(400).json({
                    message: `Item not found or unauthorized: ${it.itemId}`
                });
                return;
            }
        }
    }
    // Verify customer belongs to current user if provided
    if (customerId) {
        if (!mongoose.Types.ObjectId.isValid(customerId)) {
            res.status(400).json({ message: 'Invalid customer ID format' });
            return;
        }
        const customer = await Customer.findOne({
            _id: customerId,
            owner: req.user._id
        });
        if (!customer) {
            res.status(400).json({
                message: 'Customer not found or unauthorized'
            });
            return;
        }
    }
    // Generate unique estimate number
    const lastEstimate = await Estimate.findOne()
        .sort({ createdAt: -1 })
        .select('estimateNo');
    let estimateNumber = 1;
    if (lastEstimate && lastEstimate.estimateNo) {
        const match = lastEstimate.estimateNo.match(/EST-(\d+)/);
        if (match) {
            estimateNumber = parseInt(match[1]) + 1;
        }
    }
    const estimateNo = `EST-${String(estimateNumber).padStart(5, '0')}`;
    // Create estimate (NO inventory changes)
    const estimate = await Estimate.create({
        estimateNo,
        customer: customerId || null,
        items,
        subtotal,
        discount,
        totalAmount,
        notes,
        validUntil: validUntil || null,
        status: 'draft'
    });
    const populatedEstimate = await Estimate.findById(estimate._id)
        .populate('customer', 'name phone email');
    info(`Estimate created: ${estimateNo}`);
    res.status(201).json({
        message: 'Estimate created successfully',
        estimate: populatedEstimate
    });
});
/**
 * @swagger
 * /api/estimates:
 *   get:
 *     summary: Get all estimates
 *     tags: [Sales - Estimates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of estimates retrieved
 */
export const getAllEstimates = asyncHandler(async (_req, res) => {
    const estimates = await Estimate.find()
        .populate('customer', 'name phone')
        .sort({ createdAt: -1 });
    res.status(200).json(estimates);
});
/**
 * @desc Get single estimate by ID
 * @route GET /api/estimates/:id
 * @access Private
 */
export const getEstimateById = asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        res.status(400).json({ message: 'Invalid estimate ID format' });
        return;
    }
    const estimate = await Estimate.findById(req.params.id)
        .populate('customer');
    if (!estimate) {
        res.status(404).json({ message: 'Estimate not found' });
        return;
    }
    res.status(200).json(estimate);
});
/**
 * @desc Update estimate
 * @route PUT /api/estimates/:id
 * @access Private
 */
export const updateEstimate = asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        res.status(400).json({ message: 'Invalid estimate ID format' });
        return;
    }
    const estimate = await Estimate.findById(req.params.id);
    if (!estimate) {
        res.status(404).json({ message: 'Estimate not found' });
        return;
    }
    // Update fields
    const { items, discount, notes, status, validUntil } = req.body;
    if (items) {
        estimate.items = items;
        estimate.subtotal = items.reduce((sum, it) => sum + (it.total || 0), 0);
    }
    if (discount !== undefined)
        estimate.discount = discount;
    if (notes !== undefined)
        estimate.notes = notes;
    if (status)
        estimate.status = status;
    if (validUntil)
        estimate.validUntil = validUntil;
    estimate.totalAmount = estimate.subtotal - estimate.discount;
    await estimate.save();
    const updatedEstimate = await Estimate.findById(estimate._id)
        .populate('customer');
    res.status(200).json({
        message: 'Estimate updated successfully',
        estimate: updatedEstimate
    });
});
/**
 * @desc Delete estimate
 * @route DELETE /api/estimates/:id
 * @access Private
 */
export const deleteEstimate = asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        res.status(400).json({ message: 'Invalid estimate ID format' });
        return;
    }
    const estimate = await Estimate.findById(req.params.id);
    if (!estimate) {
        res.status(404).json({ message: 'Estimate not found' });
        return;
    }
    await estimate.deleteOne();
    res.status(200).json({ message: 'Estimate deleted successfully' });
});
export default {
    createEstimate,
    getAllEstimates,
    getEstimateById,
    updateEstimate,
    deleteEstimate,
};
