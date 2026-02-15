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

const router = Router();

// Global Transactions (for Sync)
router.get("/", protect, getAllTransactions);

// Account Management
router.get("/accounts", protect, getAccounts);
router.post("/accounts", protect, createAccount);
router.put("/accounts/:id", protect, updateAccount);
router.delete("/accounts/:id", protect, deleteAccount);

// Transactions
router.get("/accounts/:id/transactions", protect, getTransactions);
router.post("/transfers", protect, createTransfer);
router.post("/cash-transactions", protect, createCashTransaction);

// Cheques
router.get("/cheques", protect, getCheques);
router.post("/cheques", protect, createCheque);
router.put("/cheques/:id/status", protect, updateChequeStatus);

// Reconciliation & Ledger
router.get("/accounts/:id/ledger", protect, getAccountLedger);
router.put("/transactions/:id/reconcile", protect, toggleReconciliation);
router.put("/transactions/bulk-reconcile", protect, bulkReconcile);

// Reporting & Analysis
router.get("/summary", protect, getBankSummary);
router.get("/position", protect, getCashBankPosition);
router.post("/validate-payments", protect, validatePayments);
router.get("/accounts/:id/effective-balance", protect, getEffectiveBalance);

// Day End Logic
router.get("/day-end/summary", protect, getDayEndSummary);
router.post("/day-end/save", protect, saveDayEndToDB);

export default router;
