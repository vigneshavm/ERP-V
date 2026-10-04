# PLAN 28 - Reports

## Objective
Migrate the legacy TextileSoft `Reports` capability into the latest React + Node.js ERP without losing functionality or business logic.

## Legacy scope
all Crystal Reports and report pages

## Business logic flow
```text
Business transaction tables → SQL report query → filters/grouping → React report view → export/print
```

## React implementation
React report registry/views; Node report repository/service; SQL queries/views/CTEs

## Node.js implementation
React report registry/views; Node report repository/service; SQL queries/views/CTEs

## Logic preservation
Every report is owned by a business module. Crystal reports are source references, not target business logic

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
- ] inventory reports
[ ] purchase
[ ] sales
[ ] GST
[ ] finance
[ ] customer
[ ] supplier
[ ] commission
[ ] combo
[ ] exports
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
