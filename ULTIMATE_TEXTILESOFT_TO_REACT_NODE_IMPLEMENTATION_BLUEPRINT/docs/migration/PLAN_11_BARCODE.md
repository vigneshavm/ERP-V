# PLAN 11 - Barcode

## Objective
Migrate the legacy TextileSoft `Barcode` capability into the latest React + Node.js ERP without losing functionality or business logic.

## Legacy scope
barcode creation/taking/move/update/lookup and barcode history

## Business logic flow
```text
Product + GRN → barcode generated → barcode linked to stock/location/rates → movement → sale/return/transfer history
```

## React implementation
React barcode workspace; Node barcode service; SQL barcode repository and history; preserve legacy barcode semantics

## Node.js implementation
React barcode workspace; Node barcode service; SQL barcode repository and history; preserve legacy barcode semantics

## Logic preservation
Barcode is the operational inventory identity where the legacy system uses it; product master remains separate

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
- ] create
[ ] duplicate validation
[ ] lookup
[ ] movement
[ ] location
[ ] history
[ ] sale linkage
[ ] transfer linkage
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
