import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { container } from 'tsyringe';
import { BillService } from '../services/BillService.js';

interface AuthenticatedRequest extends Request {
    user?: {
        _id: string;
        name?: string;
        [key: string]: any;
    };
}

export const getAllBills = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const billService = container.resolve(BillService);
    const { supplier, status, paymentStatus, page = 1, limit = 50, sort = '-date' } = req.query;

    // Handle sort
    const sortField = String(sort).startsWith('-') ? String(sort).substring(1) : String(sort);
    const sortOrder = String(sort).startsWith('-') ? -1 : 1;
    const sortObj: any = {};
    sortObj[sortField] = sortOrder;

    const { data, total } = await billService.getAllBillsPaginated(
        req.user?._id as string,
        Number(page),
        Number(limit),
        sortObj,
        { supplier: supplier as string, status: status as string, paymentStatus: paymentStatus as string }
    );

    res.status(200).json({
        success: true,
        data,
        pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            pages: Math.ceil(total / Number(limit))
        }
    });
});

export const createBill = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const billService = container.resolve(BillService);
    const bill = await billService.createBill(req.body, req.user?._id as string);
    res.status(201).json(bill);
});

export const getBillById = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const billService = container.resolve(BillService);
    const bill = await billService.getBillById(req.params.id as string, req.user?._id as string);
    res.status(200).json(bill);
});

export const updateBill = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const billService = container.resolve(BillService);
    const bill = await billService.updateBill(req.params.id as string, req.user?._id as string, req.body);
    res.status(200).json(bill);
});

export const deleteBill = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const billService = container.resolve(BillService);
    await billService.deleteBill(req.params.id as string, req.user?._id as string);
    res.status(200).json({ message: 'Bill deleted' });
});

export const updateBillPayment = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const billService = container.resolve(BillService);
    const result = await billService.updateBillPayment(req.params.id as string, req.user?._id as string, req.body);
    res.status(200).json({ message: 'Payment recorded successfully', bill: result });
});

export default {
    getAllBills,
    createBill,
    getBillById,
    updateBill,
    deleteBill,
    updateBillPayment,
};
