# PLAN 09 - Sales Return

## Objective
Migrate the legacy TextileSoft `Sales Return` capability into the latest React + Node.js ERP without losing functionality or business logic.

## Legacy scope
return bill, invoice return, exchange, barcode return

## Business logic flow
```text
Original sale → validate returnable qty → return/exchange decision → stock increment or replacement sale → refund/adjustment → tax reversal → audit
```

## React implementation
React return/exchange UI; Node return service; SQL transaction linking original sale and return

## Node.js implementation
React return/exchange UI; Node return service; SQL transaction linking original sale and return

## Logic preservation
Support full/partial returns, exchanges, refund methods and original sale traceability

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
- ] full return
[ ] partial
[ ] exchange
[ ] refund
[ ] stock
[ ] tax
[ ] original linkage
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
