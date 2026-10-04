# PLAN 04 - Product Attributes

## Objective
Migrate the legacy TextileSoft `Product Attributes` capability into the latest React + Node.js ERP without losing functionality or business logic.

## Legacy scope
brand, pattern, size, color, style, design, model, fashion, department/floor/rack attributes

## Business logic flow
```text
Attribute master → assigned at barcode/SKU level → used in pricing, stock, POS and reports
```

## React implementation
React attribute masters + selectors; Node attribute service; SQL normalized masters/relations

## Node.js implementation
React attribute masters + selectors; Node attribute service; SQL normalized masters/relations

## Logic preservation
Preserve textile-specific attributes and their historical transaction snapshots

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
- ] all attributes
[ ] dependency mapping
[ ] barcode assignment
[ ] history
[ ] filters
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
