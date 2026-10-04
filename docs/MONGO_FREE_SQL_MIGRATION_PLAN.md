# Mongo-free SQL migration plan

**Status:** planning document; no application code or database was changed to create this plan.
**Execution tracker:** [`MONGO_FREE_SQL_MIGRATION_TASKS.md`](./MONGO_FREE_SQL_MIGRATION_TASKS.md).

## Goal and hard constraints

Move the application to a state where all live application reads and writes use SQL and MongoDB is not required to run the application. Use only tables and columns that already exist in the configured SQL databases. Do not create, alter, or migrate tables, indexes, constraints, triggers, or other schema objects in SSS or the separate ERP SQL database. Do not apply `backend/sql/erp/*.sql` migrations.

This is a compatibility migration, not a promise of full Mongo feature parity. Where an existing SQL table cannot represent a feature, choose one of these explicit outcomes: simplify/drop the feature, make it unavailable with a clear response, or block that feature's cutover. Never store unrelated data in a convenient table just to claim SQL coverage. No feature may silently fall back to MongoDB.

“Mongo-free” means all of the following are true:

- The API starts and serves supported routes without a Mongo URI, Mongo process, or Mongoose connection.
- Every registered route, scheduled job, queue worker, websocket, background task, and sync path uses SQL or is disabled/removed.
- No live route uses a Mongo-backed model, Mongo fallback, Mongo mirror, or Mongo ID lookup.
- Startup health/readiness, deployment gates, transaction helpers, and auth do not require Mongo.
- Production scripts and operational procedures do not require Mongo for normal operation. One-time archival/export tooling may remain isolated and clearly marked, but must not be imported by the application.
- After a controlled cutover and retention period, Mongoose runtime dependencies and Mongo configuration are removed.

Frontend Dexie/IndexedDB is a separate browser-side offline store. It is not MongoDB; its synchronization contract must be reviewed separately before disabling any server sync endpoints.

## Current baseline

The repository has an existing read-only schema inventory at [`mongo-to-sql-live-schema/schema-report.json`](./mongo-to-sql-live-schema/schema-report.json) and a working tracker in [`MONGO_TO_SQL_MIGRATION_INVENTORY.md`](./MONGO_TO_SQL_MIGRATION_INVENTORY.md). The captured SSS snapshot is dated 2026-10-01 and is evidence of table/column presence at that time, not proof that a table has correct semantics or remains unchanged. Refresh it read-only before any production cutover.

The 2026-10-02 SQL-only lossy paths cover selected expense, report, inventory-read, payment-out, supplier, and commission behavior. They did not by themselves make the application Mongo-free. Wave 1 now adds a restricted opt-in SQL-only runtime, but the overall application and legacy mode still contain MongoDB dependencies:

- Legacy mode in `backend/src/server.ts` still calls `connectDB()`; SQL-only mode skips it.
- SQL integration paths still query Mongo for linked display/validation data, including payment-in invoices, purchase-payment suppliers, sales-order items/stock, and delivery-challan items.
- `ReportController` retains Mongo-backed report routes, including customer reporting.
- `sqlItemSource.ts` retains Mongo fallback/mirror helpers and `sqlItemOverlay.ts` writes mirror documents. Confirm actual call paths before deleting helpers.
- Many other modules remain Mongo-backed, including CRM/customer, sales documents, purchase documents, finance, HR/payroll, marketing, combo offers, audit/sync, and settings. The inventory document is the detailed per-domain tracker and must be updated as work proceeds.
- Existing SQL tables are not a universal replacement. The current audit found no safe persistent customer crosswalk under the no-DDL rule; unsupported customer identity and loyalty behavior must remain blocked or be deliberately simplified until an existing stable SQL key is proven.

The current architecture therefore must not be described as SQL-only just because `ITEM_DATA_SOURCE=sql` is set. That flag selects a source for some paths; it does not disable Mongoose globally.

## Non-negotiable implementation rules

1. **Discover before mapping.** Trace each Mongo model from registered route/job to controller, service, repository, query/write, and downstream consumers. Include dynamic imports and indirect helpers.
2. **Use an existing compatible SQL table only.** Verify key, tenant/branch scope, field meaning, write behavior, and retention. Table-name similarity is insufficient.
3. **No DDL.** The application and migration credentials should not have schema-change permissions. No startup schema initialization, migrations, index creation, or table repair is allowed.
4. **No hidden crosswalk.** Do not put Mongo ObjectIds in unrelated config, notes, JSON snapshots, or free-text columns as a substitute for a missing mapping table. Use a proven existing natural/business key directly, or mark the dependent workflow unavailable.
5. **Make losses visible.** Unsupported writes return a documented 409/feature-unavailable response; unsupported reads return an explicit unavailable state or an honestly scoped empty result. Never fabricate success or silently omit financial amounts.
6. **SQL mode must fail closed.** A SQL connection/query failure must not invoke Mongo fallback or serve stale Mongo data.
7. **Keep source choice out of controllers.** Follow `docs/BACKEND_STANDARDS.md`: controller → service → repository/data source. SQL and Mongo adapter selection belongs in the service/repository boundary during transition.
8. **Do not dual-write by default.** SQL plus Mongo writes can diverge and lack a shared transaction. If temporary dual-write is proposed, require reconciliation, idempotency, and an explicit retirement date; prefer shadow-read comparisons instead.
9. **No production cutover from schema snapshot alone.** Confirm current live metadata and approved representative behavior without exposing customer/financial values in logs or reports.

## Migration waves

Each wave is a vertical slice: map → implement SQL adapter over existing schema → seed/import only into compatible existing rows/columns if authorized → compare reads → switch writes → disable Mongo path → verify → update the tracker. Do not begin the next dependent wave while its identity or transaction prerequisites are unresolved.

### Wave 0 progress — initial runtime scan (2026-10-02)

This is a source-level inventory, not proof that every branch executes in a given deployment. It was run against the current working tree; the tree already contains extensive uncommitted SQL migration changes, which were left untouched during this audit.

| Runtime surface | Evidence found | Wave 0 disposition |
|---|---|---|
| Process startup/shutdown | `backend/src/server.ts` imports `connectDB()` and calls it unconditionally; shutdown closes `mongoose.connection`. | **Blocking:** SQL selection does not currently remove the global Mongo lifecycle dependency. |
| Startup / deployment health | `backend/src/config/startup.ts`, `backend/src/config/deploymentGates.ts`, and `backend/src/modules/core/controllers/HealthController.ts` inspect Mongo readiness, ping Mongo, or close it. | **Blocking:** these gates need to become deployment-mode aware after required route groups are inventoried. |
| SQL item/inventory integration | `sqlItemSource.ts` imports Mongoose `Item`; fallback/mirror helpers remain. `sqlItemOverlay.ts` imports `Item` and `StockLog`; `sqlStockReports.ts` imports `Item`, `StockLog`, and `Store`; `syncService.ts` imports `Item` and `StockLog`. | **Blocking:** direct SQL list changes do not establish Mongo-free inventory; inspect callers and decide supported routes before removing mirrors/fallbacks. |
| SQL transaction integrations | `erpPaymentIn.ts` queries Mongo `Invoice`; `erpPurchasePayment.ts` queries Mongo `Supplier`; `erpSalesOrder.ts` and `erpDeliveryChallan.ts` query Mongo `Item`. | **Blocking:** SQL-backed headers still rely on Mongo for linked entities/labels/stock. Remove those lookups or disable the respective operation. |
| Report routes | `ReportController.ts` still imports and queries Mongo invoice, item, customer, and expense models. Some SQL-mode handlers may short-circuit, but other handlers remain Mongo-backed. | **Blocking:** inventory each route separately; an early SQL branch in one handler is not a module-wide cutover. |
| Domain modules | Static scan still finds active model queries and Mongoose sessions in CRM/loyalty, finance, HR/payroll, sales/returns, purchase, inventory and core. | **Unmapped:** finish endpoint/job-to-model tracing and record each feature under Waves 2–7. The search also matches model definitions and in-memory array operations, so it is not a query count. |
| Maintenance scripts | `backend/src/scripts/*` includes Mongo connection calls, including data checks, seeders, mirror, and sync scripts. | Separate production-required jobs from one-time/archival utilities; scripts are not automatically harmless if deployment invokes them. |
| SQL DDL risk | This scan made no database calls and executed no migration or schema command. | **Constraint preserved:** no table, column, index, constraint, trigger, or data was changed. |

The currently mounted route groups were also inventoried from `backend/src/app.ts`. This is a disposition list, not a claim that every endpoint in a group has identical backing storage:

| Mounted route group | Initial disposition | Why it cannot yet be enabled as a complete Mongo-free group |
|---|---|---|
| `/api/stores`, `/api/companies`, `/api/warehouses`, `/api/counters` | SQL candidate | Route adapters use the existing Textilesoft organisation tables; check all writes, auth, and startup dependencies. |
| `/api/product-master`, `/api/product-attributes`, `/api/purchase-entry` | SQL candidate | New SQL routes exist in the working tree; verify every endpoint and failure mode before declaring the group complete. |
| `/api`, `/api/roles`, `/api/sync`, sector categories, feedback, notifications, audit logs | Mixed / Mongo presumed until traced | Core routes include auth, user, business, config, and health; sync/audit/notification persistence has no proven complete existing SQL target. |
| `/api/reports` | Mixed | Some SQL branches exist; customer and other report paths still query Mongoose. |
| `/api/inventory`, `/api/stock-transfers` | Mixed / blocked | Inventory reads have SQL work, but mirrors/helpers and Mongo stock-transfer paths remain; serial, shelf, history, and mutation coverage is incomplete. |
| `/api/sales-invoice`, `/api/payment-in`, `/api/sales-orders`, `/api/delivery-challan`, `/api/pos`, `/api/commission-rules`, `/api/returns`, `/api/estimates` | Mixed | POS SQL paths coexist with Mongo invoice and related entities; payment-in, order, delivery, estimate, return, and commission behavior needs endpoint-level review. |
| `/api/crm`, CRM analytics, WhatsApp | Mongo / hybrid presumed | Customer identity and loyalty/campaign storage are unresolved under no-DDL. |
| `/api/purchases`, `/api/purchase-payments`, `/api/purchase-returns`, `/api/grn-transfers` | Mixed / blocked | Purchase entry has a SQL path, but purchase order, payments, returns, supplier links, and transfers have not all been proven Mongo-free. |
| Finance routes, `/api/emi-plans`, `/api/card-terminals` | Mongo / hybrid presumed | Finance has multiple Mongoose ledgers and reports; SQL payment records do not replace bill/bank/cash workflows. |
| Expense routes | Partial SQL candidate | Expense CRUD/report paths have lossy SQL adapters; category and recurring behavior must be checked route by route. |
| `/api/sms-tracker`, `/api/hr`, `/api/marketing/meta`, `/api/combo-offers`, `/api/masters` | Mongo / blocked presumed | No complete compatible SQL target has been established for these mounted groups. |

The `protect` middleware is currently SQL-auth based in the working tree, but still imports Mongoose `Types`; `tenantResolver` also uses `mongoose.Types.ObjectId` and depends on `SHOP_TENANT_ID`. `validateEnv.ts` still requires `MONGO_URI`. Thus auth being SQL-backed does not make startup Mongo-independent. `express-mongo-sanitize` is a request-key sanitizer dependency, not a Mongo connection, but should be replaced or renamed during final dependency cleanup to avoid treating it as database usage.

**Wave 0 outcome:** incomplete. The scan confirms Mongo-free startup and route execution are not yet achieved. Before changing startup behavior, complete route and background-task dispositions, especially for auth/tenant middleware and modules that currently expect Mongoose models. Do not simply skip `connectDB()` while leaving those routes mounted: that would convert hidden Mongo dependencies into runtime failures rather than a supported SQL-only deployment.

### Wave 1 progress — restricted SQL-only runtime (2026-10-02)

The application now supports only `APP_DATA_MODE=sql-only`. Startup does not call `connectDB()`, `MONGO_URI` is not required, shutdown does not open/close a Mongo connection, and Mongo-backed routers are not mounted. An API allowlist exposes SQL auth, health, organisation masters, product master/attributes, and purchase entry. Requests outside that allowlist receive `SQL_ONLY_ROUTE_UNAVAILABLE` (503) before reaching legacy handlers. Readiness checks the shop SQL pool and the existing ERP SQL connection. CORS accepts configured origins only and no longer looks up tenant domains in Mongo. The SQL auth startup diagnostic no longer looks up the configured tenant in Mongo. The unused Mongo connection/startup/deployment-gate modules were removed; Mongo is no longer a production dependency, and the Mongo sanitizer middleware/dependency was removed.

Required configuration: `ITEM_DATA_SOURCE=sql`, SQL read and write credentials, `JWT_SECRET`, `COOKIE_SECRET`, and a configured 24-character `SHOP_TENANT_ID`. No table/schema operations were added by this change. The API no longer exposes legacy Mongo-backed routes. Mongoose was moved to development dependencies so the dormant legacy source and tests can still compile; it is not in the production route import graph. Mongo maintenance scripts and dormant Mongoose-backed controllers/models remain in the repository and need a separate retirement/archive pass before claiming the entire repository has no Mongo code.

**Validation:** `npm run build` in `backend/` passed. No live SQL connection or no-Mongo staging smoke test was run in this workspace.

### Wave 1 revalidation — global middleware (2026-10-02)

A follow-up scan found that CORS dynamically looked up unknown origins in Mongo's `Tenant` model before the `/api` route gate ran. Dynamic tenant-origin lookup has now been removed; callers must use `FRONTEND_URL` or `ALLOWED_ORIGINS`. The allowlisted auth, organisation, product master/attribute, purchase-entry, and health paths were checked at their route/controller boundary and use SQL or static/runtime-only helpers; SQL auth no longer performs a Mongo tenant lookup. Readiness checks the SQL pools.

The broad repository scan still finds many Mongoose queries in dormant controllers/services and Mongoose-backed modules outside the mounted route set. The audit-integrity verifier contains a Mongo query and a periodic timer if its scheduler is invoked; no invocation was found in `app.ts` or `server.ts`. The active compiled server import graph was checked after the route changes and contains no Mongoose import or Mongo query; no live SQL connection test was run. Mongo maintenance scripts and inactive source still exist, so repository-wide code removal is not complete.

**Validation:** backend TypeScript build passed after the CORS change. No Mongo-free server process or live SQL smoke test was run; therefore runtime behavior remains unverified against deployment configuration.

### Revalidated execution target — SQL only, no schema changes (2026-10-02)

This section supersedes earlier statements in this document where they describe a hybrid or opt-in Mongo runtime. The current working tree has `APP_DATA_MODE=sql-only`, `server.ts` does not start a Mongo connection, and `app.ts` mounts a restricted SQL route set. Many legacy Mongo files remain in the repository; SQL-only startup is not the same as repository-wide Mongo removal or complete screen coverage.

The requested end state is:

- Every page that remains operational uses only SQL-backed APIs.
- All existing pages are audited and given a SQL disposition before any page is removed. This plan does not remove pages.
- Use only tables and columns already present in SSS or an already-configured ERP SQL database. Confirm their existence and meaning from read-only metadata before relying on them.
- Never run `backend/sql/erp/*.sql`, create/alter SQL objects, or write migration data to unrelated tables as a workaround. Existing `erp.*` objects may be used only if the deployed database already contains compatible objects.
- Preserve only business behavior that can be represented correctly by existing SQL. If a page's full workflow has no compatible table, narrow it to a truthful read-only/subset workflow or return an explicit unavailable response; do not report success for data that was not stored.
- After a page's SQL path has been implemented and verified, remove that page's Mongo routes, controllers, services, models, repositories, fallback/mirror logic, tests, and scripts when they have no remaining callers. Final cleanup removes Mongoose/Mongo dependencies and configuration.

#### Current route reality

The SQL-only server currently mounts SQL auth/user/business, organization, product-master/attributes, purchase-entry, POS billing, purchase returns, reports, and inventory read/report routes. Legacy route definitions in the Sales, Finance, CRM, HR, Purchase, and other modules are not automatically reachable just because their source files exist. Several frontend pages still call those legacy endpoints and therefore are not complete SQL workflows. Prefix allowlisting is not proof that an endpoint is mounted or implemented; validate the exact method and path.

The checked-in schema snapshot is useful evidence for existing tables, but it does not prove semantic compatibility, current row quality, uniqueness, live deployment parity, or required write permissions. Every page's final mapping is gated on current read-only schema verification and representative data checks. No live database read/write was performed as part of this plan update.

#### Page-by-page migration inventory

Status terms: **SQL path** = a SQL implementation exists in the current route graph; **rewire** = SQL support exists but this UI page calls a different/legacy API; **Mongo legacy** = the existing backend implementation uses Mongoose and is not the current SQL route; **blocked** = no compatible SQL behavior has been proven under the no-DDL rule. These are migration statuses, not reasons to delete a screen.

| Page / workflow | Current UI/API and data path | Plan under SQL-only / no-DDL |
|---|---|---|
| POS terminal — catalogue, preview, checkout | SQL counters, billing limits, preview and invoice endpoints exist. Writes Textilesoft `dbo.sales2` / `dbo.salsntry`; product and stock reads use existing shop tables. Checkout also uses `erp.sales_idempotency`; precise return-to-source allocations use `erp.sales_return_allocation`. | **Keep and complete.** Verify required ERP objects already exist; do not apply migration 004. Customer credit, loyalty, and cash-book side effects are outside current SQL POS scope and must stay clearly disabled until compatible existing tables/keys are proven. |
| POS Orders / sales invoice register | UI calls `/api/sales-invoice/*`; legacy controller reads Mongo `Invoice`. A SQL shop-sales report is not a replacement for register CRUD/detail. | **Rewire to SQL bill list/detail only if existing `sales2` / `salsntry` fields support the required filters and detail.** Do not expose edit/delete/mark-paid unless matching shop behavior and safe SQL writes are proven. |
| Sales invoice form | Uses the legacy `/api/sales-invoice` contract; Mongo `Invoice` is its source. It is separate from the SQL POS checkout path. | **Replace with the SQL POS billing flow** if the same business requirements fit it; otherwise constrain the form to supported counter billing. Never keep a parallel Mongo invoice writer. |
| Invoice detail, receipt, edit, delete, mark paid | Legacy invoice APIs and Mongo invoice/customer/cash-bank models. SQL POS writes do not provide these management endpoints. | **Read-only detail/receipt from `sales2` / `salsntry` first.** Keep mutations disabled unless the exact existing SQL transaction semantics are verified. |
| Estimates | `/api/estimates`; Mongo `Estimate`, with customer/item references. | **Blocked pending an existing compatible estimate table.** No substitute storage or new table. If no compatible table exists, preserve the page as unavailable or remove estimate actions only after user approval. |
| Sales Orders | `/api/sales-orders`; Mongo `SalesOrder`, plus item/customer/invoice lookups. | **Blocked pending an existing compatible order header/line/state workflow.** Do not treat invoices or GRNs as order storage. |
| Delivery Challans | Legacy challan API; Mongo challan, item, customer, and invoice operations including stock effects. | **Blocked pending compatible existing challan and stock-event tables.** Reuse only if keys, partial fulfillment, conversion, and reversal semantics match. |
| Sales Returns / Returned Items | UI calls legacy `/api/returns` and `/api/pos/invoices`. Current SQL POS exposes `/api/pos/return-sources` and records returns as negative/exchange POS lines. A standalone SQL return creator intentionally refuses use in shop mode. | **Rewire the return UI to POS Return mode** and use original sale-line prices/quantities. Keep the standalone return route disabled. Verify `erp.sales_return_allocation` already exists; do not run migration 004. |
| Receipts / Payment In | Legacy `/api/payment-in`; Mongo `PaymentIn`, invoice/customer/bank-account and cashbook side effects. | **Blocked pending compatible existing receipt/allocation and account-ledger behavior.** Do not claim a receipt is complete if it cannot allocate to the sale and update the existing SQL balance consistently. Anonymous POS cash/card/UPI settlement remains a distinct supported flow. |
| Customer Credits and Dues | Customer/dues UI depends on Mongo customer and invoice IDs; no complete mounted SQL customer/dues workflow found. | **Blocked on stable existing customer key and compatible balance/ledger fields.** Until proven, keep credit sales and customer-account mutation unavailable; never synthesize a crosswalk in an unrelated table. |
| MRP Pending Invoices | Calls legacy `/api/pos/invoice/mrp-pending` and finalization APIs; no SQL equivalent is mounted. | **Blocked unless existing bill fields encode pending/final MRP state and safe updates.** If not, show unavailable; do not write a parallel state store. |
| Sales reports / party reports | Mounted SQL report endpoints read Textilesoft shop tables. | **Keep with explicit scope.** Reconcile totals against the same SQL source; do not blend Mongo invoices or returns into SQL-only totals. |
| Wholesale sales entry | UI posts to SQL `/api/pos/invoice`. | **Keep only after testing channel/counter/pricing behavior.** The shared endpoint being SQL-backed does not prove wholesale-specific rules are persisted. |
| Wholesale bills and reports | UI calls legacy `/api/sales-invoice/wholesale/*`; legacy report controllers use Mongo Invoice aggregates. | **Rewire to SQL shop-sales reports** only where the existing SQL tables preserve the required channel/counter distinctions; otherwise limit/report unavailable. |
| Product Master / attributes | Mounted SQL product-master and attribute routes. | **Keep and verify** against existing product/attribute tables and update rules. |
| Inventory items, lookup, stock/aging reports | SQL item source and mounted read/report routes exist; the page may have other legacy endpoints. | **Keep SQL reads.** Remove Mongo mirror/fallback and validate barcode, stock, unit, tax, and quantity semantics. |
| Categories, combo offers, free-item schemes | Category and offer flows are Mongo-backed or not mounted; candidate legacy tables require semantic verification. | **Map only to compatible existing category/offer tables.** No new table. Preserve a narrower scheme only if all required fields and lifecycle are present; otherwise disable its transaction behavior explicitly. |
| Serialized units, shelf/rack, stock transfer, damage/loss, stock log, import/export/reprint | Legacy Mongo models/services; current SQL inventory route is primarily read/report. | **Per-operation audit required.** Existing shop stock tables may support some read/report cases but do not prove serial identity, transfer history, or reversal support. Enable only exact compatible operations. |
| Purchase entry/register and purchase returns | Existing SQL routes write/read Textilesoft purchase tables. | **Keep and verify** GRN posting, stock, supplier balances, deletion/reversal, and returns. |
| Purchase orders, GRN transfers, bills, payment-out, debit notes, rate revision, supplier reconciliation, supplier ageing, cheque vault | Mostly legacy Mongo APIs/models; some SQL adapters exist in working source but are not all mounted or end-to-end. | **Trace each screen and exact route.** Use existing `dbo` tables only where identifiers, lifecycle, balances, and rollback match; otherwise expose a documented reduced workflow or leave unavailable. |
| Customer and supplier directories, ledgers, statements, groups, loyalty | Mongo-backed CRUD and identity assumptions; SQL party reports are read-only reporting, not master/ledger CRUD. Existing customer key is not yet approved as stable. | **Customer identity is a dependency gate.** Prove a stable key before enabling linked sales/receipts/loyalty. Simplify fields to existing columns; do not create a crosswalk. Supplier keys require the same uniqueness/join verification. |
| Cash/bank, petty cash, transfers, reconciliation, loans, journals, EMI, card terminals, SMS tracker | Mongo models/controllers remain; SQL report endpoints cover only selected read aggregates. | **Map each operation to existing finance tables and reconcile balances.** Report tables/aggregates cannot be used as transaction ledgers. Block writes with no compatible target. |
| Expenses and recurring expenses | Mongo CRUD; SQL expense report path and existing legacy expense tables are candidates. | **Audit create/update/delete and category links against existing expense tables.** Recurring schedules are supported only if a compatible existing schedule representation is present. |
| HR/payroll, attendance, allowances, commission | Mongo models/controllers; employee-related table existence alone does not prove payroll state/period/payments. | **Validate each master and transaction separately.** Simplify to existing columns; otherwise keep unavailable without DDL. |
| Marketing, WhatsApp, SMS, storefront, coupons | Mongo integration/campaign data or external integrations; some screens are marked not connected. | **Retain integration placeholders where service is absent.** SQL can store only data supported by existing compatible tables; no fake metrics or fallback to Mongo. |
| System settings, users, branches, audit, sync, restore | Users/org/business profile have SQL routes; other configuration, audit, sync and restore paths are mixed or unmounted. | **Keep proven SQL routes.** Audit/sync/restore require existing tables and verified lifecycle; otherwise disable their operational actions explicitly. |

#### Execution sequence and gates

1. **Freeze and verify SQL contract:** refresh metadata read-only for SSS and any already-configured ERP database. Record table/column keys and permissions; prohibit DDL at the DB credential level. Do not apply repository migrations.
2. **Finish Sales vertical slice:** first verify POS SQL checkout and required existing objects; then wire register/detail/report reads, POS returns, and wholesale reports to existing shop data. Handle estimates, orders, challans, receipts, customer credits/dues, and MRP pending individually against compatible existing tables. Keep unsupported operations explicit and do not expose a fake-success UI.
3. **Finish product/inventory vertical slice:** remove Mongo catalogue mirrors/fallbacks; map each read and mutation independently; validate stock before/after and reversals.
4. **Finish purchase and supplier workflows:** coordinate supplier identity, purchase, returns, bills, payments and ageing so balances do not diverge. Verify each screen's write and reversal path.
5. **Finish customer/finance/expense/HR:** settle stable identities first; reconcile all supported financial totals and payroll periods to SQL.
6. **Finish offers, marketing, audit, sync and system pages:** keep integrations unavailable when the required external service or existing SQL data structure is absent.
7. **Remove Mongo code by dependency wave:** once a feature passes SQL acceptance, remove its Mongo route mounts, controllers/services, model imports, repositories, fallbacks, mirror code, tests and scripts. Repeat a whole-repo search and runtime import-graph check before removing dependencies and config.
8. **Final proof:** build and run the supported UI/API flows with Mongo unreachable and no Mongo credentials; verify every remaining menu item has an SQL route or an explicit unavailable state; confirm no `mongoose`, Mongo driver, URI, connection, query, mirror, fallback, job, or Mongo-required script remains in production code. No SQL schema operation is part of acceptance.

**No screen is dropped by this plan.** A page may be narrowed or marked unavailable where the no-DDL schema cannot support its operation. Re-enabling that operation requires proof of an existing compatible table/column and a complete page → API → SQL read/write trace.

### Wave 0 — Freeze the contract and inventory runtime usage

- Lock the no-DDL rule in deployment and credentials. Record the exact allowed databases and read/write permissions.
- Refresh read-only SQL metadata and table row counts; compare with the checked-in snapshot. Do not dump sensitive row contents.
- Build a complete inventory of Mongoose model imports and query/write calls reachable from `app.ts`, `server.ts`, route registration, workers, queue consumers, cron/scheduler code, websocket handlers, and sync code.
- Classify each item as: `SQL mapped`, `SQL partial/lossy`, `disabled/retired`, `blocked no compatible table`, or `not runtime/maintenance only`.
- Add route-level source assertions or static checks that reject Mongo fallback in SQL-only runtime paths.

**Exit:** every Mongo model and runtime entry point has an owner, dependency list, target/disposition, and acceptance criteria. No table writes or schema changes occur in this wave.

### Wave 1 — Remove the global Mongo startup requirement

- Separate SQL connection lifecycle and health checks from Mongoose startup. SQL-only deployment must not call `connectDB()` or wait for Mongo readiness.
- Make readiness reflect required SQL pools and required services only. Mongo may be an explicitly selected transitional deployment mode, not a hidden dependency of SQL mode.
- Audit startup validation, deployment gates, health endpoints, transaction/session helpers, shutdown hooks, and error handlers for unconditional Mongoose access.
- Keep Mongo mode available only while Mongo-backed route groups are still intentionally enabled. Do not claim the app is Mongo-free at this stage.

**Exit:** a staging instance with no `MONGO_URI` starts and passes health checks for the SQL-supported route set; unsupported Mongo-only routes are explicitly disabled or return a clear unavailable response. No schema change is required.

### Wave 2 — POS, catalog, inventory, and sales core

- Build a direct SQL POS catalogue from existing barcode/stock/product tables; remove SQL-mode item mirroring and fallback to `Item`.
- Trace sales invoice, returns, tax, discounts, stock reservations, stock logs, transfers, shelves, serial units, reprint queue, estimates, sales orders, and delivery challans.
- Use existing SSS sales and stock tables only where keys and transaction semantics match. Remove Mongo `Item`, `Invoice`, `Return`, `StockLog`, and related lookups from the selected SQL routes.
- Retain only the supported subset under the user's compatibility-first policy; disable mutations with no compatible target rather than mapping them to unrelated tables.
- Verify duplicate barcode behavior, stock arithmetic, tax/discount totals, returns, and concurrent checkout using representative staging bills.

**Exit:** every live POS/catalog/inventory/sales route has an explicit SQL-backed or unavailable disposition; no SQL POS route reads/writes Mongo or materializes mirror documents.

### Wave 3 — Customer and loyalty identity

- Prove that an existing SQL customer key is non-null, unique, immutable, and consistently used by customer, invoice, receipt, due, and loyalty tables. `dbo.newcustomer.sl_nu` was nullable/unindexed in the prior snapshot, so it is not approved as a canonical key without deployed write-path evidence.
- If a stable existing key is proven, pass it end-to-end as the ERP customer identity and remove Mongo ObjectId assumptions in POS, sales, payment-in, dues, customer reports, marketing segments, and loyalty.
- Map only fields represented by existing columns. Drop or disable tiers, RFM, consent, referral, loyalty ledger, or other behavior when no compatible schema exists.
- If stable identity cannot be proven without a new table/column, keep customer-dependent routes unavailable in SQL-only deployment or make sales anonymous; do not invent a hidden mapping.

**Exit:** no SQL-supported route validates or resolves customer IDs through Mongoose; customer and loyalty losses are documented and accepted.

### Wave 4 — Purchase, suppliers, payables, and payment flows

- Coordinate supplier master, purchase/GRN, purchase return, debit note, supplier reconciliation, supplier ageing, payment-out, and payment-in as one dependency graph.
- Use existing supplier and transaction keys directly only after uniqueness and join behavior are verified. Name-based joins are not identity.
- Remove Mongo `Supplier`, `Purchase`, `Bill`, `BankAccount`, and invoice lookups from SQL paths. If bill allocation, bank balances, or cashbook semantics cannot be represented, preserve only the compatible payment record and disable allocation/balance workflows explicitly.
- Do not imply that storing a payment in `erp.payment_out` also updates legacy bank, bill, or cash balances.

**Exit:** purchase and payment routes have verified SQL identities, or unsupported features are disabled. Ageing/reconciliation outputs must match their reduced documented SQL scope.

### Wave 5 — Expense and finance

- Complete the existing `dbo.expenseentry` mapping and state exactly which fields are lost. Keep recurring expenses disabled if no compatible table exists.
- Trace each finance endpoint to its underlying Mongo transaction classes: invoices, returns, bills, receipts, expenses, bank/cash entries, cheques, journals, loans, GST reconciliation, day-end, and petty cash.
- Reuse existing SQL ledgers only when they hold the same event and key; do not treat an aggregate/report table as a transaction store.
- Remove any “combined” report that silently mixes SQL with Mongo. Clearly scope or disable unsupported finance reports.

**Exit:** every financial total is derived only from declared SQL sources; no live financial endpoint reads Mongo or returns misleadingly complete totals.

### Wave 6 — HR and payroll

- Map employee master and each attendance, salary structure, payroll run, payslip, advance, and payment event to existing compatible tables.
- Treat employee key stability, payroll period uniqueness, and historical retention as cutover gates.
- If SQL lacks a compatible payroll record, disable that operation in SQL-only deployment; do not place payroll JSON in unrelated employee fields.

**Exit:** each active HR/payroll endpoint is SQL-backed or unavailable with a stated scope. Verify totals and historical periods before switching writes.

### Wave 7 — Config, offers, marketing, audit, and sync

- Config/loyalty/segment rules may use existing key/value SQL only for values that fit its present contract; verify import of customized Mongo values before turning off Mongo reads.
- Trace combo offers, free-item/discount schemes, WhatsApp campaigns/templates, SMS, audit logs, sync ledger, conflicts, devices, and notifications.
- Reuse existing combo/offer or log tables only after proving fields and lifecycle semantics. If campaign/audit/sync history has no compatible table, retire or disable its writes and UI in SQL-only deployment.
- For audit requirements, do not claim compliance-grade audit retention if no existing SQL table stores actor, entity, action, time, and change detail.

**Exit:** all background and user-triggered paths in these areas are SQL-backed or removed/disabled, and no runtime Mongo event source remains.

### Wave 8 — Reports, cleanup, and Mongo removal

- Re-run the runtime dependency inventory after earlier waves. Reports are migrated after source ownership is stable; they must not query Mongo to fill SQL gaps.
- Remove `ensureMirror`, `withMongoFallback`, overlay writers, Mongo snapshots, and migration code only after proving there are no live callers. Keep any explicitly approved export/archive utility outside application imports.
- Remove Mongoose model imports from runtime modules, Mongo connection setup, Mongo health gates, Mongo environment variables, Mongo-only jobs, and the Mongo driver/Mongoose dependency when no approved tooling needs them.
- Update architecture/docs and deployment templates so Mongo is not provisioned, monitored, or required for app operation.

**Exit:** no Mongo connection or Mongo query/write is reachable from production application code; a clean deployment without Mongo starts, passes health checks, and runs the supported route suite. Static search is reviewed manually because type-only `mongoose` imports and comments/scripts can produce false positives.

## Per-feature acceptance checklist

- [ ] Route/job/worker inventory complete, including indirect and dynamic call paths.
- [ ] Existing target table/columns and SQL key verified against current read-only metadata.
- [ ] No DDL, no unrelated-table reuse, and no hidden crosswalk.
- [ ] Tenant/branch/store scope and authorization behavior documented.
- [ ] Fields and business behaviors that will be lost are listed and surfaced in UI/API.
- [ ] SQL reads and writes are tested against a non-production database with representative data.
- [ ] SQL failure fails closed; no Mongo fallback, stale Mongo cache, or mirror write.
- [ ] Financial/inventory totals reconcile within the declared scope.
- [ ] Rollback is application-version/config based and does not require schema rollback.
- [ ] Mongo model imports and code paths for the migrated feature are removed or proven unreachable.
- [ ] Migration inventory and operator documentation updated.

## Cutover and rollback

1. Deploy the SQL adapter behind an explicit source setting while Mongo operation is still available only for unmigrated feature groups. Do not let the setting globally imply Mongo-free status.
2. Use shadow reads or offline comparisons where safe; never shadow-write business transactions.
3. Cut over one vertical slice at a time, with a dated decision record for each accepted loss.
4. Monitor SQL errors, unsupported-operation responses, row counts, and reconciliation metrics without logging PII.
5. Roll back by deploying the previous application version or restoring the previous feature source setting. Do not run reverse DDL because this plan permits no DDL.
6. After all waves pass, remove Mongo credentials from the SQL-only deployment and verify that startup and supported operations work without them. Then remove Mongo runtime dependencies from the application.

## Current blockers and decisions

| Blocker | Consequence under no-DDL rule | Required evidence or decision |
|---|---|---|
| Customer key/crosswalk not proven | Customer-linked SQL features cannot safely use Mongo IDs | Prove an existing stable SQL key or accept anonymous/disabled customer features |
| Existing table semantics incomplete | Do not cut over just because a table exists | Current metadata plus route-level field/key/behavior mapping |
| Finance and stock event parity incomplete | Reports and balances may omit transactions | Define supported SQL source classes and reconcile scoped totals |
| Runtime Mongo startup and residual queries remain | Application is not Mongo-free | Complete waves 1–8 and pass no-Mongo deployment acceptance |
| No-DDL may make some domains impossible to preserve | Feature loss or unavailable route is expected | Explicit product acceptance; do not work around by repurposing tables |

## Definition of done

The application is Mongo-free only when the Wave 8 exit criteria pass in an environment with Mongo unavailable and no Mongo credentials. The presence of Mongo-related scripts, docs, or a separately operated archival tool may be acceptable only if it is not shipped/imported/required by the production application and the owner has documented that exception. Any live Mongoose query, connection attempt, mirror, fallback, or required Mongo-backed job means the migration is incomplete.
