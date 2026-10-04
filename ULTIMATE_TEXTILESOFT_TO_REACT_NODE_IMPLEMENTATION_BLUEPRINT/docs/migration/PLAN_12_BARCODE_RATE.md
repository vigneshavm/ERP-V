# PLAN 12 - Barcode Rate

## Objective
Migrate the legacy TextileSoft `Barcode Rate` capability into the latest React + Node.js ERP without losing functionality or business logic.

## Legacy scope
rate/MRP/commission/wholesale/special rate change pages

## Business logic flow
```text
Find barcode → load current rates → capture old values → calculate new rates → save current price → write history → sync required stock snapshot
```

## React implementation
React rate revision UI; Node pricing service; SQL price/history repository

## Node.js implementation
React rate revision UI; Node pricing service; SQL price/history repository

## Logic preservation
Historical transaction price is immutable. Current barcode price may change. Rate-specific legacy variants become rule modes

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
- ] MRP
[ ] sale rate
[ ] cost rate
[ ] commission
[ ] discount
[ ] history
[ ] cancel/reverse
[ ] authorization
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
