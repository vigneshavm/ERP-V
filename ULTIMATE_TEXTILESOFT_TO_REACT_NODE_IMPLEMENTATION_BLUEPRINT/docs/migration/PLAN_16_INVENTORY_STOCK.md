# PLAN 16 - Inventory / Stock

## Objective
Migrate the legacy TextileSoft `Inventory / Stock` capability into the latest React + Node.js ERP without losing functionality or business logic.

## Legacy scope
current stock, stock details, group/brand/city/floor/rack/model reports, missing/damage

## Business logic flow
```text
Purchase receipt + sales + returns + transfers + adjustments → stock ledger → current balance/snapshot → reports
```

## React implementation
React inventory dashboards; Node inventory/ledger service; SQL stock ledger + existing dbo integration

## Node.js implementation
React inventory dashboards; Node inventory/ledger service; SQL stock ledger + existing dbo integration

## Logic preservation
Inventory must be explainable from transactions. Avoid treating a mutable snapshot as the sole source of truth

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
[ ] receipt
[ ] sale
[ ] return
[ ] transfer
[ ] adjustment
[ ] missing
[ ] damage
[ ] reconciliation
[ ] valuation
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
