import { Request, Response } from 'express';
import mongoose from 'mongoose';

import Supplier from '../models/Supplier.js';
import { info, error } from '../../../config/logger.js';

/**
 * Request interface with authenticated user
 */
interface AuthenticatedRequest extends Request {
    user?: {
        _id: string;
        name?: string;
        [key: string]: any;
    };
}

/**
 * @swagger
 * /api/suppliers:
 *   post:
 *     summary: Add new supplier
 *     tags: [Suppliers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Supplier'
 *     responses:
 *       201:
 *         description: Supplier created successfully
 */
export const addSupplier = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { businessName, contactPersonName, contactNo, email, physicalAddress, gstNo, supplierType, openingBalance, balanceType, creditPeriod, status } = req.body;

        if (!businessName || !contactPersonName || !contactNo || !email || !physicalAddress || !gstNo || !supplierType || !status) {
            res.status(400).json({ message: 'All required fields must be provided' });
            return;
        }

        // Check for duplicate contactNo
        const existingContact = await Supplier.findOne({
            contactNo,
            owner: req.user?._id
        });

        if (existingContact) {
            res.status(400).json({ message: 'Contact number already exists in your supplier list' });
            return;
        }

        // Check for duplicate email
        const existingEmail = await Supplier.findOne({
            email,
            owner: req.user?._id
        });

        if (existingEmail) {
            res.status(400).json({ message: 'Email already exists in your supplier list' });
            return;
        }

        // Auto-generate supplierId
        const lastSupplier = await Supplier.findOne({ owner: req.user?._id }).sort({ supplierId: -1 });
        let nextId = 1;
        if (lastSupplier && lastSupplier.supplierId) {
            const lastNum = parseInt(lastSupplier.supplierId.split('-')[1]);
            nextId = lastNum + 1;
        }
        const supplierId = `SUP-${nextId.toString().padStart(5, '0')}`;

        // Create supplier with owner reference
        const supplier = await Supplier.create({
            supplierId,
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
            status,
            owner: req.user?._id
        });

        info(`New supplier added by ${req.user?.name}: ${businessName} (${supplierId})`);
        res.status(201).json(supplier);
    } catch (err) {
        error(`Add Supplier Error: ${(err as Error).message}`);
        res.status(500).json({ message: 'Server Error', error: (err as Error).message });
    }
};

/**
 * @desc Update supplier
 * @route PUT /api/suppliers/:id
 */
export const updateSupplier = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id as string)) {
            res.status(400).json({ message: 'Invalid supplier ID format' });
            return;
        }

        const supplier = await Supplier.findOne({
            _id: req.params.id,
            owner: req.user?._id
        });

        if (!supplier) {
            res.status(404).json({ message: 'Supplier not found or unauthorized' });
            return;
        }

        // Check for duplicate contactNo if being updated
        if (req.body.contactNo && req.body.contactNo !== supplier.contactNo) {
            const existingContact = await Supplier.findOne({
                contactNo: req.body.contactNo,
                owner: req.user?._id,
                _id: { $ne: req.params.id }
            });

            if (existingContact) {
                res.status(400).json({ message: 'Contact number already exists' });
                return;
            }
        }

        // Check for duplicate email if being updated
        if (req.body.email && req.body.email !== supplier.email) {
            const existingEmail = await Supplier.findOne({
                email: req.body.email,
                owner: req.user?._id,
                _id: { $ne: req.params.id }
            });

            if (existingEmail) {
                res.status(400).json({ message: 'Email already exists' });
                return;
            }
        }

        const updated = await Supplier.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        if (!updated) {
            res.status(404).json({ message: 'Supplier not found' });
            return;
        }

        info(`Supplier updated by ${req.user?.name}: ${updated.businessName} (${updated.supplierId})`);
        res.status(200).json(updated);
    } catch (err) {
        error(`Update Supplier Error: ${(err as Error).message}`);
        res.status(500).json({ message: 'Server Error', error: (err as Error).message });
    }
};

/**
 * @swagger
 * /api/suppliers:
 *   get:
 *     summary: Get all suppliers
 *     tags: [Suppliers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of suppliers retrieved
 */
export const getAllSuppliers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const suppliers = await Supplier.find({ owner: req.user?._id }).sort({ businessName: 1 });
        res.status(200).json(suppliers);
    } catch (err) {
        error(`Get All Suppliers Error: ${(err as Error).message}`);
        res.status(500).json({ message: 'Server Error', error: (err as Error).message });
    }
};

/**
 * @desc Get single supplier
 * @route GET /api/suppliers/:id
 */
export const getSupplierById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id as string)) {
            res.status(400).json({ message: 'Invalid supplier ID format' });
            return;
        }

        const supplier = await Supplier.findOne({
            _id: req.params.id,
            owner: req.user?._id
        });

        if (!supplier) {
            res.status(404).json({ message: 'Supplier not found or unauthorized' });
            return;
        }

        res.status(200).json(supplier);
    } catch (err) {
        error(`Get Supplier By Id Error: ${(err as Error).message}`);
        res.status(500).json({ message: 'Server Error', error: (err as Error).message });
    }
};

/**
 * @desc Delete supplier
 * @route DELETE /api/suppliers/:id
 */
export const deleteSupplier = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id as string)) {
            res.status(400).json({ message: 'Invalid supplier ID format' });
            return;
        }

        const supplier = await Supplier.findOne({
            _id: req.params.id,
            owner: req.user?._id
        });

        if (!supplier) {
            res.status(404).json({ message: 'Supplier not found or unauthorized' });
            return;
        }

        await Supplier.findByIdAndDelete(req.params.id as string);
        info(`Supplier deleted by ${req.user?.name}: ${supplier.businessName}`);
        res.status(200).json({ message: 'Supplier deleted' });
    } catch (err) {
        error(`Delete Supplier Error: ${(err as Error).message}`);
        res.status(500).json({ message: 'Server Error', error: (err as Error).message });
    }
};

export default {
    addSupplier,
    updateSupplier,
    getAllSuppliers,
    getSupplierById,
    deleteSupplier,
};
