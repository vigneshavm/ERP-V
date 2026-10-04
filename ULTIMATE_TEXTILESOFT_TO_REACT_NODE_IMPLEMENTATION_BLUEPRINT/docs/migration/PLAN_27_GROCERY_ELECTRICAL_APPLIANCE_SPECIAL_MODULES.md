# PLAN 27 - Grocery / Electrical / Appliance / Special Modules

## Objective
Migrate the legacy TextileSoft `Grocery / Electrical / Appliance / Special Modules` capability into the latest React + Node.js ERP without losing functionality or business logic.

## Legacy scope
grocery sales, electrical sales, appliance purchase, model-number/garment/fancy variants

## Business logic flow
```text
Special category/mode → common product/barcode/stock/sales engine → mode-specific fields/rules → reports
```

## React implementation
React configurable transaction modes; Node shared domain services; SQL specialty attributes

## Node.js implementation
React configurable transaction modes; Node shared domain services; SQL specialty attributes

## Logic preservation
No separate stock engine. Add only the attributes and rules required by the specialty mode

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
- ] grocery
[ ] electrical
[ ] appliance
[ ] model no
[ ] garment
[ ] fancy
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
