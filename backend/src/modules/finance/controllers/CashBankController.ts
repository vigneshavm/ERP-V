import { Response, NextFunction } from 'express';
import { container } from 'tsyringe';
import { CashBankService } from '../services/CashBankService.js';
import { ChequeService } from '../services/ChequeService.js';
import { AuthenticatedRequest } from '../../../middlewares/authMiddleware.js';

const getTenantId = (req: AuthenticatedRequest): string => {
    return (req.tenantId || req.user?.tenantId || '').toString();
};

const getUserId = (req: AuthenticatedRequest): string => {
    return (req.user?._id || req.user?.id || '').toString();
};

// ==========================================
// Account Management
// ==========================================

export const getAccounts = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const cashBankService = container.resolve(CashBankService);
        const accounts = await cashBankService.getAccounts(getTenantId(req));
        res.status(200).json(accounts);
    } catch (err) {
        next(err);
    }
};

export const createAccount = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const cashBankService = container.resolve(CashBankService);
        const account = await cashBankService.createAccount(
            req.body,
            getTenantId(req),
            getUserId(req),
            req.user?.name || 'User'
        );
        res.status(201).json(account);
    } catch (err) {
        next(err);
    }
};

export const updateAccount = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const cashBankService = container.resolve(CashBankService);
        const account = await cashBankService.updateAccount(
            req.params.id as string,
            getTenantId(req),
            req.body,
            req.user?.name || 'User'
        );
        res.status(200).json(account);
    } catch (err) {
        next(err);
    }
};

export const deleteAccount = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const cashBankService = container.resolve(CashBankService);
        await cashBankService.deleteAccount(
            req.params.id as string,
            getTenantId(req),
            req.user?.name || 'User'
        );
        res.status(200).json({ message: 'Account deleted' });
    } catch (err) {
        next(err);
    }
};

// ==========================================
// Transactions
// ==========================================

export const getTransactions = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const cashBankService = container.resolve(CashBankService);
        const transactions = await cashBankService.getTransactions(req.params.id as string, getTenantId(req));
        res.status(200).json(transactions);
    } catch (err) {
        next(err);
    }
};

export const getAllTransactions = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const cashBankService = container.resolve(CashBankService);
        const transactions = await cashBankService.getAllTransactions(getTenantId(req));
        res.status(200).json(transactions);
    } catch (err) {
        next(err);
    }
};

export const createTransfer = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const cashBankService = container.resolve(CashBankService);
        const txn = await cashBankService.createTransfer(
            req.body,
            getTenantId(req),
            getUserId(req),
            req.user?.name || 'User'
        );
        res.status(201).json(txn);
    } catch (err) {
        next(err);
    }
};

export const createCashTransaction = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const cashBankService = container.resolve(CashBankService);
        const txn = await cashBankService.createCashTransaction(
            req.body,
            getTenantId(req),
            getUserId(req),
            req.user?.name || 'User'
        );
        res.status(201).json(txn);
    } catch (err) {
        next(err);
    }
};

// ==========================================
// Ledger & Reconciliation
// ==========================================

export const getAccountLedger = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const cashBankService = container.resolve(CashBankService);
        const ledgerData = await cashBankService.getLedger(req.params.id as string, getTenantId(req), req.query);
        res.status(200).json(ledgerData);
    } catch (err) {
        next(err);
    }
};

export const toggleReconciliation = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const cashBankService = container.resolve(CashBankService);
        const updated = await cashBankService.toggleReconciliation(req.params.id as string, getTenantId(req), getUserId(req));
        res.status(200).json(updated);
    } catch (err) {
        next(err);
    }
};

export const bulkReconcile = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const cashBankService = container.resolve(CashBankService);
        const { transactionIds, reconciled } = req.body;
        const result = await cashBankService.bulkReconcile(transactionIds, getTenantId(req), getUserId(req), reconciled);
        res.status(200).json({ message: 'Transactions updated', result });
    } catch (err) {
        next(err);
    }
};

// ==========================================
// Summary & Position
// ==========================================

export const getBankSummary = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const cashBankService = container.resolve(CashBankService);
        const summary = await cashBankService.getBankSummary(getTenantId(req));
        res.status(200).json(summary);
    } catch (err) {
        next(err);
    }
};

export const getCashBankPosition = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const cashBankService = container.resolve(CashBankService);
        const position = await cashBankService.getPosition(getTenantId(req));
        res.status(200).json(position);
    } catch (err) {
        next(err);
    }
};

export const validatePayments = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const cashBankService = container.resolve(CashBankService);
        const { payments } = req.body;
        const validation = await cashBankService.validatePayments(payments || [], getTenantId(req));
        res.status(200).json(validation);
    } catch (err) {
        next(err);
    }
};

// ==========================================
// Cheques
// ==========================================

export const getCheques = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const chequeService = container.resolve(ChequeService);
        const cheques = await chequeService.getCheques(getTenantId(req), req.query);
        res.status(200).json(cheques);
    } catch (err) {
        next(err);
    }
};

export const createCheque = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const chequeService = container.resolve(ChequeService);
        const cheque = await chequeService.createCheque(getTenantId(req), getUserId(req), req.body);
        res.status(201).json(cheque);
    } catch (err) {
        next(err);
    }
};

export const updateChequeStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const chequeService = container.resolve(ChequeService);
        const cheque = await chequeService.updateChequeStatus(
            req.params.id as string,
            getTenantId(req),
            getUserId(req),
            req.body.status
        );
        res.status(200).json(cheque);
    } catch (err) {
        next(err);
    }
};

export const getEffectiveBalance = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const chequeService = container.resolve(ChequeService);
        const balance = await chequeService.getEffectiveBalance(req.params.id as string, getTenantId(req));
        res.status(200).json(balance);
    } catch (err) {
        next(err);
    }
};

export default {
    getAccounts,
    createAccount,
    updateAccount,
    deleteAccount,
    getTransactions,
    getAllTransactions,
    createTransfer,
    createCashTransaction,
    getAccountLedger,
    toggleReconciliation,
    bulkReconcile,
    getBankSummary,
    getCashBankPosition,
    validatePayments,
    getCheques,
    createCheque,
    updateChequeStatus,
    getEffectiveBalance,
};
