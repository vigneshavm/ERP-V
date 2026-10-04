# Mongo-free SQL migration task list

**Status:** execution tracker; all tasks are pending unless checked below.
**Parent plan:** [Mongo-free SQL migration plan](./MONGO_FREE_SQL_MIGRATION_PLAN.md).
**Live status workbook:** [Mongo-free SQL migration tracker](../outputs/01a0f828-afbf-7210-b2fe-087fd21f3e58/Mongo_Free_SQL_Migration_Tracker.xlsx). Update the matching workbook row after task verification.
**Scope:** make supported ERP pages use SQL only, then remove all MongoDB/Mongoose application code.

## Rules for every task

- [ ] Use only tables and columns that already exist in the configured SQL databases and have been verified by read-only metadata inspection.
- [ ] Do not create, alter, migrate, seed, repair, or add indexes/constraints/triggers to any SQL database. Do not run `backend/sql/erp/*.sql`.
- [ ] Do not store missing data in unrelated tables, JSON/config blobs, notes, or free-text fields. Do not create a hidden ID crosswalk.
- [ ] Do not drop a UI page before its page/API/database behavior has been reviewed. A screen with no compatible existing SQL storage must clearly show a reduced scope or an unavailable operation.
- [ ] No Mongo fallback, mirror, shadow write, or false-success response in a SQL path.
- [ ] Record the affected UI route, API method/path, backend handler, SQL tables/columns, business behavior lost or retained, and verification evidence for each completed task.

## 0. Freeze SQL contract and create evidence

### 0.1 Verify databases and schema without writes

- [ ] Confirm the configured SSS connection and any already-configured ERP SQL connection, database names, and read/write identities.
- [ ] Make application credentials unable to perform DDL where deployment allows: deny schema creation/alteration and migration permissions.
- [ ] Refresh table/column/key/index metadata and approximate row counts using read-only queries; compare with `docs/mongo-to-sql-live-schema/schema-report.json`.
- [ ] Verify required existing `erp.*` objects used by runtime SQL paths are present. Do not apply their repository migrations if absent.
- [ ] For each candidate table, document primary/business key, uniqueness evidence, nullability, relevant foreign keys, data types, tenant/branch scope, and semantic owner.
- [ ] Record unavailable database access or unverified table semantics as a blocker; do not infer compatibility from a table name.

**Done when:** there is a current metadata snapshot and a reviewed list of allowed existing tables/columns; no data or schema was changed.

### 0.2 Inventory all pages, endpoints and runtime entry points

- [ ] Export the UI screen list from menu, route definitions, module registry and nested navigation.
- [ ] For every screen, trace UI component → API method/path → route mount → controller → service/repository → SQL table or Mongo model.
- [ ] Include background jobs, timers, queue workers, websocket handlers, sync, restore, scheduled tasks and startup/shutdown imports.
- [ ] Mark every path `SQL complete`, `SQL partial`, `Mongo legacy`, `no API`, `external integration`, or `blocked: no compatible SQL object`.
- [ ] Record page-specific behavior that is retained, simplified, or unavailable.

**Done when:** every menu page and every Mongo model/query/write has a named disposition and no untraced runtime entry point remains.

## 1. Sales and POS

Dependencies: 0.1 and 0.2. Customer-linked tasks also depend on Wave 4 customer key verification.

### 1.1 POS terminal and SQL bill writer

- [ ] Trace catalogue, barcode lookup, counters, billing limits, preview, checkout, offline queue and retry from UI to SQL.
- [ ] Confirm existing `dbo.sales2`, `dbo.salsntry`, product, stock, counter and GST fields match the writer's reads/writes.
- [ ] Verify `erp.sales_idempotency` and `erp.sales_return_allocation` already exist with compatible columns before retaining paths that reference them. Do not run migration 004.
- [ ] Remove any Mongo `Item` lookup, catalogue mirror, fallback or ObjectId dependency from the active POS path.
- [ ] Document current unsupported behavior: customer credit, loyalty points, and cash-book side effects; ensure checkout does not imply those were persisted.
- [ ] Reconcile bill totals, GST, discounts, stock decrement, returned quantities, retries and duplicate submissions against representative SQL bills.

**Acceptance:** barcode sale and supported tender persist once to the shop database; totals/stock reconcile; DB failure fails closed or queues according to the documented offline contract; no Mongo read/write occurs.

### 1.2 Sales register, invoice detail and receipt

- [ ] Replace `/api/sales-invoice/*` UI dependencies with explicit SQL list/detail/report endpoints, or classify the operation unavailable.
- [ ] Map filters, pagination, invoice identifiers and line detail to existing `sales2` / `salsntry` columns.
- [ ] Ensure receipt/reprint reads use the SQL bill key and do not fetch Mongo Invoice, Customer or Branch documents.
- [ ] Keep edit, delete and mark-paid disabled until existing SQL semantics support a safe transactional update and reversal.

**Acceptance:** the register shows only SQL rows with truthful totals and paging; detail/receipt match the persisted bill; unsupported mutations are visibly unavailable.

### 1.3 Invoice entry form

- [ ] Decide whether `/sales/new` can use the supported POS SQL contract without changing required business behavior.
- [ ] If compatible, reuse the SQL POS flow and remove the parallel Mongo invoice writer; otherwise narrow the form or mark unsupported.
- [ ] Verify customer, invoice numbering, payment, GST, discount, stock and tax behavior against existing fields before enabling each input.

**Acceptance:** no UI path can create an invoice only in Redux/local state or Mongo while presenting it as an SQL-saved bill.

### 1.4 Returns and returned-items screen

- [ ] Rewire returned-item lookup from `/api/pos/invoices` and `/api/returns` to SQL `/api/pos/return-sources` and POS Return mode.
- [ ] Link each returned unit to its original SQL sale line and refund the paid unit value, including applied discounts and GST.
- [ ] Verify the existing return-allocation table is available before enabling source-line allocation; do not create it.
- [ ] Keep standalone return create/delete routes disabled unless existing Textilesoft return tables are demonstrated to be the active return source and stock/report effects reconcile.

**Acceptance:** return/exchange cannot exceed sold quantity, original paid value is used, inventory and sales reporting agree, and no Mongo Return/Invoice/Item model is accessed.

### 1.5 Estimates, Sales Orders and Delivery Challans

- [ ] Inspect existing SSS schema for semantically compatible estimate, order, challan, line, state, conversion and reversal storage.
- [ ] Verify key relationships and partial-fulfillment lifecycle; do not use invoice or GRN tables as substitutes.
- [ ] For each workflow, implement a SQL adapter only if all required records fit existing fields; otherwise retain the page with an explicit unavailable state and disable writes.
- [ ] Remove Mongo models/controllers only after routes are removed or replaced and all callers are accounted for.

**Acceptance:** each workflow is either verified end-to-end on existing SQL data or visibly unavailable; no fake-success save.

### 1.6 Receipts, credits, dues and MRP-pending invoices

- [ ] Prove an existing stable SQL customer key before enabling any customer-linked receipt, credit or dues operation.
- [ ] Verify existing receipt allocation and cash/bank ledgers can represent payment, partial allocation, balance change and reversal.
- [ ] Verify existing bill fields encode MRP-pending/final states before exposing the MRP-pending page.
- [ ] If keys or fields are absent/ambiguous, keep customer credit, receipt allocation, dues mutation and MRP finalization unavailable; do not crosswalk IDs in an unrelated table.

**Acceptance:** balances derive from persisted SQL transactions and reconcile; unsupported operations cannot mutate UI-only state or claim success.

### 1.7 Sales reports and wholesale screens

- [ ] Compare each sales report's SQL source tables, date semantics, cancellation filters, return treatment and totals.
- [ ] Rewire wholesale bill and report pages from Mongo `/api/sales-invoice/wholesale/*` to SQL only if existing rows preserve wholesale/counter/channel identifiers.
- [ ] Verify Wholesale Sales Entry's posted SQL payload persists the correct counter/channel and wholesale price/discount behavior.
- [ ] Keep a narrower or unavailable wholesale report where SQL cannot distinguish wholesale records reliably.

**Acceptance:** reports disclose their SQL scope and reconcile to source bills; no Mongo aggregates are mixed into SQL results.

## 2. Product and Inventory

Dependencies: 0.1, 0.2 and Sales 1.1 for POS catalogue/stock invariants.

- [ ] Inventory every screen: Items, Variant Search, Categories, Product Master, Aged Stock, Batches, Barcodes, Combo Offers, Serial/IMEI, Damage/Loss, Stock Transfer, Import, Reprint and Export.
- [ ] Map product/attribute/catalogue reads and writes to existing shop tables; remove `Item` materialization, Mongo fallback and mirror paths.
- [ ] Validate stock quantity, unit, barcode, GST, price and category meanings against actual rows.
- [ ] For stock movement, transfer, damage/loss and serialized-unit operations, prove existing SQL event/serial tables and reverse operations before enabling writes.
- [ ] Verify combo/free-item offers against existing compatible offer tables; never encode offers in unrelated product fields.
- [ ] Disable unsupported mutations with explicit API/UI status while preserving screens for later review.

**Acceptance:** every inventory page has a documented SQL read/write source or explicit unavailable state; stock totals reconcile; no Mongoose inventory models are reachable from enabled routes.

## 3. Purchase and supplier workflows

Dependencies: 0.1, 0.2 and Customer/Supplier identity tasks where billing/payment links require them.

- [ ] Inventory Register, New Entry, Express Purchase, Orders, Order List/Form, GRN, GRN Transfers, Bills, History, Returns, Debit Notes, Payments, Payment Out, Payables, Upload, Rates, PDC Vault and Cashflow.
- [ ] Verify SQL purchase-entry and purchase-return routes against current Textilesoft GRN/return tables, including stock and deletion/reversal behavior.
- [ ] Trace purchase order, GRN transfer, bill and supplier-payment IDs through all screens; verify a stable existing supplier key.
- [ ] Inspect existing SQL fields/tables for debit notes, rate revisions, payment-out, cheque states, supplier ageing and reconciliation.
- [ ] Remove Mongo Supplier/Bill/Purchase lookups from SQL handlers or disable operations with unresolved joins.
- [ ] Do not treat a stored payment as complete unless the existing SQL bill balance, account balance and reversal semantics are represented.

**Acceptance:** every enabled purchase screen matches source SQL records and reconciles inventory/payables; unsupported operations return explicit unavailable responses.

## 4. Customers, suppliers and loyalty

Dependencies: 0.1 and 0.2; Sales 1.6.

- [ ] Verify stable, unique, immutable existing customer and supplier identifiers from schema metadata and deployed write-path evidence.
- [ ] Map directory fields, search, edit, group membership, ledger, statement, referral/consent and archive behavior one field at a time.
- [ ] Trace customer references in invoices, sales returns, receipts, dues, loyalty and reports; remove Mongo ObjectId conversion/validation on SQL paths.
- [ ] Map points transactions to existing customer-point tables only if earn/redeem/reverse history and balances are compatible.
- [ ] If stable ID or ledger semantics cannot be proven, disable linked customer mutations; allow only explicitly anonymous SQL billing.

**Acceptance:** no SQL-enabled path resolves a customer/supplier through Mongo or an unverified name-based join; balances and points reconcile to existing SQL ledgers.

## 5. Finance and expenses

Dependencies: 0.1, 0.2, Sales 1, Purchase 3 and Customer/Supplier 4.

- [ ] Inventory Finance pages: Overview, Cash, Bank, Petty Cash, Transfers, Reconciliation, Summary, Loans, Goals, Statements, SMS Tracker, GST, Journal, EMI Plans and Card Terminals.
- [ ] Inventory Expenses pages: Tracker, Categories, Recurring and Reports; separate operational entry from SQL read-only reports.
- [ ] Trace each screen to existing SQL transaction tables and fields for cash/bank, bills, receipts, cheques, loans, journals, GST, petty-cash close, budgets and recurring schedules.
- [ ] Verify opening/current balances, transfer pairs, reconciliation state, dates, void/reversal handling and account identity.
- [ ] Compare SQL report calculations to the exact enabled source set and disclose exclusions; remove Mongo-sourced rows from combined reports.
- [ ] Reuse existing `dbo.expenseentry` and category tables only after validating keys, fields and lifecycle; keep recurring behavior unavailable if no compatible schedule table exists.
- [ ] Remove Mongo Bill, BankAccount, Expense and finance model queries from enabled SQL report and operation paths.

**Acceptance:** every enabled financial number derives only from declared SQL sources; opening + activity = closing; reports reconcile; writes and reversals are consistent.

## 6. HR, payroll and commission

Dependencies: 0.1 and 0.2.

- [ ] Inventory Staff Management, Payroll, Allowances, Attendance, Daily Board, Payslips, Salary Structures, Advances and Commission screens.
- [ ] Verify existing employee identifier and compatible attendance, payroll-period, component, deduction, payment and payslip fields.
- [ ] Map each workflow; do not infer payroll storage from the presence of an employee table.
- [ ] Verify commission inputs (invoice, product/category, employee/user), calculation basis and payout history against existing SQL data.
- [ ] Where no compatible existing SQL transaction table exists, keep the operation explicitly unavailable; do not persist payroll JSON in employee notes/config.

**Acceptance:** enabled payroll/attendance history and totals reconcile by employee and period; no Mongo User/Employee/Invoice queries remain in enabled routes.

## 7. Offers, marketing and communications

Dependencies: 0.1, 0.2, Product/Inventory 2 and Customer identity 4.

- [ ] Inventory Combo Offers, free-product/quantity schemes, discount configuration, coupons and offer reporting.
- [ ] Verify existing offer tables support eligibility, dates, product/barcode scope, minimum spend/quantity, free quantity, redemption and invoice linkage.
- [ ] Verify the SQL bill rows preserve which offer was applied before enabling offer-performance reports.
- [ ] Inventory WhatsApp campaigns/templates, marketing, SMS tracker, social integrations, email and storefront separately from external provider connectivity.
- [ ] Reuse existing SQL campaign/log tables only if they store the actual required lifecycle; otherwise retain honest not-connected states and disable persistence actions.
- [ ] Remove Mongo campaign, MetaIntegration, WhatsApp, SMS and combo model usage after all API callers are accounted for.

**Acceptance:** no fake campaign metrics; offers applied to a sale can be traced using existing SQL fields; integrations without a connected provider remain explicitly unavailable.

## 8. System, audit, sync and administration

Dependencies: 0.1, 0.2 and all enabled domain waves.

- [ ] Inventory General Settings, Master Data, Branch/Store settings, Users/Roles, Discount Limits, Tenants, Audit, Sync and Restore.
- [ ] Keep verified SQL auth/user/org routes; map each settings field only to an existing compatible SQL column/key contract.
- [ ] Verify audit storage can represent actor, entity, action, timestamp and change data before claiming audit completeness.
- [ ] Verify sync cursor/conflict/device/ledger state has an existing compatible representation; otherwise disable sync actions and remove Mongo timers/workers.
- [ ] Verify restore targets and recovery workflows use only SQL and do not invoke Mongo backup/restore tooling.
- [ ] Remove Mongo tenant lookup, auth type/runtime dependency, settings and audit queries from the active route graph.

**Acceptance:** every enabled admin action is SQL-backed; unsupported settings/audit/sync actions are clear; no background Mongo jobs run.

## 9. Remove Mongo code and runtime dependencies

Dependencies: Waves 1–8 complete or every feature explicitly retired/unavailable.

- [ ] Enumerate every remaining `mongoose`, `mongodb`, `MongoClient`, `ObjectId`, `MONGO_*`, mirror and fallback reference; classify type-only, docs, tests, scripts and runtime separately.
- [ ] Remove unreachable legacy route mounts, Mongo controllers/services/repositories/models/interfaces and their tests after confirming no imports/callers remain.
- [ ] Remove Mongo seed/migration/backup/restore scripts from supported operations; archive any approved one-time export tooling outside the application runtime and without credentials.
- [ ] Remove Mongo package dependencies, environment variables, Docker services/volumes, health checks and deployment documentation.
- [ ] Remove stale Mongo assumptions from frontend API clients/types and validate every remaining menu item routes to SQL or a clear unavailable state.
- [ ] Run backend/frontend type checks, builds, relevant tests and static scans; perform a staging run with Mongo unreachable and no Mongo credentials.
- [ ] Verify SQL credentials cannot perform DDL and no migration command is invoked at startup or deployment.

**Final acceptance:** no Mongo connection, query, write, fallback, mirror, required script, worker, or dependency remains in production; all operational screens use existing verified SQL objects; unsupported operations are explicit; no SQL schema object was created or altered.

## Blockers / decisions to track

| ID | Blocker | Blocks | Resolution evidence |
|---|---|---|---|
| B-01 | Customer SQL key is not proven stable/unique for all linked workflows | Customer CRUD, credit sales, receipts, dues, loyalty, customer reports | Existing deployed allocation/write-path evidence and end-to-end joins; no crosswalk table |
| B-02 | POS SQL writer references existing `erp.sales_idempotency` and `erp.sales_return_allocation` | POS retry safety and exact return-to-sale allocation | Read-only proof of deployed objects and compatible definitions; never apply migration 004 |
| B-03 | Sales Orders, Estimates and Delivery Challans lack confirmed compatible SQL lifecycle storage | Those transactional screens | Table/column/key/state mapping with data evidence, or explicit reduced/unavailable behavior |
| B-04 | Receipts, supplier payments and bank/cash effects need linked SQL ledger semantics | Payment-in/out, dues, payables and balances | Verified existing allocation/account ledger tables and reconciled sample transactions |
| B-05 | Several pages call legacy API paths while SQL-only app mounts different routes | UI/API completion across all waves | Endpoint-level route map and UI rewiring |
| B-06 | HR/payroll, audit, sync, marketing persistence have no verified full SQL target | Those workflows | Existing compatible SQL object evidence or accepted unavailable states |

