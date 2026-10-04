# PLAN 21 - Accounts / Finance

## Objective
Migrate the legacy TextileSoft `Accounts / Finance` capability into the latest React + Node.js ERP without losing functionality or business logic.

## Legacy scope
accounts, journals, daybook, loans, EMI, finance reports

## Business logic flow
```text
Business transaction → accounting event → journal/ledger → reconciliation → financial report
```

## React implementation
React finance workspace; Node accounting service; SQL finance tables + dbo integration where authoritative

## Node.js implementation
React finance workspace; Node accounting service; SQL finance tables + dbo integration where authoritative

## Logic preservation
Accounting entries must be atomic with source transactions where the legacy logic requires it

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
- ] chart/account
[ ] journal
[ ] daybook
[ ] loan
[ ] EMI
[ ] reconciliation
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
