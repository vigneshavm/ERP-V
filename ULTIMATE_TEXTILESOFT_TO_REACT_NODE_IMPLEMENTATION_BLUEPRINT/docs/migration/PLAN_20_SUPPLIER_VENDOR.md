# PLAN 20 - Supplier / Vendor

## Objective
Migrate the legacy TextileSoft `Supplier / Vendor` capability into the latest React + Node.js ERP without losing functionality or business logic.

## Legacy scope
supplier master, supplier balance, vendor views

## Business logic flow
```text
Supplier → purchases/returns/payments → payable ledger → statement
```

## React implementation
React supplier workspace; Node supplier service; SQL supplier and payable relations

## Node.js implementation
React supplier workspace; Node supplier service; SQL supplier and payable relations

## Logic preservation
Preserve supplier codes, groups, tax details, contacts and financial linkage

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
- ] master
[ ] purchase linkage
[ ] returns
[ ] payments
[ ] balance
[ ] statement
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
