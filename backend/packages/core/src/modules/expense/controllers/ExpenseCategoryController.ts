import { Request, Response } from 'express';
import mongoose from 'mongoose';

import ExpenseCategory from '../models/ExpenseCategory.js';
import { info, error } from '@smarterp/shared/config/logger.js';
import { CreatedBy } from '@smarterp/shared/models/CreatedBy.js';
import { AuthenticatedRequest } from '@smarterp/shared/middlewares/authMiddleware.js';
import { asyncHandler } from '@smarterp/shared/utils/asyncHandler.js';
import { ok, created, paginated } from '@smarterp/shared/utils/response.js';

/**
 * Request interface with authenticated user
 */
/**
 * Expense category response interface
 */
interface CategoryResponse {
    gst_eligible: boolean;
    color?: string;
    emoji?: string;
    type: "income" | "expense" | "both";
}

/**
 * @desc Get all expense categories
 * @route GET /api/expense-categories
 */
export const getAllCategories = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> =>{
    const categories = await ExpenseCategory.find({ createdBy: req.user!._id })
        .sort({ name: 1 });

    // Transform for frontend compatibility
    const transformed: CategoryResponse[] = categories.map((cat: any) => ({
        id: cat._id,
        name: cat.name,
        monthly_budget: cat.monthly_budget,
        approval_required: cat.approval_required,
        is_cash_allowed: cat.is_cash_allowed,
        is_active: cat.is_active,
        gst_eligible: cat.gst_eligible,
        color: cat.color,
        emoji: cat.emoji,
        type: cat.type || "expense",
    }));

    res.status(200).json({ categories: transformed });
});

/**
 * @desc Create new expense category
 * @route POST /api/expense-categories
 */
export const createCategory = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> =>{
    const { name, monthly_budget, approval_required, is_cash_allowed, is_active, gst_eligible, color, emoji, type } = req.body;

    if (!name) {
        res.status(400).json({ message: 'Category name is required' });
        return;
    }

    // Check for duplicate name within this owner's categories
    const existingCategory = await ExpenseCategory.findOne({
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        createdBy: req.user!._id
    });

    if (existingCategory) {
        res.status(400).json({ message: 'Category name already exists' });
        return;
    }

    const category = await ExpenseCategory.create({
        name,
        monthly_budget: monthly_budget || 0,
        approval_required: approval_required || false,
        is_cash_allowed: is_cash_allowed !== false,
        is_active: is_active !== false,
        gst_eligible: gst_eligible || false,
        color: color || "#3498db",
        emoji: emoji || "💰",
        type: type || "expense",
        createdBy: req.user!._id
    });

    info(`Created expense category: ${name}`);

    res.status(201).json({
        id: category._id,
        name: category.name,
        monthly_budget: category.monthly_budget,
        approval_required: category.approval_required,
        is_cash_allowed: category.is_cash_allowed,
        is_active: category.is_active,
        gst_eligible: category.gst_eligible,
        color: category.color,
        emoji: category.emoji,
        type: category.type,
    });
});

/**
 * @desc Update expense category
 * @route PUT /api/expense-categories/:id
 */
export const updateCategory = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> =>{
    if (!mongoose.Types.ObjectId.isValid(req.params.id as string)) {
        res.status(400).json({ message: 'Invalid category ID format' });
        return;
    }

    const category = await ExpenseCategory.findOne({
        _id: req.params.id,
        createdBy: req.user!._id
    });

    if (!category) {
        res.status(404).json({ message: 'Category not found or unauthorized' });
        return;
    }

    // Check for duplicate name if being updated
    if (req.body.name && req.body.name !== category.name) {
        const existingCategory = await ExpenseCategory.findOne({
            name: { $regex: new RegExp(`^${req.body.name}$`, 'i') },
            createdBy: req.user!._id,
            _id: { $ne: req.params.id }
        });

        if (existingCategory) {
            res.status(400).json({ message: 'Category name already exists' });
            return;
        }
    }

    const updatedCategory = await ExpenseCategory.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true, runValidators: true }
    );

    if (!updatedCategory) {
        res.status(404).json({ message: 'Category not found' });
        return;
    }

    info(`Updated expense category: ${updatedCategory.name}`);

    res.status(200).json({
        id: updatedCategory._id,
        name: updatedCategory.name,
        monthly_budget: updatedCategory.monthly_budget,
        approval_required: updatedCategory.approval_required,
        is_cash_allowed: updatedCategory.is_cash_allowed,
        is_active: updatedCategory.is_active,
        gst_eligible: updatedCategory.gst_eligible,
        color: updatedCategory.color,
        emoji: updatedCategory.emoji,
        type: updatedCategory.type,
    });
});

/**
 * @desc Delete expense category
 * @route DELETE /api/expense-categories/:id
 */
export const deleteCategory = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> =>{
    if (!mongoose.Types.ObjectId.isValid(req.params.id as string)) {
        res.status(400).json({ message: 'Invalid category ID format' });
        return;
    }

    const category = await ExpenseCategory.findOne({
        _id: req.params.id,
        createdBy: req.user!._id
    });

    if (!category) {
        res.status(404).json({ message: 'Category not found or unauthorized' });
        return;
    }

    await category.deleteOne();
    info(`Deleted expense category: ${category.name}`);

    res.status(200).json({ message: 'Category deleted' });
});

export default {
    getAllCategories,
    createCategory,
    updateCategory,
    deleteCategory,
};
