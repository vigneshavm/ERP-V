import Role from '../models/Role.js';
import mongoose from 'mongoose';
// Get all roles (System defaults + Tenant specific)
export const getRoles = async (req, res) => {
    try {
        const tenantId = req.user?.tenantId;
        const query = {
            isActive: true,
            $or: [
                { isSystem: true },
                { tenantId: new mongoose.Types.ObjectId(tenantId) }
            ]
        };
        const roles = await Role.find(query).sort({ isSystem: -1, name: 1 }); // System roles first
        res.status(200).json(roles);
    }
    catch (error) {
        console.error("Error fetching roles:", error);
        res.status(500).json({ message: "Error fetching roles", error: error.message });
    }
};
// Create a new custom role
export const createRole = async (req, res) => {
    try {
        const { name, code, description, systemRole, permissions } = req.body;
        const tenantId = req.user?.tenantId;
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
    }
    catch (error) {
        console.error("Error creating role:", error);
        res.status(500).json({ message: "Error creating role", error: error.message });
    }
};
