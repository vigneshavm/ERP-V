# MongoDB -> SQL Server Migration Plan (no change to existing Textilesoft DB)

Branch: team/legacytomodern. Source of truth for what uses Mongo: MONGODB_USAGE_MAP.md (135 backend files, 99 models).

## 0. Ground rules (apply to every phase)
1. **No DDL on `dbo.*`.** No ALTER/CREATE/DROP/INDEX/trigger on any Textilesoft table or view. Legacy Textilesoft must keep working unchanged.
2. **New structures only in schema `erp`**, via additive numbered scripts `backend/sql/erp/005_*.sql` onward, run by `npm run erp:migrate`. Scripts are idempotent (`IF OBJECT_ID(...) IS NULL`), never drop/alter existing `erp` tables destructively.
3. **Writes to `dbo.*` are DML only**, only on tables in `WRITE_TABLES` (`sqlDbAccess.ts`), only where Textilesoft already has an equivalent table (e.g. `expenseentry`). Each addition to the allow-list is reviewed individually.
4. **Reads from `dbo.*`** use the READ login; ERP-owned data uses `erpDb.ts` (`query()` / `tx()`).
5. Every phase ships behind a flag, with a rollback = flip flag + keep Mongo code until Phase 7.
6. Order: apply migrations on `SSS_copy` first, verify, then `SSS`.
7. CI check: a script that greps for `mongoose` / `models/` imports and compares to the 135-file snapshot (`~/gap/mongo_files.json`); the count must only go down.

## 1. Mapping rule: where does each Mongo domain go?
| Case | Target | Example |
|---|---|---|
| A. Textilesoft has an equivalent table | Read/DML on that `dbo` table (allow-listed) | customers `newcustomer`, suppliers `supplierdetail`, expenses `expenseentry`, items `newproduct`/`purentrydetails`, stock, sales/purchase bills |
| B. Textilesoft has no equivalent (ERP-only feature) | New `erp.*` table | estimates, challans, journals, loans, EMI, day-end, card terminals, payroll/attendance, roles, audit log, refresh tokens, WhatsApp/marketing, combo offers, SMS tracker |
| C. Feature has no meaning in SQL-only mode | Return HTTP 501 "unsupported in SQL mode" + hide menu | multi-tenant subscription plans, sector categories, Meta marketing (until a table exists) |

Lossy mappings (A where legacy has fewer columns) are recorded in LEGACYTOMODERN_SQL_ONLY_STRATEGY.md; extra ERP-only fields go in a sidecar `erp.<x>_ext` table keyed by the legacy key, never added to `dbo`.

## 2. Phases

### Phase 1 - Remove Mongo lookups that block everything (items, names, stock)
Files: `sqlItemSource`, `sqlItemOverlay`, `sqlStockReports`, `sqlPartyReports`, `syncService`, POS item lookup (`PosController` `Item.findOne`), and Mongo name lookups inside `erpSalesOrder`, `erpDeliveryChallan`, `erpPaymentIn`, `erpTransaction`, `erpPurchasePayment`, `erpRateRevision`.
- Resolve item by barcode/HSN/category/MRP from `dbo.newproduct` + `dbo.purentrydetails` (same query the SQL POS writer already uses). Party names from `dbo.newcustomer` / `dbo.supplierdetail`. User names from `erp.users`.
- Drop the item mirror (`syncService`, overlay): SQL is the only item source. Keep `ITEM_DATA_SOURCE=sql` as the default; delete `mongo` branch at end of Phase 7.
- New tables only if needed: `erp.item_ext` (ERP-only fields such as images, reorder level) keyed by legacy product code.
- Exit test: POS sale + return, stock report, party report all run with Mongo disconnected.

### Phase 2 - Infrastructure (Mongo sessions, auth, audit, health)
Files: `config/database.ts`, `config/startup.ts`, `config/deploymentGates.ts`, `HealthController`, `utils/transaction.ts`, `utils/requestContext.ts`, `authMiddleware`, `tenantResolver`, `transactionEnforcement`, `auditMiddleware`, `auditEnforcement`, `refreshToken.routes.ts`, `docker-compose.yml`.
- Transactions: replace Mongo session wrapper with `erpDb.tx()`; `transactionEnforcement` checks the SQL transaction context.
- Auth: users, roles, permissions, refresh tokens in `erp.*` (tables from 001-004 already exist; `AuthController` already uses `erpRefreshToken`; migrate `refreshToken.routes.ts`). Legacy `newuser` read-only login stays; never copy or log its passwords.
- Tenant: single-shop mode: fixed tenant row in `erp.tenant_settings`; policies (return approval, discount limits) read from there.
- Audit log -> `erp.audit_log` (append-only).
- Health/startup/gates: check SQL pools only; `server.ts` stops calling `connectDB()`.
- Migration `005_infra.sql` only if a needed table is missing (tenant settings, roles/permissions).
- Exit test: server boots and `/health` is green with no `MONGO_URI`.

### Phase 3 - Case A domains (use existing legacy tables)
Order by shop usage (confirm with Vikki which legacy pages are actually used, see section 4):
1. Customers + loyalty points (`newcustomer`; points in `erp.customer_points` sidecar if legacy has no column).
2. Suppliers + agents (`supplierdetail`), supplier ledger/payable/performance/report (computed from `purentry*` and payment tables, read-only).
3. Purchase: GRN, purchase return, GRN transfer (`purentry*`, DML on allow-listed tables only; otherwise `erp.*`).
4. Sales side: payment-in, sales return reports, wholesale report, fulfillment (reads from `dbo` sales tables + `erp.sales_*`).
5. Inventory: stock transfer, aging, serialized units, shop/category service (`dbo` stock tables read; transfers via existing material-transfer tables if allow-listed, else `erp`).
6. Finance with legacy equivalent: expenses (done: `expenseentry`), petty cash, cash/bank overview, cheque, bill repository.
7. HR: employee (`dbo` employee/salesman tables read), advance.

### Phase 4 - Case B domains (new `erp.*` tables, migrations 005+)
One migration per domain, additive only:
- 005 infrastructure extras (if needed)
- 006 sales documents: estimate, delivery challan, sales order (if not already in 001-004)
- 007 finance: journal entry, loan, EMI, day-end, daily finance, card terminal, clearing parameter, bank statement, payment reminder, GST R1/summary
- 008 HR: payroll, attendance
- 009 CRM/marketing: engagement, WhatsApp, Meta, SMS tracker, combo offers, recurring expenses
- Case C features get 501 + hidden menu entries.
Each table: `id`, business key, `created_at`, `updated_at`, `created_by`, plus indexes for the list queries the repository uses today. Money as `decimal(18,2)`.

### Phase 5 - Old Mongo data: ARCHIVE ONLY (decided - start fresh in SQL)
- No Mongo -> SQL data copy scripts. ERP starts clean on SQL; Textilesoft `dbo` data is the operational history.
- Take one final `mongodump` of the Mongo DB, store it offline as a read-only archive/reference. Nothing reads it at runtime.
- Skipped, so no reconciliation work. Effort saved: 3-5 days.

### Phase 6 - Verification per phase
- Unit tests (jest "unit (ts)") per repository with mock SQL handler, like `sqlSales.test.ts`.
- Route compatibility test: every route that existed before returns the same response shape or 501.
- Integration run on SSS_copy: sale -> return -> day-end -> reports; compare totals with Textilesoft reports.
- Mongo-import counter must decrease each phase; target 0.

### Phase 7 - Cutover and removal
1. All flags on SQL for one week on SSS_copy, then SSS.
2. Remove Mongo models, `mongoose` dependency, `connectDB`, `ITEM_DATA_SOURCE=mongo` branches, Mongo scripts.
3. Remove `mongo` service and `MONGO_URI` from docker-compose and env docs.
4. Rollback before step 2: set flags back; after step 2: restore from the tagged release plus Mongo snapshot.

## 3. Suggested sequence and size
| Phase | Scope | Rough effort |
|---|---|---|
| 1 | Lookups/items | 3-4 days |
| 2 | Infrastructure | 3-4 days |
| 3 | Case A domains (~50 files) | 2-3 weeks |
| 4 | Case B domains (~45 files) | 2-3 weeks |
| 5 | Archive only (mongodump) | 0.5 day |
| 6-7 | Verify, cutover, cleanup | 1 week |
Phases 1-2 are prerequisites; 3 and 4 can run in parallel by domain.

## 4. Decisions (confirmed by Vikki, 2026-10-02)
1. **Old Mongo data:** start fresh in SQL. SQL is the primary DB; Mongo is not part of the operational flow. Archive/reference only (Phase 5).
2. **BranchController / StoreController removal:** accepted, provided branch/store is not a separate management module in the new ERP. Branch/store may still be needed as a **transaction attribute** (e.g. a `branch_code`/`store_code` column on `erp.*` transaction tables and the `dbo` fields Textilesoft already has). Check against current requirements before finalising; do not restore the controllers.
3. **Features to drop if not actually used:** Subscription Plans, Sector Categories, Meta Marketing (platform-level/optional). They become Case C: 501 "unsupported" + menu hidden, no SQL tables built.
4. Items 5 (apply migrations) and 6 (rotate passwords) from the earlier list: no action needed from this plan.
5. Still open (not blocking Phases 1-2): which legacy pages the shop really uses, to trim Phase 3/4 scope.

## 5. Risks
- Lossy mappings to legacy tables: document each, keep extras in `erp.*_ext`.
- Writing to `dbo` tables the legacy app also writes: concurrency and numbering (bill numbers); always use the same numbering rule as `sqlPosWriter` inside a transaction.
- Hidden Mongo use via `erp*` adapters that look up names: covered in Phase 1.
- No parity check against real legacy reports yet: Phase 6 integration run is mandatory before SSS.
