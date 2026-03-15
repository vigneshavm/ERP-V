import { logger } from '@/shared/lib/logger';
import { lazy } from 'react';

export const ModuleLoaders = {
    // Auth
    Login: () => import('@/views/auth/ui/Login'),

    // Dashboard
    Dashboard: () => import('@/views/Dashboard/ui/Dashboard'),

    // Sales
    Sales: () => import('@/views/Pos/ui/POSModule'),
    SalesInvoiceRegister: () => import('@/views/Sales/salesInvoices/SalesInvoice'),
    SalesInvoiceForm: () => import('@/views/Sales/salesInvoices/SalesInvoiceForm'),
    SalesInvoiceDetail: () => import('@/views/Sales/salesInvoices/SalesInvoiceDetail'),
    EstimateCreator: () => import('@/views/Sales/estimates/Estimate'),
    SalesOrderCreator: () => import('@/views/Sales/salesOrders/SalesOrder'),
    DeliveryChallanCreator: () => import('@/views/Sales/deliveryChallans/DeliveryChallan'),
    SalesReturn: () => import('@/views/Sales/returns/Return'),
    PaymentInCreator: () => import('@/views/Sales/payments/PaymentInCreator'),
    PaymentInList: () => import('@/views/Sales/payments/PaymentInList'),
    ReturnedItemsManager: () => import('@/views/Sales/returns/ReturnedItems'),
    CustomerCredits: () => import('@/views/People/Customers/CustomerLedger'),
    OutstandingDues: () => import('@/views/People/Customers/CustomersWithDues'),

    // Purchase
    PurchaseRegister: () => import('@/views/Purchase/ui/PurchaseRegister'),
    PurchaseEntry: () => import('@/views/Purchase/ui/PurchaseEntry'),
    VendorManager: () => import('@/views/People/Suppliers/Suppliers'),
    VendorDetails: () => import('@/views/People/Suppliers/SupplierDetail'),
    VendorForm: () => import('@/views/People/Suppliers/AddSupplier'),
    GoodsReceived: () => import('@/views/Purchase/ui/GoodsReceived'),
    GRNForm: () => import('@/views/Purchase/ui/GRNForm'),
    DebitNotes: () => import('@/views/Purchase/ui/DebitNotes'),
    SupplierPayments: () => import('@/views/Purchase/ui/SupplierPayments'),
    PaymentOut: () => import('@/views/Purchase/ui/PaymentOut'),
    OutstandingPayables: () => import('@/views/Purchase/ui/OutstandingPayables'),
    Bills: () => import('@/views/Purchase/ui/Bills'),
    BillForm: () => import('@/views/Purchase/ui/BillForm'),
    PurchaseHistory: () => import('@/views/Purchase/ui/PurchaseHistory'),
    PurchaseOrderDetails: () => import('@/views/Purchase/ui/PurchaseOrderDetails'),
    PurchaseReturns: () => import('@/views/Purchase/ui/PurchaseReturns'),
    PurchaseReturnForm: () => import('@/views/Purchase/ui/PurchaseReturnForm'),
    PurchaseUpload: () => import('@/views/Purchase/ui/PurchaseUpload'),
    SupplierAgeing: () => import('@/views/Purchase/ui/SupplierAgeing'),
    VendorInflowOutflow: () => import('@/views/Purchase/ui/VendorInflowOutflow'),

    // Inventory
    Inventory: () => import('@/views/Inventory/ui/InventoryManager'),
    AgedStockManager: () => import('@/views/Inventory/ui/AgedStockManager'),
    ItemCategories: () => import('@/views/Inventory/ui/CategoryManager'),
    ReprintQueue: () => import('@/views/Inventory/ui/ReprintQueue'),

    // Finance
    CashBankPosition: () => import('@/views/Financial/Cashbank/CashBankPosition'),
    BankAccounts: () => import('@/views/Financial/Cashbank/BankAccounts'),
    BankSummary: () => import('@/views/Financial/Cashbank/BankSummary'),
    BankReconciliation: () => import('@/views/Financial/Cashbank/BankReconciliation'),
    Transfers: () => import('@/views/Financial/Cashbank/Transfers'),
    PettyCash: () => import('@/views/Financial/Cashbank/PettyCash'),
    CashInHand: () => import('@/views/Financial/Cashbank/CashInHand'),
    AccountLedger: () => import('@/views/Financial/Cashbank/AccountLedger'),
    JournalEntries: () => import('@/views/Financial/Journal/JournalEntries'),
    JournalEntryForm: () => import('@/views/Financial/Journal/JournalEntryForm'),
    BudgetTrackerPage: () => import('@/views/Finance/ui/BudgetTrackerPage'),
    LoanAccounts: () => import('@/views/Financial/Cashbank/LoanAccounts'),
    FinancialGoals: () => import('@/views/Financial/Cashbank/FinancialGoals'),

    // POS
    POSOrdersIntelligence: () => import('@/views/Pos/ui/POSOrdersIntelligence'),
    POSReturnsIntelligence: () => import('@/views/Pos/ui/POSReturnsIntelligence'),
    ShiftManagementIntelligence: () => import('@/views/Pos/ui/ShiftManagementIntelligence'),
    CashDrawerIntelligence: () => import('@/views/Pos/ui/CashDrawerIntelligence'),

    // Expenses
    ExpensesModuleFeature: () => import('@/views/Expenses/ui/ExpensesModule'),
    ExpenseIntelligence: () => import('@/views/Expenses/ui/ExpenseIntelligence'),
    ExpenseCategoriesManager: () => import('@/views/Expenses/ui/ExpenseCategoriesManager'),
    RecurringExpensesIntelligence: () => import('@/views/Expenses/ui/RecurringExpensesIntelligence'),
    ExpenseReportsIntelligence: () => import('@/views/Expenses/ui/ExpenseReportsIntelligence'),

    // Customers & Suppliers
    CustomerList: () => import('@/views/People/Customers/CustomerList'),
    CustomerLedger: () => import('@/views/People/Customers/CustomerLedger'),
    CustomerStatements: () => import('@/views/People/Customers/CustomerStatements'),
    CustomerGroups: () => import('@/views/People/Customers/CustomerGroups'),
    LoyaltyPoints: () => import('@/views/People/Customers/LoyaltyPoints'),
    AddCustomer: () => import('@/views/People/Customers/AddCustomer'),
    CustomerDetail: () => import('@/views/People/Customers/CustomerDetail'),
    CustomersWithDues: () => import('@/views/People/Customers/CustomersWithDues'),
    EditCustomer: () => import('@/views/People/Customers/EditCustomer'),
    EditSupplier: () => import('@/views/People/Suppliers/EditSupplier'),
    SupplierLedger: () => import('@/views/People/Suppliers/SupplierLedger'),
    SupplierStatements: () => import('@/views/People/Suppliers/SupplierStatements'),
    SupplierGroups: () => import('@/views/People/Suppliers/SupplierGroups'),

    // HR
    LaborManager: () => import('@/views/People/Employees/LaborManager'),
    AllowanceManager: () => import('@/views/People/Employees/AllowanceManager'),
    EmployeeDirectory: () => import('@/views/People/Employees/EmployeeDirectory'),
    EmployeeProfile: () => import('@/views/People/Employees/EmployeeProfile'),
    LeaveManagement: () => import('@/views/People/Employees/LeaveManagement'),
    DailyAttendanceBoard: () => import('@/views/People/Employees/DailyAttendanceBoard'),
    SalaryStructureManager: () => import('@/views/People/Payroll/SalaryStructureManager'),
    AttendanceSummaryManager: () => import('@/views/People/Payroll/AttendanceSummaryManager'),
    PayrollRuns: () => import('@/views/People/Payroll/PayrollRuns'),
    PayslipView: () => import('@/views/People/Payroll/PayslipView'),

    // Growth & Platform
    GrowDashboard: () => import('@/views/Dashboard/ui/GrowDashboard'),
    GoogleBusiness: () => import('@/views/Business/ui/GoogleBusiness'),
    MarketingMetrics: () => import('@/views/Dashboard/ui/MarketingMetrics'),
    OnlinePerformance: () => import('@/views/Dashboard/ui/OnlinePerformance'),
    GrowthHub: () => import('@/views/Dashboard/ui/GrowthHub'),
    Storefront: () => import('@/views/OnlineStore/ui/Storefront'),
    MarketingCampaigns: () => import('@/views/Marketing/ui/MarketingCampaigns'),
    MarketingTemplates: () => import('@/views/Marketing/ui/MarketingTemplates'),
    EmailMarketing: () => import('@/features/marketing/ui/EmailMarketing'),
    WhatsAppMarketing: () => import('@/views/Business/ui/WhatsAppMarketing'),
    SocialMediaMarketing: () => import('@/views/Marketing/ui/SocialMediaMarketing'),
    MarketingTools: () => import('@/views/Business/ui/MarketingTools'),
    MarketingCoupons: () => import('@/views/Marketing/ui/MarketingCoupons'),
    MarketingOffers: () => import('@/views/Marketing/ui/MarketingOffers'),
    WhatsAppEngagement: () => import('@/views/CustomerEngagement/ui/WhatsAppEngagement'),
    SMSMarketing: () => import('@/views/Marketing/ui/SMSMarketing'),
    EmailEngagement: () => import('@/views/CustomerEngagement/ui/EmailEngagement'),
    LoyaltyEngagement: () => import('@/views/CustomerEngagement/ui/LoyaltyEngagement'),
    FeedbackEngagement: () => import('@/views/CustomerEngagement/ui/FeedbackEngagement'),
    DeviceIntelligence: () => import('@/views/System/Sync/DeviceIntelligence'),
    Sync: () => import('@/views/System/Sync/index'),
    TenantArchitect: () => import('@/views/System/Architecture/TenantArchitect'),

    // System
    Reports: () => import('@/views/Reports/ui/ReportsDashboard'),
    Settings: () => import('@/views/System/Settings/Settings'),
    Data: () => import('@/views/System/Data/index'),
    AuditLogs: () => import('@/views/System/Audit/AuditLogViewer'),
    Architecture: () => import('@/views/System/Architecture/ArchitectureIntelligence'),
    TenantManagement: () => import('@/views/People/Tenants/TenantManager'),
    SuperAdminGrowthConsole: () => import('@/views/System/Architecture/SuperAdminGrowthConsole'),
    SalesModulePlaceholder: () => import('@/features/pos-checkout/ui/SalesModulePlaceholder'),
};

export const LazyModules = Object.fromEntries(
    Object.entries(ModuleLoaders).map(([key, loader]) => [key, lazy(loader)])
) as Record<keyof typeof ModuleLoaders, React.LazyExoticComponent<any>>;

// Add aliases for cleaned up duplicates
const Aliases: Record<string, keyof typeof ModuleLoaders> = {
    DailyFinanceTracker: 'Dashboard',
    Finance: 'Dashboard',
    FinanceAgentDashboard: 'Dashboard',
    GSTReconciliation: 'Dashboard',
    PayrollDashboard: 'Dashboard',
    Purchase: 'PurchaseRegister',
    PurchaseOrdersModule: 'PurchaseRegister',
    PurchaseReturnModule: 'PurchaseReturns',
    StockSummary: 'Inventory',
    StockMovement: 'Inventory',
    LowStockAlerts: 'Inventory',
    UnitsHSNAgent: 'Inventory',
    WarehouseIntelligence: 'Inventory',
    BatchExpiryIntelligence: 'Inventory',
    BankIntelligence: 'BankAccounts',
    BankReconciliationIntelligence: 'BankReconciliation',
    FundTransferIntelligence: 'Transfers',
    PettyCashIntelligence: 'PettyCash',
    BankStatementView: 'BankSummary',
    SmsTrackerPage: 'SMSMarketing',
    CustomersPortfolio: 'CustomerList',
    SyncModule: 'Sync',
    GrowReports: 'GrowDashboard'
};

export const preloadByViewId = (viewId: string) => {
    logger.info(`Preloading module for ${viewId}`);
    const target = Aliases[viewId] || viewId;
    const loader = (ModuleLoaders as any)[target];
    if (loader) {
        loader().catch((err: any) => logger.error(`Preload failed for ${viewId}:`, err));
    } else {
        logger.warn(`No loader found for ${viewId}`);
    }
};

