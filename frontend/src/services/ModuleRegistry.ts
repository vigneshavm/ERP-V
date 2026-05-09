import { lazy } from 'react';

/**
 * Module Registry
 * Centralizes all lazy-loaded components to enable:
 * 1. Clean code splitted imports for the main router.
 * 2. Proactive pre-fetching on hover or expected navigation.
 */

export const Modules = {
    Dashboard: () => import("../pages/Dashboard/DashboardMockUI"),
    DashboardMockUI: () => import("../pages/Dashboard/DashboardMockUI"),
    Finance: () => import("../pages/Financial/FinanceMockUI"),
    FinanceMockUI: () => import("../pages/Financial/FinanceMockUI"),
    AgedStockManager: () => import("../pages/Inventory/AgedStockManager"),
    Inventory: () => import("../pages/Inventory/InventoryMockUI"),
    InventoryMockUI: () => import("../pages/Inventory/InventoryMockUI"),
    POS: () => import("../pages/Pos/POSMockUI"),
    POSMockUI: () => import("../pages/Pos/POSMockUI"),
    Reports: () => import("../pages/Reports/index"),
    Purchase: () => import("../pages/Purchase/PurchaseMockUI"),
    PurchaseMockUI: () => import("../pages/Purchase/PurchaseMockUI"),
    PurchaseEntry: () => import("../pages/Purchase/PurchaseEntry"),
    VendorManager: () => import("../pages/Purchase/PurchaseMockUI"),
    Sales: () => import("../pages/Sales/SalesMockUI"),
    SalesMockUI: () => import("../pages/Sales/SalesMockUI"),
    Expenses: () => import("../pages/Expenses/ExpensesMockUI"),
    ExpensesMockUI: () => import("../pages/Expenses/ExpensesMockUI"),
    MarketingMockUI: () => import("../pages/Marketing/MarketingMockUI"),
    SuppliersMockUI: () => import("../pages/People/Suppliers/SuppliersMockUI"),
    SupplierLedgerMockUI: () => import("../pages/People/Suppliers/SupplierLedgerMockUI"),
    HRMockUI: () => import("../pages/People/Employees/HRMockUI"),
    ReportsMockUI: () => import("../pages/Reports/ReportsMockUI"),
    CustomerEngagementMockUI: () => import("../pages/CustomerEngagement/CustomerEngagementMockUI"),
    Settings: () => import("../pages/System/Settings/Settings"),
    SettingsMockUI: () => import("../pages/System/Settings/SettingsMockUI"),
    GrowMockUI: () => import("../pages/Dashboard/GrowMockUI"),
    SystemMockUI: () => import("../pages/System/SystemMockUI"),
    Storefront: () => import("../pages/Dashboard/GrowMockUI"),
    GrowDashboard: () => import("../pages/Dashboard/DashboardMockUI"),
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
    Marketing: () => import("../pages/Marketing/MarketingMockUI"),
    MarketingTools: () => import("../pages/Business/MarketingTools"),
    GoogleBusiness: () => import("../pages/Business/GoogleBusiness"),
    Sync: () => import("../pages/System/SystemMockUI"),
    DeviceIntelligence: () => import("../pages/System/Sync/DeviceIntelligence"),
    Data: () => import("../pages/System/SystemMockUI"),
    GrowReports: () => import("../pages/Dashboard/GrowMockUI"),
    Architecture: () => import("../pages/System/SystemMockUI"),
    Login: () => import("../pages/auth/Login"),
    SMSMarketing: () => import("../pages/Marketing/SMSMarketing"),
    WhatsAppEngagement: () => import("../pages/CustomerEngagement/WhatsAppEngagement"),
    LoyaltyEngagement: () => import("../pages/CustomerEngagement/LoyaltyEngagement"),
    FeedbackEngagement: () => import("../pages/CustomerEngagement/FeedbackEngagement"),
    SuperAdminGrowthConsole: () => import("../pages/Dashboard/GrowMockUI"),
    TenantManagement: () => import("../pages/System/SystemMockUI"),
    GSTReconciliation: () => import("../pages/Finance/GST/GSTReconciliation"),
    ReprintQueue: () => import("../pages/Inventory/ReprintQueue"),
    TenantGrowthSettings: () => import("../pages/Dashboard/GrowMockUI"),
    TenantArchitect: () => import("../pages/System/SystemMockUI"),
    AuditLogs: () => import("../pages/System/Audit/AuditLogViewer"),
    SalesInvoiceRegister: () => import("../pages/Sales/salesInvoices/SalesInvoice"),
    EstimateCreator: () => import("../pages/Sales/estimates/Estimate"),
    SalesOrderCreator: () => import("../pages/Sales/salesOrders/SalesOrder"),
    DeliveryChallanCreator: () => import("../pages/Sales/deliveryChallans/DeliveryChallan"),
    SalesReturn: () => import("../pages/Sales/returns/Return"),
    PaymentInCreator: () => import("../pages/Sales/payments/PaymentInCreator"),
    PaymentInList: () => import("../pages/Sales/payments/PaymentInList"),
    ReturnedItemsManager: () => import("../pages/Sales/returns/ReturnedItems"),
    CustomerCredits: () => import("../pages/Sales/payments/CustomerCreditsMockUI"),
    OutstandingDues: () => import("../pages/Sales/payments/OutstandingDuesMockUI"),
    SalesModulePlaceholder: () => import("../pages/Sales/SalesModulePlaceholderMockUI"),
    SalesInvoiceForm: () => import("../pages/Sales/salesInvoices/SalesInvoiceForm"),
    SalesInvoiceDetail: () => import("../pages/Sales/salesInvoices/SalesInvoiceDetail"),
    PurchaseOrdersModule: () => import("../pages/Purchase/PurchaseOrdersModule"),
    PurchaseRegister: () => import("../pages/Purchase/PurchaseRegister"),
    GoodsReceived: () => import("../pages/Purchase/GoodsReceived"),
    GRNForm: () => import("../pages/Purchase/GRNForm"),
    DebitNotes: () => import("../pages/Purchase/DebitNotes"),
    SupplierPayments: () => import("../pages/Purchase/SupplierPayments"),
    OutstandingPayables: () => import("../pages/Purchase/OutstandingPayables"),
    VendorForm: () => import("../pages/People/Suppliers/AddSupplier"),
    VendorDetails: () => import("../pages/People/Suppliers/SupplierDetail"),
    Bills: () => import("../pages/Purchase/Bills"),
    BillForm: () => import("../pages/Purchase/BillForm"),
    PaymentOut: () => import("../pages/Purchase/PaymentOut"),
    PurchaseHistory: () => import("../pages/Purchase/PurchaseHistory"),
    PurchaseOrderDetails: () => import("../pages/Purchase/PurchaseOrderDetails"),
    PurchaseOrderForm: () => import("../pages/Purchase/PurchaseOrderForm"),
    PurchaseOrderList: () => import("../pages/Purchase/PurchaseOrderList"),
    PurchaseReturnModule: () => import("../pages/Purchase/PurchaseMockUI"),
    PurchaseReturns: () => import("../pages/Purchase/PurchaseReturns"),
    PurchaseReturnForm: () => import("../pages/Purchase/PurchaseReturnForm"),
    PurchaseUpload: () => import("../pages/Purchase/PurchaseUpload"),
    VendorInflowOutflow: () => import("../pages/Purchase/VendorInflowOutflow"),
    CustomerList: () => import("../pages/People/Customers/CustomerList"),
    CustomerMockUI: () => import("../pages/People/Customers/CustomerMockUI"),
    CustomerLedger: () => import("../pages/People/Customers/CustomerLedger"),
    CustomerStatements: () => import("../pages/People/Customers/CustomerStatements"),
    CustomerGroups: () => import("../pages/People/Customers/CustomerGroups"),
    LoyaltyPoints: () => import("../pages/People/Customers/LoyaltyPoints"),
    AddCustomer: () => import("../pages/People/Customers/AddCustomer"),
    CustomerDetail: () => import("../pages/People/Customers/CustomerDetail"),
    CustomersPortfolio: () => import("../pages/People/Customers/CustomerMockUI"),
    CustomersWithDues: () => import("../pages/People/Customers/CustomersWithDues"),
    EditCustomer: () => import("../pages/People/Customers/EditCustomer"),
    SupplierLedger: () => import("../pages/People/Suppliers/SupplierLedger"),
    SupplierStatements: () => import("../pages/People/Suppliers/SupplierStatements"),
    SupplierGroups: () => import("../pages/People/Suppliers/SupplierGroups"),
    SupplierAgeing: () => import("../pages/Purchase/SupplierAgeing"),
    EditSupplier: () => import("../pages/People/Suppliers/EditSupplier"),
    ItemCategories: () => import("../pages/Inventory/InventoryMockUI"),
    StockSummary: () => import("../pages/Inventory/InventoryMockUI"),
    StockMovement: () => import("../pages/Inventory/InventoryMockUI"),
    LowStockAlerts: () => import("../pages/Inventory/InventoryMockUI"),
    UnitsHSNAgent: () => import("../pages/Inventory/InventoryMockUI"),
    WarehouseIntelligence: () => import("../pages/Inventory/InventoryMockUI"),
    BatchExpiryIntelligence: () => import("../pages/Inventory/InventoryMockUI"),
    FinanceAgentDashboard: () => import("../pages/Financial/FinanceAgentDashboard"),
    DailyFinanceTracker: () => import("../pages/Financial/FinanceMockUI"),
    CashBankIntelligence: () => import("../pages/Financial/Cashbank/CashBankIntelligence"),
    PettyCashIntelligence: () => import("../pages/Financial/FinanceMockUI"),
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
    ExpenseIntelligence: () => import("../pages/Expenses/ExpenseIntelligence"),
    ExpenseCategoriesManager: () => import("../pages/Expenses/ExpenseCategoriesManager"),
    ExpensesModuleFeature: () => import("../pages/Expenses/ExpensesMockUI"),
    RecurringExpensesIntelligence: () => import("../pages/Expenses/RecurringExpensesIntelligence"),
    ExpenseReportsIntelligence: () => import("../pages/Expenses/ExpenseReportsIntelligence"),
    // POS Intelligence
    POSOrdersIntelligence: () => import("../pages/Pos/POSOrdersIntelligenceMockUI"),
    POSReturnsIntelligence: () => import("../pages/Pos/POSReturnsIntelligenceMockUI"),
    ShiftManagementIntelligence: () => import("../pages/Pos/ShiftManagementIntelligenceMockUI"),
    CashDrawerIntelligence: () => import("../pages/Pos/CashDrawerIntelligenceMockUI"),
    LaborManager: () => import("../pages/People/Employees/LaborManager"),
    LaborAdd: () => import("../pages/People/Employees/LaborAddMockUI"),
    LaborDetail: () => import("../pages/People/Employees/LaborDetailMockUI"),
    StaffManager: () => import("../pages/People/Employees/StaffManager"),
    AllowanceManager: () => import("../pages/People/Employees/AllowanceManager"),
    PayrollDashboard: () => import("../pages/People/Payroll/PayrollDashboard"),
    SalaryStructureManager: () => import("../pages/People/Payroll/SalaryStructureManager"),
    PayrollRuns: () => import("../pages/People/Payroll/PayrollRuns"),
    AttendanceSummaryManager: () => import("../pages/People/Payroll/AttendanceSummaryManager"),
    DailyAttendanceBoard: () => import("../pages/People/Employees/DailyAttendanceBoard"),
    PayslipView: () => import("../pages/People/Payroll/PayslipView"),
    // New unregistered real pages
    InventoryManager: () => import("../pages/Inventory/InventoryManager"),
    CategoryManager: () => import("../pages/Inventory/CategoryManager"),
    BatchPriceUpdate: () => import("../pages/Inventory/BatchPriceUpdate"),
    DailyFinance: () => import("../pages/Expenses/DailyFinance"),
    POSModule: () => import("../pages/Pos/POSModule"),
    Suppliers: () => import("../pages/People/Suppliers/Suppliers"),
    PurchaseRegisterMockUI: () => import("../pages/Purchase/PurchaseRegisterMockUI"),
};

/**
 * Shared lazy instances for aliased modules.
 * Ensures the same React.lazy component is reused across all keys
 * that point to the same underlying file — prevents unnecessary
 * unmount/remount when navigating between aliased routes.
 */
const _lazyDashboardMockUI = lazy(Modules.DashboardMockUI);
const _lazyFinanceMockUI = lazy(Modules.FinanceMockUI);
const _lazyInventoryMockUI = lazy(Modules.InventoryMockUI);
const _lazyPOSMockUI = lazy(Modules.POSMockUI);
const _lazyReportsMockUI = lazy(Modules.ReportsMockUI);
const _lazyPurchaseMockUI = lazy(Modules.PurchaseMockUI);
const _lazySalesMockUI = lazy(Modules.SalesMockUI);
const _lazyExpensesMockUI = lazy(Modules.ExpensesMockUI);
const _lazyMarketingMockUI = lazy(Modules.MarketingMockUI);
const _lazySuppliersMockUI = lazy(Modules.SuppliersMockUI);
const _lazySupplierLedgerMockUI = lazy(Modules.SupplierLedgerMockUI);
const _lazyHRMockUI = lazy(Modules.HRMockUI);
const _lazyCustomerEngagementMockUI = lazy(Modules.CustomerEngagementMockUI);
const _lazySettingsMockUI = lazy(Modules.SettingsMockUI);
const _lazyGrowMockUI = lazy(Modules.GrowMockUI);
const _lazySystemMockUI = lazy(Modules.SystemMockUI);
const _lazyOnlineStore = lazy(Modules.OnlineStore);
const _lazyGoogleBusiness = lazy(Modules.GoogleBusiness);
const _lazyDeviceIntelligence = lazy(Modules.DeviceIntelligence);
const _lazyLogin = lazy(Modules.Login);
const _lazySalesInvoiceRegister = lazy(Modules.SalesInvoiceRegister);
const _lazyEstimateCreator = lazy(Modules.EstimateCreator);
const _lazySalesOrderCreator = lazy(Modules.SalesOrderCreator);
const _lazyDeliveryChallanCreator = lazy(Modules.DeliveryChallanCreator);
const _lazySalesReturn = lazy(Modules.SalesReturn);
const _lazyPaymentInCreator = lazy(Modules.PaymentInCreator);
const _lazyPaymentInList = lazy(Modules.PaymentInList);
const _lazyReturnedItemsManager = lazy(Modules.ReturnedItemsManager);
const _lazyCustomerCredits = lazy(Modules.CustomerCredits);
const _lazyOutstandingDues = lazy(Modules.OutstandingDues);
const _lazySalesModulePlaceholder = lazy(Modules.SalesModulePlaceholder);
const _lazySalesInvoiceForm = lazy(Modules.SalesInvoiceForm);
const _lazySalesInvoiceDetail = lazy(Modules.SalesInvoiceDetail);
const _lazyGoodsReceived = lazy(Modules.GoodsReceived);
const _lazyCustomerMockUI = lazy(Modules.CustomerMockUI);
const _lazyTransfers = lazy(Modules.Transfers);
const _lazyFinancialGoals = lazy(Modules.FinancialGoals);
const _lazyLaborManager = lazy(Modules.LaborManager);
const _lazyLaborAdd = lazy(Modules.LaborAdd);
const _lazyLaborDetail = lazy(Modules.LaborDetail);
const _lazyStaffManager = lazy(Modules.StaffManager);
const _lazyAllowanceManager = lazy(Modules.AllowanceManager);
const _lazyPayrollDashboard = lazy(Modules.PayrollDashboard);
const _lazySalaryStructureManager = lazy(Modules.SalaryStructureManager);
const _lazyPayrollRuns = lazy(Modules.PayrollRuns);
const _lazyAttendanceSummaryManager = lazy(Modules.AttendanceSummaryManager);
const _lazyDailyAttendanceBoard = lazy(Modules.DailyAttendanceBoard);
const _lazyPayslipView = lazy(Modules.PayslipView);
const _lazyPOSOrdersIntelligence = lazy(Modules.POSOrdersIntelligence);
const _lazyPOSReturnsIntelligence = lazy(Modules.POSReturnsIntelligence);
const _lazyShiftManagementIntelligence = lazy(Modules.ShiftManagementIntelligence);
const _lazyCashDrawerIntelligence = lazy(Modules.CashDrawerIntelligence);
// Upgraded from MockUI
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
const _lazySupplierAgeing = lazy(Modules.SupplierAgeing);
const _lazyEditSupplier = lazy(Modules.EditSupplier);
const _lazyFinanceAgentDashboard = lazy(Modules.FinanceAgentDashboard);
const _lazyCashBankIntelligence = lazy(Modules.CashBankIntelligence);
const _lazyBankIntelligence = lazy(Modules.BankIntelligence);
const _lazyBankReconciliationIntelligence = lazy(Modules.BankReconciliationIntelligence);
const _lazyFundTransferIntelligence = lazy(Modules.FundTransferIntelligence);
const _lazyBankAccounts = lazy(Modules.BankAccounts);
const _lazyJournalEntries = lazy(Modules.JournalEntries);
const _lazyJournalEntryForm = lazy(Modules.JournalEntryForm);
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
const _lazyReprintQueue = lazy(Modules.ReprintQueue);
const _lazyReports = lazy(Modules.Reports);
const _lazyInventoryManager = lazy(Modules.InventoryManager);
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
const _lazyPurchaseRegisterMockUI = lazy(Modules.PurchaseRegisterMockUI);

export const LazyModules = {
    Dashboard: _lazyDashboardMockUI,
    DashboardMockUI: _lazyDashboardMockUI,
    Finance: _lazyFinanceMockUI,
    FinanceMockUI: _lazyFinanceMockUI,
    AgedStockManager: _lazyAgedStockManager,
    Inventory: _lazyInventoryMockUI,
    InventoryMockUI: _lazyInventoryMockUI,
    POS: _lazyPOSMockUI,
    POSMockUI: _lazyPOSMockUI,
    Reports: _lazyReports,
    Purchase: _lazyPurchaseMockUI,
    PurchaseMockUI: _lazyPurchaseMockUI,
    PurchaseEntry: _lazyPurchaseEntry,
    VendorManager: _lazyPurchaseMockUI,
    Sales: _lazySalesMockUI,
    SalesMockUI: _lazySalesMockUI,
    Expenses: _lazyExpensesMockUI,
    ExpensesMockUI: _lazyExpensesMockUI,
    MarketingMockUI: _lazyMarketingMockUI,
    SuppliersMockUI: _lazySuppliersMockUI,
    SupplierLedgerMockUI: _lazySupplierLedgerMockUI,
    HRMockUI: _lazyHRMockUI,
    ReportsMockUI: _lazyReportsMockUI,
    CustomerEngagementMockUI: _lazyCustomerEngagementMockUI,
    Settings: _lazySettings,
    SettingsMockUI: _lazySettingsMockUI,
    GrowMockUI: _lazyGrowMockUI,
    SystemMockUI: _lazySystemMockUI,
    Storefront: _lazyGrowMockUI,
    GrowDashboard: _lazyDashboardMockUI,
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
    Marketing: _lazyMarketingMockUI,
    MarketingTools: _lazyMarketingTools,
    GoogleBusiness: _lazyGoogleBusiness,
    Sync: _lazySystemMockUI,
    DeviceIntelligence: _lazyDeviceIntelligence,
    Data: _lazySystemMockUI,
    GrowReports: _lazyGrowMockUI,
    Architecture: _lazySystemMockUI,
    Login: _lazyLogin,
    SMSMarketing: _lazySMSMarketing,
    WhatsAppEngagement: _lazyWhatsAppEngagement,
    LoyaltyEngagement: _lazyLoyaltyEngagement,
    FeedbackEngagement: _lazyFeedbackEngagement,
    SuperAdminGrowthConsole: _lazyGrowMockUI,
    TenantManagement: _lazySystemMockUI,
    GSTReconciliation: _lazyGSTReconciliation,
    ReprintQueue: _lazyReprintQueue,
    TenantGrowthSettings: _lazyGrowMockUI,
    TenantArchitect: _lazySystemMockUI,
    AuditLogs: _lazyAuditLogs,
    SalesInvoiceRegister: _lazySalesInvoiceRegister,
    EstimateCreator: _lazyEstimateCreator,
    SalesOrderCreator: _lazySalesOrderCreator,
    DeliveryChallanCreator: _lazyDeliveryChallanCreator,
    SalesReturn: _lazySalesReturn,
    PaymentInCreator: _lazyPaymentInCreator,
    PaymentInList: _lazyPaymentInList,
    ReturnedItemsManager: _lazyReturnedItemsManager,
    CustomerCredits: _lazyCustomerCredits,
    OutstandingDues: _lazyOutstandingDues,
    SalesModulePlaceholder: _lazySalesModulePlaceholder,
    SalesInvoiceForm: _lazySalesInvoiceForm,
    SalesInvoiceDetail: _lazySalesInvoiceDetail,
    PurchaseOrdersModule: _lazyPurchaseOrdersModule,
    PurchaseRegister: _lazyPurchaseRegister,
    GoodsReceived: _lazyGoodsReceived,
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
    PurchaseReturnModule: _lazyPurchaseMockUI,
    PurchaseReturns: _lazyPurchaseReturns,
    PurchaseReturnForm: _lazyPurchaseReturnForm,
    PurchaseUpload: _lazyPurchaseUpload,
    VendorInflowOutflow: _lazyVendorInflowOutflow,
    CustomerList: _lazyCustomerList,
    CustomerMockUI: _lazyCustomerMockUI,
    CustomerLedger: _lazyCustomerLedger,
    CustomerStatements: _lazyCustomerStatements,
    CustomerGroups: _lazyCustomerGroups,
    LoyaltyPoints: _lazyLoyaltyPoints,
    AddCustomer: _lazyAddCustomer,
    CustomerDetail: _lazyCustomerDetail,
    CustomersPortfolio: _lazyCustomerMockUI,
    CustomersWithDues: _lazyCustomersWithDues,
    EditCustomer: _lazyEditCustomer,
    SupplierLedger: _lazySupplierLedger,
    SupplierStatements: _lazySupplierStatements,
    SupplierGroups: _lazySupplierGroups,
    SupplierAgeing: _lazySupplierAgeing,
    EditSupplier: _lazyEditSupplier,
    ItemCategories: _lazyInventoryMockUI,
    StockSummary: _lazyInventoryMockUI,
    StockMovement: _lazyInventoryMockUI,
    LowStockAlerts: _lazyInventoryMockUI,
    UnitsHSNAgent: _lazyInventoryMockUI,
    WarehouseIntelligence: _lazyInventoryMockUI,
    BatchExpiryIntelligence: _lazyInventoryMockUI,
    FinanceAgentDashboard: _lazyFinanceAgentDashboard,
    DailyFinanceTracker: _lazyFinanceMockUI,
    CashBankIntelligence: _lazyCashBankIntelligence,
    PettyCashIntelligence: _lazyFinanceMockUI,
    BankIntelligence: _lazyBankIntelligence,
    BankReconciliationIntelligence: _lazyBankReconciliationIntelligence,
    FundTransferIntelligence: _lazyFundTransferIntelligence,
    BankAccounts: _lazyBankAccounts,
    JournalEntries: _lazyJournalEntries,
    JournalEntryForm: _lazyJournalEntryForm,
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
    ExpensesModuleFeature: _lazyExpensesMockUI,
    RecurringExpensesIntelligence: _lazyRecurringExpensesIntelligence,
    ExpenseReportsIntelligence: _lazyExpenseReportsIntelligence,
    POSOrdersIntelligence: _lazyPOSOrdersIntelligence,
    POSReturnsIntelligence: _lazyPOSReturnsIntelligence,
    ShiftManagementIntelligence: _lazyShiftManagementIntelligence,
    CashDrawerIntelligence: _lazyCashDrawerIntelligence,
    LaborManager: _lazyLaborManager,
    LaborAdd: _lazyLaborAdd,
    LaborDetail: _lazyLaborDetail,
    StaffManager: _lazyStaffManager,
    AllowanceManager: _lazyAllowanceManager,
    PayrollDashboard: _lazyPayrollDashboard,
    SalaryStructureManager: _lazySalaryStructureManager,
    PayrollRuns: _lazyPayrollRuns,
    AttendanceSummaryManager: _lazyAttendanceSummaryManager,
    DailyAttendanceBoard: _lazyDailyAttendanceBoard,
    PayslipView: _lazyPayslipView,
    // Newly added real pages
    InventoryManager: _lazyInventoryManager,
    CategoryManager: _lazyCategoryManager,
    BatchPriceUpdate: _lazyBatchPriceUpdate,
    DailyFinance: _lazyDailyFinance,
    POSModule: _lazyPOSModule,
    Suppliers: _lazySuppliers,
    PurchaseRegisterMockUI: _lazyPurchaseRegisterMockUI,
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
