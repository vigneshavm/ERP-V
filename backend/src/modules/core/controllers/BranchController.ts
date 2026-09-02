import { Request, Response } from "express";
import Branch from "../models/Branch.js";
import Store from "../../store/models/Store.js";
import { AppError } from "../../../utils/AppError.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";

export const getAllBranches = asyncHandler(async (req: Request, res: Response) => {
    // tenantId added by middleware
    const tenantId = (req as any).tenantId;
    if (!tenantId) {
        res.status(200).json([]);
        return;
    }

    const branches = await Branch.find({ tenantId }).sort({ createdAt: -1 }).lean();
    const stores = await Store.find({ tenantId }).sort({ createdAt: -1 }).lean();

    const unifiedMap = new Map<string, any>();

    // 1. Add Branch documents
    for (const b of branches) {
        unifiedMap.set(b.name.toLowerCase(), {
            _id: b._id.toString(),
            id: b._id.toString(),
            name: b.name,
            address: b.address || '',
            phone: b.phone || '',
            email: b.email || '',
            isMain: b.isMain ?? true,
            status: 'ACTIVE',
            tenantId: b.tenantId.toString(),
            createdAt: b.createdAt,
            updatedAt: b.updatedAt
        });
    }

    // 2. Add / Enrich with Store documents (saved via BranchSettingsTab)
    for (const s of stores) {
        const key = s.name.toLowerCase();
        const existing = unifiedMap.get(key);
        if (existing) {
            existing.city = s.city || existing.city;
            existing.address = s.address || existing.address;
            existing.gstin = s.gstin || existing.gstin;
            existing.counters = s.counters || [];
        } else {
            unifiedMap.set(key, {
                _id: s._id.toString(),
                id: s._id.toString(),
                name: s.name,
                city: s.city || '',
                address: s.address || '',
                gstin: s.gstin || '',
                isMain: unifiedMap.size === 0,
                status: s.isActive ? 'ACTIVE' : 'INACTIVE',
                counters: s.counters || [],
                tenantId: s.tenantId.toString(),
                createdAt: s.createdAt,
                updatedAt: s.updatedAt
            });
        }
    }

    // 3. Auto-provision default Main Branch if no records exist in either collection
    if (unifiedMap.size === 0) {
        try {
            const defaultBranch = await Branch.create({
                name: "Main Branch",
                isMain: true,
                tenantId
            });
            const defaultStore = await Store.create({
                name: "Main Branch",
                city: "Mukkudal",
                tenantId,
                isActive: true
            });
            unifiedMap.set("main branch", {
                _id: defaultBranch._id.toString(),
                id: defaultBranch._id.toString(),
                name: defaultBranch.name,
                city: defaultStore.city,
                address: '',
                isMain: true,
                status: 'ACTIVE',
                tenantId: defaultBranch.tenantId.toString()
            });
        } catch (error) {
            // Handle concurrent creation
        }
    }

    res.status(200).json(Array.from(unifiedMap.values()));
});

export const getBranch = asyncHandler(async (req: Request, res: Response) => {
    const tenantId = (req as any).tenantId;
    const branch = await Branch.findOne({ _id: req.params.id, tenantId });
    if (!branch) {
        throw new AppError("Branch not found", 404);
    }
    res.status(200).json(branch);
});

export const createBranch = asyncHandler(async (req: Request, res: Response) => {
    const tenantId = (req as any).tenantId;

    // Check if main branch exists if this is trying to be main
    if (req.body.isMain) {
        const existingMain = await Branch.findOne({ tenantId, isMain: true });
        if (existingMain) {
            await Branch.updateOne({ _id: existingMain._id }, { isMain: false });
        }
    }

    const branch = await Branch.create({
        ...req.body,
        tenantId
    });

    // Also sync to Store model
    try {
        await Store.create({
            tenantId,
            name: branch.name,
            address: branch.address,
            city: req.body.city || '',
            isActive: true
        });
    } catch (e) {
        // Ignore duplicate store creation
    }

    res.status(201).json(branch);
});

export const updateBranch = asyncHandler(async (req: Request, res: Response) => {
    const tenantId = (req as any).tenantId;

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

    // Sync to Store model
    try {
        await Store.findOneAndUpdate(
            { tenantId, name: branch.name },
            { $set: { address: branch.address } }
        );
    } catch (e) {
        // Ignore store sync error
    }

    res.status(200).json(branch);
});

export const deleteBranch = asyncHandler(async (req: Request, res: Response) => {
    const tenantId = (req as any).tenantId;
    const branch = await Branch.findOneAndDelete({ _id: req.params.id, tenantId });

    if (!branch) {
        throw new AppError("Branch not found", 404);
    }
    res.status(200).json({ message: "Branch deleted successfully" });
});
