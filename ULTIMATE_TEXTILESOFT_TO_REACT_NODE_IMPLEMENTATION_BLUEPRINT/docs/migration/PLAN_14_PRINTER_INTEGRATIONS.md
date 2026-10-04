# PLAN 14 - Printer Integrations

## Objective
Migrate the legacy TextileSoft `Printer Integrations` capability into the latest React + Node.js ERP without losing functionality or business logic.

## Legacy scope
Zebra, TSC, TVS, Citizen, GODEX and legacy PrintBarCode/PRN paths

## Business logic flow
```text
Print request → printer profile → adapter/template → spool/agent → physical printer → result
```

## React implementation
Node print service + adapters; React printer management; Windows/local print agent where required

## Node.js implementation
Node print service + adapters; React printer management; Windows/local print agent where required

## Logic preservation
Preserve raw PRN behavior where unavoidable but isolate it behind adapter contract

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
- ] Zebra
[ ] TSC
[ ] TVS
[ ] Citizen
[ ] GODEX
[ ] PRN
[ ] agent
[ ] retry
[ ] device mapping
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
