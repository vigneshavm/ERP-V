import { Router } from "express";
import { container } from "tsyringe";
import { CashBankController } from "../controllers/CashBankController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = Router();
const cashBankController = container.resolve(CashBankController);

// Account Management
router.get("/accounts", protect, cashBankController.getAccounts);
router.post("/accounts", protect, cashBankController.createAccount);
router.put("/accounts/:id", protect, cashBankController.updateAccount);
router.delete("/accounts/:id", protect, cashBankController.deleteAccount);

// Transactions
router.get("/accounts/:id/transactions", protect, cashBankController.getTransactions);
router.post("/transfers", protect, cashBankController.createTransfer);
router.post("/cash-transactions", protect, cashBankController.createCashTransaction);

// Reconciliation & Ledger
router.get("/accounts/:id/ledger", protect, cashBankController.getLedger);
router.put("/transactions/:id/reconcile", protect, cashBankController.toggleReconciliation);
router.put("/transactions/bulk-reconcile", protect, cashBankController.bulkReconcile);

// Reporting
router.get("/summary", protect, cashBankController.getBankSummary);
router.get("/position", protect, cashBankController.getPosition);
// router.get("/export", protect, cashBankController.exportStatement); // TODO: Implement export if library needed

export default router;
