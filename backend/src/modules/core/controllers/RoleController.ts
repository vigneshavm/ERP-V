import { Response } from 'express';
import Role from '../models/Role.js';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../../../middlewares/authMiddleware.js';
import { error } from '../../../config/logger.js';

// Get all roles (System defaults + Tenant specific)
export const getRoles = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const tenantId = req.user.tenantId;

        const query: any = {
            isActive: true,
            $or: [
                { isSystem: true },
                { tenantId: new mongoose.Types.ObjectId(tenantId) }
            ]
        };

        const roles = await Role.find(query).sort({ isSystem: -1, name: 1 }); // System roles first

        res.status(200).json(roles);
    } catch (err: any) {
        error('Error fetching roles:', err);
        res.status(500).json({ message: 'Error fetching roles', error: err.message });
    }
};

// Create a new custom role
export const createRole = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { name, code, description, systemRole, permissions } = req.body;
        const tenantId = req.user.tenantId;

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
    } catch (err: any) {
        error('Error creating role:', err);
        res.status(500).json({ message: 'Error creating role', error: err.message });
    }
};
