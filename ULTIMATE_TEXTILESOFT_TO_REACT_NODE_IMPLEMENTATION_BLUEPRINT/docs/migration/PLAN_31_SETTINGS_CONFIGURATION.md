# PLAN 31 - Settings / Configuration

## Objective
Migrate the legacy TextileSoft `Settings / Configuration` capability into the latest React + Node.js ERP without losing functionality or business logic.

## Legacy scope
CommonSettings, printer settings, system options, account date, operational configuration

## Business logic flow
```text
Configuration master → validation → effective date/context → module consumes configuration
```

## React implementation
React settings; Node configuration service; SQL versioned configuration tables

## Node.js implementation
React settings; Node configuration service; SQL versioned configuration tables

## Logic preservation
Centralize configuration access and cache safely; avoid direct config reads from UI

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
- ] settings
[ ] effective dates
[ ] permissions
[ ] printer config
[ ] business date
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
