# PLAN 06 - Purchase Order / GRN

## Objective
Migrate the legacy TextileSoft `Purchase Order / GRN` capability into the latest React + Node.js ERP without losing functionality or business logic.

## Legacy scope
PO, GRN entry/update/view, invoice/receipt variants

## Business logic flow
```text
PO → approval → partial/full receipt → GRN → barcode/stock creation → invoice/payable
```

## React implementation
React PO/GRN; Node workflow service; SQL transaction with stock receipt; versioned status transitions

## Node.js implementation
React PO/GRN; Node workflow service; SQL transaction with stock receipt; versioned status transitions

## Logic preservation
Preserve GRN numbering, invoice linkage, partial receipt, barcode creation and purchase update rules

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
- ] PO
[ ] approval
[ ] partial receipt
[ ] GRN
[ ] barcode
[ ] invoice
[ ] payable
[ ] cancellation
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
