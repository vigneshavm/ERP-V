import { Request, Response } from 'express';
import Role from '../models/Role.js';
import mongoose from 'mongoose';
import { asyncHandler } from '@smarterp/shared/utils/asyncHandler.js';
import { ok, created, paginated } from '@smarterp/shared/utils/response.js';

// Get all roles (System defaults + Tenant specific)
export const getRoles = asyncHandler(async (req: Request, res: Response) =>{
    const tenantId = req.user!.tenantId;

    const query: any = {
        isActive: true,
        $or: [
            { isSystem: true },
            { tenantId: new mongoose.Types.ObjectId(tenantId) }
        ]
    };

    const roles = await Role.find(query).sort({ isSystem: -1, name: 1 }); // System roles first

    res.status(200).json(roles);

// Create a new custom role
export const createRole = asyncHandler(async (req: Request, res: Response) =>{
    const { name, code, description, systemRole, permissions } = req.body;
    const tenantId = req.user!.tenantId;

    if (!tenantId) {
        return res.status(400).json({ message: "Tenant ID required" });
    }

    const newRole = await Role.create({
        name,
        code: code || name.toUpperCase().replace(/\s+/g, '_'),
        description,
        systemRole, // e.g., 'staff', 'manager'
        tenantId,
        isSystem: false,
        permissions
    });

    res.status(201).json(newRole);
