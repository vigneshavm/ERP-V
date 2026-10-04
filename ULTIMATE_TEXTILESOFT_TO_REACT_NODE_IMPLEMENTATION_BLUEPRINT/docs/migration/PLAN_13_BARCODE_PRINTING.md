# PLAN 13 - Barcode Printing

## Objective
Migrate the legacy TextileSoft `Barcode Printing` capability into the latest React + Node.js ERP without losing functionality or business logic.

## Legacy scope
barcode sticker and category/template pages

## Business logic flow
```text
Select products/barcodes → resolve label template/printer → generate label payload/PRN → queue → print → log job
```

## React implementation
React print workspace; Node label service; printer adapter layer; SQL print history/settings

## Node.js implementation
React print workspace; Node label service; printer adapter layer; SQL print history/settings

## Logic preservation
Template-based printer abstraction replaces page-per-printer duplication

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
- ] templates
[ ] label sizes
[ ] copies
[ ] preview
[ ] queue
[ ] retry
[ ] reprint
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
