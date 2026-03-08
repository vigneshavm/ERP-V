import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LazyModules } from '../../../app/registry/ModuleRegistry';

// Specific lazy loads that were in TenantView
const PayableSnapshot = lazy(() => import('../../../pages/Purchase/PayableSnapshot'));
const UnclearedCheques = lazy(() => import('../../../pages/Purchase/UnclearedCheques'));
const RateRevisionList = lazy(() => import('../../../pages/Purchase/RateRevisionList'));
const RateRevisionForm = lazy(() => import('../../../pages/Purchase/RateRevisionForm'));

interface RouteDefinitionsProps {
    renderContent: () => React.ReactNode;
}

const RouteDefinitions: React.FC<RouteDefinitionsProps> = ({ renderContent }) => {
    return (
        <Routes>
            <Route path="/" element={renderContent()} />
            {/* SALES ROUTES */}
            <Route path="/sales/new" element={
                <Suspense fallback={<div>Loading Form...</div>}><LazyModules.SalesInvoiceForm /></Suspense>
            } />
            <Route path="/sales/invoice/create" element={
                <Navigate to="/sales/new" replace />
            } />
            <Route path="/sales/invoice/:id" element={
                <Suspense fallback={<div>Loading Invoice...</div>}><LazyModules.SalesInvoiceDetail /></Suspense>
            } />
            {/* SUPPLIER ROUTES */}
            <Route path="/suppliers/add" element={
                <Suspense fallback={<div>Loading...</div>}><LazyModules.VendorForm /></Suspense>
            } />
            <Route path="/suppliers/inflow" element={
                <Suspense fallback={<div>Loading...</div>}><LazyModules.VendorInflowOutflow /></Suspense>
            } />
            <Route path="/suppliers/groups" element={
                <Suspense fallback={<div>Loading...</div>}><LazyModules.SupplierGroups /></Suspense>
            } />
            <Route path="/suppliers/statements" element={
                <Suspense fallback={<div>Loading...</div>}><LazyModules.SupplierStatements /></Suspense>
            } />
            <Route path="/suppliers/ledger" element={
                <Suspense fallback={<div>Loading...</div>}><LazyModules.SupplierLedger /></Suspense>
            } />
            <Route path="/suppliers/:id" element={
                <Suspense fallback={<div>Loading...</div>}><LazyModules.VendorDetails /></Suspense>
            } />
            <Route path="/suppliers/:id/edit" element={
                <Suspense fallback={<div>Loading...</div>}><LazyModules.EditSupplier /></Suspense>
            } />
            <Route path="/suppliers/:id/ledger" element={
                <Suspense fallback={<div>Loading...</div>}><LazyModules.SupplierLedger /></Suspense>
            } />
            <Route path="/purchase/grn/new" element={
                <Suspense fallback={<div>Loading GRN Form...</div>}><LazyModules.GRNForm /></Suspense>
            } />
            <Route path="/purchase/grn/new/:poId" element={
                <Suspense fallback={<div>Loading GRN Form...</div>}><LazyModules.GRNForm /></Suspense>
            } />
            <Route path="/purchase/grn/view/:id" element={
                <Suspense fallback={<div>Loading GRN Details...</div>}><LazyModules.GRNForm /></Suspense>
            } />
            <Route path="/purchase/orders/:id" element={
                <Suspense fallback={<div>Loading Order Details...</div>}><LazyModules.PurchaseOrderDetails /></Suspense>
            } />
            <Route path="/purchase/bills/new" element={
                <Suspense fallback={<div>Loading Bill Form...</div>}><LazyModules.BillForm /></Suspense>
            } />
            <Route path="/purchase/bills/new/:grnId" element={
                <Suspense fallback={<div>Loading Bill Form...</div>}><LazyModules.BillForm /></Suspense>
            } />
            <Route path="/purchase/bills/view/:id" element={
                <Suspense fallback={<div>Loading Bill Details...</div>}><LazyModules.BillForm /></Suspense>
            } />
            <Route path="/purchase/returns" element={
                <Suspense fallback={<div>Loading Returns...</div>}><LazyModules.PurchaseReturns /></Suspense>
            } />
            <Route path="/purchase/returns/new" element={
                <Suspense fallback={<div>Loading Return Form...</div>}><LazyModules.PurchaseReturnForm /></Suspense>
            } />
            <Route path="/purchase/returns/new/:grnId" element={
                <Suspense fallback={<div>Loading Return Form...</div>}><LazyModules.PurchaseReturnForm /></Suspense>
            } />
            <Route path="/purchase/returns/view/:id" element={
                <Suspense fallback={<div>Loading Return Details...</div>}><LazyModules.PurchaseReturnForm /></Suspense>
            } />
            <Route path="/purchase/ageing-analysis" element={
                <Suspense fallback={<div>Loading Ageing...</div>}><LazyModules.SupplierAgeing /></Suspense>
            } />
            <Route path="/purchase/payments" element={
                <Suspense fallback={<div>Loading Payments...</div>}><LazyModules.SupplierPayments /></Suspense>
            } />
            <Route path="/purchase/payments/add" element={
                <Suspense fallback={<div>Loading Payment Form...</div>}><LazyModules.PaymentOut /></Suspense>
            } />
            <Route path="/purchase/payment-out" element={
                <Suspense fallback={<div>Loading Payment Form...</div>}><LazyModules.PaymentOut /></Suspense>
            } />
            <Route path="/purchase/snapshot" element={
                <Suspense fallback={<div>Loading Snapshot...</div>}><PayableSnapshot /></Suspense>
            } />
            <Route path="/purchase/payment-out/:vendorId" element={
                <Suspense fallback={<div>Loading Payment Form...</div>}><LazyModules.PaymentOut /></Suspense>
            } />
            <Route path="/purchase/cheques-vault" element={
                <Suspense fallback={<div>Loading Vault...</div>}><UnclearedCheques /></Suspense>
            } />
            <Route path="/purchase/rate-revisions" element={
                <Suspense fallback={<div>Loading Revisions...</div>}><RateRevisionList /></Suspense>
            } />
            <Route path="/purchase/rate-revisions/new" element={
                <Suspense fallback={<div>Loading Form...</div>}><RateRevisionForm /></Suspense>
            } />
            <Route path="/growth/tenant-architect/:tenantId" element={
                <Suspense fallback={<div>Loading Tenant Architect...</div>}><LazyModules.TenantArchitect /></Suspense>
            } />
            <Route path="/cashbank/accounts" element={
                <Suspense fallback={<div>Loading Bank Accounts...</div>}><LazyModules.BankAccounts /></Suspense>
            } />
            <Route path="/cashbank/transfers" element={
                <Suspense fallback={<div>Loading Transfers...</div>}><LazyModules.Transfers /></Suspense>
            } />
            <Route path="/cashbank/cash-in-hand" element={
                <Suspense fallback={<div>Loading Cash In Hand...</div>}><LazyModules.CashInHand /></Suspense>
            } />
            <Route path="/cashbank/position" element={
                <Suspense fallback={<div>Loading Position...</div>}><LazyModules.CashBankPosition /></Suspense>
            } />
            <Route path="/cashbank/ledger/:id" element={
                <Suspense fallback={<div>Loading Ledger...</div>}><LazyModules.AccountLedger /></Suspense>
            } />
            <Route path="/finance/journal" element={
                <Suspense fallback={<div>Loading Journal Entries...</div>}><LazyModules.JournalEntries /></Suspense>
            } />
            <Route path="/finance/journal/new" element={
                <Suspense fallback={<div>Loading Journal Form...</div>}><LazyModules.JournalEntryForm /></Suspense>
            } />
            <Route path="/finance/bank-statement" element={
                <Suspense fallback={<div>Loading Bank Statements...</div>}><LazyModules.BankStatementView /></Suspense>
            } />
            <Route path="/finance/sms-tracker" element={
                <Suspense fallback={<div>Loading SMS Tracker...</div>}><LazyModules.SmsTrackerPage /></Suspense>
            } />
            <Route path="/finance/budget-tracker" element={
                <Suspense fallback={<div>Loading Budget Tracker...</div>}><LazyModules.BudgetTrackerPage /></Suspense>
            } />
            <Route path="/finance/agents" element={
                <Suspense fallback={<div>Loading Finance Agents...</div>}><LazyModules.FinanceAgentDashboard /></Suspense>
            } />
            <Route path="/finance/goals" element={
                <Suspense fallback={<div>Loading Goals...</div>}><LazyModules.FinancialGoals /></Suspense>
            } />
            <Route path="*" element={renderContent()} />
            <Route path="/people/employees" element={
                <Suspense fallback={<div>Loading Directory...</div>}><LazyModules.EmployeeDirectory /></Suspense>
            } />
            <Route path="/people/employees/:id" element={
                <Suspense fallback={<div>Loading Profile...</div>}><LazyModules.EmployeeProfile /></Suspense>
            } />
            <Route path="/people/employees/labor" element={
                <Suspense fallback={<div>Loading Staff...</div>}><LazyModules.LaborManager /></Suspense>
            } />
            <Route path="/people/employees/leaves" element={
                <Suspense fallback={<div>Loading Leaves...</div>}><LazyModules.LeaveManagement /></Suspense>
            } />
            <Route path="/people/employees/allowances" element={
                <Suspense fallback={<div>Loading Allowances...</div>}><LazyModules.AllowanceManager /></Suspense>
            } />
            <Route path="/people/attendance" element={
                <Suspense fallback={<div>Loading...</div>}><LazyModules.DailyAttendanceBoard /></Suspense>
            } />
            <Route path="/people/payroll" element={
                <Suspense fallback={<div>Loading Payroll...</div>}><LazyModules.PayrollDashboard /></Suspense>
            } />
            <Route path="/people/payroll/structure" element={
                <Suspense fallback={<div>Loading Structure...</div>}><LazyModules.SalaryStructureManager /></Suspense>
            } />
            <Route path="/people/payroll/attendance" element={
                <Suspense fallback={<div>Loading Attendance...</div>}><LazyModules.AttendanceSummaryManager /></Suspense>
            } />
            <Route path="/people/payroll/run" element={
                <Suspense fallback={<div>Loading Runs...</div>}><LazyModules.PayrollRuns /></Suspense>
            } />
            <Route path="/people/payroll/run/:id" element={
                <Suspense fallback={<div>Loading Runs...</div>}><LazyModules.PayrollRuns /></Suspense>
            } />
            <Route path="/people/payroll/payslip/:id" element={
                <Suspense fallback={<div>Loading Payslip...</div>}><LazyModules.PayslipView /></Suspense>
            } />
            <Route path="/finance/gst" element={<Suspense fallback={<div>Loading GST...</div>}><LazyModules.GSTReconciliation /></Suspense>} />
            <Route path="/inventory/reprint" element={<Suspense fallback={<div>Loading Reprint...</div>}><LazyModules.ReprintQueue /></Suspense>} />
            <Route path="/settings/audit" element={<Suspense fallback={<div>Loading Audit Logs...</div>}><LazyModules.AuditLogs /></Suspense>} />
        </Routes>
    );
};

export default RouteDefinitions;
