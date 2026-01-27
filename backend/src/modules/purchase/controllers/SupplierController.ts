import { Response } from 'express';
import Supplier from '../models/Supplier.js';
import Purchase from '../models/Purchase.js';
import PurchaseReturn from '../models/PurchaseReturn.js';
import { AuthenticatedRequest } from '../../../middlewares/authMiddleware.js'; // Adjust path as needed

export const createSupplier = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const {
            businessName, contactPersonName, contactNo, email, physicalAddress,
            gstNo, supplierType, openingBalance, balanceType, creditPeriod, status
        } = req.body;

        const tenantId = req.user?.tenantId;

        if (!tenantId) {
            return res.status(401).json({ success: false, message: 'Unauthorized access' });
        }

        // Check if supplier exists
        const existingSupplier = await Supplier.findOne({ tenantId, businessName });
        if (existingSupplier) {
            return res.status(400).json({ success: false, message: 'Supplier with this name already exists' });
        }

        const supplier = await Supplier.create({
            tenantId,
            businessName,
            contactPersonName,
            contactNo,
            email,
            physicalAddress,
            gstNo,
            supplierType,
            openingBalance: openingBalance || 0,
            balanceType: balanceType || 'payable',
            creditPeriod: creditPeriod || 0,
            status: status || 'active'
        });

        res.status(201).json({ success: true, data: supplier });
    } catch (error: any) {
        console.error('Create Supplier Error:', error);
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Supplier with this name already exists' });
        }
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

export const getSuppliers = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        if (!tenantId) {
            return res.status(401).json({ success: false, message: 'Unauthorized access' });
        }

        const suppliers = await Supplier.find({ tenantId }).sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: suppliers });
    } catch (error: any) {
        console.error('Get Suppliers Error:', error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

export const getSupplierById = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        const tenantId = req.user?.tenantId;

        const supplier = await Supplier.findOne({ _id: id, tenantId });

        if (!supplier) {
            return res.status(404).json({ success: false, message: 'Supplier not found' });
        }

        res.status(200).json({ success: true, data: supplier });
    } catch (error: any) {
        console.error('Get Supplier Error:', error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

export const updateSupplier = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        const tenantId = req.user?.tenantId;

        let supplier = await Supplier.findOne({ _id: id, tenantId });

        if (!supplier) {
            return res.status(404).json({ success: false, message: 'Supplier not found' });
        }

        supplier = await Supplier.findOneAndUpdate(
            { _id: id, tenantId },
            req.body,
            { new: true, runValidators: true }
        );

        res.status(200).json({ success: true, data: supplier });
    } catch (error: any) {
        console.error('Update Supplier Error:', error);
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Supplier with this name already exists' });
        }
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

export const deleteSupplier = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        const tenantId = req.user?.tenantId;

        // Check if supplier is used in any Purchase Orders
        const hasPurchases = await Purchase.findOne({ vendorId: id, tenantId });
        if (hasPurchases) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete supplier with existing purchase records. Please delete associated purchases first.'
            });
        }

        // Check if supplier is used in any Purchase Returns
        const hasReturns = await PurchaseReturn.findOne({ vendorId: id, tenantId });
        if (hasReturns) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete supplier with existing purchase return records. Please delete associated returns first.'
            });
        }

        const supplier = await Supplier.findOneAndDelete({ _id: id, tenantId });

        if (!supplier) {
            return res.status(404).json({ success: false, message: 'Supplier not found' });
        }

        res.status(200).json({ success: true, message: 'Supplier deleted successfully' });
    } catch (error: any) {
        console.error('Delete Supplier Error:', error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};
