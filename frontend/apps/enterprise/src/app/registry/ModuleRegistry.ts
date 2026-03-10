import { lazy } from 'react';

export const LazyModules = {
    // Auth
    Login: lazy(() => import('@/pages/auth/ui/Login')),

    // Dashboard
    Dashboard: lazy(() => import('@/pages/Dashboard/ui/Dashboard')),
    DailyFinanceTracker: lazy(() => import('@/pages/Dashboard/ui/Dashboard')),

    // Sales
    Sales: lazy(() => import('@/pages/Pos/ui/POSModule')),
    SalesInvoiceRegister: lazy(() => import('@/pages/Sales/salesInvoices/SalesInvoice')),
    SalesInvoiceForm: lazy(() => import('@/pages/Sales/salesInvoices/SalesInvoiceForm')),
    SalesInvoiceDetail: lazy(() => import('@/pages/Sales/salesInvoices/SalesInvoiceDetail')),
    EstimateCreator: lazy(() => import('@/pages/Sales/estimates/Estimate')),
    SalesOrderCreator: lazy(() => import('@/pages/Sales/salesOrders/SalesOrder')),
    DeliveryChallanCreator: lazy(() => import('@/pages/Sales/deliveryChallans/DeliveryChallan')),
    SalesReturn: lazy(() => import('@/pages/Sales/returns/Return')),
    PaymentInCreator: lazy(() => import('@/pages/Sales/payments/PaymentInCreator')),
    PaymentInList: lazy(() => import('@/pages/Sales/payments/PaymentInList')),
    ReturnedItemsManager: lazy(() => import('@/pages/Sales/returns/ReturnedItems')),
    CustomerCredits: lazy(() => import('@/pages/People/Customers/CustomerLedger')),
    OutstandingDues: lazy(() => import('@/pages/People/Customers/CustomersWithDues')),

    // Purchase
    Purchase: lazy(() => import('@/pages/Purchase/ui/PurchaseRegister')),
    PurchaseRegister: lazy(() => import('@/pages/Purchase/ui/PurchaseRegister')),
    PurchaseEntry: lazy(() => import('@/pages/Purchase/ui/PurchaseEntry')),
    PurchaseOrdersModule: lazy(() => import('@/pages/Purchase/ui/PurchaseRegister')),
    VendorManager: lazy(() => import('@/pages/People/Suppliers/Suppliers')),
    VendorDetails: lazy(() => import('@/pages/People/Suppliers/SupplierDetail')),
    VendorForm: lazy(() => import('@/pages/People/Suppliers/AddSupplier')),
    GoodsReceived: lazy(() => import('@/pages/Purchase/ui/GoodsReceived')),
    GRNForm: lazy(() => import('@/pages/Purchase/ui/GRNForm')),
    DebitNotes: lazy(() => import('@/pages/Purchase/ui/DebitNotes')),
    SupplierPayments: lazy(() => import('@/pages/Purchase/ui/SupplierPayments')),
    PaymentOut: lazy(() => import('@/pages/Purchase/ui/PaymentOut')),
    OutstandingPayables: lazy(() => import('@/pages/Purchase/ui/OutstandingPayables')),
    Bills: lazy(() => import('@/pages/Purchase/ui/Bills')),
    BillForm: lazy(() => import('@/pages/Purchase/ui/BillForm')),
    PurchaseHistory: lazy(() => import('@/pages/Purchase/ui/PurchaseHistory')),
    PurchaseOrderDetails: lazy(() => import('@/pages/Purchase/ui/PurchaseOrderDetails')),
    PurchaseReturnModule: lazy(() => import('@/pages/Purchase/ui/PurchaseReturn')),
    PurchaseReturns: lazy(() => import('@/pages/Purchase/ui/PurchaseReturns')),
    PurchaseReturnForm: lazy(() => import('@/pages/Purchase/ui/PurchaseReturnForm')),
    PurchaseUpload: lazy(() => import('@/pages/Purchase/ui/PurchaseUpload')),
    SupplierAgeing: lazy(() => import('@/pages/Purchase/ui/SupplierAgeing')),
    VendorInflowOutflow: lazy(() => import('@/pages/Purchase/ui/VendorInflowOutflow')),

    // Inventory
    Inventory: lazy(() => import('@/pages/Inventory/ui/InventoryManager')),
    AgedStockManager: lazy(() => import('@/pages/Inventory/ui/AgedStockManager')),
    ItemCategories: lazy(() => import('@/pages/Inventory/ui/CategoryManager')),
    StockSummary: lazy(() => import('@/pages/Inventory/ui/InventoryManager')),
    StockMovement: lazy(() => import('@/pages/Inventory/ui/InventoryManager')),
    LowStockAlerts: lazy(() => import('@/pages/Inventory/ui/InventoryManager')),
    UnitsHSNAgent: lazy(() => import('@/pages/Inventory/ui/InventoryManager')),
    WarehouseIntelligence: lazy(() => import('@/pages/Inventory/ui/InventoryManager')),
    BatchExpiryIntelligence: lazy(() => import('@/pages/Inventory/ui/InventoryManager')),
    ReprintQueue: lazy(() => import('@/pages/Inventory/ui/ReprintQueue')),

    // Finance
    Finance: lazy(() => import('@/pages/Dashboard/ui/Dashboard')),
    FinanceAgentDashboard: lazy(() => import('@/pages/Dashboard/ui/Dashboard')),
    CashBankIntelligence: lazy(() => import('@/pages/Financial/Cashbank/CashBankPosition')),
    BankIntelligence: lazy(() => import('@/pages/Financial/Cashbank/BankAccounts')),
    BankAccounts: lazy(() => import('@/pages/Financial/Cashbank/BankAccounts')),
    BankSummary: lazy(() => import('@/pages/Financial/Cashbank/BankSummary')),
    BankReconciliationIntelligence: lazy(() => import('@/pages/Financial/Cashbank/BankReconciliation')),
    FundTransferIntelligence: lazy(() => import('@/pages/Financial/Cashbank/Transfers')),
    Transfers: lazy(() => import('@/pages/Financial/Cashbank/Transfers')),
    PettyCashIntelligence: lazy(() => import('@/pages/Financial/Cashbank/PettyCash')),
    CashInHand: lazy(() => import('@/pages/Financial/Cashbank/CashInHand')),
    CashBankPosition: lazy(() => import('@/pages/Financial/Cashbank/CashBankPosition')),
    AccountLedger: lazy(() => import('@/pages/Financial/Cashbank/AccountLedger')),
    JournalEntries: lazy(() => import('@/pages/Financial/Journal/JournalEntries')),
    JournalEntryForm: lazy(() => import('@/pages/Financial/Journal/JournalEntryForm')),
    BankStatementView: lazy(() => import('@/pages/Financial/Cashbank/BankSummary')),
    SmsTrackerPage: lazy(() => import('@/pages/Marketing/ui/SMSMarketing')),
    // @ts-ignore
    BudgetTrackerPage: lazy(() => import('mfe_budget_planner/App')),
    LoanAccounts: lazy(() => import('@/pages/Financial/Cashbank/LoanAccounts')),
    FinancialGoals: lazy(() => import('@/pages/Financial/Cashbank/FinancialGoals')),
    GSTReconciliation: lazy(() => import('@/pages/Dashboard/ui/Dashboard')),

    // POS
    POS: lazy(() => import('@/pages/Pos/ui/POSModule')),
    POSOrdersIntelligence: lazy(() => import('@/pages/Pos/ui/POSOrdersIntelligence')),
    POSReturnsIntelligence: lazy(() => import('@/pages/Pos/ui/POSReturnsIntelligence')),
    ShiftManagementIntelligence: lazy(() => import('@/pages/Pos/ui/ShiftManagementIntelligence')),
    CashDrawerIntelligence: lazy(() => import('@/pages/Pos/ui/CashDrawerIntelligence')),

    // Expenses
    ExpensesModuleFeature: lazy(() => import('@/pages/Expenses/ui/ExpensesModule')),
    ExpenseIntelligence: lazy(() => import('@/pages/Expenses/ui/ExpenseIntelligence')),
    ExpenseCategoriesManager: lazy(() => import('@/pages/Expenses/ui/ExpenseCategoriesManager')),
    RecurringExpensesIntelligence: lazy(() => import('@/pages/Expenses/ui/RecurringExpensesIntelligence')),
    ExpenseReportsIntelligence: lazy(() => import('@/pages/Expenses/ui/ExpenseReportsIntelligence')),

    // Customers & Suppliers
    CustomerList: lazy(() => import('@/pages/People/Customers/CustomerList')),
    CustomerLedger: lazy(() => import('@/pages/People/Customers/CustomerLedger')),
    CustomerStatements: lazy(() => import('@/pages/People/Customers/CustomerStatements')),
    CustomerGroups: lazy(() => import('@/pages/People/Customers/CustomerGroups')),
    LoyaltyPoints: lazy(() => import('@/pages/People/Customers/LoyaltyPoints')),
    AddCustomer: lazy(() => import('@/pages/People/Customers/AddCustomer')),
    CustomerDetail: lazy(() => import('@/pages/People/Customers/CustomerDetail')),
    CustomersPortfolio: lazy(() => import('@/pages/People/Customers/CustomerList')),
    CustomersWithDues: lazy(() => import('@/pages/People/Customers/CustomersWithDues')),
    EditCustomer: lazy(() => import('@/pages/People/Customers/EditCustomer')),
    EditSupplier: lazy(() => import('@/pages/People/Suppliers/EditSupplier')),
    SupplierLedger: lazy(() => import('@/pages/People/Suppliers/SupplierLedger')),
    SupplierStatements: lazy(() => import('@/pages/People/Suppliers/SupplierStatements')),
    SupplierGroups: lazy(() => import('@/pages/People/Suppliers/SupplierGroups')),

    // HR
    LaborManager: lazy(() => import('@/pages/People/Employees/LaborManager')),
    AllowanceManager: lazy(() => import('@/pages/People/Employees/AllowanceManager')),
    EmployeeDirectory: lazy(() => import('@/pages/People/Employees/EmployeeDirectory')),
    EmployeeProfile: lazy(() => import('@/pages/People/Employees/EmployeeProfile')),
    LeaveManagement: lazy(() => import('@/pages/People/Employees/LeaveManagement')),
    DailyAttendanceBoard: lazy(() => import('@/pages/People/Employees/DailyAttendanceBoard')),
    PayrollDashboard: lazy(() => import('@/pages/Dashboard/ui/Dashboard')),
    SalaryStructureManager: lazy(() => import('@/pages/People/Payroll/SalaryStructureManager')),
    AttendanceSummaryManager: lazy(() => import('@/pages/People/Payroll/AttendanceSummaryManager')),
    PayrollRuns: lazy(() => import('@/pages/People/Payroll/PayrollRuns')),
    PayslipView: lazy(() => import('@/pages/People/Payroll/PayslipView')),

    // Growth & Platform
    GrowDashboard: lazy(() => import('@/pages/Dashboard/ui/GrowDashboard')),
    GoogleBusiness: lazy(() => import('@/pages/Business/ui/GoogleBusiness')),
    MarketingMetrics: lazy(() => import('@/pages/Dashboard/ui/MarketingMetrics')),
    OnlinePerformance: lazy(() => import('@/pages/Dashboard/ui/OnlinePerformance')),
    GrowthHub: lazy(() => import('@/pages/Dashboard/ui/GrowthHub')),
    // @ts-ignore
    OnlineStore: lazy(() => import('mfe_online_store/App')),
    MarketingCampaigns: lazy(() => import('@/pages/Marketing/ui/MarketingCampaigns')),
    MarketingTemplates: lazy(() => import('@/pages/Marketing/ui/MarketingTemplates')),
    EmailMarketing: lazy(() => import('@/pages/Marketing/ui/EmailMarketing')),
    WhatsAppMarketing: lazy(() => import('@/pages/Business/ui/WhatsAppMarketing')),
    SocialMediaMarketing: lazy(() => import('@/pages/Marketing/ui/SocialMediaMarketing')),
    MarketingTools: lazy(() => import('@/pages/Business/ui/MarketingTools')),
    MarketingCoupons: lazy(() => import('@/pages/Marketing/ui/MarketingCoupons')),
    MarketingOffers: lazy(() => import('@/pages/Marketing/ui/MarketingOffers')),
    WhatsAppEngagement: lazy(() => import('@/pages/CustomerEngagement/ui/WhatsAppEngagement')),
    SMSMarketing: lazy(() => import('@/pages/Marketing/ui/SMSMarketing')),
    EmailEngagement: lazy(() => import('@/pages/CustomerEngagement/ui/EmailEngagement')),
    LoyaltyEngagement: lazy(() => import('@/pages/CustomerEngagement/ui/LoyaltyEngagement')),
    FeedbackEngagement: lazy(() => import('@/pages/CustomerEngagement/ui/FeedbackEngagement')),
    DeviceIntelligence: lazy(() => import('@/pages/System/Sync/DeviceIntelligence')),
    Sync: lazy(() => import('@/pages/System/Sync/index')),
    GrowReports: lazy(() => import('@/pages/Dashboard/ui/GrowDashboard')),
    TenantArchitect: lazy(() => import('@/pages/System/Architecture/TenantArchitect')),

    // System
    Reports: lazy(() => import('@/pages/Reports/ui/ReportsDashboard')),
    Settings: lazy(() => import('@/pages/System/Settings/Settings')),
    Data: lazy(() => import('@/pages/System/Data/index')),
    SyncModule: lazy(() => import('@/pages/System/Sync/index')),
    AuditLogs: lazy(() => import('@/pages/System/Audit/AuditLogViewer')),
    Architecture: lazy(() => import('@/pages/System/Architecture/ArchitectureIntelligence')),
    TenantManagement: lazy(() => import('@/pages/People/Tenants/TenantManager')),
    SuperAdminGrowthConsole: lazy(() => import('@/pages/System/Architecture/SuperAdminGrowthConsole')),
    Storefront: lazy(() => import('@/pages/OnlineStore/ui/Storefront')),
    SalesModulePlaceholder: lazy(() => import('@/features/pos-checkout/ui/SalesModulePlaceholder')),
};

export const preloadByViewId = (viewId: string) => {
    console.log(`Preloading module for ${viewId}`);
    // Optional: Add logic to find and call the dynamic import
};
