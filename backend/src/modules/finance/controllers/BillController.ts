import { Response, NextFunction } from 'express';
import { container } from 'tsyringe';
import { BillService } from '../services/BillService.js';
import { AuthenticatedRequest } from '../../../middlewares/authMiddleware.js';
import { AppError } from '../../../utils/AppError.js';

const getTenantId = (req: AuthenticatedRequest): string => {
    const id = req.tenantId || req.user?.tenantId;
    if (!id) throw new AppError("Tenant context required", 400);
    return id.toString();
};

const getUserId = (req: AuthenticatedRequest): string => {
    const id = req.user?._id || req.user?.id;
    if (!id) throw new AppError("User authentication required", 401);
    return id.toString();
};

export const getAllBills = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const billService = container.resolve(BillService);
        const tenantId = getTenantId(req);
        const { supplier, status, paymentStatus } = req.query;

        const filters = {
            supplier: supplier as string,
            status: status as string,
            paymentStatus: paymentStatus ? (paymentStatus as string).split(',') : undefined
        };

        const bills = await billService.getAllBills(tenantId, filters);
        res.status(200).json(bills);
    } catch (err) {
        next(err);
    }
};

export const createBill = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const billService = container.resolve(BillService);
        const tenantId = getTenantId(req);
        const userId = getUserId(req);

        const bill = await billService.createBill(tenantId, userId, req.body);
        res.status(201).json(bill);
    } catch (err) {
        next(err);
    }
};

export const getBillById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const billService = container.resolve(BillService);
        const tenantId = getTenantId(req);

        const bill = await billService.getBillById(req.params.id as string, tenantId);
        res.status(200).json(bill);
    } catch (err) {
        next(err);
    }
};

export const updateBill = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const billService = container.resolve(BillService);
        const tenantId = getTenantId(req);

        const updatedBill = await billService.updateBill(req.params.id as string, tenantId, req.body);
        res.status(200).json(updatedBill);
    } catch (err) {
        next(err);
    }
};

export const deleteBill = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const billService = container.resolve(BillService);
        const tenantId = getTenantId(req);

        await billService.deleteBill(req.params.id as string, tenantId);
        res.status(200).json({ message: 'Bill deleted' });
    } catch (err) {
        next(err);
    }
};

export const updateBillPayment = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const billService = container.resolve(BillService);
        const tenantId = getTenantId(req);
        const userId = getUserId(req);

        const bill = await billService.updateBillPayment(req.params.id as string, tenantId, userId, req.body);
        res.status(200).json({
            message: 'Payment recorded successfully',
            bill
        });
    } catch (err) {
        next(err);
    }
};

export default {
    getAllBills,
    createBill,
    getBillById,
    updateBill,
    deleteBill,
    updateBillPayment,
};
