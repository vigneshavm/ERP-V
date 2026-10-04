# PLAN 18 - Customer

## Objective
Migrate the legacy TextileSoft `Customer` capability into the latest React + Node.js ERP without losing functionality or business logic.

## Legacy scope
customer master, credit/customer ledger and customer views

## Business logic flow
```text
Customer master → sales/credit transactions → payment allocations → outstanding → statement
```

## React implementation
React customer workspace; Node customer/ledger service; SQL customer + account relations

## Node.js implementation
React customer workspace; Node customer/ledger service; SQL customer + account relations

## Logic preservation
Separate profile data from financial ledger and transaction snapshots

## SQL implementation
- Identify every source table/query/procedure.
- Map existing data to `dbo.*` without altering it.
- Create new ERP-owned structures only under `erp.*` through versioned migrations.
- Implement transaction boundaries explicitly.
- Preserve historical transaction snapshots.

## Reports
All reports owned by this module must be implemented from SQL-backed report repositories and exposed through the module's report navigation.

## Printing
All printer variants used by this module must call the shared print/document service and printer adapters.

## Migration
```text
legacy source
  ↓
mapping
  ↓
staging/validation
  ↓
SQL target
  ↓
reconciliation
  ↓
cutover
```

## Acceptance
- ] master
[ ] duplicate
[ ] credit
[ ] payment
[ ] outstanding
[ ] statement
[ ] history
- [ ] legacy functionality trace complete
- [ ] business-rule trace complete
- [ ] SQL mapping complete
- [ ] React complete
- [ ] Node complete
- [ ] report/print complete
- [ ] migration complete
- [ ] parity tests complete
- [ ] rollback tested
- [ ] sign-off
