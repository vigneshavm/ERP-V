# PLAN 19 - Customer Loyalty / Points

## Objective
Migrate the legacy TextileSoft `Customer Loyalty / Points` capability into the latest React + Node.js ERP without losing functionality or business logic.

## Legacy scope
points, festival, response, relationship/loyalty screens

## Business logic flow
```text
Eligible sale → calculate points → post points ledger → redeem/adjust → customer balance → audit
```

## React implementation
React loyalty workspace; Node loyalty ledger; SQL points transactions and balance

## Node.js implementation
React loyalty workspace; Node loyalty ledger; SQL points transactions and balance

## Logic preservation
Points must be ledger-based, not only mutable balance

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
- ] earn
[ ] redeem
[ ] expiry if applicable
[ ] adjustment
[ ] history
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
