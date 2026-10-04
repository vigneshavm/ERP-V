# `team/legacytomodern` - SQL Server Only Strategy

**Branch:** `team/legacytomodern`
**Target:** one database, **`SSS_copy`** (Textilesoft SQL Server; later live `SSS`). **MongoDB removed completely.**
**ERP-only data:** new **`erp`** schema in the same database. **`dbo` is never altered.**

> "MySQL" in earlier notes = **Microsoft SQL Server** (`mssql` driver, `dbo.*`). The code has no MySQL dependency.

---

## 1. Objective and non-goals

**Objective:** the modern ERP (React + Express) is a full replacement for the legacy Textilesoft app, running on the *same* database the legacy app uses, so both can operate side by side during transition.

**Non-goals**
- No schema changes to `dbo` (no new columns, indexes, triggers, or renamed objects).
- No second database, no MongoDB, no Supabase.
- No multi-tenant SaaS features (single shop).
- No UI redesign; the API contract the frontend sees stays the same (see 6).

---

## 2. Ground rules

1. **`dbo.*` is Textilesoft's.** ERP touches only tables/columns Textilesoft already has, in Textilesoft's formats. Writes only to the `WRITE_TABLES` allow-list in `sqlDbAccess.ts`; every new `dbo` table must be added there deliberately and reviewed.
2. **`erp.*` is the ERP's.** Everything Textilesoft has no table for lives in schema `erp`. Created only by versioned migrations, never by hand.
3. **Never `DROP`/`ALTER` `dbo`.** A CI/pre-release check diffs the `dbo` schema before/after (see 11).
4. **Prefer `dbo` over `erp`.** If Textilesoft already stores a concept (customer, supplier, bank, due...), use its table. Create an `erp` table only after schema discovery proves there is none.
5. **One transaction per business document.** Bill/GRN/return writes are a single SQL transaction; number/barcode allocation happens under lock (already the pattern in `sqlPosWriter` / `sqlPurchase`).
6. **Least privilege.** Three logins: read (`SELECT` on `dbo`, `erp`), write (DML on allow-listed `dbo` tables + `erp`), admin (create users, run migrations, restore). The app runs as read+write, never admin.
7. **Single shop, no tenants.** Remove `tenantId` from every model, query, index and API.
8. **Bills made in either app must show in both.** Compatibility with legacy formats (bill numbers, GRN numbers, barcodes) is a release blocker.

### IMPORTANT: restore vs the `erp` schema
`RESTORE ... WITH REPLACE` of `SSS_copy` replaces the **entire database**, so it would also erase `erp.*` (and the DB users, which `ensureErpDbAccess` already re-creates). Decision required, recommended option first:

| Option | How | Trade-off |
|---|---|---|
| **A (recommended)** | Before any restore, export all `erp.*` tables (users' data, HR, expenses, ...) to a staging file; after restore, re-run migrations and re-import. Extend `sqlRestoreCarryover.ts`, which already carries newer local bills across restores. | Keeps one database. Needs export/import code and testing. |
| B | Keep `erp.*` in a *separate database* on the same server. | Restore-safe, but breaks "only SSS_copy". |
| C | Never restore over live data; restore only into a scratch copy, then copy needed rows. | Simple but manual, error-prone. |

Until A is built and tested, **do not run a restore on a copy that holds real `erp.*` data.**

---

## 3. Current state (measured on this branch)

| Item | Count |
|---|---|
| Mongoose model files (`backend/src`) | ~110 (+3 in `v2/models`) |
| Backend files referencing `ObjectId` | 192 |
| `.populate()` calls | 165 |
| `.aggregate()` calls | 55 |
| Mongo sessions / transactions | 30 |
| Frontend files using `_id` | 188 (712 references) |
| Files branching on `isSqlItemSource` | 18 |
| Mongo scripts in `backend/scripts` | ~40 |
| Modules already SQL-aware | sales, purchase, inventory, finance (reports), core (reports) |
| Modules Mongo-only | hr, expense, crm, marketing, masters, store, combo, sms-tracker |

Already SQL (keep, build on): org masters, product master, attributes, GRN, PO, purchase return, POS, sales return, stock/finance/GST/party/sales reports, login (`dbo.newuser` + `rightsentry`).

---

## 4. Target architecture

```
React UI  (API shape unchanged, ids still returned as _id strings)
   |
Express routes -> Controllers -> Services -> Repositories
                                                |
                    +---------------------------+---------------------------+
                    |                                                       |
          Textilesoft adapters (dbo)                             erp repositories (erp.*)
   sqlOrg, sqlProducts, sqlPurchase, sqlPosWriter ...        erp.user_profile, erp.expense, erp.employee ...
                    |                                                       |
                    +------------------ one mssql pool -------------------+
                                            |
                                   SQL Server: SSS_copy
                                     dbo.*   erp.*
                                     
Redis (cache / queue / rate limit) - unchanged, not a system of record
```

---

## 5. Where each kind of data goes

Legend: **dbo** = existing Textilesoft table (adapter exists or must be written) - **erp** = new table - **drop** = do not port.

### 5.1 Already in `dbo` (delete the Mongo branch)
| ERP concept / Mongo model | `dbo` tables | Adapter |
|---|---|---|
| Company, Branch, Store, Counter | `companydetail`, `branchdetail`, `warehousedetail`, `countername`, `CommonSettings` | `sqlOrg` |
| Item / Product, Brand, Size, Color, Category, Pattern, Style, Design | `newproduct`, `brand`, `size`, `color`, `progroup`, `prosubgroup`, `pattern`, `style`, `design`, `prounit` | `sqlProducts`, `sqlMasters`, `sqlAttributes` |
| GST / HSN / TaxMaster | `gstgroup`, `hsndetails` | `sqlMasters` |
| Supplier | `supplierdetail` | `sqlSuppliers` |
| Sales invoice / POS | `sales2`, `salsntry` | `sqlPosWriter`, `sqlSales` |
| Sales return | `sales2Return`, `salbillReturns`, `salsntryReturn` | `sqlSalesReturn` |
| Purchase / GRN | `purgrnentry`, `purentrydetails`, `stockdetails` | `sqlPurchase` |
| Purchase order | `POHeader`, `PODetails` | `sqlPurchaseOrder` |
| Purchase return | `PurchaseReturnHeader`, `PurchaseReturnDetails`, `purretrun` | `sqlPurchaseReturn` |
| StockLog / stock reports | `stockdetails` (+ movement tables) | `sqlStockReports` |
| Login / rights | `newuser`, `rightsentry` | `sqlAuth` |

### 5.2 Probably in `dbo` - verify with schema discovery first
Run `schemaDiscovery.ts` against `SSS_copy` and record the result here before building.

| Concept | Look for in `dbo` | If absent |
|---|---|---|
| Customer, loyalty | customer/party/loyalty tables | `erp.customer`, `erp.loyalty_txn` |
| Payment In / Out, Dues, DueAdjustment | receipt/payment/ledger tables | `erp.payment`, `erp.due` |
| Bank, Cheque, Cashbank | bank/cheque/cash tables | `erp.bank_account`, `erp.cheque`, `erp.cashbank_txn` |
| Estimate, Delivery Challan, Sales Order | quotation/challan tables | `erp.estimate`, `erp.delivery_challan`, `erp.sales_order` |
| DebitNote, RateRevision, SupplierReconciliation, Agent, SupplierGroup | supplier ledger tables | `erp.*` equivalents |
| Item serials / StockTransfer / Shelf / ReprintQueue | stock transfer / rack tables | `erp.*` equivalents |

### 5.3 ERP-only -> new `erp.*` tables
| Area | Mongo models | `erp` tables (proposed) |
|---|---|---|
| Access | Role, RefreshToken, (User profile extras) | `erp.role_permission`, `erp.refresh_token`, `erp.user_profile` |
| Audit / config | AuditLog, SystemConfig, ShopSettings, Notification(+Template) | `erp.audit_log`, `erp.system_config`, `erp.shop_settings`, `erp.notification` |
| Expenses | Expense, ExpenseCategory, RecurringExpense | `erp.expense`, `erp.expense_category`, `erp.recurring_expense` |
| HR | Employee, DailyAttendance, AttendanceSummary, PayrollRun, Payslip, SalaryStructure, SalaryComponent, SalaryAdvance | `erp.employee`, `erp.attendance_daily`, `erp.attendance_summary`, `erp.payroll_run`, `erp.payslip`, `erp.salary_structure`, `erp.salary_component`, `erp.salary_advance` |
| Finance extras | PettyCashClose, DayEndReconciliation, DailyFinance, JournalEntry, Loan, LoanPayment, EMIPlan, GSTReconciliation, CardTerminal, ClearingParameter, BankStatementTransaction | `erp.petty_cash_close`, `erp.day_end`, `erp.journal_entry`, `erp.loan`, `erp.loan_payment`, `erp.emi_plan`, ... |
| CRM / comms | WhatsAppCampaign, WhatsAppTemplate, SmsTransaction, SegmentRule, LoyaltyRule, MetaIntegration | `erp.whatsapp_campaign`, `erp.sms_txn`, `erp.segment_rule`, `erp.loyalty_rule`, `erp.meta_integration` |
| Commerce extras | ComboOffer, CommissionRule, MasterEntry | `erp.combo_offer`, `erp.commission_rule`, `erp.master_entry` |

**HR note:** attendance is currently recorded a particular way for the shop; read the attendance decision notes before designing `erp.attendance_*` so the table matches how it is really taken.

### 5.4 Drop (do not port)
Tenant, SubscriptionPlan, BusinessSector/BusinessType/Sector, SyncSettings, SyncLedgerEvent, Conflict, Device, Backup (Mongo backup metadata), Feedback, `v2/models/*` (Expense, SalesInvoice, TenantEcommerce), plus `tenantId` columns/indexes everywhere. Confirm each is unused (grep + route check) before deleting.

### 5.5 Unchanged
Redis: cache (`config/cache.ts`), queue (`config/queue.ts`), rate limiter. Not a system of record; keep.

---

## 6. Data-access design

### 6.1 Foundation (build once, before any wave)
1. **`erpDb.ts`** - shared `mssql` pool, `query`, `tx(fn)` helper (begin/commit/rollback, retry on deadlock 1205), parameter binding only (no string SQL from input).
2. **Migration runner** - `backend/sql/erp/NNN_name.sql`, applied in order at startup or via `npm run erp:migrate`, recorded in `erp.schema_migrations(version, name, applied_at, checksum)`. Idempotent (`IF NOT EXISTS`). Runs as the **admin** login; app logins never `CREATE`.
3. **Grants** - extend `ensureErpDbAccess` so after every restore it also grants read/write logins `SELECT/INSERT/UPDATE/DELETE` on schema `erp` (`GRANT ... ON SCHEMA::erp TO [user]`).
4. **Repository base** - same method names services use today (`findById`, `find`, `create`, `update`, `delete`, `paginate`), so services change little.
5. **ID strategy** - `BIGINT IDENTITY` primary key per `erp` table. The API returns it as **string `_id`** (and `id`) via a DTO mapper, so the 188 frontend files using `_id` keep working. Existing `sql:po:`-style prefixed ids for `dbo` documents stay as they are.
6. **Flexible fields** - `NVARCHAR(MAX)` with `CHECK (ISJSON(col)=1)` for embedded arrays/sub-documents (e.g. line items on rarely-queried docs); relational child tables for anything reported on.
7. **Types** - money `DECIMAL(18,2)`, quantity `DECIMAL(18,3)`, timestamps `DATETIME2` (UTC), booleans `BIT`, text `NVARCHAR`.
8. **Mongoose idioms to replace**
   - `.populate()` (165) -> `JOIN` in repository queries returning the same nested shape.
   - `.aggregate()` (55) -> T-SQL `GROUP BY`/window functions; reports first (they already read SQL for shop data).
   - Sessions/transactions (30) -> `tx()`.
   - `ObjectId` (192 files) -> `string | number` id type in interfaces; a single `Id` alias.
   - `express-mongo-sanitize` -> remove; rely on parameterised queries and existing validators.

### 6.2 Example migration (illustrative)
```sql
-- backend/sql/erp/001_init.sql
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'erp') EXEC('CREATE SCHEMA erp');
GO
IF OBJECT_ID('erp.schema_migrations') IS NULL
CREATE TABLE erp.schema_migrations (
  version INT NOT NULL PRIMARY KEY,
  name NVARCHAR(200) NOT NULL,
  checksum CHAR(64) NOT NULL,
  applied_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
GO
IF OBJECT_ID('erp.refresh_token') IS NULL
CREATE TABLE erp.refresh_token (
  id BIGINT IDENTITY PRIMARY KEY,
  user_id NVARCHAR(64) NOT NULL,          -- dbo.newuser user id
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at DATETIME2 NOT NULL,
  revoked_at DATETIME2 NULL,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
CREATE INDEX IX_refresh_token_user ON erp.refresh_token(user_id);
GO
```

---

## 7. Authentication and access (Wave 1)

Decisions already made: login uses Textilesoft's `dbo.newuser` (user ID + password), pure SQL sessions, ERP role mapped from the Textilesoft rights column, no counter selection at login.

Work:
1. `AuthController` (838 lines) currently mixes SQL login with Mongo `User`, `Tenant`, `RefreshToken`. Remove registration/tenant creation (`Tenant.create`, `User.startSession`), and any Mongo `User.findOne`.
2. `tenantResolver.ts` and `authMiddleware.ts`: stop loading a Mongo user/tenant; build `req.user` from the verified JWT (`userId`, `role`, permissions from `rightsentry` mapping).
3. Refresh tokens -> `erp.refresh_token` (store a hash, never the raw token) **or** stateless short-lived JWT + rotation. Recommended: table, so logout/revoke works.
4. Roles: keep the mapping `rightsentry -> ERP role` in code; per-user overrides, if any, in `erp.role_permission`.
5. **Open items:** forgot-password / change-password flows (lines ~597, ~703) - `dbo.newuser` may not hold an email; decide: disable these flows, or change the password in `dbo.newuser` via an admin-only screen. Do not invent a second credential store.

Exit: log in with a real Textilesoft user; no Mongo call in the auth path; refresh/logout work.

---

## 8. Migration waves

Each wave: build tables + repositories -> port services -> remove the Mongo branch -> tests -> page-by-page check on `SSS_copy` -> merge. Do not start the next wave until the exit check passes.

| Wave | Scope | Main files | Size |
|---|---|---|---|
| 0 | Backups, schema discovery, decision log | scripts, this doc | S |
| 1 | Foundation (6.1) + auth (7) | `erpDb`, migrations, `AuthController`, middlewares | M |
| 2 | Settings & masters: ShopSettings, SystemConfig, TaxMaster, MasterEntry, ExpenseCategory, categories | core/masters/inventory models | S-M |
| 3 | Sales: delete Mongo Invoice/Return/Transaction paths; rewrite `ErpSalesReportService` aggregates in T-SQL | sales module, core services | L |
| 4 | Purchase: remove Mongo Purchase/GRN/PO/Return branches; port PaymentOut, DebitNote, RateRevision, SupplierReconciliation | purchase module | L |
| 5 | Customers, loyalty, dues, payments (dashboard "Customer Base"/"Top Outstanding Dues" move to SQL) | crm, finance | M-L |
| 6 | Finance: banks, cheques, cashbank, petty cash, day-end, journal, loans, EMI | finance module (42 files) | L |
| 7 | Expenses + HR (attendance, payroll, payslips, advances) | expense, hr | M-L |
| 8 | Long tail: WhatsApp/SMS/marketing/combos/commission | crm, marketing, combo, sms-tracker | S-M |
| 9 | Removal (section 9) + hardening | repo-wide | M |

**Order rationale:** waves 3-4 first because they are already mostly SQL (highest value, lowest risk); HR/finance last because they need new tables and the most rewriting.

**Per-wave checklist**
- [ ] Tables created via migration; grants verified for read/write logins
- [ ] Repositories + services ported; `_id` still returned as string
- [ ] Every `.populate/.aggregate/session` in the module replaced
- [ ] Unit + SQL-route tests added and actually executed (see 11)
- [ ] Legacy-vs-ERP parity check: same document created in both apps agrees
- [ ] No `import ... mongoose` left in the module
- [ ] Mongo branch/model deleted

---

## 9. MongoDB removal steps (Wave 9, verify with `grep`)

1. **Flag:** delete `ITEM_DATA_SOURCE`; delete `config/itemDataSource.ts`; replace `isSqlItemSource()` with unconditional SQL in the 18 files (`PartyReportController`, `ReportController`, `FinanceReportService`, `GstReturnService`, `InventoryController/Service`, `SupplierController`, `PurchaseService`, `purchaseOrder/purchaseReturn/return.routes`, `PosController`, `SalesInvoiceController`, `SalesService`, `ReturnAuditService`, ...). Remove 501 "set ITEM_DATA_SOURCE=sql" branches.
2. **Models:** delete `modules/*/models/*` (mongoose), `interfaces/I*.ts` Mongo typings, `v2/models/*`, `shared` Mongo helpers.
3. **Connection:** delete `config/database.ts`; remove `MONGO_DNS_SERVERS`, `MONGO_*` pool vars.
4. **Startup / gates:** `config/startup.ts` and `config/deploymentGates.ts` - drop `MONGO_URI` from required env, drop `mongoose.connection` checks and `mongoose.model('User'|'Customer'|'Item'|'Invoice')` warm-up; add a SQL connectivity + `erp.schema_migrations` up-to-date check; `HealthController` reports SQL (and Redis) only.
5. **Dependencies (`backend/package.json`):** remove `mongoose`, `mongodb`, `express-mongo-sanitize`, `mongodb-memory-server` (dev). Replace test setups that used the in-memory Mongo with SQL test fixtures or mocked repositories.
6. **Scripts:** delete/rewrite the ~40 `backend/scripts/*` that use Mongo (seeds, tenants, migrations, diagnostics, `utils/db.ts`); keep or port only what is still needed (e.g. seed, diagnostics) against SQL. Remove npm scripts `backup` / `restore` that call `backup-mongodb.sh` / `restore-mongodb.sh` and delete those shell scripts.
7. **Sync/backup code:** `SyncController`, `sync.routes`, `Backup` model - remove Mongo sync; keep `SqlRestoreController` / `sqlRestoreService` / `sqlRestoreCarryover` (extend per section 2).
8. **Docker:** remove the `mongo` service, `mongo-data` volume, and `depends_on: mongo` from `docker-compose.yml` and `docker-compose.prod.yml`; drop `MONGO_URI` env.
9. **Env & docs:** `.env`, `.env.example`, `README.md`, `AGENTS.md`, `CLAUDE.md`, `backend/docs/*`, `API_DOCUMENTATION.md`.
10. **Frontend:** no data-layer change expected; search `frontend/src` for Mongo-specific assumptions (24-char ObjectId regex, `ObjectId` validation) and relax them. Rebuild `dist`.
11. **Proof of removal:** `grep -rniE "mongo|mongoose|ObjectId" backend frontend/src --exclude-dir=node_modules --exclude-dir=dist` returns nothing (docs/changelog excluded), and the app boots with no MongoDB reachable.

---

## 10. Environment keys

### Final set (SQL-only)
| Key | Purpose | Notes |
|---|---|---|
| `TEXTILESOFT_DB_HOST` / `_PORT` | SQL Server host/port | port default 1433 |
| `TEXTILESOFT_DB_NAME` | **`SSS_copy`** (later `SSS`) | only value to change for go-live |
| `TEXTILESOFT_DB_USER` / `_PASSWORD` | read login | `SELECT` on `dbo`, `erp` |
| `TEXTILESOFT_DB_WRITE_USER` / `_WRITE_PASSWORD` | write login | DML on allow-listed `dbo` tables + `erp` |
| `TEXTILESOFT_ADMIN_USER` / `_ADMIN_PASSWORD` | admin login | migrations, user re-grants, restore. **Not** used by normal requests; keep out of the runtime env where possible |
| `TEXTILESOFT_DB_ENCRYPT` / `_TRUST_CERT` | TLS options | `TRUST_CERT=true` only for dev |
| `JWT_SECRET`, `JWT_REFRESH_SECRET`, `COOKIE_SECRET` | auth | unchanged, still required |
| Redis keys (`REDIS_URL` etc.) | cache/queue/rate limit | unchanged |
| *(proposed)* `ERP_MIGRATE_ON_START` | `true`/`false` | run pending `erp` migrations at boot (needs admin login) |
| *(proposed)* `SQL_POOL_MAX` / `SQL_POOL_MIN` | pool size | replaces `MONGO_MAX/MIN_POOL_SIZE` |

### Removed
`MONGO_URI`, `MONGO_DNS_SERVERS`, `MONGO_MAX_POOL_SIZE`, `MONGO_MIN_POOL_SIZE`, `MONGO_SERVER_SELECTION_TIMEOUT_MS`, `MONGO_SOCKET_TIMEOUT_MS`, `ITEM_DATA_SOURCE`, `TEXTILESOFT_POS_WRITE` (if still referenced).

### Sample `.env`
```
TEXTILESOFT_DB_HOST=localhost
TEXTILESOFT_DB_PORT=1433
TEXTILESOFT_DB_NAME=SSS_copy
TEXTILESOFT_DB_USER=erp_read
TEXTILESOFT_DB_PASSWORD=***
TEXTILESOFT_DB_WRITE_USER=erp_write
TEXTILESOFT_DB_WRITE_PASSWORD=***
TEXTILESOFT_DB_ENCRYPT=false
TEXTILESOFT_DB_TRUST_CERT=true
JWT_SECRET=***
JWT_REFRESH_SECRET=***
COOKIE_SECRET=***
REDIS_URL=redis://localhost:6379
```

---

## 11. Verification

**Automated**
- Fix `backend/jest.config.js` so `.test.ts` files under `src/**` actually run (today they are silently skipped). Do this in Wave 0 or the new tests prove nothing.
- Migration test: apply all `erp` migrations to an empty database, then to `SSS_copy`; second run is a no-op.
- Repository tests against a disposable SQL Server (docker `mcr.microsoft.com/mssql/server`) or the scratch restore.
- `tsc --noEmit` clean; no `any` id casts left over from `ObjectId`.

**Schema safety**
- Capture `dbo` schema (tables, columns, indexes, triggers) before Wave 1 and before release; diff must be empty.
- Confirm the write login has no rights outside `WRITE_TABLES` and `erp`.

**Parity (per module)**
- Create the same bill/GRN/return in legacy and ERP; compare totals, GST split, stock effect, bill/GRN numbers, barcode format.
- Legacy-created and ERP-created documents each appear in the other app's reports.
- GST reports, stock reports, dashboard totals match legacy figures for a fixed date range.

**Restore drill (blocks go-live)**
- Restore `SSS_copy` from a `.BAK`; run migrations; import carried-over `erp.*`; newer local bills re-applied by unique bill id with no duplicates; latest bill present; logins re-granted.

**UI**
- Page-by-page checklist of all ERP pages (frontend `ModuleRegistry`), each marked: loads, create, edit, delete, print, export.

---

## 12. Backup, cutover, rollback

**Backup (SQL only)**
- Daily `BACKUP DATABASE SSS_copy` (native, compressed, checksum) - this now includes `erp.*`.
- Keep a separate scheduled export of `erp.*` (JSON/CSV/`bcp`) because restores replace the database (section 2).
- Test restoring a backup monthly.

**Cutover**
1. Freeze Mongo writes; take final `mongodump` + `BACKUP DATABASE`.
2. Import the needed Mongo master data into `erp.*` (roles, categories, tax masters, settings, employees, customers if Mongo-only). **Trial sales/expenses are not imported** (decision).
3. Deploy the branch; run migrations; smoke-test login, POS bill, GRN, one report.
4. Point the Textilesoft-connected counters at the ERP; keep legacy running in parallel for a defined period.

**Rollback**
- Before go-live: keep the last Mongo-based build and the `mongodump` archive.
- After go-live: restore the pre-cutover `BACKUP DATABASE` and redeploy the previous build; bills made after cutover are re-applied by the carry-over mechanism.
- Never delete the Mongo archive until one full month-end close has completed on SQL.

---

## 13. Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Restore wipes `erp.*` | Data loss | Section 2 option A + daily `erp` export; restore drill |
| Schema change to `dbo` breaks Textilesoft | Legacy app stops | No DDL on `dbo`; schema-diff gate; least-privilege logins |
| `ObjectId` -> numeric ids break the UI | Broken pages | DTO mapper keeps `_id` string; relax frontend id validation |
| 55 aggregations + 165 populates rewrite | Schedule slip, subtle report differences | Port reports first; parity comparisons on fixed date ranges |
| Long transactions/locks on shop tables | Legacy counters stall | Short transactions, lock only for number allocation, run reports with `READ COMMITTED SNAPSHOT`-safe hints or off-peak |
| Tests silently not running | False confidence | Fix jest config first |
| Password/forgot-password flows have no `dbo` home | Feature gap | Decide: disable or admin-only reset (7) |
| Unknown `dbo` tables for customers/dues/banks | Rework | Schema discovery in Wave 0 before Waves 5-6 |

---

## 14. Decisions needed from the owner

1. **Restore strategy** for `erp.*`: option A (recommended), B or C (section 2).
2. **Customers, dues, banks, cheques:** use `dbo` if it exists - confirm after schema discovery.
3. **Forgot/change password:** disable, or admin-only reset in `dbo.newuser`.
4. **Refresh tokens:** table (`erp.refresh_token`) vs stateless JWT.
5. **HR/attendance scope:** port all 8 HR models now, or defer HR until after go-live.
6. **Legacy parallel-run length** after cutover.

---

## 15. Definition of done

- No `mongoose`, `mongodb`, `MONGO_*` or `ITEM_DATA_SOURCE` anywhere; app boots with no MongoDB.
- Every ERP page works against `SSS_copy`.
- `dbo` schema diff is empty; `erp.*` created only by migrations.
- Restore drill passes with no `erp.*` or bill loss.
- Tests run in CI (jest config fixed) and pass.
- README/AGENTS/CLAUDE and `.env.example` describe the SQL-only setup.
