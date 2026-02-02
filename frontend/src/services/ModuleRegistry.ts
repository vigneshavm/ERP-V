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
    ProfitPulse: () => import("../pages/Analytics/Reports/ProfitPulse"),
    BusinessSnapshot: () => import("../pages/Analytics/Reports/BusinessSnapshot"),
    Finance: () => import("../pages/Financial/Cashbank/FinanceOverview"),
    AgedStockManager: () => import("../pages/Commercial/Inventory/AgedStockManager"),
    Inventory: () => import("../pages/Commercial/Inventory/InventoryManager"),
    POS: () => import("../pages/Commercial/Pos/POSModule"),
    Reports: () => import("../pages/Analytics/Reports/ReportsDashboard"),
    Purchase: () => import("../pages/Commercial/Purchase/PurchaseRegister"),
    PurchaseEntry: () => import("../pages/Commercial/Purchase/PurchaseEntry"),
    VendorManager: () => import("../pages/People/Suppliers/Suppliers"),
    Sales: () => import("../pages/Commercial/Sales/salesInvoices/SalesInvoice"),
    Expenses: () => import("../pages/Financial/Expenses/ExpensesModule"),
    Settings: () => import("../pages/System/Settings/Settings"),
    Storefront: () => import("../pages/Analytics/Business/OnlineShop"),
    GrowDashboard: () => import("../pages/Dashboard/GrowDashboard"),
    GrowthHub: () => import("../pages/Analytics/Dashboard/GrowthHub"),
    OnlinePerformance: () => import("../pages/Analytics/Dashboard/OnlinePerformance"),
    MarketingMetrics: () => import("../pages/Analytics/Dashboard/MarketingMetrics"),
    MarketingCampaigns: () => import("../pages/Analytics/Marketing/MarketingCampaigns"),
    MarketingTemplates: () => import("../pages/Analytics/Marketing/MarketingTemplates"),
    EmailMarketing: () => import("../pages/Analytics/Marketing/EmailMarketing"),
    EmailEngagement: () => import("../pages/Analytics/Marketing/EmailEngagement"),
    WhatsAppMarketing: () => import("../pages/Analytics/Marketing/WhatsAppMarketing"),
    SocialMediaMarketing: () => import("../pages/Analytics/Marketing/SocialMediaMarketing"),
    MarketingCoupons: () => import("../pages/Analytics/Marketing/MarketingCoupons"),
    MarketingOffers: () => import("../pages/Analytics/Marketing/MarketingOffers"),
    OnlineStore: () => import("../pages/Commercial/OnlineStore/OnlineStore"),
    Marketing: () => import("../pages/Analytics/Marketing/index"),
    GoogleBusiness: () => import("../pages/Analytics/GoogleBusiness/index"),
    Sync: () => import("../pages/System/Sync/index"),
    DeviceIntelligence: () => import("../pages/System/Sync/DeviceIntelligence"),
    Data: () => import("../pages/System/Data/index"),
    GrowReports: () => import("../pages/Analytics/Reports/index"),
    Architecture: () => import("../pages/System/Architecture/ArchitectureIntelligence"),
    Login: () => import("../pages/auth/Login"),
    SMSMarketing: () => import("../pages/Analytics/Marketing/SMSMarketing"),
    WhatsAppEngagement: () => import("../pages/Analytics/Marketing/WhatsAppEngagement"),
    LoyaltyEngagement: () => import("../pages/Analytics/Marketing/LoyaltyEngagement"),
    FeedbackEngagement: () => import("../pages/Analytics/Marketing/FeedbackEngagement"),
    SuperAdminGrowthConsole: () => import("../pages/System/Architecture/SuperAdminGrowthConsole"),
    TenantManagement: () => import("../pages/People/Tenants/TenantManager"),
    // Tenant Growth Settings (Consolidated)
    TenantGrowthSettings: () => import("../pages/System/Architecture/SuperAdminGrowthConsole"),
    TenantArchitect: () => import("../pages/System/Architecture/TenantArchitect"),

    // Sales Features
    SalesInvoiceRegister: () => import("../pages/Commercial/Sales/salesInvoices/SalesInvoice"),
    EstimateCreator: () => import("../pages/Commercial/Sales/estimates/Estimate"),
    SalesOrderCreator: () => import("../pages/Commercial/Sales/salesOrders/SalesOrder"),
    DeliveryChallanCreator: () => import("../pages/Commercial/Sales/deliveryChallans/DeliveryChallan"),
    SalesReturn: () => import("../pages/Commercial/Sales/returns/Return"),
    PaymentInCreator: () => import("../pages/Commercial/Sales/payments/PaymentIn"),
    PaymentInList: () => import("../pages/Commercial/Sales/payments/PaymentInList"),
    ReturnedItemsManager: () => import("../pages/Commercial/Sales/returns/ReturnedItems"),
    CustomerCredits: () => import("../pages/Commercial/Sales/payments/PaymentIn"), // Map to PaymentIn for now if missing
    OutstandingDues: () => import("../pages/Commercial/Sales/payments/PaymentInList"),
    SalesModulePlaceholder: () => import("@/components/sales/SalesModulePlaceholder"),

    // Purchase Features
    PurchaseOrdersModule: () => import("../pages/Commercial/Purchase/PurchaseOrdersModule"),
    PurchaseRegister: () => import("../pages/Commercial/Purchase/PurchaseRegister"),
    GoodsReceived: () => import("../pages/Commercial/Purchase/GoodsReceived"),
    DebitNotes: () => import("../pages/Commercial/Purchase/DebitNotes"),
    SupplierPayments: () => import("../pages/Commercial/Purchase/SupplierPayments"),
    OutstandingPayables: () => import("../pages/Commercial/Purchase/OutstandingPayables"),
    VendorForm: () => import("../pages/People/Suppliers/AddSupplier"),
    VendorDetails: () => import("../pages/People/Suppliers/SupplierDetail"),

    // Customer Features
    CustomerList: () => import("../pages/People/Customers/CustomerList"),
    CustomerLedger: () => import("../pages/People/Customers/CustomerLedger"),
    CustomerStatements: () => import("../pages/People/Customers/CustomerStatements"),
    CustomerGroups: () => import("../pages/People/Customers/CustomerGroups"),
    LoyaltyPoints: () => import("../pages/People/Customers/LoyaltyPoints"),

    // Supplier Features
    SupplierLedger: () => import("../pages/People/Suppliers/SupplierLedger"),
    SupplierStatements: () => import("../pages/People/Suppliers/SupplierStatements"),
    SupplierGroups: () => import("../pages/People/Suppliers/SupplierGroups"),

    // Inventory Features
    ItemCategories: () => import("../pages/Commercial/Inventory/CategoryManager"),
    StockSummary: () => import("../pages/Commercial/Inventory/InventoryManager"),
    StockMovement: () => import("../pages/Commercial/Inventory/InventoryManager"),
    LowStockAlerts: () => import("../pages/Commercial/Inventory/InventoryManager"),
    UnitsHSNAgent: () => import("../pages/Commercial/Inventory/InventoryManager"),
    WarehouseIntelligence: () => import("../pages/Commercial/Inventory/InventoryManager"),
    BatchExpiryIntelligence: () => import("../pages/Commercial/Inventory/InventoryManager"),

    // Finance Features
    DailyFinanceTracker: () => import("../pages/Financial/Expenses/DailyFinance"),
    CashBankIntelligence: () => import("../pages/Financial/Cashbank/CashBankIntelligence"),
    PettyCashIntelligence: () => import("../pages/Financial/Cashbank/PettyCash"),
    BankIntelligence: () => import("../pages/Financial/Cashbank/BankIntelligence"),
    BankReconciliationIntelligence: () => import("../pages/Financial/Cashbank/BankReconciliation"),
    FundTransferIntelligence: () => import("../pages/Financial/Cashbank/FundTransfer"),

    // Expense Features
    ExpenseIntelligence: () => import("../pages/Financial/Expenses/ExpenseIntelligence"),
    ExpenseCategoriesManager: () => import("../pages/Financial/Expenses/ExpenseCategoriesManager"),
    ExpensesModuleFeature: () => import("../pages/Financial/Expenses/ExpensesModule"),
    RecurringExpensesIntelligence: () => import("../pages/Financial/Expenses/RecurringExpensesIntelligence"),
    ExpenseReportsIntelligence: () => import("../pages/Financial/Expenses/ExpenseReportsIntelligence"),

    // POS Intelligence
    POSOrdersIntelligence: () => import("../pages/Commercial/Pos/POSOrdersIntelligence"),
    POSReturnsIntelligence: () => import("../pages/Commercial/Pos/POSReturnsIntelligence"),
    ShiftManagementIntelligence: () => import("../pages/Commercial/Pos/ShiftManagementIntelligence"),
    CashDrawerIntelligence: () => import("../pages/Commercial/Pos/CashDrawerIntelligence"),

    // HR
    LaborManager: () => import("../pages/People/Employees/LaborManager"),
};

export const LazyModules = {
    Dashboard: lazy(Modules.Dashboard),
    ProfitPulse: lazy(Modules.ProfitPulse),
    BusinessSnapshot: lazy(Modules.BusinessSnapshot),
    AgedStockManager: lazy(Modules.AgedStockManager),
    Inventory: lazy(Modules.Inventory),
    POS: lazy(Modules.POS),
    Reports: lazy(Modules.Reports),
    Finance: lazy(Modules.Finance),
    Purchase: lazy(Modules.Purchase),
    PurchaseEntry: lazy(Modules.PurchaseEntry),
    VendorManager: lazy(Modules.VendorManager),
    Sales: lazy(Modules.Sales),
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
    TenantArchitect: lazy(Modules.TenantArchitect),

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

    // Purchase
    PurchaseOrdersModule: lazy(Modules.PurchaseOrdersModule),
    PurchaseRegister: lazy(Modules.PurchaseRegister),
    GoodsReceived: lazy(Modules.GoodsReceived),
    DebitNotes: lazy(Modules.DebitNotes),
    SupplierPayments: lazy(Modules.SupplierPayments),
    OutstandingPayables: lazy(Modules.OutstandingPayables),
    VendorForm: lazy(Modules.VendorForm),
    VendorDetails: lazy(Modules.VendorDetails),

    // Customers
    CustomerList: lazy(Modules.CustomerList),
    CustomerLedger: lazy(Modules.CustomerLedger),
    CustomerStatements: lazy(Modules.CustomerStatements),
    CustomerGroups: lazy(Modules.CustomerGroups),
    LoyaltyPoints: lazy(Modules.LoyaltyPoints),

    // Suppliers
    SupplierLedger: lazy(Modules.SupplierLedger),
    SupplierStatements: lazy(Modules.SupplierStatements),
    SupplierGroups: lazy(Modules.SupplierGroups),

    // Inventory
    ItemCategories: lazy(Modules.ItemCategories),
    StockSummary: lazy(Modules.StockSummary),
    StockMovement: lazy(Modules.StockMovement),
    LowStockAlerts: lazy(Modules.LowStockAlerts),
    UnitsHSNAgent: lazy(Modules.UnitsHSNAgent),
    WarehouseIntelligence: lazy(Modules.WarehouseIntelligence),
    BatchExpiryIntelligence: lazy(Modules.BatchExpiryIntelligence),

    // Finance
    DailyFinanceTracker: lazy(Modules.DailyFinanceTracker),
    CashBankIntelligence: lazy(Modules.CashBankIntelligence),
    PettyCashIntelligence: lazy(Modules.PettyCashIntelligence),
    BankIntelligence: lazy(Modules.BankIntelligence),
    BankReconciliationIntelligence: lazy(Modules.BankReconciliationIntelligence),
    FundTransferIntelligence: lazy(Modules.FundTransferIntelligence),

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
