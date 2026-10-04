# Ultimate TextileSoft → React + Node.js ERP Implementation Blueprint

## 1. Purpose

This is the **master implementation plan**, not a feature list.

The objective is to move the complete `TEXTILESOFT 17.07.2025` ASP.NET WebForms ERP into the latest React + Node.js ERP application without losing business functionality, business rules, transaction sequencing, reports, barcode behavior, printer behavior, permissions, audit behavior, or operational recovery flows.

The legacy application is treated as the **business-rule reference**. The latest ERP application is the **implementation target**.

The target is not a screen-by-screen clone.

```text
LEGACY WEBFORMS
ASPX + code-behind + JS + SQL + Crystal + printer-specific pages
                         ↓
                 BUSINESS CAPABILITY
                         ↓
              DOMAIN / APPLICATION LOGIC
                         ↓
              React + Node.js implementation
                         ↓
                 SQL repositories
                  ┌──────┴──────┐
                  ↓             ↓
               dbo.*         erp.*
            existing data   ERP-owned data
```

## 2. Non-negotiable migration rules

1. **`dbo` is never altered.**
2. **`erp.*` is created only by versioned migrations.**
3. **Separate SQL READ, WRITE and ADMIN identities.**
4. Every Mongo model must be mapped to an existing `dbo` table, a new `erp` table, or explicitly dropped.
5. Reports belong to the business module that owns their data.
6. Printer variants belong to the business module that produces the document/label.
7. Mongo idioms are translated into relational application logic, not exposed to React.
8. The API can preserve `_id` as a string during migration to avoid unnecessary frontend contract breakage.
9. `RESTORE ... WITH REPLACE` destroys `erp.*`; ERP carryover must be implemented and tested before real ERP-owned production data is subject to restore.
10. A module is complete only when **logic + API + SQL + UI + reports + printing + permissions + audit + tests + migration + rollback** are complete.

---

# 3. What “complete migration” means

A legacy function is not considered migrated merely because a React page exists.

For every legacy capability:

```text
Legacy screen
   ↓
Legacy event / code-behind
   ↓
SQL query / stored procedure
   ↓
Business calculation
   ↓
Data mutation
   ↓
Stock / tax / finance side effect
   ↓
Report / print / audit side effect
```

must become:

```text
React interaction
   ↓
Node API
   ↓
Service / domain rule
   ↓
Repository
   ↓
SQL transaction
   ├── primary data
   ├── stock
   ├── tax
   ├── finance
   ├── commission
   └── audit
   ↓
response
   ↓
React state/update
   ↓
report / print / export
```

---

# 4. Four levels of tracing

Every implementation plan must trace four levels.

## Level A - Functional

What does the user do?

Examples:

- create purchase
- scan barcode
- sell item
- return item
- transfer stock
- change rate
- print label
- close cash

## Level B - Logical

What decisions happen?

Examples:

- price selection
- discount precedence
- GST calculation
- commission calculation
- stock availability
- return eligibility
- transfer status
- payment allocation

## Level C - Data

What records change?

Examples:

- purchase header
- purchase detail
- barcode
- stock ledger
- sales bill
- sales detail
- customer ledger
- cash ledger
- tax snapshot
- audit record

## Level D - Operational

What happens outside the transaction?

Examples:

- report
- printer
- export
- notification
- reprint
- backup
- restore
- reconciliation

All four levels must be signed off.

---

# 5. Standard implementation pattern

Every module follows this pattern.

```text
STEP 1
Legacy discovery
    ↓
STEP 2
Business-rule extraction
    ↓
STEP 3
Data mapping
    ↓
STEP 4
SQL target design
    ↓
STEP 5
Node repository
    ↓
STEP 6
Node service/domain logic
    ↓
STEP 7
API
    ↓
STEP 8
React UI
    ↓
STEP 9
Reports
    ↓
STEP 10
Printing/export
    ↓
STEP 11
Permissions/audit
    ↓
STEP 12
Migration
    ↓
STEP 13
Parity tests
    ↓
STEP 14
Cutover
```

---

# 6. Standard Node.js architecture

```text
backend/src/
  modules/
    <module>/
      controller/
      service/
      repository/
      domain/
      dto/
      validators/
      routes/
      tests/
```

### Controller

Owns:

- HTTP
- authentication context
- validation boundary
- response contract

### Service

Owns:

- business rules
- transaction orchestration
- cross-module coordination

### Repository

Owns:

- SQL
- mapping
- query composition
- pagination
- locking

### Domain

Owns:

- calculations
- eligibility
- state transitions
- deterministic rules

---

# 7. Standard React architecture

```text
frontend/src/features/<module>/
  pages/
  components/
  hooks/
  api/
  types/
  validation/
  state/
```

React must not contain core business calculations that must also run server-side.

UI calculations can be previews only.

The Node service remains authoritative.

---

# 8. Standard SQL architecture

```text
dbo.*
  ↓
legacy integration boundary

erp.*
  ↓
ERP-owned schema
```

New ERP tables must use versioned migrations.

Recommended common columns:

```text
id
created_at
created_by
updated_at
updated_by
is_active
```

Transaction tables additionally require:

```text
business_date
document_no
status
```

where appropriate.

---

# 9. Standard transaction pattern

```text
BEGIN TRANSACTION
    ↓
validate business state
    ↓
lock required records
    ↓
write header
    ↓
write details
    ↓
write stock
    ↓
write tax
    ↓
write financial ledger
    ↓
write commission
    ↓
write audit
    ↓
COMMIT
```

Failure:

```text
ROLLBACK
```

No partial business transaction.

---

# 10. Module implementation plans


## PLAN 01 — Login, User & Security

### Legacy scope

LoginOpen, user/login pages, role/access controls

### Business logic flow

```text
Authenticate → load company/branch/counter/business date → resolve permissions → create session/token → audit login → route to permitted module
```

### React implementation

React auth pages + route guards

Required UI structure:

```text
List / Search
    ↓
Create / Edit
    ↓
Validation
    ↓
Detail / Transaction
    ↓
Confirm
    ↓
Result
    ↓
History / Audit
```

### Node.js implementation

React auth pages + route guards; Node auth/session service; SQL user/role/permission repositories; audit events

The implementation must keep business rules in services/domain code and SQL access in repositories.

### Logic that must be preserved

Authentication, authorization, session timeout, password/reset, company context, counter context, permission-based screen/action visibility

### SQL / data implementation

```text
Master data
    ↓
Transaction data
    ↓
Related ledger/stock/tax/finance records
    ↓
Audit
```

Every table destination must be explicitly marked:

```text
dbo.existing_table   → reuse
erp.new_table        → versioned migration
obsolete              → drop
```

No new business table may be silently added to `dbo`.

### Reports

Reports generated by this module remain under this module.

```text
transaction data
    ↓
SQL report repository
    ↓
Node report service
    ↓
React report
    ├── filter
    ├── grouping
    ├── totals
    ├── export
    └── print
```

### Printing

Any legacy printer variants used by this module must use the common print adapter.

```text
module
  ↓
document/label payload
  ↓
template
  ↓
printer adapter
  ↓
queue
  ↓
physical printer
  ↓
print history
```

Do not create a new React page for each Zebra/TSC/TVS/Citizen/GODEX variant.

### Migration flow

```text
legacy records
    ↓
mapping
    ↓
validation
    ↓
staging
    ↓
target SQL
    ↓
reconciliation
    ↓
cutover
```

### Acceptance checklist

[ ] login parity
[ ] role/action permissions
[ ] company context
[ ] counter context
[ ] session timeout
[ ] audit
[ ] reset flows
[ ] unauthorized API tests

- [ ] Legacy screen/function mapping complete
- [ ] Code-behind/business-rule tracing complete
- [ ] SQL query/procedure dependencies identified
- [ ] dbo/erp ownership approved
- [ ] Node repository implemented
- [ ] Node service implemented
- [ ] React UI implemented
- [ ] Permission rules implemented
- [ ] Audit implemented
- [ ] Reports implemented
- [ ] Printing implemented where applicable
- [ ] Migration script implemented
- [ ] Unit tests pass
- [ ] SQL integration tests pass
- [ ] E2E tests pass
- [ ] Legacy/new output reconciliation complete
- [ ] Rollback tested
- [ ] Module signed off


## PLAN 02 — Company / Branch / Store

### Legacy scope

companydetail, branchdetail, warehousedetail, countername, AccountDate, floors/racks

### Business logic flow

```text
Company → branch → warehouse/store → floor/rack/counter → business date → transaction context
```

### React implementation

React masters/settings

Required UI structure:

```text
List / Search
    ↓
Create / Edit
    ↓
Validation
    ↓
Detail / Transaction
    ↓
Confirm
    ↓
Result
    ↓
History / Audit
```

### Node.js implementation

React masters/settings; Node organization service; SQL organization repositories; no dbo schema change

The implementation must keep business rules in services/domain code and SQL access in repositories.

### Logic that must be preserved

Preserve business-date and operating-location behavior; establish context used by purchase, stock, sales, transfer and reports

### SQL / data implementation

```text
Master data
    ↓
Transaction data
    ↓
Related ledger/stock/tax/finance records
    ↓
Audit
```

Every table destination must be explicitly marked:

```text
dbo.existing_table   → reuse
erp.new_table        → versioned migration
obsolete              → drop
```

No new business table may be silently added to `dbo`.

### Reports

Reports generated by this module remain under this module.

```text
transaction data
    ↓
SQL report repository
    ↓
Node report service
    ↓
React report
    ├── filter
    ├── grouping
    ├── totals
    ├── export
    └── print
```

### Printing

Any legacy printer variants used by this module must use the common print adapter.

```text
module
  ↓
document/label payload
  ↓
template
  ↓
printer adapter
  ↓
queue
  ↓
physical printer
  ↓
print history
```

Do not create a new React page for each Zebra/TSC/TVS/Citizen/GODEX variant.

### Migration flow

```text
legacy records
    ↓
mapping
    ↓
validation
    ↓
staging
    ↓
target SQL
    ↓
reconciliation
    ↓
cutover
```

### Acceptance checklist

[ ] company
[ ] branch
[ ] warehouse
[ ] counter
[ ] floor/rack
[ ] business date
[ ] permissions
[ ] reports

- [ ] Legacy screen/function mapping complete
- [ ] Code-behind/business-rule tracing complete
- [ ] SQL query/procedure dependencies identified
- [ ] dbo/erp ownership approved
- [ ] Node repository implemented
- [ ] Node service implemented
- [ ] React UI implemented
- [ ] Permission rules implemented
- [ ] Audit implemented
- [ ] Reports implemented
- [ ] Printing implemented where applicable
- [ ] Migration script implemented
- [ ] Unit tests pass
- [ ] SQL integration tests pass
- [ ] E2E tests pass
- [ ] Legacy/new output reconciliation complete
- [ ] Rollback tested
- [ ] Module signed off


## PLAN 03 — Product / Item Master

### Legacy scope

newproduct, product groups/subgroups, units, HSN/product codes

### Business logic flow

```text
Product code generated/validated → master attributes saved → referenced by purchase/barcode/sales/reporting
```

### React implementation

React Product Master

Required UI structure:

```text
List / Search
    ↓
Create / Edit
    ↓
Validation
    ↓
Detail / Transaction
    ↓
Confirm
    ↓
Result
    ↓
History / Audit
```

### Node.js implementation

React Product Master; Node product service; SQL product repository; protect references before delete

The implementation must keep business rules in services/domain code and SQL access in repositories.

### Logic that must be preserved

Product identity is separate from barcode identity; prevent deletion when transaction/barcode dependencies exist

### SQL / data implementation

```text
Master data
    ↓
Transaction data
    ↓
Related ledger/stock/tax/finance records
    ↓
Audit
```

Every table destination must be explicitly marked:

```text
dbo.existing_table   → reuse
erp.new_table        → versioned migration
obsolete              → drop
```

No new business table may be silently added to `dbo`.

### Reports

Reports generated by this module remain under this module.

```text
transaction data
    ↓
SQL report repository
    ↓
Node report service
    ↓
React report
    ├── filter
    ├── grouping
    ├── totals
    ├── export
    └── print
```

### Printing

Any legacy printer variants used by this module must use the common print adapter.

```text
module
  ↓
document/label payload
  ↓
template
  ↓
printer adapter
  ↓
queue
  ↓
physical printer
  ↓
print history
```

Do not create a new React page for each Zebra/TSC/TVS/Citizen/GODEX variant.

### Migration flow

```text
legacy records
    ↓
mapping
    ↓
validation
    ↓
staging
    ↓
target SQL
    ↓
reconciliation
    ↓
cutover
```

### Acceptance checklist

[ ] CRUD
[ ] code generation
[ ] HSN
[ ] unit
[ ] group/subgroup
[ ] duplicate rules
[ ] dependency checks
[ ] audit

- [ ] Legacy screen/function mapping complete
- [ ] Code-behind/business-rule tracing complete
- [ ] SQL query/procedure dependencies identified
- [ ] dbo/erp ownership approved
- [ ] Node repository implemented
- [ ] Node service implemented
- [ ] React UI implemented
- [ ] Permission rules implemented
- [ ] Audit implemented
- [ ] Reports implemented
- [ ] Printing implemented where applicable
- [ ] Migration script implemented
- [ ] Unit tests pass
- [ ] SQL integration tests pass
- [ ] E2E tests pass
- [ ] Legacy/new output reconciliation complete
- [ ] Rollback tested
- [ ] Module signed off


## PLAN 04 — Product Attributes

### Legacy scope

brand, pattern, size, color, style, design, model, fashion, department/floor/rack attributes

### Business logic flow

```text
Attribute master → assigned at barcode/SKU level → used in pricing, stock, POS and reports
```

### React implementation

React attribute masters + selectors

Required UI structure:

```text
List / Search
    ↓
Create / Edit
    ↓
Validation
    ↓
Detail / Transaction
    ↓
Confirm
    ↓
Result
    ↓
History / Audit
```

### Node.js implementation

React attribute masters + selectors; Node attribute service; SQL normalized masters/relations

The implementation must keep business rules in services/domain code and SQL access in repositories.

### Logic that must be preserved

Preserve textile-specific attributes and their historical transaction snapshots

### SQL / data implementation

```text
Master data
    ↓
Transaction data
    ↓
Related ledger/stock/tax/finance records
    ↓
Audit
```

Every table destination must be explicitly marked:

```text
dbo.existing_table   → reuse
erp.new_table        → versioned migration
obsolete              → drop
```

No new business table may be silently added to `dbo`.

### Reports

Reports generated by this module remain under this module.

```text
transaction data
    ↓
SQL report repository
    ↓
Node report service
    ↓
React report
    ├── filter
    ├── grouping
    ├── totals
    ├── export
    └── print
```

### Printing

Any legacy printer variants used by this module must use the common print adapter.

```text
module
  ↓
document/label payload
  ↓
template
  ↓
printer adapter
  ↓
queue
  ↓
physical printer
  ↓
print history
```

Do not create a new React page for each Zebra/TSC/TVS/Citizen/GODEX variant.

### Migration flow

```text
legacy records
    ↓
mapping
    ↓
validation
    ↓
staging
    ↓
target SQL
    ↓
reconciliation
    ↓
cutover
```

### Acceptance checklist

[ ] all attributes
[ ] dependency mapping
[ ] barcode assignment
[ ] history
[ ] filters
[ ] reports

- [ ] Legacy screen/function mapping complete
- [ ] Code-behind/business-rule tracing complete
- [ ] SQL query/procedure dependencies identified
- [ ] dbo/erp ownership approved
- [ ] Node repository implemented
- [ ] Node service implemented
- [ ] React UI implemented
- [ ] Permission rules implemented
- [ ] Audit implemented
- [ ] Reports implemented
- [ ] Printing implemented where applicable
- [ ] Migration script implemented
- [ ] Unit tests pass
- [ ] SQL integration tests pass
- [ ] E2E tests pass
- [ ] Legacy/new output reconciliation complete
- [ ] Rollback tested
- [ ] Module signed off


## PLAN 05 — Purchase

### Legacy scope

all purchase entry variants, supplier/invoice/agent/charges/rates

### Business logic flow

```text
Supplier → purchase header → item/barcode rows → discounts/charges/tax → rate → GRN/stock → supplier payable
```

### React implementation

React purchase workspace

Required UI structure:

```text
List / Search
    ↓
Create / Edit
    ↓
Validation
    ↓
Detail / Transaction
    ↓
Confirm
    ↓
Result
    ↓
History / Audit
```

### Node.js implementation

React purchase workspace; Node purchase service; SQL purchase header/detail + dbo integration; one engine with modes

The implementation must keep business rules in services/domain code and SQL access in repositories.

### Logic that must be preserved

Do not duplicate business logic for each legacy purchase page; configure purchase mode while preserving field/rule differences

### SQL / data implementation

```text
Master data
    ↓
Transaction data
    ↓
Related ledger/stock/tax/finance records
    ↓
Audit
```

Every table destination must be explicitly marked:

```text
dbo.existing_table   → reuse
erp.new_table        → versioned migration
obsolete              → drop
```

No new business table may be silently added to `dbo`.

### Reports

Reports generated by this module remain under this module.

```text
transaction data
    ↓
SQL report repository
    ↓
Node report service
    ↓
React report
    ├── filter
    ├── grouping
    ├── totals
    ├── export
    └── print
```

### Printing

Any legacy printer variants used by this module must use the common print adapter.

```text
module
  ↓
document/label payload
  ↓
template
  ↓
printer adapter
  ↓
queue
  ↓
physical printer
  ↓
print history
```

Do not create a new React page for each Zebra/TSC/TVS/Citizen/GODEX variant.

### Migration flow

```text
legacy records
    ↓
mapping
    ↓
validation
    ↓
staging
    ↓
target SQL
    ↓
reconciliation
    ↓
cutover
```

### Acceptance checklist

[ ] normal purchase
[ ] GST purchase
[ ] specialty modes
[ ] charges
[ ] discount
[ ] tax
[ ] rates
[ ] stock receipt
[ ] payable
[ ] reports

- [ ] Legacy screen/function mapping complete
- [ ] Code-behind/business-rule tracing complete
- [ ] SQL query/procedure dependencies identified
- [ ] dbo/erp ownership approved
- [ ] Node repository implemented
- [ ] Node service implemented
- [ ] React UI implemented
- [ ] Permission rules implemented
- [ ] Audit implemented
- [ ] Reports implemented
- [ ] Printing implemented where applicable
- [ ] Migration script implemented
- [ ] Unit tests pass
- [ ] SQL integration tests pass
- [ ] E2E tests pass
- [ ] Legacy/new output reconciliation complete
- [ ] Rollback tested
- [ ] Module signed off


## PLAN 06 — Purchase Order / GRN

### Legacy scope

PO, GRN entry/update/view, invoice/receipt variants

### Business logic flow

```text
PO → approval → partial/full receipt → GRN → barcode/stock creation → invoice/payable
```

### React implementation

React PO/GRN

Required UI structure:

```text
List / Search
    ↓
Create / Edit
    ↓
Validation
    ↓
Detail / Transaction
    ↓
Confirm
    ↓
Result
    ↓
History / Audit
```

### Node.js implementation

React PO/GRN; Node workflow service; SQL transaction with stock receipt; versioned status transitions

The implementation must keep business rules in services/domain code and SQL access in repositories.

### Logic that must be preserved

Preserve GRN numbering, invoice linkage, partial receipt, barcode creation and purchase update rules

### SQL / data implementation

```text
Master data
    ↓
Transaction data
    ↓
Related ledger/stock/tax/finance records
    ↓
Audit
```

Every table destination must be explicitly marked:

```text
dbo.existing_table   → reuse
erp.new_table        → versioned migration
obsolete              → drop
```

No new business table may be silently added to `dbo`.

### Reports

Reports generated by this module remain under this module.

```text
transaction data
    ↓
SQL report repository
    ↓
Node report service
    ↓
React report
    ├── filter
    ├── grouping
    ├── totals
    ├── export
    └── print
```

### Printing

Any legacy printer variants used by this module must use the common print adapter.

```text
module
  ↓
document/label payload
  ↓
template
  ↓
printer adapter
  ↓
queue
  ↓
physical printer
  ↓
print history
```

Do not create a new React page for each Zebra/TSC/TVS/Citizen/GODEX variant.

### Migration flow

```text
legacy records
    ↓
mapping
    ↓
validation
    ↓
staging
    ↓
target SQL
    ↓
reconciliation
    ↓
cutover
```

### Acceptance checklist

[ ] PO
[ ] approval
[ ] partial receipt
[ ] GRN
[ ] barcode
[ ] invoice
[ ] payable
[ ] cancellation

- [ ] Legacy screen/function mapping complete
- [ ] Code-behind/business-rule tracing complete
- [ ] SQL query/procedure dependencies identified
- [ ] dbo/erp ownership approved
- [ ] Node repository implemented
- [ ] Node service implemented
- [ ] React UI implemented
- [ ] Permission rules implemented
- [ ] Audit implemented
- [ ] Reports implemented
- [ ] Printing implemented where applicable
- [ ] Migration script implemented
- [ ] Unit tests pass
- [ ] SQL integration tests pass
- [ ] E2E tests pass
- [ ] Legacy/new output reconciliation complete
- [ ] Rollback tested
- [ ] Module signed off


## PLAN 07 — Purchase Return

### Legacy scope

purchase return and barcode/GRN return variants

### Business logic flow

```text
Select supplier/GRN/barcode → validate available received stock → return quantity → reverse stock/tax/payable → audit
```

### React implementation

React return workspace

Required UI structure:

```text
List / Search
    ↓
Create / Edit
    ↓
Validation
    ↓
Detail / Transaction
    ↓
Confirm
    ↓
Result
    ↓
History / Audit
```

### Node.js implementation

React return workspace; Node return service; SQL transaction against purchase/stock/ledger

The implementation must keep business rules in services/domain code and SQL access in repositories.

### Logic that must be preserved

Never allow return beyond received-not-returned quantity; preserve original cost/tax context

### SQL / data implementation

```text
Master data
    ↓
Transaction data
    ↓
Related ledger/stock/tax/finance records
    ↓
Audit
```

Every table destination must be explicitly marked:

```text
dbo.existing_table   → reuse
erp.new_table        → versioned migration
obsolete              → drop
```

No new business table may be silently added to `dbo`.

### Reports

Reports generated by this module remain under this module.

```text
transaction data
    ↓
SQL report repository
    ↓
Node report service
    ↓
React report
    ├── filter
    ├── grouping
    ├── totals
    ├── export
    └── print
```

### Printing

Any legacy printer variants used by this module must use the common print adapter.

```text
module
  ↓
document/label payload
  ↓
template
  ↓
printer adapter
  ↓
queue
  ↓
physical printer
  ↓
print history
```

Do not create a new React page for each Zebra/TSC/TVS/Citizen/GODEX variant.

### Migration flow

```text
legacy records
    ↓
mapping
    ↓
validation
    ↓
staging
    ↓
target SQL
    ↓
reconciliation
    ↓
cutover
```

### Acceptance checklist

[ ] barcode return
[ ] GRN return
[ ] tax reversal
[ ] payable reversal
[ ] stock reversal
[ ] reports

- [ ] Legacy screen/function mapping complete
- [ ] Code-behind/business-rule tracing complete
- [ ] SQL query/procedure dependencies identified
- [ ] dbo/erp ownership approved
- [ ] Node repository implemented
- [ ] Node service implemented
- [ ] React UI implemented
- [ ] Permission rules implemented
- [ ] Audit implemented
- [ ] Reports implemented
- [ ] Printing implemented where applicable
- [ ] Migration script implemented
- [ ] Unit tests pass
- [ ] SQL integration tests pass
- [ ] E2E tests pass
- [ ] Legacy/new output reconciliation complete
- [ ] Rollback tested
- [ ] Module signed off


## PLAN 08 — Sales / Billing

### Legacy scope

cash/GST/retail/wholesale/credit/gift/electrical/grocery/invoice sales

### Business logic flow

```text
Scan/select item → resolve price/offer/tax → cart → discount/commission → payment → invoice → stock decrement → cash/ledger → print
```

### React implementation

React POS shell + mode configuration

Required UI structure:

```text
List / Search
    ↓
Create / Edit
    ↓
Validation
    ↓
Detail / Transaction
    ↓
Confirm
    ↓
Result
    ↓
History / Audit
```

### Node.js implementation

React POS shell + mode configuration; Node sales transaction service; SQL sales header/detail + stock/payment transaction

The implementation must keep business rules in services/domain code and SQL access in repositories.

### Logic that must be preserved

One sales engine, configurable document modes. Atomic commit must cover bill, stock, tax, payment and commission

### SQL / data implementation

```text
Master data
    ↓
Transaction data
    ↓
Related ledger/stock/tax/finance records
    ↓
Audit
```

Every table destination must be explicitly marked:

```text
dbo.existing_table   → reuse
erp.new_table        → versioned migration
obsolete              → drop
```

No new business table may be silently added to `dbo`.

### Reports

Reports generated by this module remain under this module.

```text
transaction data
    ↓
SQL report repository
    ↓
Node report service
    ↓
React report
    ├── filter
    ├── grouping
    ├── totals
    ├── export
    └── print
```

### Printing

Any legacy printer variants used by this module must use the common print adapter.

```text
module
  ↓
document/label payload
  ↓
template
  ↓
printer adapter
  ↓
queue
  ↓
physical printer
  ↓
print history
```

Do not create a new React page for each Zebra/TSC/TVS/Citizen/GODEX variant.

### Migration flow

```text
legacy records
    ↓
mapping
    ↓
validation
    ↓
staging
    ↓
target SQL
    ↓
reconciliation
    ↓
cutover
```

### Acceptance checklist

[ ] scan
[ ] pricing
[ ] offers
[ ] tax
[ ] discount
[ ] payment
[ ] stock
[ ] invoice
[ ] hold/recover
[ ] print

- [ ] Legacy screen/function mapping complete
- [ ] Code-behind/business-rule tracing complete
- [ ] SQL query/procedure dependencies identified
- [ ] dbo/erp ownership approved
- [ ] Node repository implemented
- [ ] Node service implemented
- [ ] React UI implemented
- [ ] Permission rules implemented
- [ ] Audit implemented
- [ ] Reports implemented
- [ ] Printing implemented where applicable
- [ ] Migration script implemented
- [ ] Unit tests pass
- [ ] SQL integration tests pass
- [ ] E2E tests pass
- [ ] Legacy/new output reconciliation complete
- [ ] Rollback tested
- [ ] Module signed off


## PLAN 09 — Sales Return

### Legacy scope

return bill, invoice return, exchange, barcode return

### Business logic flow

```text
Original sale → validate returnable qty → return/exchange decision → stock increment or replacement sale → refund/adjustment → tax reversal → audit
```

### React implementation

React return/exchange UI

Required UI structure:

```text
List / Search
    ↓
Create / Edit
    ↓
Validation
    ↓
Detail / Transaction
    ↓
Confirm
    ↓
Result
    ↓
History / Audit
```

### Node.js implementation

React return/exchange UI; Node return service; SQL transaction linking original sale and return

The implementation must keep business rules in services/domain code and SQL access in repositories.

### Logic that must be preserved

Support full/partial returns, exchanges, refund methods and original sale traceability

### SQL / data implementation

```text
Master data
    ↓
Transaction data
    ↓
Related ledger/stock/tax/finance records
    ↓
Audit
```

Every table destination must be explicitly marked:

```text
dbo.existing_table   → reuse
erp.new_table        → versioned migration
obsolete              → drop
```

No new business table may be silently added to `dbo`.

### Reports

Reports generated by this module remain under this module.

```text
transaction data
    ↓
SQL report repository
    ↓
Node report service
    ↓
React report
    ├── filter
    ├── grouping
    ├── totals
    ├── export
    └── print
```

### Printing

Any legacy printer variants used by this module must use the common print adapter.

```text
module
  ↓
document/label payload
  ↓
template
  ↓
printer adapter
  ↓
queue
  ↓
physical printer
  ↓
print history
```

Do not create a new React page for each Zebra/TSC/TVS/Citizen/GODEX variant.

### Migration flow

```text
legacy records
    ↓
mapping
    ↓
validation
    ↓
staging
    ↓
target SQL
    ↓
reconciliation
    ↓
cutover
```

### Acceptance checklist

[ ] full return
[ ] partial
[ ] exchange
[ ] refund
[ ] stock
[ ] tax
[ ] original linkage
[ ] reports

- [ ] Legacy screen/function mapping complete
- [ ] Code-behind/business-rule tracing complete
- [ ] SQL query/procedure dependencies identified
- [ ] dbo/erp ownership approved
- [ ] Node repository implemented
- [ ] Node service implemented
- [ ] React UI implemented
- [ ] Permission rules implemented
- [ ] Audit implemented
- [ ] Reports implemented
- [ ] Printing implemented where applicable
- [ ] Migration script implemented
- [ ] Unit tests pass
- [ ] SQL integration tests pass
- [ ] E2E tests pass
- [ ] Legacy/new output reconciliation complete
- [ ] Rollback tested
- [ ] Module signed off


## PLAN 10 — GST

### Legacy scope

GST masters, HSN, GST sales/purchase/return pages

### Business logic flow

```text
Product/transaction tax category → taxable value → CGST/SGST/IGST rules → document tax snapshot → return/report
```

### React implementation

React GST configuration + transaction components

Required UI structure:

```text
List / Search
    ↓
Create / Edit
    ↓
Validation
    ↓
Detail / Transaction
    ↓
Confirm
    ↓
Result
    ↓
History / Audit
```

### Node.js implementation

React GST configuration + transaction components; Node tax service; SQL tax repository

The implementation must keep business rules in services/domain code and SQL access in repositories.

### Logic that must be preserved

One central tax engine. Transaction must store tax snapshot so later master changes do not rewrite history

### SQL / data implementation

```text
Master data
    ↓
Transaction data
    ↓
Related ledger/stock/tax/finance records
    ↓
Audit
```

Every table destination must be explicitly marked:

```text
dbo.existing_table   → reuse
erp.new_table        → versioned migration
obsolete              → drop
```

No new business table may be silently added to `dbo`.

### Reports

Reports generated by this module remain under this module.

```text
transaction data
    ↓
SQL report repository
    ↓
Node report service
    ↓
React report
    ├── filter
    ├── grouping
    ├── totals
    ├── export
    └── print
```

### Printing

Any legacy printer variants used by this module must use the common print adapter.

```text
module
  ↓
document/label payload
  ↓
template
  ↓
printer adapter
  ↓
queue
  ↓
physical printer
  ↓
print history
```

Do not create a new React page for each Zebra/TSC/TVS/Citizen/GODEX variant.

### Migration flow

```text
legacy records
    ↓
mapping
    ↓
validation
    ↓
staging
    ↓
target SQL
    ↓
reconciliation
    ↓
cutover
```

### Acceptance checklist

[ ] HSN
[ ] tax groups
[ ] CGST/SGST
[ ] IGST
[ ] purchase
[ ] sales
[ ] returns
[ ] rounding
[ ] reports

- [ ] Legacy screen/function mapping complete
- [ ] Code-behind/business-rule tracing complete
- [ ] SQL query/procedure dependencies identified
- [ ] dbo/erp ownership approved
- [ ] Node repository implemented
- [ ] Node service implemented
- [ ] React UI implemented
- [ ] Permission rules implemented
- [ ] Audit implemented
- [ ] Reports implemented
- [ ] Printing implemented where applicable
- [ ] Migration script implemented
- [ ] Unit tests pass
- [ ] SQL integration tests pass
- [ ] E2E tests pass
- [ ] Legacy/new output reconciliation complete
- [ ] Rollback tested
- [ ] Module signed off


## PLAN 11 — Barcode

### Legacy scope

barcode creation/taking/move/update/lookup and barcode history

### Business logic flow

```text
Product + GRN → barcode generated → barcode linked to stock/location/rates → movement → sale/return/transfer history
```

### React implementation

React barcode workspace

Required UI structure:

```text
List / Search
    ↓
Create / Edit
    ↓
Validation
    ↓
Detail / Transaction
    ↓
Confirm
    ↓
Result
    ↓
History / Audit
```

### Node.js implementation

React barcode workspace; Node barcode service; SQL barcode repository and history; preserve legacy barcode semantics

The implementation must keep business rules in services/domain code and SQL access in repositories.

### Logic that must be preserved

Barcode is the operational inventory identity where the legacy system uses it; product master remains separate

### SQL / data implementation

```text
Master data
    ↓
Transaction data
    ↓
Related ledger/stock/tax/finance records
    ↓
Audit
```

Every table destination must be explicitly marked:

```text
dbo.existing_table   → reuse
erp.new_table        → versioned migration
obsolete              → drop
```

No new business table may be silently added to `dbo`.

### Reports

Reports generated by this module remain under this module.

```text
transaction data
    ↓
SQL report repository
    ↓
Node report service
    ↓
React report
    ├── filter
    ├── grouping
    ├── totals
    ├── export
    └── print
```

### Printing

Any legacy printer variants used by this module must use the common print adapter.

```text
module
  ↓
document/label payload
  ↓
template
  ↓
printer adapter
  ↓
queue
  ↓
physical printer
  ↓
print history
```

Do not create a new React page for each Zebra/TSC/TVS/Citizen/GODEX variant.

### Migration flow

```text
legacy records
    ↓
mapping
    ↓
validation
    ↓
staging
    ↓
target SQL
    ↓
reconciliation
    ↓
cutover
```

### Acceptance checklist

[ ] create
[ ] duplicate validation
[ ] lookup
[ ] movement
[ ] location
[ ] history
[ ] sale linkage
[ ] transfer linkage

- [ ] Legacy screen/function mapping complete
- [ ] Code-behind/business-rule tracing complete
- [ ] SQL query/procedure dependencies identified
- [ ] dbo/erp ownership approved
- [ ] Node repository implemented
- [ ] Node service implemented
- [ ] React UI implemented
- [ ] Permission rules implemented
- [ ] Audit implemented
- [ ] Reports implemented
- [ ] Printing implemented where applicable
- [ ] Migration script implemented
- [ ] Unit tests pass
- [ ] SQL integration tests pass
- [ ] E2E tests pass
- [ ] Legacy/new output reconciliation complete
- [ ] Rollback tested
- [ ] Module signed off


## PLAN 12 — Barcode Rate

### Legacy scope

rate/MRP/commission/wholesale/special rate change pages

### Business logic flow

```text
Find barcode → load current rates → capture old values → calculate new rates → save current price → write history → sync required stock snapshot
```

### React implementation

React rate revision UI

Required UI structure:

```text
List / Search
    ↓
Create / Edit
    ↓
Validation
    ↓
Detail / Transaction
    ↓
Confirm
    ↓
Result
    ↓
History / Audit
```

### Node.js implementation

React rate revision UI; Node pricing service; SQL price/history repository

The implementation must keep business rules in services/domain code and SQL access in repositories.

### Logic that must be preserved

Historical transaction price is immutable. Current barcode price may change. Rate-specific legacy variants become rule modes

### SQL / data implementation

```text
Master data
    ↓
Transaction data
    ↓
Related ledger/stock/tax/finance records
    ↓
Audit
```

Every table destination must be explicitly marked:

```text
dbo.existing_table   → reuse
erp.new_table        → versioned migration
obsolete              → drop
```

No new business table may be silently added to `dbo`.

### Reports

Reports generated by this module remain under this module.

```text
transaction data
    ↓
SQL report repository
    ↓
Node report service
    ↓
React report
    ├── filter
    ├── grouping
    ├── totals
    ├── export
    └── print
```

### Printing

Any legacy printer variants used by this module must use the common print adapter.

```text
module
  ↓
document/label payload
  ↓
template
  ↓
printer adapter
  ↓
queue
  ↓
physical printer
  ↓
print history
```

Do not create a new React page for each Zebra/TSC/TVS/Citizen/GODEX variant.

### Migration flow

```text
legacy records
    ↓
mapping
    ↓
validation
    ↓
staging
    ↓
target SQL
    ↓
reconciliation
    ↓
cutover
```

### Acceptance checklist

[ ] MRP
[ ] sale rate
[ ] cost rate
[ ] commission
[ ] discount
[ ] history
[ ] cancel/reverse
[ ] authorization

- [ ] Legacy screen/function mapping complete
- [ ] Code-behind/business-rule tracing complete
- [ ] SQL query/procedure dependencies identified
- [ ] dbo/erp ownership approved
- [ ] Node repository implemented
- [ ] Node service implemented
- [ ] React UI implemented
- [ ] Permission rules implemented
- [ ] Audit implemented
- [ ] Reports implemented
- [ ] Printing implemented where applicable
- [ ] Migration script implemented
- [ ] Unit tests pass
- [ ] SQL integration tests pass
- [ ] E2E tests pass
- [ ] Legacy/new output reconciliation complete
- [ ] Rollback tested
- [ ] Module signed off


## PLAN 13 — Barcode Printing

### Legacy scope

barcode sticker and category/template pages

### Business logic flow

```text
Select products/barcodes → resolve label template/printer → generate label payload/PRN → queue → print → log job
```

### React implementation

React print workspace

Required UI structure:

```text
List / Search
    ↓
Create / Edit
    ↓
Validation
    ↓
Detail / Transaction
    ↓
Confirm
    ↓
Result
    ↓
History / Audit
```

### Node.js implementation

React print workspace; Node label service; printer adapter layer; SQL print history/settings

The implementation must keep business rules in services/domain code and SQL access in repositories.

### Logic that must be preserved

Template-based printer abstraction replaces page-per-printer duplication

### SQL / data implementation

```text
Master data
    ↓
Transaction data
    ↓
Related ledger/stock/tax/finance records
    ↓
Audit
```

Every table destination must be explicitly marked:

```text
dbo.existing_table   → reuse
erp.new_table        → versioned migration
obsolete              → drop
```

No new business table may be silently added to `dbo`.

### Reports

Reports generated by this module remain under this module.

```text
transaction data
    ↓
SQL report repository
    ↓
Node report service
    ↓
React report
    ├── filter
    ├── grouping
    ├── totals
    ├── export
    └── print
```

### Printing

Any legacy printer variants used by this module must use the common print adapter.

```text
module
  ↓
document/label payload
  ↓
template
  ↓
printer adapter
  ↓
queue
  ↓
physical printer
  ↓
print history
```

Do not create a new React page for each Zebra/TSC/TVS/Citizen/GODEX variant.

### Migration flow

```text
legacy records
    ↓
mapping
    ↓
validation
    ↓
staging
    ↓
target SQL
    ↓
reconciliation
    ↓
cutover
```

### Acceptance checklist

[ ] templates
[ ] label sizes
[ ] copies
[ ] preview
[ ] queue
[ ] retry
[ ] reprint
[ ] history

- [ ] Legacy screen/function mapping complete
- [ ] Code-behind/business-rule tracing complete
- [ ] SQL query/procedure dependencies identified
- [ ] dbo/erp ownership approved
- [ ] Node repository implemented
- [ ] Node service implemented
- [ ] React UI implemented
- [ ] Permission rules implemented
- [ ] Audit implemented
- [ ] Reports implemented
- [ ] Printing implemented where applicable
- [ ] Migration script implemented
- [ ] Unit tests pass
- [ ] SQL integration tests pass
- [ ] E2E tests pass
- [ ] Legacy/new output reconciliation complete
- [ ] Rollback tested
- [ ] Module signed off


## PLAN 14 — Printer Integrations

### Legacy scope

Zebra, TSC, TVS, Citizen, GODEX and legacy PrintBarCode/PRN paths

### Business logic flow

```text
Print request → printer profile → adapter/template → spool/agent → physical printer → result
```

### React implementation

Node print service + adapters

Required UI structure:

```text
List / Search
    ↓
Create / Edit
    ↓
Validation
    ↓
Detail / Transaction
    ↓
Confirm
    ↓
Result
    ↓
History / Audit
```

### Node.js implementation

Node print service + adapters; React printer management; Windows/local print agent where required

The implementation must keep business rules in services/domain code and SQL access in repositories.

### Logic that must be preserved

Preserve raw PRN behavior where unavoidable but isolate it behind adapter contract

### SQL / data implementation

```text
Master data
    ↓
Transaction data
    ↓
Related ledger/stock/tax/finance records
    ↓
Audit
```

Every table destination must be explicitly marked:

```text
dbo.existing_table   → reuse
erp.new_table        → versioned migration
obsolete              → drop
```

No new business table may be silently added to `dbo`.

### Reports

Reports generated by this module remain under this module.

```text
transaction data
    ↓
SQL report repository
    ↓
Node report service
    ↓
React report
    ├── filter
    ├── grouping
    ├── totals
    ├── export
    └── print
```

### Printing

Any legacy printer variants used by this module must use the common print adapter.

```text
module
  ↓
document/label payload
  ↓
template
  ↓
printer adapter
  ↓
queue
  ↓
physical printer
  ↓
print history
```

Do not create a new React page for each Zebra/TSC/TVS/Citizen/GODEX variant.

### Migration flow

```text
legacy records
    ↓
mapping
    ↓
validation
    ↓
staging
    ↓
target SQL
    ↓
reconciliation
    ↓
cutover
```

### Acceptance checklist

[ ] Zebra
[ ] TSC
[ ] TVS
[ ] Citizen
[ ] GODEX
[ ] PRN
[ ] agent
[ ] retry
[ ] device mapping

- [ ] Legacy screen/function mapping complete
- [ ] Code-behind/business-rule tracing complete
- [ ] SQL query/procedure dependencies identified
- [ ] dbo/erp ownership approved
- [ ] Node repository implemented
- [ ] Node service implemented
- [ ] React UI implemented
- [ ] Permission rules implemented
- [ ] Audit implemented
- [ ] Reports implemented
- [ ] Printing implemented where applicable
- [ ] Migration script implemented
- [ ] Unit tests pass
- [ ] SQL integration tests pass
- [ ] E2E tests pass
- [ ] Legacy/new output reconciliation complete
- [ ] Rollback tested
- [ ] Module signed off


## PLAN 15 — Combo / Offers

### Legacy scope

ComboOfferEntry/Edit, Single/Multi MRP, SuperCombo, barcodewise combo, combo stock

### Business logic flow

```text
Define combo → components/required quantities → price tiers/offer MRP → match eligible scanned components → allocate combo → sale/stock/tax → return
```

### React implementation

React combo master + POS combo matcher

Required UI structure:

```text
List / Search
    ↓
Create / Edit
    ↓
Validation
    ↓
Detail / Transaction
    ↓
Confirm
    ↓
Result
    ↓
History / Audit
```

### Node.js implementation

React combo master + POS combo matcher; Node combo service; SQL normalized combo tables + allocation ledger

The implementation must keep business rules in services/domain code and SQL access in repositories.

### Logic that must be preserved

Explicitly decide virtual vs physical combo barcode. General matching uses component availability and required set quantities

### SQL / data implementation

```text
Master data
    ↓
Transaction data
    ↓
Related ledger/stock/tax/finance records
    ↓
Audit
```

Every table destination must be explicitly marked:

```text
dbo.existing_table   → reuse
erp.new_table        → versioned migration
obsolete              → drop
```

No new business table may be silently added to `dbo`.

### Reports

Reports generated by this module remain under this module.

```text
transaction data
    ↓
SQL report repository
    ↓
Node report service
    ↓
React report
    ├── filter
    ├── grouping
    ├── totals
    ├── export
    └── print
```

### Printing

Any legacy printer variants used by this module must use the common print adapter.

```text
module
  ↓
document/label payload
  ↓
template
  ↓
printer adapter
  ↓
queue
  ↓
physical printer
  ↓
print history
```

Do not create a new React page for each Zebra/TSC/TVS/Citizen/GODEX variant.

### Migration flow

```text
legacy records
    ↓
mapping
    ↓
validation
    ↓
staging
    ↓
target SQL
    ↓
reconciliation
    ↓
cutover
```

### Acceptance checklist

[ ] master
[ ] components
[ ] qty rules
[ ] price tiers
[ ] matching
[ ] allocation
[ ] stock
[ ] return
[ ] reports

- [ ] Legacy screen/function mapping complete
- [ ] Code-behind/business-rule tracing complete
- [ ] SQL query/procedure dependencies identified
- [ ] dbo/erp ownership approved
- [ ] Node repository implemented
- [ ] Node service implemented
- [ ] React UI implemented
- [ ] Permission rules implemented
- [ ] Audit implemented
- [ ] Reports implemented
- [ ] Printing implemented where applicable
- [ ] Migration script implemented
- [ ] Unit tests pass
- [ ] SQL integration tests pass
- [ ] E2E tests pass
- [ ] Legacy/new output reconciliation complete
- [ ] Rollback tested
- [ ] Module signed off


## PLAN 16 — Inventory / Stock

### Legacy scope

current stock, stock details, group/brand/city/floor/rack/model reports, missing/damage

### Business logic flow

```text
Purchase receipt + sales + returns + transfers + adjustments → stock ledger → current balance/snapshot → reports
```

### React implementation

React inventory dashboards

Required UI structure:

```text
List / Search
    ↓
Create / Edit
    ↓
Validation
    ↓
Detail / Transaction
    ↓
Confirm
    ↓
Result
    ↓
History / Audit
```

### Node.js implementation

React inventory dashboards; Node inventory/ledger service; SQL stock ledger + existing dbo integration

The implementation must keep business rules in services/domain code and SQL access in repositories.

### Logic that must be preserved

Inventory must be explainable from transactions. Avoid treating a mutable snapshot as the sole source of truth

### SQL / data implementation

```text
Master data
    ↓
Transaction data
    ↓
Related ledger/stock/tax/finance records
    ↓
Audit
```

Every table destination must be explicitly marked:

```text
dbo.existing_table   → reuse
erp.new_table        → versioned migration
obsolete              → drop
```

No new business table may be silently added to `dbo`.

### Reports

Reports generated by this module remain under this module.

```text
transaction data
    ↓
SQL report repository
    ↓
Node report service
    ↓
React report
    ├── filter
    ├── grouping
    ├── totals
    ├── export
    └── print
```

### Printing

Any legacy printer variants used by this module must use the common print adapter.

```text
module
  ↓
document/label payload
  ↓
template
  ↓
printer adapter
  ↓
queue
  ↓
physical printer
  ↓
print history
```

Do not create a new React page for each Zebra/TSC/TVS/Citizen/GODEX variant.

### Migration flow

```text
legacy records
    ↓
mapping
    ↓
validation
    ↓
staging
    ↓
target SQL
    ↓
reconciliation
    ↓
cutover
```

### Acceptance checklist

[ ] opening
[ ] receipt
[ ] sale
[ ] return
[ ] transfer
[ ] adjustment
[ ] missing
[ ] damage
[ ] reconciliation
[ ] valuation

- [ ] Legacy screen/function mapping complete
- [ ] Code-behind/business-rule tracing complete
- [ ] SQL query/procedure dependencies identified
- [ ] dbo/erp ownership approved
- [ ] Node repository implemented
- [ ] Node service implemented
- [ ] React UI implemented
- [ ] Permission rules implemented
- [ ] Audit implemented
- [ ] Reports implemented
- [ ] Printing implemented where applicable
- [ ] Migration script implemented
- [ ] Unit tests pass
- [ ] SQL integration tests pass
- [ ] E2E tests pass
- [ ] Legacy/new output reconciliation complete
- [ ] Rollback tested
- [ ] Module signed off


## PLAN 17 — Material / Store Transfer

### Legacy scope

MaterialTransfer, StoreTransfer, Barcodewise/GRNwise transfer, received flows

### Business logic flow

```text
Source store → transfer request → issue → in-transit → destination receive → source/destination stock ledger → status/audit
```

### React implementation

React transfer workspace

Required UI structure:

```text
List / Search
    ↓
Create / Edit
    ↓
Validation
    ↓
Detail / Transaction
    ↓
Confirm
    ↓
Result
    ↓
History / Audit
```

### Node.js implementation

React transfer workspace; Node transfer service; SQL transfer header/detail/status + stock transaction

The implementation must keep business rules in services/domain code and SQL access in repositories.

### Logic that must be preserved

Do not assume every legacy path has one universal stock update. Validate exact production behavior before final cutover

### SQL / data implementation

```text
Master data
    ↓
Transaction data
    ↓
Related ledger/stock/tax/finance records
    ↓
Audit
```

Every table destination must be explicitly marked:

```text
dbo.existing_table   → reuse
erp.new_table        → versioned migration
obsolete              → drop
```

No new business table may be silently added to `dbo`.

### Reports

Reports generated by this module remain under this module.

```text
transaction data
    ↓
SQL report repository
    ↓
Node report service
    ↓
React report
    ├── filter
    ├── grouping
    ├── totals
    ├── export
    └── print
```

### Printing

Any legacy printer variants used by this module must use the common print adapter.

```text
module
  ↓
document/label payload
  ↓
template
  ↓
printer adapter
  ↓
queue
  ↓
physical printer
  ↓
print history
```

Do not create a new React page for each Zebra/TSC/TVS/Citizen/GODEX variant.

### Migration flow

```text
legacy records
    ↓
mapping
    ↓
validation
    ↓
staging
    ↓
target SQL
    ↓
reconciliation
    ↓
cutover
```

### Acceptance checklist

[ ] create
[ ] barcode
[ ] GRN
[ ] issue
[ ] receive
[ ] cancel
[ ] stock
[ ] reconciliation

- [ ] Legacy screen/function mapping complete
- [ ] Code-behind/business-rule tracing complete
- [ ] SQL query/procedure dependencies identified
- [ ] dbo/erp ownership approved
- [ ] Node repository implemented
- [ ] Node service implemented
- [ ] React UI implemented
- [ ] Permission rules implemented
- [ ] Audit implemented
- [ ] Reports implemented
- [ ] Printing implemented where applicable
- [ ] Migration script implemented
- [ ] Unit tests pass
- [ ] SQL integration tests pass
- [ ] E2E tests pass
- [ ] Legacy/new output reconciliation complete
- [ ] Rollback tested
- [ ] Module signed off


## PLAN 18 — Customer

### Legacy scope

customer master, credit/customer ledger and customer views

### Business logic flow

```text
Customer master → sales/credit transactions → payment allocations → outstanding → statement
```

### React implementation

React customer workspace

Required UI structure:

```text
List / Search
    ↓
Create / Edit
    ↓
Validation
    ↓
Detail / Transaction
    ↓
Confirm
    ↓
Result
    ↓
History / Audit
```

### Node.js implementation

React customer workspace; Node customer/ledger service; SQL customer + account relations

The implementation must keep business rules in services/domain code and SQL access in repositories.

### Logic that must be preserved

Separate profile data from financial ledger and transaction snapshots

### SQL / data implementation

```text
Master data
    ↓
Transaction data
    ↓
Related ledger/stock/tax/finance records
    ↓
Audit
```

Every table destination must be explicitly marked:

```text
dbo.existing_table   → reuse
erp.new_table        → versioned migration
obsolete              → drop
```

No new business table may be silently added to `dbo`.

### Reports

Reports generated by this module remain under this module.

```text
transaction data
    ↓
SQL report repository
    ↓
Node report service
    ↓
React report
    ├── filter
    ├── grouping
    ├── totals
    ├── export
    └── print
```

### Printing

Any legacy printer variants used by this module must use the common print adapter.

```text
module
  ↓
document/label payload
  ↓
template
  ↓
printer adapter
  ↓
queue
  ↓
physical printer
  ↓
print history
```

Do not create a new React page for each Zebra/TSC/TVS/Citizen/GODEX variant.

### Migration flow

```text
legacy records
    ↓
mapping
    ↓
validation
    ↓
staging
    ↓
target SQL
    ↓
reconciliation
    ↓
cutover
```

### Acceptance checklist

[ ] master
[ ] duplicate
[ ] credit
[ ] payment
[ ] outstanding
[ ] statement
[ ] history

- [ ] Legacy screen/function mapping complete
- [ ] Code-behind/business-rule tracing complete
- [ ] SQL query/procedure dependencies identified
- [ ] dbo/erp ownership approved
- [ ] Node repository implemented
- [ ] Node service implemented
- [ ] React UI implemented
- [ ] Permission rules implemented
- [ ] Audit implemented
- [ ] Reports implemented
- [ ] Printing implemented where applicable
- [ ] Migration script implemented
- [ ] Unit tests pass
- [ ] SQL integration tests pass
- [ ] E2E tests pass
- [ ] Legacy/new output reconciliation complete
- [ ] Rollback tested
- [ ] Module signed off


## PLAN 19 — Customer Loyalty / Points

### Legacy scope

points, festival, response, relationship/loyalty screens

### Business logic flow

```text
Eligible sale → calculate points → post points ledger → redeem/adjust → customer balance → audit
```

### React implementation

React loyalty workspace

Required UI structure:

```text
List / Search
    ↓
Create / Edit
    ↓
Validation
    ↓
Detail / Transaction
    ↓
Confirm
    ↓
Result
    ↓
History / Audit
```

### Node.js implementation

React loyalty workspace; Node loyalty ledger; SQL points transactions and balance

The implementation must keep business rules in services/domain code and SQL access in repositories.

### Logic that must be preserved

Points must be ledger-based, not only mutable balance

### SQL / data implementation

```text
Master data
    ↓
Transaction data
    ↓
Related ledger/stock/tax/finance records
    ↓
Audit
```

Every table destination must be explicitly marked:

```text
dbo.existing_table   → reuse
erp.new_table        → versioned migration
obsolete              → drop
```

No new business table may be silently added to `dbo`.

### Reports

Reports generated by this module remain under this module.

```text
transaction data
    ↓
SQL report repository
    ↓
Node report service
    ↓
React report
    ├── filter
    ├── grouping
    ├── totals
    ├── export
    └── print
```

### Printing

Any legacy printer variants used by this module must use the common print adapter.

```text
module
  ↓
document/label payload
  ↓
template
  ↓
printer adapter
  ↓
queue
  ↓
physical printer
  ↓
print history
```

Do not create a new React page for each Zebra/TSC/TVS/Citizen/GODEX variant.

### Migration flow

```text
legacy records
    ↓
mapping
    ↓
validation
    ↓
staging
    ↓
target SQL
    ↓
reconciliation
    ↓
cutover
```

### Acceptance checklist

[ ] earn
[ ] redeem
[ ] expiry if applicable
[ ] adjustment
[ ] history
[ ] reports

- [ ] Legacy screen/function mapping complete
- [ ] Code-behind/business-rule tracing complete
- [ ] SQL query/procedure dependencies identified
- [ ] dbo/erp ownership approved
- [ ] Node repository implemented
- [ ] Node service implemented
- [ ] React UI implemented
- [ ] Permission rules implemented
- [ ] Audit implemented
- [ ] Reports implemented
- [ ] Printing implemented where applicable
- [ ] Migration script implemented
- [ ] Unit tests pass
- [ ] SQL integration tests pass
- [ ] E2E tests pass
- [ ] Legacy/new output reconciliation complete
- [ ] Rollback tested
- [ ] Module signed off


## PLAN 20 — Supplier / Vendor

### Legacy scope

supplier master, supplier balance, vendor views

### Business logic flow

```text
Supplier → purchases/returns/payments → payable ledger → statement
```

### React implementation

React supplier workspace

Required UI structure:

```text
List / Search
    ↓
Create / Edit
    ↓
Validation
    ↓
Detail / Transaction
    ↓
Confirm
    ↓
Result
    ↓
History / Audit
```

### Node.js implementation

React supplier workspace; Node supplier service; SQL supplier and payable relations

The implementation must keep business rules in services/domain code and SQL access in repositories.

### Logic that must be preserved

Preserve supplier codes, groups, tax details, contacts and financial linkage

### SQL / data implementation

```text
Master data
    ↓
Transaction data
    ↓
Related ledger/stock/tax/finance records
    ↓
Audit
```

Every table destination must be explicitly marked:

```text
dbo.existing_table   → reuse
erp.new_table        → versioned migration
obsolete              → drop
```

No new business table may be silently added to `dbo`.

### Reports

Reports generated by this module remain under this module.

```text
transaction data
    ↓
SQL report repository
    ↓
Node report service
    ↓
React report
    ├── filter
    ├── grouping
    ├── totals
    ├── export
    └── print
```

### Printing

Any legacy printer variants used by this module must use the common print adapter.

```text
module
  ↓
document/label payload
  ↓
template
  ↓
printer adapter
  ↓
queue
  ↓
physical printer
  ↓
print history
```

Do not create a new React page for each Zebra/TSC/TVS/Citizen/GODEX variant.

### Migration flow

```text
legacy records
    ↓
mapping
    ↓
validation
    ↓
staging
    ↓
target SQL
    ↓
reconciliation
    ↓
cutover
```

### Acceptance checklist

[ ] master
[ ] purchase linkage
[ ] returns
[ ] payments
[ ] balance
[ ] statement

- [ ] Legacy screen/function mapping complete
- [ ] Code-behind/business-rule tracing complete
- [ ] SQL query/procedure dependencies identified
- [ ] dbo/erp ownership approved
- [ ] Node repository implemented
- [ ] Node service implemented
- [ ] React UI implemented
- [ ] Permission rules implemented
- [ ] Audit implemented
- [ ] Reports implemented
- [ ] Printing implemented where applicable
- [ ] Migration script implemented
- [ ] Unit tests pass
- [ ] SQL integration tests pass
- [ ] E2E tests pass
- [ ] Legacy/new output reconciliation complete
- [ ] Rollback tested
- [ ] Module signed off


## PLAN 21 — Accounts / Finance

### Legacy scope

accounts, journals, daybook, loans, EMI, finance reports

### Business logic flow

```text
Business transaction → accounting event → journal/ledger → reconciliation → financial report
```

### React implementation

React finance workspace

Required UI structure:

```text
List / Search
    ↓
Create / Edit
    ↓
Validation
    ↓
Detail / Transaction
    ↓
Confirm
    ↓
Result
    ↓
History / Audit
```

### Node.js implementation

React finance workspace; Node accounting service; SQL finance tables + dbo integration where authoritative

The implementation must keep business rules in services/domain code and SQL access in repositories.

### Logic that must be preserved

Accounting entries must be atomic with source transactions where the legacy logic requires it

### SQL / data implementation

```text
Master data
    ↓
Transaction data
    ↓
Related ledger/stock/tax/finance records
    ↓
Audit
```

Every table destination must be explicitly marked:

```text
dbo.existing_table   → reuse
erp.new_table        → versioned migration
obsolete              → drop
```

No new business table may be silently added to `dbo`.

### Reports

Reports generated by this module remain under this module.

```text
transaction data
    ↓
SQL report repository
    ↓
Node report service
    ↓
React report
    ├── filter
    ├── grouping
    ├── totals
    ├── export
    └── print
```

### Printing

Any legacy printer variants used by this module must use the common print adapter.

```text
module
  ↓
document/label payload
  ↓
template
  ↓
printer adapter
  ↓
queue
  ↓
physical printer
  ↓
print history
```

Do not create a new React page for each Zebra/TSC/TVS/Citizen/GODEX variant.

### Migration flow

```text
legacy records
    ↓
mapping
    ↓
validation
    ↓
staging
    ↓
target SQL
    ↓
reconciliation
    ↓
cutover
```

### Acceptance checklist

[ ] chart/account
[ ] journal
[ ] daybook
[ ] loan
[ ] EMI
[ ] reconciliation
[ ] reports

- [ ] Legacy screen/function mapping complete
- [ ] Code-behind/business-rule tracing complete
- [ ] SQL query/procedure dependencies identified
- [ ] dbo/erp ownership approved
- [ ] Node repository implemented
- [ ] Node service implemented
- [ ] React UI implemented
- [ ] Permission rules implemented
- [ ] Audit implemented
- [ ] Reports implemented
- [ ] Printing implemented where applicable
- [ ] Migration script implemented
- [ ] Unit tests pass
- [ ] SQL integration tests pass
- [ ] E2E tests pass
- [ ] Legacy/new output reconciliation complete
- [ ] Rollback tested
- [ ] Module signed off


## PLAN 22 — Cash Management

### Legacy scope

cash in/out, cashier/day close, deposits, bank/cheque

### Business logic flow

```text
Counter/cashier opening → cash transactions → sales/returns/expenses → closing → variance → bank deposit
```

### React implementation

React cash workspace

Required UI structure:

```text
List / Search
    ↓
Create / Edit
    ↓
Validation
    ↓
Detail / Transaction
    ↓
Confirm
    ↓
Result
    ↓
History / Audit
```

### Node.js implementation

React cash workspace; Node cash session service; SQL cash ledger/session tables

The implementation must keep business rules in services/domain code and SQL access in repositories.

### Logic that must be preserved

Cashier session and business date must be part of transaction context

### SQL / data implementation

```text
Master data
    ↓
Transaction data
    ↓
Related ledger/stock/tax/finance records
    ↓
Audit
```

Every table destination must be explicitly marked:

```text
dbo.existing_table   → reuse
erp.new_table        → versioned migration
obsolete              → drop
```

No new business table may be silently added to `dbo`.

### Reports

Reports generated by this module remain under this module.

```text
transaction data
    ↓
SQL report repository
    ↓
Node report service
    ↓
React report
    ├── filter
    ├── grouping
    ├── totals
    ├── export
    └── print
```

### Printing

Any legacy printer variants used by this module must use the common print adapter.

```text
module
  ↓
document/label payload
  ↓
template
  ↓
printer adapter
  ↓
queue
  ↓
physical printer
  ↓
print history
```

Do not create a new React page for each Zebra/TSC/TVS/Citizen/GODEX variant.

### Migration flow

```text
legacy records
    ↓
mapping
    ↓
validation
    ↓
staging
    ↓
target SQL
    ↓
reconciliation
    ↓
cutover
```

### Acceptance checklist

[ ] opening
[ ] cash in
[ ] cash out
[ ] closing
[ ] variance
[ ] deposit
[ ] cheque
[ ] reports

- [ ] Legacy screen/function mapping complete
- [ ] Code-behind/business-rule tracing complete
- [ ] SQL query/procedure dependencies identified
- [ ] dbo/erp ownership approved
- [ ] Node repository implemented
- [ ] Node service implemented
- [ ] React UI implemented
- [ ] Permission rules implemented
- [ ] Audit implemented
- [ ] Reports implemented
- [ ] Printing implemented where applicable
- [ ] Migration script implemented
- [ ] Unit tests pass
- [ ] SQL integration tests pass
- [ ] E2E tests pass
- [ ] Legacy/new output reconciliation complete
- [ ] Rollback tested
- [ ] Module signed off


## PLAN 23 — Employee / Salesman

### Legacy scope

employee/salesman masters and salesperson reports

### Business logic flow

```text
Employee/salesman → role/commission eligibility → sale attribution → settlement/report
```

### React implementation

React employee workspace

Required UI structure:

```text
List / Search
    ↓
Create / Edit
    ↓
Validation
    ↓
Detail / Transaction
    ↓
Confirm
    ↓
Result
    ↓
History / Audit
```

### Node.js implementation

React employee workspace; Node employee service; SQL employee/sales attribution

The implementation must keep business rules in services/domain code and SQL access in repositories.

### Logic that must be preserved

Preserve salesman assignment rules and historical attribution

### SQL / data implementation

```text
Master data
    ↓
Transaction data
    ↓
Related ledger/stock/tax/finance records
    ↓
Audit
```

Every table destination must be explicitly marked:

```text
dbo.existing_table   → reuse
erp.new_table        → versioned migration
obsolete              → drop
```

No new business table may be silently added to `dbo`.

### Reports

Reports generated by this module remain under this module.

```text
transaction data
    ↓
SQL report repository
    ↓
Node report service
    ↓
React report
    ├── filter
    ├── grouping
    ├── totals
    ├── export
    └── print
```

### Printing

Any legacy printer variants used by this module must use the common print adapter.

```text
module
  ↓
document/label payload
  ↓
template
  ↓
printer adapter
  ↓
queue
  ↓
physical printer
  ↓
print history
```

Do not create a new React page for each Zebra/TSC/TVS/Citizen/GODEX variant.

### Migration flow

```text
legacy records
    ↓
mapping
    ↓
validation
    ↓
staging
    ↓
target SQL
    ↓
reconciliation
    ↓
cutover
```

### Acceptance checklist

[ ] master
[ ] assignment
[ ] sale attribution
[ ] status
[ ] reports

- [ ] Legacy screen/function mapping complete
- [ ] Code-behind/business-rule tracing complete
- [ ] SQL query/procedure dependencies identified
- [ ] dbo/erp ownership approved
- [ ] Node repository implemented
- [ ] Node service implemented
- [ ] React UI implemented
- [ ] Permission rules implemented
- [ ] Audit implemented
- [ ] Reports implemented
- [ ] Printing implemented where applicable
- [ ] Migration script implemented
- [ ] Unit tests pass
- [ ] SQL integration tests pass
- [ ] E2E tests pass
- [ ] Legacy/new output reconciliation complete
- [ ] Rollback tested
- [ ] Module signed off


## PLAN 24 — Commission

### Legacy scope

commission/range/days/PCS/section/salesman calculations

### Business logic flow

```text
Sale line → determine salesperson/agent → resolve commission rule → calculate → post commission → settlement
```

### React implementation

React commission configuration/report

Required UI structure:

```text
List / Search
    ↓
Create / Edit
    ↓
Validation
    ↓
Detail / Transaction
    ↓
Confirm
    ↓
Result
    ↓
History / Audit
```

### Node.js implementation

React commission configuration/report; Node commission engine; SQL commission rules/ledger

The implementation must keep business rules in services/domain code and SQL access in repositories.

### Logic that must be preserved

Commission calculation must be deterministic and preserve historical rule snapshot

### SQL / data implementation

```text
Master data
    ↓
Transaction data
    ↓
Related ledger/stock/tax/finance records
    ↓
Audit
```

Every table destination must be explicitly marked:

```text
dbo.existing_table   → reuse
erp.new_table        → versioned migration
obsolete              → drop
```

No new business table may be silently added to `dbo`.

### Reports

Reports generated by this module remain under this module.

```text
transaction data
    ↓
SQL report repository
    ↓
Node report service
    ↓
React report
    ├── filter
    ├── grouping
    ├── totals
    ├── export
    └── print
```

### Printing

Any legacy printer variants used by this module must use the common print adapter.

```text
module
  ↓
document/label payload
  ↓
template
  ↓
printer adapter
  ↓
queue
  ↓
physical printer
  ↓
print history
```

Do not create a new React page for each Zebra/TSC/TVS/Citizen/GODEX variant.

### Migration flow

```text
legacy records
    ↓
mapping
    ↓
validation
    ↓
staging
    ↓
target SQL
    ↓
reconciliation
    ↓
cutover
```

### Acceptance checklist

[ ] rule modes
[ ] salesperson
[ ] agent
[ ] calculation
[ ] settlement
[ ] reports

- [ ] Legacy screen/function mapping complete
- [ ] Code-behind/business-rule tracing complete
- [ ] SQL query/procedure dependencies identified
- [ ] dbo/erp ownership approved
- [ ] Node repository implemented
- [ ] Node service implemented
- [ ] React UI implemented
- [ ] Permission rules implemented
- [ ] Audit implemented
- [ ] Reports implemented
- [ ] Printing implemented where applicable
- [ ] Migration script implemented
- [ ] Unit tests pass
- [ ] SQL integration tests pass
- [ ] E2E tests pass
- [ ] Legacy/new output reconciliation complete
- [ ] Rollback tested
- [ ] Module signed off


## PLAN 25 — Discount

### Legacy scope

discount offers, invoice price offers, barcode/department discounts

### Business logic flow

```text
Candidate discounts → eligibility → precedence/stacking → final discount → tax base → audit
```

### React implementation

React promotion UI

Required UI structure:

```text
List / Search
    ↓
Create / Edit
    ↓
Validation
    ↓
Detail / Transaction
    ↓
Confirm
    ↓
Result
    ↓
History / Audit
```

### Node.js implementation

React promotion UI; Node pricing/discount engine; SQL rule tables

The implementation must keep business rules in services/domain code and SQL access in repositories.

### Logic that must be preserved

Define exact precedence. Never scatter discount logic across POS screens

### SQL / data implementation

```text
Master data
    ↓
Transaction data
    ↓
Related ledger/stock/tax/finance records
    ↓
Audit
```

Every table destination must be explicitly marked:

```text
dbo.existing_table   → reuse
erp.new_table        → versioned migration
obsolete              → drop
```

No new business table may be silently added to `dbo`.

### Reports

Reports generated by this module remain under this module.

```text
transaction data
    ↓
SQL report repository
    ↓
Node report service
    ↓
React report
    ├── filter
    ├── grouping
    ├── totals
    ├── export
    └── print
```

### Printing

Any legacy printer variants used by this module must use the common print adapter.

```text
module
  ↓
document/label payload
  ↓
template
  ↓
printer adapter
  ↓
queue
  ↓
physical printer
  ↓
print history
```

Do not create a new React page for each Zebra/TSC/TVS/Citizen/GODEX variant.

### Migration flow

```text
legacy records
    ↓
mapping
    ↓
validation
    ↓
staging
    ↓
target SQL
    ↓
reconciliation
    ↓
cutover
```

### Acceptance checklist

[ ] rules
[ ] eligibility
[ ] stacking
[ ] precedence
[ ] approval
[ ] audit
[ ] reports

- [ ] Legacy screen/function mapping complete
- [ ] Code-behind/business-rule tracing complete
- [ ] SQL query/procedure dependencies identified
- [ ] dbo/erp ownership approved
- [ ] Node repository implemented
- [ ] Node service implemented
- [ ] React UI implemented
- [ ] Permission rules implemented
- [ ] Audit implemented
- [ ] Reports implemented
- [ ] Printing implemented where applicable
- [ ] Migration script implemented
- [ ] Unit tests pass
- [ ] SQL integration tests pass
- [ ] E2E tests pass
- [ ] Legacy/new output reconciliation complete
- [ ] Rollback tested
- [ ] Module signed off


## PLAN 26 — Gift

### Legacy scope

gift purchase/sale/barcode/report flows

### Business logic flow

```text
Gift item master/category → purchase → barcode/stock → sale → return → reporting
```

### React implementation

React gift mode using shared product/purchase/sales engines

Required UI structure:

```text
List / Search
    ↓
Create / Edit
    ↓
Validation
    ↓
Detail / Transaction
    ↓
Confirm
    ↓
Result
    ↓
History / Audit
```

### Node.js implementation

React gift mode using shared product/purchase/sales engines; Node mode rules; SQL shared tables + gift attributes

The implementation must keep business rules in services/domain code and SQL access in repositories.

### Logic that must be preserved

Gift is a mode/category, not a second inventory system

### SQL / data implementation

```text
Master data
    ↓
Transaction data
    ↓
Related ledger/stock/tax/finance records
    ↓
Audit
```

Every table destination must be explicitly marked:

```text
dbo.existing_table   → reuse
erp.new_table        → versioned migration
obsolete              → drop
```

No new business table may be silently added to `dbo`.

### Reports

Reports generated by this module remain under this module.

```text
transaction data
    ↓
SQL report repository
    ↓
Node report service
    ↓
React report
    ├── filter
    ├── grouping
    ├── totals
    ├── export
    └── print
```

### Printing

Any legacy printer variants used by this module must use the common print adapter.

```text
module
  ↓
document/label payload
  ↓
template
  ↓
printer adapter
  ↓
queue
  ↓
physical printer
  ↓
print history
```

Do not create a new React page for each Zebra/TSC/TVS/Citizen/GODEX variant.

### Migration flow

```text
legacy records
    ↓
mapping
    ↓
validation
    ↓
staging
    ↓
target SQL
    ↓
reconciliation
    ↓
cutover
```

### Acceptance checklist

[ ] purchase
[ ] barcode
[ ] sale
[ ] return
[ ] stock
[ ] reports

- [ ] Legacy screen/function mapping complete
- [ ] Code-behind/business-rule tracing complete
- [ ] SQL query/procedure dependencies identified
- [ ] dbo/erp ownership approved
- [ ] Node repository implemented
- [ ] Node service implemented
- [ ] React UI implemented
- [ ] Permission rules implemented
- [ ] Audit implemented
- [ ] Reports implemented
- [ ] Printing implemented where applicable
- [ ] Migration script implemented
- [ ] Unit tests pass
- [ ] SQL integration tests pass
- [ ] E2E tests pass
- [ ] Legacy/new output reconciliation complete
- [ ] Rollback tested
- [ ] Module signed off


## PLAN 27 — Grocery / Electrical / Appliance / Special Modules

### Legacy scope

grocery sales, electrical sales, appliance purchase, model-number/garment/fancy variants

### Business logic flow

```text
Special category/mode → common product/barcode/stock/sales engine → mode-specific fields/rules → reports
```

### React implementation

React configurable transaction modes

Required UI structure:

```text
List / Search
    ↓
Create / Edit
    ↓
Validation
    ↓
Detail / Transaction
    ↓
Confirm
    ↓
Result
    ↓
History / Audit
```

### Node.js implementation

React configurable transaction modes; Node shared domain services; SQL specialty attributes

The implementation must keep business rules in services/domain code and SQL access in repositories.

### Logic that must be preserved

No separate stock engine. Add only the attributes and rules required by the specialty mode

### SQL / data implementation

```text
Master data
    ↓
Transaction data
    ↓
Related ledger/stock/tax/finance records
    ↓
Audit
```

Every table destination must be explicitly marked:

```text
dbo.existing_table   → reuse
erp.new_table        → versioned migration
obsolete              → drop
```

No new business table may be silently added to `dbo`.

### Reports

Reports generated by this module remain under this module.

```text
transaction data
    ↓
SQL report repository
    ↓
Node report service
    ↓
React report
    ├── filter
    ├── grouping
    ├── totals
    ├── export
    └── print
```

### Printing

Any legacy printer variants used by this module must use the common print adapter.

```text
module
  ↓
document/label payload
  ↓
template
  ↓
printer adapter
  ↓
queue
  ↓
physical printer
  ↓
print history
```

Do not create a new React page for each Zebra/TSC/TVS/Citizen/GODEX variant.

### Migration flow

```text
legacy records
    ↓
mapping
    ↓
validation
    ↓
staging
    ↓
target SQL
    ↓
reconciliation
    ↓
cutover
```

### Acceptance checklist

[ ] grocery
[ ] electrical
[ ] appliance
[ ] model no
[ ] garment
[ ] fancy
[ ] reports

- [ ] Legacy screen/function mapping complete
- [ ] Code-behind/business-rule tracing complete
- [ ] SQL query/procedure dependencies identified
- [ ] dbo/erp ownership approved
- [ ] Node repository implemented
- [ ] Node service implemented
- [ ] React UI implemented
- [ ] Permission rules implemented
- [ ] Audit implemented
- [ ] Reports implemented
- [ ] Printing implemented where applicable
- [ ] Migration script implemented
- [ ] Unit tests pass
- [ ] SQL integration tests pass
- [ ] E2E tests pass
- [ ] Legacy/new output reconciliation complete
- [ ] Rollback tested
- [ ] Module signed off


## PLAN 28 — Reports

### Legacy scope

all Crystal Reports and report pages

### Business logic flow

```text
Business transaction tables → SQL report query → filters/grouping → React report view → export/print
```

### React implementation

React report registry/views

Required UI structure:

```text
List / Search
    ↓
Create / Edit
    ↓
Validation
    ↓
Detail / Transaction
    ↓
Confirm
    ↓
Result
    ↓
History / Audit
```

### Node.js implementation

React report registry/views; Node report repository/service; SQL queries/views/CTEs

The implementation must keep business rules in services/domain code and SQL access in repositories.

### Logic that must be preserved

Every report is owned by a business module. Crystal reports are source references, not target business logic

### SQL / data implementation

```text
Master data
    ↓
Transaction data
    ↓
Related ledger/stock/tax/finance records
    ↓
Audit
```

Every table destination must be explicitly marked:

```text
dbo.existing_table   → reuse
erp.new_table        → versioned migration
obsolete              → drop
```

No new business table may be silently added to `dbo`.

### Reports

Reports generated by this module remain under this module.

```text
transaction data
    ↓
SQL report repository
    ↓
Node report service
    ↓
React report
    ├── filter
    ├── grouping
    ├── totals
    ├── export
    └── print
```

### Printing

Any legacy printer variants used by this module must use the common print adapter.

```text
module
  ↓
document/label payload
  ↓
template
  ↓
printer adapter
  ↓
queue
  ↓
physical printer
  ↓
print history
```

Do not create a new React page for each Zebra/TSC/TVS/Citizen/GODEX variant.

### Migration flow

```text
legacy records
    ↓
mapping
    ↓
validation
    ↓
staging
    ↓
target SQL
    ↓
reconciliation
    ↓
cutover
```

### Acceptance checklist

[ ] inventory reports
[ ] purchase
[ ] sales
[ ] GST
[ ] finance
[ ] customer
[ ] supplier
[ ] commission
[ ] combo
[ ] exports

- [ ] Legacy screen/function mapping complete
- [ ] Code-behind/business-rule tracing complete
- [ ] SQL query/procedure dependencies identified
- [ ] dbo/erp ownership approved
- [ ] Node repository implemented
- [ ] Node service implemented
- [ ] React UI implemented
- [ ] Permission rules implemented
- [ ] Audit implemented
- [ ] Reports implemented
- [ ] Printing implemented where applicable
- [ ] Migration script implemented
- [ ] Unit tests pass
- [ ] SQL integration tests pass
- [ ] E2E tests pass
- [ ] Legacy/new output reconciliation complete
- [ ] Rollback tested
- [ ] Module signed off


## PLAN 29 — Printing / Billing Engine

### Legacy scope

bill printing, receipt, document layouts and Crystal billing reports

### Business logic flow

```text
Committed transaction → document snapshot → template → printer/PDF → print history
```

### React implementation

React preview/reprint

Required UI structure:

```text
List / Search
    ↓
Create / Edit
    ↓
Validation
    ↓
Detail / Transaction
    ↓
Confirm
    ↓
Result
    ↓
History / Audit
```

### Node.js implementation

React preview/reprint; Node document renderer/print adapter; SQL print history

The implementation must keep business rules in services/domain code and SQL access in repositories.

### Logic that must be preserved

Document content must be reproducible from stored transaction snapshots

### SQL / data implementation

```text
Master data
    ↓
Transaction data
    ↓
Related ledger/stock/tax/finance records
    ↓
Audit
```

Every table destination must be explicitly marked:

```text
dbo.existing_table   → reuse
erp.new_table        → versioned migration
obsolete              → drop
```

No new business table may be silently added to `dbo`.

### Reports

Reports generated by this module remain under this module.

```text
transaction data
    ↓
SQL report repository
    ↓
Node report service
    ↓
React report
    ├── filter
    ├── grouping
    ├── totals
    ├── export
    └── print
```

### Printing

Any legacy printer variants used by this module must use the common print adapter.

```text
module
  ↓
document/label payload
  ↓
template
  ↓
printer adapter
  ↓
queue
  ↓
physical printer
  ↓
print history
```

Do not create a new React page for each Zebra/TSC/TVS/Citizen/GODEX variant.

### Migration flow

```text
legacy records
    ↓
mapping
    ↓
validation
    ↓
staging
    ↓
target SQL
    ↓
reconciliation
    ↓
cutover
```

### Acceptance checklist

[ ] invoice
[ ] receipt
[ ] return
[ ] exchange
[ ] preview
[ ] PDF
[ ] printer
[ ] reprint

- [ ] Legacy screen/function mapping complete
- [ ] Code-behind/business-rule tracing complete
- [ ] SQL query/procedure dependencies identified
- [ ] dbo/erp ownership approved
- [ ] Node repository implemented
- [ ] Node service implemented
- [ ] React UI implemented
- [ ] Permission rules implemented
- [ ] Audit implemented
- [ ] Reports implemented
- [ ] Printing implemented where applicable
- [ ] Migration script implemented
- [ ] Unit tests pass
- [ ] SQL integration tests pass
- [ ] E2E tests pass
- [ ] Legacy/new output reconciliation complete
- [ ] Rollback tested
- [ ] Module signed off


## PLAN 30 — QR Code

### Legacy scope

QR generation/scanning/report or payment/product QR functions

### Business logic flow

```text
Business identifier → QR payload → generate/scan → validate → link to business record
```

### React implementation

React QR component

Required UI structure:

```text
List / Search
    ↓
Create / Edit
    ↓
Validation
    ↓
Detail / Transaction
    ↓
Confirm
    ↓
Result
    ↓
History / Audit
```

### Node.js implementation

React QR component; Node QR service; SQL stores only durable payload/relationship where required

The implementation must keep business rules in services/domain code and SQL access in repositories.

### Logic that must be preserved

Define QR payload contract and version it

### SQL / data implementation

```text
Master data
    ↓
Transaction data
    ↓
Related ledger/stock/tax/finance records
    ↓
Audit
```

Every table destination must be explicitly marked:

```text
dbo.existing_table   → reuse
erp.new_table        → versioned migration
obsolete              → drop
```

No new business table may be silently added to `dbo`.

### Reports

Reports generated by this module remain under this module.

```text
transaction data
    ↓
SQL report repository
    ↓
Node report service
    ↓
React report
    ├── filter
    ├── grouping
    ├── totals
    ├── export
    └── print
```

### Printing

Any legacy printer variants used by this module must use the common print adapter.

```text
module
  ↓
document/label payload
  ↓
template
  ↓
printer adapter
  ↓
queue
  ↓
physical printer
  ↓
print history
```

Do not create a new React page for each Zebra/TSC/TVS/Citizen/GODEX variant.

### Migration flow

```text
legacy records
    ↓
mapping
    ↓
validation
    ↓
staging
    ↓
target SQL
    ↓
reconciliation
    ↓
cutover
```

### Acceptance checklist

[ ] generate
[ ] scan
[ ] validate
[ ] version
[ ] security

- [ ] Legacy screen/function mapping complete
- [ ] Code-behind/business-rule tracing complete
- [ ] SQL query/procedure dependencies identified
- [ ] dbo/erp ownership approved
- [ ] Node repository implemented
- [ ] Node service implemented
- [ ] React UI implemented
- [ ] Permission rules implemented
- [ ] Audit implemented
- [ ] Reports implemented
- [ ] Printing implemented where applicable
- [ ] Migration script implemented
- [ ] Unit tests pass
- [ ] SQL integration tests pass
- [ ] E2E tests pass
- [ ] Legacy/new output reconciliation complete
- [ ] Rollback tested
- [ ] Module signed off


## PLAN 31 — Settings / Configuration

### Legacy scope

CommonSettings, printer settings, system options, account date, operational configuration

### Business logic flow

```text
Configuration master → validation → effective date/context → module consumes configuration
```

### React implementation

React settings

Required UI structure:

```text
List / Search
    ↓
Create / Edit
    ↓
Validation
    ↓
Detail / Transaction
    ↓
Confirm
    ↓
Result
    ↓
History / Audit
```

### Node.js implementation

React settings; Node configuration service; SQL versioned configuration tables

The implementation must keep business rules in services/domain code and SQL access in repositories.

### Logic that must be preserved

Centralize configuration access and cache safely; avoid direct config reads from UI

### SQL / data implementation

```text
Master data
    ↓
Transaction data
    ↓
Related ledger/stock/tax/finance records
    ↓
Audit
```

Every table destination must be explicitly marked:

```text
dbo.existing_table   → reuse
erp.new_table        → versioned migration
obsolete              → drop
```

No new business table may be silently added to `dbo`.

### Reports

Reports generated by this module remain under this module.

```text
transaction data
    ↓
SQL report repository
    ↓
Node report service
    ↓
React report
    ├── filter
    ├── grouping
    ├── totals
    ├── export
    └── print
```

### Printing

Any legacy printer variants used by this module must use the common print adapter.

```text
module
  ↓
document/label payload
  ↓
template
  ↓
printer adapter
  ↓
queue
  ↓
physical printer
  ↓
print history
```

Do not create a new React page for each Zebra/TSC/TVS/Citizen/GODEX variant.

### Migration flow

```text
legacy records
    ↓
mapping
    ↓
validation
    ↓
staging
    ↓
target SQL
    ↓
reconciliation
    ↓
cutover
```

### Acceptance checklist

[ ] settings
[ ] effective dates
[ ] permissions
[ ] printer config
[ ] business date
[ ] audit

- [ ] Legacy screen/function mapping complete
- [ ] Code-behind/business-rule tracing complete
- [ ] SQL query/procedure dependencies identified
- [ ] dbo/erp ownership approved
- [ ] Node repository implemented
- [ ] Node service implemented
- [ ] React UI implemented
- [ ] Permission rules implemented
- [ ] Audit implemented
- [ ] Reports implemented
- [ ] Printing implemented where applicable
- [ ] Migration script implemented
- [ ] Unit tests pass
- [ ] SQL integration tests pass
- [ ] E2E tests pass
- [ ] Legacy/new output reconciliation complete
- [ ] Rollback tested
- [ ] Module signed off


## PLAN 32 — Reports / Export / Sharing

### Legacy scope

Excel/export/share/email/WhatsApp/export variants

### Business logic flow

```text
Report result → authorization → format conversion → file/share target → audit
```

### React implementation

React export actions

Required UI structure:

```text
List / Search
    ↓
Create / Edit
    ↓
Validation
    ↓
Detail / Transaction
    ↓
Confirm
    ↓
Result
    ↓
History / Audit
```

### Node.js implementation

React export actions; Node export service; SQL report repository; connector/integration adapters where required

The implementation must keep business rules in services/domain code and SQL access in repositories.

### Logic that must be preserved

Exports must use the same report query and permission model as on-screen reports

### SQL / data implementation

```text
Master data
    ↓
Transaction data
    ↓
Related ledger/stock/tax/finance records
    ↓
Audit
```

Every table destination must be explicitly marked:

```text
dbo.existing_table   → reuse
erp.new_table        → versioned migration
obsolete              → drop
```

No new business table may be silently added to `dbo`.

### Reports

Reports generated by this module remain under this module.

```text
transaction data
    ↓
SQL report repository
    ↓
Node report service
    ↓
React report
    ├── filter
    ├── grouping
    ├── totals
    ├── export
    └── print
```

### Printing

Any legacy printer variants used by this module must use the common print adapter.

```text
module
  ↓
document/label payload
  ↓
template
  ↓
printer adapter
  ↓
queue
  ↓
physical printer
  ↓
print history
```

Do not create a new React page for each Zebra/TSC/TVS/Citizen/GODEX variant.

### Migration flow

```text
legacy records
    ↓
mapping
    ↓
validation
    ↓
staging
    ↓
target SQL
    ↓
reconciliation
    ↓
cutover
```

### Acceptance checklist

[ ] Excel/CSV
[ ] PDF
[ ] share
[ ] email/WhatsApp where applicable
[ ] audit
[ ] large-export handling

- [ ] Legacy screen/function mapping complete
- [ ] Code-behind/business-rule tracing complete
- [ ] SQL query/procedure dependencies identified
- [ ] dbo/erp ownership approved
- [ ] Node repository implemented
- [ ] Node service implemented
- [ ] React UI implemented
- [ ] Permission rules implemented
- [ ] Audit implemented
- [ ] Reports implemented
- [ ] Printing implemented where applicable
- [ ] Migration script implemented
- [ ] Unit tests pass
- [ ] SQL integration tests pass
- [ ] E2E tests pass
- [ ] Legacy/new output reconciliation complete
- [ ] Rollback tested
- [ ] Module signed off


# 11. Cross-module business flows

The following flows are mandatory because functionality often crosses module boundaries.

## 11.1 Product → Purchase → Barcode → Stock

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
Stock ledger
    ↓
Barcode printing
```

## 11.2 Barcode → Sale → Payment → Stock

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

## 11.3 Sale → Return

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

## 11.4 Purchase → Return

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

## 11.5 Store transfer

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

## 11.6 Combo

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

## 11.7 Rate change

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

## 11.8 Cash closing

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

## 11.9 GST

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

## 11.10 Customer credit

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

---

# 12. Reports strategy

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

---

# 13. Printer strategy

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

---

# 14. Migration strategy

## Stage 1 — Read compatibility

React + Node reads from SQL while Mongo remains available for comparison where required.

## Stage 2 — Shadow comparison

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

## Stage 3 — SQL write

SQL becomes authoritative.

## Stage 4 — Observation

Mongo may remain only as a controlled rollback/reference dependency.

## Stage 5 — Mongo removal

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

---

# 15. Data migration rules

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

---

# 16. Restore strategy

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

---

# 17. Testing model

Every module requires five test layers.

## Unit

Business calculations:

- tax
- discount
- commission
- pricing
- quantity
- points
- eligibility

## Repository / SQL integration

- insert
- update
- delete/cancel
- joins
- transaction rollback
- locking

## API

- authentication
- authorization
- validation
- response compatibility

## E2E

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

## Parity

Compare legacy and React/Node result.

---

# 18. Definition of Done

A module is **NOT DONE** when only UI exists.

It is done only when:

```text
[ ] legacy functions mapped
[ ] legacy business rules mapped
[ ] data tables mapped
[ ] stored procedures/SQL traced
[ ] React complete
[ ] Node complete
[ ] SQL complete
[ ] transaction boundaries complete
[ ] permissions complete
[ ] audit complete
[ ] reports complete
[ ] printer/export complete
[ ] migration complete
[ ] reconciliation complete
[ ] tests complete
[ ] rollback complete
[ ] production runbook complete
```

---

# 19. Ultimate implementation sequence


## PHASE 0 — Discovery and invariants

Modules:

- Plan 01: Login, User & Security

- Plan 02: Company / Branch / Store

- Plan 03: Product / Item Master

- Plan 04: Product Attributes

- Plan 31: Settings / Configuration

Flow:

```text
discover
  ↓
design
  ↓
implement SQL
  ↓
implement Node
  ↓
implement React
  ↓
reports / printing
  ↓
test
  ↓
reconcile
  ↓
sign off
```

## PHASE 1 — Core masters

Modules:

- Plan 03: Product / Item Master

- Plan 04: Product Attributes

- Plan 20: Supplier / Vendor

- Plan 18: Customer

- Plan 23: Employee / Salesman

Flow:

```text
discover
  ↓
design
  ↓
implement SQL
  ↓
implement Node
  ↓
implement React
  ↓
reports / printing
  ↓
test
  ↓
reconcile
  ↓
sign off
```

## PHASE 2 — Procurement

Modules:

- Plan 05: Purchase

- Plan 06: Purchase Order / GRN

- Plan 07: Purchase Return

Flow:

```text
discover
  ↓
design
  ↓
implement SQL
  ↓
implement Node
  ↓
implement React
  ↓
reports / printing
  ↓
test
  ↓
reconcile
  ↓
sign off
```

## PHASE 3 — Inventory foundation

Modules:

- Plan 11: Barcode

- Plan 12: Barcode Rate

- Plan 16: Inventory / Stock

- Plan 17: Material / Store Transfer

- Plan 13: Barcode Printing

- Plan 14: Printer Integrations

Flow:

```text
discover
  ↓
design
  ↓
implement SQL
  ↓
implement Node
  ↓
implement React
  ↓
reports / printing
  ↓
test
  ↓
reconcile
  ↓
sign off
```

## PHASE 4 — Selling

Modules:

- Plan 10: GST

- Plan 25: Discount

- Plan 15: Combo / Offers

- Plan 08: Sales / Billing

- Plan 09: Sales Return

Flow:

```text
discover
  ↓
design
  ↓
implement SQL
  ↓
implement Node
  ↓
implement React
  ↓
reports / printing
  ↓
test
  ↓
reconcile
  ↓
sign off
```

## PHASE 5 — Customer and commercial

Modules:

- Plan 19: Customer Loyalty / Points

- Plan 24: Commission

- Plan 26: Gift

- Plan 27: Grocery / Electrical / Appliance / Special Modules

Flow:

```text
discover
  ↓
design
  ↓
implement SQL
  ↓
implement Node
  ↓
implement React
  ↓
reports / printing
  ↓
test
  ↓
reconcile
  ↓
sign off
```

## PHASE 6 — Finance and statutory

Modules:

- Plan 10: GST

- Plan 21: Accounts / Finance

- Plan 22: Cash Management

Flow:

```text
discover
  ↓
design
  ↓
implement SQL
  ↓
implement Node
  ↓
implement React
  ↓
reports / printing
  ↓
test
  ↓
reconcile
  ↓
sign off
```

## PHASE 7 — Reporting and documents

Modules:

- Plan 28: Reports

- Plan 29: Printing / Billing Engine

- Plan 30: QR Code

- Plan 32: Reports / Export / Sharing

Flow:

```text
discover
  ↓
design
  ↓
implement SQL
  ↓
implement Node
  ↓
implement React
  ↓
reports / printing
  ↓
test
  ↓
reconcile
  ↓
sign off
```

## PHASE 8 — Certification

Modules:

- Plan 01: Login, User & Security

- Plan 31: Settings / Configuration

- Plan 16: Inventory / Stock

- Plan 21: Accounts / Finance

- Plan 22: Cash Management

- Plan 28: Reports

- Plan 29: Printing / Billing Engine

Flow:

```text
discover
  ↓
design
  ↓
implement SQL
  ↓
implement Node
  ↓
implement React
  ↓
reports / printing
  ↓
test
  ↓
reconcile
  ↓
sign off
```

## PHASE 9 — Cutover and Mongo removal

Execute only after all functional plans are signed off.

# 20. Final cutover

## Pre-cutover

```text
[ ] all 32 module plans signed off
[ ] all reports reconciled
[ ] all printer variants tested
[ ] all critical E2E flows passed
[ ] restore drill passed
[ ] ERP carryover passed
[ ] dbo schema unchanged
[ ] erp migration history clean
[ ] SQL permissions verified
[ ] Mongo dependencies inventoried
[ ] rollback release prepared
```

## Cutover

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

## Rollback

```text
stop writes
    ↓
restore known-good release/database
    ↓
reconcile last accepted business checkpoint
    ↓
resume
```

# 21. Final success condition

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

# 22. Immediate implementation rule

Do not implement all modules simultaneously.

Implement in dependency order:

```text
1. Security / operating context
2. Product / attributes
3. Supplier
4. Purchase / GRN
5. Barcode
6. Inventory
7. Pricing / GST / discount
8. Sales / POS
9. Returns
10. Customer / loyalty
11. Transfer
12. Finance / cash
13. Commission
14. Specialty modes
15. Reports
16. Printing
17. Restore
18. Full certification
19. Mongo removal
```

Each step produces a usable increment and becomes the dependency baseline for the next step.
