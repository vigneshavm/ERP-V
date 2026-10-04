# PLAN 32 - Reports / Export / Sharing

## Objective
Migrate the legacy TextileSoft `Reports / Export / Sharing` capability into the latest React + Node.js ERP without losing functionality or business logic.

## Legacy scope
Excel/export/share/email/WhatsApp/export variants

## Business logic flow
```text
Report result → authorization → format conversion → file/share target → audit
```

## React implementation
React export actions; Node export service; SQL report repository; connector/integration adapters where required

## Node.js implementation
React export actions; Node export service; SQL report repository; connector/integration adapters where required

## Logic preservation
Exports must use the same report query and permission model as on-screen reports

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
- ] Excel/CSV
[ ] PDF
[ ] share
[ ] email/WhatsApp where applicable
[ ] audit
[ ] large-export handling
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
