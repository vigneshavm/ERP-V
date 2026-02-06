import { Response } from 'express';
import SupplierGroup from '../models/SupplierGroup.js';
import Supplier from '../models/Supplier.js';
import { AuthenticatedRequest } from '../../../middlewares/authMiddleware.js';

export const createGroup = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const {
            name, description, color, nature, region,
            financialCategory, priority, taxType,
            paymentTerms, creditLimit, discountPercent, icon
        } = req.body;
        const tenantId = req.user?.tenantId;

        if (!tenantId) {
            return res.status(401).json({ success: false, message: 'Unauthorized access' });
        }

        const existingGroup = await SupplierGroup.findOne({ tenantId, name });
        if (existingGroup) {
            return res.status(400).json({ success: false, message: 'Group with this name already exists' });
        }

        const group = await SupplierGroup.create({
            tenantId,
            name,
            description,
            color,
            nature,
            region,
            financialCategory,
            priority,
            taxType,
            paymentTerms,
            creditLimit,
            discountPercent,
            icon
        });

        res.status(201).json({ success: true, data: group });
    } catch (error: any) {
        console.error('Create Group Error:', error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

export const getGroups = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        if (!tenantId) {
            return res.status(401).json({ success: false, message: 'Unauthorized access' });
        }

        const groups = await SupplierGroup.find({ tenantId }).sort({ name: 1 });
        res.status(200).json({ success: true, data: groups });
    } catch (error: any) {
        console.error('Get Groups Error:', error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

export const updateGroup = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        const tenantId = req.user?.tenantId;

        const group = await SupplierGroup.findOneAndUpdate(
            { _id: id, tenantId },
            req.body,
            { new: true, runValidators: true }
        );

        if (!group) {
            return res.status(404).json({ success: false, message: 'Group not found' });
        }

        res.status(200).json({ success: true, data: group });
    } catch (error: any) {
        console.error('Update Group Error:', error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

export const deleteGroup = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        const tenantId = req.user?.tenantId;

        // Check if group is used by any suppliers
        const isUsed = await Supplier.findOne({ groupId: id, tenantId });
        if (isUsed) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete group that is currently assigned to suppliers. Please reassign suppliers first.'
            });
        }

        const group = await SupplierGroup.findOneAndDelete({ _id: id, tenantId });

        if (!group) {
            return res.status(404).json({ success: false, message: 'Group not found' });
        }

        res.status(200).json({ success: true, message: 'Group deleted successfully' });
    } catch (error: any) {
        console.error('Delete Group Error:', error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};
