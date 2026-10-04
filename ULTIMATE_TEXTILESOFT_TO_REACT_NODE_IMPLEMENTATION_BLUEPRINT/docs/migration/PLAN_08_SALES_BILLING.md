# PLAN 08 - Sales / Billing

## Objective
Migrate the legacy TextileSoft `Sales / Billing` capability into the latest React + Node.js ERP without losing functionality or business logic.

## Legacy scope
cash/GST/retail/wholesale/credit/gift/electrical/grocery/invoice sales

## Business logic flow
```text
Scan/select item → resolve price/offer/tax → cart → discount/commission → payment → invoice → stock decrement → cash/ledger → print
```

## React implementation
React POS shell + mode configuration; Node sales transaction service; SQL sales header/detail + stock/payment transaction

## Node.js implementation
React POS shell + mode configuration; Node sales transaction service; SQL sales header/detail + stock/payment transaction

## Logic preservation
One sales engine, configurable document modes. Atomic commit must cover bill, stock, tax, payment and commission

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
- ] scan
[ ] pricing
[ ] offers
[ ] tax
[ ] discount
[ ] payment
[ ] stock
[ ] invoice
[ ] hold/recover
[ ] print
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
