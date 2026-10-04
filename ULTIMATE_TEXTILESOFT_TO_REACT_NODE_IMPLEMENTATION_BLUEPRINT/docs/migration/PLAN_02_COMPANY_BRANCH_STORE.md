# PLAN 02 - Company / Branch / Store

## Objective
Migrate the legacy TextileSoft `Company / Branch / Store` capability into the latest React + Node.js ERP without losing functionality or business logic.

## Legacy scope
companydetail, branchdetail, warehousedetail, countername, AccountDate, floors/racks

## Business logic flow
```text
Company → branch → warehouse/store → floor/rack/counter → business date → transaction context
```

## React implementation
React masters/settings; Node organization service; SQL organization repositories; no dbo schema change

## Node.js implementation
React masters/settings; Node organization service; SQL organization repositories; no dbo schema change

## Logic preservation
Preserve business-date and operating-location behavior; establish context used by purchase, stock, sales, transfer and reports

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
- ] company
[ ] branch
[ ] warehouse
[ ] counter
[ ] floor/rack
[ ] business date
[ ] permissions
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
