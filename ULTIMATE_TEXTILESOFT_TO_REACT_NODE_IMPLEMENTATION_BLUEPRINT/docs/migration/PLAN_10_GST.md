# PLAN 10 - GST

## Objective
Migrate the legacy TextileSoft `GST` capability into the latest React + Node.js ERP without losing functionality or business logic.

## Legacy scope
GST masters, HSN, GST sales/purchase/return pages

## Business logic flow
```text
Product/transaction tax category → taxable value → CGST/SGST/IGST rules → document tax snapshot → return/report
```

## React implementation
React GST configuration + transaction components; Node tax service; SQL tax repository

## Node.js implementation
React GST configuration + transaction components; Node tax service; SQL tax repository

## Logic preservation
One central tax engine. Transaction must store tax snapshot so later master changes do not rewrite history

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
- ] HSN
[ ] tax groups
[ ] CGST/SGST
[ ] IGST
[ ] purchase
[ ] sales
[ ] returns
[ ] rounding
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
