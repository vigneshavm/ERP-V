import { lazy } from 'react';

/**
 * Module Registry
 * Centralizes all lazy-loaded components to enable:
 * 1. Clean code splitted imports for the main router.
 * 2. Proactive pre-fetching on hover or expected navigation.
 */

export const Modules = {
    // Core
    Dashboard: () => import('../../../src/components/Dashboard.tsx'),
    ProfitPulse: () => import('../../../src/components/ProfitPulse.tsx'),
    BusinessSnapshot: () => import('../../../src/components/BusinessSnapshot.tsx'),
    AgedStockManager: () => import('../../../src/components/AgedStockManager.tsx'),
    Inventory: () => import('../../../src/components/InventoryManager.tsx'),
    POS: () => import('../../../src/components/pos/POSModule.tsx'),
    Reports: () => import('../../../src/components/reports/BusinessReportsHub.tsx'),
    Finance: () => import('../../../src/components/FinanceTracker.tsx'),
    Purchase: () => import('../../../src/components/PurchaseManager.tsx'),
    PurchaseEntry: () => import('../../../src/components/purchase/PurchaseEntry.tsx'),
    VendorManager: () => import('../../../src/components/VendorManager.tsx'),
    Sales: () => import('../../../src/components/SalesHistory.tsx'),
    Expenses: () => import('../components/expenses/ExpensesModule'),
    Settings: () => import('../../../src/components/SettingsManager.tsx'),
    Storefront: () => import('../../../src/components/Storefront.tsx'),
    GrowDashboard: () => import('../../../src/components/GrowPlatform/Dashboard/GrowDashboard.tsx'),
    GrowthHub: () => import('../../../src/components/GrowPlatform/Dashboard/GrowthHub.tsx'),
    OnlinePerformance: () => import('../../../src/components/GrowPlatform/Dashboard/OnlinePerformance.tsx'),
    MarketingMetrics: () => import('../../../src/components/GrowPlatform/Dashboard/MarketingMetrics.tsx'),
    MarketingCampaigns: () => import('../../../src/components/GrowPlatform/Marketing/MarketingCampaigns.tsx'),
    MarketingTemplates: () => import('../../../src/components/GrowPlatform/Marketing/MarketingTemplates.tsx'),
    EmailMarketing: () => import('../../../src/components/GrowPlatform/Marketing/EmailMarketing.tsx'),
    EmailEngagement: () => import('../../../src/components/GrowPlatform/Marketing/EmailEngagement.tsx'),
    WhatsAppMarketing: () => import('../../../src/components/GrowPlatform/Marketing/WhatsAppMarketing.tsx'),
    SocialMediaMarketing: () => import('../../../src/components/GrowPlatform/Marketing/SocialMediaMarketing.tsx'),
    MarketingCoupons: () => import('../../../src/components/GrowPlatform/Marketing/MarketingCoupons.tsx'),
    MarketingOffers: () => import('../../../src/components/GrowPlatform/Marketing/MarketingOffers.tsx'),
    OnlineStore: () => import('../../../src/components/GrowPlatform/OnlineStore/index.tsx'),
    Marketing: () => import('../../../src/components/GrowPlatform/Marketing/index.tsx'),
    GoogleBusiness: () => import('../../../src/components/GrowPlatform/GoogleBusiness/index.tsx'),
    Sync: () => import('../../../src/components/GrowPlatform/Sync/index.tsx'),
    DeviceIntelligence: () => import('../../../src/components/GrowPlatform/Sync/DeviceIntelligence.tsx'),
    Data: () => import('../../../src/components/GrowPlatform/Data/index.tsx'),
    GrowReports: () => import('../../../src/components/GrowPlatform/Reports/index.tsx'),
    Architecture: () => import('../../../src/components/GrowPlatform/Architecture/ArchitectureIntelligence.tsx'),
    Login: () => import('../../../src/components/login.tsx'),
    SMSMarketing: () => import('../../../src/components/GrowPlatform/Marketing/SMSMarketing.tsx'),
    WhatsAppEngagement: () => import('../../../src/components/GrowPlatform/Marketing/WhatsAppEngagement.tsx'),
    LoyaltyEngagement: () => import('../../../src/components/GrowPlatform/Marketing/LoyaltyEngagement.tsx'),
    FeedbackEngagement: () => import('../../../src/components/GrowPlatform/Marketing/FeedbackEngagement.tsx'),
    SuperAdminGrowthConsole: () => import('../../../src/components/GrowPlatform/Architecture/SuperAdminGrowthConsole.tsx'),
    TenantManagement: () => import('../pages/tenants/TenantManager.tsx'),
    // Tenant Growth Settings (Consolidated)
    TenantGrowthSettings: () => import('../../../src/components/GrowPlatform/Architecture/SuperAdminGrowthConsole.tsx'),
    TenantArchitect: () => import('../../../src/components/GrowPlatform/Architecture/TenantArchitect.tsx'),

    // Sales Features
    SalesInvoiceRegister: () => import('../../../src/components/sales/SalesInvoiceRegister.tsx'),
    EstimateCreator: () => import('../../../src/components/sales/EstimateCreator.tsx'),
    SalesOrderCreator: () => import('../../../src/components/sales/SalesOrderCreator.tsx'),
    DeliveryChallanCreator: () => import('../../../src/components/sales/DeliveryChallanCreator.tsx'),
    SalesReturn: () => import('../../../src/components/sales/SalesReturn.tsx'),
    PaymentInCreator: () => import('../../../src/components/sales/PaymentInCreator.tsx'),
    PaymentInList: () => import('../../../src/components/sales/PaymentInList.tsx'),
    ReturnedItemsManager: () => import('../../../src/components/sales/ReturnedItemsManager.tsx'),
    CustomerCredits: () => import('../../../src/components/sales/CustomerCredits.tsx'),
    OutstandingDues: () => import('../../../src/components/sales/OutstandingDues.tsx'),
    SalesModulePlaceholder: () => import('../../../src/components/sales/SalesModulePlaceholder.tsx'),

    // Purchase Features
    PurchaseOrdersModule: () => import('../../../src/components/purchase/orders/PurchaseOrdersModule.tsx'),
    PurchaseRegister: () => import('../../../src/components/purchase/PurchaseRegister.tsx'),
    GoodsReceived: () => import('../../../src/components/purchase/GoodsReceived.tsx'),
    DebitNotes: () => import('../../../src/components/purchase/DebitNotes.tsx'),
    SupplierPayments: () => import('../../../src/components/purchase/SupplierPayments.tsx'),
    OutstandingPayables: () => import('../../../src/components/purchase/OutstandingPayables.tsx'),
    VendorForm: () => import('../../../src/components/VendorForm.tsx'),
    VendorDetails: () => import('../../../src/components/VendorDetails.tsx'),

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
    ItemCategories: () => import('../../../src/components/inventory/CategoryManager.tsx'),
    StockSummary: () => import('../../../src/components/inventory/StockSummary.tsx'),
    StockMovement: () => import('../../../src/components/inventory/StockMovement.tsx'),
    LowStockAlerts: () => import('../../../src/components/inventory/LowStockAlerts.tsx'),
    UnitsHSNAgent: () => import('../../../src/components/inventory/UnitsHSNAgent.tsx'),
    WarehouseIntelligence: () => import('../../../src/components/inventory/WarehouseIntelligence.tsx'),
    BatchExpiryIntelligence: () => import('../../../src/components/inventory/BatchExpiryIntelligence.tsx'),

    // Finance Features
    DailyFinanceTracker: () => import('../../../src/components/DailyFinanceTracker.tsx'),
    CashBankIntelligence: () => import('../../../src/components/finance/CashBankIntelligence.tsx'),
    PettyCashIntelligence: () => import('../../../src/components/finance/PettyCashIntelligence.tsx'),
    BankIntelligence: () => import('../../../src/components/finance/BankIntelligence.tsx'),
    BankReconciliationIntelligence: () => import('../../../src/components/finance/BankReconciliationIntelligence.tsx'),
    FundTransferIntelligence: () => import('../../../src/components/finance/FundTransferIntelligence.tsx'),

    // Expense Features
    ExpenseIntelligence: () => import('../components/expenses/ExpenseIntelligence'),
    ExpenseCategoriesManager: () => import('../components/expenses/ExpenseCategoriesManager'),
    ExpensesModuleFeature: () => import('../components/expenses/ExpensesModule'),
    RecurringExpensesIntelligence: () => import('../components/expenses/RecurringExpensesIntelligence'),
    ExpenseReportsIntelligence: () => import('../components/expenses/ExpenseReportsIntelligence'),

    // POS Intelligence
    POSOrdersIntelligence: () => import('../../../src/components/pos/POSOrdersIntelligence.tsx'),
    POSReturnsIntelligence: () => import('../../../src/components/pos/POSReturnsIntelligence.tsx'),
    ShiftManagementIntelligence: () => import('../../../src/components/pos/ShiftManagementIntelligence.tsx'),
    CashDrawerIntelligence: () => import('../../../src/components/pos/CashDrawerIntelligence.tsx'),

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
