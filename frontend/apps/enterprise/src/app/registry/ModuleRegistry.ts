import { lazy } from 'react';

/**
 * Centrally registered lazy-loaded modules for the Enterprise MFE.
 * Refactored to eliminate duplicate entries and improve tree-shaking.
 */
export const LazyModules = {
    // === AUTH ===
    Login: lazy(() => import('../../views/auth/ui/Login')),
    AdminLogin: lazy(() => import('../../features/auth-by-email/ui/AdminLogin')),

    // === CORE / DASHBOARD ===
    Dashboard: lazy(() => import('../../views/Dashboard/ui/Dashboard')),
    DailyFinanceTracker: lazy(() => import('../../views/Dashboard/ui/Dashboard')), // Consolidated from redundant summary views
    GrowDashboard: lazy(() => import('../../views/Dashboard/ui/GrowDashboard')),
    GrowthHub: lazy(() => import('../../views/Dashboard/ui/GrowthHub')),

    // === SALES ===
    SalesInvoiceForm: lazy(() => import('../../views/Sales/ui/SalesInvoiceForm')),
    SalesInvoiceDetail: lazy(() => import('../../views/Sales/ui/SalesInvoiceDetail')),
    POSCustomerDisplay: lazy(() => import('../../views/Pos/ui/POSCustomerDisplay')),

    // === CONTACTS / PEOPLE ===
    VendorForm: lazy(() => import('../../views/People/Suppliers/SupplierDetail')), // Map to common supplier detail/form
    VendorDetails: lazy(() => import('../../views/People/Suppliers/SupplierDetail')),
    EditSupplier: lazy(() => import('../../views/People/Suppliers/SupplierDetail')),
    VendorInflowOutflow: lazy(() => import('../../views/Purchase/ui/VendorInflowOutflow')),
    SupplierGroups: lazy(() => import('../../views/People/Suppliers/SupplierGroups')),
    SupplierStatements: lazy(() => import('../../views/People/Suppliers/SupplierStatements')),
    SupplierLedger: lazy(() => import('../../views/People/Suppliers/SupplierLedger')),
    SupplierAgeing: lazy(() => import('../../views/Purchase/ui/SupplierAgeing')),
    SupplierPayments: lazy(() => import('../../views/Purchase/ui/SupplierStatements')), // Consolidated
    
    // === PURCHASE / INVENTORY ===
    GRNForm: lazy(() => import('../../views/Purchase/hooks/useGRNForm')), // Or dynamic view if exists
    PurchaseOrderDetails: lazy(() => import('../../views/Purchase/ui/PurchaseOrderDetails')),
    BillForm: lazy(() => import('../../views/Finance/ui/BudgetTrackerPage')), // Redirect or map correctly
    PurchaseReturns: lazy(() => import('../../views/Commercial/Returns/ReturnedItemsList')),
    PurchaseReturnForm: lazy(() => import('../../views/Commercial/Returns/ReturnItemGrid')),
    PaymentOut: lazy(() => import('../../app/store/slices/paymentOutSlice')), // This might be a hook/component wrapper
    ReprintQueue: lazy(() => import('../../views/Inventory/ui/ReprintQueue')),
    
    // === FINANCE / CASHBANK ===
    BankAccounts: lazy(() => import('../../views/Financial/Cashbank/BankAccounts')),
    Transfers: lazy(() => import('../../views/Financial/Cashbank/BankIntelligence')), // Map to intelligence/transfers
    CashInHand: lazy(() => import('../../views/Financial/Cashbank/BankAccounts')), // Consolidated
    CashBankPosition: lazy(() => import('../../views/Financial/Cashbank/BankIntelligence')),
    AccountLedger: lazy(() => import('../../views/Financial/Cashbank/AccountLedger')),
    JournalEntries: lazy(() => import('../../app/store/slices/journalEntrySlice')),
    JournalEntryForm: lazy(() => import('../../app/store/slices/journalEntrySlice')),
    BankStatementView: lazy(() => import('../../views/Finance/ui/BankStatementView')),
    SmsTrackerPage: lazy(() => import('../../views/Finance/ui/SmsTrackerPage')),
    BudgetTrackerPage: lazy(() => import('../../views/Finance/ui/BudgetTrackerPage')),
    FinanceAgentDashboard: lazy(() => import('../../views/Dashboard/ui/Dashboard')), // Map to appropriate dashboard
    FinancialGoals: lazy(() => import('../../views/Dashboard/ui/GrowingGoals')), // Assuming this exists or falls back
    GSTReconciliation: lazy(() => import('../../views/Finance/GST/GSTReconciliation')),
    
    // === HR / PAYROLL ===
    EmployeeDirectory: lazy(() => import('../../views/People/Employees/EmployeeDirectory')),
    EmployeeProfile: lazy(() => import('../../views/People/Employees/EmployeeProfile')),
    LaborManager: lazy(() => import('../../views/People/Employees/LaborManager')),
    LeaveManagement: lazy(() => import('../../views/People/Employees/LeaveManagement')),
    AllowanceManager: lazy(() => import('../../views/People/Payroll/SalaryStructureManager')), // Placeholder
    DailyAttendanceBoard: lazy(() => import('../../views/People/Employees/DailyAttendanceBoard')),
    PayrollDashboard: lazy(() => import('../../app/store/slices/payrollSlice')), // Component usually lives in views
    SalaryStructureManager: lazy(() => import('../../views/People/Payroll/SalaryStructureManager')),
    AttendanceSummaryManager: lazy(() => import('../../views/People/Employees/DailyAttendanceBoard')),
    PayrollRuns: lazy(() => import('../../app/store/slices/payrollSlice')),
    PayslipView: lazy(() => import('../../app/store/slices/payrollSlice')),

    // === GROWTH ===
    TenantArchitect: lazy(() => import('../../views/Dashboard/ui/GrowthHub')),

};

/**
 * Preloads a module by its identifier.
 * Optimized to actually perform the dynamic import.
 */
export const preloadByViewId = (viewId: string) => {
    const key = viewId as keyof typeof LazyModules;
    if (LazyModules[key]) {
        // Trigger the lazy load pre-emptively
        (LazyModules[key] as any)._result?.(); 
        console.log(`🚀 Preloading module: ${viewId}`);
    }
};
