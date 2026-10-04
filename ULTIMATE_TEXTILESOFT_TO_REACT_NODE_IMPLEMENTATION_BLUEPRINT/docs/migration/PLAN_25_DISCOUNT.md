# PLAN 25 - Discount

## Objective
Migrate the legacy TextileSoft `Discount` capability into the latest React + Node.js ERP without losing functionality or business logic.

## Legacy scope
discount offers, invoice price offers, barcode/department discounts

## Business logic flow
```text
Candidate discounts → eligibility → precedence/stacking → final discount → tax base → audit
```

## React implementation
React promotion UI; Node pricing/discount engine; SQL rule tables

## Node.js implementation
React promotion UI; Node pricing/discount engine; SQL rule tables

## Logic preservation
Define exact precedence. Never scatter discount logic across POS screens

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
- ] rules
[ ] eligibility
[ ] stacking
[ ] precedence
[ ] approval
[ ] audit
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
