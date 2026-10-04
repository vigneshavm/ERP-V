# PLAN 23 - Employee / Salesman

## Objective
Migrate the legacy TextileSoft `Employee / Salesman` capability into the latest React + Node.js ERP without losing functionality or business logic.

## Legacy scope
employee/salesman masters and salesperson reports

## Business logic flow
```text
Employee/salesman → role/commission eligibility → sale attribution → settlement/report
```

## React implementation
React employee workspace; Node employee service; SQL employee/sales attribution

## Node.js implementation
React employee workspace; Node employee service; SQL employee/sales attribution

## Logic preservation
Preserve salesman assignment rules and historical attribution

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
[ ] assignment
[ ] sale attribution
[ ] status
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
