# ERP Branch Database Strategy

Two long-lived branches, two database modes.

| | `team/legacytomodern` | `feature/cleanup-2` |
|---|---|---|
| **Purpose** | Complete legacy (Textilesoft) app, modernised UI + API | Hybrid: MongoDB + Textilesoft SQL |
| **Databases** | **SQL Server only** - `SSS_copy` (later live `SSS`) | **MongoDB + SQL Server** |
| **MongoDB** | Removed completely | Kept for ERP-only data |
| **`ITEM_DATA_SOURCE`** | Flag removed (SQL is the only path) | Kept (`mongo` / `sql`) |
| **New ERP tables** | `erp` schema inside `SSS_copy` | MongoDB collections |

> **Naming note:** the Textilesoft database is **Microsoft SQL Server** (`mssql` driver, `dbo.*` tables), not MySQL.
> The code has no MySQL dependency. Everywhere below, "SQL" means SQL Server.

---

## 1. Branch `team/legacytomodern` - SQL Server only

**Goal:** the whole legacy Textilesoft app rebuilt on a modern stack, running on a single database, `SSS_copy`.

### Rules
1. **`dbo.*` belongs to Textilesoft.** Read/write only existing tables and columns, in Textilesoft's formats. Never `ALTER` or add columns to `dbo`, or the legacy app can break.
2. **ERP-only data lives in the `erp` schema** of the same database (`erp.*`). No second database, no MongoDB.
3. **Single shop, no tenants.** Drop `tenantId`, Tenant, SubscriptionPlan, Sector and other SaaS models.
4. **Writes use the write login** (`TEXTILESOFT_DB_WRITE_USER` / `_PASSWORD`); reads use the read-only login.
5. **Restores must not lose local data.** Restoring `SSS_copy` keeps `erp.*` untouched and re-applies newer local bills by unique bill id (existing `sqlRestoreService` / `sqlRestoreCarryover`).

### Data placement
| Data | Where |
|---|---|
| Company, branch, store, counter, products, attributes, GST/HSN | `dbo` (already SQL) |
| Sales/POS bills, sales returns | `dbo.sales2`, `dbo.salsntry`, `sales2Return`, `salbillReturns`, `salsntryReturn` |
| Purchase order, GRN, purchase return | `dbo.POHeader/PODetails`, `purgrnentry/purentrydetails`, `PurchaseReturn*` |
| Login | `dbo.newuser` + `dbo.rightsentry` (pure SQL sessions, no Mongo user) |
| Customers, dues, banks, cheques, loyalty | Use `dbo` table if it exists (run schema discovery), else `erp.*` |
| Roles map, audit log, refresh tokens, settings | `erp.*` |
| Expenses, HR (attendance, payroll), petty cash, day-end, loans, CRM campaigns, SMS | `erp.*` |
| Redis (cache, queue, rate limit) | Unchanged |

### Work plan
1. **Backup:** final `mongodump` archive + `BACKUP DATABASE SSS_copy`. Export only Mongo master/setup data worth keeping (roles, categories, tax masters, settings, employees).
2. **Discovery:** run `schemaDiscovery.ts` on `SSS_copy`; classify every Mongo model as *in dbo* / *needs erp table* / *drop*.
3. **Foundation:** shared SQL pool with write user + transaction helper; versioned migrations in `backend/sql/erp/NNN_*.sql` tracked in `erp.schema_migrations`; replace `ObjectId` with `BIGINT IDENTITY`/`UNIQUEIDENTIFIER`; JSON columns (`NVARCHAR(MAX)` + `ISJSON`) for flexible documents; repository layer with the same method names services use today.
4. **Migrate in waves** (verify each): auth/access -> settings & masters -> sales/POS & returns -> purchase -> customers/dues/loyalty -> finance -> expenses & HR -> long tail (CRM, SMS, marketing, combos).
5. **Remove MongoDB:**
   - delete `ITEM_DATA_SOURCE` / `isSqlItemSource` and keep only SQL code (18 files branch on it)
   - delete mongoose `models/*` and `interfaces/I*.ts`
   - replace Mongo checks in `config/startup.ts` and `config/deploymentGates.ts` with a SQL health check; drop `MONGO_URI` from required env
   - remove `mongoose`/`mongodb` from `package.json`, delete `config/database.ts`
   - delete/rewrite the ~40 Mongo scripts in `backend/scripts`
   - remove Mongo from `docker-compose*.yml`, `.env`, `.env.example`, docs
6. **Verify:** `tsc`, tests (fix `jest.config.js` so `.test.ts` files run), `grep -ri mongo` returns nothing, page-by-page test against `SSS_copy`, before/after `dbo` schema diff shows no change, Textilesoft-made and ERP-made bills appear in each other's reports.

### Environment
```
# SQL Server only
TEXTILESOFT_DB_HOST=...
TEXTILESOFT_DB_PORT=1433
TEXTILESOFT_DB_NAME=SSS_copy        # switch to SSS for production
TEXTILESOFT_DB_USER=...             # read
TEXTILESOFT_DB_PASSWORD=...
TEXTILESOFT_DB_WRITE_USER=...
TEXTILESOFT_DB_WRITE_PASSWORD=...
TEXTILESOFT_DB_ENCRYPT=...
TEXTILESOFT_DB_TRUST_CERT=...
# no MONGO_URI, no ITEM_DATA_SOURCE
```

### Done when
- No `mongoose`/`mongodb` in the repo; app starts with no MongoDB running.
- Every ERP page works on `SSS_copy`.
- `dbo` schema unchanged; `erp.*` tables created only by migrations.

---

## 2. Branch `feature/cleanup-2` - Hybrid MongoDB + SQL Server

**Goal:** keep the current dual-source design, cleaned up and stable. SQL Server serves the shop's Textilesoft data; MongoDB holds ERP-only data.

### Rules
1. **Textilesoft shop data comes from SQL** (`ITEM_DATA_SOURCE=sql`): items, stock, sales/POS, purchase/GRN, POs, returns, org masters, GST/finance/party/stock reports, login.
2. **MongoDB keeps ERP-only data:** HR, expenses, CRM/WhatsApp/SMS, marketing, combos, finance extras (banks, cheques, loans, day-end), roles, audit, settings, notifications.
3. **Same as the SQL-only branch for `dbo`:** never alter Textilesoft tables; ERP POS bills go to SQL only, with no Mongo copy.
4. **Reports that mix both** (GST, finance, dashboard) combine SQL shop figures with Mongo ERP documents, as they do today.
5. **`ITEM_DATA_SOURCE=mongo`** remains as the fallback/trial mode.

### Data placement
| Data | Where |
|---|---|
| Items, stock, org masters, purchase, sales, returns, POs, GST/HSN | SQL (`dbo`) |
| Login | SQL (`dbo.newuser`) |
| Employees, attendance, payroll | MongoDB |
| Expenses, categories, recurring expenses | MongoDB |
| Customers, loyalty, WhatsApp, SMS | MongoDB (dashboard Customer Base / Top Dues) |
| Banks, cheques, loans, day-end, petty cash | MongoDB |
| Roles, audit, settings, notifications | MongoDB |
| Redis | Unchanged |

### Clean-up work
1. Remove dead code: Mongo branches for modules already SQL-only (company/branch/store/counter, product master, attributes, purchase/GRN, POS), plus Supabase leftovers.
2. Remove multi-tenant SaaS models nobody uses (Tenant, SubscriptionPlan, Sector, SyncLedgerEvent, Conflict, Device, `v2/models/*`) where safe.
3. Keep one clear switch (`ITEM_DATA_SOURCE`) and document which modules read which store.
4. Fix `jest.config.js` so `.test.ts` files run.
5. Keep backups for both stores: `mongodump` + `BACKUP DATABASE`.

### Environment
```
MONGO_URI=...
ITEM_DATA_SOURCE=sql                 # or mongo
TEXTILESOFT_DB_*                     # same keys as above
```

### Done when
- Every module's data source is documented and consistent.
- No page silently mixes stores without a documented reason.
- Both backups run and restore cleanly.

---

## 3. Working with two branches

- **Shared code:** SQL adapters in `backend/src/integrations/textilesoft/` are common to both. Fix adapter bugs on one branch, then cherry-pick to the other.
- **Diverging code:** mongoose models, `config/database.ts`, startup gates, the `ITEM_DATA_SOURCE` branches, and `package.json` deps. Expect conflicts there; do not merge the branches wholesale.
- **Frontend:** keep API response shapes identical on both branches so the UI needs no changes.
- **Suggested flow:** land common SQL fixes on `feature/cleanup-2` first, cherry-pick to `team/legacytomodern`, then continue the Mongo removal only on `team/legacytomodern`.
