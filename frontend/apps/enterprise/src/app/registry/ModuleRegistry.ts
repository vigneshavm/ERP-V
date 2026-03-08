import { lazy } from 'react';

export const LazyModules = {
    // Auth
    Login: lazy(() => import('../../pages/auth/Login')),

    // Dashboard
    Dashboard: lazy(() => import('../../pages/Views/Dashboard')),
    DailyFinanceTracker: lazy(() => import('../../pages/Views/DailyFinanceTracker')),

    // Sales
    Sales: lazy(() => import('../../pages/Pos/Sales')),
    SalesInvoiceRegister: lazy(() => import('../../pages/Pos/Invoices/SalesInvoiceRegister')),
    SalesInvoiceForm: lazy(() => import('../../pages/Pos/Invoices/SalesInvoiceForm')),
    SalesInvoiceDetail: lazy(() => import('../../pages/Pos/Invoices/SalesInvoiceDetail')),
    EstimateCreator: lazy(() => import('../../pages/Pos/Estimates/EstimateCreator')),
    SalesOrderCreator: lazy(() => import('../../pages/Pos/Orders/SalesOrderCreator')),
    DeliveryChallanCreator: lazy(() => import('../../pages/Pos/Challans/DeliveryChallanCreator')),
    SalesReturn: lazy(() => import('../../pages/Pos/Returns/SalesReturn')),
    PaymentInCreator: lazy(() => import('../../pages/Pos/Payments/PaymentInCreator')),
    PaymentInList: lazy(() => import('../../pages/Pos/Payments/PaymentInList')),
    ReturnedItemsManager: lazy(() => import('../../pages/Pos/Returns/ReturnedItemsManager')),
    CustomerCredits: lazy(() => import('../../pages/Pos/Customers/CustomerCredits')),
    OutstandingDues: lazy(() => import('../../pages/Pos/Customers/OutstandingDues')),

    // Purchase
    Purchase: lazy(() => import('../../pages/Purchase/Purchase')),
    PurchaseRegister: lazy(() => import('../../pages/Purchase/PurchaseRegister')),
    PurchaseEntry: lazy(() => import('../../pages/Purchase/PurchaseEntry')),
    PurchaseOrdersModule: lazy(() => import('../../pages/Purchase/PurchaseOrders')),
    VendorManager: lazy(() => import('../../pages/Purchase/Vendors/VendorManager')),
    VendorDetails: lazy(() => import('../../pages/Purchase/Vendors/VendorDetails')),
    VendorForm: lazy(() => import('../../pages/Purchase/Vendors/VendorForm')),
    GoodsReceived: lazy(() => import('../../pages/Purchase/GRN/GoodsReceived')),
    GRNForm: lazy(() => import('../../pages/Purchase/GRN/GRNForm')),
    DebitNotes: lazy(() => import('../../pages/Purchase/DebitNotes')),
    SupplierPayments: lazy(() => import('../../pages/Purchase/Payments/SupplierPayments')),
    PaymentOut: lazy(() => import('../../pages/Purchase/Payments/PaymentOut')),
    OutstandingPayables: lazy(() => import('../../pages/Purchase/OutstandingPayables')),
    Bills: lazy(() => import('../../pages/Purchase/Bills/Bills')),
    BillForm: lazy(() => import('../../pages/Purchase/Bills/BillForm')),
    PurchaseHistory: lazy(() => import('../../pages/Purchase/PurchaseHistory')),
    PurchaseOrderDetails: lazy(() => import('../../pages/Purchase/PurchaseOrderDetails')),
    PurchaseReturnModule: lazy(() => import('../../pages/Purchase/Returns/PurchaseReturn')),
    PurchaseReturns: lazy(() => import('../../pages/Purchase/Returns/PurchaseReturns')),
    PurchaseReturnForm: lazy(() => import('../../pages/Purchase/Returns/PurchaseReturnForm')),
    PurchaseUpload: lazy(() => import('../../pages/Purchase/PurchaseUpload')),
    SupplierAgeing: lazy(() => import('../../pages/Purchase/SupplierAgeing')),
    VendorInflowOutflow: lazy(() => import('../../pages/Purchase/VendorInflowOutflow')),

    // Inventory
    Inventory: lazy(() => import('../../pages/Inventory/Inventory')),
    AgedStockManager: lazy(() => import('../../pages/Inventory/AgedStock')),
    ItemCategories: lazy(() => import('../../pages/Inventory/Categories')),
    StockSummary: lazy(() => import('../../pages/Inventory/StockSummary')),
    StockMovement: lazy(() => import('../../pages/Inventory/StockMovement')),
    LowStockAlerts: lazy(() => import('../../pages/Inventory/LowStockAlerts')),
    UnitsHSNAgent: lazy(() => import('../../pages/Inventory/UnitsHSN')),
    WarehouseIntelligence: lazy(() => import('../../pages/Inventory/Warehouses')),
    BatchExpiryIntelligence: lazy(() => import('../../pages/Inventory/BatchExpiry')),
    ReprintQueue: lazy(() => import('../../pages/Inventory/ReprintQueue')),

    // Finance
    Finance: lazy(() => import('../../pages/Finance/Finance')),
    FinanceAgentDashboard: lazy(() => import('../../pages/Finance/FinanceAgent')),
    CashBankIntelligence: lazy(() => import('../../pages/Finance/CashBank')),
    BankIntelligence: lazy(() => import('../../pages/Finance/Banks')),
    BankAccounts: lazy(() => import('../../pages/Finance/BankAccounts')),
    BankSummary: lazy(() => import('../../pages/Finance/BankSummary')),
    BankReconciliationIntelligence: lazy(() => import('../../pages/Finance/Reconciliation')),
    FundTransferIntelligence: lazy(() => import('../../pages/Finance/Transfers')),
    Transfers: lazy(() => import('../../pages/Finance/Transfers')),
    PettyCashIntelligence: lazy(() => import('../../pages/Finance/PettyCash')),
    CashInHand: lazy(() => import('../../pages/Finance/CashInHand')),
    CashBankPosition: lazy(() => import('../../pages/Finance/CashBankPosition')),
    AccountLedger: lazy(() => import('../../pages/Finance/AccountLedger')),
    JournalEntries: lazy(() => import('../../pages/Finance/JournalEntries')),
    JournalEntryForm: lazy(() => import('../../pages/Finance/JournalEntryForm')),
    BankStatementView: lazy(() => import('../../pages/Finance/BankStatement')),
    SmsTrackerPage: lazy(() => import('../../pages/Finance/SmsTracker')),
    // @ts-ignore
    BudgetTrackerPage: lazy(() => import('mfe_budget_planner/App')),
    LoanAccounts: lazy(() => import('../../pages/Finance/Loans')),
    FinancialGoals: lazy(() => import('../../pages/Finance/Goals')),
    GSTReconciliation: lazy(() => import('../../pages/Finance/GST')),

    // POS
    POS: lazy(() => import('../../pages/Pos/POS')),
    POSOrdersIntelligence: lazy(() => import('../../pages/Pos/POSOrders')),
    POSReturnsIntelligence: lazy(() => import('../../pages/Pos/POSReturns')),
    ShiftManagementIntelligence: lazy(() => import('../../pages/Pos/Shifts')),
    CashDrawerIntelligence: lazy(() => import('../../pages/Pos/CashDrawer')),

    // Expenses
    ExpensesModuleFeature: lazy(() => import('../../pages/Expenses/Expenses')),
    ExpenseIntelligence: lazy(() => import('../../pages/Expenses/Analytics')),
    ExpenseCategoriesManager: lazy(() => import('../../pages/Expenses/Categories')),
    RecurringExpensesIntelligence: lazy(() => import('../../pages/Expenses/Recurring')),
    ExpenseReportsIntelligence: lazy(() => import('../../pages/Expenses/Reports')),

    // Customers & Suppliers
    CustomerList: lazy(() => import('../../pages/People/Customers/CustomerList')),
    CustomerLedger: lazy(() => import('../../pages/People/Customers/CustomerLedger')),
    CustomerStatements: lazy(() => import('../../pages/People/Customers/CustomerStatements')),
    CustomerGroups: lazy(() => import('../../pages/People/Customers/CustomerGroups')),
    LoyaltyPoints: lazy(() => import('../../pages/People/Customers/LoyaltyPoints')),
    AddCustomer: lazy(() => import('../../pages/People/Customers/AddCustomer')),
    CustomerDetail: lazy(() => import('../../pages/People/Customers/CustomerDetail')),
    CustomersPortfolio: lazy(() => import('../../pages/People/Customers/CustomersPortfolio')),
    CustomersWithDues: lazy(() => import('../../pages/People/Customers/CustomersWithDues')),
    EditCustomer: lazy(() => import('../../pages/People/Customers/EditCustomer')),
    EditSupplier: lazy(() => import('../../pages/Purchase/Vendors/EditSupplier')),
    SupplierLedger: lazy(() => import('../../pages/Purchase/Vendors/SupplierLedger')),
    SupplierStatements: lazy(() => import('../../pages/Purchase/Vendors/SupplierStatements')),
    SupplierGroups: lazy(() => import('../../pages/Purchase/Vendors/SupplierGroups')),

    // HR
    LaborManager: lazy(() => import('../../pages/HR/LaborManager')),
    AllowanceManager: lazy(() => import('../../pages/HR/AllowanceManager')),
    EmployeeDirectory: lazy(() => import('../../pages/HR/EmployeeDirectory')),
    EmployeeProfile: lazy(() => import('../../pages/HR/EmployeeProfile')),
    LeaveManagement: lazy(() => import('../../pages/HR/LeaveManagement')),
    DailyAttendanceBoard: lazy(() => import('../../pages/HR/AttendanceBoard')),
    PayrollDashboard: lazy(() => import('../../pages/HR/Payroll/Dashboard')),
    SalaryStructureManager: lazy(() => import('../../pages/HR/Payroll/Structure')),
    AttendanceSummaryManager: lazy(() => import('../../pages/HR/Payroll/Attendance')),
    PayrollRuns: lazy(() => import('../../pages/HR/Payroll/Runs')),
    PayslipView: lazy(() => import('../../pages/HR/Payroll/Payslip')),

    // Growth & Platform
    GrowDashboard: lazy(() => import('../../pages/Growth/GrowDashboard')),
    GoogleBusiness: lazy(() => import('../../pages/Growth/GoogleBusiness')),
    MarketingMetrics: lazy(() => import('../../pages/Growth/MarketingMetrics')),
    OnlinePerformance: lazy(() => import('../../pages/Growth/OnlinePerformance')),
    GrowthHub: lazy(() => import('../../pages/Growth/GrowthHub')),
    // @ts-ignore
    OnlineStore: lazy(() => import('mfe_online_store/App')),
    MarketingCampaigns: lazy(() => import('../../pages/Growth/MarketingCampaigns')),
    MarketingTemplates: lazy(() => import('../../pages/Growth/MarketingTemplates')),
    EmailMarketing: lazy(() => import('../../pages/Growth/EmailMarketing')),
    WhatsAppMarketing: lazy(() => import('../../pages/Growth/WhatsAppMarketing')),
    SocialMediaMarketing: lazy(() => import('../../pages/Growth/SocialMediaMarketing')),
    MarketingTools: lazy(() => import('../../pages/Growth/MarketingTools')),
    MarketingCoupons: lazy(() => import('../../pages/Growth/MarketingCoupons')),
    MarketingOffers: lazy(() => import('../../pages/Growth/MarketingOffers')),
    WhatsAppEngagement: lazy(() => import('../../pages/Growth/WhatsAppEngagement')),
    SMSMarketing: lazy(() => import('../../pages/Growth/SMSMarketing')),
    EmailEngagement: lazy(() => import('../../pages/Growth/EmailEngagement')),
    LoyaltyEngagement: lazy(() => import('../../pages/Growth/LoyaltyEngagement')),
    FeedbackEngagement: lazy(() => import('../../pages/Growth/FeedbackEngagement')),
    DeviceIntelligence: lazy(() => import('../../pages/Sync/DeviceIntelligence')),
    Sync: lazy(() => import('../../pages/Sync/Sync')),
    GrowReports: lazy(() => import('../../pages/Growth/GrowReports')),
    TenantArchitect: lazy(() => import('../../pages/Architecture/TenantArchitect')),

    // System
    Reports: lazy(() => import('../../pages/Reports/Reports')),
    Settings: lazy(() => import('../../pages/Settings/Settings')),
    Data: lazy(() => import('../../pages/Data/Data')),
    SyncModule: lazy(() => import('../../pages/Sync/Sync')),
    AuditLogs: lazy(() => import('../../pages/Settings/AuditLogs')),
    Architecture: lazy(() => import('../../pages/Architecture/Architecture')),
    TenantManagement: lazy(() => import('../../pages/Architecture/TenantManagement')),
    SuperAdminGrowthConsole: lazy(() => import('../../pages/Architecture/SuperAdmin')),
    Storefront: lazy(() => import('../../pages/Storefront/Storefront')),
    SalesModulePlaceholder: lazy(() => import('../../pages/Pos/SalesModulePlaceholder')),
};

export const preloadByViewId = (viewId: string) => {
    console.log(`Preloading module for ${viewId}`);
    // Optional: Add logic to find and call the dynamic import
};
