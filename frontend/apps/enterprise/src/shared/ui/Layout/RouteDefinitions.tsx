import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LazyModules } from '@/app/registry/ModuleRegistry';
import {
    DashboardSkeleton,
    GridSkeleton,
    TableSkeleton,
    FormSkeleton,
} from '@/shared/ui/Feedback/Skeleton';
import ErrorBoundary from '@/shared/ui/ErrorBoundary';
import RouteErrorFallback from '@/shared/ui/RouteErrorFallback';

// Pick a contextual skeleton based on the route path
function skeletonFor(path: string): React.ReactNode {
    if (path.includes('dashboard') || path === '/') return <DashboardSkeleton />;
    if (path.includes('inventory') || path.includes('storefront')) return <GridSkeleton />;
    if (path.includes('form') || path.includes('new') || path.includes('edit')) return <FormSkeleton />;
    return <TableSkeleton />;
}

function S({ path, children }: { path: string; children: React.ReactNode }) {
    return (
        <ErrorBoundary fallback={({ error, resetError }) => <RouteErrorFallback error={error} resetError={resetError} />}>
            <Suspense fallback={<div className="p-4 animate-in fade-in duration-300">{skeletonFor(path)}</div>}>
                {children}
            </Suspense>
        </ErrorBoundary>
    );
}

const RouteDefinitions: React.FC = () => (
    <Routes>
        {/* ── Dashboard ─────────────────────────────────────────────────── */}
        <Route path="/" element={<S path="/"><LazyModules.Dashboard /></S>} />
        <Route path="/dashboard" element={<S path="/"><LazyModules.Dashboard /></S>} />
        <Route path="/dashboard/summary" element={<S path="/dashboard/summary"><LazyModules.Dashboard /></S>} />

        {/* ── POS ───────────────────────────────────────────────────────── */}
        <Route path="/pos" element={<S path="/pos"><LazyModules.POSModule /></S>} />
        <Route path="/pos/orders" element={<S path="/pos/orders"><LazyModules.POSOrdersIntelligence /></S>} />
        <Route path="/pos/returns" element={<S path="/pos/returns"><LazyModules.POSReturnsIntelligence /></S>} />
        <Route path="/pos/shifts" element={<S path="/pos/shifts"><LazyModules.ShiftManagement /></S>} />
        <Route path="/pos/customer-display" element={<S path="/pos/customer-display"><LazyModules.POSCustomerDisplay /></S>} />

        {/* ── Sales ─────────────────────────────────────────────────────── */}
        <Route path="/sales" element={<Navigate to="/sales/new" replace />} />
        <Route path="/sales/register" element={<S path="/sales/register"><LazyModules.SalesInvoiceForm /></S>} />
        <Route path="/sales/new" element={<S path="/sales/new"><LazyModules.SalesInvoiceForm /></S>} />
        <Route path="/sales/invoice/create" element={<Navigate to="/sales/new" replace />} />
        <Route path="/sales/invoice/:id" element={<S path="/sales/invoice/:id"><LazyModules.SalesInvoiceDetail /></S>} />
        <Route path="/sales/estimates" element={<S path="/sales/estimates"><LazyModules.EstimateList /></S>} />
        <Route path="/sales/estimates/:id" element={<S path="/sales/estimates/:id"><LazyModules.EstimateDetail /></S>} />
        <Route path="/sales/orders" element={<S path="/sales/orders"><LazyModules.SalesOrderList /></S>} />
        <Route path="/sales/orders/:id" element={<S path="/sales/orders/:id"><LazyModules.SalesOrderDetail /></S>} />
        <Route path="/sales/challans" element={<S path="/sales/challans"><LazyModules.DeliveryChallanList /></S>} />
        <Route path="/sales/challans/:id" element={<S path="/sales/challans/:id"><LazyModules.DeliveryChallanDetail /></S>} />
        <Route path="/sales/returns" element={<S path="/sales/returns"><LazyModules.SalesReturnsList /></S>} />
        <Route path="/sales/payments" element={<S path="/sales/payments"><LazyModules.PaymentInList /></S>} />
        <Route path="/sales/payments/new" element={<S path="/sales/payments/new"><LazyModules.PaymentInCreator /></S>} />
        <Route path="/sales/credits" element={<S path="/sales/credits"><LazyModules.PaymentInList /></S>} />
        <Route path="/sales/dues" element={<S path="/sales/dues"><LazyModules.PaymentInList /></S>} />

        {/* ── Customers ─────────────────────────────────────────────────── */}
        <Route path="/customers" element={<S path="/customers"><LazyModules.CustomerList /></S>} />
        <Route path="/customers/ledger" element={<S path="/customers/ledger"><LazyModules.CustomerLedger /></S>} />
        <Route path="/customers/:id" element={<S path="/customers/:id"><LazyModules.CustomerDetail /></S>} />

        {/* ── Suppliers ─────────────────────────────────────────────────── */}
        <Route path="/suppliers" element={<S path="/suppliers"><LazyModules.SupplierList /></S>} />
        <Route path="/suppliers/add" element={<S path="/suppliers/add"><LazyModules.SupplierDetail /></S>} />
        <Route path="/suppliers/ledger" element={<S path="/suppliers/ledger"><LazyModules.SupplierLedger /></S>} />
        <Route path="/suppliers/groups" element={<S path="/suppliers/groups"><LazyModules.SupplierGroups /></S>} />
        <Route path="/suppliers/statements" element={<S path="/suppliers/statements"><LazyModules.SupplierStatements /></S>} />
        <Route path="/suppliers/inflow" element={<S path="/suppliers/inflow"><LazyModules.VendorInflowOutflow /></S>} />
        <Route path="/suppliers/:id" element={<S path="/suppliers/:id"><LazyModules.SupplierDetail /></S>} />
        <Route path="/suppliers/:id/edit" element={<S path="/suppliers/:id/edit"><LazyModules.SupplierDetail /></S>} />
        <Route path="/suppliers/:id/ledger" element={<S path="/suppliers/:id/ledger"><LazyModules.SupplierLedger /></S>} />

        {/* ── Purchase ──────────────────────────────────────────────────── */}
        <Route path="/purchase" element={<Navigate to="/purchase/bills" replace />} />
        <Route path="/purchase/register" element={<S path="/purchase/register"><LazyModules.Bills /></S>} />
        <Route path="/purchase/new" element={<S path="/purchase/new"><LazyModules.PurchaseEntry /></S>} />
        <Route path="/purchase/orders" element={<S path="/purchase/orders"><LazyModules.PurchaseOrderList /></S>} />
        <Route path="/purchase/orders/new" element={<S path="/purchase/orders/new"><LazyModules.PurchaseOrderDetails /></S>} />
        <Route path="/purchase/orders/:id" element={<S path="/purchase/orders/:id"><LazyModules.PurchaseOrderDetails /></S>} />
        <Route path="/purchase/grn" element={<S path="/purchase/grn"><LazyModules.GoodsReceived /></S>} />
        <Route path="/purchase/grn/new" element={<S path="/purchase/grn/new"><LazyModules.GRNForm /></S>} />
        <Route path="/purchase/grn/new/:poId" element={<S path="/purchase/grn/new/:poId"><LazyModules.GRNForm /></S>} />
        <Route path="/purchase/grn/view/:id" element={<S path="/purchase/grn/view/:id"><LazyModules.GRNForm /></S>} />
        <Route path="/purchase/bills" element={<S path="/purchase/bills"><LazyModules.Bills /></S>} />
        <Route path="/purchase/bills/new" element={<S path="/purchase/bills/new"><LazyModules.BillForm /></S>} />
        <Route path="/purchase/bills/new/:grnId" element={<S path="/purchase/bills/new/:grnId"><LazyModules.BillForm /></S>} />
        <Route path="/purchase/bills/view/:id" element={<S path="/purchase/bills/view/:id"><LazyModules.BillForm /></S>} />
        <Route path="/purchase/history" element={<S path="/purchase/history"><LazyModules.PurchaseHistory /></S>} />
        <Route path="/purchase/returns" element={<S path="/purchase/returns"><LazyModules.PurchaseReturns /></S>} />
        <Route path="/purchase/returns/new" element={<S path="/purchase/returns/new"><LazyModules.PurchaseReturnForm /></S>} />
        <Route path="/purchase/returns/new/:grnId" element={<S path="/purchase/returns/new/:grnId"><LazyModules.PurchaseReturnForm /></S>} />
        <Route path="/purchase/returns/view/:id" element={<S path="/purchase/returns/view/:id"><LazyModules.PurchaseReturnForm /></S>} />
        <Route path="/purchase/debit-notes" element={<S path="/purchase/debit-notes"><LazyModules.DebitNotes /></S>} />
        <Route path="/purchase/payments" element={<S path="/purchase/payments"><LazyModules.SupplierPayments /></S>} />
        <Route path="/purchase/payments/add" element={<S path="/purchase/payments/add"><LazyModules.PaymentOut /></S>} />
        <Route path="/purchase/payment-out" element={<S path="/purchase/payment-out"><LazyModules.PaymentOut /></S>} />
        <Route path="/purchase/payment-out/:vendorId" element={<S path="/purchase/payment-out/:vendorId"><LazyModules.PaymentOut /></S>} />
        <Route path="/purchase/payables" element={<S path="/purchase/payables"><LazyModules.OutstandingPayables /></S>} />
        <Route path="/purchase/snapshot" element={<S path="/purchase/snapshot"><LazyModules.PayableSnapshot /></S>} />
        <Route path="/purchase/ageing-analysis" element={<S path="/purchase/ageing-analysis"><LazyModules.SupplierAgeing /></S>} />
        <Route path="/purchase/rate-revisions" element={<S path="/purchase/rate-revisions"><LazyModules.RateRevisionList /></S>} />
        <Route path="/purchase/rate-revisions/new" element={<S path="/purchase/rate-revisions/new"><LazyModules.RateRevisionForm /></S>} />
        <Route path="/purchase/cheques-vault" element={<S path="/purchase/cheques-vault"><LazyModules.UnclearedCheques /></S>} />
        <Route path="/purchase/inflow-outflow" element={<S path="/purchase/inflow-outflow"><LazyModules.VendorInflowOutflow /></S>} />

        {/* ── Inventory ─────────────────────────────────────────────────── */}
        <Route path="/inventory" element={<Navigate to="/inventory/items" replace />} />
        <Route path="/inventory/items" element={<S path="/inventory/items"><LazyModules.InventoryManager /></S>} />
        <Route path="/inventory/categories" element={<S path="/inventory/categories"><LazyModules.CategoryManager /></S>} />
        <Route path="/inventory/batch-expiry" element={<S path="/inventory/batch-expiry"><LazyModules.AgedStockManager /></S>} />
        <Route path="/inventory/barcodes" element={<S path="/inventory/barcodes"><LazyModules.BarcodeGenerator /></S>} />
        <Route path="/inventory/import" element={<S path="/inventory/import"><LazyModules.BulkImport /></S>} />
        <Route path="/inventory/reprint" element={<S path="/inventory/reprint"><LazyModules.ReprintQueue /></S>} />
        <Route path="/inventory/export" element={<S path="/inventory/export"><LazyModules.DataExport /></S>} />

        {/* ── Finance / Cashbank ────────────────────────────────────────── */}
        <Route path="/finance" element={<Navigate to="/finance/cash" replace />} />
        <Route path="/finance/cash" element={<S path="/finance/cash"><LazyModules.CashInHand /></S>} />
        <Route path="/finance/petty-cash" element={<S path="/finance/petty-cash"><LazyModules.PettyCash /></S>} />
        <Route path="/finance/transfers" element={<S path="/finance/transfers"><LazyModules.FundTransfers /></S>} />
        <Route path="/finance/reconciliation" element={<S path="/finance/reconciliation"><LazyModules.BankReconciliation /></S>} />
        <Route path="/finance/summary" element={<S path="/finance/summary"><LazyModules.BankSummary /></S>} />
        <Route path="/finance/loans" element={<S path="/finance/loans"><LazyModules.LoanAccounts /></S>} />
        <Route path="/finance/goals" element={<S path="/finance/goals"><LazyModules.FinancialGoals /></S>} />
        <Route path="/finance/bank-statement" element={<S path="/finance/bank-statement"><LazyModules.BankStatementView /></S>} />
        <Route path="/finance/sms-tracker" element={<S path="/finance/sms-tracker"><LazyModules.SmsTrackerPage /></S>} />
        <Route path="/finance/budget-tracker" element={<S path="/finance/budget-tracker"><LazyModules.BudgetTrackerPage /></S>} />
        <Route path="/finance/gst" element={<S path="/finance/gst"><LazyModules.GSTReconciliation /></S>} />
        <Route path="/finance/journal" element={<S path="/finance/journal"><LazyModules.JournalEntries /></S>} />
        <Route path="/finance/journal/new" element={<S path="/finance/journal/new"><LazyModules.JournalEntryForm /></S>} />
        <Route path="/cashbank/accounts" element={<S path="/cashbank/accounts"><LazyModules.BankAccounts /></S>} />
        <Route path="/cashbank/ledger/:id" element={<S path="/cashbank/ledger/:id"><LazyModules.AccountLedger /></S>} />

        {/* ── Expenses ──────────────────────────────────────────────────── */}
        <Route path="/expenses" element={<Navigate to="/expenses/tracker" replace />} />
        <Route path="/expenses/tracker" element={<S path="/expenses/tracker"><LazyModules.ExpensesModule /></S>} />
        <Route path="/expenses/categories" element={<S path="/expenses/categories"><LazyModules.ExpenseCategoriesManager /></S>} />
        <Route path="/expenses/recurring" element={<S path="/expenses/recurring"><LazyModules.RecurringExpenses /></S>} />
        <Route path="/expenses/reports" element={<S path="/expenses/reports"><LazyModules.ExpenseReports /></S>} />

        {/* ── People / HR ───────────────────────────────────────────────── */}
        <Route path="/people" element={<Navigate to="/people/employees" replace />} />
        <Route path="/people/employees" element={<S path="/people/employees"><LazyModules.EmployeeDirectory /></S>} />
        <Route path="/people/employees/:id" element={<S path="/people/employees/:id"><LazyModules.EmployeeProfile /></S>} />
        <Route path="/people/employees/labor" element={<S path="/people/employees/labor"><LazyModules.LaborManager /></S>} />
        <Route path="/people/employees/leaves" element={<S path="/people/employees/leaves"><LazyModules.LeaveManagement /></S>} />
        <Route path="/people/employees/allowances" element={<S path="/people/employees/allowances"><LazyModules.AllowanceManager /></S>} />
        <Route path="/people/attendance" element={<S path="/people/attendance"><LazyModules.DailyAttendanceBoard /></S>} />
        <Route path="/people/payroll" element={<S path="/people/payroll"><LazyModules.PayrollDashboard /></S>} />
        <Route path="/people/payroll/structure" element={<S path="/people/payroll/structure"><LazyModules.SalaryStructureManager /></S>} />
        <Route path="/people/payroll/attendance" element={<S path="/people/payroll/attendance"><LazyModules.AttendanceSummary /></S>} />
        <Route path="/people/payroll/run" element={<S path="/people/payroll/run"><LazyModules.PayrollRuns /></S>} />
        <Route path="/people/payroll/run/:id" element={<S path="/people/payroll/run/:id"><LazyModules.PayrollRuns /></S>} />
        <Route path="/people/payroll/payslip/:id" element={<S path="/people/payroll/payslip/:id"><LazyModules.PayslipView /></S>} />

        {/* ── Settings / System ─────────────────────────────────────────── */}
        <Route path="/settings" element={<S path="/settings"><LazyModules.Settings /></S>} />
        <Route path="/settings/tenants" element={<S path="/settings/tenants"><LazyModules.Settings /></S>} />
        <Route path="/settings/architect" element={<S path="/settings/architect"><LazyModules.TenantArchitect /></S>} />
        <Route path="/settings/audit" element={<S path="/settings/audit"><LazyModules.AuditLogViewer /></S>} />
        <Route path="/settings/super-admin" element={<S path="/settings/super-admin"><LazyModules.SuperAdminConsole /></S>} />

        {/* ── Growth ────────────────────────────────────────────────────── */}
        <Route path="/growth" element={<S path="/growth"><LazyModules.GrowDashboard /></S>} />
        <Route path="/growth/tenant-architect/:tenantId" element={<S path="/growth/tenant-architect/:tenantId"><LazyModules.TenantArchitect /></S>} />

        {/* ── Catch-all ─────────────────────────────────────────────────── */}
        <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
);

export default RouteDefinitions;
