import { Request, Response } from 'express';
import { asyncHandler } from '@smarterp/shared/utils/asyncHandler.js';
import { AuthenticatedRequest } from '@smarterp/shared/middlewares/authMiddleware.js';
import { container } from 'tsyringe';
import { CashBankService } from '../services/CashBankService.js';

/**
 * Request interface with authenticated user
 */
export const getAccounts = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const cashBankService = container.resolve(CashBankService);
    const accounts = await cashBankService.getAccounts(req.user!._id as string);
    res.status(200).json(accounts);
});

export const createAccount = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const cashBankService = container.resolve(CashBankService);
    const account = await cashBankService.createAccount(req.body, req.user!._id as string, req.user!.name || 'Unknown');
    res.status(201).json(account);
});

export const updateAccount = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const cashBankService = container.resolve(CashBankService);
    const account = await cashBankService.updateAccount(req.params.id as string, req.user!._id as string, req.body, req.user!.name || 'Unknown');
    res.status(200).json(account);
});

export const deleteAccount = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const cashBankService = container.resolve(CashBankService);
    await cashBankService.deleteAccount(req.params.id as string, req.user!._id as string, req.user!.name || 'Unknown');
    res.status(200).json({ message: 'Account deleted successfully' });
});

export const getTransactions = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const cashBankService = container.resolve(CashBankService);
    const transactions = await cashBankService.getTransactions(req.params.id as string, req.user!._id as string);
    res.status(200).json(transactions);
});

export const createTransfer = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const cashBankService = container.resolve(CashBankService);
    const transaction = await cashBankService.createTransfer(req.body, req.user!._id as string, req.user!.name || 'Unknown');
    res.status(201).json(transaction);
});

export const createCashTransaction = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const cashBankService = container.resolve(CashBankService);
    const transaction = await cashBankService.createCashTransaction(req.body, req.user!._id as string, req.user!.name || 'Unknown');
    res.status(201).json(transaction);
});

export const getAccountLedger = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const cashBankService = container.resolve(CashBankService);
    const result = await cashBankService.getLedger(req.params.id as string, req.user!._id as string, req.query);
    res.status(200).json(result);
});

export const toggleReconciliation = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const cashBankService = container.resolve(CashBankService);
    const transaction = await cashBankService.toggleReconciliation(req.params.id as string, req.user!._id as string);
    res.status(200).json({ transaction });
});

export const bulkReconcile = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const cashBankService = container.resolve(CashBankService);
    await cashBankService.bulkReconcile(req.body.transactionIds, req.user!._id as string, req.body.reconciled);
    res.status(200).json({ message: 'Bulk reconcile successful' });
});

export const getBankSummary = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const cashBankService = container.resolve(CashBankService);
    const summary = await cashBankService.getBankSummary(req.user!._id as string);
    res.status(200).json(summary);
});

export const getCashBankPosition = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const cashBankService = container.resolve(CashBankService);
    const position = await cashBankService.getPosition(req.user!._id as string);
    res.status(200).json({ totalBankBalance: position.totalBankBalance });
});

export const validatePayments = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const cashBankService = container.resolve(CashBankService);
    const result = await cashBankService.validatePayments(req.body.accountId as string, req.body.payments, req.user!._id as string);
    res.status(200).json(result);
});

export const getCheques = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const cashBankService = container.resolve(CashBankService);
    const cheques = await cashBankService.getCheques(req.user!._id as string, req.query.sector as unknown as string | undefined);
    res.status(200).json(cheques);
});

export const createCheque = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const cashBankService = container.resolve(CashBankService);
    const tenantId = req.tenantId as string;
    const cheque = await cashBankService.createCheque(req.body, req.user!._id as string, tenantId, req.user!.name || 'Unknown');
    res.status(201).json(cheque);
});

export const updateChequeStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const cashBankService = container.resolve(CashBankService);
    const cheque = await cashBankService.updateChequeStatus(req.params.id as string, req.body.status as string, req.user!._id as string, req.user!.name || 'Unknown');
    res.status(200).json(cheque);
});

export const getDayEndSummary = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const cashBankService = container.resolve(CashBankService);
    const summary = await cashBankService.getDayEndSummary(req.user!._id as string, req.query.date as unknown as string | undefined);
    res.status(200).json(summary);
});

export const saveDayEndToDB = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const cashBankService = container.resolve(CashBankService);
    await cashBankService.saveDayEndToDB(req.user!._id as string, req.user!.name || 'Unknown');
    res.status(200).json({ message: 'Day end reconciliation saved successfully' });
});

export const getEffectiveBalance = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const cashBankService = container.resolve(CashBankService);
    const balanceInfo = await cashBankService.getEffectiveBalance(req.params.id as string, req.user!._id as string, req.query.date as unknown as string | undefined);
    res.status(200).json(balanceInfo);
});

export const getAllTransactions = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const cashBankService = container.resolve(CashBankService);
    const transactions = await cashBankService.getAllTransactions(req.user!._id as string);
    res.status(200).json(transactions);
});

export const getAllDailyFinance = asyncHandler(async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
    res.status(200).json([]);
});

const CashBankController = {
    getAccounts, createAccount, updateAccount, deleteAccount, getTransactions, createTransfer, createCashTransaction,
    getAccountLedger, toggleReconciliation, bulkReconcile, getBankSummary, getCashBankPosition, validatePayments,
    getCheques, createCheque, updateChequeStatus, getEffectiveBalance, getDayEndSummary, saveDayEndToDB,
    getAllTransactions, getAllDailyFinance
};

export default CashBankController;
