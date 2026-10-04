# PLAN 26 - Gift

## Objective
Migrate the legacy TextileSoft `Gift` capability into the latest React + Node.js ERP without losing functionality or business logic.

## Legacy scope
gift purchase/sale/barcode/report flows

## Business logic flow
```text
Gift item master/category → purchase → barcode/stock → sale → return → reporting
```

## React implementation
React gift mode using shared product/purchase/sales engines; Node mode rules; SQL shared tables + gift attributes

## Node.js implementation
React gift mode using shared product/purchase/sales engines; Node mode rules; SQL shared tables + gift attributes

## Logic preservation
Gift is a mode/category, not a second inventory system

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
- ] purchase
[ ] barcode
[ ] sale
[ ] return
[ ] stock
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
