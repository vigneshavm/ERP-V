import React, { Suspense } from 'react';
import { Navigate } from 'react-router-dom';
import { Ban } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../redux/store';
import { usePermissions } from '../../../hooks/usePermissions';
import { AppView } from '../../../types/common';
import { LazyModules } from '../../../services/ModuleRegistry';
import EntitlementGuard from '../../shared/Layout/EntitlementGuard';
import {
    DashboardSkeleton,
    GridSkeleton,
    TableSkeleton,
    FormSkeleton
} from '../../core/Feedback/Skeleton';

interface ModuleRendererProps {
    activeTab: string;
}

const ModuleRenderer: React.FC<ModuleRendererProps> = ({ activeTab }) => {
    const { user, role } = useSelector((state: RootState) => state.auth);
    const { checkAccess } = usePermissions();

    // Developer/Owner bypass - full access
    const isBypassUser = user?.email === 'avmvignesh0207@gmail.com';

    if (!isBypassUser && activeTab !== 'BANK_STATEMENT' && !checkAccess(activeTab as AppView)) {
        return (
            <EntitlementGuard
                view={activeTab as AppView}
                moduleName={activeTab.split('_')[0].charAt(0) + activeTab.split('_')[0].slice(1).toLowerCase()}
            >
                <div className="flex flex-col items-center justify-center h-full text-neutral-400 animate-in fade-in">
                    <Ban className="w-16 h-16 mb-4 text-error/80 opacity-80" />
                    <h2 className="text-2xl font-bold text-neutral-600 dark:text-neutral-300">Role Access Denied</h2>
                    <p className="mt-2 text-sm">Your role ({role}) does not have permission to view this specific view.</p>
                </div>
            </EntitlementGuard>
        );
    }

    const getLoader = () => {
        if (activeTab.includes('DASHBOARD')) return <DashboardSkeleton />;
        if (activeTab.includes('INVENTORY') || activeTab.includes('STOREFRONT')) return <GridSkeleton />;
        if (activeTab.includes('REGISTER') || activeTab.includes('HISTORY') || activeTab.includes('LEDGER') || activeTab.includes('LIST')) return <TableSkeleton />;
        if (activeTab.includes('ENTRY') || activeTab.includes('FORM') || activeTab.includes('CREATOR')) return <FormSkeleton />;
        return <DashboardSkeleton />; // Fallback Default
    };

    return (
        <Suspense fallback={<div className="p-4 animate-in fade-in duration-500">{getLoader()}</div>}>
            {(() => {
                switch (activeTab) {
                    // === DASHBOARD ===
                    case 'PROFIT_PULSE':
                    case 'DASHBOARD_SNAPSHOT':
                    case 'DASHBOARD': return <LazyModules.Dashboard />;
                    case 'DASHBOARD_OVERVIEW': return <LazyModules.Dashboard />;
                    case 'DASHBOARD_SUMMARY': return <LazyModules.DailyFinanceTracker />; // Today's Summary

                    // Sales
                    case 'SALES':
                    case 'SALES_REGISTER': return <LazyModules.Sales />;
                    case 'SALES_INVOICE': return <LazyModules.SalesInvoiceRegister />;
                    case 'ESTIMATE': return <LazyModules.EstimateCreator />;
                    case 'SALES_ORDER': return <LazyModules.SalesOrderCreator />;
                    case 'DELIVERY_CHALLAN': return <LazyModules.DeliveryChallanCreator />;
                    case 'SALES_RETURN': return <LazyModules.SalesReturn />;
                    case 'PAYMENT_IN': return <LazyModules.PaymentInCreator />;
                    case 'PAYMENT_IN_LIST': return <LazyModules.PaymentInList />;
                    case 'CHALLAN_LIST': return <LazyModules.SalesModulePlaceholder />;
                    case 'INVOICE_REGISTER': return <LazyModules.SalesModulePlaceholder />;
                    case 'ORDER_REGISTER': return <LazyModules.SalesModulePlaceholder />;
                    case 'RETURNED_ITEMS': return <LazyModules.ReturnedItemsManager />;
                    case 'CUSTOMER_CREDITS': return <LazyModules.CustomerCredits />;
                    case 'OUTSTANDING_DUES': return <LazyModules.OutstandingDues />;
                    case 'MRP_PENDING_INVOICES': return <LazyModules.MrpPendingInvoices />;

                    // Purchase
                    case 'PURCHASE': return <LazyModules.Purchase />; 
                    case 'PURCHASE_REGISTER': return <LazyModules.PurchaseRegister />;
                    case 'PURCHASE_ENTRY': return <LazyModules.PurchaseEntry />;
                    case 'PURCHASE_ORDER': return <LazyModules.PurchaseOrdersModule />;
                    case 'VENDORS': 
                    case 'SUPPLIER_LIST': return <LazyModules.VendorManager />;
                    case 'VENDOR_DETAILS': return <LazyModules.VendorDetails />;
                    case 'VENDOR_FORM': return <LazyModules.VendorForm />;
                    case 'GOODS_RECEIVED': return <LazyModules.GoodsReceived />;
                    case 'GRN_TRANSFER': return <LazyModules.GRNTransfer />;
                    case 'GRN_FORM': return <LazyModules.GRNForm />;
                    case 'DEBIT_NOTES': return <LazyModules.DebitNotes />;
                    case 'SUPPLIER_PAYMENTS': return <LazyModules.SupplierPayments />;
                    case 'PAYMENT_OUT':
                    case 'PURCHASE_PAYMENT_OUT': return <LazyModules.PaymentOut />;
                    case 'OUTSTANDING_PAYABLES': return <LazyModules.OutstandingPayables />;
                    case 'PURCHASE_BILLS': return <LazyModules.Bills />;
                    case 'BILL_FORM': return <LazyModules.BillForm />;
                    case 'PURCHASE_HISTORY': return <LazyModules.PurchaseHistory />;
                    case 'PURCHASE_ORDER_DETAILS': return <LazyModules.PurchaseOrderDetails />;
                    case 'PURCHASE_ORDER_FORM': return <LazyModules.PurchaseOrdersModule />;
                    case 'PURCHASE_ORDER_LIST': return <LazyModules.PurchaseOrdersModule />;
                    case 'PURCHASE_RETURN': return <LazyModules.PurchaseReturnModule />;
                    case 'PURCHASE_RETURNS': return <LazyModules.PurchaseReturns />;
                    case 'PURCHASE_RETURN_FORM': return <LazyModules.PurchaseReturnForm />;
                    case 'PURCHASE_UPLOAD': return <LazyModules.PurchaseUpload />;
                    case 'SUPPLIER_AGEING': return <LazyModules.SupplierAgeing />;
                    case 'VENDOR_INFLOW_OUTFLOW': return <LazyModules.VendorInflowOutflow />;

                    // Wholesale/Retail (WR) Billing
                    case 'WR_COUNTER': return <LazyModules.WRCounter />;
                    case 'WR_SALES_ENTRY': return <LazyModules.WRSalesEntry />;
                    case 'WR_PURCHASE_ENTRY': return <LazyModules.WRPurchaseEntry />;
                    case 'WR_SALES_BILL_VIEW': return <LazyModules.WRSalesBillView />;
                    case 'WR_PURCHASE_BILL_VIEW': return <LazyModules.WRPurchaseBillView />;
                    case 'WR_SALES_REPORT': return <LazyModules.WRSalesReport />;
                    case 'WR_STOCK_REPORT': return <LazyModules.WRStockReport />;

                    // Customers
                    case 'CUSTOMER_LIST': return <LazyModules.CustomerList />;
                    case 'CUSTOMER_LEDGER': return <LazyModules.CustomerLedger />;
                    case 'CUSTOMER_STATEMENTS': return <LazyModules.CustomerStatements />;
                    case 'CUSTOMER_GROUPS': return <LazyModules.CustomerGroups />;
                    case 'LOYALTY_POINTS': return <LazyModules.LoyaltyPoints />;
                    case 'ADD_CUSTOMER': return <LazyModules.AddCustomer />;
                    case 'CUSTOMER_DETAIL': return <LazyModules.CustomerDetail />;
                    case 'CUSTOMERS_PORTFOLIO': return <LazyModules.CustomersPortfolio />;
                    case 'CUSTOMERS_WITH_DUES': return <LazyModules.CustomersWithDues />;
                    case 'EDIT_CUSTOMER': return <LazyModules.EditCustomer />;

                    // Suppliers
                    case 'SUPPLIER_LEDGER': return <LazyModules.SupplierLedger />;
                    case 'SUPPLIER_STATEMENTS': return <LazyModules.SupplierStatements />;
                    case 'SUPPLIER_GROUPS': return <LazyModules.SupplierGroups />;
                    case 'AGENTS': return <LazyModules.Agents />;

                    // Inventory
                    case 'INVENTORY': return <LazyModules.Inventory />;
                    case 'INVENTORY_ITEMS': return <LazyModules.Inventory />; 
                    case 'AGED_STOCK': return <LazyModules.AgedStockManager />;
                    case 'ITEM_CATEGORIES': return <LazyModules.ItemCategories />;
                    case 'STOCK_SUMMARY': return <LazyModules.StockSummary />;
                    case 'STOCK_MOVEMENT': return <LazyModules.StockMovement />;
                    case 'LOW_STOCK_ALERTS': return <LazyModules.LowStockAlerts />;
                    case 'STOCK_WRITEOFF': return <LazyModules.StockWriteOff />;
                    case 'STOCK_TRANSFER': return <LazyModules.StockTransfer />;
                    case 'UNITS_HSN': return <LazyModules.UnitsHSNAgent />;
                    case 'WAREHOUSES': return <LazyModules.WarehouseIntelligence />;
                    case 'BATCH_EXPIRY': return <LazyModules.BatchExpiryIntelligence />;
                    case 'COMBO_OFFERS': return <LazyModules.ComboOffers />;
                    case 'SERIALIZED_UNITS': return <LazyModules.SerializedUnits />;

                    // Finance
                    case 'FINANCE_AGENTS': return <LazyModules.FinanceAgentDashboard />;
                    case 'FINANCE': return <LazyModules.Finance />;
                    case 'CASH_ACCOUNTS': return <LazyModules.CashBankIntelligence />;
                    case 'BANK_ACCOUNTS': return <LazyModules.BankIntelligence />;
                    case 'BANK_SUMMARY': return <LazyModules.BankSummary />;
                    case 'BANK_RECONCILIATION': return <LazyModules.BankReconciliationIntelligence />;
                    case 'FUND_TRANSFERS': return <LazyModules.FundTransferIntelligence />;
                    case 'PETTY_CASH': return <LazyModules.PettyCashIntelligence />;
                    case 'BANK_STATEMENT': return <LazyModules.BankStatementView />;
                    case 'SMS_TRACKER': return <LazyModules.SmsTrackerPage />;
                    case 'BUDGET_TRACKER': return <LazyModules.BudgetTrackerPage />;
                    case 'LOAN_ACCOUNTS': return <LazyModules.LoanAccounts />;
                    case 'FINANCIAL_GOALS': return <LazyModules.FinancialGoals />;
                    case 'JOURNAL_ENTRIES': return <LazyModules.JournalEntries />;
                    case 'JOURNAL_ENTRY_FORM': return <LazyModules.JournalEntryForm />;
                    case 'ACCOUNT_LEDGER': return <LazyModules.AccountLedger />;
                    case 'EMI_PLANS': return <LazyModules.EMIPlans />;
                    case 'CARD_TERMINALS': return <LazyModules.CardTerminals />;

                    // POS
                    case 'POS': return <LazyModules.POSModule />;
                    case 'POS_ORDERS': return <LazyModules.POSOrdersIntelligence />;
                    case 'POS_RETURNS': return <LazyModules.POSReturnsIntelligence />;
                    case 'SHIFT_MANAGEMENT': return <LazyModules.ShiftManagementIntelligence />;
                    case 'CASH_DRAWER': return <LazyModules.CashDrawerIntelligence />;

                    // Expenses
                    case 'EXPENSES': return <LazyModules.ExpensesModuleFeature />;
                    case 'EXPENSE_ANALYTICS': return <LazyModules.ExpenseIntelligence />;
                    case 'EXPENSE_CATEGORIES': return <LazyModules.ExpenseCategoriesManager />;
                    case 'RECURRING_EXPENSES': return <LazyModules.RecurringExpensesIntelligence />;
                    case 'EXPENSE_REPORTS': return <LazyModules.ExpenseReportsIntelligence />;

                    // Reports
                    case 'REPORTS':
                    case 'REPORT_SALES': return <LazyModules.Reports />;
                    case 'REPORT_PURCHASE': return <LazyModules.Reports />;
                    case 'REPORT_INVENTORY': return <LazyModules.Reports />;
                    case 'REPORT_CUSTOMER': return <LazyModules.Reports />;
                    case 'REPORT_SUPPLIER': return <LazyModules.Reports />;
                    case 'REPORT_TAX': return <LazyModules.Reports />;
                    case 'REPORT_FINANCIAL': return <LazyModules.Reports />;
                    case 'DAY_BOOK': return <LazyModules.Reports />;
                    case 'TRIAL_BALANCE': return <LazyModules.Reports />;
                    case 'PROFIT_LOSS': return <LazyModules.Reports />;
                    case 'BALANCE_SHEET': return <LazyModules.Reports />;
                    case 'CASH_FLOW': return <LazyModules.Reports />;


                    // Utilities
                    case 'BARCODE_GENERATOR':
                    case 'LABEL_PRINTING':
                    case 'BULK_IMPORT':
                    case 'DATA_EXPORT':
                    case 'NUMBER_SERIES': return <LazyModules.Data />;
                    case 'AUDIT_LOGS': return <LazyModules.AuditLogs />;
                    case 'MASTER_DATA': return <LazyModules.MasterDataManager />;
                    case 'DISCOUNT_PERMISSIONS': return <LazyModules.DiscountPermissions />;

                    // Settings
                    case 'SETTINGS': return <LazyModules.Settings />;
                    case 'BUSINESS_PROFILE': return <Navigate to="/?tab=GENERAL" replace />;
                    case 'TAX_CONFIGURATION': return <Navigate to="/?tab=FINANCE" replace />;
                    case 'INVOICE_SETTINGS': return <Navigate to="/?tab=MIS" replace />;
                    case 'USERS_ROLES': return <Navigate to="/?tab=SECURITY" replace />;
                    case 'BRANCH_SETTINGS': return <Navigate to="/?tab=BRANCHES" replace />;
                    case 'FINANCIAL_YEAR': return <Navigate to="/?tab=FINANCE" replace />;
                    case 'INTEGRATIONS': return <Navigate to="/?tab=INTEGRATIONS" replace />;
                    case 'BACKUP_RESTORE': return <LazyModules.Sync />;
                    case 'THEMES_BRANDING': return <Navigate to="/?tab=BRANDING" replace />;

                    // HR
                    case 'LABOR': return <LazyModules.LaborManager />;
                    case 'ALLOWANCE_MANAGER': return <LazyModules.AllowanceManager />;
                    case 'DAILY': return <LazyModules.DailyFinanceTracker />;
                    case 'STOREFRONT': return <LazyModules.Storefront />;

                    // Architecture & Admin
                    case 'ARCHITECTURE': return <LazyModules.Architecture />;
                    case 'TENANT_MANAGEMENT': return <LazyModules.TenantManagement />;
                    case 'SUPER_ADMIN': return <LazyModules.SuperAdminGrowthConsole />;

                    // Grow Platform
                    case 'GROW_DASHBOARD':
                    case 'GROW_OVERVIEW': return <LazyModules.GrowDashboard />;


                    case 'GROW_GOOGLE':
                    case 'GROW_GOOGLE_PROFILE':
                    case 'GROW_GOOGLE_REVIEWS':
                    case 'GROW_GOOGLE_POSTS':
                    case 'GROW_GOOGLE_INSIGHTS':
                    case 'GROW_GOOGLE_PHOTOS': return <LazyModules.GoogleBusiness />;
                    case 'GROW_MARKETING_METRICS': return <LazyModules.MarketingMetrics />;
                    case 'GROW_PERFORMANCE': return <LazyModules.OnlinePerformance />;
                    case 'GROW_HUB': return <LazyModules.GrowthHub />;

                    case 'GROW_STORE':
                    case 'GROW_STORE_SETUP':
                    case 'GROW_PRODUCT_SYNC':
                    case 'GROW_STORE_ORDERS':
                    case 'GROW_STORE_CUSTOMERS':
                    case 'GROW_STORE_PAYMENTS':
                    case 'GROW_STORE_THEMES':
                    case 'GROW_STORE_DOMAIN':
                    case 'GROW_STORE_SHIPPING': return <LazyModules.OnlineStore />;

                    case 'GROW_MARKETING':
                    case 'GROW_MARKETING_CAMPAIGNS': return <LazyModules.MarketingCampaigns />;
                    case 'GROW_MARKETING_TEMPLATES': return <LazyModules.MarketingTemplates />;
                    case 'GROW_MARKETING_EMAIL': return <LazyModules.EmailMarketing />;
                    case 'GROW_MARKETING_WHATSAPP': return <LazyModules.WhatsAppMarketing />;
                    case 'GROW_MARKETING_SOCIAL': return <LazyModules.SocialMediaMarketing />;
                    case 'GROW_MARKETING_TOOLS': return <LazyModules.MarketingTools />;
                    case 'GROW_MARKETING_COUPONS': return <LazyModules.MarketingCoupons />;
                    case 'GROW_MARKETING_OFFERS': return <LazyModules.MarketingOffers />;
                    case 'GROW_ENGAGEMENT': return <LazyModules.WhatsAppEngagement />; 
                    case 'GROW_ENGAGEMENT_SMS': return <LazyModules.SMSMarketing />;
                    case 'GROW_ENGAGEMENT_WHATSAPP': return <LazyModules.WhatsAppEngagement />;
                    case 'GROW_ENGAGEMENT_EMAIL': return <LazyModules.EmailEngagement />;
                    case 'GROW_ENGAGEMENT_LOYALTY': return <LazyModules.LoyaltyEngagement />;
                    case 'GROW_ENGAGEMENT_FEEDBACK': return <LazyModules.FeedbackEngagement />;

                    case 'GROW_SYNC_DEVICE': return <LazyModules.DeviceIntelligence />;
                    case 'GROW_SYNC':
                    case 'GROW_SYNC_CLOUD':
                    case 'GROW_BACKUP':
                    case 'GROW_RESTORE_DATA':
                    case 'GROW_SYNC_LOGS': return <LazyModules.Sync />;

                    case 'GROW_DATA':
                    case 'GROW_DATA_IMPORT':
                    case 'GROW_DATA_EXPORT':
                    case 'GROW_DATA_CLEANUP':
                    case 'GROW_DATA_DUPLICATES':
                    case 'GROW_DATA_HEALTH': return <LazyModules.Data />;

                    case 'GROW_REPORTS':
                    case 'GROW_REPORT_SALES':
                    case 'GROW_REPORT_ROI':
                    case 'GROW_REPORT_CUSTOMER':
                    case 'GROW_REPORT_TRAFFIC':
                    case 'GROW_REPORT_CONVERSION': return <LazyModules.GrowReports />;

                    // Fallback
                    default: return <LazyModules.Dashboard />;
                }
            })()}
        </Suspense>
    );
};

export default ModuleRenderer;
