import { textilesoftFeature } from "../../../config/textilesoftMenu";
import React, { Suspense } from "react";
import { Navigate } from "react-router-dom";
import { Ban } from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "../../../redux/store";
import { usePermissions } from "../../../hooks/usePermissions";
import { AppView } from "../../../types/common";
import { LazyModules } from "../../../services/ModuleRegistry";
import EntitlementGuard from "../../shared/Layout/EntitlementGuard";
import SqlSalesReturnsUnavailable from "../../../features/sales/returns/SqlSalesReturnsUnavailable";
import SqlSalesDocumentsUnavailable from "../../../features/sales/SqlSalesDocumentsUnavailable";
import SqlSalesReceivablesUnavailable from "../../../features/sales/SqlSalesReceivablesUnavailable";
import SqlWholesaleUnavailable from "../../../features/wholesale/SqlWholesaleUnavailable";
import SqlInventoryUnavailable from "../../../features/inventory/SqlInventoryUnavailable";
import GrnEntry from "../../../features/purchase/GrnEntry";
import SqlPurchaseUnavailable from "../../../features/purchase/SqlPurchaseUnavailable";
import SqlPartiesUnavailable from "../../../features/customers/SqlPartiesUnavailable";
import SqlFinanceUnavailable from "../../../features/finance/SqlFinanceUnavailable";
import SqlHrUnavailable from "../../../features/employees/SqlHrUnavailable";
import SqlOffersUnavailable from "../../../features/marketing/SqlOffersUnavailable";
import SqlSystemUnavailable from "../../../features/system/SqlSystemUnavailable";
import {
  DashboardSkeleton,
  GridSkeleton,
  TableSkeleton,
  FormSkeleton,
} from "../../core/Feedback/Skeleton";

interface ModuleRendererProps {
  activeTab: string;
}

const ModuleRenderer: React.FC<ModuleRendererProps> = ({ activeTab }) => {
  const { user, role } = useSelector((state: RootState) => state.auth);
  const { checkAccess } = usePermissions();

  // Developer/Owner bypass - full access
  const isBypassUser = user?.email === "avmvignesh0207@gmail.com";

  if (
    !isBypassUser &&
    activeTab !== "BANK_STATEMENT" &&
    !checkAccess(activeTab as AppView)
  ) {
    return (
      <EntitlementGuard
        view={activeTab as AppView}
        moduleName={
          activeTab.split("_")[0].charAt(0) +
          activeTab.split("_")[0].slice(1).toLowerCase()
        }
      >
        <div className="flex flex-col items-center justify-center h-full text-slate-400 animate-in fade-in">
          <Ban className="w-16 h-16 mb-4 text-error/80 opacity-80" />
          <h2 className="text-2xl font-bold text-slate-600 dark:text-slate-300">
            Role Access Denied
          </h2>
          <p className="mt-2 text-sm">
            Your role ({role}) does not have permission to view this specific
            view.
          </p>
        </div>
      </EntitlementGuard>
    );
  }

  const getLoader = () => {
    if (activeTab.includes("DASHBOARD")) return <DashboardSkeleton />;
    if (activeTab.includes("INVENTORY") || activeTab.includes("STOREFRONT"))
      return <GridSkeleton />;
    if (
      activeTab.includes("REGISTER") ||
      activeTab.includes("HISTORY") ||
      activeTab.includes("LEDGER") ||
      activeTab.includes("LIST")
    )
      return <TableSkeleton />;
    if (
      activeTab.includes("ENTRY") ||
      activeTab.includes("FORM") ||
      activeTab.includes("CREATOR")
    )
      return <FormSkeleton />;
    return <DashboardSkeleton />; // Fallback Default
  };

  return (
    <Suspense
      fallback={
        <div className="p-4 animate-in fade-in duration-500">{getLoader()}</div>
      }
    >
      {(() => {
        const native = textilesoftFeature(activeTab);
        if (native) {
          if (native.section === 'Purchase') return <LazyModules.TextilesoftPurchaseScreen featureId={native.id} />;
          if (native.section === 'Report') return <LazyModules.TextilesoftReportScreen featureId={native.id} />;
          if (native.section === 'Master') return <LazyModules.MasterDataManager key={native.id} initialType={native.title === 'New Expense Group' ? 'EXPENSE_GROUP' : 'EXPENSE_NAME'} allowedTypes={['EXPENSE_GROUP','EXPENSE_NAME']} />;
          return <LazyModules.DataBackup />;
        }
        switch (activeTab) {
          // === DASHBOARD ===
          case "PROFIT_PULSE":
          case "DASHBOARD_SNAPSHOT":
          case "DASHBOARD":
            return <LazyModules.Dashboard />;
          case "DASHBOARD_OVERVIEW":
            return <LazyModules.Dashboard />;
          case "DASHBOARD_SUMMARY":
            return <LazyModules.FinanceAgentDashboard />; // Today's Summary

          // Sales
          case "SALES":
          case "SALES_REGISTER":
            return <LazyModules.Sales />;
          case "SALES_INVOICE":
            return <LazyModules.SalesInvoiceRegister />;
          case "ESTIMATE":
            return <SqlSalesDocumentsUnavailable />;
          case "SALES_ORDER":
            return <SqlSalesDocumentsUnavailable />;
          case "DELIVERY_CHALLAN":
            return <SqlSalesDocumentsUnavailable />;
          case "SALES_RETURN":
            return <SqlSalesReturnsUnavailable />;
          case "PAYMENT_IN":
            return <SqlSalesReceivablesUnavailable />;
          case "PAYMENT_IN_LIST":
            return <SqlSalesReceivablesUnavailable />;
          case "CHALLAN_LIST":
            return <SqlSalesDocumentsUnavailable />;
          case "INVOICE_REGISTER":
            return <LazyModules.SalesInvoiceRegister />;
          case "ORDER_REGISTER":
            return <SqlSalesDocumentsUnavailable />;
          case "RETURNED_ITEMS":
            return <SqlSalesReturnsUnavailable />;
          case "CUSTOMER_CREDITS":
            return <SqlSalesReceivablesUnavailable />;
          case "OUTSTANDING_DUES":
            return <SqlSalesReceivablesUnavailable />;
          case "MRP_PENDING_INVOICES":
            return <SqlSalesReceivablesUnavailable />;

          // Purchase
          case "PURCHASE":
            return <SqlPurchaseUnavailable />;
          case "PURCHASE_REGISTER":
            return <LazyModules.PurchaseRegister />;
          case "PURCHASE_ENTRY":
            return <GrnEntry />;
          case "PURCHASE_EXPRESS":
          case "PURCHASE_ORDER":
          case "PURCHASE_ORDER_DETAILS":
          case "PURCHASE_ORDER_FORM":
          case "PURCHASE_ORDER_LIST":
          case "GOODS_RECEIVED":
          case "GRN_FORM":
          case "GRN_TRANSFER":
          case "DEBIT_NOTES":
          case "SUPPLIER_PAYMENTS":
          case "PAYMENT_OUT":
          case "PURCHASE_PAYMENT_OUT":
          case "OUTSTANDING_PAYABLES":
          case "PURCHASE_BILLS":
          case "BILL_FORM":
          case "PURCHASE_UPLOAD":
          case "SUPPLIER_AGEING":
          case "VENDOR_INFLOW_OUTFLOW":
            return <SqlPurchaseUnavailable />;
          case "VENDORS":
          case "SUPPLIER_LIST":
            return <LazyModules.VendorManager />;
          case "VENDOR_DETAILS":
            return <LazyModules.VendorDetails />;
          case "VENDOR_FORM":
            return <LazyModules.VendorForm />;
          case "PURCHASE_HISTORY":
            return <LazyModules.PurchaseRegister />;
          case "PURCHASE_RETURN":
            return <SqlPurchaseUnavailable />;
          case "PURCHASE_RETURNS":
            return <LazyModules.PurchaseReturns />;
          case "PURCHASE_RETURN_FORM":
            return <SqlPurchaseUnavailable />;

          // Wholesale/Retail (WR) Billing
          case "WR_COUNTER":
            return <SqlWholesaleUnavailable />;
          case "WR_SALES_ENTRY":
            return <SqlWholesaleUnavailable />;
          case "WR_PURCHASE_ENTRY":
            return <LazyModules.WRPurchaseEntry />;
          case "WR_SALES_BILL_VIEW":
            return <SqlWholesaleUnavailable />;
          case "WR_PURCHASE_BILL_VIEW":
            return <LazyModules.WRPurchaseBillView />;
          case "WR_SALES_REPORT":
            return <SqlWholesaleUnavailable />;
          case "WR_STOCK_REPORT":
            return <SqlWholesaleUnavailable />;

          // Customers
          case "CUSTOMER_LIST":
            return <LazyModules.CustomerList />;
          case "CUSTOMER_LEDGER":
          case "CUSTOMER_STATEMENTS":
          case "CUSTOMER_GROUPS":
          case "LOYALTY_POINTS":
          case "ADD_CUSTOMER":
          case "CUSTOMER_DETAIL":
          case "CUSTOMERS_PORTFOLIO":
            return <SqlPartiesUnavailable />;
          case "CUSTOMERS_WITH_DUES":
            return <SqlSalesReceivablesUnavailable />;
          case "EDIT_CUSTOMER":
            return <SqlPartiesUnavailable />;

          // Suppliers
          case "SUPPLIER_LEDGER":
          case "SUPPLIER_STATEMENTS":
          case "SUPPLIER_GROUPS":
            return <SqlPartiesUnavailable />;
          case "AGENTS":
            return <LazyModules.Agents />;

          // Inventory
          case "INVENTORY":
          case "INVENTORY_SEARCH":
          case "INVENTORY_ITEMS":
            return <LazyModules.InventoryVariantSearch />;
          case "AGED_STOCK":
            return <LazyModules.AgedStockManager />;
          case "ITEM_CATEGORIES":
            return <LazyModules.CategoriesSql />;
          case "PRODUCT_MASTER":
            return <LazyModules.ProductMaster />;
          case "STOCK_SUMMARY":
            return <LazyModules.StockSummary />;
          case "STOCK_MOVEMENT":
            return <LazyModules.StockMovement />;
          case "LOW_STOCK_ALERTS":
            return <LazyModules.LowStockAlerts />;
          case "STOCK_WRITEOFF":
            return <SqlInventoryUnavailable />;
          case "STOCK_TRANSFER":
            return <SqlInventoryUnavailable />;
          case "UNITS_HSN":
            return <LazyModules.UnitsHSNAgent />;
          case "WAREHOUSES":
            return <LazyModules.WarehouseIntelligence />;
          case "BATCH_EXPIRY":
            return <SqlInventoryUnavailable />;
          case "COMBO_OFFERS":
            return <SqlOffersUnavailable />;
          case "SERIALIZED_UNITS":
            return <SqlInventoryUnavailable />;

          // Finance
          case "REPRINT_QUEUE":
            return <LazyModules.ReprintQueue />;
          case "FINANCE_AGENTS":
          case "FINANCE":
          case "CASH_ACCOUNTS":
          case "BANK_ACCOUNTS":
          case "BANK_SUMMARY":
          case "BANK_RECONCILIATION":
          case "FUND_TRANSFERS":
          case "PETTY_CASH":
          case "BANK_STATEMENT":
          case "SMS_TRACKER":
          case "BUDGET_TRACKER":
          case "LOAN_ACCOUNTS":
          case "FINANCIAL_GOALS":
          case "JOURNAL_ENTRIES":
          case "JOURNAL_ENTRY_FORM":
          case "ACCOUNT_LEDGER":
          case "EMI_PLANS":
          case "CARD_TERMINALS":
            return <SqlFinanceUnavailable />;

          // POS
          case "POS":
            return <LazyModules.POSModule />;
          case "POS_ORDERS":
            return <LazyModules.POSOrdersIntelligence />;
          case "POS_RETURNS":
            return <LazyModules.POSReturnsIntelligence />;
          case "SHIFT_MANAGEMENT":
            return <LazyModules.ShiftManagementIntelligence />;
          case "CASH_DRAWER":
            return <LazyModules.CashDrawerIntelligence />;

          // Expenses
          case "EXPENSES":
          case "EXPENSE_ANALYTICS":
          case "EXPENSE_CATEGORIES":
          case "RECURRING_EXPENSES":
          case "EXPENSE_REPORTS":
            return <SqlFinanceUnavailable />;

          // Reports
          case "REPORTS":
          case "REPORT_SALES":
          case "REPORT_SALES_INVENTORY_ANALYSIS":
            return <LazyModules.Reports />;
          case "REPORT_PURCHASE":
            return <LazyModules.Reports />;
          case "REPORT_INVENTORY":
            return <LazyModules.Reports />;
          case "REPORT_CUSTOMER":
            return <LazyModules.Reports />;
          case "REPORT_SUPPLIER":
            return <LazyModules.Reports />;
          case "REPORT_TAX":
            return <LazyModules.Reports />;
          case "REPORT_FINANCIAL":
            return <LazyModules.Reports />;
          case "DAY_BOOK":
            return <LazyModules.Reports />;
          case "TRIAL_BALANCE":
            return <LazyModules.Reports />;
          case "PROFIT_LOSS":
            return <LazyModules.Reports />;
          case "BALANCE_SHEET":
            return <LazyModules.Reports />;
          case "CASH_FLOW":
            return <LazyModules.Reports />;

          // Utilities
          case "BARCODE_GENERATOR":
            return <LazyModules.BarcodeManager />;
          case "LABEL_PRINTING":
          case "BULK_IMPORT":
          case "DATA_EXPORT":
          case "NUMBER_SERIES":
            return activeTab === "BULK_IMPORT" || activeTab === "DATA_EXPORT"
              ? <SqlInventoryUnavailable />
              : <LazyModules.Data />;
          case "AUDIT_LOGS":
            return <SqlSystemUnavailable />;
          case "MASTER_DATA":
            return <SqlSystemUnavailable />;
          case "DISCOUNT_PERMISSIONS":
            return <LazyModules.DiscountPermissions />;

          // Settings
          case "SETTINGS":
            return <SqlSystemUnavailable />;
          // Settings sub-pages live at /settings/:tab (Settings.tsx reads useParams().tab).
          // These used to go to "/?tab=GENERAL" etc., which set activeTab to an unknown key.
          case "BUSINESS_PROFILE":
            return <Navigate to="/settings/general" replace />;
          case "TAX_CONFIGURATION":
            return <Navigate to="/settings/finance" replace />;
          case "INVOICE_SETTINGS":
            return <Navigate to="/settings/mis" replace />;
          case "USERS_ROLES":
            return <Navigate to="/settings/security" replace />;
          case "BRANCH_SETTINGS":
            return <Navigate to="/settings/branches" replace />;
          case "FINANCIAL_YEAR":
            return <Navigate to="/settings/finance" replace />;
          case "INTEGRATIONS":
            return <Navigate to="/settings/integrations" replace />;
          // System › Sync (/settings/sync) and Restore had no case and fell through to the Dashboard.
          case "SYNC_SHARE":
          case "RESTORE":
          case "BACKUP_RESTORE":
            // SQL Server backup restore + "Apply ERP Database Access" (SqlRestoreManager, owner/co-owner only on the server).
            return <LazyModules.Sync />;
          case "THEMES_BRANDING":
            return <Navigate to="/settings/branding" replace />;

          // HR
          case "LABOR":
          case "STAFF":
          case "EMPLOYEES":
            return <LazyModules.StaffManager />;
          case "ALLOWANCE_MANAGER":
          case "ATTENDANCE":
          case "PAYROLL":
          case "PAYROLL_RUNS":
          case "SALARY_STRUCTURE":
          case "PAYSLIP":
          case "ADVANCES":
          case "COMMISSION":
            return <SqlHrUnavailable />;
          case "DAILY":
            return <LazyModules.DailyFinanceTracker />;
          case "STOREFRONT":
            return <SqlOffersUnavailable />;

          // Architecture & Admin
          case "TENANT_ARCHITECT":
          case "ARCHITECTURE":
            return <LazyModules.Architecture />;
          case "TENANT_MANAGEMENT":
            return <SqlSystemUnavailable />;
          case "SUPER_ADMIN_CONSOLE":
          case "SUPER_ADMIN":
            return <SqlSystemUnavailable />;

          // Grow Platform
          case "GROW_DASHBOARD":
          case "GROW_OVERVIEW":
            return <LazyModules.GrowDashboard />;

          case "GROW_GOOGLE":
          case "GROW_GOOGLE_PROFILE":
          case "GROW_GOOGLE_REVIEWS":
          case "GROW_GOOGLE_POSTS":
          case "GROW_GOOGLE_INSIGHTS":
          case "GROW_GOOGLE_PHOTOS":
            return <SqlOffersUnavailable />;
          case "GROW_MARKETING_METRICS":
            return <SqlOffersUnavailable />;
          case "GROW_PERFORMANCE":
            return <SqlOffersUnavailable />;
          case "GROW_HUB":
            return <SqlOffersUnavailable />;

          case "GROW_STORE":
          case "GROW_STORE_SETUP":
          case "GROW_PRODUCT_SYNC":
          case "GROW_STORE_ORDERS":
          case "GROW_STORE_CUSTOMERS":
          case "GROW_STORE_PAYMENTS":
          case "GROW_STORE_THEMES":
          case "GROW_STORE_DOMAIN":
          case "GROW_STORE_SHIPPING":
            return <SqlOffersUnavailable />;

          case "GROW_MARKETING":
          case "GROW_MARKETING_CAMPAIGNS":
          case "GROW_MARKETING_TEMPLATES":
          case "GROW_MARKETING_EMAIL":
          case "GROW_MARKETING_WHATSAPP":
          case "GROW_MARKETING_SOCIAL":
          case "GROW_MARKETING_TOOLS":
          case "GROW_MARKETING_COUPONS":
          case "GROW_MARKETING_OFFERS":
          case "GROW_ENGAGEMENT":
          case "GROW_ENGAGEMENT_SMS":
          case "GROW_ENGAGEMENT_WHATSAPP":
          case "GROW_ENGAGEMENT_EMAIL":
          case "GROW_ENGAGEMENT_LOYALTY":
          case "GROW_ENGAGEMENT_FEEDBACK":
            return <SqlOffersUnavailable />;

          case "GROW_SYNC_DEVICE":
            return <LazyModules.DeviceIntelligence />;
          case "GROW_SYNC":
          case "GROW_SYNC_CLOUD":
          case "GROW_BACKUP":
          case "GROW_RESTORE_DATA":
          case "GROW_SYNC_LOGS":
            return <LazyModules.Sync />;

          case "GROW_DATA":
          case "GROW_DATA_IMPORT":
          case "GROW_DATA_EXPORT":
          case "GROW_DATA_CLEANUP":
          case "GROW_DATA_DUPLICATES":
          case "GROW_DATA_HEALTH":
            return <LazyModules.Data />;

          case "GROW_REPORTS":
          case "GROW_REPORT_SALES":
          case "GROW_REPORT_ROI":
          case "GROW_REPORT_CUSTOMER":
          case "GROW_REPORT_TRAFFIC":
          case "GROW_REPORT_CONVERSION":
            return <LazyModules.GrowReports />;

          // Fallback
          default:
            return <LazyModules.Dashboard />;
        }
      })()}
    </Suspense>
  );
};

export default ModuleRenderer;
