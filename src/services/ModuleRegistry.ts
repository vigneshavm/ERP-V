import { lazy } from 'react';

/**
 * Module Registry
 * Centralizes all lazy-loaded components to enable:
 * 1. Clean code splitted imports for the main router.
 * 2. Proactive pre-fetching on hover or expected navigation.
 */

export const Modules = {
    // Core
    Dashboard: () => import('../components/Dashboard'),
    ProfitPulse: () => import('../components/ProfitPulse'),
    BusinessSnapshot: () => import('../components/BusinessSnapshot'),
    AgedStockManager: () => import('../components/AgedStockManager'),
    Inventory: () => import('../components/InventoryManager'),
    POS: () => import('../components/pos/POSModule'),
    Reports: () => import('../components/reports/BusinessReportsHub'),
    Finance: () => import('../components/FinanceTracker'),
    Purchase: () => import('../components/PurchaseManager'),
    PurchaseEntry: () => import('../components/purchase/PurchaseEntry'),
    VendorManager: () => import('../components/VendorManager'),
    Sales: () => import('../components/SalesHistory'),
    Expenses: () => import('../components/expenses/ExpensesModule'),
    Settings: () => import('../components/SettingsManager'),
    Storefront: () => import('../components/Storefront'),
    GrowDashboard: () => import('../components/GrowPlatform/Dashboard/GrowDashboard'),
    GrowthHub: () => import('../components/GrowPlatform/Dashboard/GrowthHub'),
    OnlinePerformance: () => import('../components/GrowPlatform/Dashboard/OnlinePerformance'),
    MarketingMetrics: () => import('../components/GrowPlatform/Dashboard/MarketingMetrics'),
    MarketingCampaigns: () => import('../components/GrowPlatform/Marketing/MarketingCampaigns'),
    MarketingTemplates: () => import('../components/GrowPlatform/Marketing/MarketingTemplates'),
    EmailMarketing: () => import('../components/GrowPlatform/Marketing/EmailMarketing'),
    EmailEngagement: () => import('../components/GrowPlatform/Marketing/EmailEngagement.tsx'),
    WhatsAppMarketing: () => import('../components/GrowPlatform/Marketing/WhatsAppMarketing'),
    SocialMediaMarketing: () => import('../components/GrowPlatform/Marketing/SocialMediaMarketing'),
    MarketingCoupons: () => import('../components/GrowPlatform/Marketing/MarketingCoupons'),
    MarketingOffers: () => import('../components/GrowPlatform/Marketing/MarketingOffers'),
    OnlineStore: () => import('../components/GrowPlatform/OnlineStore'),
    Marketing: () => import('../components/GrowPlatform/Marketing'),
    GoogleBusiness: () => import('../components/GrowPlatform/GoogleBusiness'),
    Sync: () => import('../components/GrowPlatform/Sync'),
    DeviceIntelligence: () => import('../components/GrowPlatform/Sync/DeviceIntelligence'),
    Data: () => import('../components/GrowPlatform/Data'),
    GrowReports: () => import('../components/GrowPlatform/Reports'),
    Architecture: () => import('../components/GrowPlatform/Architecture/ArchitectureIntelligence'),
    Login: () => import('../components/login'),
    SMSMarketing: () => import('../components/GrowPlatform/Marketing/SMSMarketing'),
    WhatsAppEngagement: () => import('../components/GrowPlatform/Marketing/WhatsAppEngagement.tsx'),
    LoyaltyEngagement: () => import('../components/GrowPlatform/Marketing/LoyaltyEngagement.tsx'),
    FeedbackEngagement: () => import('../components/GrowPlatform/Marketing/FeedbackEngagement.tsx'),
    SuperAdminGrowthConsole: () => import('../components/GrowPlatform/Architecture/SuperAdminGrowthConsole.tsx'),
    TenantManagement: () => import('../components/TenantManager.tsx'),
    // Tenant Growth Settings (Consolidated)
    TenantGrowthSettings: () => import('../components/GrowPlatform/Architecture/SuperAdminGrowthConsole.tsx'),
    TenantArchitect: () => import('../components/GrowPlatform/Architecture/TenantArchitect.tsx'),

    // Sales Features
    SalesInvoiceRegister: () => import('../components/sales/SalesInvoiceRegister'),
    EstimateCreator: () => import('../components/sales/EstimateCreator'),
    SalesOrderCreator: () => import('../components/sales/SalesOrderCreator'),
    DeliveryChallanCreator: () => import('../components/sales/DeliveryChallanCreator'),
    SalesReturn: () => import('../components/sales/SalesReturn'),
    PaymentInCreator: () => import('../components/sales/PaymentInCreator'),
    PaymentInList: () => import('../components/sales/PaymentInList'),
    ReturnedItemsManager: () => import('../components/sales/ReturnedItemsManager'),
    CustomerCredits: () => import('../components/sales/CustomerCredits'),
    OutstandingDues: () => import('../components/sales/OutstandingDues'),
    SalesModulePlaceholder: () => import('../components/sales/SalesModulePlaceholder'),

    // Purchase Features
    PurchaseOrdersModule: () => import('../components/purchase/orders/PurchaseOrdersModule'),
    PurchaseRegister: () => import('../components/purchase/PurchaseRegister'),
    GoodsReceived: () => import('../components/purchase/GoodsReceived'),
    DebitNotes: () => import('../components/purchase/DebitNotes'),
    SupplierPayments: () => import('../components/purchase/SupplierPayments'),
    OutstandingPayables: () => import('../components/purchase/OutstandingPayables'),
    VendorForm: () => import('../components/VendorForm'),
    VendorDetails: () => import('../components/VendorDetails'),

    // Customer Features
    CustomerList: () => import('../components/customers/CustomerList'),
    CustomerLedger: () => import('../components/customers/CustomerLedger'),
    CustomerStatements: () => import('../components/customers/CustomerStatements'),
    CustomerGroups: () => import('../components/customers/CustomerGroups'),
    LoyaltyPoints: () => import('../components/customers/LoyaltyPoints'),

    // Supplier Features
    SupplierLedger: () => import('../components/suppliers/SupplierLedger'),
    SupplierStatements: () => import('../components/suppliers/SupplierStatements'),
    SupplierGroups: () => import('../components/suppliers/SupplierGroups'),

    // Inventory Features
    ItemCategories: () => import('../components/inventory/CategoryManager'),
    StockSummary: () => import('../components/inventory/StockSummary'),
    StockMovement: () => import('../components/inventory/StockMovement'),
    LowStockAlerts: () => import('../components/inventory/LowStockAlerts'),
    UnitsHSNAgent: () => import('../components/inventory/UnitsHSNAgent'),
    WarehouseIntelligence: () => import('../components/inventory/WarehouseIntelligence'),
    BatchExpiryIntelligence: () => import('../components/inventory/BatchExpiryIntelligence'),

    // Finance Features
    DailyFinanceTracker: () => import('../components/DailyFinanceTracker'),
    CashBankIntelligence: () => import('../components/finance/CashBankIntelligence'),
    PettyCashIntelligence: () => import('../components/finance/PettyCashIntelligence'),
    BankIntelligence: () => import('../components/finance/BankIntelligence'),
    BankReconciliationIntelligence: () => import('../components/finance/BankReconciliationIntelligence'),
    FundTransferIntelligence: () => import('../components/finance/FundTransferIntelligence'),

    // Expense Features
    ExpenseIntelligence: () => import('../components/expenses/ExpenseIntelligence'),
    ExpenseCategoriesManager: () => import('../components/expenses/ExpenseCategoriesManager'),
    ExpensesModuleFeature: () => import('../components/expenses/ExpensesModule'),
    RecurringExpensesIntelligence: () => import('../components/expenses/RecurringExpensesIntelligence'),
    ExpenseReportsIntelligence: () => import('../components/expenses/ExpenseReportsIntelligence'),

    // POS Intelligence
    POSOrdersIntelligence: () => import('../components/pos/POSOrdersIntelligence'),
    POSReturnsIntelligence: () => import('../components/pos/POSReturnsIntelligence'),
    ShiftManagementIntelligence: () => import('../components/pos/ShiftManagementIntelligence'),
    CashDrawerIntelligence: () => import('../components/pos/CashDrawerIntelligence'),

    // HR
    LaborManager: () => import('../components/LaborManager'),
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
