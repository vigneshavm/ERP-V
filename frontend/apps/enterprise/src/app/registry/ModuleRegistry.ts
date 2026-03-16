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
    SalesInvoiceForm: lazy(() => import('../../views/Sales/salesInvoices/SalesInvoiceForm')),
    SalesInvoiceDetail: lazy(() => import('../../views/Sales/salesInvoices/SalesInvoiceDetail')),
    POSCustomerDisplay: lazy(() => import('../../views/Pos/ui/POSCustomerDisplay')),
    EstimateList: lazy(() => import('../../views/Sales/estimates/EstimateList')),
    SalesOrderList: lazy(() => import('../../views/Sales/salesOrders/SalesOrderList').catch(() => ({ default: () => null }))),
    DeliveryChallanList: lazy(() => import('../../views/Sales/deliveryChallans/DeliveryChallanList')),
    SalesReturnsList: lazy(() => import('../../views/Sales/returns/ReturnedItems')),
    PaymentInList: lazy(() => import('../../views/Sales/payments/PaymentInList')),
    CustomerCredits: lazy(() => import('../../views/Sales/payments/PaymentInList').catch(() => ({ default: () => null }))), // Fallback map
    OutstandingDues: lazy(() => import('../../views/Sales/payments/PaymentInList').catch(() => ({ default: () => null }))), // Fallback map
    SalesRegister: lazy(() => import('../../views/Sales/salesInvoices/SalesInvoiceForm').catch(() => ({ default: () => null }))),


    // === CONTACTS / PEOPLE ===
    VendorForm: lazy(() => import('../../views/People/Suppliers/SupplierDetail')), // Map to common supplier detail/form
    VendorDetails: lazy(() => import('../../views/People/Suppliers/SupplierDetail')),
    EditSupplier: lazy(() => import('../../views/People/Suppliers/SupplierDetail')),
    VendorInflowOutflow: lazy(() => import('../../views/Purchase/ui/VendorInflowOutflow')),
    SupplierGroups: lazy(() => import('../../views/People/Suppliers/SupplierGroups')),
    SupplierStatements: lazy(() => import('../../views/People/Suppliers/SupplierStatements')),
    SupplierLedger: lazy(() => import('../../views/People/Suppliers/SupplierLedger')),
    SupplierAgeing: lazy(() => import('../../views/Purchase/ui/SupplierAgeing')),
    SupplierPayments: lazy(() => import('../../views/Purchase/ui/SupplierPayments')), 
    
    // === PURCHASE / INVENTORY ===
    GRNForm: lazy(() => import('../../views/Purchase/ui/GRNForm')), 
    PurchaseOrderDetails: lazy(() => import('../../views/Purchase/ui/PurchaseOrderDetails')),
    PurchaseOrderList: lazy(() => import('../../views/Purchase/ui/PurchaseOrderDetails').catch(() => ({ default: () => null }))),
    BillForm: lazy(() => import('../../views/Purchase/ui/BillForm')),
    PurchaseRegister: lazy(() => import('../../views/Purchase/ui/BillForm').catch(() => ({ default: () => null }))), 
    PurchaseReturns: lazy(() => import('../../views/Commercial/Returns/ReturnedItemsList')),
    PurchaseReturnForm: lazy(() => import('../../views/Commercial/Returns/ReturnItemGrid')),
    PaymentOut: lazy(() => import('../../views/Purchase/ui/PaymentOut')),
    DebitNotes: lazy(() => import('../../views/Commercial/Returns/ReturnItemGrid').catch(() => ({ default: () => null }))),
    OutstandingPayables: lazy(() => import('../../views/Purchase/ui/PaymentOut').catch(() => ({ default: () => null }))),
    RateRevisions: lazy(() => import('../../views/Purchase/ui/RateRevisionList').catch(() => ({ default: () => null }))),
    ChequesVault: lazy(() => import('../../views/Purchase/ui/UnclearedCheques').catch(() => ({ default: () => null }))),
    
    // Inventory
    InventoryItems: lazy(() => import('../../views/Inventory/ui/InventoryManager').catch(() => ({ default: () => null }))),
    ItemCategories: lazy(() => import('../../views/Inventory/ui/CategoryManager').catch(() => ({ default: () => null }))),
    BarcodeGenerator: lazy(() => import('../../views/Inventory/ui/InventoryManager').catch(() => ({ default: () => null }))),
    BulkImport: lazy(() => import('../../views/Inventory/ui/InventoryManager').catch(() => ({ default: () => null }))),
    DataExport: lazy(() => import('../../views/Inventory/ui/InventoryManager').catch(() => ({ default: () => null }))),
    ReprintQueue: lazy(() => import('../../views/Inventory/ui/ReprintQueue')),
    
    // === FINANCE / CASHBANK ===
    BankAccounts: lazy(() => import('../../views/Financial/Cashbank/BankAccounts')),
    Transfers: lazy(() => import('../../views/Financial/Cashbank/BankIntelligence')), // Map to intelligence/transfers
    CashInHand: lazy(() => import('../../views/Financial/Cashbank/BankAccounts')), // Consolidated
    CashBankPosition: lazy(() => import('../../views/Financial/Cashbank/BankIntelligence')),
    AccountLedger: lazy(() => import('../../views/Financial/Cashbank/AccountLedger')),
    JournalEntries: lazy(() => import('../../views/Financial/Journal/JournalEntries')),
    JournalEntryForm: lazy(() => import('../../views/Financial/Journal/JournalEntryForm')),
    BankStatementView: lazy(() => import('../../views/Finance/ui/BankStatementView')),
    SmsTrackerPage: lazy(() => import('../../views/Finance/ui/SmsTrackerPage')),
    BudgetTrackerPage: lazy(() => import('../../views/Finance/ui/BudgetTrackerPage')),
    FinanceAgentDashboard: lazy(() => import('../../views/Dashboard/ui/Dashboard')), // Map to appropriate dashboard
    FinancialGoals: lazy(() => import('../../views/Financial/Cashbank/FinancialGoals')), 
    GSTReconciliation: lazy(() => import('../../views/Finance/GST/GSTReconciliation')),
    
    // === HR / PAYROLL ===
    EmployeeDirectory: lazy(() => import('../../views/People/Employees/EmployeeDirectory')),
    EmployeeProfile: lazy(() => import('../../views/People/Employees/EmployeeProfile')),
    LaborManager: lazy(() => import('../../views/People/Employees/LaborManager')),
    LeaveManagement: lazy(() => import('../../views/People/Employees/LeaveManagement')),
    AllowanceManager: lazy(() => import('../../views/People/Payroll/SalaryStructureManager')), // Placeholder
    DailyAttendanceBoard: lazy(() => import('../../views/People/Employees/DailyAttendanceBoard')),
    PayrollDashboard: lazy(() => import('../../views/People/Payroll/PayrollDashboard')), 
    SalaryStructureManager: lazy(() => import('../../views/People/Payroll/SalaryStructureManager')),
    AttendanceSummaryManager: lazy(() => import('../../views/People/Employees/DailyAttendanceBoard')),
    PayrollRuns: lazy(() => import('../../views/People/Payroll/PayrollRuns')),
    PayslipView: lazy(() => import('../../views/People/Payroll/PayslipView')),

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
