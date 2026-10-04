# PLAN 29 - Printing / Billing Engine

## Objective
Migrate the legacy TextileSoft `Printing / Billing Engine` capability into the latest React + Node.js ERP without losing functionality or business logic.

## Legacy scope
bill printing, receipt, document layouts and Crystal billing reports

## Business logic flow
```text
Committed transaction → document snapshot → template → printer/PDF → print history
```

## React implementation
React preview/reprint; Node document renderer/print adapter; SQL print history

## Node.js implementation
React preview/reprint; Node document renderer/print adapter; SQL print history

## Logic preservation
Document content must be reproducible from stored transaction snapshots

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
- ] invoice
[ ] receipt
[ ] return
[ ] exchange
[ ] preview
[ ] PDF
[ ] printer
[ ] reprint
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
