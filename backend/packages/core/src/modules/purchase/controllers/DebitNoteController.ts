import { Request, Response } from "express";
import DebitNote from "../models/DebitNote.js";
import { container } from "tsyringe";
import { InventoryService } from '@smarterp/core/modules/inventory/services/InventoryService.js';
import { error } from '@smarterp/shared/config/logger.js';
import { asyncHandler } from '@smarterp/shared/utils/asyncHandler.js';
import { ok, created, paginated } from '@smarterp/shared/utils/response.js';

/**
 * @swagger
 * /api/purchase/debit-notes:
 *   get:
 *     summary: Get all debit notes
 *     tags: [Debit Notes]
 *     security:
 *       - bearerAuth: []
 */
export const getDebitNotes = asyncHandler(async (req: Request, res: Response) =>{
    const userId = req.user!._id;
    const debitNotes = await DebitNote.find({ createdBy: userId }).sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        data: debitNotes
    });

/**
 * @swagger
 * /api/purchase/debit-notes/{id}:
 *   get:
 *     summary: Get debit note by ID
 *     tags: [Debit Notes]
 *     security:
 *       - bearerAuth: []
 */
export const getDebitNoteById = asyncHandler(async (req: Request, res: Response) =>{
    const userId = req.user!._id;
    const { id } = req.params;
    const debitNote = await DebitNote.findOne({ _id: id, createdBy: userId });

    if (!debitNote) {
        return res.status(404).json({
            success: false,
            message: "Debit note not found"
        });
    }

    res.status(200).json({
        success: true,
        data: debitNote
    });

/**
 * @swagger
 * /api/purchase/debit-notes:
 *   post:
 *     summary: Create a new debit note
 *     tags: [Debit Notes]
 *     security:
 *       - bearerAuth: []
 */
export const createDebitNote = asyncHandler(async (req: Request, res: Response) =>{
    const userId = req.user!._id;
    const tenantId = req.user.tenantId;
    const debitNoteData = req.body;

    // Generate a unique note ID if not provided
    if (!debitNoteData.noteId) {
        const count = await DebitNote.countDocuments();
        debitNoteData.noteId = `DN-${(count + 1).toString().padStart(6, '0')}`;
    }

    const debitNote = await DebitNote.create({
        ...debitNoteData,
        createdBy: userId
    });

    // If status is APPROVED and reason warrants stock reduction
    if (debitNote.status === 'APPROVED' && ['RETURN', 'QUALITY', 'SHORTAGE', 'OTHER'].includes(debitNote.reason)) {
        const inventoryService = container.resolve(InventoryService);

        for (const item of debitNote.items) {
            if (item.itemId) {
                await inventoryService.reduceStock(
                    item.itemId.toString(),
                    item.qty,
                    tenantId,
                    req.user,
                    `DEBIT_NOTE_${debitNote.reason}`
                );
        }
    }

    res.status(201).json({
        success: true,
        message: "Debit note created successfully",
        data: debitNote
    });

/**
 * @swagger
 * /api/purchase/debit-notes/{id}/status:
 *   put:
 *     summary: Update debit note status
 *     tags: [Debit Notes]
 *     security:
 *       - bearerAuth: []
 */
export const updateDebitNoteStatus = asyncHandler(async (req: Request, res: Response) =>{
    const userId = req.user!._id;
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    const { status } = req.body;

    const debitNote = await DebitNote.findOne({ _id: id, createdBy: userId });

    if (!debitNote) {
        return res.status(404).json({
            success: false,
            message: "Debit note not found"
        });
    }

    const oldStatus = debitNote.status;
    debitNote.status = status;
    await debitNote.save();

    // Trigger stock reduction if moving to APPROVED
    if (oldStatus !== 'APPROVED' && status === 'APPROVED' &&
        ['RETURN', 'QUALITY', 'SHORTAGE', 'OTHER'].includes(debitNote.reason)) {

        const inventoryService = container.resolve(InventoryService);

        for (const item of debitNote.items) {
            if (item.itemId) {
                await inventoryService.reduceStock(
                    item.itemId.toString(),
                    item.qty,
                    tenantId,
                    req.user,
                    `DEBIT_NOTE_${debitNote.reason}`
                );
        }
    }

    res.status(200).json({
        success: true,
        message: "Debit note status updated",
        data: debitNote
    });

/**
 * @swagger
 * /api/purchase/debit-notes/{id}:
 *   delete:
 *     summary: Delete a debit note
 *     tags: [Debit Notes]
 *     security:
 *       - bearerAuth: []
 */
export const deleteDebitNote = asyncHandler(async (req: Request, res: Response) =>{
    const userId = req.user!._id;
    const { id } = req.params;

    const debitNote = await DebitNote.findOneAndDelete({ _id: id, createdBy: userId });

    if (!debitNote) {
        return res.status(404).json({
            success: false,
            message: "Debit note not found"
        });
    }

    res.status(200).json({
        success: true,
        message: "Debit note deleted successfully"
    });
