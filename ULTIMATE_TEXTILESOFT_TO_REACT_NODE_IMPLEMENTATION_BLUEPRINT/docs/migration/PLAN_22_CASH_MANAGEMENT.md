# PLAN 22 - Cash Management

## Objective
Migrate the legacy TextileSoft `Cash Management` capability into the latest React + Node.js ERP without losing functionality or business logic.

## Legacy scope
cash in/out, cashier/day close, deposits, bank/cheque

## Business logic flow
```text
Counter/cashier opening → cash transactions → sales/returns/expenses → closing → variance → bank deposit
```

## React implementation
React cash workspace; Node cash session service; SQL cash ledger/session tables

## Node.js implementation
React cash workspace; Node cash session service; SQL cash ledger/session tables

## Logic preservation
Cashier session and business date must be part of transaction context

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
- ] opening
[ ] cash in
[ ] cash out
[ ] closing
[ ] variance
[ ] deposit
[ ] cheque
[ ] reports
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
