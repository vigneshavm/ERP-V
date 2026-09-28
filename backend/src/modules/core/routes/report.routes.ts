import express from "express";
import {
  getSalesReport,
  getStockReport,
  getCustomerReport,
  getDashboardStats,
  getShopSalesReport,
  getShopSalesDayBills,
  getShopSalesStatusDebug,
  getShopSalesIntelligence
} from "../controllers/ReportController.js";
import { protect } from "../../../middlewares/authMiddleware.js";
import {
  getBankReconciliation, getBillProfit, getCashBankOverview, getCashFlow, getDayBook, getExpenseAnalysis, getLoansReport, getProfitLoss, getReturnsAudit,
  getSalesReportData, getTransactions, postReconcileMatches,
} from "../controllers/FinanceReportController.js";
import { getLoyaltyReport, getMarketingMetrics, getWhatsAppCampaignsReport } from "../controllers/EngagementReportController.js";
import { getGstr1, getGstr3b, getGstr9, getPurchaseGstRegister } from "../controllers/GstReportController.js";
import { getAllParties, getPartyItems, getPartyPnl, getPartyStatement, getPurchaseByParty, getPurchaseByPartyGroup, getSalesByParty, getSalesByPartyGroup } from "../controllers/PartyReportController.js";

const router = express.Router();

router.get("/sales", protect, getSalesReport);
router.get("/stock", protect, getStockReport);
router.get("/customers", protect, getCustomerReport);
router.get("/dashboard-stats", protect, getDashboardStats);
router.get("/shop-sales", protect, getShopSalesReport);
router.get("/shop-sales/day-bills", protect, getShopSalesDayBills);
router.get("/shop-sales/debug-status", protect, getShopSalesStatusDebug);
router.get("/shop-sales/intelligence", protect, getShopSalesIntelligence);

// Party reports (shop database)
router.get("/party/purchase-by-party", protect, getPurchaseByParty);
router.get("/party/all-parties", protect, getAllParties);
router.get("/party/sales-by-party", protect, getSalesByParty);
router.get("/party/sales-by-party-group", protect, getSalesByPartyGroup);
router.get("/party/by-item", protect, getPartyItems);
router.get("/party/pnl", protect, getPartyPnl);
router.get("/party/statement", protect, getPartyStatement);
router.get("/party/purchase-by-party-group", protect, getPurchaseByPartyGroup);

// GST return reports (shop database + ERP invoices and supplier bills)
router.get("/gst/gstr1", protect, getGstr1);
router.get("/gst/gstr3b", protect, getGstr3b);
router.get("/gst/gstr9", protect, getGstr9);
router.get("/gst/purchase-register", protect, getPurchaseGstRegister);

// Financial reports (shop database + ERP)
router.get("/finance/daybook", protect, getDayBook);
router.get("/finance/transactions", protect, getTransactions);
router.get("/finance/cash-flow", protect, getCashFlow);
router.get("/finance/profit-loss", protect, getProfitLoss);
router.get("/finance/bill-profit", protect, getBillProfit);
router.get("/finance/sales", protect, getSalesReportData);

// Returns & Refund Audit: ERP sales returns by all staff, with risk flags (Billing > Returns)
router.get("/returns-audit", protect, getReturnsAudit);

// Cash & bank (Finance > Overview, Reconciliation, Loans): whole shop, from ERP records + shop cash sales
router.get("/finance/cash-bank-overview", protect, getCashBankOverview);
router.get("/finance/expenses", protect, getExpenseAnalysis);

// Customer engagement (Growth > Loyalty, WhatsApp, Marketing): ERP records only, nothing estimated
router.get("/engagement/loyalty", protect, getLoyaltyReport);
router.get("/engagement/whatsapp-campaigns", protect, getWhatsAppCampaignsReport);
router.get("/engagement/marketing", protect, getMarketingMetrics);
router.get("/finance/loans", protect, getLoansReport);
router.get("/finance/bank-reconciliation", protect, getBankReconciliation);
router.post("/finance/bank-reconciliation/match", protect, postReconcileMatches);

export default router;
