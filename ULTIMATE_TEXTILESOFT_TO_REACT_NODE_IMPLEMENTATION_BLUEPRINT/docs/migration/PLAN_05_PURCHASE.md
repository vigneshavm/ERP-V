# PLAN 05 - Purchase

## Objective
Migrate the legacy TextileSoft `Purchase` capability into the latest React + Node.js ERP without losing functionality or business logic.

## Legacy scope
all purchase entry variants, supplier/invoice/agent/charges/rates

## Business logic flow
```text
Supplier → purchase header → item/barcode rows → discounts/charges/tax → rate → GRN/stock → supplier payable
```

## React implementation
React purchase workspace; Node purchase service; SQL purchase header/detail + dbo integration; one engine with modes

## Node.js implementation
React purchase workspace; Node purchase service; SQL purchase header/detail + dbo integration; one engine with modes

## Logic preservation
Do not duplicate business logic for each legacy purchase page; configure purchase mode while preserving field/rule differences

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
- ] normal purchase
[ ] GST purchase
[ ] specialty modes
[ ] charges
[ ] discount
[ ] tax
[ ] rates
[ ] stock receipt
[ ] payable
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
