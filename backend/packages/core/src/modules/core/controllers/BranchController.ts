import { Request, Response } from "express";
import Branch from "../models/Branch.js";
import { AppError } from '@smarterp/shared/utils/AppError.js';
import { asyncHandler } from '@smarterp/shared/utils/asyncHandler.js';

export const getAllBranches = asyncHandler(async (req: Request, res: Response) => {
    // @ts-ignore - tenantId added by middleware
    const tenantId = req.tenantId;
    const branches = await Branch.find({ tenantId }).sort({ createdAt: -1 });
    res.status(200).json(branches);
});

export const getBranch = asyncHandler(async (req: Request, res: Response) => {
    // @ts-ignore
    const tenantId = req.tenantId;
    const branch = await Branch.findOne({ _id: req.params.id, tenantId });
    if (!branch) {
        throw new AppError("Branch not found", 404);
    }
    res.status(200).json(branch);
});

export const createBranch = asyncHandler(async (req: Request, res: Response) => {
    // @ts-ignore
    const tenantId = req.tenantId;

    // Check if main branch exists if this is trying to be main
    if (req.body.isMain) {
        const existingMain = await Branch.findOne({ tenantId, isMain: true });
        if (existingMain) {
            // Option: Throw error or demote existing. For now, let's just create it (business logic dependent).
            // Better to perhaps ensure only one main branch manually later if needed.
            // Or un-main the previous one.
            await Branch.updateOne({ _id: existingMain._id }, { isMain: false });
        }
    }

    const branch = await Branch.create({
        ...req.body,
        tenantId
    });

    res.status(201).json(branch);
});

export const updateBranch = asyncHandler(async (req: Request, res: Response) => {
    // @ts-ignore
    const tenantId = req.tenantId;

    if (req.body.isMain) {
        await Branch.updateMany({ tenantId, _id: { $ne: req.params.id } }, { isMain: false });
    }

    const branch = await Branch.findOneAndUpdate(
        { _id: req.params.id, tenantId },
        req.body,
        { new: true, runValidators: true }
    );

    if (!branch) {
        throw new AppError("Branch not found", 404);
    }
    res.status(200).json(branch);
});

export const deleteBranch = asyncHandler(async (req: Request, res: Response) => {
    // @ts-ignore
    const tenantId = req.tenantId;
    const branch = await Branch.findOneAndDelete({ _id: req.params.id, tenantId });

    if (!branch) {
        throw new AppError("Branch not found", 404);
    }
    res.status(200).json({ message: "Branch deleted successfully" });
});
