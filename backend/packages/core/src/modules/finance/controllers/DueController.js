import asyncHandler from 'express-async-handler';
import { container } from 'tsyringe';
import { DueService } from '../services/DueService.js';
export const createDueAdjustment = asyncHandler(async (req, res) => {
    const dueService = container.resolve(DueService);
    const adjustment = await dueService.createDueAdjustment(req.body, req.user?._id, req.user?.name);
    res.status(201).json({ message: 'Due adjustment created successfully', adjustment });
});
export const getDueAdjustments = asyncHandler(async (req, res) => {
    const dueService = container.resolve(DueService);
    const adjustments = await dueService.getDueAdjustments(req.user?._id);
    res.status(200).json(adjustments);
});
export const getCustomerDueAdjustments = asyncHandler(async (req, res) => {
    const dueService = container.resolve(DueService);
    const result = await dueService.getCustomerDueAdjustments(req.params.customerId, req.user?._id);
    res.status(200).json(result);
});
// Legacy stubs
export const addDue = asyncHandler(async (_req, res) => {
    res.status(501).json({ message: 'Not implemented - use createDueAdjustment instead' });
});
export const getAllDues = asyncHandler(async (_req, res) => {
    res.status(501).json({ message: 'Not implemented - use getDueAdjustments instead' });
});
export const getCustomerDues = asyncHandler(async (_req, res) => {
    res.status(501).json({ message: 'Not implemented - use getCustomerDueAdjustments instead' });
});
export const updateDue = asyncHandler(async (_req, res) => {
    res.status(501).json({ message: 'Not implemented' });
});
export const clearDue = asyncHandler(async (_req, res) => {
    res.status(501).json({ message: 'Not implemented' });
});
export default {
    createDueAdjustment,
    getDueAdjustments,
    getCustomerDueAdjustments,
    addDue,
    getAllDues,
    getCustomerDues,
    updateDue,
    clearDue,
};
