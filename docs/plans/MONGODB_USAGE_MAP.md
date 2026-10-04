# Where the ERP still uses MongoDB (backend)

Generated 2026-10-01 by scanning `backend/src` for files that import Mongoose models (`*/models/*.js`). 99 model files exist.

**71 backend files use Mongo models; 11 of them also have an SQL path ("SQL-aware", partial or full), 60 are Mongo-only.** "SQL-aware" means the file branches on `ITEM_DATA_SOURCE=sql` or calls a Textilesoft SQL adapter somewhere; it does not mean every function in it is SQL. Files that only call the SQL adapters directly (`integrations/textilesoft/sql*.ts`) are not listed.

## 1. Always-on Mongo even in SQL mode (what breaks first if Mongo is switched off)

- **Items mirrored into Mongo.** `PosController.createInvoiceInSql` looks every cart item up with `Item.findOne` (Mongo) to get its barcode, HSN, category and MRP, so POS checkout needs the item mirror (`integrations/textilesoft/syncService.ts`).
- **POS side effects on the Mongo path** (`PosController`, the non-SQL branch): `Invoice`, `Customer`, `LoyaltyTransaction`, `CashbankTransaction`, `BankAccount`, `StockLog`, `Tenant` (discount cap), `User` (discount approver). In SQL mode customers, points and cash book are ignored for the counter bill, but the discount approver and tenant policy are still read from Mongo.
- **Login.** `server.ts`: with SQL auth the login source is Textilesoft users; `AuthController` already uses the `erp` refresh-token adapter, but `core/routes/refreshToken.routes.ts` still imports the Mongo `RefreshToken` and `User` models, and audit still uses Mongo `AuditLog`.
- **Audit, notifications, feedback, settings:** `AuditLog`, `Notification`, `Feedback`, `Tenant` settings (`SettingsController`), `SyncController` (Backup, Conflict, SyncLedgerEvent).
- **Reports in SQL mode** that fall back to Mongo for anything the SQL reports don't cover (`ErpSalesReportService` reads `Invoice`; `FinanceReportService` and `GstReturnService` read `Bill`, `Invoice`, `Customer`, `Return`).

## 2. Per module (every file importing Mongo models)

### combo

| File | Models | SQL path |
|---|---|---|
| `modules/combo/services/ComboOfferService.ts` | ComboOffer, Item | **no (Mongo only)** |

### core

| File | Models | SQL path |
|---|---|---|
| `modules/core/controllers/AuditLogController.ts` | AuditLog | **no (Mongo only)** |
| `modules/core/controllers/BusinessController.ts` | BusinessProfile, BusinessType, Sector, Tenant | partial/yes |
| `modules/core/controllers/FeedbackController.ts` | Feedback | **no (Mongo only)** |
| `modules/core/controllers/NotificationController.ts` | Notification | **no (Mongo only)** |
| `modules/core/controllers/SettingsController.ts` | Tenant | **no (Mongo only)** |
| `modules/core/controllers/SqlRestoreController.ts` | Backup | partial/yes |
| `modules/core/controllers/SyncController.ts` | Backup, Conflict, SyncLedgerEvent, SyncSettings | **no (Mongo only)** |
| `modules/core/routes/refreshToken.routes.ts` | RefreshToken, User | **no (Mongo only)** |
| `modules/core/services/ConfigService.ts` | LoyaltyRule, SegmentRule | **no (Mongo only)** |
| `modules/core/services/ErpSalesReportService.ts` | Invoice | **no (Mongo only)** |
| `modules/core/services/inventorySeeder.ts` | Item | **no (Mongo only)** |

### crm

| File | Models | SQL path |
|---|---|---|
| `modules/crm/controllers/CustomerAnalyticsController.ts` | Customer | **no (Mongo only)** |
| `modules/crm/controllers/WhatsAppController.ts` | WhatsAppCampaign, WhatsAppTemplate | **no (Mongo only)** |
| `modules/crm/services/CustomerAnalyticsService.ts` | Customer, Invoice | **no (Mongo only)** |
| `modules/crm/services/EngagementReportService.ts` | Customer, Expense, Invoice, LoyaltyTransaction, MetaIntegration, WhatsAppCampaign | **no (Mongo only)** |
| `modules/crm/services/LoyaltyService.ts` | Customer, LoyaltyTransaction | **no (Mongo only)** |

### expense

| File | Models | SQL path |
|---|---|---|
| `modules/expense/services/ExpenseAnalysisService.ts` | Expense, User | **no (Mongo only)** |
| `modules/expense/services/ExpenseService.ts` | BankAccount, CashbankTransaction | **no (Mongo only)** |

### finance

| File | Models | SQL path |
|---|---|---|
| `modules/finance/repositories/BillRepository.ts` | Bill | **no (Mongo only)** |
| `modules/finance/repositories/CashBankRepository.ts` | BankAccount, CashbankTransaction | **no (Mongo only)** |
| `modules/finance/repositories/ChequeRepository.ts` | Cheque | **no (Mongo only)** |
| `modules/finance/repositories/LoanRepository.ts` | Loan, LoanPayment | **no (Mongo only)** |
| `modules/finance/services/BillService.ts` | Bill | **no (Mongo only)** |
| `modules/finance/services/CashBankOverviewService.ts` | BankAccount, BankStatementTransaction, Bill, CashbankTransaction, Cheque, Loan, LoanPayment, PettyCashClose | **no (Mongo only)** |
| `modules/finance/services/FinanceReportService.ts` | Bill, CashbankTransaction, Customer, Expense, Invoice, Return | partial/yes |
| `modules/finance/services/GSTService.ts` | Bill, GSTReconciliation | **no (Mongo only)** |
| `modules/finance/services/GstReturnService.ts` | Bill, Invoice | partial/yes |
| `modules/finance/services/SupplierPayableService.ts` | Bill, JournalEntry | **no (Mongo only)** |

### hr

| File | Models | SQL path |
|---|---|---|
| `modules/hr/services/PayrollService.ts` | AttendanceSummary, BankAccount, CashbankTransaction, Employee, JournalEntry, PayrollRun, Payslip, SalaryAdvance, SalaryComponent, SalaryStructure | **no (Mongo only)** |

### inventory

| File | Models | SQL path |
|---|---|---|
| `modules/inventory/controllers/ShopController.ts` | ShopSettings | **no (Mongo only)** |
| `modules/inventory/controllers/StockTransferController.ts` | Item, StockLog, StockTransfer | **no (Mongo only)** |
| `modules/inventory/services/InventoryService.ts` | Item, Shelf, StockLog | partial/yes |
| `modules/inventory/services/SerializedUnitService.ts` | Item, SerializedUnit | **no (Mongo only)** |
| `modules/inventory/services/StockAgingService.ts` | Item, Purchase, StockLog | **no (Mongo only)** |

### marketing

| File | Models | SQL path |
|---|---|---|
| `modules/marketing/controllers/MetaController.ts` | MetaIntegration | **no (Mongo only)** |
| `modules/marketing/services/MetaService.ts` | MetaIntegration | **no (Mongo only)** |

### middlewares

| File | Models | SQL path |
|---|---|---|
| `middlewares/auditMiddleware.ts` | AuditLog | **no (Mongo only)** |

### purchase

| File | Models | SQL path |
|---|---|---|
| `modules/purchase/repositories/AgentRepository.ts` | Agent | **no (Mongo only)** |
| `modules/purchase/repositories/GRNTransferRepository.ts` | GRNTransfer | **no (Mongo only)** |
| `modules/purchase/repositories/PurchaseReturnRepository.ts` | PurchaseReturn | **no (Mongo only)** |
| `modules/purchase/services/AgentService.ts` | Agent | **no (Mongo only)** |
| `modules/purchase/services/GRNService.ts` | GRN | **no (Mongo only)** |
| `modules/purchase/services/GRNTransferService.ts` | GRNTransfer | **no (Mongo only)** |
| `modules/purchase/services/PaymentOutService.ts` | BankAccount, Bill, CashbankTransaction | **no (Mongo only)** |
| `modules/purchase/services/PurchaseReturnService.ts` | PurchaseReturn | **no (Mongo only)** |
| `modules/purchase/services/PurchaseService.ts` | Bill, Item, JournalEntry, Purchase, Supplier, Tenant | partial/yes |
| `modules/purchase/services/SupplierAgeingService.ts` | Bill, Supplier | **no (Mongo only)** |
| `modules/purchase/services/SupplierPerformanceService.ts` | GRN, Purchase, PurchaseReturn, Supplier | **no (Mongo only)** |
| `modules/purchase/services/SupplierReportService.ts` | Bill, Purchase | **no (Mongo only)** |
| `modules/purchase/services/SupplierService.ts` | Bill, Purchase, PurchaseReturn, Supplier | **no (Mongo only)** |

### repositories

| File | Models | SQL path |
|---|---|---|
| `repositories/CustomerRepository.ts` | Customer | **no (Mongo only)** |
| `repositories/ExpenseRepository.ts` | Expense | **no (Mongo only)** |
| `repositories/GRNRepository.ts` | GRN | **no (Mongo only)** |
| `repositories/InventoryRepository.ts` | Item | **no (Mongo only)** |
| `repositories/InvoiceRepository.ts` | Invoice | **no (Mongo only)** |
| `repositories/PurchaseRepository.ts` | Purchase | **no (Mongo only)** |
| `repositories/PurchaseSupplierRepository.ts` | Supplier | **no (Mongo only)** |
| `repositories/RefreshTokenRepository.ts` | RefreshToken | **no (Mongo only)** |
| `repositories/SupplierRepository.ts` | Supplier | **no (Mongo only)** |
| `repositories/UserRepository.ts` | User | **no (Mongo only)** |

### sales

| File | Models | SQL path |
|---|---|---|
| `modules/sales/controllers/CommissionController.ts` | Invoice, Item, User | **no (Mongo only)** |
| `modules/sales/controllers/FulfillmentController.ts` | Invoice | **no (Mongo only)** |
| `modules/sales/controllers/PosController.ts` | BankAccount, CashbankTransaction, Customer, Invoice, Item, StockLog, Tenant, User | partial/yes |
| `modules/sales/services/ReturnAuditService.ts` | Invoice, Return, User | partial/yes |
| `modules/sales/services/SalesService.ts` | BankAccount, CashbankTransaction, Customer, Invoice | partial/yes |

### scripts

| File | Models | SQL path |
|---|---|---|
| `scripts/textilesoftSqlModeSelfTest.ts` | Item, StockLog | partial/yes |
| `scripts/textilesoftStockAgeCheck.ts` | Item | partial/yes |

### utils

| File | Models | SQL path |
|---|---|---|
| `utils/mongooseUtils.ts` | User | **no (Mongo only)** |
| `utils/stockMovementLogger.ts` | StockMovement | **no (Mongo only)** |
| `utils/stockReservation.ts` | Item | **no (Mongo only)** |

## 3. By business area: what is still Mongo (and the Textilesoft side)

| Area | Still Mongo | Textilesoft SQL equivalent | State |
|---|---|---|---|
| Sales billing (counter bill) | Item mirror, approver `User`, `Tenant` policy | `sales2`/`salsntry` (written) | SQL write done; lookups still Mongo |
| Sales invoices list/view | `Invoice` (non-SQL mode) | `sales2`/`salsntry` read | SQL read done |
| Sales orders, estimates, delivery challans, payments in/out, transactions, tax master, system config | Not found in the model-import scan: `integrations/textilesoft/erp*.ts` adapters already exist (`erpSalesOrder`, `erpEstimate`, `erpDeliveryChallan`, `erpPaymentIn`, `erpPaymentOut`, `erpTransaction`, `erpTaxMaster`, `erpSystemConfig`, `erpMasterEntry` ...) | ERP-only tables in the `erp` schema (no Textilesoft equivalent) | **Verified: routes use them** (see section 4) |
| Customers, groups, ledger, statements | `Customer` | `newcustomer` and friends (read only) | **deferred** |
| Loyalty points | `LoyaltyTransaction`, `LoyaltyRule` | points tables | **deferred** |
| Payments in / dues / outstanding | `Invoice`, `CashbankTransaction` still imported elsewhere; `PaymentInController` and `DueController` use `erpPaymentIn` / `erpTransaction` | `cash_collection_*` (empty), header tender columns | **Partly moved to `erp` schema** |
| Purchase entry / GRN / PO / returns | `GRN`, `Purchase`, `PurchaseReturn` (non-SQL branch) | `purentry*`, `PO*`, `PurchaseReturn*` (written) | SQL write done; payables below Mongo |
| Supplier payables, ageing, payment-out, cheques | `Bill`, `Supplier`, `Cheque`, `JournalEntry` | `supplier*` tables (partial) | **Mongo** |
| Stock transfer, write-off, serial units, aged stock | `StockTransfer`, `StockLog`, `SerializedUnit` | `MaterialTransfer`, stock damage/missing tables | **Mongo** |
| Expenses, cash & bank, petty cash, loans, budgets, journal | `Expense`, `BankAccount`, `CashbankTransaction`, `Loan`, `PettyCashClose`, `JournalEntry` | cash-in/out, petty-cash, expense tables | **Mongo** |
| GST returns | `Bill`, `Invoice` (partly SQL) | `sales2`, `purentry*` gst columns | partial |
| Payroll, attendance, employees, labour | all HR models | `newemployee` etc. (not used) | **Mongo** (ERP-only) |
| Combo offers | `ComboOffer` | combo tables | **Mongo** |
| Marketing / WhatsApp / Meta / online store | `MetaIntegration`, `WhatsApp*` | none | ERP-only |
| Audit log, sync, backup, tenants | `AuditLog`, `Backup`, `Conflict`, `Tenant` | none | ERP-only |

The `erp*.ts` adapters (above) mean part of the former Mongo data already lives in the `erp` SQL schema; whether each route has been switched to them was not checked.

Not covered by this scan: frontend code (it only calls the API), `erp.*` SQL tables (those are SQL, not Mongo), and any model reached through a repository index file instead of a direct `models/` import.

## 4. `erp` schema adapters verified in use (so these are no longer Mongo)

Checked by searching for the import of each adapter in controllers, services and repositories:

| Adapter | Used by |
|---|---|
| `erpSalesOrder`, `erpDeliveryChallan` | `SalesOrderController`, `DeliveryChallanController` |
| `erpEstimate` | `EstimateController` |
| `erpPaymentIn` | `PaymentInController`, `FinanceReportService` |
| `erpPaymentOut`, `erpPurchasePayment` | `SupplierController`, `SupplierLedgerController`, `FinanceReportService` |
| `erpTransaction` | `CustomerController`, `CustomerService`, `DueController` |
| `erpDebitNote`, `erpRateRevision`, `erpSupplierGroup`, `erpSupplierReconciliation` | purchase repositories / services |
| `erpExpenseCategory` | `ExpenseCategoryController`, `ExpenseReportController`, `ExpenseAnalysisService` |
| `erpMasterEntry`, `erpCatalogs`, `erpCategory` | `MasterDataService`, `InventoryService`, `category.service` |
| `erpTaxMaster`, `erpSystemConfig`, `erpShopSettings` | `ConfigController`, `ConfigService`, `ShopController` (core) |
| `erpCommissionRule` | `CommissionController` |
| `erpRefreshToken` | `AuthController` |



## 5. Second check: adapters vs Mongo in the same file

Scanned every backend file that imports an `erp*` adapter:

- **29 files use only the `erp` adapter and no Mongo model.** 27 of them are **not** gated on `ITEM_DATA_SOURCE`, so these features read and write the `erp` schema in SQL Server **always**, even if `ITEM_DATA_SOURCE=mongo`. (Only `MasterDataService` and `SupplierController` have an SQL-mode check.) Files: refresh tokens (`AuthController`), tax master / system config (`ConfigController`), shop settings (`ShopController`), customer transactions and dues (`CustomerController`, `CustomerService`, `DueController`, `TransactionRepository`), expense categories, categories (`category.service`), debit notes, supplier payments out, rate revisions, supplier groups, supplier reconciliation, delivery challans, sales orders, estimates, payments in, `ReturnController`.
- **8 files mix the adapter with Mongo models** (these are the real remaining Mongo in already-migrated areas): `ConfigService` (LoyaltyRule, SegmentRule), `ExpenseAnalysisService` (Expense, User), `FinanceReportService` (Bill, CashbankTransaction, Customer, Expense, Invoice, Return), `InventoryService` (Item, Shelf, StockLog), `PaymentOutService` (BankAccount, Bill, CashbankTransaction), `SupplierAgeingService` (Bill, Supplier), `SupplierService` (Bill, Purchase, PurchaseReturn, Supplier), `CommissionController` (Invoice, Item, User).

So for customer dues, payments in, estimates, sales orders and challans the data is already in SQL; the Mongo-only list in section 2 (60 files) plus the 8 mixed files above is what is left. The earlier statement "Mongo-only 60 files" counts files, not features: a feature can still be partly Mongo through a different file.

### Checked afterwards
- **Tables:** every `erp.<table>` that an `erp*.ts` adapter reads or writes is created by `backend/sql/erp/001`-`004` (25 tables). The other `erp.` names found in the code are not real tables: `schemaReport.ts` only lists *planned* ERP tables (agent, customer, expense, loan, payroll_run, shelf, ...), and `GstReturnService` / `sqlPartyReports` matched JavaScript such as `erp.map`. So the planned tables for those Mongo features do not exist yet.
- **Existing data:** no script in `backend/src/scripts` copies Mongo data into the `erp` tables (the only migration script is `erpMigrate.ts`, which creates tables). Anything already saved in Mongo for the migrated features (estimates, sales orders, payments in, expense categories and so on) is not in SQL unless it was copied by hand.
- **Run order:** `npm run erp:migrate` applies the four files in order; it must be run on each database before the billing return and idempotency paths (004) are used.

## 6. Third check (2026-10-02): wider scan, includes `integrations/` and infrastructure

The earlier scans skipped `integrations/textilesoft`. Including it, and also files that import `mongoose` directly, finds more:

**Counts.** 138 backend source files (excluding model definitions, interfaces and `v2/`) import a Mongo model or `mongoose`; plus 99 model files, 24 interface files, 3 `v2/` models and 20 scripts. No Mongo use was found in `/api`, `backend/apps`, `backend/budget-planner-api` or `frontend/mfe`. The frontend only calls the API.

**1. The `erp` SQL adapters still look data up in Mongo.** My earlier "29 files use only the adapter" was wrong for the adapter files themselves, because I excluded that folder. These adapters join to Mongo documents to fill in names and stock:
| Adapter | Mongo lookup |
|---|---|
| `erpSalesOrder` | `Item.find` (name, sku, unit; stockQty, reservedStock) |
| `erpDeliveryChallan` | `Item.find` (name, sku) |
| `erpPaymentIn` | `Invoice.find` |
| `erpTransaction` | `Invoice.findById` |
| `erpPurchasePayment` | `Supplier.find` (businessName) |
| `erpRateRevision` | `Item.findById`, `Supplier.findById`, `User` |

So estimates, sales orders, challans, payments and rate revisions store their own rows in SQL but still need Mongo `Item`, `Invoice` and `Supplier` documents to display names. With Mongo off, names and stock figures would come back empty or fail.

**2. SQL-mode helpers that are still Mongo-backed (inside `integrations/`):** `sqlItemSource` (`Item.findOne`), `sqlItemOverlay` (`Item.find`, `StockLog.aggregate`), `sqlStockReports` (`Item`, `StockLog`, `Store`), `sqlPartyReports` (`Supplier.find`), `syncService` (`Item`, `StockLog.insertMany`: the mirror). `sqlAuth` imports `mongoose`.

**3. Infrastructure that needs Mongo to run at all.** `config/database.ts` and `config/startup.ts` (connection; `server.ts` calls `connectDB()` on every start), `config/deploymentGates.ts`, `HealthController`, `utils/transaction.ts` (Mongo sessions), `utils/requestContext.ts`, `middlewares/authMiddleware.ts`, `tenantResolver.ts`, `transactionEnforcement.ts`, `auditMiddleware.ts`, `auditEnforcement.ts`. `docker-compose.yml` still defines a `mongo:6` service and `MONGO_URI`; `.env.example` still has `MONGO_URI`.

**4. Areas the earlier list did not name.** Roles, users, subscription plans, sectors and business profiles (`AdminController`, `RoleController`, `UserController`, `SubscriptionPlanController`, `SectorCategoryController`, `BusinessController`); crm `SupplierController`; day-end, daily finance, card terminals, clearing parameters, EMI plans, journal entries, bank statements, petty cash, GST R1, payment reminders; wholesale and fulfilment reports; SMS tracker; recurring expenses; legacy `v2/` models.

**5. Scripts that use Mongo (20):** bill-import and check scripts (`import_vijaya_bills.js`, `insert_user_bills*.js`, `verify_bills.js`, `check_discrepancy.*`, `get_vijaya_users.js`), seeders (`seed_roles*`, `seedSectorCategories`, `seedInventoryFilters`), the Textilesoft mirror and sync scripts, connection tests.

**What this means for "SQL only."** The SQL-only branch cannot simply drop MongoDB yet. Three things must move first: (a) the item, invoice and supplier name lookups in the `erp*` adapters and `sqlItemSource`/`sqlStockReports`; (b) the infrastructure layer (`connectDB`, session transactions, auth/tenant/audit middleware); (c) the Mongo-only domains in section 4. A progress note from a parallel session says expenses, payment-out, supplier ageing, finance reports, inventory and supplier CRUD were moved to SQL; the lists above reflect the code as scanned and may be partly out of date for those areas.

## 7. Fourth check (2026-10-02, morning): after the parallel SQL-only edits

Same scan as section 6. **135 backend source files** now import a Mongo model or `mongoose` (was 138); 15 of them are SQL-aware.

- **No longer import Mongo:** `PaymentOutService`, `SupplierAgeingService`, `ExpenseAnalysisService`, `CommissionController` (consistent with the progress note).
- **Still import Mongo even though the note says they were moved:** `ExpenseService` (BankAccount, CashbankTransaction), `InventoryService` (Item, Shelf, StockLog), `SupplierController` (Bill, Supplier), `FinanceReportService` (Bill, CashbankTransaction, Customer, Expense, Invoice, Return). These probably keep a Mongo branch for non-SQL mode; confirm the SQL branch never reaches them.
- **Unchanged:** the infrastructure layer (`connectDB`, session transactions, auth / tenant / audit middleware), `docker-compose.yml` `mongo` service and `MONGO_URI`, 11 files in `integrations/`, 10 root-level `repositories/`, and the HR, CRM, marketing, SMS tracker and most finance modules.
- By area now: finance 24, core 16, purchase 15, integrations 11, sales 11, repositories 10, scripts 9, inventory 7, crm 7, hr 5, middlewares 5, utils 5, config 3, expense 3, marketing 2, combo 1, sms-tracker 1.

## 8. Update 2026-10-02 (SQL-only re-enable, batch 1)
Re-enabled on SQL with no Mongo import (mounted in app.ts + SQL-only allow-list):
- `/api/pos/*` -> `PosSqlController`, `posSql.routes` (counters, billing-limits, return-sources, invoice/preview, invoice). Approver = Textilesoft owner login.
- `/api/purchase-returns/*` -> `purchaseReturnSql.routes` (create/list/get/delete on dbo via `sqlPurchaseReturn`).
- `/api/reports/*` -> `reportSql.routes`: stock, dashboard-stats, shop-sales (+day-bills, intelligence), party reports (8). Not yet: sales, customers, finance, GST returns, loyalty/marketing, returns-audit, cash-bank.
- New migration `005_supplier_group_member.sql` (erp.supplier_group_member) replaces Mongo Supplier.supplierGroup in Purchase-by-Party-Group. Nothing writes to it yet (needs the Suppliers page, Phase 3).
- Removed: sqlItemOverlay, item mirror (+ scripts), old Mongo PosController/pos routes.
- `shopAsOf` moved to `sqlShopClock.ts` (was in Mongo-importing sqlStockReports).
Still Mongo: `sqlStockReports.ts` (Item/StockLog/Store models) - stock movement/history/aging endpoints not mounted yet.

## 9. Update 2026-10-02 (reports SQL-only, batch 2)
Mounted, SQL only (reportSql.routes.ts, inventorySql.routes.ts):
- /api/reports: stock, dashboard-stats, shop-sales (+day-bills, intelligence), party (8), GST (gstr1, gstr3b, gstr9, purchase-register), finance (daybook, transactions, cash-flow, profit-loss, bill-profit, sales, expenses), returns-audit (new SQL source: sqlReturnsAudit.ts).
- /api/inventory (read-only): items list/search, barcode, stats, categories, low-stock, stock-movements, aging, stock-age, item history, 6 inventory reports.
- sqlStockReports.ts, FinanceReportService.ts, GstReturnService.ts, ReturnAuditService.ts now have no Mongo import.
Not mounted (no SQL source yet - need new erp tables, Phase 4): reports/finance cash-bank-overview, loans, bank-reconciliation; engagement loyalty / whatsapp / marketing; reports/sales + reports/customers (replaced by shop-sales and party reports).
Mongo files left: 123. Reachable from the running app: authMiddleware + tenantResolver (type-only mongoose import), BusinessController (Sector/BusinessProfile/Tenant models, via org.routes).
