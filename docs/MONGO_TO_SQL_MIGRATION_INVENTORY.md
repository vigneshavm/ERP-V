# MongoDB to SQL migration inventory

The end-to-end target, phased cutover sequence, acceptance criteria, and blockers for removing MongoDB from the application are documented in [`MONGO_FREE_SQL_MIGRATION_PLAN.md`](./MONGO_FREE_SQL_MIGRATION_PLAN.md). This inventory remains the detailed feature-level tracker.

## Constraint

For this migration, do not use MongoDB and do not create or alter tables in any database. Use existing SQL tables only when their fields and business meaning match the ERP data. Do not apply any `backend/sql/erp` migrations. If no compatible existing table can hold the required behavior, that feature is blocked under this constraint; do not redirect it into an unrelated table.

## Wave 0: initial inventory

The source inventory is paired with a read-only schema discovery of the configured Textilesoft SQL database on 2026-10-01. It found 503 tables and recorded names, columns, and approximate row counts; it did not read customer or transaction rows. The generated snapshot is in [`mongo-to-sql-live-schema`](./mongo-to-sql-live-schema/schema-report.json). This proves table presence in the configured database, not that a Mongo model is fully represented or that each table is appropriate as a target.

The snapshot found 23 existing `erp.*` tables. `erp.master_entry` had 4 rows and `erp.refresh_token` had 1; the other listed business tables were empty. Existing tables may be reused only when their present schema matches the data and workflow. No new table or schema migration is allowed in SSS or elsewhere.

Several possible legacy targets exist in `dbo`, including `newcustomer`, `newemployee`, `supplierdetail`, `BankTransEntry`, `expenseentry`, `expensegroup`, `expensename`, customer point tables, and combo-offer tables. Existence alone is not approval: some were empty, and fields/semantics still need route-level comparison.

| Area / current Mongo models | Candidate SQL target | Current evidence / next check |
|---|---|---|
| Product and inventory: `Item`, `Category`, `ProductCategory`, `Brand`, `Color`, `Size`, `Shelf`, `SerializedUnit`, `StockLog`, `StockTransfer`, `ReprintQueue`, `ShopSettings` | Existing SSS product, attribute, stock, and organisation tables where exact mappings exist; otherwise blocked | SQL adapters exist for some products, attributes, organisation, purchases, and stock reports. Trace every model-backed route and fallback; several inventory concepts have no proven existing table mapping. |
| Sales: `Invoice`, `Return`, `Transaction`, `SalesOrder`, `Estimate`, `DeliveryChallan`, `PaymentIn`, `CommissionRule` | Existing SSS bill/return tables for compatible transactions; otherwise blocked | POS and sales-return SQL writers exist. Do not apply `backend/sql/erp/*.sql`; they define schema changes. |
| Purchase: `Purchase`, `GRN`, `PurchaseReturn`, `PurchasePayment`, `PaymentOut`, `DebitNote`, `RateRevision`, `SupplierReconciliation`, `SupplierGroup`, `Agent`, `GRNTransfer` | Existing SSS GRN, PO, purchase-return, and supplier tables where compatible; otherwise blocked | SQL adapters exist for GRN, PO, purchase return, and suppliers. Verify payment, transfer, reconciliation, and debit-note routes for Mongo fallbacks. |
| CRM: `Customer`, `LoyaltyTransaction`, `WhatsAppCampaign`, `WhatsAppTemplate` | Existing SSS customer/party tables only where semantically compatible; otherwise blocked | `dbo.newcustomer` holds basic customer fields, but the API and consumers are Mongo-coupled. Loyalty ledger and campaign persistence lack a proven compatible target. |
| Finance: `BankAccount`, `BankStatementTransaction`, `Bill`, `CardTerminal`, `CashbankTransaction`, `Cheque`, `ClearingParameter`, `DailyFinance`, `DayEndReconciliation`, `Due`, `DueAdjustment`, `EMIPlan`, `GSTReconciliation`, `JournalEntry`, `Loan`, `LoanPayment`, `LoyaltyTransaction`, `PettyCashClose` | Existing SSS finance/ledger tables only when proven compatible; otherwise blocked | SQL reports read portions of Textilesoft data, but that does not establish SQL write coverage for ERP finance records. Journals and loans have no proven existing target. |
| Expenses: `Expense`, `ExpenseCategory`, `RecurringExpense` | Existing SSS expense tables only if found and compatible; otherwise blocked | `erp.expense_category` exists in the current snapshot; verify active expense CRUD and ledger links before reuse. Do not run source migrations. |
| HR/payroll: `Employee`, `DailyAttendance`, `AttendanceSummary`, `PayrollRun`, `Payslip`, `SalaryStructure`, `SalaryComponent`, `SalaryAdvance` | Existing SSS employee/payroll tables only if found and compatible; otherwise blocked | Employee master exists; no complete attendance/payroll history target or SQL adapter is evident. |
| Core/config/auth: `Tenant`, `User`, `Branch`, `BusinessProfile`, `BusinessSector`, `BusinessType`, `Sector`, `Role`, `RefreshToken`, `SystemConfig`, `TaxMaster`, `Counter`, `Notification`, `NotificationTemplate`, `AuditLog`, `SubscriptionPlan`, `SyncSettings`, `SyncLedgerEvent`, `Conflict`, `Device`, `Backup`, `Feedback`, `StockMovement`, `SegmentRule`, `LoyaltyRule` | Existing SSS organisation/user/tax tables for compatible data; retire unused functionality or mark unsupported where no target exists | SQL auth, organisation, and master adapters exist. Audit/sync records have no proven existing SQL target. Do not run schema migrations. |
| Commerce/other: `ComboOffer`, `Store`, `MetaIntegration`, `SmsTransaction` | Existing SSS tables only if discovered and compatible; otherwise blocked | Legacy combo tables exist but no active SQL adapter has been verified. Marketing integrations/campaign persistence have no proven SQL target. |
| Experimental `backend/src/v2/models/*` | Retire if unused; if active, blocked where no existing compatible SQL table exists | Check route registration and imports; do not migrate models solely because files exist. |

The frontend's Dexie/IndexedDB offline cache is not MongoDB. It needs a separate offline-sync decision and remains outside this server-database inventory.

## First feature checkpoint: customer master

**Decision: do not cut over customer CRUD by itself.** The legacy table is a partial fit, but changing only `CustomerController` would return SQL customer IDs that existing sales, due, payment, and loyalty paths validate or query as Mongo ObjectIds.

Read-only SSS schema evidence:

- `dbo.newcustomer` exists and has 1 row. Its columns cover legacy code/card number, name, phone/mobile, email, address fields, points, and balance fields (`SaleBalance`, `creditbalance`).
- Related existing tables include `customerAddPoints`, `customerLessPoints`, `CustomerGroup`, and `CustomerRelationshipEntry`. Their names/columns alone do not prove they provide the ERP's loyalty ledger, tiers, or referral behavior.
- `erp.transaction` exists with `customer_id` as text, but had 0 rows in the snapshot. It can hold a stable SQL customer key; it does not provide a mapping from existing Mongo ObjectIds to `newcustomer.sl_nu`.
- No `newcustomer` adapter or SQL source branch exists in the CRM customer routes. `CustomerController` reads and writes the Mongoose `Customer` model. The model also has tenant/owner, tier, group/relationship, explicit marketing consent, and RFM fields absent from `dbo.newcustomer`.

The customer path is coupled to Mongo IDs in POS customer resolution, sales orders, estimates, delivery challans, payment-in, due adjustment, and loyalty services/reports. Customer migration needs a coordinated vertical slice. Under the no-DDL rule, any ERP-only fields without an existing compatible SQL column are unsupported and cannot be retained in SQL.

**Customer ID proposal (revised after live metadata audit):** do not expose `sl_nu` as the canonical API ID. The live column is nullable `varchar(1000)`, is not an identity, and has no index, default, or table trigger; one current row does not prove uniqueness or allocation. Under the current no-create/no-alter rule, a generated ERP ID plus a durable crosswalk cannot be added. Customer cutover is blocked unless an existing SQL key is proven stable/unique or the schema constraint changes. Match records with verified identifiers such as customer code/card/phone/email; do not auto-match by name alone, and never log customer values.

**Checkpoint result:** added an opt-in ERP SQL pool and a read-only connection check. It requires a separate configured database and rejects the configured Textilesoft database name. Existing `erpDb` and SSS adapters are unchanged. No customer endpoint was switched and no DDL or writes were executed. The live connection check failed before connecting because `ERP_SQL_DB_NAME` is not configured.

### Separate ERP SQL connection checkpoint

`backend/src/integrations/textilesoft/erpOwnedDb.ts` is distinct from `erpDb.ts`, which serves existing `erp.*` tables on SSS. The separate pool is opt-in through `ERP_SQL_DB_NAME`, `ERP_SQL_DB_USER`, and `ERP_SQL_DB_PASSWORD`; its check command only reads `DB_NAME()`.

The previously drafted identity-map DDL and initializer were removed because they are incompatible with the current no-create/no-alter rule. The separate ERP connection is not required for the existing SSS SQL adapters.

### Customer identity limit under the no-DDL constraint

There is no safe persistent mapping available in the discovered tables. `sl_nu` cannot yet be used as a canonical key because it is nullable and unindexed, and mapping Mongo ObjectIds to SQL keys requires durable storage. Under the current constraint, keep customer APIs on Mongo until an existing SQL key is proven unique/immutable and can be used directly, or until the no-DDL constraint changes. No hidden mapping in `erp.master_entry`, `system_config`, or unrelated tables should be used as a workaround.

### Customer key verification checkpoint

`npm run analyze:textilesoft:customer-key` performs read-only checks against SSS and reports aggregates and metadata only; it does not output customer values. The live check found 1 row, 1 non-null `sl_nu`, 1 distinct `sl_nu`, and 0 duplicate-key groups. Metadata reports `sl_nu` as nullable `varchar(1000)`, non-identity, with no index, default constraint, or table trigger. The connected database exposes no SQL module definitions referencing `newcustomer` or `sl_nu`.

The legacy page source is precompiled (`newcustomer.aspx` inherits a compiled code-behind class); its code-behind source is not present in this repository. Therefore the legacy allocation behavior cannot be proven from checked-in source or visible SQL module metadata. Do not use `sl_nu` as an API key or allocate new values through the ERP until the deployed write behavior is obtained and reviewed. No SSS writes or schema changes were made.

### Strict SQL-only / no-schema-change constraint

The current cutover constraint is strict: use SQL instead of MongoDB, and do not create or alter tables in any database. This means no `backend/sql/erp/*.sql` migrations. Without a suitable existing unique customer key, a durable Mongo-ID-to-SQL-ID crosswalk cannot be introduced safely under this rule.

**First cutover candidate: POS item lookup. Do not switch `ITEM_DATA_SOURCE=sql` as a global no-Mongo cutover yet.** The barcode scan endpoint and SQL billing line lookup now query the shop SQL source directly, and the POS invoice payload carries the barcode so checkout does not need the Mongo ObjectId. These code paths fail closed when SQL has no matching barcode. The POS browser catalogue remains a hybrid:

- `InventoryService.getAllItemsWithPagination` starts `ensureMirror`, then uses `withMongoFallback`; SQL results are materialized as Mongo `Item` documents by `sqlItemOverlay.ts`.
- `InventoryService.getItemByBarcode` uses the same Mongo materialization/fallback path.
- The POS catalogue sync still reads `/api/inventory`, whose SQL source mirrors catalogue rows into MongoDB and can fall back to MongoDB on SQL errors.
- The separate `/api/products` SQL route is not the POS feed and its `newproduct` product master does not itself provide the barcode-level stock row.

This is partial progress only: POS checkout for barcode-bearing lines no longer needs a Mongo item lookup, but SQL mode still does not meet the no-Mongo requirement. Next, build a dedicated SQL POS catalogue path from existing SQL that supplies the fields the POS browser needs, including stable barcode identity, price, GST, and quantity; switch only the POS browser to it; and verify the current pricing and stock rules. Other inventory screens and writes remain Mongo-backed and need their own compatible existing-table mappings before Mongo can be removed globally.

No setting was flipped and no SQL schema or data was changed in this checkpoint.

## Cutover order

1. Complete model-to-route inventory and discover existing SSS schema without writes.
2. Freeze the SSS contract: deny DDL to application and migration credentials; do not apply `backend/sql/erp/*.sql` to SSS.
3. Under the strict no-schema-change constraint, use only already-existing SQL tables and credentials. Do not provision or migrate any schema as part of application startup.
4. Migrate one feature at a time: source table/repository, data backfill, read parity, write cutover, rollback check, then remove that feature's Mongo path.
5. Remove MongoDB startup and dependencies only after no active route, worker, script, or sync path requires it.

## Follow-up checkpoint: mixed SQL / Mongo paths

Reviewed the seven areas named in the migration review against active services/controllers and the 2026-10-01 read-only schema snapshot. The config service was subsequently changed to use the existing SQL key/value table for loyalty and segment rules; no data transfer or schema change was executed. “Existing SQL candidate” below means only that the table exists in the snapshot; field-level and business-rule parity still need verification before a cutover.

| Area | Current path | Existing SQL compatibility / disposition |
|---|---|---|
| Config: loyalty and segment rules | `ConfigService` reads and writes JSON rule values in the existing `erp.system_config`, keyed by tenant; no Mongoose model reads remain in these service methods. | Reuses the already-existing key/value store and does not add schema. Legacy global threshold keys remain as read fallbacks. Existing Mongo rule values are not auto-copied, so populate SQL values before relying on customized settings; SQL's configured store must be reachable. **Runtime moved to SQL; existing rule-data import remains outstanding.** |
| Expense analysis | `ExpenseAnalysisService` reads Mongo `User` IDs and Mongo `Expense` rows, then combines them with SQL expense categories. | Existing `dbo.expenseentry`, `dbo.expensegroup`, and `dbo.expensename` are candidates. `expenseentry` exposes legacy name/amount/date/remarks fields but no user key, receipt, or direct ERP tenant mapping in the snapshot; row count was 0. It cannot preserve the current “all tenant users, recorded by, receipt, description” result as-is. **Mongo-backed; investigate legacy page semantics, otherwise block missing fields.** |
| Finance reports | `FinanceReportService` combines SQL Textilesoft sales/stock/payment reports with Mongo `Invoice`, `Return`, `Bill`, `Expense`, `CashbankTransaction`, and `Customer` reads. Several reports still read Mongo invoices/expenses even when `ITEM_DATA_SOURCE=sql`. | Existing Textilesoft sale/purchase/cash tables and existing `erp.payment_in`, `erp.payment_out`, and `erp.transaction` can serve only their matching transaction semantics. They do not establish that every Mongo invoice, bill, expense, receipt, customer name, or cash-book event has a SQL counterpart. **Hybrid report layer; migrate each source separately, and do not report SQL-only as complete until every included transaction class has compatible retained SQL data.** |
| Inventory: `Item`, `Shelf`, `StockLog` | Item reads can use SQL mapping but list/search still mirror to Mongo and fall back; inventory CRUD, shelf storage, and stock-log history remain Mongo paths. Some stock reports read SQL ledgers/snapshots. | Existing `newproduct`, barcode/stock/purchase/sales movement tables and floor/rack-related masters are partial candidates. `newproduct` is not itself a barcode-level stock ledger. No proven existing table was established for ERP shelf/bin configuration or the full `StockLog` event contract (reason, actor, before/after, tenant/store). The barcode lookup/checkout slice is partial only. **Do not cut over inventory CRUD/history until table-by-table behavior is mapped; unsupported movement fields are blocked.** |
| Payment-out | Payment-out records are stored in existing `erp.payment_out`, but `PaymentOutService` still validates/updates Mongo `BankAccount`, allocates to Mongo `Bill`, and creates Mongo `CashbankTransaction`. | Existing SSS tables include `BankTransEntry` and `CashInOutEntry`; payment-out rows have a SQL adapter. These do not prove safe joins from ERP Mongo supplier/bank/bill IDs to SSS keys. SQL and Mongo operations are not atomic, and the service documents possible orphaned SQL payments. **SQL payment record only; payment workflow remains hybrid and cutover is blocked pending compatible SQL bill/bank identifiers and allocation semantics.** |
| Supplier ageing / supplier service | Ageing reads Mongo `Supplier` and `Bill`; supplier CRUD is through `PurchaseSupplierRepository` (Mongo); supplier detail balances aggregate Mongo bills plus SQL payment-out/debit-note records. Supplier analytics optionally appends read-only SSS suppliers by name, while still calculating ERP suppliers from Mongo. | Existing `dbo.supplierdetail`, purchase/GRN records, debit-note/payment tables, and SQL supplier listing cover parts of the domain. Name-based union is display-only and is not a stable cross-database identity. No validated key joins ERP supplier, purchase, payment, and opening-balance records across stores. **Hybrid; supplier master, bills, ageing and identity require one coordinated vertical slice.** |
| Commission | Rule CRUD reads/writes existing `erp.commission_rule`; `CommissionController.getCommissionReport` reads rules from SQL but calculates against Mongo `Invoice` and `Item`, then resolves employee names from Mongo `User`. | Existing rule table is present in the captured schema, so do not run its repository migration or any DDL. SQL Textilesoft has commission-related tables, but no parity mapping to the ERP rule precedence/scope was proven. Existing invoice lines and `dbo.newuser`/`dbo.newemployee` keys must be checked before using them for the report; Mongo ObjectIds do not automatically map to those keys. **SQL rules + Mongo report; report remains hybrid.** |

### SQL-only lossy cutover (2026-10-02)

Per the user's instruction, SQL mode now prioritizes removing MongoDB runtime access over preserving all business behavior. These routes use existing tables only; no table was created or altered. This does **not** prove parity with legacy workflows.

| Area | SQL-mode behavior after cutover | Accepted loss / constraint |
|---|---|---|
| Expenses and analysis | CRUD, tracker analysis and expense reports read/write existing `dbo.expenseentry`; categories remain in existing `erp.expense_category`. | Recorder, tenant, receipt, payment method, bank account, branch and income details are discarded/defaulted. Recurring expense operations return empty results for reads and HTTP 409 for writes because no compatible SQL table exists. |
| Finance reports | Transaction, day-book, cash-flow and sales reports use Textilesoft SQL entries only; P&L adds SQL `expenseentry` totals. | ERP Mongo invoices, returns, bills, customer receipts and cashbook entries are omitted in SQL mode. |
| Inventory | Catalogue, barcode reads, categories, stock metrics, and supported stock reports query Textilesoft SQL directly; the full-catalogue mirror/fallback is bypassed. | IDs are barcode/SKU strings. Unkeyed rows are omitted. Mutations that have no proven existing-table mapping return HTTP 409; reprint queue reads are empty. Serialized-unit storage remains to be cut over or disabled in SQL mode. |
| Payment-out | Existing `erp.payment_out` is the sole persistence for payments and JSON allocation snapshots; service no longer accesses Mongo bills, bank accounts, or cashbook. | Bill balances, bank balances, and cashbook are not updated. Supplier/bank/user display names are replaced by opaque identifiers or blank values. |
| Suppliers and ageing | Existing `dbo.supplierdetail` backs SQL-mode supplier CRUD/list and opening balances. Supplier ageing and ledger are reduced to SQL master balances. | Supplier codes are generated in the existing `code` field for new rows. GRN/bill allocations, payment history, debit-note joins, tenant scope, branch scope, and performance metrics are omitted or reported unavailable. Existing supplier rows without codes cannot be updated by their generated display ID. |
| Commission | Existing `erp.commission_rule` remains the only SQL rule store. Report returns no calculated employee totals. | The existing SQL sales schema has no proven compatible commission detail/key mapping; commission calculations are unavailable. Item names are not snapshotted from Mongo. |

**Operational note:** set `ITEM_DATA_SOURCE=sql` to select these SQL-mode paths. The connection must have the existing table permissions required by the active operations. The TypeScript build is the current validation; live behavior still depends on connecting to the configured SSS/Textilesoft database and the saved schema snapshot may not reflect later schema changes.

### Compatibility conclusion and sequence

“Use SQL without new tables” is possible only where a currently existing table already represents the same record and key. This audit found viable partial sources for expense records, Textilesoft finance ledgers, and legacy commission data, but not drop-in replacements for all current Mongo contracts. Do not create/alter tables or repurpose unrelated tables to force parity. Next: (1) compare the expense screen's fields/rules against `dbo.expenseentry`; (2) enumerate each FinanceReportService entry source and decide SQL source or unsupported; then (3) coordinate supplier/payment-out identity and bill allocation before attempting supplier service or ageing. Inventory movement and commission reporting follow only after key and event-field parity is demonstrated. Config runtime now uses SQL, but its existing Mongo rule data still needs an approved/verified data transfer before cutover of customized thresholds.

The phrase “compactbailt” was not found in repository files. I interpreted it as a request to check compatibility against the existing SQL schema; the assessment above is based on that reading.

## Wave 0 exit checks

- [x] Configured SQL schema discovery snapshot captured read-only.
- [x] Existing `erp.*` table inventory captured; no assumption that source migrations were deployed.
- [ ] Each Mongo model assigned individually to existing SSS, separate ERP SQL, retire, or investigate.
- [ ] Separate ERP SQL database and backup/restore ownership operationalized.
- [x] No SSS DDL executed.
