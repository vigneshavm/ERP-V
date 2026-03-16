import { useAuthStore } from '@repo/shared';
import React, { Suspense } from 'react';
import { Navigate } from 'react-router-dom';
import { Ban } from 'lucide-react';
import { RootState } from '@/app/store/store';
import { usePermissions } from '@/hooks/usePermissions';
import { AppView } from '@repo/shared';
import { LazyModules } from '@/app/registry/ModuleRegistry';
import EntitlementGuard from './EntitlementGuard';
import {
    DashboardSkeleton,
    GridSkeleton,
    TableSkeleton,
    FormSkeleton
} from '@/shared/ui/Feedback/Skeleton';
import ErrorBoundary from '@/shared/ui/ErrorBoundary';
import RouteErrorFallback from '@/shared/ui/RouteErrorFallback';

interface ModuleRendererProps {
    activeTab: string;
}

const ModuleRenderer: React.FC<ModuleRendererProps> = ({ activeTab }) => {
    const { user, role } = useAuthStore();
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
        <ErrorBoundary 
            fallback={({ error, resetError }) => (
                <RouteErrorFallback error={error} resetError={resetError} />
            )}
        >
            <Suspense fallback={<div className="p-4 animate-in fade-in duration-500">{getLoader()}</div>}>
                {(() => {
                    switch (activeTab) {
                        // === DASHBOARD ===
                        case 'PROFIT_PULSE':
                        case 'DASHBOARD_SNAPSHOT':
                        case 'DASHBOARD': return <LazyModules.Dashboard />;
                        case 'DASHBOARD_OVERVIEW': return <LazyModules.Dashboard />;
                        case 'DASHBOARD_SUMMARY': return <LazyModules.DailyFinanceTracker />;

                        // === SALES & POS ===
                        case 'SALES_REGISTER':
                        case 'INVOICE_REGISTER': return <LazyModules.SalesRegister />;
                        case 'SALES_INVOICE': return <LazyModules.SalesInvoiceForm />;
                        case 'ESTIMATE': return <LazyModules.EstimateList />;
                        case 'SALES_ORDER':
                        case 'ORDER_REGISTER': return <LazyModules.SalesOrderList />;
                        case 'DELIVERY_CHALLAN':
                        case 'CHALLAN_LIST': return <LazyModules.DeliveryChallanList />;
                        case 'SALES_RETURN':
                        case 'RETURNED_ITEMS': return <LazyModules.SalesReturnsList />;
                        case 'PAYMENT_IN':
                        case 'PAYMENT_IN_LIST': return <LazyModules.PaymentInList />;
                        case 'CUSTOMER_CREDITS': return <LazyModules.CustomerCredits />;
                        case 'OUTSTANDING_DUES': return <LazyModules.OutstandingDues />;
                        case 'POS': return <LazyModules.POSCustomerDisplay />;
                        case 'POS_ORDERS': return <LazyModules.POSCustomerDisplay />;
                        case 'POS_RETURNS': return <LazyModules.POSCustomerDisplay />;

                        // === PURCHASE & SUPPLIERS ===
                        case 'PURCHASE_ENTRY':
                        case 'GRN_FORM': return <LazyModules.GRNForm />;
                        case 'PURCHASE_ORDER':
                        case 'PURCHASE_ORDER_LIST': return <LazyModules.PurchaseOrderList />;
                        case 'PURCHASE_ORDER_DETAILS': return <LazyModules.PurchaseOrderDetails />;
                        case 'PURCHASE_REGISTER': return <LazyModules.PurchaseRegister />;
                        case 'PURCHASE_BILLS':
                        case 'BILL_FORM': return <LazyModules.BillForm />;
                        case 'PURCHASE_RETURN':
                        case 'PURCHASE_RETURNS': return <LazyModules.PurchaseReturns />;
                        case 'PURCHASE_RETURN_FORM': return <LazyModules.PurchaseReturnForm />;
                        case 'DEBIT_NOTES': return <LazyModules.DebitNotes />;
                        case 'SUPPLIER_PAYMENTS':
                        case 'PAYMENT_OUT':
                        case 'PURCHASE_PAYMENT_OUT': return <LazyModules.PaymentOut />;
                        case 'OUTSTANDING_PAYABLES': return <LazyModules.OutstandingPayables />;
                        case 'RATE_REVISIONS': return <LazyModules.RateRevisions />;
                        case 'CHEQUES_VAULT': return <LazyModules.ChequesVault />;
                        case 'SUPPLIER_LIST':
                        case 'VENDORS': return <LazyModules.VendorDetails />;
                        case 'VENDOR_INFLOW_OUTFLOW': return <LazyModules.VendorInflowOutflow />;
                        case 'SUPPLIERS': return <LazyModules.SupplierGroups />;

                        // === INVENTORY ===
                        case 'INVENTORY_ITEMS': return <LazyModules.InventoryItems />;
                        case 'ITEM_CATEGORIES': return <LazyModules.ItemCategories />;
                        case 'BARCODE_GENERATOR': return <LazyModules.BarcodeGenerator />;
                        case 'BULK_IMPORT': return <LazyModules.BulkImport />;
                        case 'DATA_EXPORT': return <LazyModules.DataExport />;
                        case 'REPRINT_QUEUE': return <LazyModules.ReprintQueue />;

                        // === FINANCE & CASHBANK ===
                        case 'BANK_ACCOUNTS': return <LazyModules.BankAccounts />;
                        case 'FUND_TRANSFERS': return <LazyModules.Transfers />;
                        case 'CASH_ACCOUNTS': return <LazyModules.CashInHand />;
                        case 'BANK_SUMMARY': return <LazyModules.CashBankPosition />;
                        case 'JOURNAL_ENTRIES': return <LazyModules.JournalEntries />;
                        case 'BANK_STATEMENT': return <LazyModules.BankStatementView />;
                        case 'SMS_TRACKER': return <LazyModules.SmsTrackerPage />;
                        case 'BUDGET_TRACKER': return <LazyModules.BudgetTrackerPage />;
                        case 'FINANCE_AGENTS': return <LazyModules.FinanceAgentDashboard />;
                        case 'FINANCIAL_GOALS': return <LazyModules.FinancialGoals />;
                        case 'GST_RECONCILIATION': return <LazyModules.GSTReconciliation />;

                        // === HR & PAYROLL ===
                        case 'STAFF_MANAGER': return <LazyModules.LaborManager />;
                        case 'ALLOWANCE_MANAGER': return <LazyModules.AllowanceManager />;
                        case 'ATTENDANCE_SUMMARY': return <LazyModules.AttendanceSummaryManager />;
                        case 'ATTENDANCE_BOARD': return <LazyModules.DailyAttendanceBoard />;
                        case 'PAYROLL': return <LazyModules.PayrollDashboard />;
                        case 'HR': return <LazyModules.EmployeeDirectory />;

                        // === FALLBACKS ===
                        case 'LANDING': return <LazyModules.Dashboard />;
                        default: return <LazyModules.Dashboard />;
                    }
                })()}
            </Suspense>
        </ErrorBoundary>
    );
};

export default ModuleRenderer;
