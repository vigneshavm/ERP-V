# PLAN 03 - Product / Item Master

## Objective
Migrate the legacy TextileSoft `Product / Item Master` capability into the latest React + Node.js ERP without losing functionality or business logic.

## Legacy scope
newproduct, product groups/subgroups, units, HSN/product codes

## Business logic flow
```text
Product code generated/validated → master attributes saved → referenced by purchase/barcode/sales/reporting
```

## React implementation
React Product Master; Node product service; SQL product repository; protect references before delete

## Node.js implementation
React Product Master; Node product service; SQL product repository; protect references before delete

## Logic preservation
Product identity is separate from barcode identity; prevent deletion when transaction/barcode dependencies exist

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
- ] CRUD
[ ] code generation
[ ] HSN
[ ] unit
[ ] group/subgroup
[ ] duplicate rules
[ ] dependency checks
[ ] audit
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
