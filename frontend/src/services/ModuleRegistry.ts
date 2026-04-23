import { lazy } from 'react';

/**
 * Module Registry
 * Centralizes all lazy-loaded components to enable:
 * 1. Clean code splitted imports for the main router.
 * 2. Proactive pre-fetching on hover or expected navigation.
 */

export const Modules = {
    // Core
    Dashboard: () => import("../pages/Dashboard/Dashboard"),
    DashboardMockUI: () => import("../pages/Dashboard/DashboardMockUI"),
    Finance: () => import("../pages/Financial/Cashbank/FinanceOverview"),
    FinanceMockUI: () => import("../pages/Financial/FinanceMockUI"),
    AgedStockManager: () => import("../pages/Inventory/AgedStockManager"),
    Inventory: () => import("../pages/Inventory/InventoryManager"),
    InventoryMockUI: () => import("../pages/Inventory/InventoryMockUI"),
    POS: () => import("../pages/Pos/POSModule"),
    POSMockUI: () => import("../pages/Pos/POSMockUI"),
    Reports: () => import("../pages/Reports/ReportsDashboard"),
    Purchase: () => import("../pages/Purchase/PurchaseRegister"),
    PurchaseMockUI: () => import("../pages/Purchase/PurchaseMockUI"),
    PurchaseEntry: () => import("../pages/Purchase/PurchaseEntry"),
    VendorManager: () => import("../pages/People/Suppliers/Suppliers"),
    Sales: () => import("../pages/Sales/salesInvoices/SalesInvoice"),
    SalesMockUI: () => import("../pages/Sales/SalesMockUI"),
    Expenses: () => import("../pages/Expenses/ExpensesModule"),
    Settings: () => import("../pages/System/Settings/Settings"),
    Storefront: () => import("../pages/Business/OnlineShop"),
    GrowDashboard: () => import("../pages/Dashboard/GrowDashboard"),
    GrowthHub: () => import("../pages/Dashboard/GrowthHub"),
    OnlinePerformance: () => import("../pages/Dashboard/OnlinePerformance"),
    MarketingMetrics: () => import("../pages/Dashboard/MarketingMetrics"),
    MarketingCampaigns: () => import("../pages/Marketing/MarketingCampaigns"),
    MarketingTemplates: () => import("../pages/Marketing/MarketingTemplates"),
    EmailMarketing: () => import("../pages/Marketing/EmailMarketing"),
    EmailEngagement: () => import("../pages/CustomerEngagement/EmailEngagement"),
    WhatsAppMarketing: () => import("../pages/Marketing/WhatsAppMarketing"),
    SocialMediaMarketing: () => import("../pages/Marketing/SocialMediaMarketing"),
    MarketingCoupons: () => import("../pages/Marketing/MarketingCoupons"),
    MarketingOffers: () => import("../pages/Marketing/MarketingOffers"),
    OnlineStore: () => import("../pages/Commercial/OnlineStore/OnlineStore"),
    Marketing: () => import("../pages/Marketing/index"),
    MarketingTools: () => import("../pages/Business/MarketingTools"),
    GoogleBusiness: () => import("../pages/Business/GoogleBusiness"),
    Sync: () => import("../pages/System/Sync/index"),
    DeviceIntelligence: () => import("../pages/System/Sync/DeviceIntelligence"),
    Data: () => import("../pages/System/Data/index"),
    GrowReports: () => import("../pages/Reports/index"),
    Architecture: () => import("../pages/System/Architecture/ArchitectureIntelligence"),
    Login: () => import("../pages/auth/Login"),
    SMSMarketing: () => import("../pages/Marketing/SMSMarketing"),
    WhatsAppEngagement: () => import("../pages/CustomerEngagement/WhatsAppEngagement"),
    LoyaltyEngagement: () => import("../pages/CustomerEngagement/LoyaltyEngagement"),
    FeedbackEngagement: () => import("../pages/CustomerEngagement/FeedbackEngagement"),
    SuperAdminGrowthConsole: () => import("../pages/System/Architecture/SuperAdminGrowthConsole"),
    TenantManagement: () => import("../pages/People/Tenants/TenantManager"),
    GSTReconciliation: () => import("../pages/Finance/GST/GSTReconciliation"),
    ReprintQueue: () => import("../pages/Inventory/ReprintQueue"),
    // Tenant Growth Settings (Consolidated)
    TenantGrowthSettings: () => import("../pages/System/Architecture/SuperAdminGrowthConsole"),
    TenantArchitect: () => import("../pages/System/Architecture/TenantArchitect"),
    AuditLogs: () => import("../pages/System/Audit/AuditLogViewer"),

    // Sales Features
    SalesInvoiceRegister: () => import("../pages/Sales/salesInvoices/SalesInvoice"),
    EstimateCreator: () => import("../pages/Sales/estimates/Estimate"),
    SalesOrderCreator: () => import("../pages/Sales/salesOrders/SalesOrder"),
    DeliveryChallanCreator: () => import("../pages/Sales/deliveryChallans/DeliveryChallan"),
    SalesReturn: () => import("../pages/Sales/returns/Return"),
    PaymentInCreator: () => import("../pages/Sales/payments/PaymentIn"),
    PaymentInList: () => import("../pages/Sales/payments/PaymentInList"),
    ReturnedItemsManager: () => import("../pages/Sales/returns/ReturnedItems"),
    CustomerCredits: () => import("../pages/Sales/payments/PaymentIn"), // Map to PaymentIn for now if missing
    OutstandingDues: () => import("../pages/Sales/payments/PaymentInList"),
    SalesModulePlaceholder: () => import("@/components/sales/SalesModulePlaceholder"),
    SalesInvoiceForm: () => import("../pages/Sales/salesInvoices/SalesInvoiceForm"),
    SalesInvoiceDetail: () => import("../pages/Sales/salesInvoices/SalesInvoiceDetail"), // Added New Form

    // Purchase Features
    PurchaseOrdersModule: () => import("../pages/Purchase/PurchaseOrdersModule"),
    PurchaseRegister: () => import("../pages/Purchase/PurchaseRegister"),
    GoodsReceived: () => import("../pages/Purchase/GoodsReceived"),
    GRNForm: () => import("../pages/Purchase/GRNForm"),
    DebitNotes: () => import("../pages/Purchase/DebitNotes"),
    SupplierPayments: () => import("../pages/Purchase/PaymentOutList"),
    OutstandingPayables: () => import("../pages/Purchase/OutstandingPayables"),
    VendorForm: () => import("../pages/People/Suppliers/AddSupplier"),
    VendorDetails: () => import("../pages/People/Suppliers/SupplierDetail"),
    Bills: () => import("../pages/Purchase/Bills"),
    BillForm: () => import("../pages/Purchase/BillForm"),
    PaymentOut: () => import("../pages/Purchase/PaymentOutForm"),
    PurchaseHistory: () => import("../pages/Purchase/PurchaseHistory"),
    PurchaseOrderDetails: () => import("../pages/Purchase/PurchaseOrderDetails"),
    PurchaseOrderForm: () => import("../pages/Purchase/PurchaseOrderForm"),
    PurchaseOrderList: () => import("../pages/Purchase/PurchaseOrderList"),
    PurchaseReturnModule: () => import("../pages/Purchase/PurchaseReturn"),
    PurchaseReturns: () => import("../pages/Purchase/PurchaseReturns"),
    PurchaseReturnForm: () => import("../pages/Purchase/PurchaseReturnForm"),
    PurchaseUpload: () => import("../pages/Purchase/PurchaseUpload"),
    VendorInflowOutflow: () => import("../pages/Purchase/VendorInflowOutflow"),

    // Customer Features
    CustomerList: () => import("../pages/People/Customers/CustomerList"),
    CustomerMockUI: () => import("../pages/People/Customers/CustomerMockUI"),
    CustomerLedger: () => import("../pages/People/Customers/CustomerLedger"),
    CustomerStatements: () => import("../pages/People/Customers/CustomerStatements"),
    CustomerGroups: () => import("../pages/People/Customers/CustomerGroups"),
    LoyaltyPoints: () => import("../pages/People/Customers/LoyaltyPoints"),
    AddCustomer: () => import("../pages/People/Customers/AddCustomer"),
    CustomerDetail: () => import("../pages/People/Customers/CustomerDetail"),
    CustomersPortfolio: () => import("../pages/People/Customers/Customers"),
    CustomersWithDues: () => import("../pages/People/Customers/CustomersWithDues"),
    EditCustomer: () => import("../pages/People/Customers/EditCustomer"),

    // Supplier Features
    SupplierLedger: () => import("../pages/People/Suppliers/SupplierLedger"),
    SupplierStatements: () => import("../pages/People/Suppliers/SupplierStatements"),
    SupplierGroups: () => import("../pages/People/Customers/CustomerGroups"), // Actually Customers? Let's check config.
    SupplierAgeing: () => import("../pages/Purchase/SupplierAgeing"),
    EditSupplier: () => import("../pages/People/Suppliers/EditSupplier"),

    // Inventory Features
    ItemCategories: () => import("../pages/Inventory/CategoryManager"),
    StockSummary: () => import("../pages/Inventory/InventoryManager"),
    StockMovement: () => import("../pages/Inventory/InventoryManager"),
    LowStockAlerts: () => import("../pages/Inventory/InventoryManager"),
    UnitsHSNAgent: () => import("../pages/Inventory/InventoryManager"),
    WarehouseIntelligence: () => import("../pages/Inventory/InventoryManager"),
    BatchExpiryIntelligence: () => import("../pages/Inventory/InventoryManager"),

    // Finance Features
    FinanceAgentDashboard: () => import("../pages/Financial/FinanceAgentDashboard"),
    DailyFinanceTracker: () => import("../pages/Expenses/DailyFinance"),
    CashBankIntelligence: () => import("../pages/Financial/Cashbank/CashBankIntelligence"),
    PettyCashIntelligence: () => import("../pages/Financial/Cashbank/PettyCash"),
    BankIntelligence: () => import("../pages/Financial/Cashbank/BankIntelligence"),
    BankReconciliationIntelligence: () => import("../pages/Financial/Cashbank/BankReconciliation"),
    FundTransferIntelligence: () => import("../pages/Financial/Cashbank/FundTransfer"),
    BankAccounts: () => import("../pages/Financial/Cashbank/BankAccounts"),
    JournalEntries: () => import("../pages/Financial/Journal/JournalEntries"),
    JournalEntryForm: () => import("../pages/Financial/Journal/JournalEntryForm"),
    BankSummary: () => import("../pages/Financial/Cashbank/BankSummary"),
    Transfers: () => import("../pages/Financial/Cashbank/Transfers"),
    CashInHand: () => import("../pages/Financial/Cashbank/CashInHand"),
    CashBankPosition: () => import("../pages/Financial/Cashbank/CashBankPosition"),
    AccountLedger: () => import("../pages/Financial/Cashbank/AccountLedger"),
    BankStatementView: () => import("../pages/Finance/BankStatementView"),
    SmsTrackerPage: () => import("../pages/Finance/SmsTrackerPage"),
    BudgetTrackerPage: () => import("../pages/Finance/BudgetTrackerPage"),
    LoanAccounts: () => import("../pages/Financial/Cashbank/LoanAccounts"),
    FinancialGoals: () => import("../pages/Financial/Cashbank/FinancialGoals"),

    // Expense Features
    ExpenseIntelligence: () => import("../pages/Expenses/ExpenseIntelligence"),
    ExpenseCategoriesManager: () => import("../pages/Expenses/ExpenseCategoriesManager"),
    ExpensesModuleFeature: () => import("../pages/Expenses/ExpensesModule"),
    RecurringExpensesIntelligence: () => import("../pages/Expenses/RecurringExpensesIntelligence"),
    ExpenseReportsIntelligence: () => import("../pages/Expenses/ExpenseReportsIntelligence"),

    // POS Intelligence
    POSOrdersIntelligence: () => import("../pages/Pos/POSOrdersIntelligence"),
    POSReturnsIntelligence: () => import("../pages/Pos/POSReturnsIntelligence"),
    ShiftManagementIntelligence: () => import("../pages/Pos/ShiftManagementIntelligence"),
    CashDrawerIntelligence: () => import("../pages/Pos/CashDrawerIntelligence"),

    // HR
    LaborManager: () => import("../pages/People/Employees/LaborManager"),
    StaffManager: () => import("../pages/People/Employees/StaffManager"),
    AllowanceManager: () => import("../pages/People/Employees/AllowanceManager"),
    PayrollDashboard: () => import("../pages/People/Payroll/PayrollDashboard"),
    SalaryStructureManager: () => import("../pages/People/Payroll/SalaryStructureManager"),
    PayrollRuns: () => import("../pages/People/Payroll/PayrollRuns"),
    AttendanceSummaryManager: () => import("../pages/People/Payroll/AttendanceSummaryManager"),
    DailyAttendanceBoard: () => import("../pages/People/Employees/DailyAttendanceBoard"),
    PayslipView: () => import("../pages/People/Payroll/PayslipView"),
};

export const LazyModules = {
    Dashboard: lazy(Modules.Dashboard),
    DashboardMockUI: lazy(Modules.DashboardMockUI),
    Finance: lazy(Modules.Finance),
    FinanceMockUI: lazy(Modules.FinanceMockUI),
    AgedStockManager: lazy(Modules.AgedStockManager),
    Inventory: lazy(Modules.Inventory),
    InventoryMockUI: lazy(Modules.InventoryMockUI),
    POS: lazy(Modules.POS),
    POSMockUI: lazy(Modules.POSMockUI),
    Reports: lazy(Modules.Reports),
    Purchase: lazy(Modules.Purchase),
    PurchaseMockUI: lazy(Modules.PurchaseMockUI),
    PurchaseEntry: lazy(Modules.PurchaseEntry),
    VendorManager: lazy(Modules.VendorManager),
    Sales: lazy(Modules.Sales),
    SalesMockUI: lazy(Modules.SalesMockUI),
    Expenses: lazy(Modules.Expenses),
    Settings: lazy(Modules.Settings),
    Storefront: lazy(Modules.Storefront),
    GrowDashboard: lazy(Modules.GrowDashboard),
    GrowthHub: lazy(Modules.GrowthHub),
    OnlinePerformance: lazy(Modules.OnlinePerformance),
    MarketingMetrics: lazy(Modules.MarketingMetrics),
    MarketingCampaigns: lazy(Modules.MarketingCampaigns),
    MarketingTemplates: lazy(Modules.MarketingTemplates),
    EmailMarketing: lazy(Modules.EmailMarketing),
    EmailEngagement: lazy(Modules.EmailEngagement),
    WhatsAppMarketing: lazy(Modules.WhatsAppMarketing),
    SocialMediaMarketing: lazy(Modules.SocialMediaMarketing),
    MarketingCoupons: lazy(Modules.MarketingCoupons),
    MarketingOffers: lazy(Modules.MarketingOffers),
    OnlineStore: lazy(Modules.OnlineStore),
    Marketing: lazy(Modules.Marketing),
    MarketingTools: lazy(Modules.MarketingTools),
    GoogleBusiness: lazy(Modules.GoogleBusiness),
    Sync: lazy(Modules.Sync),
    DeviceIntelligence: lazy(Modules.DeviceIntelligence),
    Data: lazy(Modules.Data),
    GrowReports: lazy(Modules.GrowReports),
    Architecture: lazy(Modules.Architecture),
    Login: lazy(Modules.Login),
    SMSMarketing: lazy(Modules.SMSMarketing),
    WhatsAppEngagement: lazy(Modules.WhatsAppEngagement),
    LoyaltyEngagement: lazy(Modules.LoyaltyEngagement),
    FeedbackEngagement: lazy(Modules.FeedbackEngagement),
    SuperAdminGrowthConsole: lazy(Modules.SuperAdminGrowthConsole),
    TenantManagement: lazy(Modules.TenantManagement),
    TenantGrowthSettings: lazy(Modules.TenantGrowthSettings),
    GSTReconciliation: lazy(Modules.GSTReconciliation),
    ReprintQueue: lazy(Modules.ReprintQueue),
    TenantArchitect: lazy(Modules.TenantArchitect),
    AuditLogs: lazy(Modules.AuditLogs),

    // Sales
    SalesInvoiceRegister: lazy(Modules.SalesInvoiceRegister),
    EstimateCreator: lazy(Modules.EstimateCreator),
    SalesOrderCreator: lazy(Modules.SalesOrderCreator),
    DeliveryChallanCreator: lazy(Modules.DeliveryChallanCreator),
    SalesReturn: lazy(Modules.SalesReturn),
    PaymentInCreator: lazy(Modules.PaymentInCreator),
    PaymentInList: lazy(Modules.PaymentInList),
    ReturnedItemsManager: lazy(Modules.ReturnedItemsManager),
    CustomerCredits: lazy(Modules.CustomerCredits),
    OutstandingDues: lazy(Modules.OutstandingDues),
    SalesModulePlaceholder: lazy(Modules.SalesModulePlaceholder),
    SalesInvoiceForm: lazy(Modules.SalesInvoiceForm),
    SalesInvoiceDetail: lazy(Modules.SalesInvoiceDetail), // Added New Form

    // Purchase
    PurchaseOrdersModule: lazy(Modules.PurchaseOrdersModule),
    PurchaseRegister: lazy(Modules.PurchaseRegister),
    GoodsReceived: lazy(Modules.GoodsReceived),
    GRNForm: lazy(Modules.GRNForm),
    DebitNotes: lazy(Modules.DebitNotes),
    SupplierPayments: lazy(Modules.SupplierPayments),
    OutstandingPayables: lazy(Modules.OutstandingPayables),
    VendorForm: lazy(Modules.VendorForm),
    VendorDetails: lazy(Modules.VendorDetails),
    Bills: lazy(Modules.Bills),
    BillForm: lazy(Modules.BillForm),
    PaymentOut: lazy(Modules.PaymentOut),
    PurchaseHistory: lazy(Modules.PurchaseHistory),
    PurchaseOrderDetails: lazy(Modules.PurchaseOrderDetails),
    PurchaseOrderForm: lazy(Modules.PurchaseOrderForm),
    PurchaseOrderList: lazy(Modules.PurchaseOrderList),
    PurchaseReturnModule: lazy(Modules.PurchaseReturnModule),
    PurchaseReturns: lazy(Modules.PurchaseReturns),
    PurchaseReturnForm: lazy(Modules.PurchaseReturnForm),
    PurchaseUpload: lazy(Modules.PurchaseUpload),
    VendorInflowOutflow: lazy(Modules.VendorInflowOutflow),

    // Customers
    CustomerList: lazy(Modules.CustomerList),
    CustomerMockUI: lazy(Modules.CustomerMockUI),
    CustomerLedger: lazy(Modules.CustomerLedger),
    CustomerStatements: lazy(Modules.CustomerStatements),
    CustomerGroups: lazy(Modules.CustomerGroups),
    LoyaltyPoints: lazy(Modules.LoyaltyPoints),
    AddCustomer: lazy(Modules.AddCustomer),
    CustomerDetail: lazy(Modules.CustomerDetail),
    CustomersPortfolio: lazy(Modules.CustomersPortfolio),
    CustomersWithDues: lazy(Modules.CustomersWithDues),
    EditCustomer: lazy(Modules.EditCustomer),

    // Suppliers
    SupplierLedger: lazy(Modules.SupplierLedger),
    SupplierStatements: lazy(Modules.SupplierStatements),
    SupplierGroups: lazy(Modules.SupplierGroups),
    SupplierAgeing: lazy(Modules.SupplierAgeing),
    EditSupplier: lazy(Modules.EditSupplier),

    // Inventory
    ItemCategories: lazy(Modules.ItemCategories),
    StockSummary: lazy(Modules.StockSummary),
    StockMovement: lazy(Modules.StockMovement),
    LowStockAlerts: lazy(Modules.LowStockAlerts),
    UnitsHSNAgent: lazy(Modules.UnitsHSNAgent),
    WarehouseIntelligence: lazy(Modules.WarehouseIntelligence),
    BatchExpiryIntelligence: lazy(Modules.BatchExpiryIntelligence),

    // Finance
    FinanceAgentDashboard: lazy(Modules.FinanceAgentDashboard),
    DailyFinanceTracker: lazy(Modules.DailyFinanceTracker),
    CashBankIntelligence: lazy(Modules.CashBankIntelligence),
    PettyCashIntelligence: lazy(Modules.PettyCashIntelligence),
    BankIntelligence: lazy(Modules.BankIntelligence),
    BankReconciliationIntelligence: lazy(Modules.BankReconciliationIntelligence),
    FundTransferIntelligence: lazy(Modules.FundTransferIntelligence),
    BankAccounts: lazy(Modules.BankAccounts),
    JournalEntries: lazy(Modules.JournalEntries),
    JournalEntryForm: lazy(Modules.JournalEntryForm),
    BankSummary: lazy(Modules.BankSummary),
    Transfers: lazy(Modules.Transfers),
    CashInHand: lazy(Modules.CashInHand),
    CashBankPosition: lazy(Modules.CashBankPosition),
    AccountLedger: lazy(Modules.AccountLedger),
    BankStatementView: lazy(Modules.BankStatementView),
    SmsTrackerPage: lazy(Modules.SmsTrackerPage),
    BudgetTrackerPage: lazy(Modules.BudgetTrackerPage),
    LoanAccounts: lazy(Modules.LoanAccounts),
    FinancialGoals: lazy(Modules.FinancialGoals),

    // Expenses
    ExpenseIntelligence: lazy(Modules.ExpenseIntelligence),
    ExpenseCategoriesManager: lazy(Modules.ExpenseCategoriesManager),
    ExpensesModuleFeature: lazy(Modules.ExpensesModuleFeature),
    RecurringExpensesIntelligence: lazy(Modules.RecurringExpensesIntelligence),
    ExpenseReportsIntelligence: lazy(Modules.ExpenseReportsIntelligence),

    // POS
    POSOrdersIntelligence: lazy(Modules.POSOrdersIntelligence),
    POSReturnsIntelligence: lazy(Modules.POSReturnsIntelligence),
    ShiftManagementIntelligence: lazy(Modules.ShiftManagementIntelligence),
    CashDrawerIntelligence: lazy(Modules.CashDrawerIntelligence),

    // HR
    LaborManager: lazy(Modules.LaborManager),
    StaffManager: lazy(Modules.StaffManager),
    AllowanceManager: lazy(Modules.AllowanceManager),
    PayrollDashboard: lazy(Modules.PayrollDashboard),
    SalaryStructureManager: lazy(Modules.SalaryStructureManager),
    PayrollRuns: lazy(Modules.PayrollRuns),
    AttendanceSummaryManager: lazy(Modules.AttendanceSummaryManager),
    DailyAttendanceBoard: lazy(Modules.DailyAttendanceBoard),
    PayslipView: lazy(Modules.PayslipView),
};


/**
 * Proactively triggers the network load for a module chunk.
 */
export const preloadModule = (key: keyof typeof Modules) => {
    const importFn = Modules[key];
    if (importFn) {
        importFn().catch(() => { }); // Start loading, ignore errors
    }
};

/**
 * Maps AppView IDs to Module Registry keys for preloading.
 */
export const preloadByViewId = (viewId: string) => {
    if (viewId.startsWith('DASHBOARD')) preloadModule('Dashboard');
    else if (viewId.startsWith('INVENTORY') || viewId === 'ITEM_CATEGORIES') preloadModule('Inventory');
    else if (viewId.startsWith('POS')) preloadModule('POS');
    else if (viewId.startsWith('REPORT')) preloadModule('Reports');
    else if (viewId.startsWith('FINANCE')) preloadModule('Finance');
    else if (viewId.startsWith('PURCHASE') || viewId === 'VENDORS') preloadModule('Purchase');
    else if (viewId.startsWith('SALES') || viewId.startsWith('PAYMENT_IN')) preloadModule('Sales');
    else if (viewId.startsWith('EXPENSE')) preloadModule('Expenses');
    else if (viewId === 'SETTINGS') preloadModule('Settings');
    else if (viewId === 'STOREFRONT') preloadModule('Storefront');
    else if (viewId.startsWith('GROW_MARKETING_EMAIL')) preloadModule('EmailMarketing');
    else if (viewId.startsWith('GROW_ENGAGEMENT_EMAIL')) preloadModule('EmailEngagement');
    else if (viewId.startsWith('GROW_MARKETING_WHATSAPP')) preloadModule('WhatsAppMarketing');
    else if (viewId.startsWith('GROW_ENGAGEMENT_WHATSAPP')) preloadModule('WhatsAppEngagement');
    else if (viewId.startsWith('GROW_ENGAGEMENT_LOYALTY')) preloadModule('LoyaltyEngagement');
    else if (viewId.startsWith('GROW_ENGAGEMENT_FEEDBACK')) preloadModule('FeedbackEngagement');
    else if (viewId.startsWith('GROW_MARKETING_SOCIAL')) preloadModule('SocialMediaMarketing');
    else if (viewId.startsWith('GROW_MARKETING_COUPONS')) preloadModule('MarketingCoupons');
    else if (viewId.startsWith('GROW_MARKETING_OFFERS')) preloadModule('MarketingOffers');
    else if (viewId.startsWith('GROW_REPORTS')) preloadModule('GrowReports');
    else if (viewId.startsWith('GROW_SYNC')) preloadModule('DeviceIntelligence');
    else if (viewId === 'GROW_SUPER_ADMIN_CONSOLE' || viewId === 'GROW_TENANT_CONFIG') preloadModule('SuperAdminGrowthConsole');
    else if (viewId.startsWith('GROW_') || viewId === 'GROW_HUB') preloadModule('GrowDashboard');
};
