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
    getAllTransactions
} from "../controllers/CashBankController.js";
import { protect } from '@smarterp/shared/middlewares/authMiddleware.js';
import { validate } from '@smarterp/shared/middlewares/validate.js';
import { cacheMiddleware } from '@smarterp/shared/config/cache.js';
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
// PATCH /cheques/:id replaces PUT /cheques/:id/status — status is a partial field update.
router.patch("/cheques/:id", protect, validate(UpdateChequeStatusSchema), updateChequeStatus);

// Reconciliation & Ledger
router.get("/accounts/:id/ledger", protect, getAccountLedger);
// PATCH /transactions/:id replaces PUT /transactions/:id/reconcile — single field toggle.
router.patch("/transactions/:id", protect, toggleReconciliation);
// PATCH /transactions/bulk replaces PUT /transactions/bulk-reconcile.
router.patch("/transactions/bulk", protect, validate(BulkReconcileSchema), bulkReconcile);

// Payment Validation
// POST /payment-validations replaces POST /validate-payments — noun resource name.
router.post("/payment-validations", protect, validate(ValidatePaymentsSchema), validatePayments);

// Reporting & Analysis
router.get("/summary", protect, cacheMiddleware(300), getBankSummary);
router.get("/position", protect, cacheMiddleware(300), getCashBankPosition);
router.get("/accounts/:id/effective-balance", protect, getEffectiveBalance);

// Day End Logic
router.get("/day-end/summary", protect, cacheMiddleware(300), getDayEndSummary);
router.post("/day-end/save", protect, saveDayEndToDB);

export default router;
