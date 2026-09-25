import { lazy } from 'react';

/**
 * Module Registry
 * Centralizes all lazy-loaded components to enable:
 * 1. Clean code splitted imports for the main router.
 * 2. Proactive pre-fetching on hover or expected navigation.
 */

/**
 * Screens with no live data behind them yet. They used to render hardcoded sample figures (the *MockUI files);
 * now they open an explicit "not connected yet" page with no numbers on it.
 */
const notConnected = (title: string, detail?: string) => () =>
    import('../components/shared/Layout/notConnected').then(m => ({ default: m.notConnected({ title, detail }) }));

const CAMPAIGNS_DETAIL = 'Engagement and conversion per campaign need sales linked to the campaign that drove them, which the ERP doesn\'t record. WhatsApp campaigns you\'ve created are listed under WhatsApp Marketing.';

export const Modules = {
    Dashboard: () => import("../features/dashboard/Dashboard"),
    Finance: () => import("../features/financial/Journal/JournalEntries"),
    AgedStockManager: () => import("../features/inventory/AgedStockManager"),
    // "Inventory" is the real, data-backed manager.
    Inventory: () => import("../features/inventory/InventoryManager"),
    POS: () => import("../features/pos/POSModule"),
    Reports: () => import("../features/reports/index"),
    Purchase: () => import("../features/purchase/PurchaseRegister"),
    PurchaseEntry: () => import("../features/purchase/PurchaseEntry"),
    VendorManager: () => import("../features/suppliers/Suppliers"),
    Sales: () => import("../features/sales/salesInvoices/SalesInvoice"),
    Expenses: () => import("../features/expenses/ExpenseTrackerPage"),
    Settings: () => import("../features/system/Settings/Settings"),
    Storefront: notConnected('Online storefront'),
    GrowDashboard: notConnected('Growth dashboard'),
    GrowthHub: () => import("../features/dashboard/GrowthHub"),
    OnlinePerformance: notConnected('Online performance', 'Conversion rate, sessions, bounce rate and device mix need a web analytics integration for the online store, which isn\'t connected.'),
    // Growth screens below had hardcoded members, campaigns, reviews and ROI; they now read ERP records, or say
    // plainly that an integration isn't connected.
    MarketingMetrics: () => import("../features/engagement/MarketingMetricsPage"),
    MarketingCampaigns: notConnected('Marketing campaigns', CAMPAIGNS_DETAIL),
    MarketingTemplates: () => import("../features/marketing/MarketingTemplates"),
    EmailMarketing: notConnected('Email marketing', 'Subscriber counts, open and click rates need an email provider that records sends; the ERP doesn\'t send or track marketing email yet.'),
    EmailEngagement: () => import("../features/customer-engagement/EmailEngagement"),
    WhatsAppMarketing: () => import("../features/engagement/WhatsAppCampaignsPage"),
    SocialMediaMarketing: notConnected('Social media', 'Reach, followers and post performance need connected Instagram, Facebook or LinkedIn business accounts; the ERP doesn\'t read social media data.'),
    MarketingCoupons: notConnected('Coupons', 'Redemptions and revenue per coupon need the coupon used to be recorded on each sale; invoices don\'t record coupons yet.'),
    MarketingOffers: notConnected('Offer performance', 'Sales lift and discount analysis need each sale to record the offer that applied, which invoices don\'t yet. Your combo offers themselves are managed under Inventory → Combo Offers.'),
    OnlineStore: () => import("../features/commercial/OnlineStore/OnlineStore"),
    Marketing: notConnected('Marketing campaigns', CAMPAIGNS_DETAIL),
    MarketingTools: () => import("../features/business/MarketingTools"),
    GoogleBusiness: notConnected('Google Business Profile', 'Reviews, posts and insights need the Google Business Profile API, which isn\'t connected; the ERP\'s Google sync is not implemented yet.'),
    Sync: notConnected('Sync & backup'),
    DeviceIntelligence: () => import("../features/system/Sync/DeviceIntelligence"),
    Data: () => import("../features/system/Data/index"),
    GrowReports: notConnected('Growth reports'),
    Architecture: notConnected('Tenant architect'),
    Login: () => import("../features/auth/pages/Login"),
    SMSMarketing: () => import("../features/marketing/SMSMarketing"),
    WhatsAppEngagement: notConnected('WhatsApp conversations', 'Customer chats need a connected WhatsApp Business account that stores incoming messages; the ERP doesn\'t receive or store WhatsApp messages yet.'),
    LoyaltyEngagement: () => import("../features/engagement/LoyaltyReportPage"),
    FeedbackEngagement: notConnected('Customer feedback', 'Satisfaction scores, detractor rate and resolution times need customer feedback records; the ERP only stores staff feedback about the app.'),
    SuperAdminGrowthConsole: notConnected('Platform admin console'),
    TenantManagement: notConnected('Tenant management'),
    GSTReconciliation: () => import("../features/finance/GST/GSTReconciliation"),
    ReprintQueue: () => import("../features/inventory/ReprintQueue"),
    TenantGrowthSettings: notConnected('Growth settings'),
    TenantArchitect: notConnected('Tenant architect'),
    AuditLogs: () => import("../features/system/Audit/AuditLogViewer"),
    SalesInvoiceRegister: () => import("../features/sales/salesInvoices/SalesInvoice"),
    EstimateCreator: () => import("../features/sales/estimates/Estimate"),
    EstimateRegister: () => import("../features/sales/estimates/EstimateList"),
    SalesOrderCreator: () => import("../features/sales/salesOrders/SalesOrder"),
    SalesOrderRegister: () => import("../features/sales/salesOrders/SalesOrderList"),
    SalesOrderDetail: () => import("../features/sales/salesOrders/SalesOrderDetail"),
    DeliveryChallanCreator: () => import("../features/sales/deliveryChallans/DeliveryChallan"),
    DeliveryChallanRegister: () => import("../features/sales/deliveryChallans/DeliveryChallanList"),
    DeliveryChallanDetail: () => import("../features/sales/deliveryChallans/DeliveryChallanDetail"),
    SalesReturn: () => import("../features/sales/returns/Return"),
    PaymentInCreator: () => import("../features/sales/payments/PaymentInCreator"),
    PaymentInList: () => import("../features/sales/payments/PaymentInList"),
    ReturnedItemsManager: () => import("../features/sales/returns/ReturnedItems"),
    CustomerCredits: notConnected('Customer credits', 'Customers who owe you money are listed under Sales › Dues.'),
    OutstandingDues: () => import("../features/customers/CustomersWithDues"),
    MrpPendingInvoices: () => import("../features/sales/MrpPendingInvoices"),
    SalesInvoiceForm: () => import("../features/sales/salesInvoices/SalesInvoiceForm"),
    SalesInvoiceDetail: () => import("../features/sales/salesInvoices/SalesInvoiceDetail"),
    PurchaseOrdersModule: () => import("../features/purchase/PurchaseOrdersModule"),
    PurchaseRegister: () => import("../features/purchase/PurchaseRegister"),
    GoodsReceived: () => import("../features/purchase/GoodsReceived"),
    GRNTransfer: () => import("../features/purchase/GRNTransfer"),
    GRNForm: () => import("../features/purchase/GRNForm"),
    DebitNotes: () => import("../features/purchase/DebitNotes"),
    SupplierPayments: () => import("../features/purchase/SupplierPayments"),
    OutstandingPayables: () => import("../features/purchase/OutstandingPayables"),
    VendorForm: () => import("../features/suppliers/AddSupplier"),
    VendorDetails: () => import("../features/suppliers/SupplierDetail"),
    Bills: () => import("../features/purchase/Bills"),
    BillForm: () => import("../features/purchase/BillForm"),
    PaymentOut: () => import("../features/purchase/PaymentOut"),
    PurchaseHistory: () => import("../features/purchase/PurchaseHistory"),
    PurchaseOrderDetails: () => import("../features/purchase/PurchaseOrderDetails"),
    PurchaseOrderForm: () => import("../features/purchase/PurchaseOrderForm"),
    PurchaseOrderList: () => import("../features/purchase/PurchaseOrderList"),
    PurchaseReturnModule: () => import("../features/purchase/PurchaseReturns"),
    PurchaseReturns: () => import("../features/purchase/PurchaseReturns"),
    PurchaseReturnForm: () => import("../features/purchase/PurchaseReturnForm"),
    PurchaseUpload: () => import("../features/purchase/PurchaseUpload"),
    VendorInflowOutflow: () => import("../features/purchase/VendorInflowOutflow"),
    CustomerList: () => import("../features/customers/CustomerList"),
    CustomerLedger: () => import("../features/customers/CustomerLedger"),
    CustomerStatements: () => import("../features/customers/CustomerStatements"),
    CustomerGroups: () => import("../features/customers/CustomerGroups"),
    LoyaltyPoints: () => import("../features/customers/LoyaltyPoints"),
    AddCustomer: () => import("../features/customers/AddCustomer"),
    CustomerDetail: () => import("../features/customers/CustomerDetail"),
    CustomersPortfolio: () => import("../features/customers/CustomerList"),
    CustomersWithDues: () => import("../features/customers/CustomersWithDues"),
    EditCustomer: () => import("../features/customers/EditCustomer"),
    SupplierLedger: () => import("../features/suppliers/SupplierLedger"),
    SupplierStatements: () => import("../features/suppliers/SupplierStatements"),
    SupplierGroups: () => import("../features/suppliers/SupplierGroups"),
    Agents: () => import("../features/suppliers/Agents"),
    SupplierAgeing: () => import("../features/purchase/SupplierAgeing"),
    EditSupplier: () => import("../features/suppliers/EditSupplier"),
    // The real CategoryManager, on /api/inventory/categories.
    ItemCategories: () => import("../features/inventory/CategoryManager"),
    ComboOffers: () => import("../features/combo-offers/ComboOfferManager"),
    SerializedUnits: () => import("../features/inventory/SerializedUnitLookup"),
    StockWriteOff: () => import("../features/inventory/StockWriteOff"),
    StockTransfer: () => import("../features/inventory/StockTransfer"),
    StockSummary: () => import("../features/inventory/StockSummaryPage"),
    StockMovement: notConnected('Stock movement'),
    LowStockAlerts: () => import("../features/inventory/LowStockAlertsPage"),
    // Units and HSN codes are MasterEntry types (UNIT, PRODUCT_HSN), managed in MasterDataManager.
    UnitsHSNAgent: () => import("../features/system/MasterDataManager"),
    WarehouseIntelligence: notConnected('Warehouses'),
    BatchExpiryIntelligence: notConnected('Batches & expiry'),
    // Finance pages below were hardcoded demo screens; each key now opens a page backed by /api/reports/finance/*
    // or an existing API-backed Cashbank page.
    FinanceAgentDashboard: () => import("../features/financial/overview/CashBankOverview"),
    DailyFinanceTracker: notConnected("Today's summary", "For today's sales, receipts and payments, open Insights › Reports › Day Book."),
    CashBankIntelligence: () => import("../features/financial/Cashbank/CashInHand"),
    PettyCashIntelligence: () => import("../features/financial/Cashbank/PettyCashClose"),
    MasterDataManager: () => import("../features/system/MasterDataManager"),
    DiscountPermissions: () => import("../features/system/DiscountPermissions"),
    BankIntelligence: () => import("../features/financial/Cashbank/BankAccounts"),
    BankReconciliationIntelligence: () => import("../features/financial/overview/BankReconciliationPage"),
    FundTransferIntelligence: () => import("../features/financial/Cashbank/Transfers"),
    BankAccounts: () => import("../features/financial/Cashbank/BankAccounts"),
    JournalEntries: () => import("../features/financial/Journal/JournalEntries"),
    JournalEntryForm: () => import("../features/financial/Journal/JournalEntryForm"),
    BankSummary: () => import("../features/financial/Cashbank/BankSummary"),
    Transfers: () => import("../features/financial/Cashbank/Transfers"),
    CashInHand: () => import("../features/financial/Cashbank/CashInHand"),
    CashBankPosition: () => import("../features/financial/Cashbank/CashBankPosition"),
    AccountLedger: () => import("../features/financial/Cashbank/AccountLedger"),
    BankStatementView: () => import("../features/finance/BankStatementView"),
    SmsTrackerPage: () => import("../features/finance/SmsTrackerPage"),
    EMIPlans: () => import("../features/finance/EMIPlans"),
    CardTerminals: () => import("../features/finance/CardTerminals"),
    BudgetTrackerPage: () => import("../features/finance/BudgetTrackerPage"),
    LoanAccounts: () => import("../features/financial/overview/LoansPage"),
    FinancialGoals: notConnected('Financial goals'),
    ExpenseIntelligence: () => import("../features/expenses/ExpenseTrackerPage"),
    ExpenseCategoriesManager: () => import("../features/expenses/ExpenseCategoriesManager"),
    ExpensesModuleFeature: () => import("../features/expenses/ExpenseTrackerPage"),
    RecurringExpensesIntelligence: () => import("../features/expenses/RecurringExpensesIntelligence"),
    ExpenseReportsIntelligence: () => import("../features/expenses/ExpenseReportsIntelligence"),
    // POS Intelligence
    POSOrdersIntelligence: () => import("../features/pos/POSOrdersIntelligence"),
    // Returns & Refund Audit (live ERP returns). The old POSReturnsIntelligence fell back to six hardcoded returns.
    POSReturnsIntelligence: () => import("../features/pos/POSReturnsPage"),
    ShiftManagementIntelligence: notConnected('Shift management'),
    CashDrawerIntelligence: notConnected('Cash drawer', 'For cash in and out, use Insights › Reports › Day Book or Cash Flow.'),
    LaborManager: () => import("../features/employees/LaborManager"),
    StaffManager: () => import("../features/employees/StaffManager"),
    AllowanceManager: () => import("../features/employees/AllowanceManager"),
    PayrollDashboard: () => import("../features/payroll/PayrollDashboard"),
    SalaryStructureManager: () => import("../features/payroll/SalaryStructureManager"),
    PayrollRuns: () => import("../features/payroll/PayrollRuns"),
    AttendanceSummaryManager: () => import("../features/payroll/AttendanceSummaryManager"),
    DailyAttendanceBoard: () => import("../features/employees/DailyAttendanceBoard"),
    PayslipView: () => import("../features/payroll/PayslipView"),
    CommissionRules: () => import("../features/payroll/CommissionRules"),
    // New unregistered real pages
    InventoryManager: () => import("../features/inventory/InventoryManager"),
    InventoryVariantSearch: () => import("../features/inventory/InventoryVariantSearch"),
    CategoryManager: () => import("../features/inventory/CategoryManager"),
    BatchPriceUpdate: () => import("../features/inventory/BatchPriceUpdate"),
    DailyFinance: () => import("../features/expenses/DailyFinance"),
    POSModule: () => import("../features/pos/POSModule"),
    Suppliers: () => import("../features/suppliers/Suppliers"),
    PurchaseExpress: () => import("../features/purchase/PurchaseExpress"),
    // Wholesale/Retail (WR) Billing
    WRCounter: () => import("../features/wholesale/WRCounterPicker"),
    WRSalesEntry: () => import("../features/wholesale/WRSalesEntry"),
    WRPurchaseEntry: () => import("../features/wholesale/WRPurchaseEntry"),
    WRSalesBillView: () => import("../features/wholesale/WRSalesBillView"),
    WRPurchaseBillView: () => import("../features/wholesale/WRPurchaseBillView"),
    WRSalesReport: () => import("../features/wholesale/WRSalesReport"),
    WRStockReport: () => import("../features/wholesale/WRStockReport"),
};

/**
 * Shared lazy instances for aliased modules.
 * Ensures the same React.lazy component is reused across all keys
 * that point to the same underlying file — prevents unnecessary
 * unmount/remount when navigating between aliased routes.
 */
const _lazyDashboard = lazy(Modules.Dashboard);
const _lazyInventoryManager = lazy(Modules.InventoryManager);
const _lazyOnlineStore = lazy(Modules.OnlineStore);
const _lazyGoogleBusiness = lazy(Modules.GoogleBusiness);
const _lazyDeviceIntelligence = lazy(Modules.DeviceIntelligence);
const _lazyLogin = lazy(Modules.Login);
const _lazySalesInvoiceRegister = lazy(Modules.SalesInvoiceRegister);
const _lazyEstimateCreator = lazy(Modules.EstimateCreator);
const _lazyEstimateRegister = lazy(Modules.EstimateRegister);
const _lazySalesOrderCreator = lazy(Modules.SalesOrderCreator);
const _lazySalesOrderRegister = lazy(Modules.SalesOrderRegister);
const _lazySalesOrderDetail = lazy(Modules.SalesOrderDetail);
const _lazyDeliveryChallanCreator = lazy(Modules.DeliveryChallanCreator);
const _lazyDeliveryChallanRegister = lazy(Modules.DeliveryChallanRegister);
const _lazyDeliveryChallanDetail = lazy(Modules.DeliveryChallanDetail);
const _lazySalesReturn = lazy(Modules.SalesReturn);
const _lazyPaymentInCreator = lazy(Modules.PaymentInCreator);
const _lazyPaymentInList = lazy(Modules.PaymentInList);
const _lazyReturnedItemsManager = lazy(Modules.ReturnedItemsManager);
const _lazyCustomerCredits = lazy(Modules.CustomerCredits);
const _lazyOutstandingDues = lazy(Modules.OutstandingDues);
const _lazyMrpPendingInvoices = lazy(Modules.MrpPendingInvoices);
const _lazySalesInvoiceForm = lazy(Modules.SalesInvoiceForm);
const _lazySalesInvoiceDetail = lazy(Modules.SalesInvoiceDetail);
const _lazyGoodsReceived = lazy(Modules.GoodsReceived);
const _lazyGRNTransfer = lazy(Modules.GRNTransfer);
const _lazyTransfers = lazy(Modules.Transfers);
const _lazyFinancialGoals = lazy(Modules.FinancialGoals);
const _lazyLaborManager = lazy(Modules.LaborManager);
const _lazyStaffManager = lazy(Modules.StaffManager);
const _lazyAllowanceManager = lazy(Modules.AllowanceManager);
const _lazyPayrollDashboard = lazy(Modules.PayrollDashboard);
const _lazySalaryStructureManager = lazy(Modules.SalaryStructureManager);
const _lazyPayrollRuns = lazy(Modules.PayrollRuns);
const _lazyAttendanceSummaryManager = lazy(Modules.AttendanceSummaryManager);
const _lazyDailyAttendanceBoard = lazy(Modules.DailyAttendanceBoard);
const _lazyPayslipView = lazy(Modules.PayslipView);
const _lazyCommissionRules = lazy(Modules.CommissionRules);
const _lazyPOSOrdersIntelligence = lazy(Modules.POSOrdersIntelligence);
const _lazyPOSReturnsIntelligence = lazy(Modules.POSReturnsIntelligence);
const _lazyShiftManagementIntelligence = lazy(Modules.ShiftManagementIntelligence);
const _lazyCashDrawerIntelligence = lazy(Modules.CashDrawerIntelligence);
const _lazyPurchaseEntry = lazy(Modules.PurchaseEntry);
const _lazyGrowthHub = lazy(Modules.GrowthHub);
const _lazyOnlinePerformance = lazy(Modules.OnlinePerformance);
const _lazyMarketingMetrics = lazy(Modules.MarketingMetrics);
const _lazyMarketingCampaigns = lazy(Modules.MarketingCampaigns);
const _lazyMarketingTemplates = lazy(Modules.MarketingTemplates);
const _lazyEmailMarketing = lazy(Modules.EmailMarketing);
const _lazyEmailEngagement = lazy(Modules.EmailEngagement);
const _lazyWhatsAppMarketing = lazy(Modules.WhatsAppMarketing);
const _lazySocialMediaMarketing = lazy(Modules.SocialMediaMarketing);
const _lazyMarketingCoupons = lazy(Modules.MarketingCoupons);
const _lazyMarketingOffers = lazy(Modules.MarketingOffers);
const _lazyMarketingTools = lazy(Modules.MarketingTools);
const _lazySMSMarketing = lazy(Modules.SMSMarketing);
const _lazyWhatsAppEngagement = lazy(Modules.WhatsAppEngagement);
const _lazyLoyaltyEngagement = lazy(Modules.LoyaltyEngagement);
const _lazyFeedbackEngagement = lazy(Modules.FeedbackEngagement);
const _lazyPurchaseOrdersModule = lazy(Modules.PurchaseOrdersModule);
const _lazyPurchaseRegister = lazy(Modules.PurchaseRegister);
const _lazyGRNForm = lazy(Modules.GRNForm);
const _lazyDebitNotes = lazy(Modules.DebitNotes);
const _lazySupplierPayments = lazy(Modules.SupplierPayments);
const _lazyOutstandingPayables = lazy(Modules.OutstandingPayables);
const _lazyBills = lazy(Modules.Bills);
const _lazyBillForm = lazy(Modules.BillForm);
const _lazyPaymentOut = lazy(Modules.PaymentOut);
const _lazyPurchaseHistory = lazy(Modules.PurchaseHistory);
const _lazyPurchaseOrderDetails = lazy(Modules.PurchaseOrderDetails);
const _lazyPurchaseOrderForm = lazy(Modules.PurchaseOrderForm);
const _lazyPurchaseOrderList = lazy(Modules.PurchaseOrderList);
const _lazyPurchaseReturns = lazy(Modules.PurchaseReturns);
const _lazyPurchaseReturnForm = lazy(Modules.PurchaseReturnForm);
const _lazyPurchaseUpload = lazy(Modules.PurchaseUpload);
const _lazyVendorInflowOutflow = lazy(Modules.VendorInflowOutflow);
const _lazyCustomerList = lazy(Modules.CustomerList);
const _lazyCustomerLedger = lazy(Modules.CustomerLedger);
const _lazyCustomerStatements = lazy(Modules.CustomerStatements);
const _lazyCustomerGroups = lazy(Modules.CustomerGroups);
const _lazyLoyaltyPoints = lazy(Modules.LoyaltyPoints);
const _lazyAddCustomer = lazy(Modules.AddCustomer);
const _lazyCustomerDetail = lazy(Modules.CustomerDetail);
const _lazyCustomersWithDues = lazy(Modules.CustomersWithDues);
const _lazyEditCustomer = lazy(Modules.EditCustomer);
const _lazySupplierLedger = lazy(Modules.SupplierLedger);
const _lazySupplierStatements = lazy(Modules.SupplierStatements);
const _lazySupplierGroups = lazy(Modules.SupplierGroups);
const _lazyAgents = lazy(Modules.Agents);
const _lazySupplierAgeing = lazy(Modules.SupplierAgeing);
const _lazyEditSupplier = lazy(Modules.EditSupplier);
const _lazyFinanceAgentDashboard = lazy(Modules.FinanceAgentDashboard);
const _lazyCashBankIntelligence = lazy(Modules.CashBankIntelligence);
const _lazyPettyCashClose = lazy(Modules.PettyCashIntelligence);
const _lazyMasterDataManager = lazy(Modules.MasterDataManager);
const _lazyDiscountPermissions = lazy(Modules.DiscountPermissions);
const _lazyBankIntelligence = lazy(Modules.BankIntelligence);
const _lazyBankReconciliationIntelligence = lazy(Modules.BankReconciliationIntelligence);
const _lazyFundTransferIntelligence = lazy(Modules.FundTransferIntelligence);
const _lazyBankAccounts = lazy(Modules.BankAccounts);
const _lazyJournalEntries = lazy(Modules.JournalEntries);
const _lazyJournalEntryForm = lazy(Modules.JournalEntryForm);
const _lazyEMIPlans = lazy(Modules.EMIPlans);
const _lazyCardTerminals = lazy(Modules.CardTerminals);
const _lazyBankSummary = lazy(Modules.BankSummary);
const _lazyCashInHand = lazy(Modules.CashInHand);
const _lazyCashBankPosition = lazy(Modules.CashBankPosition);
const _lazyAccountLedger = lazy(Modules.AccountLedger);
const _lazyLoanAccounts = lazy(Modules.LoanAccounts);
const _lazyExpenseIntelligence = lazy(Modules.ExpenseIntelligence);
const _lazyExpenseCategoriesManager = lazy(Modules.ExpenseCategoriesManager);
const _lazyRecurringExpensesIntelligence = lazy(Modules.RecurringExpensesIntelligence);
const _lazyExpenseReportsIntelligence = lazy(Modules.ExpenseReportsIntelligence);
// Newly wired real pages
const _lazyBankStatementView = lazy(Modules.BankStatementView);
const _lazySmsTrackerPage = lazy(Modules.SmsTrackerPage);
const _lazyBudgetTrackerPage = lazy(Modules.BudgetTrackerPage);
const _lazyAgedStockManager = lazy(Modules.AgedStockManager);
const _lazyInventoryVariantSearch = lazy(Modules.InventoryVariantSearch);
const _lazyReprintQueue = lazy(Modules.ReprintQueue);
const _lazyReports = lazy(Modules.Reports);
const _lazyCategoryManager = lazy(Modules.CategoryManager);
const _lazyBatchPriceUpdate = lazy(Modules.BatchPriceUpdate);
const _lazyDailyFinance = lazy(Modules.DailyFinance);
// Batch-2 newly wired real pages
const _lazySettings = lazy(Modules.Settings);
const _lazyAuditLogs = lazy(Modules.AuditLogs);
const _lazyGSTReconciliation = lazy(Modules.GSTReconciliation);
const _lazyAddSupplier = lazy(Modules.VendorForm);
const _lazySupplierDetail = lazy(Modules.VendorDetails);
const _lazyPOSModule = lazy(Modules.POSModule);
const _lazySuppliers = lazy(Modules.Suppliers);
const _lazyPurchaseExpress = lazy(Modules.PurchaseExpress);
// Wholesale/Retail (WR) Billing
const _lazyWRCounter = lazy(Modules.WRCounter);
const _lazyWRSalesEntry = lazy(Modules.WRSalesEntry);
const _lazyWRPurchaseEntry = lazy(Modules.WRPurchaseEntry);
const _lazyWRSalesBillView = lazy(Modules.WRSalesBillView);
const _lazyWRPurchaseBillView = lazy(Modules.WRPurchaseBillView);
const _lazyWRSalesReport = lazy(Modules.WRSalesReport);
const _lazyWRStockReport = lazy(Modules.WRStockReport);
const _lazyComboOfferManager = lazy(Modules.ComboOffers);
const _lazySerializedUnitLookup = lazy(Modules.SerializedUnits);
const _lazyStockWriteOff = lazy(Modules.StockWriteOff);
const _lazyStockTransfer = lazy(Modules.StockTransfer);

export const LazyModules = {
    Dashboard: _lazyDashboard,
    Finance: lazy(Modules.Finance),
    AgedStockManager: _lazyAgedStockManager,
    Inventory: _lazyInventoryManager,
    InventoryManager: _lazyInventoryManager,
    POS: lazy(Modules.POS),
    Reports: _lazyReports,
    Purchase: lazy(Modules.Purchase),
    PurchaseEntry: _lazyPurchaseEntry,
    VendorManager: lazy(Modules.VendorManager),
    Sales: lazy(Modules.Sales),
    Expenses: lazy(Modules.Expenses),
    Settings: _lazySettings,
    Storefront: lazy(Modules.Storefront),
    GrowDashboard: lazy(Modules.GrowDashboard),
    GrowthHub: _lazyGrowthHub,
    OnlinePerformance: _lazyOnlinePerformance,
    MarketingMetrics: _lazyMarketingMetrics,
    MarketingCampaigns: _lazyMarketingCampaigns,
    MarketingTemplates: _lazyMarketingTemplates,
    EmailMarketing: _lazyEmailMarketing,
    EmailEngagement: _lazyEmailEngagement,
    WhatsAppMarketing: _lazyWhatsAppMarketing,
    SocialMediaMarketing: _lazySocialMediaMarketing,
    MarketingCoupons: _lazyMarketingCoupons,
    MarketingOffers: _lazyMarketingOffers,
    OnlineStore: _lazyOnlineStore,
    Marketing: lazy(Modules.Marketing),
    MarketingTools: _lazyMarketingTools,
    GoogleBusiness: _lazyGoogleBusiness,
    Sync: lazy(Modules.Sync),
    DeviceIntelligence: _lazyDeviceIntelligence,
    Data: lazy(Modules.Data),
    GrowReports: lazy(Modules.GrowReports),
    Architecture: lazy(Modules.Architecture),
    Login: _lazyLogin,
    SMSMarketing: _lazySMSMarketing,
    WhatsAppEngagement: _lazyWhatsAppEngagement,
    LoyaltyEngagement: _lazyLoyaltyEngagement,
    FeedbackEngagement: _lazyFeedbackEngagement,
    SuperAdminGrowthConsole: lazy(Modules.SuperAdminGrowthConsole),
    TenantManagement: lazy(Modules.TenantManagement),
    GSTReconciliation: _lazyGSTReconciliation,
    ReprintQueue: _lazyReprintQueue,
    TenantGrowthSettings: lazy(Modules.TenantGrowthSettings),
    TenantArchitect: lazy(Modules.TenantArchitect),
    AuditLogs: _lazyAuditLogs,
    SalesInvoiceRegister: _lazySalesInvoiceRegister,
    EstimateCreator: _lazyEstimateCreator,
    EstimateRegister: _lazyEstimateRegister,
    SalesOrderCreator: _lazySalesOrderCreator,
    SalesOrderRegister: _lazySalesOrderRegister,
    SalesOrderDetail: _lazySalesOrderDetail,
    DeliveryChallanCreator: _lazyDeliveryChallanCreator,
    DeliveryChallanRegister: _lazyDeliveryChallanRegister,
    DeliveryChallanDetail: _lazyDeliveryChallanDetail,
    SalesReturn: _lazySalesReturn,
    PaymentInCreator: _lazyPaymentInCreator,
    PaymentInList: _lazyPaymentInList,
    ReturnedItemsManager: _lazyReturnedItemsManager,
    CustomerCredits: _lazyCustomerCredits,
    OutstandingDues: _lazyOutstandingDues,
    MrpPendingInvoices: _lazyMrpPendingInvoices,
    SalesInvoiceForm: _lazySalesInvoiceForm,
    SalesInvoiceDetail: _lazySalesInvoiceDetail,
    PurchaseOrdersModule: _lazyPurchaseOrdersModule,
    PurchaseRegister: _lazyPurchaseRegister,
    GoodsReceived: _lazyGoodsReceived,
    GRNTransfer: _lazyGRNTransfer,
    GRNForm: _lazyGRNForm,
    DebitNotes: _lazyDebitNotes,
    SupplierPayments: _lazySupplierPayments,
    OutstandingPayables: _lazyOutstandingPayables,
    VendorForm: _lazyAddSupplier,
    VendorDetails: _lazySupplierDetail,
    Bills: _lazyBills,
    BillForm: _lazyBillForm,
    PaymentOut: _lazyPaymentOut,
    PurchaseHistory: _lazyPurchaseHistory,
    PurchaseOrderDetails: _lazyPurchaseOrderDetails,
    PurchaseOrderForm: _lazyPurchaseOrderForm,
    PurchaseOrderList: _lazyPurchaseOrderList,
    PurchaseReturnModule: lazy(Modules.PurchaseReturnModule),
    PurchaseReturns: _lazyPurchaseReturns,
    PurchaseReturnForm: _lazyPurchaseReturnForm,
    PurchaseUpload: _lazyPurchaseUpload,
    VendorInflowOutflow: _lazyVendorInflowOutflow,
    CustomerList: _lazyCustomerList,
    CustomerLedger: _lazyCustomerLedger,
    CustomerStatements: _lazyCustomerStatements,
    CustomerGroups: _lazyCustomerGroups,
    LoyaltyPoints: _lazyLoyaltyPoints,
    AddCustomer: _lazyAddCustomer,
    CustomerDetail: _lazyCustomerDetail,
    CustomersPortfolio: lazy(Modules.CustomersPortfolio),
    CustomersWithDues: _lazyCustomersWithDues,
    EditCustomer: _lazyEditCustomer,
    SupplierLedger: _lazySupplierLedger,
    SupplierStatements: _lazySupplierStatements,
    SupplierGroups: _lazySupplierGroups,
    Agents: _lazyAgents,
    SupplierAgeing: _lazySupplierAgeing,
    EditSupplier: _lazyEditSupplier,
    ItemCategories: _lazyCategoryManager,
    ComboOffers: _lazyComboOfferManager,
    SerializedUnits: _lazySerializedUnitLookup,
    StockWriteOff: _lazyStockWriteOff,
    StockTransfer: _lazyStockTransfer,
    StockSummary: lazy(Modules.StockSummary),
    StockMovement: lazy(Modules.StockMovement),
    LowStockAlerts: lazy(Modules.LowStockAlerts),
    UnitsHSNAgent: _lazyMasterDataManager,
    WarehouseIntelligence: lazy(Modules.WarehouseIntelligence),
    BatchExpiryIntelligence: lazy(Modules.BatchExpiryIntelligence),
    FinanceAgentDashboard: _lazyFinanceAgentDashboard,
    DailyFinanceTracker: lazy(Modules.DailyFinanceTracker),
    CashBankIntelligence: _lazyCashBankIntelligence,
    PettyCashIntelligence: _lazyPettyCashClose,
    MasterDataManager: _lazyMasterDataManager,
    DiscountPermissions: _lazyDiscountPermissions,
    BankIntelligence: _lazyBankIntelligence,
    BankReconciliationIntelligence: _lazyBankReconciliationIntelligence,
    FundTransferIntelligence: _lazyFundTransferIntelligence,
    BankAccounts: _lazyBankAccounts,
    JournalEntries: _lazyJournalEntries,
    JournalEntryForm: _lazyJournalEntryForm,
    EMIPlans: _lazyEMIPlans,
    CardTerminals: _lazyCardTerminals,
    BankSummary: _lazyBankSummary,
    Transfers: _lazyTransfers,
    CashInHand: _lazyCashInHand,
    CashBankPosition: _lazyCashBankPosition,
    AccountLedger: _lazyAccountLedger,
    BankStatementView: _lazyBankStatementView,
    SmsTrackerPage: _lazySmsTrackerPage,
    BudgetTrackerPage: _lazyBudgetTrackerPage,
    LoanAccounts: _lazyLoanAccounts,
    FinancialGoals: _lazyFinancialGoals,
    ExpenseIntelligence: _lazyExpenseIntelligence,
    ExpenseCategoriesManager: _lazyExpenseCategoriesManager,
    ExpensesModuleFeature: lazy(Modules.ExpensesModuleFeature),
    RecurringExpensesIntelligence: _lazyRecurringExpensesIntelligence,
    ExpenseReportsIntelligence: _lazyExpenseReportsIntelligence,
    POSOrdersIntelligence: _lazyPOSOrdersIntelligence,
    POSReturnsIntelligence: _lazyPOSReturnsIntelligence,
    ShiftManagementIntelligence: _lazyShiftManagementIntelligence,
    CashDrawerIntelligence: _lazyCashDrawerIntelligence,
    LaborManager: _lazyLaborManager,
    StaffManager: _lazyStaffManager,
    AllowanceManager: _lazyAllowanceManager,
    PayrollDashboard: _lazyPayrollDashboard,
    SalaryStructureManager: _lazySalaryStructureManager,
    PayrollRuns: _lazyPayrollRuns,
    AttendanceSummaryManager: _lazyAttendanceSummaryManager,
    DailyAttendanceBoard: _lazyDailyAttendanceBoard,
    PayslipView: _lazyPayslipView,
    CommissionRules: _lazyCommissionRules,
    // Newly added real pages
    CategoryManager: _lazyCategoryManager,
    InventoryVariantSearch: _lazyInventoryVariantSearch,
    BatchPriceUpdate: _lazyBatchPriceUpdate,
    DailyFinance: _lazyDailyFinance,
    POSModule: _lazyPOSModule,
    Suppliers: _lazySuppliers,
    PurchaseExpress: _lazyPurchaseExpress,
    // Wholesale/Retail (WR) Billing
    WRCounter: _lazyWRCounter,
    WRSalesEntry: _lazyWRSalesEntry,
    WRPurchaseEntry: _lazyWRPurchaseEntry,
    WRSalesBillView: _lazyWRSalesBillView,
    WRPurchaseBillView: _lazyWRPurchaseBillView,
    WRSalesReport: _lazyWRSalesReport,
    WRStockReport: _lazyWRStockReport,
};


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
    // Core modules
    if (viewId.startsWith('DASHBOARD')) preloadModule('Dashboard');
    else if (viewId.startsWith('INVENTORY') || viewId === 'ITEM_CATEGORIES') preloadModule('Inventory');
    else if (viewId.startsWith('POS')) preloadModule('POSModule');
    else if (viewId.startsWith('REPORT')) preloadModule('Reports');
    else if (viewId.startsWith('FINANCE')) preloadModule('Finance');
    else if (viewId.startsWith('PURCHASE') || viewId === 'VENDORS') preloadModule('Purchase');
    else if (viewId.startsWith('SALES') || viewId.startsWith('PAYMENT_IN')) preloadModule('Sales');
    else if (viewId.startsWith('EXPENSE')) preloadModule('Expenses');
    else if (viewId.startsWith('WR_')) preloadModule('WRCounter');
    else if (viewId === 'SETTINGS') preloadModule('Settings');
    else if (viewId === 'STOREFRONT') preloadModule('Storefront');

    // People — Customers
    else if (viewId.startsWith('CUSTOMER')) preloadModule('CustomerList');

    // People — Suppliers
    else if (viewId.startsWith('SUPPLIER') || viewId === 'SUPPLIER_AGEING') preloadModule('VendorManager');

    // People — HR & Payroll
    else if (viewId.startsWith('HR_') || viewId.startsWith('STAFF') || viewId.startsWith('LABOR')) preloadModule('StaffManager');
    else if (viewId.startsWith('PAYROLL') || viewId.startsWith('SALARY') || viewId.startsWith('ATTENDANCE')) preloadModule('PayrollDashboard');

    // GST & Finance sub-modules
    else if (viewId.startsWith('GST')) preloadModule('GSTReconciliation');
    else if (viewId.startsWith('JOURNAL')) preloadModule('JournalEntries');
    else if (viewId.startsWith('BANK_RECONCILIATION')) preloadModule('BankReconciliationIntelligence');

    // Marketing (non-GROW prefix)
    else if (viewId.startsWith('MARKETING_EMAIL')) preloadModule('EmailMarketing');
    else if (viewId.startsWith('MARKETING_WHATSAPP')) preloadModule('WhatsAppMarketing');
    else if (viewId.startsWith('MARKETING_SMS')) preloadModule('SMSMarketing');
    else if (viewId.startsWith('MARKETING_SOCIAL')) preloadModule('SocialMediaMarketing');
    else if (viewId.startsWith('MARKETING_COUPONS')) preloadModule('MarketingCoupons');
    else if (viewId.startsWith('MARKETING_OFFERS')) preloadModule('MarketingOffers');
    else if (viewId.startsWith('MARKETING')) preloadModule('Marketing');

    // Grow (GROW_ prefix — must come after specific GROW_ checks above)
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
