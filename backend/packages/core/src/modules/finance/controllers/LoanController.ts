import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { container } from "tsyringe";
import { LoanService } from "../services/LoanService.js";

export const createLoan = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const loanService = container.resolve(LoanService);
    const tenantId = req.tenantId || req.user!._id as string;
    const loan = await loanService.createLoan(req.body, tenantId, req.user!._id as string);
    res.status(201).json(loan);
});

export const getLoans = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const loanService = container.resolve(LoanService);
    const tenantId = req.tenantId || req.user!._id as string;
    const loans = await loanService.getLoans(tenantId);
    res.json(loans);
});

export const getLoanById = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const loanService = container.resolve(LoanService);
    const tenantId = (req.tenantId || req.user!._id) as string;
    const result = await loanService.getLoanById(req.params.id as string, tenantId);
    res.json(result);
});

export const recordEmiPayment = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const loanService = container.resolve(LoanService);
    const tenantId = (req.tenantId || req.user!._id) as string;
    const result = await loanService.recordEmiPayment(req.params.id as string, req.body, tenantId, req.user!._id as string);
    res.status(201).json(result);
});
