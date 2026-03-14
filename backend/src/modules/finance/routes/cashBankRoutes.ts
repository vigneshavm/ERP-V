import { Router } from "express";
import {
    getAccounts,
    createAccount,
    updateAccount,
    deleteAccount,
    getTransactions,
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
    getDayEndSummary,
    saveDayEndToDB,
    getAllTransactions // Import new method
} from "../controllers/CashBankController.js";
import { protect } from "../../../middlewares/authMiddleware.js";
import { validate } from "../../../middlewares/validate.js";
import { cacheMiddleware } from "../../../config/cache.js";
import {
    CreateAccountSchema,
    UpdateAccountSchema,
    CreateTransferSchema,
    CreateCashTransactionSchema,
    CreateChequeSchema,
    UpdateChequeStatusSchema,
    ValidatePaymentsSchema,
    BulkReconcileSchema
} from "../schemas/CashBankSchemas.js";

const router = Router();

// Global Transactions (for Sync)
router.get("/", protect, getAllTransactions);

// Account Management
router.get("/accounts", protect, cacheMiddleware(300), getAccounts);
router.post("/accounts", protect, validate(CreateAccountSchema), createAccount);
router.put("/accounts/:id", protect, validate(UpdateAccountSchema), updateAccount);
router.delete("/accounts/:id", protect, deleteAccount);

// Transactions
router.get("/accounts/:id/transactions", protect, getTransactions);
router.post("/transfers", protect, validate(CreateTransferSchema), createTransfer);
router.post("/cash-transactions", protect, validate(CreateCashTransactionSchema), createCashTransaction);

// Cheques
router.get("/cheques", protect, getCheques);
router.post("/cheques", protect, validate(CreateChequeSchema), createCheque);
router.put("/cheques/:id/status", protect, validate(UpdateChequeStatusSchema), updateChequeStatus);

// Reconciliation & Ledger
router.get("/accounts/:id/ledger", protect, getAccountLedger);
router.put("/transactions/:id/reconcile", protect, toggleReconciliation);
router.put("/transactions/bulk-reconcile", protect, validate(BulkReconcileSchema), bulkReconcile);

// Reporting & Analysis
router.get("/summary", protect, cacheMiddleware(300), getBankSummary);
router.get("/position", protect, cacheMiddleware(300), getCashBankPosition);
router.post("/validate-payments", protect, validate(ValidatePaymentsSchema), validatePayments);
router.get("/accounts/:id/effective-balance", protect, getEffectiveBalance);

// Day End Logic
router.get("/day-end/summary", protect, cacheMiddleware(300), getDayEndSummary);
router.post("/day-end/save", protect, saveDayEndToDB);

export default router;
