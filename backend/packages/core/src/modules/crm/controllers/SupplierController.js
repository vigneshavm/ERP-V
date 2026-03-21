import mongoose from 'mongoose';
import Supplier from '../models/Supplier.js';
import { info } from '@smarterp/shared/config/logger.js';
import { asyncHandler } from '@smarterp/shared/utils/asyncHandler.js';
import { ok, created, paginated } from '@smarterp/shared/utils/response.js';
import { parsePagination, parseSort } from '@smarterp/shared/utils/pagination.js';
import { requireUserId } from '@smarterp/shared/utils/tenantContext.js';
import { AppError } from '@smarterp/shared/utils/AppError.js';
const validId = (id) => {
    if (!mongoose.Types.ObjectId.isValid(id))
        throw new AppError('Invalid supplier ID format', 400);
    return id;
};
export const addSupplier = asyncHandler(async (req, res) => {
    const userId = requireUserId(req);
    const { businessName, contactPersonName, contactNo, email, physicalAddress, gstNo, supplierType, openingBalance, balanceType, creditPeriod, status } = req.body;
    if (!businessName)
        throw new AppError('Legal Business Name must be provided', 400);
    const [dupPhone, dupEmail] = await Promise.all([
        contactNo ? Supplier.exists({ contactNo, owner: userId }) : null,
        email ? Supplier.exists({ email, owner: userId }) : null,
    ]);
    if (dupPhone)
        throw new AppError('Contact number already exists in your supplier list', 400);
    if (dupEmail)
        throw new AppError('Email already exists in your supplier list', 400);
    const last = await Supplier.findOne({ owner: userId }).sort({ supplierId: -1 });
    const nextNum = last?.supplierId ? parseInt(last.supplierId.split('-')[1]) + 1 : 1;
    const supplierId = `SUP-${String(nextNum).padStart(5, '0')}`;
    const supplier = await Supplier.create({
        supplierId, businessName, contactPersonName, contactNo, email, physicalAddress,
        gstNo, supplierType: supplierType || 'manufacturer', openingBalance: openingBalance || 0,
        balanceType: balanceType || 'payable', creditPeriod: creditPeriod || 0,
        status: status || 'active', tenantId: req.user.tenantId, owner: userId,
    });
    info(`New supplier added by ${req.user.name}: ${businessName} (${supplierId})`);
    created(res, supplier);
});
export const updateSupplier = asyncHandler(async (req, res) => {
    const userId = requireUserId(req);
    const id = validId(req.params.id);
    const supplier = await Supplier.findOne({ _id: id, owner: userId });
    if (!supplier)
        throw new AppError('Supplier not found or unauthorized', 404);
    const [dupPhone, dupEmail] = await Promise.all([
        req.body.contactNo && req.body.contactNo !== supplier.contactNo
            ? Supplier.exists({ contactNo: req.body.contactNo, owner: userId, _id: { $ne: id } }) : null,
        req.body.email && req.body.email !== supplier.email
            ? Supplier.exists({ email: req.body.email, owner: userId, _id: { $ne: id } }) : null,
    ]);
    if (dupPhone)
        throw new AppError('Contact number already exists', 400);
    if (dupEmail)
        throw new AppError('Email already exists', 400);
    const updated = await Supplier.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!updated)
        throw new AppError('Supplier not found', 404);
    info(`Supplier updated by ${req.user.name}: ${updated.businessName}`);
    ok(res, updated, 'Supplier updated successfully');
});
export const getAllSuppliers = asyncHandler(async (req, res) => {
    const userId = requireUserId(req);
    const { page, limit } = parsePagination(req.query, 50);
    const sort = parseSort(req.query.sort, 'businessName');
    const [suppliers, total] = await Promise.all([
        Supplier.find({ owner: userId }).sort(sort).skip((page - 1) * limit).limit(limit),
        Supplier.countDocuments({ owner: userId }),
    ]);
    paginated(res, suppliers, total, page, limit);
});
export const getSupplierById = asyncHandler(async (req, res) => {
    const userId = requireUserId(req);
    const id = validId(req.params.id);
    const supplier = await Supplier.findOne({ _id: id, owner: userId });
    if (!supplier)
        throw new AppError('Supplier not found or unauthorized', 404);
    ok(res, supplier);
});
export const deleteSupplier = asyncHandler(async (req, res) => {
    const userId = requireUserId(req);
    const id = validId(req.params.id);
    const supplier = await Supplier.findOne({ _id: id, owner: userId });
    if (!supplier)
        throw new AppError('Supplier not found or unauthorized', 404);
    await Supplier.findByIdAndDelete(id);
    info(`Supplier deleted by ${req.user.name}: ${supplier.businessName}`);
    ok(res, null, 'Supplier deleted');
});
export default { addSupplier, updateSupplier, getAllSuppliers, getSupplierById, deleteSupplier };
