# PLAN 17 - Material / Store Transfer

## Objective
Migrate the legacy TextileSoft `Material / Store Transfer` capability into the latest React + Node.js ERP without losing functionality or business logic.

## Legacy scope
MaterialTransfer, StoreTransfer, Barcodewise/GRNwise transfer, received flows

## Business logic flow
```text
Source store → transfer request → issue → in-transit → destination receive → source/destination stock ledger → status/audit
```

## React implementation
React transfer workspace; Node transfer service; SQL transfer header/detail/status + stock transaction

## Node.js implementation
React transfer workspace; Node transfer service; SQL transfer header/detail/status + stock transaction

## Logic preservation
Do not assume every legacy path has one universal stock update. Validate exact production behavior before final cutover

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
[ ] barcode
[ ] GRN
[ ] issue
[ ] receive
[ ] cancel
[ ] stock
[ ] reconciliation
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
