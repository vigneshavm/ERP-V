import { Response, NextFunction } from "express";
import { container } from "tsyringe";
import { LoanService } from "../services/LoanService.js";
import { AuthenticatedRequest } from "../../../middlewares/authMiddleware.js";
import { AppError } from "../../../utils/AppError.js";

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

// @desc    Create new Loan
// @route   POST /api/loans
export const createLoan = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const loanService = container.resolve(LoanService);
        const tenantId = getTenantId(req);
        const userId = getUserId(req);

        const loan = await loanService.createLoan(tenantId, userId, req.body);
        res.status(201).json(loan);
    } catch (err) {
        next(err);
    }
};

// @desc    Get all loans for tenant
// @route   GET /api/loans
export const getLoans = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const loanService = container.resolve(LoanService);
        const tenantId = getTenantId(req);

        const loans = await loanService.getLoans(tenantId);
        res.json(loans);
    } catch (err) {
        next(err);
    }
};

// @desc    Get single loan and its payments
// @route   GET /api/loans/:id
export const getLoanById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const loanService = container.resolve(LoanService);
        const tenantId = getTenantId(req);

        const result = await loanService.getLoanById(req.params.id as string, tenantId);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

// @desc    Record an EMI payment for a loan
// @route   POST /api/loans/:id/payments
export const recordEmiPayment = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const loanService = container.resolve(LoanService);
        const tenantId = getTenantId(req);
        const userId = getUserId(req);

        const result = await loanService.recordEmiPayment(req.params.id as string, tenantId, userId, req.body);
        res.status(201).json(result);
    } catch (err) {
        next(err);
    }
};
