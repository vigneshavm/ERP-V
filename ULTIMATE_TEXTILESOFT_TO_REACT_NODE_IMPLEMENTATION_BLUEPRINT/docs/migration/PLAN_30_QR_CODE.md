# PLAN 30 - QR Code

## Objective
Migrate the legacy TextileSoft `QR Code` capability into the latest React + Node.js ERP without losing functionality or business logic.

## Legacy scope
QR generation/scanning/report or payment/product QR functions

## Business logic flow
```text
Business identifier → QR payload → generate/scan → validate → link to business record
```

## React implementation
React QR component; Node QR service; SQL stores only durable payload/relationship where required

## Node.js implementation
React QR component; Node QR service; SQL stores only durable payload/relationship where required

## Logic preservation
Define QR payload contract and version it

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
- ] generate
[ ] scan
[ ] validate
[ ] version
[ ] security
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
