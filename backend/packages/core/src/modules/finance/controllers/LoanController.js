import asyncHandler from "express-async-handler";
import { container } from "tsyringe";
import { LoanService } from "../services/LoanService.js";
export const createLoan = asyncHandler(async (req, res) => {
    const loanService = container.resolve(LoanService);
    const tenantId = req.tenantId || req.user._id;
    const loan = await loanService.createLoan(req.body, tenantId, req.user._id);
    res.status(201).json(loan);
});
export const getLoans = asyncHandler(async (req, res) => {
    const loanService = container.resolve(LoanService);
    const tenantId = req.tenantId || req.user._id;
    const loans = await loanService.getLoans(tenantId);
    res.json(loans);
});
export const getLoanById = asyncHandler(async (req, res) => {
    const loanService = container.resolve(LoanService);
    const tenantId = (req.tenantId || req.user._id);
    const result = await loanService.getLoanById(req.params.id, tenantId);
    res.json(result);
});
export const recordEmiPayment = asyncHandler(async (req, res) => {
    const loanService = container.resolve(LoanService);
    const tenantId = (req.tenantId || req.user._id);
    const result = await loanService.recordEmiPayment(req.params.id, req.body, tenantId, req.user._id);
    res.status(201).json(result);
});
