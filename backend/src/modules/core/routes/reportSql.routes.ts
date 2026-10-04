import { nativeMenuReport } from "../../../integrations/textilesoft/sqlMenuReports.js";
import express from "express";
import { getLegacyMissingSales, getLegacyRcGrn, getLegacyReferenceGrn, getLegacySalesmen, getLegacyNativeCapabilities } from "../controllers/LegacyReportSqlController.js";
import { protect } from "../../../middlewares/authMiddleware.js";
import { sqlRoute } from "../../../integrations/textilesoft/sqlRoute.js";
import { sqlRead } from "../../../integrations/textilesoft/sqlWrite.js";
import {
  getStockReport,
  getDashboardStats,
  getShopSalesReport,
  getShopSalesDayBills,
  getShopSalesIntelligence,
} from "../controllers/ReportSqlController.js";
import {
  getDayBook, getTransactions, getCashFlow, getProfitLoss, getBillProfit, getSalesReportData, getExpenseAnalysis, getReturnsAudit, getCashBank,
} from "../controllers/FinanceReportSqlController.js";
import { getGstr1, getGstr3b, getGstr9, getPurchaseGstRegister } from "../controllers/GstReportController.js";
import {
  getAllParties, getPartyItems, getPartyPnl, getPartyStatement, getPurchaseByParty,
  getPurchaseByPartyGroup, getSalesByParty, getSalesByPartyGroup,
} from "../controllers/PartyReportController.js";

// Reports served from the shop database only. Reports that still need ERP-owned data
// (finance, GST returns, loyalty, returns audit) are added here as they move to SQL.
const router = express.Router();
// Customer summary for the dashboard: how many customers are on file (dbo.newcustomer).
router.get("/customers", protect, sqlRoute(async (_req, res) => {
  const [row] = await sqlRead("SELECT COUNT(*) AS total FROM dbo.[newcustomer]");
  res.json({ success: true, data: { totalCustomers: Number(row?.total ?? 0) }, source: "sql" });
}));
router.get("/legacy/capabilities", protect, getLegacyNativeCapabilities);
router.get("/legacy/missing-sales", protect, getLegacyMissingSales);
router.get("/legacy/rc-grn/:id", protect, getLegacyRcGrn);
router.get("/legacy/ref-grn/:id", protect, getLegacyReferenceGrn);
router.get("/legacy/salesmen", protect, getLegacySalesmen);

router.get('/textilesoft/:report', protect, sqlRoute(async (req,res) => { res.json({ success: true, data: await nativeMenuReport(String(req.params.report), req.query) }); }));
router.get("/stock", protect, getStockReport);
router.get("/dashboard-stats", protect, getDashboardStats);
router.get("/shop-sales", protect, getShopSalesReport);
router.get("/shop-sales/day-bills", protect, getShopSalesDayBills);
router.get("/shop-sales/intelligence", protect, getShopSalesIntelligence);

router.get("/party/purchase-by-party", protect, getPurchaseByParty);
router.get("/party/all-parties", protect, getAllParties);
router.get("/party/sales-by-party", protect, getSalesByParty);
router.get("/party/sales-by-party-group", protect, getSalesByPartyGroup);
router.get("/party/by-item", protect, getPartyItems);
router.get("/party/pnl", protect, getPartyPnl);
router.get("/party/statement", protect, getPartyStatement);
router.get("/party/purchase-by-party-group", protect, getPurchaseByPartyGroup);

// GST return reports (shop database)
router.get("/gst/gstr1", protect, getGstr1);
router.get("/gst/gstr3b", protect, getGstr3b);
router.get("/gst/gstr9", protect, getGstr9);
router.get("/gst/purchase-register", protect, getPurchaseGstRegister);

// Financial reports (shop database)
router.get("/finance/daybook", protect, getDayBook);
router.get("/finance/transactions", protect, getTransactions);
router.get("/finance/cash-flow", protect, getCashFlow);
router.get("/finance/profit-loss", protect, getProfitLoss);
router.get("/finance/bill-profit", protect, getBillProfit);
router.get("/finance/sales", protect, getSalesReportData);
router.get("/finance/expenses", protect, getExpenseAnalysis);
router.get("/finance/cash-bank", protect, getCashBank);

// Returns & Refund Audit (shop database)
router.get("/returns-audit", protect, getReturnsAudit);

export default router;
