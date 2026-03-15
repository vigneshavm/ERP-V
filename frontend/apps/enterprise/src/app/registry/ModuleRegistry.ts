import { logger } from '@/shared/lib/logger';
import { lazy } from 'react';

export const LazyModules = {
    // Auth
    Login: lazy(() => import('@/views/auth/ui/Login')),

    // Dashboard
    Dashboard: lazy(() => import('@/views/Dashboard/ui/Dashboard')),
    DailyFinanceTracker: lazy(() => import('@/views/Dashboard/ui/Dashboard')),

    // Sales
    Sales: lazy(() => import('@/views/Pos/ui/POSModule')),
    SalesInvoiceRegister: lazy(() => import('@/views/Sales/salesInvoices/SalesInvoice')),
    SalesInvoiceForm: lazy(() => import('@/views/Sales/salesInvoices/SalesInvoiceForm')),
    SalesInvoiceDetail: lazy(() => import('@/views/Sales/salesInvoices/SalesInvoiceDetail')),
    EstimateCreator: lazy(() => import('@/views/Sales/estimates/Estimate')),
    SalesOrderCreator: lazy(() => import('@/views/Sales/salesOrders/SalesOrder')),
    DeliveryChallanCreator: lazy(() => import('@/views/Sales/deliveryChallans/DeliveryChallan')),
    SalesReturn: lazy(() => import('@/views/Sales/returns/Return')),
    PaymentInCreator: lazy(() => import('@/views/Sales/payments/PaymentInCreator')),
    PaymentInList: lazy(() => import('@/views/Sales/payments/PaymentInList')),
    ReturnedItemsManager: lazy(() => import('@/views/Sales/returns/ReturnedItems')),
    CustomerCredits: lazy(() => import('@/views/People/Customers/CustomerLedger')),
    OutstandingDues: lazy(() => import('@/views/People/Customers/CustomersWithDues')),

    // Purchase
    Purchase: lazy(() => import('@/views/Purchase/ui/PurchaseRegister')),
    PurchaseRegister: lazy(() => import('@/views/Purchase/ui/PurchaseRegister')),
    PurchaseEntry: lazy(() => import('@/views/Purchase/ui/PurchaseEntry')),
    PurchaseOrdersModule: lazy(() => import('@/views/Purchase/ui/PurchaseRegister')),
    VendorManager: lazy(() => import('@/views/People/Suppliers/Suppliers')),
    VendorDetails: lazy(() => import('@/views/People/Suppliers/SupplierDetail')),
    VendorForm: lazy(() => import('@/views/People/Suppliers/AddSupplier')),
    GoodsReceived: lazy(() => import('@/views/Purchase/ui/GoodsReceived')),
    GRNForm: lazy(() => import('@/views/Purchase/ui/GRNForm')),
    DebitNotes: lazy(() => import('@/views/Purchase/ui/DebitNotes')),
    SupplierPayments: lazy(() => import('@/views/Purchase/ui/SupplierPayments')),
    PaymentOut: lazy(() => import('@/views/Purchase/ui/PaymentOut')),
    OutstandingPayables: lazy(() => import('@/views/Purchase/ui/OutstandingPayables')),
    Bills: lazy(() => import('@/views/Purchase/ui/Bills')),
    BillForm: lazy(() => import('@/views/Purchase/ui/BillForm')),
    PurchaseHistory: lazy(() => import('@/views/Purchase/ui/PurchaseHistory')),
    PurchaseOrderDetails: lazy(() => import('@/views/Purchase/ui/PurchaseOrderDetails')),
    PurchaseReturnModule: lazy(() => import('@/views/Purchase/ui/PurchaseReturn')),
    PurchaseReturns: lazy(() => import('@/views/Purchase/ui/PurchaseReturns')),
    PurchaseReturnForm: lazy(() => import('@/views/Purchase/ui/PurchaseReturnForm')),
    PurchaseUpload: lazy(() => import('@/views/Purchase/ui/PurchaseUpload')),
    SupplierAgeing: lazy(() => import('@/views/Purchase/ui/SupplierAgeing')),
    VendorInflowOutflow: lazy(() => import('@/views/Purchase/ui/VendorInflowOutflow')),

    // Inventory
    Inventory: lazy(() => import('@/views/Inventory/ui/InventoryManager')),
    AgedStockManager: lazy(() => import('@/views/Inventory/ui/AgedStockManager')),
    ItemCategories: lazy(() => import('@/views/Inventory/ui/CategoryManager')),
    StockSummary: lazy(() => import('@/views/Inventory/ui/InventoryManager')),
    StockMovement: lazy(() => import('@/views/Inventory/ui/InventoryManager')),
    LowStockAlerts: lazy(() => import('@/views/Inventory/ui/InventoryManager')),
    UnitsHSNAgent: lazy(() => import('@/views/Inventory/ui/InventoryManager')),
    WarehouseIntelligence: lazy(() => import('@/views/Inventory/ui/InventoryManager')),
    BatchExpiryIntelligence: lazy(() => import('@/views/Inventory/ui/InventoryManager')),
    ReprintQueue: lazy(() => import('@/views/Inventory/ui/ReprintQueue')),

    // Finance
    Finance: lazy(() => import('@/views/Dashboard/ui/Dashboard')),
    FinanceAgentDashboard: lazy(() => import('@/views/Dashboard/ui/Dashboard')),
    CashBankIntelligence: lazy(() => import('@/views/Financial/Cashbank/CashBankPosition')),
    BankIntelligence: lazy(() => import('@/views/Financial/Cashbank/BankAccounts')),
    BankAccounts: lazy(() => import('@/views/Financial/Cashbank/BankAccounts')),
    BankSummary: lazy(() => import('@/views/Financial/Cashbank/BankSummary')),
    BankReconciliationIntelligence: lazy(() => import('@/views/Financial/Cashbank/BankReconciliation')),
    FundTransferIntelligence: lazy(() => import('@/views/Financial/Cashbank/Transfers')),
    Transfers: lazy(() => import('@/views/Financial/Cashbank/Transfers')),
    PettyCashIntelligence: lazy(() => import('@/views/Financial/Cashbank/PettyCash')),
    CashInHand: lazy(() => import('@/views/Financial/Cashbank/CashInHand')),
    CashBankPosition: lazy(() => import('@/views/Financial/Cashbank/CashBankPosition')),
    AccountLedger: lazy(() => import('@/views/Financial/Cashbank/AccountLedger')),
    JournalEntries: lazy(() => import('@/views/Financial/Journal/JournalEntries')),
    JournalEntryForm: lazy(() => import('@/views/Financial/Journal/JournalEntryForm')),
    BankStatementView: lazy(() => import('@/views/Financial/Cashbank/BankSummary')),
    SmsTrackerPage: lazy(() => import('@/views/Marketing/ui/SMSMarketing')),
    // @ts-ignore
    BudgetTrackerPage: lazy(() => import('@/views/Finance/ui/BudgetTrackerPage')),
    LoanAccounts: lazy(() => import('@/views/Financial/Cashbank/LoanAccounts')),
    FinancialGoals: lazy(() => import('@/views/Financial/Cashbank/FinancialGoals')),
    GSTReconciliation: lazy(() => import('@/views/Dashboard/ui/Dashboard')),

    // POS
    POS: lazy(() => import('@/views/Pos/ui/POSModule')),
    POSOrdersIntelligence: lazy(() => import('@/views/Pos/ui/POSOrdersIntelligence')),
    POSReturnsIntelligence: lazy(() => import('@/views/Pos/ui/POSReturnsIntelligence')),
    ShiftManagementIntelligence: lazy(() => import('@/views/Pos/ui/ShiftManagementIntelligence')),
    CashDrawerIntelligence: lazy(() => import('@/views/Pos/ui/CashDrawerIntelligence')),

    // Expenses
    ExpensesModuleFeature: lazy(() => import('@/views/Expenses/ui/ExpensesModule')),
    ExpenseIntelligence: lazy(() => import('@/views/Expenses/ui/ExpenseIntelligence')),
    ExpenseCategoriesManager: lazy(() => import('@/views/Expenses/ui/ExpenseCategoriesManager')),
    RecurringExpensesIntelligence: lazy(() => import('@/views/Expenses/ui/RecurringExpensesIntelligence')),
    ExpenseReportsIntelligence: lazy(() => import('@/views/Expenses/ui/ExpenseReportsIntelligence')),

    // Customers & Suppliers
    CustomerList: lazy(() => import('@/views/People/Customers/CustomerList')),
    CustomerLedger: lazy(() => import('@/views/People/Customers/CustomerLedger')),
    CustomerStatements: lazy(() => import('@/views/People/Customers/CustomerStatements')),
    CustomerGroups: lazy(() => import('@/views/People/Customers/CustomerGroups')),
    LoyaltyPoints: lazy(() => import('@/views/People/Customers/LoyaltyPoints')),
    AddCustomer: lazy(() => import('@/views/People/Customers/AddCustomer')),
    CustomerDetail: lazy(() => import('@/views/People/Customers/CustomerDetail')),
    CustomersPortfolio: lazy(() => import('@/views/People/Customers/CustomerList')),
    CustomersWithDues: lazy(() => import('@/views/People/Customers/CustomersWithDues')),
    EditCustomer: lazy(() => import('@/views/People/Customers/EditCustomer')),
    EditSupplier: lazy(() => import('@/views/People/Suppliers/EditSupplier')),
    SupplierLedger: lazy(() => import('@/views/People/Suppliers/SupplierLedger')),
    SupplierStatements: lazy(() => import('@/views/People/Suppliers/SupplierStatements')),
    SupplierGroups: lazy(() => import('@/views/People/Suppliers/SupplierGroups')),

    // HR
    LaborManager: lazy(() => import('@/views/People/Employees/LaborManager')),
    AllowanceManager: lazy(() => import('@/views/People/Employees/AllowanceManager')),
    EmployeeDirectory: lazy(() => import('@/views/People/Employees/EmployeeDirectory')),
    EmployeeProfile: lazy(() => import('@/views/People/Employees/EmployeeProfile')),
    LeaveManagement: lazy(() => import('@/views/People/Employees/LeaveManagement')),
    DailyAttendanceBoard: lazy(() => import('@/views/People/Employees/DailyAttendanceBoard')),
    PayrollDashboard: lazy(() => import('@/views/Dashboard/ui/Dashboard')),
    SalaryStructureManager: lazy(() => import('@/views/People/Payroll/SalaryStructureManager')),
    AttendanceSummaryManager: lazy(() => import('@/views/People/Payroll/AttendanceSummaryManager')),
    PayrollRuns: lazy(() => import('@/views/People/Payroll/PayrollRuns')),
    PayslipView: lazy(() => import('@/views/People/Payroll/PayslipView')),

    // Growth & Platform
    GrowDashboard: lazy(() => import('@/views/Dashboard/ui/GrowDashboard')),
    GoogleBusiness: lazy(() => import('@/views/Business/ui/GoogleBusiness')),
    MarketingMetrics: lazy(() => import('@/views/Dashboard/ui/MarketingMetrics')),
    OnlinePerformance: lazy(() => import('@/views/Dashboard/ui/OnlinePerformance')),
    GrowthHub: lazy(() => import('@/views/Dashboard/ui/GrowthHub')),
    // @ts-ignore
    OnlineStore: lazy(() => import('@/views/OnlineStore/ui/Storefront')),
    MarketingCampaigns: lazy(() => import('@/views/Marketing/ui/MarketingCampaigns')),
    MarketingTemplates: lazy(() => import('@/views/Marketing/ui/MarketingTemplates')),
    EmailMarketing: lazy(() => import('@/views/Marketing/ui/EmailMarketing')),
    WhatsAppMarketing: lazy(() => import('@/views/Business/ui/WhatsAppMarketing')),
    SocialMediaMarketing: lazy(() => import('@/views/Marketing/ui/SocialMediaMarketing')),
    MarketingTools: lazy(() => import('@/views/Business/ui/MarketingTools')),
    MarketingCoupons: lazy(() => import('@/views/Marketing/ui/MarketingCoupons')),
    MarketingOffers: lazy(() => import('@/views/Marketing/ui/MarketingOffers')),
    WhatsAppEngagement: lazy(() => import('@/views/CustomerEngagement/ui/WhatsAppEngagement')),
    SMSMarketing: lazy(() => import('@/views/Marketing/ui/SMSMarketing')),
    EmailEngagement: lazy(() => import('@/views/CustomerEngagement/ui/EmailEngagement')),
    LoyaltyEngagement: lazy(() => import('@/views/CustomerEngagement/ui/LoyaltyEngagement')),
    FeedbackEngagement: lazy(() => import('@/views/CustomerEngagement/ui/FeedbackEngagement')),
    DeviceIntelligence: lazy(() => import('@/views/System/Sync/DeviceIntelligence')),
    Sync: lazy(() => import('@/views/System/Sync/index')),
    GrowReports: lazy(() => import('@/views/Dashboard/ui/GrowDashboard')),
    TenantArchitect: lazy(() => import('@/views/System/Architecture/TenantArchitect')),

    // System
    Reports: lazy(() => import('@/views/Reports/ui/ReportsDashboard')),
    Settings: lazy(() => import('@/views/System/Settings/Settings')),
    Data: lazy(() => import('@/views/System/Data/index')),
    SyncModule: lazy(() => import('@/views/System/Sync/index')),
    AuditLogs: lazy(() => import('@/views/System/Audit/AuditLogViewer')),
    Architecture: lazy(() => import('@/views/System/Architecture/ArchitectureIntelligence')),
    TenantManagement: lazy(() => import('@/views/People/Tenants/TenantManager')),
    SuperAdminGrowthConsole: lazy(() => import('@/views/System/Architecture/SuperAdminGrowthConsole')),
    Storefront: lazy(() => import('@/views/OnlineStore/ui/Storefront')),
    SalesModulePlaceholder: lazy(() => import('@/features/pos-checkout/ui/SalesModulePlaceholder')),
};

export const preloadByViewId = (viewId: string) => {
    logger.info(`Preloading module for ${viewId}`);
    // Optional: Add logic to find and call the dynamic import
};
