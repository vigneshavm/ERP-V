import { lazy } from 'react';

// All lazy imports must point to their real component.
// Never use .catch(() => ({ default: () => null })) — use ErrorBoundary instead.
export const LazyModules = {
    // === AUTH ===
    Login:      lazy(() => import('../../pages/auth/ui/Login')),
    AdminLogin: lazy(() => import('../../features/auth-by-email/ui/AdminLogin')),

    // === DASHBOARD ===
    Dashboard:   lazy(() => import('../../pages/Dashboard/ui/Dashboard')),
    GrowDashboard: lazy(() => import('../../pages/Dashboard/ui/GrowDashboard')),
    GrowthHub:   lazy(() => import('../../pages/Dashboard/ui/GrowthHub')),

    // === SALES ===
    SalesInvoiceForm:   lazy(() => import('../../pages/Sales/salesInvoices/SalesInvoiceForm')),
    SalesInvoiceDetail: lazy(() => import('../../pages/Sales/salesInvoices/SalesInvoiceDetail')),
    SalesOrderList:     lazy(() => import('../../pages/Sales/salesOrders/SalesOrderList')),
    SalesOrderDetail:   lazy(() => import('../../pages/Sales/salesOrders/SalesOrderDetail')),
    EstimateList:       lazy(() => import('../../pages/Sales/estimates/EstimateList')),
    EstimateDetail:     lazy(() => import('../../pages/Sales/estimates/EstimateDetail')),
    DeliveryChallanList:   lazy(() => import('../../pages/Sales/deliveryChallans/DeliveryChallanList')),
    DeliveryChallanDetail: lazy(() => import('../../pages/Sales/deliveryChallans/DeliveryChallanDetail')),
    SalesReturnsList:   lazy(() => import('../../pages/Sales/returns/ReturnedItems')),
    PaymentInList:      lazy(() => import('../../pages/Sales/payments/PaymentInList')),
    PaymentInCreator:   lazy(() => import('../../pages/Sales/payments/PaymentInCreator')),

    // === POS ===
    POSModule:          lazy(() => import('../../pages/Pos/ui/POSModule')),
    POSCustomerDisplay: lazy(() => import('../../pages/Pos/ui/POSCustomerDisplay')),
    POSOrdersIntelligence:  lazy(() => import('../../pages/Pos/ui/POSOrdersIntelligence')),
    POSReturnsIntelligence: lazy(() => import('../../pages/Pos/ui/POSReturnsIntelligence')),
    ShiftManagement:    lazy(() => import('../../pages/Pos/ui/ShiftManagementIntelligence')),

    // === SUPPLIERS ===
    SupplierList:      lazy(() => import('../../pages/People/Suppliers/Suppliers')),
    SupplierDetail:    lazy(() => import('../../pages/People/Suppliers/SupplierDetail')),
    SupplierGroups:    lazy(() => import('../../pages/People/Suppliers/SupplierGroups')),
    SupplierStatements:lazy(() => import('../../pages/People/Suppliers/SupplierStatements')),
    SupplierLedger:    lazy(() => import('../../pages/People/Suppliers/SupplierLedger')),
    SupplierAgeing:    lazy(() => import('../../pages/Purchase/ui/SupplierAgeing')),
    SupplierPayments:  lazy(() => import('../../pages/Purchase/ui/SupplierPayments')),
    VendorInflowOutflow: lazy(() => import('../../pages/Purchase/ui/VendorInflowOutflow')),

    // === CUSTOMERS ===
    CustomerList:    lazy(() => import('../../pages/People/Customers/CustomerList')),
    CustomerDetail:  lazy(() => import('../../pages/People/Customers/CustomerDetail')),
    CustomerLedger:  lazy(() => import('../../pages/People/Customers/CustomerLedger')),

    // === PURCHASE ===
    GRNForm:              lazy(() => import('../../pages/Purchase/ui/GRNForm')),
    GoodsReceived:        lazy(() => import('../../pages/Purchase/ui/GoodsReceived')),
    PurchaseOrderList:    lazy(() => import('../../pages/Purchase/ui/PurchaseOrderList')),
    PurchaseOrderDetails: lazy(() => import('../../pages/Purchase/ui/PurchaseOrderDetails')),
    PurchaseEntry:        lazy(() => import('../../pages/Purchase/ui/PurchaseEntry')),
    PurchaseHistory:      lazy(() => import('../../pages/Purchase/ui/PurchaseHistory')),
    BillForm:             lazy(() => import('../../pages/Purchase/ui/BillForm')),
    Bills:                lazy(() => import('../../pages/Purchase/ui/Bills')),
    PurchaseReturns:      lazy(() => import('../../pages/Purchase/ui/PurchaseReturns')),
    PurchaseReturnForm:   lazy(() => import('../../pages/Purchase/ui/PurchaseReturnForm')),
    DebitNotes:           lazy(() => import('../../pages/Purchase/ui/DebitNotes')),
    PaymentOut:           lazy(() => import('../../pages/Purchase/ui/PaymentOut')),
    PaymentOutList:       lazy(() => import('../../pages/Purchase/ui/PaymentOutList')),
    OutstandingPayables:  lazy(() => import('../../pages/Purchase/ui/OutstandingPayables')),
    PayableSnapshot:      lazy(() => import('../../pages/Purchase/ui/PayableSnapshot')),
    RateRevisionList:     lazy(() => import('../../pages/Purchase/ui/RateRevisionList')),
    RateRevisionForm:     lazy(() => import('../../pages/Purchase/ui/RateRevisionForm')),
    UnclearedCheques:     lazy(() => import('../../pages/Purchase/ui/UnclearedCheques')),

    // === INVENTORY ===
    InventoryManager: lazy(() => import('../../pages/Inventory/ui/InventoryManager')),
    CategoryManager:  lazy(() => import('../../pages/Inventory/ui/CategoryManager')),
    BarcodeGenerator: lazy(() => import('../../features/system/barcode-generator/ui/BarcodeGeneratorFeature')),
    BulkImport:       lazy(() => import('../../features/system/bulk-import/ui/BulkImportFeature')),
    DataExport:       lazy(() => import('../../features/system/data-export/ui/DataExportFeature')),
    ReprintQueue:     lazy(() => import('../../pages/Inventory/ui/ReprintQueue')),
    AgedStockManager: lazy(() => import('../../pages/Inventory/ui/AgedStockManager')),
    BatchPriceUpdate: lazy(() => import('../../pages/Inventory/ui/BatchPriceUpdate')),

    // === FINANCE / CASHBANK ===
    BankAccounts:        lazy(() => import('../../pages/Financial/Cashbank/BankAccounts')),
    CashInHand:          lazy(() => import('../../pages/Financial/Cashbank/CashInHand')),
    FundTransfers:       lazy(() => import('../../pages/Financial/Cashbank/Transfers')),
    BankReconciliation:  lazy(() => import('../../pages/Financial/Cashbank/BankReconciliation')),
    BankSummary:         lazy(() => import('../../pages/Financial/Cashbank/BankSummary')),
    AccountLedger:       lazy(() => import('../../pages/Financial/Cashbank/AccountLedger')),
    LoanAccounts:        lazy(() => import('../../pages/Financial/Cashbank/LoanAccounts')),
    PettyCash:           lazy(() => import('../../pages/Financial/Cashbank/PettyCash')),
    FinancialGoals:      lazy(() => import('../../pages/Financial/Cashbank/FinancialGoals')),
    DayEndReconciliation:lazy(() => import('../../pages/Financial/Cashbank/DayEndReconciliation')),
    JournalEntries:      lazy(() => import('../../pages/Financial/Journal/JournalEntries')),
    JournalEntryForm:    lazy(() => import('../../pages/Financial/Journal/JournalEntryForm')),
    // Finance/ views (merged into Financial/ — see folder structure)
    BankStatementView:   lazy(() => import('../../pages/Financial/ui/BankStatementView')),
    SmsTrackerPage:      lazy(() => import('../../pages/Financial/ui/SmsTrackerPage')),
    BudgetTrackerPage:   lazy(() => import('../../pages/Financial/ui/BudgetTrackerPage')),
    GSTReconciliation:   lazy(() => import('../../pages/Financial/GST/GSTReconciliation')),
    TDSManager:          lazy(() => import('../../pages/Financial/Tax/TDSManager')),
    ChequeLedger:        lazy(() => import('../../pages/Financial/ui/ChequeLedger')),
    DueAdjustment:       lazy(() => import('../../pages/Financial/ui/DueAdjustment')),

    // === EXPENSES ===
    ExpensesModule:            lazy(() => import('../../pages/Expenses/ui/ExpensesModule')),
    ExpenseCategoriesManager:  lazy(() => import('../../pages/Expenses/ui/ExpenseCategoriesManager')),
    RecurringExpenses:         lazy(() => import('../../pages/Expenses/ui/RecurringExpensesIntelligence')),
    ExpenseReports:            lazy(() => import('../../pages/Expenses/ui/ExpenseReportsIntelligence')),
    ExpenseDashboard:          lazy(() => import('../../pages/Expenses/ui/ExpenseDashboard')),

    // === HR / PAYROLL ===
    EmployeeDirectory:      lazy(() => import('../../pages/People/Employees/EmployeeDirectory')),
    EmployeeProfile:        lazy(() => import('../../pages/People/Employees/EmployeeProfile')),
    LaborManager:           lazy(() => import('../../pages/People/Employees/LaborManager')),
    LeaveManagement:        lazy(() => import('../../pages/People/Employees/LeaveManagement')),
    AllowanceManager:       lazy(() => import('../../pages/People/Employees/AllowanceManager')),
    DailyAttendanceBoard:   lazy(() => import('../../pages/People/Employees/DailyAttendanceBoard')),
    AttendanceSummary:      lazy(() => import('../../pages/People/Payroll/AttendanceSummaryManager')),
    PayrollDashboard:       lazy(() => import('../../pages/People/Payroll/PayrollDashboard')),
    SalaryStructureManager: lazy(() => import('../../pages/People/Payroll/SalaryStructureManager')),
    PayrollRuns:            lazy(() => import('../../pages/People/Payroll/PayrollRuns')),
    PayslipView:            lazy(() => import('../../pages/People/Payroll/PayslipView')),

    // === SYSTEM / SETTINGS ===
    Settings:         lazy(() => import('../../pages/System/Settings/Settings')),
    AuditLogViewer:   lazy(() => import('../../pages/System/Audit/AuditLogViewer')),
    TenantArchitect:  lazy(() => import('../../pages/System/Architecture/TenantArchitect')),
    SuperAdminConsole:lazy(() => import('../../pages/System/Architecture/SuperAdminGrowthConsole')),

    // === REPORTS ===
    ReportsDashboard: lazy(() => import('../../pages/Reports/ui/ReportsDashboard')),
};
