# Mongo-free migration UI screen inventory — 2026-10-02

## Source and scope

Static inventory from `frontend/src/config/menu.config.ts` (visible navigation and nested items), `frontend/src/components/shared/Layout/RouteDefinitions.tsx` (direct URL route declarations and redirects), `frontend/src/services/ModuleRegistry.ts` (lazy module registry), and `frontend/src/components/shared/Layout/ModuleRenderer.tsx` (viewMode cases). This is a source inventory, not an API or database compatibility audit.

Counts: 119 menu entries including parent groups and nested entries; 133 explicit React Router paths; 142 lazy module registry entries; 208 unique ModuleRenderer viewMode cases.

## Menu tree entries

| Parent | Screen ID | Label | Module | Path |
|---|---|---|---|---|
| — | `DASHBOARD` | Dashboard | DASHBOARD | / |
| Dashboard | `DASHBOARD_OVERVIEW` | Overview | DASHBOARD | / |
| Dashboard | `DASHBOARD_SUMMARY` | Summary | DASHBOARD | /dashboard/summary |
| — | `POS` | Billing | POS | /pos |
| Billing | `POS` | Terminal | POS | /pos |
| Billing | `POS_ORDERS` | Orders | POS | /pos/orders |
| Billing | `POS_RETURNS` | Returns | POS | /pos/returns |
| Billing | `SHIFT_MANAGEMENT` | Shifts | POS | /pos/shifts |
| — | `SALES` | Sales | POS | /sales |
| Sales | `SALES_REGISTER` | Register | POS | /sales/invoices |
| Sales | `SALES_INVOICE` | Invoice | POS | /sales/new |
| Sales | `ESTIMATE` | Estimates | POS | /sales/estimates |
| Sales | `SALES_ORDER` | Orders | POS | /sales/orders |
| Sales | `DELIVERY_CHALLAN` | Challans | POS | /sales/challans |
| Sales | `SALES_RETURN` | Returns | POS | /sales/returns |
| Sales | `PAYMENT_IN` | Receipts | POS | /sales/payments |
| Sales | `CUSTOMER_CREDITS` | Credits | POS | /sales/credits |
| Sales | `OUTSTANDING_DUES` | Dues | POS | /sales/dues |
| Sales | `MRP_PENDING_INVOICES` | MRP Pending | POS | /sales/mrp-pending |
| — | `PURCHASE` | Purchase | PURCHASE | /purchase |
| Purchase | `PURCHASE_REGISTER` | Register | PURCHASE | /purchase/register |
| Purchase | `VENDORS` | Vendors | PURCHASE | /suppliers |
| Purchase | `PURCHASE_ENTRY` | New Entry | PURCHASE | /purchase/new |
| Purchase | `PURCHASE_EXPRESS` | Express Purchase (Small Biz) | PURCHASE | /purchase/express |
| Purchase | `PURCHASE_ORDER` | Orders | PURCHASE | /purchase/orders |
| Purchase | `PURCHASE_ORDER_LIST` | Order List | PURCHASE | /purchase/orders/list |
| Purchase | `PURCHASE_ORDER_FORM` | New Order | PURCHASE | /purchase/orders/new |
| Purchase | `GOODS_RECEIVED` | GRN | PURCHASE | /purchase/grn |
| Purchase | `GRN_TRANSFER` | GRN Transfers | PURCHASE | /purchase/grn-transfers |
| Purchase | `PURCHASE_BILLS` | Bills | PURCHASE | /purchase/bills |
| Purchase | `PURCHASE_HISTORY` | History | PURCHASE | /purchase/history |
| Purchase | `PURCHASE_RETURN` | Returns | PURCHASE | /purchase/returns |
| Purchase | `DEBIT_NOTES` | Debit Notes | PURCHASE | /purchase/debit-notes |
| Purchase | `SUPPLIER_PAYMENTS` | Payments | PURCHASE | /purchase/payments |
| Purchase | `PURCHASE_PAYMENT_OUT` | Payment Out | PURCHASE | /purchase/payment-out |
| Purchase | `OUTSTANDING_PAYABLES` | Payables | PURCHASE | /purchase/payables |
| Purchase | `PURCHASE_UPLOAD` | Upload | PURCHASE | /purchase/upload |
| Purchase | `RATE_REVISIONS` | Rates | PURCHASE | /purchase/rate-revisions |
| Purchase | `CHEQUES_VAULT` | PDC Vault | PURCHASE | /purchase/cheques-vault |
| Purchase | `VENDOR_INFLOW_OUTFLOW` | Cashflow | PURCHASE | /purchase/inflow-outflow |
| — | `WR_COUNTER` | Wholesale/Retail | POS | /wholesale/counter |
| Wholesale/Retail | `WR_COUNTER` | Counter Selection | POS | /wholesale/counter |
| Wholesale/Retail | `WR_SALES_ENTRY` | Sales Entry | POS | /wholesale/sales/new |
| Wholesale/Retail | `WR_SALES_BILL_VIEW` | Sales Bills | POS | /wholesale/sales/bills |
| Wholesale/Retail | `WR_PURCHASE_ENTRY` | Purchase Entry | PURCHASE | /wholesale/purchase/new |
| Wholesale/Retail | `WR_PURCHASE_BILL_VIEW` | Purchase Bills | PURCHASE | /wholesale/purchase/bills |
| Wholesale/Retail | `WR_SALES_REPORT` | Sales Report | REPORTS | /wholesale/reports/sales |
| Wholesale/Retail | `WR_STOCK_REPORT` | Stock Report | REPORTS | /wholesale/reports/stock |
| — | `INVENTORY` | Inventory | INVENTORY | /inventory |
| Inventory | `INVENTORY_ITEMS` | Items | INVENTORY | /inventory/items |
| Inventory | `INVENTORY_SEARCH` | Variant Search | INVENTORY | /inventory/search |
| Inventory | `ITEM_CATEGORIES` | Categories | INVENTORY | /inventory/categories |
| Inventory | `PRODUCT_MASTER` | Product Master | INVENTORY | /inventory/product-master |
| Inventory | `AGED_STOCK` | Aged Stock | INVENTORY | /inventory/aged-stock |
| Inventory | `BATCH_EXPIRY` | Batches | INVENTORY | /inventory/batch-expiry |
| Inventory | `BARCODE_GENERATOR` | Barcodes | INVENTORY | /inventory/barcodes |
| Inventory | `COMBO_OFFERS` | Combo Offers | INVENTORY | /inventory/combo-offers |
| Inventory | `SERIALIZED_UNITS` | Serial / IMEI Tracking | INVENTORY | /inventory/serialized-units |
| Inventory | `STOCK_WRITEOFF` | Damage / Loss | INVENTORY | /inventory/write-off |
| Inventory | `STOCK_TRANSFER` | Stock Transfer | INVENTORY | /inventory/stock-transfer |
| Inventory | `BULK_IMPORT` | Import | INVENTORY | /inventory/import |
| Inventory | `REPRINT_QUEUE` | Reprint | INVENTORY | /inventory/reprint |
| Inventory | `DATA_EXPORT` | Export | INVENTORY | /inventory/export |
| — | `FINANCE` | Finance | FINANCE | /finance |
| Finance | `FINANCE_AGENTS` | Overview | FINANCE | /finance/overview |
| Finance | `CASH_ACCOUNTS` | Cash | FINANCE | /finance/cash |
| Finance | `BANK_ACCOUNTS` | Bank | FINANCE | /cashbank/accounts |
| Finance | `PETTY_CASH` | Petty Cash | FINANCE | /finance/petty-cash |
| Finance | `FUND_TRANSFERS` | Transfers | FINANCE | /finance/transfers |
| Finance | `BANK_RECONCILIATION` | Reconciliation | FINANCE | /finance/reconciliation |
| Finance | `BANK_SUMMARY` | Summary | FINANCE | /finance/summary |
| Finance | `LOAN_ACCOUNTS` | Loans | FINANCE | /finance/loans |
| Finance | `FINANCIAL_GOALS` | Goals | FINANCE | /finance/goals |
| Finance | `BANK_STATEMENT` | Statements | FINANCE | /finance/bank-statement |
| Finance | `SMS_TRACKER` | SMS Tracker | FINANCE | /finance/sms-tracker |
| Finance | `GST_RECONCILIATION` | GST | FINANCE | /finance/gst |
| Finance | `JOURNAL_ENTRIES` | Journal | FINANCE | /finance/journal |
| Finance | `EMI_PLANS` | EMI Plans | FINANCE | /finance/emi-plans |
| Finance | `CARD_TERMINALS` | Card Terminals | FINANCE | /finance/card-terminals |
| — | `EXPENSES` | Expenses | EXPENSES | /expenses |
| Expenses | `EXPENSES` | Tracker | EXPENSES | /expenses/tracker |
| Expenses | `EXPENSE_CATEGORIES` | Categories | EXPENSES | /expenses/categories |
| Expenses | `RECURRING_EXPENSES` | Recurring | EXPENSES | /expenses/recurring |
| Expenses | `EXPENSE_REPORTS` | Reports | EXPENSES | /expenses/reports |
| Expenses | `BUDGET_TRACKER` | Budget Tracker | EXPENSES | /finance/budget-tracker |
| — | `CUSTOMERS` | Customers | CUSTOMERS | /customers |
| Customers | `CUSTOMER_LIST` | Directory | CUSTOMERS | /customers |
| Customers | `CUSTOMER_LEDGER` | Ledger | CUSTOMERS | /customers/ledger |
| — | `SUPPLIERS` | Suppliers | SUPPLIERS | /suppliers |
| Suppliers | `SUPPLIER_LIST` | Directory | SUPPLIERS | /suppliers |
| Suppliers | `SUPPLIER_LEDGER` | Ledger | SUPPLIERS | /suppliers/ledger |
| — | `HR` | Staff | HR | /staff |
| Staff | `STAFF_MANAGER` | Staff Management | HR | /people/employees/labor |
| Staff | `PAYROLL` | Payroll | HR | /people/payroll |
| Staff | `ALLOWANCE_MANAGER` | Allowances | HR | /people/employees/allowances |
| Staff | `ATTENDANCE_SUMMARY` | Attendance | HR | /people/payroll/attendance |
| Staff | `ATTENDANCE_BOARD` | Daily Board | HR | /people/attendance |
| Staff | `COMMISSION_MANAGEMENT` | Commission | HR | /people/commission |
| — | `STOREFRONT` | Storefront | ECOMMERCE | — |
| — | `REPORTS` | Insights | REPORTS | /reports/insights |
| Insights | `REPORTS` | Reports | REPORTS | /reports/insights |
| Insights | `REPORT_SALES` | Sales | REPORTS | /reports/insights |
| — | `SETTINGS` | System | DASHBOARD | /settings |
| System | `SETTINGS` | General | DASHBOARD | /settings |
| System | `SYNC_SHARE` | Sync | DASHBOARD | /settings/sync |
| System | `RESTORE` | Restore | DASHBOARD | /settings/restore |
| System | `TENANT_MANAGEMENT` | Tenants | MULTI_BRANCH | /settings/tenants |
| System | `TENANT_ARCHITECT` | Architect | MULTI_BRANCH | /settings/architect |
| System | `AUDIT_LOGS` | Audit | DASHBOARD | /settings/audit |
| System | `MASTER_DATA` | Master Data | DASHBOARD | /settings/master-data |
| System | `DISCOUNT_PERMISSIONS` | Discount Limits | DASHBOARD | /settings/discount-permissions |
| System | `SUPER_ADMIN_CONSOLE` | Admin | DASHBOARD | /settings/super-admin |
| — | `GROW` | Growth Platform | GROW | /?tab=GROW_DASHBOARD |
| Growth Platform | `GROW_DASHBOARD` | Dashboard | GROW | /?tab=GROW_DASHBOARD |
| Growth Platform | `GROW_GOOGLE` | Google | GROW | /?tab=GROW_GOOGLE |
| Growth Platform | `GROW_MARKETING` | Marketing | GROW | /?tab=GROW_MARKETING |
| Growth Platform | `GROW_ENGAGEMENT` | Engagement | GROW | /?tab=GROW_ENGAGEMENT |
| Growth Platform | `GROW_SYNC` | Sync | GROW | /?tab=GROW_SYNC |
| Growth Platform | `GROW_DATA` | Data | GROW | /?tab=GROW_DATA |

## Direct route declarations

| Path | Rendered module | Redirect target |
|---|---|---|
| `/` | ModuleRenderer | — |
| `/sales` | — | /sales/invoices |
| `/purchase` | — | /purchase/register |
| `/inventory` | — | /inventory/products |
| `/finance` | — | /finance/overview |
| `/expenses` | — | /expenses/tracker |
| `/customers` | CustomerList | — |
| `/marketing` | — | /?tab=GROW_MARKETING |
| `/reports` | — | /reports/insights |
| `/pos/terminal` | — | /pos |
| `/people` | — | /people/employees/labor |
| `/staff` | — | /people/employees/staff |
| `/grow` | — | /?tab=GROW_DASHBOARD |
| `/system` | — | /settings |
| `/engagement` | — | /?tab=GROW_ENGAGEMENT |
| `/sales/new` | SalesInvoiceForm | — |
| `/sales/invoice/create` | — | /sales/new |
| `/sales/invoice/:id` | SalesInvoiceDetail | — |
| `/sales/invoices` | SalesInvoiceRegister | — |
| `/sales/orders` | SalesOrderRegister | — |
| `/sales/orders/new` | SalesOrderCreator | — |
| `/sales/orders/:id` | SalesOrderDetail | — |
| `/sales/estimates` | EstimateRegister | — |
| `/sales/estimates/new` | EstimateCreator | — |
| `/sales/challans` | DeliveryChallanRegister | — |
| `/sales/challans/new` | DeliveryChallanCreator | — |
| `/sales/challans/:id` | DeliveryChallanDetail | — |
| `/sales/delivery-challan` | DeliveryChallanCreator | — |
| `/sales/delivery-challan/:id` | DeliveryChallanDetail | — |
| `/sales/delivery-challan-list` | DeliveryChallanRegister | — |
| `/sales/returns/new` | SalesReturn | — |
| `/sales/returns` | ReturnedItemsManager | — |
| `/sales/payments` | PaymentInList | — |
| `/sales/payments/new` | PaymentInCreator | — |
| `/sales/outstanding` | OutstandingDues | — |
| `/sales/dues` | OutstandingDues | — |
| `/sales/credits` | CustomerCredits | — |
| `/suppliers` | Suppliers | — |
| `/suppliers/add` | VendorForm | — |
| `/suppliers/inflow` | VendorInflowOutflow | — |
| `/suppliers/groups` | SupplierGroups | — |
| `/suppliers/agents` | Agents | — |
| `/suppliers/statements` | SupplierStatements | — |
| `/suppliers/ledger` | SupplierLedger | — |
| `/suppliers/:id` | VendorDetails | — |
| `/suppliers/:id/edit` | EditSupplier | — |
| `/suppliers/:id/ledger` | SupplierLedger | — |
| `/purchase/grn/new` | GRNForm | — |
| `/purchase/grn/new/:poId` | GRNForm | — |
| `/purchase/grn/view/:id` | GRNForm | — |
| `/purchase/orders` | ModuleRenderer | — |
| `/purchase/orders/list` | ModuleRenderer | — |
| `/purchase/orders/new` | PurchaseOrdersModule | — |
| `/purchase/orders/:id` | PurchaseOrdersModule | — |
| `/purchase/register` | PurchaseRegister | — |
| `/purchase/new` | PurchaseEntry | — |
| `/purchase/express` | PurchaseExpress | — |
| `/purchase/bills` | Bills | — |
| `/purchase/bills/new` | BillForm | — |
| `/purchase/bills/create` | — | /purchase/bills/new |
| `/purchase/bills/new/:grnId` | BillForm | — |
| `/purchase/bills/view/:id` | BillForm | — |
| `/purchase/returns` | PurchaseReturns | — |
| `/purchase/returns/new` | PurchaseReturnForm | — |
| `/purchase/returns/new/:grnId` | PurchaseReturnForm | — |
| `/purchase/returns/view/:id` | PurchaseReturnForm | — |
| `/purchase/ageing-analysis` | SupplierAgeing | — |
| `/purchase/payments` | SupplierPayments | — |
| `/purchase/payments/add` | PaymentOut | — |
| `/purchase/payment-out` | PaymentOut | — |
| `/purchase/snapshot` | — | — |
| `/purchase/payment-out/:vendorId` | PaymentOut | — |
| `/purchase/cheques-vault` | — | — |
| `/purchase/rate-revisions` | — | — |
| `/purchase/rate-revisions/new` | — | — |
| `/growth/tenant-architect/:tenantId` | TenantArchitect | — |
| `/cashbank/accounts` | BankAccounts | — |
| `/cashbank/transfers` | Transfers | — |
| `/cashbank/cash-in-hand` | CashInHand | — |
| `/cashbank/position` | CashBankPosition | — |
| `/cashbank/ledger/:id` | AccountLedger | — |
| `/finance/journal` | JournalEntries | — |
| `/finance/journal/new` | JournalEntryForm | — |
| `/finance/bank-statement` | BankStatementView | — |
| `/finance/sms-tracker` | SmsTrackerPage | — |
| `/finance/budget-tracker` | BudgetTrackerPage | — |
| `/finance/overview` | FinanceAgentDashboard | — |
| `/finance/agents` | — | /finance/overview |
| `/finance/goals` | FinancialGoals | — |
| `/inventory/search` | InventoryVariantSearch | — |
| `*` | ModuleRenderer | — |
| `/people/employees` | — | /people/employees/labor |
| `/people/employees/labor/*` | LaborManager | — |
| `/people/employees/allowances` | AllowanceManager | — |
| `/people/employees/staff` | StaffManager | — |
| `/people/attendance` | DailyAttendanceBoard | — |
| `/people/payroll` | PayrollDashboard | — |
| `/people/payroll/structure` | SalaryStructureManager | — |
| `/people/payroll/attendance` | AttendanceSummaryManager | — |
| `/people/payroll/run` | PayrollRuns | — |
| `/people/payroll/run/:id` | PayrollRuns | — |
| `/people/payroll/payslip/:id` | PayslipView | — |
| `/people/commission` | CommissionRules | — |
| `/finance/gst` | GSTReconciliation | — |
| `/inventory/reprint` | ReprintQueue | — |
| `/pos` | POSModule | — |
| `/pos/orders` | POSOrdersIntelligence | — |
| `/pos/returns` | POSReturnsIntelligence | — |
| `/pos/shifts` | ShiftManagementIntelligence | — |
| `/pos/cash-drawer` | CashDrawerIntelligence | — |
| `/dashboard/summary` | DailyFinanceTracker | — |
| `/expenses/tracker` | ExpenseIntelligence | — |
| `/expenses/categories` | ExpenseCategoriesManager | — |
| `/expenses/recurring` | RecurringExpensesIntelligence | — |
| `/expenses/reports` | ExpenseReportsIntelligence | — |
| `/reports/insights` | Reports | — |
| `/settings/audit` | AuditLogs | — |
| `/settings/sync` | ModuleRenderer | — |
| `/settings/restore` | ModuleRenderer | — |
| `/settings/tenants` | ModuleRenderer | — |
| `/settings/architect` | ModuleRenderer | — |
| `/settings/master-data` | ModuleRenderer | — |
| `/settings/discount-permissions` | ModuleRenderer | — |
| `/settings/super-admin` | ModuleRenderer | — |
| `/settings` | — | /settings/general |
| `/settings/:tab` | Settings | — |
| `/inventory/products` | InventoryManager | — |
| `/inventory/categories` | CategoryManager | — |
| `/inventory/product-master` | ProductMaster | — |
| `/inventory/aged-stock` | AgedStockManager | — |
| `/inventory/batch-price` | BatchPriceUpdate | — |
| `/expenses/daily` | DailyFinance | — |
| `/*` | ModuleRenderer | — |

## Lazy module registry

| Registry key | Import target |
|---|---|
| `Dashboard` | `../features/dashboard/Dashboard` |
| `Finance` | `../features/financial/Journal/JournalEntries` |
| `AgedStockManager` | `../features/inventory/AgedStockManager` |
| `Inventory` | `../features/inventory/InventoryManager` |
| `POS` | `../features/pos/POSModule` |
| `Reports` | `../features/reports/index` |
| `Purchase` | `../features/purchase/PurchaseRegister` |
| `PurchaseEntry` | `../features/purchase/GrnEntry` |
| `VendorManager` | `../features/suppliers/Suppliers` |
| `Sales` | `../features/sales/salesInvoices/SalesInvoice` |
| `Expenses` | `../features/expenses/ExpenseTrackerPage` |
| `Settings` | `../features/system/Settings/Settings` |
| `GrowthHub` | `../features/dashboard/GrowthHub` |
| `MarketingMetrics` | `../features/engagement/MarketingMetricsPage` |
| `WhatsAppMarketing` | `../features/engagement/WhatsAppCampaignsPage` |
| `OnlineStore` | `../features/commercial/OnlineStore/OnlineStore` |
| `MarketingTools` | `../features/business/MarketingTools` |
| `Sync` | `../features/system/Sync/SqlRestoreManager` |
| `DeviceIntelligence` | `../features/system/Sync/DeviceIntelligence` |
| `Data` | `../features/system/Data/index` |
| `Login` | `../features/auth/pages/Login` |
| `LoyaltyEngagement` | `../features/engagement/LoyaltyReportPage` |
| `ReprintQueue` | `../features/inventory/ReprintQueue` |
| `AuditLogs` | `../features/system/Audit/AuditLogViewer` |
| `SalesInvoiceRegister` | `../features/sales/salesInvoices/SalesInvoice` |
| `EstimateCreator` | `../features/sales/estimates/Estimate` |
| `EstimateRegister` | `../features/sales/estimates/EstimateList` |
| `SalesOrderCreator` | `../features/sales/salesOrders/SalesOrder` |
| `SalesOrderRegister` | `../features/sales/salesOrders/SalesOrderList` |
| `SalesOrderDetail` | `../features/sales/salesOrders/SalesOrderDetail` |
| `DeliveryChallanCreator` | `../features/sales/deliveryChallans/DeliveryChallan` |
| `DeliveryChallanRegister` | `../features/sales/deliveryChallans/DeliveryChallanList` |
| `DeliveryChallanDetail` | `../features/sales/deliveryChallans/DeliveryChallanDetail` |
| `SalesReturn` | `../features/sales/returns/Return` |
| `PaymentInCreator` | `../features/sales/payments/PaymentInCreator` |
| `PaymentInList` | `../features/sales/payments/PaymentInList` |
| `ReturnedItemsManager` | `../features/sales/returns/ReturnedItems` |
| `OutstandingDues` | `../features/customers/CustomersWithDues` |
| `MrpPendingInvoices` | `../features/sales/MrpPendingInvoices` |
| `SalesInvoiceForm` | `../features/sales/salesInvoices/SalesInvoiceForm` |
| `SalesInvoiceDetail` | `../features/sales/salesInvoices/SalesInvoiceDetail` |
| `PurchaseOrdersModule` | `../features/purchase/PurchaseOrdersModule` |
| `PurchaseRegister` | `../features/purchase/PurchaseRegister` |
| `GoodsReceived` | `../features/purchase/GoodsReceived` |
| `GRNTransfer` | `../features/purchase/GRNTransfer` |
| `GRNForm` | `../features/purchase/GRNForm` |
| `DebitNotes` | `../features/purchase/DebitNotes` |
| `SupplierPayments` | `../features/purchase/SupplierPayments` |
| `OutstandingPayables` | `../features/purchase/OutstandingPayables` |
| `VendorForm` | `../features/suppliers/AddSupplier` |
| `VendorDetails` | `../features/suppliers/SupplierDetail` |
| `Bills` | `../features/purchase/Bills` |
| `BillForm` | `../features/purchase/BillForm` |
| `PaymentOut` | `../features/purchase/PaymentOut` |
| `PurchaseHistory` | `../features/purchase/PurchaseHistory` |
| `PurchaseOrderDetails` | `../features/purchase/PurchaseOrderDetails` |
| `PurchaseOrderForm` | `../features/purchase/PurchaseOrderForm` |
| `PurchaseOrderList` | `../features/purchase/PurchaseOrderList` |
| `PurchaseReturnModule` | `../features/purchase/PurchaseReturns` |
| `PurchaseReturns` | `../features/purchase/PurchaseReturns` |
| `PurchaseReturnForm` | `../features/purchase/PurchaseReturnForm` |
| `PurchaseUpload` | `../features/purchase/PurchaseUpload` |
| `VendorInflowOutflow` | `../features/purchase/VendorInflowOutflow` |
| `CustomerList` | `../features/customers/CustomerList` |
| `CustomerLedger` | `../features/customers/CustomerLedger` |
| `CustomerStatements` | `../features/customers/CustomerStatements` |
| `CustomerGroups` | `../features/customers/CustomerGroups` |
| `LoyaltyPoints` | `../features/customers/LoyaltyPoints` |
| `AddCustomer` | `../features/customers/AddCustomer` |
| `CustomerDetail` | `../features/customers/CustomerDetail` |
| `CustomersPortfolio` | `../features/customers/CustomerList` |
| `CustomersWithDues` | `../features/customers/CustomersWithDues` |
| `EditCustomer` | `../features/customers/EditCustomer` |
| `SupplierLedger` | `../features/suppliers/SupplierLedger` |
| `SupplierStatements` | `../features/suppliers/SupplierStatements` |
| `SupplierGroups` | `../features/suppliers/SupplierGroups` |
| `Agents` | `../features/suppliers/Agents` |
| `SupplierAgeing` | `../features/purchase/SupplierAgeing` |
| `EditSupplier` | `../features/suppliers/EditSupplier` |
| `ItemCategories` | `../features/inventory/CategoryManager` |
| `ComboOffers` | `../features/combo-offers/ComboOfferManager` |
| `SerializedUnits` | `../features/inventory/SerializedUnitLookup` |
| `StockWriteOff` | `../features/inventory/StockWriteOff` |
| `StockTransfer` | `../features/inventory/StockTransfer` |
| `StockSummary` | `../features/inventory/StockSummaryPage` |
| `LowStockAlerts` | `../features/inventory/LowStockAlertsPage` |
| `UnitsHSNAgent` | `../features/system/MasterDataManager` |
| `FinanceAgentDashboard` | `../features/financial/cashbook/CashBankScreen` |
| `CashBankIntelligence` | `../features/financial/Cashbank/CashInHand` |
| `PettyCashIntelligence` | `../features/financial/Cashbank/PettyCashClose` |
| `MasterDataManager` | `../features/system/MasterDataManager` |
| `DiscountPermissions` | `../features/system/DiscountPermissions` |
| `BankIntelligence` | `../features/financial/Cashbank/BankAccounts` |
| `BankReconciliationIntelligence` | `../features/financial/overview/BankReconciliationPage` |
| `FundTransferIntelligence` | `../features/financial/Cashbank/Transfers` |
| `BankAccounts` | `../features/financial/Cashbank/BankAccounts` |
| `JournalEntries` | `../features/financial/Journal/JournalEntries` |
| `JournalEntryForm` | `../features/financial/Journal/JournalEntryForm` |
| `BankSummary` | `../features/financial/Cashbank/BankSummary` |
| `Transfers` | `../features/financial/Cashbank/Transfers` |
| `CashInHand` | `../features/financial/Cashbank/CashInHand` |
| `CashBankPosition` | `../features/financial/Cashbank/CashBankPosition` |
| `AccountLedger` | `../features/financial/Cashbank/AccountLedger` |
| `BankStatementView` | `../features/finance/BankStatementView` |
| `SmsTrackerPage` | `../features/finance/SmsTrackerPage` |
| `EMIPlans` | `../features/finance/EMIPlans` |
| `CardTerminals` | `../features/finance/CardTerminals` |
| `BudgetTrackerPage` | `../features/finance/BudgetTrackerPage` |
| `LoanAccounts` | `../features/financial/overview/LoansPage` |
| `ExpenseIntelligence` | `../features/expenses/ExpenseTrackerPage` |
| `ExpenseCategoriesManager` | `../features/expenses/ExpenseCategoriesManager` |
| `ExpensesModuleFeature` | `../features/expenses/ExpenseTrackerPage` |
| `RecurringExpensesIntelligence` | `../features/expenses/RecurringExpensesIntelligence` |
| `ExpenseReportsIntelligence` | `../features/expenses/ExpenseReportsIntelligence` |
| `POSOrdersIntelligence` | `../features/pos/POSOrdersIntelligence` |
| `POSReturnsIntelligence` | `../features/pos/POSReturnsPage` |
| `LaborManager` | `../features/employees/LaborManager` |
| `StaffManager` | `../features/employees/StaffManager` |
| `AllowanceManager` | `../features/employees/AllowanceManager` |
| `PayrollDashboard` | `../features/payroll/PayrollDashboard` |
| `SalaryStructureManager` | `../features/payroll/SalaryStructureManager` |
| `PayrollRuns` | `../features/payroll/PayrollRuns` |
| `AttendanceSummaryManager` | `../features/payroll/AttendanceSummaryManager` |
| `DailyAttendanceBoard` | `../features/employees/DailyAttendanceBoard` |
| `PayslipView` | `../features/payroll/PayslipView` |
| `CommissionRules` | `../features/payroll/CommissionRules` |
| `InventoryManager` | `../features/inventory/InventoryManager` |
| `InventoryVariantSearch` | `../features/inventory/InventoryVariantSearch` |
| `CategoryManager` | `../features/inventory/CategoryManager` |
| `ProductMaster` | `../features/inventory/ProductMaster` |
| `BatchPriceUpdate` | `../features/inventory/BatchPriceUpdate` |
| `DailyFinance` | `../features/expenses/DailyFinance` |
| `POSModule` | `../features/pos/POSModule` |
| `Suppliers` | `../features/suppliers/Suppliers` |
| `PurchaseExpress` | `../features/purchase/PurchaseExpress` |
| `WRCounter` | `../features/wholesale/WRCounterPicker` |
| `WRSalesEntry` | `../features/wholesale/WRSalesEntry` |
| `WRPurchaseEntry` | `../features/wholesale/WRPurchaseEntry` |
| `WRSalesBillView` | `../features/wholesale/WRSalesBillView` |
| `WRPurchaseBillView` | `../features/wholesale/WRPurchaseBillView` |
| `WRSalesReport` | `../features/wholesale/WRSalesReport` |
| `WRStockReport` | `../features/wholesale/WRStockReport` |

## View mode keys

- `PROFIT_PULSE`
- `DASHBOARD_SNAPSHOT`
- `DASHBOARD`
- `DASHBOARD_OVERVIEW`
- `DASHBOARD_SUMMARY`
- `SALES`
- `SALES_REGISTER`
- `SALES_INVOICE`
- `ESTIMATE`
- `SALES_ORDER`
- `DELIVERY_CHALLAN`
- `SALES_RETURN`
- `PAYMENT_IN`
- `PAYMENT_IN_LIST`
- `CHALLAN_LIST`
- `INVOICE_REGISTER`
- `ORDER_REGISTER`
- `RETURNED_ITEMS`
- `CUSTOMER_CREDITS`
- `OUTSTANDING_DUES`
- `MRP_PENDING_INVOICES`
- `PURCHASE`
- `PURCHASE_REGISTER`
- `PURCHASE_ENTRY`
- `PURCHASE_ORDER`
- `VENDORS`
- `SUPPLIER_LIST`
- `VENDOR_DETAILS`
- `VENDOR_FORM`
- `GOODS_RECEIVED`
- `GRN_TRANSFER`
- `GRN_FORM`
- `DEBIT_NOTES`
- `SUPPLIER_PAYMENTS`
- `PAYMENT_OUT`
- `PURCHASE_PAYMENT_OUT`
- `OUTSTANDING_PAYABLES`
- `PURCHASE_BILLS`
- `BILL_FORM`
- `PURCHASE_HISTORY`
- `PURCHASE_ORDER_DETAILS`
- `PURCHASE_ORDER_FORM`
- `PURCHASE_ORDER_LIST`
- `PURCHASE_RETURN`
- `PURCHASE_RETURNS`
- `PURCHASE_RETURN_FORM`
- `PURCHASE_UPLOAD`
- `SUPPLIER_AGEING`
- `VENDOR_INFLOW_OUTFLOW`
- `WR_COUNTER`
- `WR_SALES_ENTRY`
- `WR_PURCHASE_ENTRY`
- `WR_SALES_BILL_VIEW`
- `WR_PURCHASE_BILL_VIEW`
- `WR_SALES_REPORT`
- `WR_STOCK_REPORT`
- `CUSTOMER_LIST`
- `CUSTOMER_LEDGER`
- `CUSTOMER_STATEMENTS`
- `CUSTOMER_GROUPS`
- `LOYALTY_POINTS`
- `ADD_CUSTOMER`
- `CUSTOMER_DETAIL`
- `CUSTOMERS_PORTFOLIO`
- `CUSTOMERS_WITH_DUES`
- `EDIT_CUSTOMER`
- `SUPPLIER_LEDGER`
- `SUPPLIER_STATEMENTS`
- `SUPPLIER_GROUPS`
- `AGENTS`
- `INVENTORY`
- `INVENTORY_ITEMS`
- `AGED_STOCK`
- `ITEM_CATEGORIES`
- `PRODUCT_MASTER`
- `STOCK_SUMMARY`
- `STOCK_MOVEMENT`
- `LOW_STOCK_ALERTS`
- `STOCK_WRITEOFF`
- `STOCK_TRANSFER`
- `UNITS_HSN`
- `WAREHOUSES`
- `BATCH_EXPIRY`
- `COMBO_OFFERS`
- `SERIALIZED_UNITS`
- `FINANCE_AGENTS`
- `FINANCE`
- `CASH_ACCOUNTS`
- `BANK_ACCOUNTS`
- `BANK_SUMMARY`
- `BANK_RECONCILIATION`
- `FUND_TRANSFERS`
- `PETTY_CASH`
- `BANK_STATEMENT`
- `SMS_TRACKER`
- `BUDGET_TRACKER`
- `LOAN_ACCOUNTS`
- `FINANCIAL_GOALS`
- `JOURNAL_ENTRIES`
- `JOURNAL_ENTRY_FORM`
- `ACCOUNT_LEDGER`
- `EMI_PLANS`
- `CARD_TERMINALS`
- `POS`
- `POS_ORDERS`
- `POS_RETURNS`
- `SHIFT_MANAGEMENT`
- `CASH_DRAWER`
- `EXPENSES`
- `EXPENSE_ANALYTICS`
- `EXPENSE_CATEGORIES`
- `RECURRING_EXPENSES`
- `EXPENSE_REPORTS`
- `REPORTS`
- `REPORT_SALES`
- `REPORT_PURCHASE`
- `REPORT_INVENTORY`
- `REPORT_CUSTOMER`
- `REPORT_SUPPLIER`
- `REPORT_TAX`
- `REPORT_FINANCIAL`
- `DAY_BOOK`
- `TRIAL_BALANCE`
- `PROFIT_LOSS`
- `BALANCE_SHEET`
- `CASH_FLOW`
- `BARCODE_GENERATOR`
- `LABEL_PRINTING`
- `BULK_IMPORT`
- `DATA_EXPORT`
- `NUMBER_SERIES`
- `AUDIT_LOGS`
- `MASTER_DATA`
- `DISCOUNT_PERMISSIONS`
- `SETTINGS`
- `BUSINESS_PROFILE`
- `TAX_CONFIGURATION`
- `INVOICE_SETTINGS`
- `USERS_ROLES`
- `BRANCH_SETTINGS`
- `FINANCIAL_YEAR`
- `INTEGRATIONS`
- `SYNC_SHARE`
- `RESTORE`
- `BACKUP_RESTORE`
- `THEMES_BRANDING`
- `LABOR`
- `ALLOWANCE_MANAGER`
- `DAILY`
- `STOREFRONT`
- `TENANT_ARCHITECT`
- `ARCHITECTURE`
- `TENANT_MANAGEMENT`
- `SUPER_ADMIN_CONSOLE`
- `SUPER_ADMIN`
- `GROW_DASHBOARD`
- `GROW_OVERVIEW`
- `GROW_GOOGLE`
- `GROW_GOOGLE_PROFILE`
- `GROW_GOOGLE_REVIEWS`
- `GROW_GOOGLE_POSTS`
- `GROW_GOOGLE_INSIGHTS`
- `GROW_GOOGLE_PHOTOS`
- `GROW_MARKETING_METRICS`
- `GROW_PERFORMANCE`
- `GROW_HUB`
- `GROW_STORE`
- `GROW_STORE_SETUP`
- `GROW_PRODUCT_SYNC`
- `GROW_STORE_ORDERS`
- `GROW_STORE_CUSTOMERS`
- `GROW_STORE_PAYMENTS`
- `GROW_STORE_THEMES`
- `GROW_STORE_DOMAIN`
- `GROW_STORE_SHIPPING`
- `GROW_MARKETING`
- `GROW_MARKETING_CAMPAIGNS`
- `GROW_MARKETING_TEMPLATES`
- `GROW_MARKETING_EMAIL`
- `GROW_MARKETING_WHATSAPP`
- `GROW_MARKETING_SOCIAL`
- `GROW_MARKETING_TOOLS`
- `GROW_MARKETING_COUPONS`
- `GROW_MARKETING_OFFERS`
- `GROW_ENGAGEMENT`
- `GROW_ENGAGEMENT_SMS`
- `GROW_ENGAGEMENT_WHATSAPP`
- `GROW_ENGAGEMENT_EMAIL`
- `GROW_ENGAGEMENT_LOYALTY`
- `GROW_ENGAGEMENT_FEEDBACK`
- `GROW_SYNC_DEVICE`
- `GROW_SYNC`
- `GROW_SYNC_CLOUD`
- `GROW_BACKUP`
- `GROW_RESTORE_DATA`
- `GROW_SYNC_LOGS`
- `GROW_DATA`
- `GROW_DATA_IMPORT`
- `GROW_DATA_EXPORT`
- `GROW_DATA_CLEANUP`
- `GROW_DATA_DUPLICATES`
- `GROW_DATA_HEALTH`
- `GROW_REPORTS`
- `GROW_REPORT_SALES`
- `GROW_REPORT_ROI`
- `GROW_REPORT_CUSTOMER`
- `GROW_REPORT_TRAFFIC`
- `GROW_REPORT_CONVERSION`

## Caveats

- Navigation is permission-filtered at runtime; the list includes entries regardless of the current user’s role or tenant modules.
- Parent menu groups are not necessarily pages. Several routes are aliases/redirects, and multiple route paths can render the same module.
- `ModuleRenderer` has a dashboard fallback for unrecognized keys; presence in the switch is not proof that a dedicated screen exists.
- API paths, mounted backend routes, SQL/Mongo data sources, and behavior are not covered by this export; SQL-008 onward performs that trace.
