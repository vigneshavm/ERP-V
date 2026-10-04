# PLAN 07 - Purchase Return

## Objective
Migrate the legacy TextileSoft `Purchase Return` capability into the latest React + Node.js ERP without losing functionality or business logic.

## Legacy scope
purchase return and barcode/GRN return variants

## Business logic flow
```text
Select supplier/GRN/barcode → validate available received stock → return quantity → reverse stock/tax/payable → audit
```

## React implementation
React return workspace; Node return service; SQL transaction against purchase/stock/ledger

## Node.js implementation
React return workspace; Node return service; SQL transaction against purchase/stock/ledger

## Logic preservation
Never allow return beyond received-not-returned quantity; preserve original cost/tax context

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
- ] barcode return
[ ] GRN return
[ ] tax reversal
[ ] payable reversal
[ ] stock reversal
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
