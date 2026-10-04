# PLAN 15 - Combo / Offers

## Objective
Migrate the legacy TextileSoft `Combo / Offers` capability into the latest React + Node.js ERP without losing functionality or business logic.

## Legacy scope
ComboOfferEntry/Edit, Single/Multi MRP, SuperCombo, barcodewise combo, combo stock

## Business logic flow
```text
Define combo → components/required quantities → price tiers/offer MRP → match eligible scanned components → allocate combo → sale/stock/tax → return
```

## React implementation
React combo master + POS combo matcher; Node combo service; SQL normalized combo tables + allocation ledger

## Node.js implementation
React combo master + POS combo matcher; Node combo service; SQL normalized combo tables + allocation ledger

## Logic preservation
Explicitly decide virtual vs physical combo barcode. General matching uses component availability and required set quantities

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
[ ] components
[ ] qty rules
[ ] price tiers
[ ] matching
[ ] allocation
[ ] stock
[ ] return
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
