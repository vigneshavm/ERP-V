# TextileSoft -> React + Node ERP: Merged Implementation Plan

One document combining (1) the **corrected implementation plan** (order, phases, dependencies, status) and (2) the **Ultimate Blueprint** (per-module business flows, logic to preserve, acceptance scenarios, cross-module flows and method).

| Source | Used for |
|---|---|
| `TEXTILESOFT_IMPLEMENTATION_PLAN_CORRECTED.md` | Plan numbers, delivery order, phases and gates, priorities, dependencies, status, build checklists, page classification |
| `ULTIMATE_TEXTILESOFT_TO_REACT_NODE_IMPLEMENTATION_BLUEPRINT` (master + 32 plan files) | Business logic flow, implementation shape, logic to preserve and acceptance scenarios per module; standard method; cross-module flows; testing, restore, cutover |

> **Status column:** from a scan of the `team/legacytomodern` branch and the 2026-09-30 SQL gap audit, not from `ERP_Application_Code (2).zip`. Re-verify against the zip.

## How to read this document

- **Part 1** reconciles the two sources: where they agree, where they conflict and what was decided.
- **Part 2** is the rules and standard method that apply to **every** plan. They are stated once here, not repeated per plan.
- **Part 3** is the delivery order with exit gates and a crosswalk from blueprint plan numbers to plan numbers here.
- **Part 4** is the plans, in delivery order. Each has: status, flow, implementation, logic to preserve, corrections, a **build checklist** and **acceptance scenarios**.
- **Part 5** holds the cross-module flows, cutover and restore, then the appendices (legacy page classification, printers, corrections to the original plan).

# Part 1 - Reconciliation

## 1.1 What each source contributed

- The blueprint is a sound **method** and has useful per-module detail, but its per-module sections are largely templated: the SQL, Reports, Printing and Migration sections are word-for-word identical in all 32 plans, and its phase order has the problems already corrected in the original plan (see 1.2).
- The corrected plan fixes **order, ownership and gaps** but had little per-module business-rule detail. The blueprint supplies it.

## 1.2 Conflicts and decisions

| # | Topic | Blueprint says | Corrected plan says | Decision |
|---|---|---|---|---|
| 1 | Stock source of truth | Plans 16, 17 and flows 11.1/11.2/11.5: "SQL stock ledger"; avoid a mutable snapshot as sole truth. | `dbo.stockdetails` stays the only authority while the legacy app runs in parallel; no second balance in `erp`. | **Corrected plan wins on authority, blueprint wins on explainability.** Every stock figure must be explainable from transactions, delivered as reconciliation reports over the existing Textilesoft movement tables. `erp` holds only audit and adjustment documents the ERP itself creates. No authoritative `erp` ledger. |
| 2 | Plan order | Phase 2 purchase before Phase 3 barcode, though Plan 06 creates barcodes; GST in Phases 4 and 6. | Barcode identity (09A) and GST engine (18A) before purchase. | Corrected order adopted. Blueprint 11 splits into 09A and 09B; blueprint 10 into 18A and 18B. |
| 3 | Restore carryover | Rule 9 and section 16: must be implemented before real `erp` data; placed in a late phase. | Moved to Plan 01. | Plan 01. The blueprint's restore sequence is kept (Part 5). |
| 4 | Report / print frameworks | Built in Plans 28, 29 (Phase 7) but required by every module's acceptance. | Frameworks in Plan 01. | Plan 01 builds the frameworks; blueprint 28, 29, 32 supply the requirements. |
| 5 | Mongo during migration | Stages 1-4: Mongo stays available for comparison and rollback until Phase 9. | No Mongo dependency in completed scope. | **Both hold.** In a completed plan the runtime reads and writes SQL only. Mongo data may remain as a read-only archive for comparison and rollback until Phase 12; no Mongo writes after a plan's cutover. |
| 6 | Password reset | Plan 01 acceptance includes "reset flows". | Open decision: login uses `dbo.newuser`, which may hold no email. | Kept as an open decision (Part 3, decisions): disable, or admin-only reset in `dbo.newuser`. |
| 7 | QR code | Plan 30, Phase 7. | No plan. | Added as conditional Plan 35. No legacy page references QR; build only if Plan 00 finds legacy behaviour or the owner wants it. |
| 8 | Expenses | No plan. Legacy has 4 expense pages (`expensegroup`, `expensename`, `ExpensesReport`, `ExpenseInOutReport`). | Plan 22. | Plan 22 kept; flagged as a blueprint gap. |
| 9 | Wholesale / WSR | Only a report group. | Plan 23 (rates and reports) plus modes of 05 and 14. | Plan 23 kept; blueprint gap. |
| 10 | Staff masters | Plan 23 (Phase 1). | New Plan 34. | Same scope; blueprint 23 becomes Plan 34, Phase 2. |
| 11 | Approvals and operational controls | Only "authorization" mentions in Plans 12 and 25. | Plan 30. | Plan 30 kept (product request approval, price-change and discount approval); blueprint gap. |
| 12 | Barcode printing and printers | Plans 13 and 14 (two plans). | Plan 11 (one plan). | Merged into Plan 11; both blueprint blocks are kept under it. |
| 13 | Settings | Plan 31 (Phase 0). | Settings sit inside Plan 02. | Blueprint 31 merged into Plan 02. |
| 14 | Attributes | Plan 04 separate. | Part of Plan 03. | Blueprint 04 merged into Plan 03. |
| 15 | Definition of done | 18-item acceptance checklist per plan, plus a 17-item DoD. | 21-item DoD. | Union kept in Part 2 (2.5); not repeated per plan. |
| 16 | Malformed checklists | Per-plan module checklists use bare `[ ]` lines. | Fixed to `- [ ]`. | Fixed; module items appear as "Acceptance scenarios". |

## 1.3 Coverage

- All 32 blueprint plans are placed (crosswalk in Part 3).
- Corrected-plan items with no blueprint counterpart: **00, 22, 23, 30, 31, 32, 33**. They keep their corrected-plan content only; for these the blueprint has no module detail to add.

# Part 2 - Rules and standard method (apply to every plan)

## 2.1 Hard rules

- **No DDL on `dbo`.** Textilesoft tables, columns, indexes, triggers and procedures are never created, altered or dropped. The ERP writes (DML) only to tables on the reviewed `WRITE_TABLES` allow-list; adding a table to it is a reviewed change. *(Blueprint wording "dbo is never altered" is read this way, because the plans themselves write bills and GRNs into `dbo`.)*
- **`erp.*` is created only by versioned migrations** run by the ADMIN login, tracked in `erp.schema_migrations`. No new business table is silently added to `dbo`.
- **Three SQL identities:** READ, WRITE, ADMIN. The running app never uses ADMIN.
- **One shared SQL pool** and one transaction helper.
- **Every Mongo model has a disposition:** existing `dbo`, new `erp`, or drop, decided in Plan 00 from the restored schema.
- **Prefer `dbo` over `erp`.** Create an `erp` table only after schema discovery shows Textilesoft has none.
- **`dbo` stays authoritative** for stock, bills, GRNs and ledgers while the legacy app runs in parallel. No parallel balance, ledger or counter in `erp`.
- **Document numbers** (bill, GRN, barcode) come from one allocator that keeps Textilesoft formats and locks inside the transaction, because the legacy app writes the same tables.
- **Mongo idioms** (`ObjectId`, `populate()`, aggregation, sessions) are translated at the repository / service boundary and never exposed to React. API `_id` stays a string during migration.
- **`RESTORE ... WITH REPLACE` replaces the whole database, including `erp.*` and its users.** `erp` export/import carryover and re-grants (Plan 01) must work before real data is stored in `erp`.
- **Single shop:** no tenants, no `tenantId`.
- **Frameworks first:** reports, printing, RBAC, audit and number allocation are built once in Plan 01; modules add definitions, templates and rules.
- **Reports and printer variants belong to the module that owns the data**; the central registry only composes navigation and filters.
- **Every write path** checks permission and writes audit in the same transaction as the business write.
- **A module is complete only when** logic + API + SQL + UI + reports + printing + permissions + audit + tests + migration + rollback are complete.

## 2.2 What "complete migration" means

A function is not migrated because a React page exists. For every legacy capability trace:

```text
Legacy screen -> code-behind event -> SQL query / procedure -> business calculation
  -> data mutation -> stock / tax / finance side effect -> report / print / audit side effect
```

and rebuild it as:

```text
React interaction -> Node API -> service / domain rule -> repository -> SQL transaction
  (primary data, stock, tax, finance, commission, audit) -> response -> report / print / export
```

### Four levels of tracing (all four signed off)

| Level | Question | Examples |
|---|---|---|
| A Functional | What does the user do? | create purchase, scan barcode, sell, return, transfer stock, change rate, print label, close cash |
| B Logical | What decisions happen? | price selection, discount precedence, GST, commission, stock availability, return eligibility, transfer status, payment allocation |
| C Data | What records change? | purchase header/detail, barcode, stock, sales bill/detail, customer ledger, cash ledger, tax snapshot, audit |
| D Operational | What happens outside the transaction? | report, printer, export, notification, reprint, backup, restore, reconciliation |

### The 14 steps every module follows

1 Legacy discovery -> 2 Business-rule extraction -> 3 Data mapping -> 4 SQL target design -> 5 Node repository -> 6 Node service / domain logic -> 7 API -> 8 React UI -> 9 Reports -> 10 Printing / export -> 11 Permissions / audit -> 12 Migration -> 13 Parity tests -> 14 Cutover.

## 2.3 Standard architecture

```text
backend/src/modules/<module>/  controller/ service/ repository/ domain/ dto/ validators/ routes/ tests/
frontend/src/features/<module>/ pages/ components/ hooks/ api/ types/ validation/ state/
```

- **Controller:** HTTP, auth context, validation boundary, response contract.
- **Service:** business rules, transaction orchestration, cross-module coordination.
- **Repository:** SQL, mapping, query composition, pagination, locking.
- **Domain:** calculations, eligibility, state transitions, deterministic rules.
- **React:** previews only. The Node service is authoritative for any calculation that must also run server-side.
- **Common `erp` columns:** `id, created_at, created_by, updated_at, updated_by, is_active`; transaction tables also `business_date, document_no, status`.

## 2.4 Standard transaction

```text
validate input and permission
  -> BEGIN TRANSACTION
  -> lock required records; allocate document number / barcode (inside the lock)
  -> header -> details -> stock effect (in dbo) -> tax -> financial ledger -> commission -> audit
  -> COMMIT      (retry on deadlock; ROLLBACK everything on failure - no partial business transaction)
```

## 2.5 Definition of done (every plan)

Union of the corrected plan's 21 items and the blueprint's 18 + 17:

- [ ] Legacy screens / functions mapped and confirmed
- [ ] Code-behind and business rules traced
- [ ] SQL queries, procedures and triggers the function depends on identified
- [ ] Business rules documented
- [ ] Target ERP feature selected
- [ ] `dbo` / `erp` ownership approved and recorded per table (`dbo.existing` reuse / `erp.new` migration / obsolete)
- [ ] Migration created (if `erp` tables are needed)
- [ ] Repository, service, API and UI implemented
- [ ] Transaction boundaries and rollback behaviour defined
- [ ] Reports implemented under the owning module on the Plan 01 framework
- [ ] Printer variants implemented as templates on the Plan 01 print framework
- [ ] Permissions and audit implemented
- [ ] Unit tests pass (and are actually executed)
- [ ] SQL integration tests pass
- [ ] API tests pass (auth, authorization, validation, response compatibility)
- [ ] E2E tests pass
- [ ] Legacy-vs-new output reconciled (parity) on sample data
- [ ] Concurrency checked with the legacy app writing at the same time
- [ ] Data migration script implemented; every migrated model has source, target, mapping, transformation, validation, reconciliation and rollback
- [ ] Restore impact reviewed (`erp` carryover covers the new tables)
- [ ] Rollback tested
- [ ] Production runbook written
- [ ] No Mongo dependency remains in the completed scope
- [ ] Owner sign-off

## 2.6 Standard SQL, reports and printing (identical for all modules)

**SQL.** Every table destination is marked `dbo.existing_table` (reuse), `erp.new_table` (versioned migration) or `obsolete` (drop). Transaction data, related ledger / stock / tax / finance records and audit are written together.

**Reports.** Reports stay under the owning module: transaction data -> SQL report repository -> Node report service -> React report with filter, grouping, totals, export and print.

**Printing.** Printer variants use the common adapter, never a page per printer: module -> document / label payload -> template -> printer adapter -> queue -> physical printer -> print history.

**Migration of a module's data.** legacy records -> mapping -> validation -> staging -> target SQL -> reconciliation -> cutover.

## 12. Reports strategy

Crystal Reports are treated as **legacy presentation and query references**.

Do not port Crystal business logic blindly.

For each report:

```text
Crystal report
    ↓
identify tables
    ↓
identify joins
    ↓
identify formulas
    ↓
identify filters
    ↓
identify grouping
    ↓
identify totals
    ↓
identify parameters
    ↓
create SQL report repository
    ↓
create Node endpoint
    ↓
create React report
```

Reports must be grouped under:

- Sales
- Purchase
- Inventory
- Barcode
- GST
- Finance
- Cash
- Customer
- Supplier
- Commission
- Combo
- Wholesale
- Specialty modules

## 13. Printer strategy

Printer pages are implementation variants, not business logic.

```text
Business document
       ↓
Document DTO
       ↓
Template
       ↓
Print Job
       ↓
Adapter
       ├── Zebra
       ├── TSC
       ├── TVS
       ├── Citizen
       └── GODEX
       ↓
Agent / spooler
       ↓
Printer
```

The legacy `PrintBarCode.exe` contract must be recovered or replaced behind the adapter boundary.

## 15. Data migration rules

Every migrated model must have:

```text
source
target
mapping
transformation
validation
reconciliation
rollback
```

No blind collection/table copy.

## 17. Testing model

Every module requires five test layers.

### Unit

Business calculations:

- tax
- discount
- commission
- pricing
- quantity
- points
- eligibility

### Repository / SQL integration

- insert
- update
- delete/cancel
- joins
- transaction rollback
- locking

### API

- authentication
- authorization
- validation
- response compatibility

### E2E

Real user journey.

Example:

```text
login
→ purchase
→ GRN
→ barcode
→ stock
→ sale
→ payment
→ invoice
→ return
```

### Parity

Compare legacy and React/Node result.

# Part 3 - Delivery order

## 3.1 Phases and exit gates

| Phase | Plans | Exit gate |
|---|---|---|
| Phase 0 - Source inventory | 00 | All pages, reports, printers and Mongo models classified and confirmed. |
| Phase 1 - SQL foundation and shared frameworks | 01 | Migrations run on a clean and a restored DB; `erp` carryover drill passes; jest runs `.test.ts`. |
| Phase 2 - Masters, tax engine and barcode identity | 02, 03, 04, 09A, 18A, 34 | Org, staff, product, supplier masters, tax engine and barcode identity on SQL with parity to legacy. |
| Phase 3 - Purchase, GRN and purchase returns | 05, 06, 07 | Purchase -> GRN -> return matches legacy on sample documents, incl. GST and barcodes. |
| Phase 4 - Inventory, barcode lifecycle, rates, printing, transfer, combo | 08, 09B, 10, 11, 12, 13 | Stock, barcode lifecycle, rate changes, labels printing on target printers, transfers and combos reconcile. |
| Phase 5 - Sales, POS and returns | 14, 15 | Bills and returns made in ERP and in legacy appear correctly in each other's reports. |
| Phase 6 - Customers, discounts and commission | 16, 17, 28 | Customer, discount and commission results match legacy on sample data. |
| Phase 7 - GST reports, finance, cash/bank, payments, expenses | 18B, 19, 20, 21, 22 | GST, cash/bank, dues and expense reports reconcile to legacy for a fixed period. |
| Phase 8 - Wholesale and specialty modes | 23, 24, 25, 26, 27 | Each mode passes its purchase and sales acceptance scenarios. |
| Phase 9 - Report registry, approvals and conditional QR | 29, 30, 35 | Report registry complete; approvals enforced. |
| Phase 10 - Restore drills and certification | 31, 32 | Restore and rollback drills pass; parallel-run reconciliation signed off. |
| Phase 11-12 - Cutover, then Mongo removal | 33 | One month-end close on SQL; then Mongo removed and verified. |

No phase is complete because the UI exists. A phase is complete only when data, business rules, reports, printing, security, tests and rollback are verified.

## 3.2 Crosswalk: blueprint plan -> plan in this document

| Blueprint plan | Blueprint phase | Plan(s) here | Note |
|---|---|---|---|
| 01 Login, User & Security | 0 | 01 |  |
| 02 Company / Branch / Store | 0 | 02 |  |
| 03 Product / Item Master | 0-1 | 03 |  |
| 04 Product Attributes | 0-1 | 03 | Merged into Plan 03 |
| 05 Purchase | 2 | 05 |  |
| 06 Purchase Order / GRN | 2 | 06 |  |
| 07 Purchase Return | 2 | 07 |  |
| 08 Sales / Billing | 4 | 14 |  |
| 09 Sales Return | 4 | 15 |  |
| 10 GST | 4, 6 | 18A, 18B (see) | Split: engine early (18A), statutory reports later (18B) |
| 11 Barcode | 3 | 09A, 09B (see) | Split: identity before purchase (09A), lifecycle later (09B) |
| 12 Barcode Rate | 3 | 10 |  |
| 13 Barcode Printing | 3 | 11 | Merged with blueprint 14 into Plan 11 |
| 14 Printer Integrations | 3 | 11 | Merged with blueprint 13 into Plan 11 |
| 15 Combo / Offers | 4 | 13 |  |
| 16 Inventory / Stock | 3 | 08 | No authoritative `erp` ledger (see 1.2 #1) |
| 17 Material / Store Transfer | 3 | 12 | No authoritative `erp` ledger (see 1.2 #1) |
| 18 Customer | 1 | 16, 20 (see) | Ledger / payments also pointed from Plan 20 |
| 19 Customer Loyalty / Points | 5 | 16 |  |
| 20 Supplier / Vendor | 1 | 04, 20 (see) | Payables also pointed from Plan 20 (payments) |
| 21 Accounts / Finance | 6 | 21 |  |
| 22 Cash Management | 6 | 19 | Cash only; expenses are Plan 22 here (blueprint has none) |
| 23 Employee / Salesman | 1 | 34 | Renumbered 34, moved to Phase 2 |
| 24 Commission | 5 | 28 | Owns all commission pages |
| 25 Discount | 4 | 17 | Commission removed; this is discounts only |
| 26 Gift | 5 | 24 | Gift mode of purchase and sales engines |
| 27 Grocery / Electrical / Appliance / Special Modules | 5 | 25, 26 (see), 27 (see) | Split across grocery (25), electrical / appliance (26), fancy / garment (27) |
| 28 Reports | 7 | 29 | Framework in Plan 01; registry and analytics in Plan 29 |
| 29 Printing / Billing Engine | 7 | 01, 14 (see) | Framework in Plan 01; sales bill printing in Plan 14 |
| 30 QR Code | 7 | 35 | Conditional; no legacy page found |
| 31 Settings / Configuration | 0 | 02 | Merged into Plan 02 |
| 32 Reports / Export / Sharing | 7 | 29 | Export framework in Plan 01; module in Plan 29 |

Blueprint "Immediate implementation rule" (19 steps) is replaced by the phases above; the dependency idea is kept: each phase produces a usable increment and is the baseline for the next.

## 3.3 Decisions needed from the owner

- Which Textilesoft source is authoritative: `TEXTILESOFT 17.07.2025` or `TEXTILESOFT VIJAYALAKSHMI`?
- Does `online-store` stay out of scope?
- Canonical area: `finance` or `financial`?
- Tea shop, touch billing and sample sales: modes or obsolete?
- Combo barcodes: physical or virtual? Combo discount stacking?
- Does the legacy app have an in-transit state for material transfers?
- Forgot-password / change-password: disable, or admin-only reset in `dbo.newuser`?
- QR code (Plan 35): required, new feature, or dropped?
- Parallel-run length after cutover.

# Part 4 - Plans

## Phase 0 - Source inventory

### Plan 00 - Baseline and source-to-target inventory

**Priority:** P0 | **Depends on:** - | **Status:** Partial: schema-discovery script written, not yet run  
**Legacy scope:** All 619 ASPX pages, report and printer families, Mongo models  
**Latest ERP target:** - (spreadsheet in the repo)

Freeze scope before coding. The deliverable is one spreadsheet row per page / report / printer / Mongo model.

*Blueprint: no module counterpart for this plan (see 1.3).*

**Corrections and decisions**

- Record which Textilesoft source is authoritative: `TEXTILESOFT 17.07.2025` (this plan) or `TEXTILESOFT VIJAYALAKSHMI` (also in the Project folder). They may differ.
- The appendix classification was keyword-based and contained errors (see section 0); every row must be confirmed by opening the page, not by its name.
- Run `textilesoftSchemaDiscovery.ts` on the restored `.BAK` and attach `SCHEMA.md` and `CONCEPTS.md`; that decides which Mongo models map to existing `dbo` tables.
- Capture the legacy `dbo` object list including triggers and procedures, which may enforce rules the ERP must respect.

**Build checklist**

- [ ] 619 pages classified and each confirmed against its source
- [ ] The 38 pages still unclassified resolved (proposed homes in Appendix A)
- [ ] Report inventory classified (report family -> owning module)
- [ ] Printer inventory classified (42 variants -> adapters)
- [ ] Duplicate WebForms variants identified (same rule, different copy)
- [ ] Obsolete screens listed and signed off as "do not recreate"
- [ ] Every Mongo model has a disposition: existing `dbo` / new `erp` / drop
- [ ] `dbo` schema snapshot and restore behaviour captured
- [ ] No unknown business capability


## Phase 1 - SQL foundation and shared frameworks

### Plan 01 - SQL foundation, security and shared frameworks

**Priority:** P0 | **Depends on:** 00 | **Status:** Partial: read/write logins, `WRITE_TABLES` allow-list and post-restore re-grants exist; no `erp` schema, migration runner or `erp` carryover yet  
**Legacy scope:** n/a (platform)  
**Latest ERP target:** `backend/src` database layer, `backend/sql/migrations`

What every later plan depends on. **Expanded from the original:** restore carryover, the report and print frameworks, and the RBAC/audit baseline now live here, because every plan's definition of done requires them.

**Blueprint 01 - Login, User & Security**

Blueprint legacy scope: LoginOpen, user/login pages, role/access controls

Business logic flow:

```text
Authenticate → load company/branch/counter/business date → resolve permissions → create session/token → audit login → route to permitted module
```

Implementation:

- React auth pages + route guards
- Node auth/session service
- SQL user/role/permission repositories
- audit events

Logic that must be preserved: Authentication, authorization, session timeout, password/reset, company context, counter context, permission-based screen/action visibility

**Blueprint 29 - Printing / Billing Engine**

Blueprint legacy scope: bill printing, receipt, document layouts and Crystal billing reports

Business logic flow:

```text
Committed transaction → document snapshot → template → printer/PDF → print history
```

Implementation:

- React preview/reprint
- Node document renderer/print adapter
- SQL print history

Logic that must be preserved: Document content must be reproducible from stored transaction snapshots

**Corrections and decisions**

- **Moved here from Plan 31:** export/import of `erp.*` around any `RESTORE ... WITH REPLACE`. The restore replaces the whole database, `erp` included, so this must work before the first `erp` table holds real data.
- **Moved here from Plans 11 and 29:** the report-definition framework (registry, filters, pagination, export) and the print-job framework (job model, queue, adapter interface). Modules add definitions and templates; they do not build frameworks.
- **Moved here from Plan 30:** RBAC and audit baseline. Every write path checks permission and writes audit in the same transaction.
- One shared document-number allocator (bill no, GRN no, barcode) using Textilesoft formats, locking inside the transaction so it is safe while the legacy app writes the same tables.
- Fix `jest.config.js`: `.test.ts` files are silently skipped today.
- Three logins: READ, WRITE (DML on allow-listed `dbo` tables and on `erp`), ADMIN (migrations, user re-grants, restore). The running app never uses ADMIN.

**Build checklist**

- [ ] Shared SQL pool and transaction helper (deadlock retry)
- [ ] Migration runner and `erp.schema_migrations`
- [ ] READ / WRITE / ADMIN logins and `erp` grants, re-applied after restore
- [ ] `erp` export/import carryover around restore, with checksum
- [ ] Report-definition framework
- [ ] Print-job framework and adapter interface
- [ ] RBAC and audit baseline
- [ ] Shared number allocator, safe against concurrent legacy writes
- [ ] Health checks (SQL reachable, migrations current)
- [ ] `jest.config.js` fixed and a first SQL integration test running
- [ ] Migrations run from a clean database and from restored `SSS_copy` without touching `dbo`

**Acceptance scenarios (from the blueprint)**

- [ ] login parity _(BP 01)_
- [ ] role/action permissions _(BP 01)_
- [ ] company context _(BP 01)_
- [ ] counter context _(BP 01)_
- [ ] session timeout _(BP 01)_
- [ ] audit _(BP 01)_
- [ ] reset flows _(BP 01)_
- [ ] unauthorized API tests _(BP 01)_
- [ ] invoice _(BP 29)_
- [ ] receipt _(BP 29)_
- [ ] return _(BP 29)_
- [ ] exchange _(BP 29)_
- [ ] preview _(BP 29)_
- [ ] PDF _(BP 29)_
- [ ] printer _(BP 29)_
- [ ] reprint _(BP 29)_


## Phase 2 - Masters, tax engine and barcode identity

### Plan 02 - Organization, company, branch, warehouse, counter and business date

**Priority:** P0 | **Depends on:** 01 | **Status:** SQL adapter exists (`sqlOrg`: company, branch, warehouse, counter, settings); business date and per-counter permissions not confirmed  
**Legacy scope:** companydetail, branchdetail, warehousedetail, countername, AccountDate, LoginOpen, floor/rack setup  
**Latest ERP target:** `system`, `business`

Build organization hierarchy and operating context. Add branch/store/counter permissions and business-date controls. Preserve legacy counter/account-date behavior through services.

**Blueprint 02 - Company / Branch / Store**

Blueprint legacy scope: companydetail, branchdetail, warehousedetail, countername, AccountDate, floors/racks

Business logic flow:

```text
Company → branch → warehouse/store → floor/rack/counter → business date → transaction context
```

Implementation:

- React masters/settings
- Node organization service
- SQL organization repositories
- no dbo schema change

Logic that must be preserved: Preserve business-date and operating-location behavior; establish context used by purchase, stock, sales, transfer and reports

**Blueprint 31 - Settings / Configuration**

Blueprint legacy scope: CommonSettings, printer settings, system options, account date, operational configuration

Business logic flow:

```text
Configuration master → validation → effective date/context → module consumes configuration
```

Implementation:

- React settings
- Node configuration service
- SQL versioned configuration tables

Logic that must be preserved: Centralize configuration access and cache safely; avoid direct config reads from UI

**Corrections and decisions**

- **Tenant removed from the title and target.** The SQL-only decision is single shop: no Tenant model, no `tenants` feature area, no `tenantId`.
- Business date must follow legacy semantics (`AccountDate`, `LoginOpen`).

**Build checklist**

- [ ] company/branch/store
- [ ] warehouse/counter
- [ ] business date
- [ ] floor/rack
- [ ] permissions
- [ ] audit
- [ ] Tenant model and `tenants` UI removed

**Acceptance scenarios (from the blueprint)**

- [ ] company _(BP 02)_
- [ ] branch _(BP 02)_
- [ ] warehouse _(BP 02)_
- [ ] counter _(BP 02)_
- [ ] floor/rack _(BP 02)_
- [ ] business date _(BP 02)_
- [ ] permissions _(BP 02)_
- [ ] reports _(BP 02)_
- [ ] settings _(BP 31)_
- [ ] effective dates _(BP 31)_
- [ ] permissions _(BP 31)_
- [ ] printer config _(BP 31)_
- [ ] business date _(BP 31)_
- [ ] audit _(BP 31)_

### Plan 03 - Product master and item catalog

**Priority:** P0 | **Depends on:** 02 | **Status:** SQL adapter exists (`sqlProducts`, `sqlMasters`, `sqlAttributes`); import/export not confirmed  
**Legacy scope:** newproduct, product groups/subgroups, units, HSN, department, fashion/model/design, brand/pattern/size/color/style  
**Latest ERP target:** `inventory/ProductMaster, settings/master-data`

Complete the product master. Keep product identity separate from barcode/SKU identity. Add all textile attributes without changing dbo.

**Blueprint 03 - Product / Item Master**

Blueprint legacy scope: newproduct, product groups/subgroups, units, HSN/product codes

Business logic flow:

```text
Product code generated/validated → master attributes saved → referenced by purchase/barcode/sales/reporting
```

Implementation:

- React Product Master
- Node product service
- SQL product repository
- protect references before delete

Logic that must be preserved: Product identity is separate from barcode identity; prevent deletion when transaction/barcode dependencies exist

**Blueprint 04 - Product Attributes**

Blueprint legacy scope: brand, pattern, size, color, style, design, model, fashion, department/floor/rack attributes

Business logic flow:

```text
Attribute master → assigned at barcode/SKU level → used in pricing, stock, POS and reports
```

Implementation:

- React attribute masters + selectors
- Node attribute service
- SQL normalized masters/relations

Logic that must be preserved: Preserve textile-specific attributes and their historical transaction snapshots

**Corrections and decisions**

- Product identity stays separate from barcode identity (identity rules in Plan 09A).
- The product request / approval workflow (`NeedProduct*`) belongs to Plan 30, not here.

**Build checklist**

- [ ] product CRUD
- [ ] groups/subgroups
- [ ] units
- [ ] HSN
- [ ] attributes
- [ ] import/export
- [ ] Group and sub-group pictures
- [ ] Design master (`purdesign`)

**Acceptance scenarios (from the blueprint)**

- [ ] CRUD _(BP 03)_
- [ ] code generation _(BP 03)_
- [ ] HSN _(BP 03)_
- [ ] unit _(BP 03)_
- [ ] group/subgroup _(BP 03)_
- [ ] duplicate rules _(BP 03)_
- [ ] dependency checks _(BP 03)_
- [ ] audit _(BP 03)_
- [ ] all attributes _(BP 04)_
- [ ] dependency mapping _(BP 04)_
- [ ] barcode assignment _(BP 04)_
- [ ] history _(BP 04)_
- [ ] filters _(BP 04)_
- [ ] reports _(BP 04)_

### Plan 04 - Supplier, agent and vendor master

**Priority:** P0 | **Depends on:** 02 | **Status:** Read-only SQL (`sqlSuppliers`); writes, agents and ledger not built  
**Legacy scope:** supplier screens, AgentView, AgentPaymentEntry, supplier groups, supplier ledger  
**Latest ERP target:** `suppliers, purchase`

Unify supplier master, agents, supplier balances and supplier statements. Preserve agent commission/payment relationships.

**Blueprint 20 - Supplier / Vendor**

Blueprint legacy scope: supplier master, supplier balance, vendor views

Business logic flow:

```text
Supplier → purchases/returns/payments → payable ledger → statement
```

Implementation:

- React supplier workspace
- Node supplier service
- SQL supplier and payable relations

Logic that must be preserved: Preserve supplier codes, groups, tax details, contacts and financial linkage

**Corrections and decisions**

- Supplier ledger is derived from the `dbo` supplier tables. Do not create a second supplier ledger in `erp`.
- `agentdetail` belongs here (it was in the unclassified list); `SupplierSticker` printing is a Plan 11 template.

**Build checklist**

- [ ] supplier CRUD
- [ ] groups
- [ ] agents
- [ ] ledger
- [ ] payments
- [ ] statements
- [ ] Supplier bank, account number and credit days

**Acceptance scenarios (from the blueprint)**

- [ ] master _(BP 20)_
- [ ] purchase linkage _(BP 20)_
- [ ] returns _(BP 20)_
- [ ] payments _(BP 20)_
- [ ] balance _(BP 20)_
- [ ] statement _(BP 20)_

### Plan 09A - Barcode identity and allocation

**Priority:** P0 | **Depends on:** 03, 01 | **Status:** Not started (barcode allocation currently sits inside `sqlPurchase`)  
**Legacy scope:** barcode, barcodetaking, barcodetakingUpdate, barcodeview, BarcodeSetting, CommonBarcodeSetting, NewCounterBarcodeSetting, samebarcodecategoryNameEntry  
**Latest ERP target:** `inventory` (barcode service)

**Split out of Plan 09 and moved before purchase.** Plan 05 creates barcodes, so the identity service has to exist first. Plans 05 and 14 call it; they do not own barcode logic.

**Blueprint 11 - Barcode**

Blueprint legacy scope: barcode creation/taking/move/update/lookup and barcode history

Business logic flow:

```text
Product + GRN → barcode generated → barcode linked to stock/location/rates → movement → sale/return/transfer history
```

Implementation:

- React barcode workspace
- Node barcode service
- SQL barcode repository and history
- preserve legacy barcode semantics

Logic that must be preserved: Barcode is the operational inventory identity where the legacy system uses it; product master remains separate

**Corrections and decisions**

- Identity rule (owner statement): a new barcode is created for each purchase, so one barcode is one purchase lot.
- Allocation uses the shared allocator from Plan 01 and locks inside the transaction.

**Build checklist**

- [ ] Generate / allocate (one lot per purchase)
- [ ] Lookup
- [ ] Uniqueness and duplicate validation
- [ ] Barcode settings per counter
- [ ] Same-barcode re-entry rules (`samebarcode*` pages)
- [ ] Concurrency test with the legacy app writing

**Acceptance scenarios (from the blueprint)**

- [ ] create _(BP 11)_
- [ ] duplicate validation _(BP 11)_
- [ ] lookup _(BP 11)_
- [ ] movement _(BP 11)_
- [ ] location _(BP 11)_
- [ ] history _(BP 11)_
- [ ] sale linkage _(BP 11)_
- [ ] transfer linkage _(BP 11)_

### Plan 18A - GST and tax engine (calculation and masters)

**Priority:** P0 | **Depends on:** 01, 03 | **Status:** Partial: GST reports read SQL (`sqlGstReports`); a single shared tax engine is not confirmed  
**Legacy scope:** GSTCompany, GSTType, gstgroup, HsnDetails, and the tax logic inside every GST billing and purchase page  
**Latest ERP target:** `finance/gst` (engine), inventory masters

**Split out of Plan 18 and moved early.** Purchase (Plan 05) and sales (Plan 14) both need tax calculation, so it cannot come after them. One tax service and one stored tax snapshot per document; no tax formula is copied into any entry mode.

**Blueprint 10 - GST**

Blueprint legacy scope: GST masters, HSN, GST sales/purchase/return pages

Business logic flow:

```text
Product/transaction tax category → taxable value → CGST/SGST/IGST rules → document tax snapshot → return/report
```

Implementation:

- React GST configuration + transaction components
- Node tax service
- SQL tax repository

Logic that must be preserved: One central tax engine. Transaction must store tax snapshot so later master changes do not rewrite history

**Corrections and decisions**

- About 54 of the 63 pages in the "Tax / GST" category (by name) are sales or purchase entry variants (`AllGST*`, `Gst*Salesentry*`, `GST*Purchase*`). They are modes of Plans 05 and 14 that call this engine, not GST screens.

**Build checklist**

- [ ] Tax master, GST company and type settings
- [ ] HSN master
- [ ] CGST / SGST / IGST rules by party state
- [ ] Tax-inclusive and tax-exclusive pricing
- [ ] Rounding rules
- [ ] Tax snapshot stored with each document
- [ ] Tests against real legacy bills

**Acceptance scenarios (from the blueprint)**

- [ ] HSN _(BP 10)_
- [ ] tax groups _(BP 10)_
- [ ] CGST/SGST _(BP 10)_
- [ ] IGST _(BP 10)_
- [ ] purchase _(BP 10)_
- [ ] sales _(BP 10)_
- [ ] returns _(BP 10)_
- [ ] rounding _(BP 10)_
- [ ] reports _(BP 10)_

### Plan 34 - Employees, salesman, cashier and staff masters (new)

**Priority:** P0 | **Depends on:** 01, 02 | **Status:** Mongo only (Employee and 7 other HR models)  
**Legacy scope:** employeecatagary, employeegroup, employeesection, newemployee, newEmployeeWithoutCommission, cashiername, SupervisorNameEntry, CustomerStaffNameEntry, purinch  
**Latest ERP target:** `employees`, `sales`, `payroll` (masters only)

**Missing from the original plan.** The ERP already has `employees` and `payroll` areas and the legacy app has staff pages, but no plan owned them. Sales, commission, cash and reports all need salesman / cashier / supervisor / incharge masters first.

**Blueprint 23 - Employee / Salesman**

Blueprint legacy scope: employee/salesman masters and salesperson reports

Business logic flow:

```text
Employee/salesman → role/commission eligibility → sale attribution → settlement/report
```

Implementation:

- React employee workspace
- Node employee service
- SQL employee/sales attribution

Logic that must be preserved: Preserve salesman assignment rules and historical attribution

**Corrections and decisions**

- Read the attendance decision notes before designing attendance and payroll tables, so they match how attendance is actually taken.
- Payroll runs and payslips stay later work; only the masters are needed by Phase 5.

**Build checklist**

- [ ] Employee master, groups, sections, categories
- [ ] Salesman, cashier, supervisor, incharge masters
- [ ] Link staff to the Textilesoft login (`dbo.newuser`)
- [ ] Commission-eligible flag (used by Plan 28)
- [ ] Permissions and audit

**Acceptance scenarios (from the blueprint)**

- [ ] master _(BP 23)_
- [ ] assignment _(BP 23)_
- [ ] sale attribution _(BP 23)_
- [ ] status _(BP 23)_
- [ ] reports _(BP 23)_


## Phase 3 - Purchase, GRN and purchase returns

### Plan 05 - Purchase and GRN

**Priority:** P0 | **Depends on:** 03, 04, 09A, 18A | **Status:** GRN SQL write exists (`sqlPurchase`); GST / small / fancy / department / wholesale modes not confirmed  
**Legacy scope:** purchase entry variants, GST purchase, small purchase, fancy purchase, department purchase, wholesale purchase, appliance/grocery/gift purchase  
**Latest ERP target:** `purchase`, `wholesale` (modes only)

Create one purchase engine with configurable document modes instead of separate copies. Support header/items, discounts, tax, rates, barcode creation and stock receipt.

**Blueprint 05 - Purchase**

Blueprint legacy scope: all purchase entry variants, supplier/invoice/agent/charges/rates

Business logic flow:

```text
Supplier → purchase header → item/barcode rows → discounts/charges/tax → rate → GRN/stock → supplier payable
```

Implementation:

- React purchase workspace
- Node purchase service
- SQL purchase header/detail + dbo integration
- one engine with modes

Logic that must be preserved: Do not duplicate business logic for each legacy purchase page; configure purchase mode while preserving field/rule differences

**Corrections and decisions**

- One purchase engine with a document-mode configuration. The ten `WRPurchase*` pages and the GST, small, fancy, department, appliance, grocery and gift variants are modes, not copies.
- Barcode creation calls the Plan 09A service; tax calls the Plan 18A engine.
- Purchase discount-scheme pages (`NewPurchaseDiscountEntry*`, `GiftNewPurchaseDiscountSchemaEntry*`) belong here and to Plan 17. The `GiftNew...` ones were wrongly listed as printers.
- Plan 05 owns the purchase entry and its modes; Plan 06 owns PO, receiving and the GRN document workflow.

**Build checklist**

- [ ] normal purchase
- [ ] GST purchase
- [ ] small purchase
- [ ] specialty modes
- [ ] wholesale
- [ ] GRN
- [ ] reports
- [ ] Barcode creation via the Plan 09A service
- [ ] Tax via the Plan 18A engine

**Acceptance scenarios (from the blueprint)**

- [ ] normal purchase _(BP 05)_
- [ ] GST purchase _(BP 05)_
- [ ] specialty modes _(BP 05)_
- [ ] charges _(BP 05)_
- [ ] discount _(BP 05)_
- [ ] tax _(BP 05)_
- [ ] rates _(BP 05)_
- [ ] stock receipt _(BP 05)_
- [ ] payable _(BP 05)_
- [ ] reports _(BP 05)_

### Plan 06 - Purchase order and GRN workflow

**Priority:** P0 | **Depends on:** 05 | **Status:** SQL adapter exists (`sqlPurchaseOrder`, added 2026-09-30); approval, bill and payment hand-off not confirmed  
**Legacy scope:** purchase order pages, GRN view/update, invoice purchase, invoice purchase transactions  
**Latest ERP target:** `purchase`

Implement PO → receipt → GRN → purchase bill/payment flow. Preserve partial receipt and outstanding behavior.

**Blueprint 06 - Purchase Order / GRN**

Blueprint legacy scope: PO, GRN entry/update/view, invoice/receipt variants

Business logic flow:

```text
PO → approval → partial/full receipt → GRN → barcode/stock creation → invoice/payable
```

Implementation:

- React PO/GRN
- Node workflow service
- SQL transaction with stock receipt
- versioned status transitions

Logic that must be preserved: Preserve GRN numbering, invoice linkage, partial receipt, barcode creation and purchase update rules

**Corrections and decisions**

- Boundary with Plan 05: this plan owns PO, partial receipt, the GRN document and the hand-off to bill and payment.

**Build checklist**

- [ ] PO
- [ ] approval
- [ ] GRN
- [ ] bill
- [ ] outstanding
- [ ] payment

**Acceptance scenarios (from the blueprint)**

- [ ] PO _(BP 06)_
- [ ] approval _(BP 06)_
- [ ] partial receipt _(BP 06)_
- [ ] GRN _(BP 06)_
- [ ] barcode _(BP 06)_
- [ ] invoice _(BP 06)_
- [ ] payable _(BP 06)_
- [ ] cancellation _(BP 06)_

### Plan 07 - Purchase returns

**Priority:** P0 | **Depends on:** 05, 06 | **Status:** SQL adapter exists (`sqlPurchaseReturn`, added 2026-09-30)  
**Legacy scope:** purchase return pages, supplier-wise return, gift purchase return, barcode-wise purchase return  
**Latest ERP target:** `purchase/PurchaseReturn`

Implement return against GRN/barcode with stock reversal, supplier balance adjustment, tax reversal and audit.

**Blueprint 07 - Purchase Return**

Blueprint legacy scope: purchase return and barcode/GRN return variants

Business logic flow:

```text
Select supplier/GRN/barcode → validate available received stock → return quantity → reverse stock/tax/payable → audit
```

Implementation:

- React return workspace
- Node return service
- SQL transaction against purchase/stock/ledger

Logic that must be preserved: Never allow return beyond received-not-returned quantity; preserve original cost/tax context

**Corrections and decisions**

- Keep the three legacy references distinct: return document `rgrno`, original purchase `grn_no`, supplier return reference `sup_retu_grn`.
- Pages scattered elsewhere: `PurchaseReturnBillView` (was filed under sales returns), `PurchaseReturnBarcodewise` (under barcode), `PurchaseReturnNegativeQty`, `Giftpurchaseretrun`, `PurchSupplierWiseReturn`, `NewPurchaseReturn`, `purchaseretrun`.

**Build checklist**

- [ ] barcode return
- [ ] GRN return
- [ ] supplier balance
- [ ] GST reversal
- [ ] reports

**Acceptance scenarios (from the blueprint)**

- [ ] barcode return _(BP 07)_
- [ ] GRN return _(BP 07)_
- [ ] tax reversal _(BP 07)_
- [ ] payable reversal _(BP 07)_
- [ ] stock reversal _(BP 07)_
- [ ] reports _(BP 07)_


## Phase 4 - Inventory, barcode lifecycle, rates, printing, transfer, combo

### Plan 08 - Inventory core and stock

**Priority:** P0 | **Depends on:** 05, 09A | **Status:** SQL reads/reports exist (`sqlStockReports`); damage, missing and write-off writes not confirmed  
**Legacy scope:** stock reports, current stock, group/brand/city/floor/rack/model stock, minimum quantity, missing/damage/write-off  
**Latest ERP target:** `inventory, reports/stock`

Stock balances and movements, built as a service over the existing Textilesoft stock tables.

**Blueprint 16 - Inventory / Stock**

Blueprint legacy scope: current stock, stock details, group/brand/city/floor/rack/model reports, missing/damage

Business logic flow:

```text
Purchase receipt + sales + returns + transfers + adjustments → stock ledger → current balance/snapshot → reports
```

Implementation:

- React inventory dashboards
- Node inventory/ledger service
- SQL stock ledger + existing dbo integration

Logic that must be preserved: Inventory must be explainable from transactions. Avoid treating a mutable snapshot as the sole source of truth

**Corrections and decisions**

- **Changed from "build a stock ledger".** While the legacy app runs in parallel, `dbo.stockdetails` stays the single source of truth. A second balance or ledger in `erp` would drift from it. `erp` holds only audit and adjustment documents the ERP itself creates.
- Barcode is the identity (Plan 09A). Support quantity, free quantity and meter-based stock.

**Build checklist**

- [ ] current stock
- [ ] location stock
- [ ] minimum qty
- [ ] aged/dead stock
- [ ] write-off
- [ ] reconciliation
- [ ] Stock service over `dbo.stockdetails` (no parallel balance)
- [ ] Stock adjustment (`stockaj`) with audit

**Acceptance scenarios (from the blueprint)**

- [ ] opening _(BP 16)_
- [ ] receipt _(BP 16)_
- [ ] sale _(BP 16)_
- [ ] return _(BP 16)_
- [ ] transfer _(BP 16)_
- [ ] adjustment _(BP 16)_
- [ ] missing _(BP 16)_
- [ ] damage _(BP 16)_
- [ ] reconciliation _(BP 16)_
- [ ] valuation _(BP 16)_

### Plan 09B - Barcode lifecycle

**Priority:** P1 | **Depends on:** 08, 09A | **Status:** Not started  
**Legacy scope:** BarcodetakingMove, WSbarcodeview, CustomWiseBarcode, and the variant generators GarmentBarcode, Giftbarcode, WRBarcode, InvoiceBarcode, ApplianceCategoryBarcode  
**Latest ERP target:** `inventory`

Movement, history and the variant barcode generators, on top of the Plan 09A identity service.

**Blueprint 11 - Barcode** (full detail under Plan 09A)

**Corrections and decisions**

- Check whether the variant generator pages contain print code. If so the print part goes to Plan 11 templates and the rest is configuration of 09A.

**Build checklist**

- [ ] Move / reassign
- [ ] History
- [ ] Void and replace
- [ ] Variant generators as configuration
- [ ] Link to reprint (Plan 11)

**Acceptance scenarios (from the blueprint)**

- [ ] movement _(BP 11)_
- [ ] location _(BP 11)_
- [ ] history _(BP 11)_
- [ ] sale linkage _(BP 11)_
- [ ] transfer linkage _(BP 11)_

### Plan 10 - Barcode pricing, MRP and rate revisions

**Priority:** P1 | **Depends on:** 09A | **Status:** Not started (confirm)  
**Legacy scope:** barcoderatechange, samebarcoderatechange, MRP/rate pages, wholesale/small/fancy/invoice/combo rate changes  
**Latest ERP target:** `inventory, purchase/rate-revisions`

Create one rate revision engine with mode-specific rules. Preserve price history and current price separately.

**Blueprint 12 - Barcode Rate**

Blueprint legacy scope: rate/MRP/commission/wholesale/special rate change pages

Business logic flow:

```text
Find barcode → load current rates → capture old values → calculate new rates → save current price → write history → sync required stock snapshot
```

Implementation:

- React rate revision UI
- Node pricing service
- SQL price/history repository

Logic that must be preserved: Historical transaction price is immutable. Current barcode price may change. Rate-specific legacy variants become rule modes

**Corrections and decisions**

- Current price stays in the `dbo` tables the legacy app reads. Price history goes to `erp` only if the legacy schema has none (check `CONCEPTS.md`).

**Build checklist**

- [ ] MRP
- [ ] sale rate
- [ ] cost rate
- [ ] commission rate
- [ ] rate history
- [ ] cancellation/reversal

**Acceptance scenarios (from the blueprint)**

- [ ] MRP _(BP 12)_
- [ ] sale rate _(BP 12)_
- [ ] cost rate _(BP 12)_
- [ ] commission _(BP 12)_
- [ ] discount _(BP 12)_
- [ ] history _(BP 12)_
- [ ] cancel/reverse _(BP 12)_
- [ ] authorization _(BP 12)_

### Plan 11 - Barcode printing and label templates

**Priority:** P1 | **Depends on:** 01, 09A | **Status:** `ReprintQueue` exists as a Mongo model only; no printer adapters confirmed  
**Legacy scope:** Zebra TLP2844 / ZD220 / ZD230 / GC420T, TSC TTP-244, TVS LP44 / LP45 Lite / LP46 NEO, Citizen 621, GODEX barcode and combo pages; sticker and print settings (42 variants, Appendix B)  
**Latest ERP target:** `inventory/reprint`, `system/print settings`

The print framework is built in Plan 01. This plan adds label templates and printer adapters for the 42 variants and the reprint queue.

**Blueprint 13 - Barcode Printing**

Blueprint legacy scope: barcode sticker and category/template pages

Business logic flow:

```text
Select products/barcodes → resolve label template/printer → generate label payload/PRN → queue → print → log job
```

Implementation:

- React print workspace
- Node label service
- printer adapter layer
- SQL print history/settings

Logic that must be preserved: Template-based printer abstraction replaces page-per-printer duplication

**Blueprint 14 - Printer Integrations**

Blueprint legacy scope: Zebra, TSC, TVS, Citizen, GODEX and legacy PrintBarCode/PRN paths

Business logic flow:

```text
Print request → printer profile → adapter/template → spool/agent → physical printer → result
```

Implementation:

- Node print service + adapters
- React printer management
- Windows/local print agent where required

Logic that must be preserved: Preserve raw PRN behavior where unavoidable but isolate it behind adapter contract

**Corrections and decisions**

- Printer list in the original omitted **Zebra GC420T** (`ZeabraGC420T.aspx`, misspelled in the source so it was missed) and wrongly included three purchase discount pages.
- Customer, supplier, salesman and pattern/size sticker templates are owned by their own modules but print through this framework.

**Build checklist**

- [ ] template engine
- [ ] printer profiles
- [ ] queue
- [ ] retry
- [ ] reprint
- [ ] audit

**Acceptance scenarios (from the blueprint)**

- [ ] templates _(BP 13)_
- [ ] label sizes _(BP 13)_
- [ ] copies _(BP 13)_
- [ ] preview _(BP 13)_
- [ ] queue _(BP 13)_
- [ ] retry _(BP 13)_
- [ ] reprint _(BP 13)_
- [ ] history _(BP 13)_
- [ ] Zebra _(BP 14)_
- [ ] TSC _(BP 14)_
- [ ] TVS _(BP 14)_
- [ ] Citizen _(BP 14)_
- [ ] GODEX _(BP 14)_
- [ ] PRN _(BP 14)_
- [ ] agent _(BP 14)_
- [ ] retry _(BP 14)_
- [ ] device mapping _(BP 14)_

### Plan 12 - Material and store transfer

**Priority:** P1 | **Depends on:** 08, 09B | **Status:** Mongo only (`StockTransfer`, `GRNTransfer`)  
**Legacy scope:** MaterialTransfer, BarcodewiseMaterialTransfer, GRNwiseMaterialTransfer, StoreTransfer, received flows  
**Latest ERP target:** `inventory/stock-transfer`

Transfer request -> issue -> transit -> receive, with explicit transfer status and source / destination locations. Stock quantity continues to live in the existing Textilesoft stock tables.

**Blueprint 17 - Material / Store Transfer**

Blueprint legacy scope: MaterialTransfer, StoreTransfer, Barcodewise/GRNwise transfer, received flows

Business logic flow:

```text
Source store → transfer request → issue → in-transit → destination receive → source/destination stock ledger → status/audit
```

Implementation:

- React transfer workspace
- Node transfer service
- SQL transfer header/detail/status + stock transaction

Logic that must be preserved: Do not assume every legacy path has one universal stock update. Validate exact production behavior before final cutover

**Corrections and decisions**

- **Changed from "use a stock ledger".** Quantity authority stays in `dbo`.
- Open question to confirm in the legacy pages: does the legacy app have an in-transit state? If not, keep transit documents in `erp.transfer_*` and move quantity in `dbo` at receive.

**Build checklist**

- [ ] create
- [ ] barcode transfer
- [ ] GRN transfer
- [ ] receive
- [ ] cancel
- [ ] reconciliation

**Acceptance scenarios (from the blueprint)**

- [ ] create _(BP 17)_
- [ ] barcode _(BP 17)_
- [ ] GRN _(BP 17)_
- [ ] issue _(BP 17)_
- [ ] receive _(BP 17)_
- [ ] cancel _(BP 17)_
- [ ] stock _(BP 17)_
- [ ] reconciliation _(BP 17)_

### Plan 13 - Combo offers and combo inventory

**Priority:** P1 | **Depends on:** 03, 08, 09A, 10 | **Status:** Mongo only (`ComboOffer`)  
**Legacy scope:** ComboOfferEntry/Edit, single/multi MRP, combo product name, SuperCombo, barcodewise combo, combo stock  
**Latest ERP target:** `combo-offers, inventory`

Implement normalized combo definition, components, quantity rules, price tiers, barcode/virtual identity, sale allocation and returns. Treat physical-vs-virtual combo barcode as an explicit decision.

**Blueprint 15 - Combo / Offers**

Blueprint legacy scope: ComboOfferEntry/Edit, Single/Multi MRP, SuperCombo, barcodewise combo, combo stock

Business logic flow:

```text
Define combo → components/required quantities → price tiers/offer MRP → match eligible scanned components → allocate combo → sale/stock/tax → return
```

Implementation:

- React combo master + POS combo matcher
- Node combo service
- SQL normalized combo tables + allocation ledger

Logic that must be preserved: Explicitly decide virtual vs physical combo barcode. General matching uses component availability and required set quantities

**Corrections and decisions**

- Decide before building: physical vs virtual combo barcode; how combos stack with discounts (Plan 17); how combo returns restore stock.
- The 14 `Combo*` / `MultiCombo*` printer pages are Plan 11 templates, not combo screens.

**Build checklist**

- [ ] offer master
- [ ] components
- [ ] qty sets
- [ ] price tiers
- [ ] barcode
- [ ] POS matching
- [ ] returns
- [ ] stock

**Acceptance scenarios (from the blueprint)**

- [ ] master _(BP 15)_
- [ ] components _(BP 15)_
- [ ] qty rules _(BP 15)_
- [ ] price tiers _(BP 15)_
- [ ] matching _(BP 15)_
- [ ] allocation _(BP 15)_
- [ ] stock _(BP 15)_
- [ ] return _(BP 15)_
- [ ] reports _(BP 15)_


## Phase 5 - Sales, POS and returns

### Plan 14 - Sales POS and cash billing

**Priority:** P1 | **Depends on:** 08, 09A, 18A, 34 | **Status:** POS SQL writer exists (`sqlPosWriter`) and SQL invoice reads; mode variants not confirmed  
**Legacy scope:** SaleBillCash, GST sales entry variants, invoice entry, barcode sales, credit/retail/wholesale sales, POS bills  
**Latest ERP target:** `pos, sales, wholesale`

Create one sales engine with modes for retail, GST, credit, wholesale, gift, electrical, grocery and textile. POS owns cart, billing, payment, stock commit and receipt generation.

**Blueprint 08 - Sales / Billing**

Blueprint legacy scope: cash/GST/retail/wholesale/credit/gift/electrical/grocery/invoice sales

Business logic flow:

```text
Scan/select item → resolve price/offer/tax → cart → discount/commission → payment → invoice → stock decrement → cash/ledger → print
```

Implementation:

- React POS shell + mode configuration
- Node sales transaction service
- SQL sales header/detail + stock/payment transaction

Logic that must be preserved: One sales engine, configurable document modes. Atomic commit must cover bill, stock, tax, payment and commission

**Blueprint 29 - Printing / Billing Engine** (full detail under Plan 01)

**Corrections and decisions**

- One sales engine with modes (retail, GST, credit, wholesale, gift, electrical, grocery). Decide in Plan 00 whether `TeaShopSalesEntry`, `TouchBillingEntryNewAll` and `samplesalesentry` are modes or obsolete.
- **Added (missing in original):** sales orders and order delivery (`SalesOrderEntry`, `SaleOrders`, `salesorder`, `OrderDeliverySalesentryNewsaleAll`), bill hold / pending / cancelled handling (`billcontinue`, `Pending*CashBillView`), and `SuperBill*`.
- Tax via the Plan 18A engine; barcode via Plan 09A; salesman via Plan 34.

**Build checklist**

- [ ] scan
- [ ] cart
- [ ] discount
- [ ] tax
- [ ] payment
- [ ] invoice
- [ ] hold/recover
- [ ] reprint
- [ ] Sales orders and order delivery
- [ ] Pending / cancelled bill handling

**Acceptance scenarios (from the blueprint)**

- [ ] scan _(BP 08)_
- [ ] pricing _(BP 08)_
- [ ] offers _(BP 08)_
- [ ] tax _(BP 08)_
- [ ] discount _(BP 08)_
- [ ] payment _(BP 08)_
- [ ] stock _(BP 08)_
- [ ] invoice _(BP 08)_
- [ ] hold/recover _(BP 08)_
- [ ] print _(BP 08)_
- [ ] invoice _(BP 29)_
- [ ] receipt _(BP 29)_
- [ ] return _(BP 29)_
- [ ] exchange _(BP 29)_
- [ ] preview _(BP 29)_
- [ ] PDF _(BP 29)_
- [ ] printer _(BP 29)_
- [ ] reprint _(BP 29)_

### Plan 15 - Sales returns and exchange

**Priority:** P1 | **Depends on:** 14 | **Status:** SQL adapter exists (`sqlSalesReturn`, added 2026-09-30)  
**Legacy scope:** sales return/edit/return bill, exchange, invoice return, barcode return  
**Latest ERP target:** `sales/returns, pos`

Implement full/partial returns and exchange with stock reversal/re-entry and payment/refund adjustment.

**Blueprint 09 - Sales Return**

Blueprint legacy scope: return bill, invoice return, exchange, barcode return

Business logic flow:

```text
Original sale → validate returnable qty → return/exchange decision → stock increment or replacement sale → refund/adjustment → tax reversal → audit
```

Implementation:

- React return/exchange UI
- Node return service
- SQL transaction linking original sale and return

Logic that must be preserved: Support full/partial returns, exchanges, refund methods and original sale traceability

**Build checklist**

- [ ] full return
- [ ] partial return
- [ ] exchange
- [ ] refund
- [ ] stock reversal
- [ ] audit

**Acceptance scenarios (from the blueprint)**

- [ ] full return _(BP 09)_
- [ ] partial _(BP 09)_
- [ ] exchange _(BP 09)_
- [ ] refund _(BP 09)_
- [ ] stock _(BP 09)_
- [ ] tax _(BP 09)_
- [ ] original linkage _(BP 09)_
- [ ] reports _(BP 09)_


## Phase 6 - Customers, discounts and commission

### Plan 16 - Customer, credit, loyalty and engagement

**Priority:** P1 | **Depends on:** 14 | **Status:** Mongo only (`Customer`, loyalty); dashboard Customer Base and Top Outstanding Dues still read Mongo  
**Legacy scope:** customer master, credit payment, customer ledger, points, festival, relationship, response, customer reports  
**Latest ERP target:** `customers, engagement`

Unify customer master, credit, loyalty, customer history and engagement. Keep financial ledger separate from CRM profile.

**Blueprint 18 - Customer**

Blueprint legacy scope: customer master, credit/customer ledger and customer views

Business logic flow:

```text
Customer master → sales/credit transactions → payment allocations → outstanding → statement
```

Implementation:

- React customer workspace
- Node customer/ledger service
- SQL customer + account relations

Logic that must be preserved: Separate profile data from financial ledger and transaction snapshots

**Blueprint 19 - Customer Loyalty / Points**

Blueprint legacy scope: points, festival, response, relationship/loyalty screens

Business logic flow:

```text
Eligible sale → calculate points → post points ledger → redeem/adjust → customer balance → audit
```

Implementation:

- React loyalty workspace
- Node loyalty ledger
- SQL points transactions and balance

Logic that must be preserved: Points must be ledger-based, not only mutable balance

**Corrections and decisions**

- Check `CONCEPTS.md` first: if Textilesoft already has customer tables, use them instead of creating `erp.customer`.
- Customer staff names (`CustomerStaffNameEntry`) moved to Plan 34.

**Build checklist**

- [ ] master
- [ ] ledger
- [ ] dues
- [ ] payment
- [ ] points
- [ ] groups
- [ ] reports

**Acceptance scenarios (from the blueprint)**

- [ ] master _(BP 18)_
- [ ] duplicate _(BP 18)_
- [ ] credit _(BP 18)_
- [ ] payment _(BP 18)_
- [ ] outstanding _(BP 18)_
- [ ] statement _(BP 18)_
- [ ] history _(BP 18)_
- [ ] earn _(BP 19)_
- [ ] redeem _(BP 19)_
- [ ] expiry if applicable _(BP 19)_
- [ ] adjustment _(BP 19)_
- [ ] history _(BP 19)_
- [ ] reports _(BP 19)_

### Plan 17 - Discounts and promotions

**Priority:** P1 | **Depends on:** 14 | **Status:** Mongo only; no SQL path  
**Legacy scope:** DiscountOfferEntry, InvoicePriceOfferEntry, BarcodeWiseDiscount, ProductWiseDiscount, DateWiseProductDiscount, DepartmentDiscountWSREntry*, purchase discount schemes, FreeQtyEntry, freeproduct, discountpermission  
**Latest ERP target:** `inventory`, `sales`

Rules engine for discounts, offers and department pricing. Precedence and stacking are explicit. **Commission removed from this plan** (it was duplicated here and in Plan 28).

**Blueprint 25 - Discount**

Blueprint legacy scope: discount offers, invoice price offers, barcode/department discounts

Business logic flow:

```text
Candidate discounts → eligibility → precedence/stacking → final discount → tax base → audit
```

Implementation:

- React promotion UI
- Node pricing/discount engine
- SQL rule tables

Logic that must be preserved: Define exact precedence. Never scatter discount logic across POS screens

**Corrections and decisions**

- Write the precedence order down before coding (item, barcode, department, invoice, combo, loyalty).

**Build checklist**

- [ ] discount rules
- [ ] offers
- [ ] precedence
- [ ] approval
- [ ] audit

**Acceptance scenarios (from the blueprint)**

- [ ] rules _(BP 25)_
- [ ] eligibility _(BP 25)_
- [ ] stacking _(BP 25)_
- [ ] precedence _(BP 25)_
- [ ] approval _(BP 25)_
- [ ] audit _(BP 25)_
- [ ] reports _(BP 25)_

### Plan 28 - Commission and salesperson settlement

**Priority:** P2 | **Depends on:** 14, 34 | **Status:** Mongo only (`CommissionRule`)  
**Legacy scope:** All commission pages: ProductWiseCommission, RangeWiseCommission, PCSwiseProductCommission, BarcodeWiseCommission, SalesManAGEwiseProductCommission, SpecialSalesmanCommission, newSalesmanCommission, FloorWiseSectionCommissionReport, DaysFromComission, DaysFromComissionNew, Daysfrom (+ barcoderatechangecommission, newProductCommission, newProductWithoutCommission, NewCounterCommBarcodeSetting)  
**Latest ERP target:** `sales`, `employees`, `payroll`, `reports`

Create commission calculation and settlement service linked to sale lines and salesperson/agent context.

**Blueprint 24 - Commission**

Blueprint legacy scope: commission/range/days/PCS/section/salesman calculations

Business logic flow:

```text
Sale line → determine salesperson/agent → resolve commission rule → calculate → post commission → settlement
```

Implementation:

- React commission configuration/report
- Node commission engine
- SQL commission rules/ledger

Logic that must be preserved: Commission calculation must be deterministic and preserve historical rule snapshot

**Corrections and decisions**

- **Owns all commission work.** The original appendix filed only 2 pages under "Commission"; about 14 more were spread across five other categories.

**Build checklist**

- [ ] rule master
- [ ] sale calculation
- [ ] settlement
- [ ] reports
- [ ] audit

**Acceptance scenarios (from the blueprint)**

- [ ] rule modes _(BP 24)_
- [ ] salesperson _(BP 24)_
- [ ] agent _(BP 24)_
- [ ] calculation _(BP 24)_
- [ ] settlement _(BP 24)_
- [ ] reports _(BP 24)_


## Phase 7 - GST reports, finance, cash/bank, payments, expenses

### Plan 18B - GST returns and statutory reports

**Priority:** P1 | **Depends on:** 05, 14, 15, 18A | **Status:** Partial: GST reports read SQL (`sqlGstReports`)  
**Legacy scope:** gstreport, igstreport, newgstreport, CatagaryWisegstreport, PurchaseBillViewWOGST, GST sales and purchase views  
**Latest ERP target:** `finance/gst`, `reports/gst`

Statutory reports on top of the Plan 18A engine.

**Blueprint 10 - GST** (full detail under Plan 18A)

**Corrections and decisions**

- Owner decision already taken: a Purchase GST Register (ITC) replaces GSTR-2.

**Build checklist**

- [ ] Sales GST report
- [ ] Purchase GST Register (ITC)
- [ ] Return and credit-note impact
- [ ] Category-wise and IGST reports
- [ ] Reconcile against legacy GST reports

**Acceptance scenarios (from the blueprint)**

- [ ] purchase _(BP 10)_
- [ ] sales _(BP 10)_
- [ ] returns _(BP 10)_
- [ ] rounding _(BP 10)_
- [ ] reports _(BP 10)_

### Plan 19 - Cash, bank, petty cash and day-end

**Priority:** P2 | **Depends on:** 14, 16 | **Status:** Mongo only for ERP data; finance reads partly SQL (`sqlFinance`)  
**Legacy scope:** CashInOut, cash reports, closing cash, bank transactions, deposits, petty cash, cheque, cashier reports  
**Latest ERP target:** `financial/Cashbank, finance`

Implement cash/bank ledger, cashier sessions, day-end closing, deposits, petty cash and cheque lifecycle.

**Blueprint 22 - Cash Management**

Blueprint legacy scope: cash in/out, cashier/day close, deposits, bank/cheque

Business logic flow:

```text
Counter/cashier opening → cash transactions → sales/returns/expenses → closing → variance → bank deposit
```

Implementation:

- React cash workspace
- Node cash session service
- SQL cash ledger/session tables

Logic that must be preserved: Cashier session and business date must be part of transaction context

**Corrections and decisions**

- The ERP has both `finance` and `financial` feature areas. Pick one canonical home before building, so the work does not split across two.
- Card swipe machines (`SwipeMachineDetails`, `CardTerminal`) and `paymenttype` / `CashNameEntry` belong here.

**Build checklist**

- [ ] opening
- [ ] cash in/out
- [ ] cashier
- [ ] bank
- [ ] cheque
- [ ] day-end
- [ ] reconciliation
- [ ] Card terminals / swipe machines
- [ ] Payment types

**Acceptance scenarios (from the blueprint)**

- [ ] opening _(BP 22)_
- [ ] cash in _(BP 22)_
- [ ] cash out _(BP 22)_
- [ ] closing _(BP 22)_
- [ ] variance _(BP 22)_
- [ ] deposit _(BP 22)_
- [ ] cheque _(BP 22)_
- [ ] reports _(BP 22)_

### Plan 20 - Payments, receivables, payables and dues

**Priority:** P2 | **Depends on:** 04, 16, 19 | **Status:** Mongo only  
**Legacy scope:** customer/supplier payment pages, invoice payment, purchase payment, dues, balance reports  
**Latest ERP target:** `financial, customers, suppliers, purchase, sales`

Create unified payment allocation and ledger services for customer and supplier sides.

**Blueprint 18 - Customer** (full detail under Plan 16)

**Blueprint 20 - Supplier / Vendor** (full detail under Plan 04)

**Corrections and decisions**

- Allocation must preserve legacy payment semantics; check the legacy payment tables first (`CONCEPTS.md`).

**Build checklist**

- [ ] receive
- [ ] pay
- [ ] allocate
- [ ] partial
- [ ] advance
- [ ] outstanding
- [ ] statements

**Acceptance scenarios (from the blueprint)**

- [ ] credit _(BP 18)_
- [ ] payment _(BP 18)_
- [ ] outstanding _(BP 18)_
- [ ] statement _(BP 18)_
- [ ] returns _(BP 20)_
- [ ] payments _(BP 20)_
- [ ] balance _(BP 20)_
- [ ] statement _(BP 20)_

### Plan 21 - Finance, journals, loans and EMI

**Priority:** P2 | **Depends on:** 18B, 19, 20 | **Status:** Mongo only for journals, loans and EMI  
**Legacy scope:** DayBook, account, journal, loan, EMI, bank reconciliation, financial reports  
**Latest ERP target:** `financial, finance`

Implement accounting/finance services while retaining legacy dbo financial data where authoritative. Add journal posting and reconciliation controls.

**Blueprint 21 - Accounts / Finance**

Blueprint legacy scope: accounts, journals, daybook, loans, EMI, finance reports

Business logic flow:

```text
Business transaction → accounting event → journal/ledger → reconciliation → financial report
```

Implementation:

- React finance workspace
- Node accounting service
- SQL finance tables + dbo integration where authoritative

Logic that must be preserved: Accounting entries must be atomic with source transactions where the legacy logic requires it

**Corrections and decisions**

- Owner decision: Trial Balance and Balance Sheet stay "Coming soon" until every transaction posts to a ledger.

**Build checklist**

- [ ] journal
- [ ] day book
- [ ] bank reconciliation
- [ ] loans
- [ ] EMI
- [ ] finance reports

**Acceptance scenarios (from the blueprint)**

- [ ] chart/account _(BP 21)_
- [ ] journal _(BP 21)_
- [ ] daybook _(BP 21)_
- [ ] loan _(BP 21)_
- [ ] EMI _(BP 21)_
- [ ] reconciliation _(BP 21)_
- [ ] reports _(BP 21)_

### Plan 22 - Expenses and cash expenses

**Priority:** P2 | **Depends on:** 19 | **Status:** Mongo only  
**Legacy scope:** ExpensesReport, ExpenseBillView, ExpenseInOutReport, recurring expenses  
**Latest ERP target:** `expenses`

Implement expense categories, entries, recurring expenses, approvals, payment source and reporting.

*Blueprint: no module counterpart for this plan (see 1.3).*

**Corrections and decisions**

- Replaces the earlier "expenses stay on MongoDB" decision: expenses move to `erp.expense*` under the SQL-only strategy. `ExpansesBillview` moved here from sales.

**Build checklist**

- [ ] categories
- [ ] entry
- [ ] recurring
- [ ] approval
- [ ] payment
- [ ] reports


## Phase 8 - Wholesale and specialty modes

### Plan 23 - Wholesale / WSR rates and reports

**Priority:** P2 | **Depends on:** 05, 14 | **Status:** Not started  
**Legacy scope:** WR purchase/sales pages, WSR rate, WSR stock/sales reports  
**Latest ERP target:** `wholesale`

**Narrowed.** Wholesale purchase and sales documents are modes of Plans 05 and 14 (the original listed `wholesale` as a target in both and again here). This plan covers WSR rates, party rules and WSR reports only.

*Blueprint: no module counterpart for this plan (see 1.3).*

**Corrections and decisions**

- Avoid a second wholesale engine.

**Build checklist**

- [ ] WSR rates
- [ ] Wholesale party rules
- [ ] WSR stock and sales reports
- [ ] Mode acceptance tests for purchase and sales

### Plan 24 - Gift module

**Priority:** P2 | **Depends on:** 05, 14 | **Status:** Not started  
**Legacy scope:** Gift purchase/sales, gift barcode, gift supplier, gift reports  
**Latest ERP target:** `inventory, purchase, sales`

Implement gift items as a configurable item category/mode, not a duplicate ERP engine.

**Blueprint 26 - Gift**

Blueprint legacy scope: gift purchase/sale/barcode/report flows

Business logic flow:

```text
Gift item master/category → purchase → barcode/stock → sale → return → reporting
```

Implementation:

- React gift mode using shared product/purchase/sales engines
- Node mode rules
- SQL shared tables + gift attributes

Logic that must be preserved: Gift is a mode/category, not a second inventory system

**Corrections and decisions**

- Mode of Plans 05 and 14. The `GiftNewPurchaseDiscountSchema*` pages are purchase discount schemes, not printers.

**Build checklist**

- [ ] gift master
- [ ] purchase
- [ ] barcode
- [ ] sales
- [ ] return
- [ ] reports

**Acceptance scenarios (from the blueprint)**

- [ ] purchase _(BP 26)_
- [ ] barcode _(BP 26)_
- [ ] sale _(BP 26)_
- [ ] return _(BP 26)_
- [ ] stock _(BP 26)_
- [ ] reports _(BP 26)_

### Plan 25 - Grocery mode

**Priority:** P2 | **Depends on:** 05, 14 | **Status:** Not started  
**Legacy scope:** GroceryNewProductEntry, GrocerySalesEntry, GroceryModewiseReport  
**Latest ERP target:** `inventory, pos, reports`

Implement grocery as a product/measurement mode supporting weight/unit sale and mode-specific reporting.

**Blueprint 27 - Grocery / Electrical / Appliance / Special Modules**

Blueprint legacy scope: grocery sales, electrical sales, appliance purchase, model-number/garment/fancy variants

Business logic flow:

```text
Special category/mode → common product/barcode/stock/sales engine → mode-specific fields/rules → reports
```

Implementation:

- React configurable transaction modes
- Node shared domain services
- SQL specialty attributes

Logic that must be preserved: No separate stock engine. Add only the attributes and rules required by the specialty mode

**Corrections and decisions**

- Mode of Plans 05 and 14.

**Build checklist**

- [ ] product mode
- [ ] unit/weight
- [ ] POS
- [ ] stock
- [ ] report

**Acceptance scenarios (from the blueprint)**

- [ ] grocery _(BP 27)_
- [ ] electrical _(BP 27)_
- [ ] appliance _(BP 27)_
- [ ] model no _(BP 27)_
- [ ] garment _(BP 27)_
- [ ] fancy _(BP 27)_
- [ ] reports _(BP 27)_

### Plan 26 - Electrical / appliance mode

**Priority:** P2 | **Depends on:** 05, 14 | **Status:** Not started  
**Legacy scope:** ElectricalSalesEntry, Electrical reports, Appliance purchase, model-number stock, appliance barcode  
**Latest ERP target:** `inventory, purchase, sales, reports`

Implement appliance/electrical attributes such as model number and category. Serialized/asset-like units must remain linked to barcode/stock.

**Blueprint 27 - Grocery / Electrical / Appliance / Special Modules** (full detail under Plan 25)

**Corrections and decisions**

- Mode of Plans 05 and 14.

**Build checklist**

- [ ] appliance master
- [ ] model no
- [ ] purchase
- [ ] sales
- [ ] stock
- [ ] reports

**Acceptance scenarios (from the blueprint)**

- [ ] electrical _(BP 27)_
- [ ] appliance _(BP 27)_
- [ ] model no _(BP 27)_
- [ ] reports _(BP 27)_

### Plan 27 - Fancy / garment / textile specialty modes

**Priority:** P2 | **Depends on:** 05, 14 | **Status:** Not started  
**Legacy scope:** FancyPurchaseEntry, Fancy rate pages, GarmentBarcode, textile attributes  
**Latest ERP target:** `purchase, inventory, barcode`

Implement specialty behavior as configuration around common product/barcode engines. Do not fork the stock engine.

**Blueprint 27 - Grocery / Electrical / Appliance / Special Modules** (full detail under Plan 25)

**Corrections and decisions**

- Mode of Plans 05 and 14; do not fork the stock engine.

**Build checklist**

- [ ] textile attributes
- [ ] fancy purchase
- [ ] garment labels
- [ ] pricing
- [ ] stock

**Acceptance scenarios (from the blueprint)**

- [ ] garment _(BP 27)_
- [ ] fancy _(BP 27)_
- [ ] reports _(BP 27)_


## Phase 9 - Report registry, approvals and conditional QR

### Plan 29 - Report registry and cross-module analytics

**Priority:** P2 | **Depends on:** all report definitions | **Status:** Partial: SQL report adapters exist for sales, stock, party, GST, finance and dashboard  
**Legacy scope:** all Crystal report families and WebForms report pages  
**Latest ERP target:** `reports + owning modules`

**Narrowed.** The framework moved to Plan 01 and each module ships its own report definitions. This plan is the navigation registry, shared filters and analytics that span modules.

**Blueprint 28 - Reports**

Blueprint legacy scope: all Crystal Reports and report pages

Business logic flow:

```text
Business transaction tables → SQL report query → filters/grouping → React report view → export/print
```

Implementation:

- React report registry/views
- Node report repository/service
- SQL queries/views/CTEs

Logic that must be preserved: Every report is owned by a business module. Crystal reports are source references, not target business logic

**Blueprint 32 - Reports / Export / Sharing**

Blueprint legacy scope: Excel/export/share/email/WhatsApp/export variants

Business logic flow:

```text
Report result → authorization → format conversion → file/share target → audit
```

Implementation:

- React export actions
- Node export service
- SQL report repository
- connector/integration adapters where required

Logic that must be preserved: Exports must use the same report query and permission model as on-screen reports

**Corrections and decisions**

- Do not recreate one React page per Crystal `.rpt`.

**Build checklist**

- [ ] report registry
- [ ] filters
- [ ] pagination
- [ ] export
- [ ] print
- [ ] reconciliation

**Acceptance scenarios (from the blueprint)**

- [ ] inventory reports _(BP 28)_
- [ ] purchase _(BP 28)_
- [ ] sales _(BP 28)_
- [ ] GST _(BP 28)_
- [ ] finance _(BP 28)_
- [ ] customer _(BP 28)_
- [ ] supplier _(BP 28)_
- [ ] commission _(BP 28)_
- [ ] combo _(BP 28)_
- [ ] exports _(BP 28)_
- [ ] Excel/CSV _(BP 32)_
- [ ] PDF _(BP 32)_
- [ ] share _(BP 32)_
- [ ] email/WhatsApp where applicable _(BP 32)_
- [ ] audit _(BP 32)_
- [ ] large-export handling _(BP 32)_

### Plan 30 - Approvals and operational controls

**Priority:** P2 | **Depends on:** 01, 08, 14, 15 | **Status:** Partial: `AuditLog` / `Role` in Mongo; login uses `dbo.newuser` rights  
**Legacy scope:** NeedProductApproval/Edit, login/cash controls, audit, account-date controls  
**Latest ERP target:** `auth, system, settings`

**Narrowed.** RBAC and the audit baseline moved to Plan 01. This plan adds approval workflows and operational controls on top.

*Blueprint: no module counterpart for this plan (see 1.3).*

**Corrections and decisions**

- `NeedProductApproval` / `NeedProductEdit` / `NeedProductEntry` (product request workflow) belong here.

**Build checklist**

- [ ] approvals
- [ ] session controls
- [ ] device controls
- [ ] restore controls
- [ ] Product request and approval workflow
- [ ] Price-change and discount approval

### Plan 35 - QR code generation and scanning (conditional)

**Priority:** P3 | **Depends on:** 14, 29 | **Status:** Not started; no QR page exists in the 619-page legacy list  
**Legacy scope:** None found in the 619-page list (blueprint Plan 30 names "QR generation/scanning/report or payment/product QR functions" without a source page)  
**Latest ERP target:** `inventory`, `sales`

**From blueprint Plan 30; kept as conditional.** No legacy page references QR. Build this only if Plan 00 finds QR behaviour in code-behind, reports or printer templates, or if the owner wants QR as a new feature. Otherwise remove it.

**Blueprint 30 - QR Code**

Blueprint legacy scope: QR generation/scanning/report or payment/product QR functions

Business logic flow:

```text
Business identifier → QR payload → generate/scan → validate → link to business record
```

Implementation:

- React QR component
- Node QR service
- SQL stores only durable payload/relationship where required

Logic that must be preserved: Define QR payload contract and version it

**Corrections and decisions**

- Define and version the QR payload contract before any UI.
- Store only a durable payload/relationship in SQL.

**Build checklist**

- [ ] Decision recorded in Plan 00: required (legacy behaviour found) / new feature / dropped
- [ ] QR payload contract and version
- [ ] Generate and scan
- [ ] Validate and link to the business record
- [ ] Security review of payload contents

**Acceptance scenarios (from the blueprint)**

- [ ] generate _(BP 30)_
- [ ] scan _(BP 30)_
- [ ] validate _(BP 30)_
- [ ] version _(BP 30)_
- [ ] security _(BP 30)_


## Phase 10 - Restore drills and certification

### Plan 31 - Restore drills and disaster recovery

**Priority:** P2 | **Depends on:** 01 | **Status:** Partial: `sqlRestoreService` with bill carryover exists; `erp` carryover is built in Plan 01  
**Legacy scope:** SuperReset, AccountDateSharing, restore-related operational pages  
**Latest ERP target:** `system/Sync`

**Narrowed.** Carryover implementation moved to Plan 01. This plan runs the drills and operational procedures.

*Blueprint: no module counterpart for this plan (see 1.3).*

**Corrections and decisions**

- A restore also drops the database users; re-grants run automatically (`ensureErpDbAccess`) and must include `erp`.

**Build checklist**

- [ ] Restore drill with real `erp` data
- [ ] Re-grant of READ / WRITE logins incl. `erp`
- [ ] Checksum verification
- [ ] Newer local bills re-applied, no duplicates
- [ ] Rollback drill
- [ ] Scheduled native backups (SQL `BACKUP DATABASE`)

### Plan 32 - Testing and parity certification

**Priority:** P3 | **Depends on:** all | **Status:** Partial: `.test.ts` files are not executed until the Plan 01 fix  
**Legacy scope:** all transaction/report/printer variants  
**Latest ERP target:** `all modules`

For each plan create unit, integration, SQL parity and UI/E2E tests. Test legacy examples against the new result set where source data is available.

*Blueprint: no module counterpart for this plan (see 1.3).*

**Corrections and decisions**

- Add **parallel-run reconciliation**: the shop runs both billing systems, so compare real bills, stock and GST totals created in each for the same period.

**Build checklist**

- [ ] unit
- [ ] SQL integration
- [ ] E2E
- [ ] report parity
- [ ] printer tests
- [ ] rollback
- [ ] Parallel-run reconciliation against live legacy data


## Phase 11-12 - Cutover, then Mongo removal

### Plan 33 - Cutover (Phase 11) and Mongo removal (Phase 12)

**Priority:** P3 | **Depends on:** 32 | **Status:** Not started  
**Legacy scope:** all Mongo repositories/models/config  
**Latest ERP target:** `whole ERP`

Freeze writes, migrate final data, validate SQL-only runtime, remove Mongo dependencies, then monitor and retain rollback release.

*Blueprint: no module counterpart for this plan (see 1.3).*

**Corrections and decisions**

- Two gates: cutover is complete only after one month-end close on SQL; Mongo removal happens after that, never together with cutover.

**Build checklist**

- [ ] Freeze Mongo writes
- [ ] Final import of setup/master data into `erp`
- [ ] Reconciliation
- [ ] SQL-only runtime verified
- [ ] Monitoring
- [ ] Rollback release retained
- [ ] Mongo removal: dependency, models, config, scripts, docker, docs
- [ ] `grep -ri mongo` returns nothing; app boots with no MongoDB

# Part 5 - Cross-module flows, cutover and restore

## 5.1 Cross-module business flows (mandatory)

Flows cross module boundaries; each must work end to end before its plans are signed off.

The following flows are mandatory because functionality often crosses module boundaries.

### 5.1.1 Product → Purchase → Barcode → Stock

Plans: Plans 03, 05, 06, 09A, 10, 11

```text
Product Master
    ↓
Purchase
    ↓
GRN
    ↓
Barcode generation
    ↓
Barcode price
    ↓
Stock (existing Textilesoft stock tables)
    ↓
Barcode printing
```

### 5.1.2 Barcode → Sale → Payment → Stock

Plans: Plans 08 (POS), 09A, 10, 17, 18A, 14, 28, 19

```text
Scan barcode
    ↓
Resolve product
    ↓
Resolve current price
    ↓
Resolve discount/offer
    ↓
Resolve GST
    ↓
Resolve commission
    ↓
Add cart line
    ↓
Payment
    ↓
BEGIN TRANSACTION
    ├── sales header
    ├── sales detail
    ├── stock decrement
    ├── tax
    ├── customer ledger
    ├── cash/bank
    └── commission
    ↓
COMMIT
    ↓
Invoice print
```

### 5.1.3 Sale → Return

Plans: Plans 15, 14

```text
Original sale
    ↓
Return request
    ↓
Returnable quantity check
    ↓
Stock return
    ↓
Tax reversal
    ↓
Customer/payment adjustment
    ↓
Return document
```

### 5.1.4 Purchase → Return

Plans: Plans 05, 06, 07

```text
GRN
    ↓
Received quantity
    ↓
Purchase return
    ↓
Available return quantity
    ↓
Stock decrement
    ↓
Supplier payable reduction
    ↓
Tax reversal
```

### 5.1.5 Store transfer

Plans: Plan 12

```text
Source stock
    ↓
Transfer request
    ↓
Issue
    ↓
In transit
    ↓
Destination receive
    ↓
Destination stock
    ↓
Transfer reconciliation
```

### 5.1.6 Combo

Plans: Plan 13 (with 17, 14)

```text
Component barcode scan
    ↓
Candidate combo lookup
    ↓
Quantity accumulation
    ↓
Eligibility
    ↓
Set calculation
    ↓
Offer price
    ↓
Combo allocation
    ↓
Sale
    ↓
Component stock decrement
```

### 5.1.7 Rate change

Plans: Plan 10

```text
Barcode
    ↓
Current price
    ↓
New price
    ↓
Authorization
    ↓
Price history
    ↓
Current price update
    ↓
Required stock snapshot sync
```

### 5.1.8 Cash closing

Plans: Plan 19

```text
Opening cash
    ↓
Sales
    ↓
Returns
    ↓
Expenses
    ↓
Cash in/out
    ↓
Expected closing
    ↓
Physical closing
    ↓
Variance
    ↓
Close session
    ↓
Bank deposit
```

### 5.1.9 GST

Plans: Plans 18A, 18B

```text
Transaction
    ↓
HSN / tax category
    ↓
Taxable value
    ↓
CGST/SGST/IGST
    ↓
Rounding
    ↓
Tax snapshot
    ↓
Invoice
    ↓
GST report
```

### 5.1.10 Customer credit

Plans: Plans 16, 20

```text
Customer
    ↓
Credit sale
    ↓
Customer ledger
    ↓
Outstanding
    ↓
Payment
    ↓
Allocation
    ↓
Balance
```

## 5.2 Migration stages

## 14. Migration strategy

#### Stage 1 — Read compatibility

React + Node reads from SQL while Mongo remains available for comparison where required.

#### Stage 2 — Shadow comparison

```text
same request
   ├── SQL result
   └── legacy/Mongo result
```

Compare:

- counts
- totals
- calculated fields
- stock
- tax
- financial balances

#### Stage 3 — SQL write

SQL becomes authoritative.

#### Stage 4 — Observation

Mongo may remain only as a controlled rollback/reference dependency.

#### Stage 5 — Mongo removal

Remove:

- Mongo connections
- models
- repositories
- ObjectId dependencies
- populate
- aggregation
- transaction/session code
- environment variables
- deployment
- backup jobs

Per decision 1.2 #5, Mongo is a read-only archive for comparison and rollback during these stages; completed scopes never write to it.

## 5.3 Restore strategy

## 16. Restore strategy

Because:

```sql
RESTORE DATABASE ... WITH REPLACE
```

replaces the complete database, it can destroy:

```text
erp.*
```

Required final restore:

```text
backup
 ↓
ERP export/carryover
 ↓
RESTORE WITH REPLACE
 ↓
versioned erp migrations
 ↓
ERP data import
 ↓
dbo legacy carryover
 ↓
validation
```

Until this is implemented and tested:

> Do not put irreplaceable production ERP data into `erp.*` and then perform an unprotected restore.

## 5.4 Cutover

## 20. Final cutover

#### Pre-cutover

```text
- [ ] all 32 module plans signed off
- [ ] all reports reconciled
- [ ] all printer variants tested
- [ ] all critical E2E flows passed
- [ ] restore drill passed
- [ ] ERP carryover passed
- [ ] dbo schema unchanged
- [ ] erp migration history clean
- [ ] SQL permissions verified
- [ ] Mongo dependencies inventoried
- [ ] rollback release prepared
```

#### Cutover

```text
freeze writes
    ↓
final source checkpoint
    ↓
final SQL migration
    ↓
final reconciliation
    ↓
enable SQL-only runtime
    ↓
smoke tests
    ↓
business validation
    ↓
monitor
```

#### Rollback

```text
stop writes
    ↓
restore known-good release/database
    ↓
reconcile last accepted business checkpoint
    ↓
resume
```

## 5.5 Final success condition

## 21. Final success condition

The project is complete only when the latest React + Node.js ERP can perform the same business journeys as TextileSoft:

```text
SETUP
  ↓
MASTER DATA
  ↓
PURCHASE
  ↓
GRN
  ↓
BARCODE
  ↓
STOCK
  ↓
PRICING
  ↓
SALES
  ↓
PAYMENT
  ↓
GST
  ↓
COMMISSION
  ↓
CUSTOMER LEDGER
  ↓
RETURNS / EXCHANGE
  ↓
STORE TRANSFER
  ↓
FINANCE / CASH
  ↓
REPORTS
  ↓
PRINT / EXPORT
  ↓
AUDIT
  ↓
RESTORE / RECOVERY
```

The migration is successful only if the **business result** remains equivalent, not merely if the screen names or APIs exist.

# Appendix A - Legacy page classification (corrected)

Heuristic scope inventory, not a requirement to recreate each screen. Counts total **619**.

### Pages moved from the original classification

| Page | Was | Now |
|---|---|---|
| `BarcodeWiseCommission.aspx` | Barcode / Rate / Pricing | Commission |
| `cashiername.aspx` | Finance / Cash / Banking | Employees / Staff masters (new) |
| `CustomerStaffNameEntry.aspx` | Customer / Loyalty | Employees / Staff masters (new) |
| `Daysfrom.aspx` | Needs manual classification | Commission |
| `employeecatagary.aspx` | Needs manual classification | Employees / Staff masters (new) |
| `employeegroup.aspx` | Needs manual classification | Employees / Staff masters (new) |
| `employeesection.aspx` | Needs manual classification | Employees / Staff masters (new) |
| `ExpansesBillview.aspx` | Sales / POS / Billing | Finance / Cash / Banking |
| `FloorWiseSectionCommissionReport.aspx` | Inventory / Stock | Commission |
| `GiftSupplierWiseStockReport.aspx` | Supplier / Purchase | Inventory / Stock |
| `GODEX.aspx` | Needs manual classification | Printing / Documents |
| `GODEXOLD.aspx` | Needs manual classification | Printing / Documents |
| `MissingStockReport.aspx` | Tax / GST | Inventory / Stock |
| `newemployee.aspx` | Needs manual classification | Employees / Staff masters (new) |
| `newEmployeeWithoutCommission.aspx` | Barcode / Rate / Pricing | Employees / Staff masters (new) |
| `newSalesmanCommission.aspx` | Sales / POS / Billing | Commission |
| `PatternAndSizeWiseSalesReportQty.aspx` | Product / Master Data | Reports / Analytics |
| `PCSwiseProductCommission.aspx` | Barcode / Rate / Pricing | Commission |
| `ProductWiseCommission.aspx` | Barcode / Rate / Pricing | Commission |
| `PurchaseReturnBillView.aspx` | Sales Returns / Exchange | Supplier / Purchase |
| `RangeWiseCommission.aspx` | Barcode / Rate / Pricing | Commission |
| `SalesManAGEwiseProductCommission.aspx` | Sales / POS / Billing | Commission |
| `SpecialSalesmanCommission.aspx` | Sales / POS / Billing | Commission |
| `SupervisorNameEntry.aspx` | Needs manual classification | Employees / Staff masters (new) |
| `SupplierPatternandSizeWiseStockReportQty.aspx` | Supplier / Purchase | Inventory / Stock |
| `SupplierPatternBrandandSizeWiseStockReportQty.aspx` | Supplier / Purchase | Inventory / Stock |
| `tscte244.aspx` | Needs manual classification | Printing / Documents |
| `TSCTTP244PRO.aspx` | Needs manual classification | Printing / Documents |
| `TVSLP45Lite.aspx` | Needs manual classification | Printing / Documents |
| `TVSLP45Litenew.aspx` | Needs manual classification | Printing / Documents |
| `ZeabraGC420T.aspx` | Needs manual classification | Printing / Documents |
| `zebrazd220.aspx` | Needs manual classification | Printing / Documents |

### Security / Platform / Administration (47 pages)

`AccountDate.aspx`, `AccountDateAllUser.aspx`, `accountdateset.aspx`, `AccountDateSharing.aspx`, `AccountNoEntry.aspx`, `AccountType.aspx`, `branchdetail.aspx`, `caser_login.aspx`, `CashInOutLogin.aspx`, `ClientEntry.aspx`, `ClientEntryNew.aspx`, `ClientEntrySuper.aspx`, `commonsettings.aspx`, `counternameentry.aspx`, `Default.aspx`, `Default2.aspx`, `deleteuser.aspx`, `EXCashInOutLogin.aspx`, `HeaderFooterEntry.aspx`, `login.aspx`, `LoginClosingpattyCash.aspx`, `LoginClosingpattyCashDateWise.aspx`, `LoginOpen.aspx`, `LoginOpenpattyCash.aspx`, `LoginWholeSaleClosingpattyCash.aspx`, `LoginWiseReport.aspx`, `LoginWiseSalesSummaryReport.aspx`, `LoginWiseSummaryReport.aspx`, `Multitab.aspx`, `NewAccountDate.aspx`, `NewCashInOutLogin.aspx`, `NewCounterPrintSetting.aspx`, `NewCounterSalesIDsetting.aspx`, `NewCounterSetting.aspx`, `newuser.aspx`, `NewUserAddRightsEntry.aspx`, `NewUserCashFocusSetting.aspx`, `NewUserSalesFocusSetting.aspx`, `SuperAdminLogin.aspx`, `SuperAdminLoginMaster.aspx`, `SuperBillNewCounter.aspx`, `Supernewuser.aspx`, `SuperReset.aspx`, `SuperResetNew.aspx`, `userpermission.aspx`, `UserWisepattyCash.aspx`, `WRSalesLogin.aspx`

### Product / Master Data (33 pages)

`BrandWiseMinimumQtyEntry.aspx`, `CashGroupName.aspx`, `DepartmentDiscountWSREntry2.aspx`, `DepartmentDiscountWSREntryAdd2.aspx`, `DepartmentDiscountWSREntryUpdate2.aspx`, `DesignModelEntry.aspx`, `DesignModelGroupName.aspx`, `DesignModelView.aspx`, `FashionName.aspx`, `foolerdetail.aspx`, `giftnewproduct.aspx`, `GroceryNewProductEntry.aspx`, `ModelNo.aspx`, `NewCity.aspx`, `newproduct.aspx`, `newProductCommission.aspx`, `newproductRateEntry.aspx`, `newProductWithoutCommission.aspx`, `PatternSizeSticker.aspx`, `PrintSizeCompany.aspx`, `ProductBrandWise.aspx`, `ProductWiseFashionName.aspx`, `ProductWiseRack.aspx`, `progroup.aspx`, `prounit.aspx`, `purbrand.aspx`, `purcolor.aspx`, `purpattern.aspx`, `pursize.aspx`, `Purstyle.aspx`, `RackNo.aspx`, `Retailnewproduct.aspx`, `subgroupPicEntry.aspx`

### Employees / Staff masters (new) (8 pages)

`cashiername.aspx`, `CustomerStaffNameEntry.aspx`, `employeecatagary.aspx`, `employeegroup.aspx`, `employeesection.aspx`, `newemployee.aspx`, `newEmployeeWithoutCommission.aspx`, `SupervisorNameEntry.aspx`

### Supplier / Purchase (94 pages)

`AgentPaymentEntry.aspx`, `AgentView.aspx`, `ApplianceCategoryPurchaseEntry.aspx`, `ApplianceCategoryPurchaseEntryAdd.aspx`, `ApplianceCategoryPurchaseEntryView.aspx`, `ApplianceCategoryPurchaseUpdate.aspx`, `datewisedepartmentpurchasesalesreport.aspx`, `datewisepurchasesalesreport.aspx`, `DepartmentalPurchaseEntry.aspx`, `Departmentpurchasesalesreport.aspx`, `FancyPurchaseEntry.aspx`, `FancyPurchaseEntryNewAdd.aspx`, `GiftNewPurchaseDiscountSchemaEntry2.aspx`, `GiftNewPurchaseDiscountSchemaEntryAdd2.aspx`, `GiftNewPurchaseDiscountSchemaEntryUpdate2.aspx`, `GiftPurchaseReport.aspx`, `Giftpurchaseretrun.aspx`, `Giftsuppliers.aspx`, `grndetail.aspx`, `GRNwisesalesReport.aspx`, `Invoicepurchasereport.aspx`, `InvoicePurchaseTransactions.aspx`, `NewCounterGRNsetting.aspx`, `NewPurchaseDiscountEntry1.aspx`, `NewPurchaseDiscountEntry2.aspx`, `NewPurchaseDiscountEntryAdd.aspx`, `NewPurchaseDiscountEntryAdd2.aspx`, `NewPurchaseDiscountEntryUpdate.aspx`, `NewPurchaseDiscountEntryUpdate2.aspx`, `NewPurchaseDiscountWSREntry2.aspx`, `NewPurchaseDiscountWSREntryAdd2.aspx`, `NewPurchaseDiscountWSREntryUpdate2.aspx`, `NewPurchaseentry.aspx`, `NewPurchaseentryAdd.aspx`, `NewPurchaseentryView.aspx`, `NewPurchaseReturn.aspx`, `NewPurchaseUpdate.aspx`, `NewWithoutDiscountPurchaseEntry1.aspx`, `NewWithoutDiscountPurchaseEntry2.aspx`, `NewWithoutDiscountPurchaseEntryAdd.aspx`, `NewWithoutDiscountPurchaseEntryAdd2.aspx`, `NewWithoutDiscountPurchaseEntryUpdate.aspx`, `NewWithoutDiscountPurchaseEntryUpdate2.aspx`, `PurchaseBillView.aspx`, `purchaseedit.aspx`, `purchaseentry.aspx`, `purchaseentryadd.aspx`, `PurchaseOrderEdit.aspx`, `PurchaseOrderEntry.aspx`, `PurchaseOrderEntryReport.aspx`, `PurchaseOrderView.aspx`, `purchaserateview.aspx`, `PurchaseReceivedEntry.aspx`, `purchasereport.aspx`, `PurchaseReportPrint.aspx`, `purchaseretrun.aspx`, `PurchaseReturnBillView.aspx`, `PurchaseReturnGRNwise.aspx`, `PurchaseReturnNegativeQty.aspx`, `purchasesalescusreport.aspx`, `PurchaseSalesPerEdit.aspx`, `PurchaseSalesPerEntry.aspx`, `purchasesalesreport.aspx`, `PurchaseSalesViewReport.aspx`, `purchasesetting.aspx`, `purchasestockreport.aspx`, `PurchaseTransactions.aspx`, `PurchSupplierWiseReturn.aspx`, `SmallPurchaseEntry.aspx`, `SmallPurchaseEntryAdd.aspx`, `SmallPurchaseEntryView.aspx`, `SmallPurchaseUpdate.aspx`, `SplitPurchaseEntry.aspx`, `SupplierAccountNo.aspx`, `SupplierBank.aspx`, `SupplierBillCreditDays.aspx`, `suppliers.aspx`, `SupplierSticker.aspx`, `SupplierView.aspx`, `SupplierWiseMinimumQtyReminder.aspx`, `SupplierWiseMinimumQtyReminderDetails.aspx`, `SupplierWisePaymentReport.aspx`, `supplierwisereport.aspx`, `WholeSaleRetailPurchaseBillView.aspx`, `WRPurchaseEntry.aspx`, `WRPurchaseEntryAdd.aspx`, `WRPurchaseEntryNew.aspx`, `WRPurchaseEntryNewAdd.aspx`, `WRPurchaseEntryNewOLD.aspx`, `WRPurchaseEntryNewUpdate.aspx`, `WRPurchaseEntryNewView.aspx`, `WRPurchaseEntryView.aspx`, `WRPurchaseReport.aspx`, `WRPurchaseUpdate.aspx`

### Sales / POS / Billing (74 pages)

`billcontinue.aspx`, `CashBillView.aspx`, `CashBillWise.aspx`, `CashInOutBillwiseReport.aspx`, `CashSalesBillView.aspx`, `CatCreditSalesEntry.aspx`, `CatCreditSalesEntryEdit.aspx`, `CategarywiseBillView.aspx`, `ClosingSales.aspx`, `DateDepositCashInvoice.aspx`, `datewisesalesreport.aspx`, `DatewiseTransectionbillwiseReport.aspx`, `ElectricalBillReport.aspx`, `ElectricalCategarywiseBillView.aspx`, `ElectricalSalesEntry.aspx`, `giftokensalesbillview.aspx`, `GiftPurcheaseBillview.aspx`, `GiftSalesBillView.aspx`, `GrocerySalesEntry.aspx`, `InvBillEntry.aspx`, `InvBillEntryAdd.aspx`, `InvoiceBillEdit.aspx`, `InvoiceBillEntry.aspx`, `InvoiceEntry.aspx`, `InvoiceEntryEdit.aspx`, `InvoiceEntryView.aspx`, `InvoiceMRP.aspx`, `InvoiceNoWiseMRPpendingReports.aspx`, `InvoicePaymentEntry.aspx`, `InvoicePrice.aspx`, `InvoicePriceEntry.aspx`, `Invoicepurbalansecash.aspx`, `InvoicewisesalesReport.aspx`, `MissingSalesReport.aspx`, `MRPInvoiceBillEntry.aspx`, `MRPWiseInvoiceNopendingReports.aspx`, `newsalesmanwisereport.aspx`, `OrderDeliverySalesentryNewsaleAll.aspx`, `PendingCancelCashBillView.aspx`, `PendingCashBillView.aspx`, `PrintDuplicateBill.aspx`, `RateWiseSalesReport.aspx`, `SaleBillCash.aspx`, `SaleCashBillEntry.aspx`, `SaleOrders.aspx`, `Salesbillcreditcollection.aspx`, `SalesBillPrintCopies.aspx`, `SalesBillView.aspx`, `SalesClosingReport.aspx`, `salesentry.aspx`, `SalesEntryEdit.aspx`, `SalesentryNewsaleAll.aspx`, `SalesmanSticker.aspx`, `salesmanwisereport.aspx`, `SalesMRPPercentage.aspx`, `salesorder.aspx`, `SalesOrderEntry.aspx`, `salessetting.aspx`, `samplesalesentry.aspx`, `SectionWiseSalesReport.aspx`, `SuperBill.aspx`, `SuperBillNew.aspx`, `SuperBillUpdate.aspx`, `TeaShopSalesEntry.aspx`, `TouchBillingEntryNewAll.aspx`, `WholeSaleRetailEntry.aspx`, `WholeSaleRetailEntryAdd.aspx`, `WholeSaleRetailEntryUpdate.aspx`, `WholeSaleRetailEntryView.aspx`, `WholeSaleRetailSalesViewReport.aspx`, `WholeSaleSummaryReport.aspx`, `WRSalesentry.aspx`, `WRSalesEntryEditNew.aspx`, `WRSalesEntryNew.aspx`

### Sales Returns / Exchange (3 pages)

`InvocieReturnBillView.aspx`, `InvoiceReturnEntry.aspx`, `SalesReturnBillview.aspx`

### Inventory / Stock (20 pages)

`ApplianceModelNoWiseStockReport.aspx`, `CityWiseStockReport.aspx`, `FloorRackNowiseStockReport.aspx`, `FloorWiseCurrentStockDetail.aspx`, `FloorWiseCurrentStockSummary.aspx`, `FloorWiseMinimumQty.aspx`, `GiftSupplierWiseStockReport.aspx`, `GroupwiseStockReport.aspx`, `MinimumQtyReminder.aspx`, `MissingStockReport.aspx`, `ModelNoWiseStockReport.aspx`, `PatternAndSizeWiseStockReportQty.aspx`, `PatternBrandandSizeWiseStockReportQty.aspx`, `stockaj.aspx`, `StockDamage.aspx`, `StockMissing.aspx`, `StockMissingEdit.aspx`, `SupplierPatternandSizeWiseStockReportQty.aspx`, `SupplierPatternBrandandSizeWiseStockReportQty.aspx`, `WholeSaleRetailStockReport.aspx`

### Barcode / Rate / Pricing (57 pages)

`ApplianceCategoryBarcode.aspx`, `ApplianceMRPRateEntry.aspx`, `barcode.aspx`, `BarcodePrint.aspx`, `barcoderatecancelchange.aspx`, `barcoderatechange.aspx`, `barcoderatechangecommission.aspx`, `barcoderatechangemtr.aspx`, `BarcodeSetting.aspx`, `BarcodeSizeSerialNoSetting.aspx`, `barcodestickeroptions.aspx`, `barcodetaking.aspx`, `BarcodetakingMove.aspx`, `barcodetakingUpdate.aspx`, `barcodeview.aspx`, `BarcodeWiseDiscount.aspx`, `BarcodeWiseDiscountReport.aspx`, `BarcodeWiseSales.aspx`, `CategarywiseMRP.aspx`, `CategarywiseMRPAdd.aspx`, `CategarywiseMRPView.aspx`, `ClientEntryBarcode.aspx`, `CommonBarcodeSetting.aspx`, `CustomWiseBarcode.aspx`, `DateWiseProductDiscount.aspx`, `DepartmentalMRPRateEntry.aspx`, `discountpermission.aspx`, `Fancybarcoderatechange.aspx`, `Fancymrpratechange.aspx`, `GarmentBarcode.aspx`, `Giftbarcode.aspx`, `InvoiceBarcode.aspx`, `Invoicebarcoderatechange.aspx`, `MRPRateEntry.aspx`, `MRPRateEntryView.aspx`, `MultiSinglebarcoderatechange.aspx`, `NewCounterBarcodeSetting.aspx`, `NewCounterCommBarcodeSetting.aspx`, `PrintDuplicateBillwithBarcode.aspx`, `ProductWiseDiscount.aspx`, `PurchaseRateChange.aspx`, `PurchaseReturnBarcodewise.aspx`, `samebarcodecategoryNameEntry.aspx`, `samebarcoderatechange.aspx`, `samebarcodeWithoutMRPratechange.aspx`, `samebarcodeWSRratechange.aspx`, `SmallBarcodeRateChange.aspx`, `TSCBarcode.aspx`, `TVSBarcodeLP44BU.aspx`, `TVSLP46NEOBarcode.aspx`, `TVSLP46NEOBarcodeMobile.aspx`, `TVSLP46ONLYBarcode.aspx`, `WRBarcode.aspx`, `WSbarcoderatechange.aspx`, `WSbarcodeview.aspx`, `ZEBRATLP2844Barcode.aspx`, `ZEBRAZD230TBarcode.aspx`

### Material / Store Transfer (5 pages)

`BarcodewiseMaterialTransfer.aspx`, `GRNwiseMaterialTransfer.aspx`, `MaterialTransfer.aspx`, `StoreReceivedEntry.aspx`, `StoreTransferEntry.aspx`

### Combo / Offers (34 pages)

`BarcodewiseComboMaterialTransfer.aspx`, `BarcodewiseComboOfferEntry.aspx`, `CombobarcodeSticker.aspx`, `ComboBarcodewiseCitizen621.aspx`, `ComboBarcodewiseGODEX.aspx`, `ComboBarcodewiseTSC.aspx`, `ComboBarcodewiseTVSLP44BUNeo.aspx`, `ComboBarcodewiseTVSLP45Lite.aspx`, `ComboBarcodewiseTVSLP46.aspx`, `ComboBarcodewiseZEBRATLP2844.aspx`, `ComboOfferEdit.aspx`, `ComboOfferEntry.aspx`, `ComboOfferMultiMRPEntry.aspx`, `ComboOfferSingleMRPEntry.aspx`, `ComboProductNameEntry.aspx`, `ComboSinglebarcoderatechange.aspx`, `ComboStockReport.aspx`, `DiscountOfferEntry.aspx`, `GRNwiseComboMaterialTransfer.aspx`, `InvoiceBarcodewiseComboOfferEntry.aspx`, `InvoiceComboOfferSingleMRPEntry.aspx`, `InvoicePriceOfferEntry.aspx`, `MultiComboCitizen621.aspx`, `MultiComboGODEX.aspx`, `MultiComboTSC.aspx`, `MultiComboTVSLP44BU.aspx`, `MultiComboTVSLP45Lite.aspx`, `MultiComboTVSLP46NEO.aspx`, `MultiComboZEBRATLP2844.aspx`, `SingleComboBarcodeSticker.aspx`, `SuperComboOffer.aspx`, `SuperComboOfferAdd.aspx`, `SuperComboOfferUpdate.aspx`, `SuperComboOfferView.aspx`

### Customer / Loyalty (50 pages)

`addpoints.aspx`, `CatagaryCustomerWisePaymentReport.aspx`, `CatagaryCustomerWisePaymentSubReport.aspx`, `customerAddPoints.aspx`, `customerbalansecash.aspx`, `customerBillView.aspx`, `CustomerCardNoUpdate.aspx`, `customercat.aspx`, `Customercitywisereport.aspx`, `Customercompanynameentry.aspx`, `CustomerCreditPaymentEntry.aspx`, `CustomerCreditWiseSalesReport.aspx`, `CustomerCreditWiseSalesSubReport.aspx`, `CustomerFestivalView.aspx`, `customerGiftBillView.aspx`, `CustomerGiftItemDetailReport.aspx`, `CustomerGiftSalesReport.aspx`, `CustomerGroup.aspx`, `customerLessPoints.aspx`, `CustomerMobileNoUpdate.aspx`, `CustomerNameUpdate.aspx`, `CustomerPaymentBillView.aspx`, `CustomerPaymentReport.aspx`, `CustomerPaymentTransactions.aspx`, `CustomerPointNameEntry.aspx`, `CustomerPointsUpdate.aspx`, `CustomerRelationship.aspx`, `CustomerResponseEntry.aspx`, `CustomerSalesPaymentBillView.aspx`, `CustomerSalesPaymentEditEntry.aspx`, `CustomerSticker.aspx`, `CustomerTokenReport.aspx`, `CustomerTransactions.aspx`, `CustomerWisePaymentReport.aspx`, `CustomerWisePaymentSubReport.aspx`, `customerwisePointReport.aspx`, `customerwiseredeemReport.aspx`, `customerwisereport.aspx`, `CustomerWiseSalesReport.aspx`, `CustomerWiseSalesSubReport.aspx`, `CustomerWiseWholeSalesReport.aspx`, `newcustomer.aspx`, `newcustomerreligion.aspx`, `newcustomerreligionwithoutpoints.aspx`, `NewCustomerStatus.aspx`, `newcustomerwisereport.aspx`, `newcustomerwithoutpoints.aspx`, `Pointupdateamountwise.aspx`, `ProductandBrandwisePointEntry.aspx`, `SilkSareeTokenEntry.aspx`

### Finance / Cash / Banking (46 pages)

`balansecashcollection.aspx`, `bankdetail.aspx`, `BankEntry.aspx`, `BankTransaction.aspx`, `CashCencel.aspx`, `cashcollection.aspx`, `CashcollectionClear.aspx`, `CashFocus.aspx`, `CashInOutCashierwiseReport.aspx`, `CashInOutEntry.aspx`, `CashInOutEntry2.aspx`, `CashInOutItemwiseReport.aspx`, `CashInOutReport.aspx`, `CashNameEntry.aspx`, `CashPaidReport.aspx`, `CashPaymentEditEntry.aspx`, `CashReport.aspx`, `CashWiseReports.aspx`, `ClosingCashReport.aspx`, `closingpattycash.aspx`, `ClosingPettyCashReport.aspx`, `closingrepo.aspx`, `DateDepositCash.aspx`, `dateexcashinoutreport.aspx`, `dateexcashinoutwithproductreport.aspx`, `DateWiseTransitionCashReport.aspx`, `DayBook.aspx`, `EMIMasterEntry.aspx`, `EXCashInOutEntry.aspx`, `EXCashInOutEntry2.aspx`, `EXclosingpattycash.aspx`, `EXopenpattycash.aspx`, `ExpansesBillview.aspx`, `expensegroup.aspx`, `ExpenseInOutReport.aspx`, `expensename.aspx`, `ExpensesReport.aspx`, `newclosingpattycash.aspx`, `openpattycash.aspx`, `paymenttype.aspx`, `PendingCashReport.aspx`, `purbalansecash.aspx`, `SamplePayment4.aspx`, `SamplePayment5.aspx`, `TransactionGroup.aspx`, `TransactionNameEntry.aspx`

### Tax / GST (62 pages)

`AllGSTInvBillEntry.aspx`, `AllGSTInvBillEntryAdd.aspx`, `AllGSTMRPInvoiceBillEntry.aspx`, `AllGSTNewPurchaseEntry.aspx`, `AllGSTNewPurchaseEntryAdd.aspx`, `AllGSTNewPurchaseEntryView.aspx`, `AllGSTNewPurchaseUpdate.aspx`, `AllGSTPurchaseEntry.aspx`, `AllGSTPurchaseEntryAdd.aspx`, `AllGSTPurchaseEntryView.aspx`, `AllGSTPurchaseUpdate.aspx`, `AllGSTSuperComboOffer.aspx`, `AllGSTSuperComboOfferAdd.aspx`, `BarcodeGstSalesentryNewsaleAllEdit.aspx`, `CatagaryWisegstreport.aspx`, `CommonGstSaleCashBillEntryNewAll.aspx`, `CreditGstWholeSalesRetailSalesEntryNew.aspx`, `DepartmentGstSaleCashBillEntryNewAll.aspx`, `DepartmentWSRGstSaleCashBillEntryNewAll.aspx`, `DepartmentWSRplusGstSaleCashBillEntryNewAll.aspx`, `GiftGSTInvBillEntry.aspx`, `GiftGSTInvBillEntryAdd.aspx`, `GiftGSTInvBillEntryUpdate.aspx`, `GiftGstSalesentryNew.aspx`, `GiftGstSalesentryNewsaleAll.aspx`, `GstBilling.aspx`, `GSTCompany.aspx`, `gstgroup.aspx`, `GSTNewPurchaseEntry.aspx`, `GSTNewPurchaseEntryAdd.aspx`, `gstreport.aspx`, `GstReturnSalesentryNewsaleAll.aspx`, `GstSaleCashBillEntryNew.aspx`, `GstSaleCashBillEntryNewAll.aspx`, `GstSaleCashBillEntryNewAllRateEntry.aspx`, `GstSaleCashBillEntryNewTamil2023.aspx`, `GstSaleCashBillEntryTamilNew.aspx`, `GstSaleCreditBillEntryNew.aspx`, `GstSalesBillView.aspx`, `GstSalesEditWithDate.aspx`, `GstSalesentryEditNew.aspx`, `GstSalesentryNew.aspx`, `GstSalesentryNewsale.aspx`, `GstSalesentryNewsaleAll.aspx`, `GstSalesentryNewsaleAllEdit.aspx`, `GstSaleTokenNoEntry.aspx`, `GSTSmallPurchaseEntry.aspx`, `GSTSmallPurchaseEntryAdd.aspx`, `GstSuperSalesEntryNew.aspx`, `GSTType.aspx`, `gstWholeSalesRetailSalesEntry.aspx`, `GstWholeSalesRetailSalesEntryNew.aspx`, `gstwsalesentry.aspx`, `gstwsalesentryedit.aspx`, `HsnDetails.aspx`, `igstreport.aspx`, `newgstreport.aspx`, `PurchaseBillViewWOGST.aspx`, `RetailGstSaleCashBillEntryNewAll.aspx`, `WholeSalesGstSaleCashBillEntryNewAll.aspx`, `WRGstSaleCashBillEntryNewTamil2023.aspx`, `WSRplusGstSaleCashBillEntryNewAll.aspx`

### Commission (11 pages)

`BarcodeWiseCommission.aspx`, `Daysfrom.aspx`, `DaysFromComission.aspx`, `DaysFromComissionNew.aspx`, `FloorWiseSectionCommissionReport.aspx`, `newSalesmanCommission.aspx`, `PCSwiseProductCommission.aspx`, `ProductWiseCommission.aspx`, `RangeWiseCommission.aspx`, `SalesManAGEwiseProductCommission.aspx`, `SpecialSalesmanCommission.aspx`

### Reports / Analytics (26 pages)

`Addcompanyreport.aspx`, `AGEWiseReport.aspx`, `Catagarycompanywisereport.aspx`, `companywisereport.aspx`, `counterreport.aspx`, `CounterWisePaidReport.aspx`, `DailyModeWisereport.aspx`, `DateWiseCounterPaidReport.aspx`, `datewisereport.aspx`, `DatewiseTransitionReport.aspx`, `GraphWiseReports.aspx`, `GroceryModewiseReport.aspx`, `inchargewisereport.aspx`, `modewisereport.aspx`, `NeedProductEntryReports.aspx`, `newprofitreport.aspx`, `NotPaidReport.aspx`, `PaidReport.aspx`, `PatternAndSizeWiseSalesReportQty.aspx`, `profitreport.aspx`, `pursereport.aspx`, `RangeWiseReport.aspx`, `reportoptions.aspx`, `ReportPrintName.aspx`, `ShareReportOption.aspx`, `SpecialProfitreport.aspx`

### Printing / Documents (11 pages)

`GODEX.aspx`, `GODEXOLD.aspx`, `MasterPrint.aspx`, `OfficeCoverPrint.aspx`, `printsetting.aspx`, `tscte244.aspx`, `TSCTTP244PRO.aspx`, `TVSLP45Lite.aspx`, `TVSLP45Litenew.aspx`, `ZeabraGC420T.aspx`, `zebrazd220.aspx`

### Needs manual classification (38 pages) - proposed homes

Name-based proposals; confirm each in Plan 00.

| Page | Proposed home |
|---|---|
| `agentdetail.aspx` | Plan 04 (agents) |
| `bookingroup.aspx` | Inspect source (booking group) |
| `Calculator.aspx` | Likely obsolete utility - confirm |
| `commandetail.aspx` | Inspect source (common detail) |
| `company detail.aspx` | Plan 02 |
| `companyitemrepo.aspx` | Plan 29 company-wise report |
| `companyrepo.aspx` | Plan 29 company-wise report |
| `CompanyWiseCatagary.aspx` | Plan 29 report (company/category) - confirm |
| `CS.aspx` | Inspect source (purpose unclear) |
| `freeproduct.aspx` | Plan 17 (free-product offer) |
| `FreeQtyEntry.aspx` | Plan 17 (free-quantity offer) |
| `groupPictureEntry.aspx` | Plan 03 (group pictures) |
| `home.aspx` | Obsolete landing page (replaced by dashboard) - confirm |
| `NeedProductApproval.aspx` | Plan 30 (product request approval) |
| `NeedProductEdit.aspx` | Plan 30 (product request) |
| `NeedProductEntry.aspx` | Plan 30 (product request) |
| `newcompanyrepo.aspx` | Plan 29 company-wise report |
| `option select.aspx` | Plan 02 settings - inspect |
| `PrivatePage.aspx` | Inspect source / likely obsolete |
| `ProductNameWithRateEntry.aspx` | Plan 03 / 10 |
| `prosubgrp.aspx` | Plan 03 (sub-group) |
| `PurchNew.aspx` | Plan 05 (purchase entry variant) |
| `PurchNewDetails.aspx` | Plan 05 (purchase entry variant) |
| `purcommentry.aspx` | Plan 05 - inspect |
| `purdesign.aspx` | Plan 03 (design master) |
| `purgroup.aspx` | Plan 03 (group) |
| `purinch.aspx` | Plan 34 / 05 (incharge) - inspect |
| `RightsEntry.aspx` | Plan 01 / 30 (user rights) |
| `Search.aspx` | Shared global search UI - inspect |
| `serverupload.aspx` | Plan 31 or obsolete - inspect |
| `ShareMenu.aspx` | Inspect source (menu/report sharing) |
| `slsoptn.aspx` | Plan 02 sales settings - inspect |
| `SwipeMachineDetails.aspx` | Plan 19 (card terminal) |
| `systemoption.aspx` | Plan 02 settings - inspect |
| `UpdatePanelTest.aspx` | Obsolete test page |
| `warehous.aspx` | Plan 02 (warehouse) |
| `WebForm1.aspx` | Obsolete test page |
| `Welcome.aspx` | Obsolete landing page (replaced by dashboard) - confirm |

# Appendix B - Printer and barcode variants (42)

Removed from the original list: `GiftNewPurchaseDiscountSchemaEntry2`, `...Add2`, `...Update2` (purchase discount schemes). Added: `ZeabraGC420T`.

`BarcodePrint.aspx`, `barcodestickeroptions.aspx`, `CombobarcodeSticker.aspx`, `ComboBarcodewiseCitizen621.aspx`, `ComboBarcodewiseGODEX.aspx`, `ComboBarcodewiseTSC.aspx`, `ComboBarcodewiseTVSLP44BUNeo.aspx`, `ComboBarcodewiseTVSLP45Lite.aspx`, `ComboBarcodewiseTVSLP46.aspx`, `ComboBarcodewiseZEBRATLP2844.aspx`, `CustomerSticker.aspx`, `GODEX.aspx`, `GODEXOLD.aspx`, `MasterPrint.aspx`, `MultiComboCitizen621.aspx`, `MultiComboGODEX.aspx`, `MultiComboTSC.aspx`, `MultiComboTVSLP44BU.aspx`, `MultiComboTVSLP45Lite.aspx`, `MultiComboTVSLP46NEO.aspx`, `MultiComboZEBRATLP2844.aspx`, `NewCounterPrintSetting.aspx`, `PatternSizeSticker.aspx`, `PrintDuplicateBill.aspx`, `PrintDuplicateBillwithBarcode.aspx`, `printsetting.aspx`, `SalesmanSticker.aspx`, `SingleComboBarcodeSticker.aspx`, `SupplierSticker.aspx`, `TSCBarcode.aspx`, `tscte244.aspx`, `TSCTTP244PRO.aspx`, `TVSBarcodeLP44BU.aspx`, `TVSLP45Lite.aspx`, `TVSLP45Litenew.aspx`, `TVSLP46NEOBarcode.aspx`, `TVSLP46NEOBarcodeMobile.aspx`, `TVSLP46ONLYBarcode.aspx`, `ZeabraGC420T.aspx`, `ZEBRATLP2844Barcode.aspx`, `zebrazd220.aspx`, `ZEBRAZD230TBarcode.aspx`

The barcode generator pages (`barcode`, `WRBarcode`, `Giftbarcode`, `GarmentBarcode`, `InvoiceBarcode`, `ApplianceCategoryBarcode`, `CustomWiseBarcode`) are not in this list; check each for embedded print code in Plans 09B / 11. The legacy `PrintBarCode.exe` contract must be recovered or replaced behind the adapter boundary.

# Appendix C - Corrections made to the original plan

| # | Problem in the original | Correction |
|---|---|---|
| 1 | Every checklist was malformed (`- ] item`, then `[ ] item` with no bullet), so none rendered as checkboxes. | All checklists rewritten as `- [ ]` items. |
| 2 | Completion matrix was broken: blank line after the header, a literal `\n` at the end of every row, Plans 00 and 01 missing, and every row said "Source-mapped / ERP feature / Build/extend". | Matrix rebuilt with phase, priority, dependencies, status and work type for all plans. |
| 3 | Plan 02 and the target list include **tenants**, but the SQL-only decision is single shop (Tenant model dropped). | Tenant removed from Plan 02; `tenants` area to be retired. |
| 4 | Restore carryover was in Plan 31 / P3 / Phase 10, but `RESTORE ... WITH REPLACE` wipes `erp` as soon as the first `erp` table exists. | Moved to Plan 01 (P0). |
| 5 | Every plan's definition of done requires reports, printers, permissions and audit, yet those frameworks arrived in Plans 29, 11 and 30 (late). | Report, print, RBAC and audit frameworks moved to Plan 01. |
| 6 | Plan 05 creates barcodes but barcode logic was Plan 09 (later). | Split Plan 09: **09A** identity and allocation before purchase; **09B** lifecycle later. |
| 7 | GST engine (Plan 18) came after the purchase and sales plans that must use it, while the plan says "do not duplicate tax formulas". | Split Plan 18: **18A** engine early (Phase 2); **18B** statutory reports (Phase 7). About 54 of the 63 "GST" pages are sales/purchase entry variants and become modes of Plans 05 and 14. |
| 8 | Plans 08 and 12 build a "stock ledger", which would be a second source of truth next to `dbo.stockdetails` while the legacy app keeps writing. | Stock stays a service over `dbo`; `erp` holds only audit and adjustment documents. |
| 9 | Commission appeared in both Plan 17 and Plan 28; the appendix filed only 2 commission pages while ~14 more sat in five other categories. | Plan 17 = discounts and promotions; Plan 28 owns all commission pages. |
| 10 | Wholesale listed as a target in Plans 05 and 14 and again as Plan 23. | Wholesale is a mode of 05 / 14; Plan 23 narrowed to WSR rates and reports. |
| 11 | No plan owned employees / salesman / cashier masters (8 pages) although the ERP has `employees` and `payroll`; sales orders / delivery (4 pages) and card swipe machines were also unowned. | New Plan 34 (staff masters); sales orders added to Plan 14; card terminals added to Plan 19. |
| 12 | Printer appendix: three `GiftNewPurchaseDiscountSchema*` pages are purchase discount schemes, not printers; `ZeabraGC420T.aspx` (misspelled in the source) was missed. The printer list also omitted Zebra GC420T. | Printer variants corrected from 44 to 42; GC420T added. |
| 13 | Other misfiled pages: `MissingStockReport` under GST, `PurchaseReturnBillView` under sales returns, `PatternAndSizeWiseSalesReportQty` under product masters, three stock reports under suppliers, `ExpansesBillview` under sales. | Moved to the right categories (Appendix A). |
| 14 | Plan 00 exit says "no unknown business capability", but 52 pages were unclassified. | 38 remain after moves; each has a proposed home to confirm (Appendix A). |
| 15 | Rule "`dbo` is never altered" contradicts the plans that write POS bills, GRNs and masters into `dbo`. | Reworded: no DDL on `dbo`; DML only on the reviewed `WRITE_TABLES` allow-list. |
| 16 | The plan ignored work already done: org, products, GRN, PO, purchase return, POS and sales return already have SQL adapters. Every plan said "Build/extend". | Status column added for every plan. |
| 17 | Section 14 (phases) and section 15 (order) disagreed with the plan priorities (commission in Phase 6 and in item 8; GST after sales; security P3). | Single delivery order by phase with an exit gate each. |
| 18 | No rule for document numbers or for the legacy app writing the same tables at the same time. | Added concurrency and number-allocation rules and a parallel-run reconciliation step. |
| 19 | `finance` and `financial` both appear as ERP feature areas with no decision. | Flagged in section 3 and Plan 19: choose one canonical area. |

# Appendix D - Report and printer checklists

### Report family checklist

- [ ] identify source table/query
- [ ] identify filters
- [ ] identify grouping
- [ ] identify calculated fields
- [ ] identify totals/subtotals
- [ ] identify date semantics
- [ ] identify tax semantics
- [ ] identify permissions
- [ ] create SQL report query/repository
- [ ] add report definition to registry
- [ ] add React report page/view
- [ ] add export (same query and permission model as on-screen)
- [ ] add print/PDF output
- [ ] reconcile sample output against legacy

### Printer checklist

- [ ] printer capability registry
- [ ] printer profile
- [ ] label size
- [ ] DPI
- [ ] media type
- [ ] template version
- [ ] raw PRN adapter where required
- [ ] Windows print agent where required
- [ ] queue
- [ ] retry
- [ ] duplicate-job protection
- [ ] reprint
- [ ] print history
- [ ] per-counter assignment
- [ ] test page
