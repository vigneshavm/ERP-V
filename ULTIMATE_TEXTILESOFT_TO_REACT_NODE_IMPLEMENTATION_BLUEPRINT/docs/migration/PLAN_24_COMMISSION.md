# PLAN 24 - Commission

## Objective
Migrate the legacy TextileSoft `Commission` capability into the latest React + Node.js ERP without losing functionality or business logic.

## Legacy scope
commission/range/days/PCS/section/salesman calculations

## Business logic flow
```text
Sale line → determine salesperson/agent → resolve commission rule → calculate → post commission → settlement
```

## React implementation
React commission configuration/report; Node commission engine; SQL commission rules/ledger

## Node.js implementation
React commission configuration/report; Node commission engine; SQL commission rules/ledger

## Logic preservation
Commission calculation must be deterministic and preserve historical rule snapshot

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
- ] rule modes
[ ] salesperson
[ ] agent
[ ] calculation
[ ] settlement
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
