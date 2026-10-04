# ERP SQL-Only Migration Plan and Areas to Fix

## 1. Purpose

This document is the implementation plan for moving the ERP application from MongoDB/hybrid persistence to SQL Server while preserving the existing `dbo` database contract and keeping the migration reversible.

The plan is based on the uploaded ERP application source and the migration constraints defined for the project.

### Primary objective

```text
Current
React
  ↓
API
  ↓
MongoDB + SQL dbo

Target
React
  ↓
API
  ↓
Shared SQL Pool
  ↓
┌──────────────────────────┐
│ Existing dbo.*           │
│ New ERP-owned erp.*      │
└──────────────────────────┘
```

MongoDB must be removed from the production runtime only after all migration gates pass.

---

# 2. Non-Negotiable Rules

## 2.1 dbo is never altered

The migration must not modify the existing `dbo` schema.

Prohibited:

- `ALTER TABLE dbo.*`
- adding columns to `dbo.*`
- renaming columns in `dbo.*`
- changing existing column types
- adding ERP-specific indexes to `dbo.*`
- adding ERP triggers to `dbo.*`
- changing existing constraints
- changing existing stored procedure contracts unless separately approved
- using `dbo` as a temporary schema for new ERP data

Existing `dbo` objects are treated as a legacy integration boundary.

---

## 2.2 erp.* is created only by versioned migrations

All new ERP-owned SQL objects must be under:

```text
erp.*
```

Every object must be created through a numbered migration.

Example:

```text
sql/migrations/
  V001__create_erp_schema.sql
  V002__create_users.sql
  V003__create_roles.sql
  V004__create_permissions.sql
  V005__create_customer_tables.sql
  ...
```

Required migration metadata:

```text
version
description
checksum
applied_at
applied_by
execution_status
```

No manual production `CREATE TABLE`.

---

## 2.3 Separate SQL identities

The application must use separate SQL credentials.

### ERP_READ

Purpose:

- SELECT only
- reports
- read APIs
- dashboards

Must not:

- INSERT
- UPDATE
- DELETE
- ALTER
- CREATE
- DROP

### ERP_WRITE

Purpose:

- application writes
- approved writes to `erp.*`
- explicitly approved writes to existing `dbo.*`

Must not:

- run migrations
- create/drop objects
- administer the database

### ERP_ADMIN

Purpose:

- migrations
- grants
- restore operations
- database administration
- emergency maintenance

Must never be used by normal API request handling.

---

# 3. Data Placement Rule

Every Mongo model must receive an explicit disposition.

Exactly one of:

```text
Mongo Model
   │
   ├── Existing dbo table
   │
   ├── New erp table
   │
   └── DROP / do not migrate
```

No model may remain indefinitely in a fourth state such as:

```text
Mongo fallback
temporary sync
dual-write forever
unknown
```

Create a migration inventory:

| Mongo Model | Current Usage | Target | Reason | Wave | Status |
|---|---|---|---|---|---|
| model A | CRUD | dbo.table | existing source of truth | 2 | Pending |
| model B | CRUD | erp.table | no suitable dbo table | 2 | Pending |
| model C | obsolete | DROP | unused | 9 | Pending |

This inventory is mandatory before each wave is signed off.

---

# 4. Current Code Areas That Need Fixing

## 4.1 MongoDB / Mongoose dependencies

The uploaded source contains substantial Mongo usage.

Measured in the uploaded source:

- `ObjectId`: approximately 184 files
- `.populate()`: approximately 108 usages
- `.aggregate()`: approximately 52 usages
- Mongo transaction/session patterns: approximately 22
- frontend `_id`: approximately 222 files / 1,076 references

These are migration indicators, not simply search-and-replace tasks.

### Fix

For every occurrence:

```text
ObjectId
populate()
aggregate()
session
startSession()
withTransaction()
mongoose
MongoClient
Mongo model imports
```

classify the usage and replace it with the appropriate SQL repository/service implementation.

Do not mechanically replace Mongo syntax.

---

# 5. ObjectId and ID Strategy

## 5.1 Required strategy

The API should continue returning:

```json
{
  "_id": "12345"
}
```

during migration.

This prevents an unnecessary frontend-wide rewrite.

SQL can internally use:

```sql
BIGINT
```

or another stable relational key.

The API repository/mapper owns the conversion.

Example:

```text
SQL
id = 12345

API
_id = "12345"
```

---

## 5.2 Fix areas

Search and classify:

```text
ObjectId()
new ObjectId()
Types.ObjectId
_id:
_id ===
_id !==
_id.toString()
_id.toHexString()
findById()
findOne({_id: ...})
```

Pay special attention to:

- URL parameters
- Redux state
- React keys
- form payloads
- comparison logic
- sorting
- filtering
- nested references
- frontend API types

---

# 6. populate() Migration

Mongo:

```js
Order.find()
  .populate("customer")
  .populate("items")
```

must become a SQL repository query or controlled repository composition.

Possible SQL pattern:

```sql
SELECT ...
FROM erp.orders o
JOIN erp.customers c
  ON c.id = o.customer_id
```

For one-to-many relationships:

```text
orders
  ↓
order_items
```

Use explicit relational relationships.

Do not recreate `populate()` as repeated API calls.

---

# 7. aggregate() Migration

Every aggregation must be classified.

Typical translations:

```text
$match       → WHERE
$lookup      → JOIN
$group       → GROUP BY
$sum         → SUM
$count       → COUNT
$sort        → ORDER BY
$project     → SELECT
$unwind      → JOIN / relational expansion
$facet       → multiple CTEs / queries
```

Complex reporting logic should use:

- CTEs
- views where appropriate
- stored procedures only where justified
- dedicated reporting repositories

Do not put large reporting SQL directly into controllers.

---

# 8. Mongo Transaction Migration

Every Mongo transaction/session must be converted to an SQL transaction.

Required pattern:

```text
BEGIN TRANSACTION
    ↓
validate
    ↓
write parent
    ↓
write children
    ↓
write ledger / audit
    ↓
validate final state
    ↓
COMMIT
```

On failure:

```text
ROLLBACK
```

Do not partially migrate transaction logic.

---

# 9. Shared SQL Pool

Create one shared SQL database infrastructure layer.

Recommended:

```text
src/infrastructure/database/
  sqlPool.ts
  sqlConfig.ts
  sqlTransaction.ts
  sqlHealth.ts
  sqlPermissions.ts
```

Services and repositories must reuse the same pool.

Avoid:

```text
controller → new SQL connection
service → new SQL connection
repository → new SQL connection
```

Preferred:

```text
API
 ↓
Service
 ↓
Repository
 ↓
Shared SQL Pool
```

---

# 10. Repository Boundary

Create explicit repositories.

Example:

```text
CustomerRepository
SalesRepository
PurchaseRepository
InventoryRepository
ComboRepository
TransferRepository
UserRepository
ReportRepository
```

Repositories own:

- SQL queries
- mapping
- transactions
- pagination
- filtering
- row-to-domain conversion

Services own:

- business rules
- validation
- orchestration

Controllers own:

- HTTP request/response
- authentication/authorization
- input validation boundary

---

# 11. Migration Runner

Create a versioned SQL migration runner.

Required behavior:

```text
startup / deployment
      ↓
read migration history
      ↓
discover pending migrations
      ↓
validate ordering
      ↓
validate checksum
      ↓
execute
      ↓
record success
```

Recommended table:

```sql
erp.schema_migrations
```

Fields:

```text
version
description
checksum
applied_at
applied_by
execution_ms
status
```

A changed checksum for an already-applied migration must fail rather than silently re-run.

---

# 12. Restore Problem

## 12.1 Critical finding

A restore such as:

```sql
RESTORE DATABASE SSS_copy
WITH REPLACE
```

replaces the entire database.

Therefore it replaces:

```text
dbo.*
erp.*
```

It does NOT preserve `erp.*`.

This contradicts any design that assumes ERP tables survive a database restore automatically.

---

# 13. Required Restore Fix

Extend:

```text
sqlRestoreCarryover.ts
```

to explicitly protect ERP data.

Required flow:

```text
Existing database
      │
      ├── export required erp.* data
      │
      ↓
RESTORE ... WITH REPLACE
      │
      ↓
run erp migrations
      │
      ↓
restore erp.* data
      │
      ↓
restore legacy dbo carryover
      │
      ↓
validate
      │
      ↓
release
```

The ERP export must include:

- schema version
- table metadata
- rows
- dependencies
- identity handling
- foreign-key order
- checksum/count validation

---

# 14. Restore Safety Rule

Until ERP carryover is implemented and tested:

> DO NOT restore a production/copy database that contains real `erp.*` data using `WITH REPLACE`.

Use a disposable test database for restore development.

Required restore test:

```text
Create ERP records
        ↓
Backup
        ↓
Restore WITH REPLACE
        ↓
Verify erp.* is absent/replaced
        ↓
Run carryover
        ↓
Verify exact ERP record parity
```

Acceptance:

```text
before_count = after_count
before_checksum = after_checksum
```

for all protected ERP tables.

---

# 15. Test Infrastructure Fix

The original assumption that `.test.ts` files are skipped by Jest is not correct for the uploaded source.

The uploaded configuration includes TypeScript test matching.

There are approximately:

```text
22 *.test.ts
49 *.test.js
```

## Required fix

Do not blindly modify `jest.config.js`.

Instead prove:

```text
[ ] TypeScript Jest project is discovered
[ ] .test.ts files execute
[ ] CI executes the same projects
[ ] failing tests cause CI failure
[ ] test coverage is reported
[ ] SQL integration tests can run
```

Add a CI guard that fails if the expected test count drops unexpectedly.

---

# 16. Ten Migration Waves

## Wave 0 - Discovery and Baseline

### Checklist

```text
[ ] Inventory all Mongo models
[ ] Inventory all Mongo repositories
[ ] Inventory ObjectId usage
[ ] Inventory populate usage
[ ] Inventory aggregate usage
[ ] Inventory transactions
[ ] Inventory frontend _id usage
[ ] Map every model to dbo / erp / drop
[ ] Capture dbo schema baseline
[ ] Capture indexes
[ ] Capture constraints
[ ] Capture stored procedure dependencies
[ ] Define SQL permissions
[ ] Define restore strategy
[ ] Create migration inventory
```

### Exit gate

No unknown Mongo model or unknown data owner.

---

# 17. Wave 1 - SQL Foundation

### Checklist

```text
[ ] Create erp schema migration
[ ] Create migration history table
[ ] Create shared SQL pool
[ ] Create SQL health check
[ ] Create ERP_READ
[ ] Create ERP_WRITE
[ ] Create ERP_ADMIN
[ ] Validate grants
[ ] Validate application does not use ADMIN
[ ] Add transaction helper
[ ] Add repository base patterns
[ ] Add SQL integration test harness
```

### Exit gate

SQL foundation works independently of Mongo.

---

# 18. Wave 2 - Masters and Configuration

Move:

- organization
- users
- roles
- permissions
- company/configuration
- categories
- tax/configuration
- master data

### Checklist

```text
[ ] Model disposition complete
[ ] erp migrations created
[ ] repositories created
[ ] services migrated
[ ] ObjectId removed
[ ] populate removed
[ ] tests passing
[ ] API _id compatibility verified
[ ] data parity verified
```

---

# 19. Wave 3 - Sales

Move:

- invoices
- sales
- sales items
- returns
- exchanges
- payment references

### Checklist

```text
[ ] Header/detail model created
[ ] dbo integration mapped
[ ] stock impact mapped
[ ] tax impact mapped
[ ] transaction boundaries defined
[ ] return logic verified
[ ] exchange logic verified
[ ] report parity verified
[ ] rollback tested
```

---

# 20. Wave 4 - Purchase and GRN

Move:

- purchase
- GRN
- purchase items
- purchase returns
- supplier relationships

### Checklist

```text
[ ] GRN mapping complete
[ ] barcode linkage complete
[ ] rate mapping complete
[ ] tax mapping complete
[ ] supplier mapping complete
[ ] stock receipt verified
[ ] purchase return verified
[ ] parity verified
```

---

# 21. Wave 5 - Customer and Loyalty

Move:

- customers
- customer accounts
- loyalty
- dues
- payment references

### Checklist

```text
[ ] Customer model mapped
[ ] Existing dbo customer source identified
[ ] erp-only data identified
[ ] balances reconciled
[ ] loyalty balances reconciled
[ ] API compatibility verified
[ ] reports verified
```

---

# 22. Wave 6 - Finance

Move:

- cash
- bank
- journal
- cheque
- expenses
- loans
- financial references

### Checklist

```text
[ ] Ledger model mapped
[ ] Debit/credit rules documented
[ ] Opening balances verified
[ ] Transaction atomicity verified
[ ] Financial totals reconciled
[ ] Daily closing verified
[ ] Reports verified
```

Financial reconciliation is a hard exit gate.

---

# 23. Wave 7 - HR and Payroll

Move:

- employee data
- attendance
- payroll
- salary structures
- HR transactions

### Checklist

```text
[ ] Employee mapping
[ ] Payroll mapping
[ ] Attendance mapping
[ ] Salary calculation parity
[ ] Payroll transaction test
[ ] Historical payroll verification
[ ] Access controls verified
```

---

# 24. Wave 8 - Remaining ERP Modules

Move remaining modules including:

- inventory extensions
- combo
- commission
- messaging integrations
- marketing
- reports
- auxiliary modules

### Checklist

```text
[ ] Every remaining model has disposition
[ ] No unclassified Mongo collections
[ ] Reports migrated
[ ] background jobs migrated
[ ] scheduled jobs migrated
[ ] integrations migrated
[ ] audit history preserved
```

---

# 25. Wave 9 - Mongo Removal

Only start after all previous waves pass.

### Checklist

```text
[ ] Disable Mongo writes
[ ] Verify SQL is sole write path
[ ] Run production observation period
[ ] Compare SQL vs previous Mongo-derived results
[ ] Remove Mongo repositories
[ ] Remove Mongoose models
[ ] Remove Mongo connection
[ ] Remove Mongo transaction code
[ ] Remove Mongo sync jobs
[ ] Remove Mongo environment variables
[ ] Remove Mongo deployment service
[ ] Remove Mongo backup jobs
[ ] Remove ITEM_DATA_SOURCE branching
[ ] Remove unused Mongo dependencies
```

---

# 26. Environment Before and After

## Before

Expected Mongo/hybrid configuration may include:

```text
MONGO_URI
MONGO_MAX_POOL_SIZE
MONGO_MIN_POOL_SIZE
MONGO_SERVER_SELECTION_TIMEOUT_MS
MONGO_SOCKET_TIMEOUT_MS
MONGO_DNS_SERVERS
ITEM_DATA_SOURCE
```

These must be traced before removal.

## After

Use SQL configuration such as:

```text
TEXTILESOFT_DB_HOST
TEXTILESOFT_DB_PORT
TEXTILESOFT_DB_NAME

TEXTILESOFT_DB_USER
TEXTILESOFT_DB_PASSWORD

TEXTILESOFT_DB_READ_USER
TEXTILESOFT_DB_READ_PASSWORD

TEXTILESOFT_DB_WRITE_USER
TEXTILESOFT_DB_WRITE_PASSWORD

TEXTILESOFT_ADMIN_USER
TEXTILESOFT_ADMIN_PASSWORD

TEXTILESOFT_DB_ENCRYPT
TEXTILESOFT_DB_TRUST_CERT
```

Secrets must come from the deployment secret store.

Do not commit passwords to source control.

---

# 27. Mongo Removal Verification

Run repository/source scans after migration.

Required searches:

```text
mongoose
mongodb
MongoClient
ObjectId
Types.ObjectId
.populate(
.aggregate(
.startSession(
.withTransaction(
MONGO_
ITEM_DATA_SOURCE
```

Also inspect:

```text
package.json
package-lock.json
Docker
docker-compose
CI/CD
environment files
deployment manifests
backup scripts
scheduled jobs
```

The result must show no production runtime dependency on Mongo.

---

# 28. Data Verification

Every migration wave requires reconciliation.

## Record counts

```text
Mongo/source count
SQL target count
Difference
```

Expected:

```text
Difference = 0
```

unless explicitly documented.

## Financial totals

Verify:

- invoice totals
- tax
- discounts
- payments
- returns
- outstanding
- stock value

## Inventory

Verify:

- quantity
- free quantity
- meter quantity
- barcode count
- available stock
- transferred stock
- damaged stock
- missing stock

---

# 29. Cutover Plan

## Phase 1 - Freeze

```text
[ ] Announce cutover
[ ] Stop deployments
[ ] Freeze schema changes
[ ] Freeze migration changes
[ ] Backup database
[ ] Capture Mongo final checkpoint
```

## Phase 2 - Final migration

```text
[ ] Apply pending SQL migrations
[ ] Final data migration
[ ] Validate counts
[ ] Validate financial totals
[ ] Validate inventory
[ ] Validate users/permissions
```

## Phase 3 - SQL-only startup

```text
[ ] Start application with SQL configuration
[ ] Verify health endpoint
[ ] Verify login
[ ] Verify read
[ ] Verify write
[ ] Verify transaction
[ ] Verify reports
```

## Phase 4 - Observation

```text
[ ] Monitor SQL errors
[ ] Monitor transaction failures
[ ] Monitor query latency
[ ] Monitor deadlocks
[ ] Monitor connection pool
[ ] Monitor business reconciliation
```

---

# 30. Rollback

Rollback must be defined before cutover.

Possible rollback:

```text
SQL-only release
      ↓
detect critical failure
      ↓
stop writes
      ↓
restore known-good database
      ↓
restore application version
      ↓
re-enable previous persistence path
      ↓
validate
```

If Mongo has already been removed from runtime, rollback must not depend on Mongo being casually available.

Maintain the previous application release and database backup until the cutover acceptance window expires.

---

# 31. Risks

## High risk

### Restore destroys erp.*

Mitigation:

- implement ERP carryover
- test `WITH REPLACE`
- block production restore until verified

### Mongo transaction semantics differ from SQL

Mitigation:

- define transaction boundary per use case
- integration-test rollback paths

### ObjectId assumptions

Mitigation:

- API `_id` compatibility layer
- explicit ID mapper
- test all comparison/filter paths

### populate() behavior changes

Mitigation:

- repository-level joins
- response contract tests

### aggregate() behavior changes

Mitigation:

- result-set parity tests
- financial/report reconciliation

### dbo dependency assumptions

Mitigation:

- schema baseline
- no `dbo` modifications
- explicit read/write allow-list

---

# 32. Medium Risk

- pagination differences
- NULL handling
- date/timezone differences
- decimal precision
- string collation
- case sensitivity
- SQL identity behavior
- concurrent updates
- deadlocks
- duplicate keys
- report rounding
- transaction isolation
- legacy stored procedure dependencies

Each must have a regression test.

---

# 33. Open Decisions

These must be explicitly decided before implementation of the relevant wave.

## Database

- SQL Server version
- connection pool limits
- isolation level
- retry policy
- command timeout
- read/write routing

## IDs

- BIGINT vs GUID
- API `_id` compatibility period
- foreign-key strategy

## dbo

- exact approved DML allow-list
- existing tables that remain authoritative
- legacy stored procedures that must remain

## erp

- naming conventions
- migration directory
- migration checksum algorithm
- audit column standard
- soft-delete standard

## Restore

- ERP tables requiring carryover
- export format
- identity reseeding
- dependency order
- restore validation threshold

## Cutover

- final write freeze duration
- observation period
- rollback deadline
- application version retention

---

# 34. Required Deliverables

Before Wave 0 closes:

```text
[ ] Mongo Model Disposition Matrix
[ ] dbo Dependency Matrix
[ ] erp Schema Plan
[ ] SQL Permission Matrix
[ ] Migration Version Register
[ ] Restore/Caryover Design
[ ] Test Strategy
[ ] Cutover Runbook
[ ] Rollback Runbook
```

Before production:

```text
[ ] All ten waves signed off
[ ] Restore drill passed
[ ] ERP carryover tested
[ ] SQL-only runtime verified
[ ] Mongo removal verified
[ ] Security permissions verified
[ ] Financial reconciliation passed
[ ] Inventory reconciliation passed
[ ] Performance baseline passed
[ ] Rollback drill passed
```

---

# 35. Final Acceptance Criteria

The migration is complete only when all are true.

```text
[ ] dbo schema unchanged
[ ] All erp.* objects created through migrations
[ ] Migration history complete
[ ] ERP_READ works
[ ] ERP_WRITE works
[ ] ERP_ADMIN works
[ ] Application never uses ERP_ADMIN
[ ] Every Mongo model has a disposition
[ ] All production models migrated or intentionally dropped
[ ] ObjectId runtime dependency removed
[ ] populate() runtime dependency removed
[ ] aggregate() runtime dependency removed
[ ] Mongo transactions removed
[ ] Shared SQL pool active
[ ] SQL transactions verified
[ ] API _id compatibility verified
[ ] Tests execute in CI
[ ] Restore carryover protects erp.*
[ ] Restore drill passed
[ ] Data reconciliation passed
[ ] Financial reconciliation passed
[ ] Inventory reconciliation passed
[ ] Mongo runtime removed
[ ] Mongo environment keys removed
[ ] Mongo deployment removed
[ ] Cutover passed
[ ] Rollback tested
```

---

# 36. Immediate Areas to Fix

Priority order:

## P0 - Must fix before ERP data exists in erp.*

1. Restore/carryover for `erp.*`
2. Versioned migration runner
3. SQL permission separation
4. Complete Mongo model disposition matrix
5. Shared SQL pool
6. SQL transaction infrastructure

## P1 - Must fix during migration

7. ObjectId conversion
8. populate() conversion
9. aggregate() conversion
10. Mongo transaction conversion
11. Repository/service separation
12. API `_id` compatibility
13. SQL integration test infrastructure
14. CI test discovery verification

## P2 - Must fix before Mongo removal

15. Mongo environment key removal
16. Mongo dependency removal
17. Mongo backup removal
18. Mongo deployment removal
19. `ITEM_DATA_SOURCE` removal
20. Dual-read/dual-write cleanup

## P3 - Hardening

21. Query performance
22. Deadlock/retry handling
23. Connection-pool tuning
24. SQL audit logging
25. Migration checksum protection
26. Restore verification automation
27. Cutover/rollback automation

---

# 37. Recommended Implementation Order

```text
                    ┌──────────────────────┐
                    │ WAVE 0               │
                    │ Inventory + Baseline │
                    └──────────┬───────────┘
                               ↓
                    ┌──────────────────────┐
                    │ WAVE 1               │
                    │ SQL Foundation       │
                    └──────────┬───────────┘
                               ↓
             ┌─────────────────┴─────────────────┐
             ↓                                   ↓
      Model Migration                     Restore Safety
      Waves 2 → 8                         ERP Carryover
             │                                   │
             └─────────────────┬─────────────────┘
                               ↓
                    ┌──────────────────────┐
                    │ Full Reconciliation │
                    └──────────┬───────────┘
                               ↓
                    ┌──────────────────────┐
                    │ Cutover Drill        │
                    └──────────┬───────────┘
                               ↓
                    ┌──────────────────────┐
                    │ WAVE 9               │
                    │ Mongo Removal        │
                    └──────────┬───────────┘
                               ↓
                    ┌──────────────────────┐
                    │ SQL-ONLY ERP         │
                    └──────────────────────┘
```

# 38. Key Principle

The migration should not be treated as:

```text
MongoDB → SQL conversion
```

It should be treated as:

```text
Mongo persistence model
        ↓
explicit domain/data ownership
        ↓
dbo integration boundary + erp-owned schema
        ↓
repository/service migration
        ↓
transaction and reporting parity
        ↓
restore-safe SQL architecture
        ↓
verified SQL-only runtime
        ↓
Mongo removal
```

The most important constraint is:

> **Never change `dbo`, never create `erp.*` manually, never run the application as ERP_ADMIN, and never perform a restore that can destroy real `erp.*` data without a tested carryover path.**
