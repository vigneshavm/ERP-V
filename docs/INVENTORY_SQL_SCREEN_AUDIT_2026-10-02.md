# Inventory SQL screen audit — 2026-10-02

This is a source and captured-schema review for the SQL-only app. It does not prove live-row reconciliation. The app mounts `inventorySql.routes.ts` at `/api/inventory` and the direct product-master/attribute routers; the old Mongo inventory router is not mounted.

| Screen | SQL/API path | Disposition |
|---|---|---|
| Items | `GET /api/inventory` → `InventorySqlController.listItems` → mapping-driven `dbo.stockdetails`, product lookup in `dbo.newproduct` | Available read-only. Barcode is the returned item key. |
| Variant Search | Same item-list API with search/category/brand/size/color filters | Available read-only; no shelf, reserved-stock, or Mongo variant fallback is exposed. |
| Product Master | `/api/product-master` CRUD → existing `dbo.newproduct`, `progroup`, `prosubgroup`, `prounit`, `gstgroup`, company and product-attribute masters | Available on existing SQL columns. Product rows are per company; adapter coordinates code/company and reference checks because `newproduct` has no declared primary key in the snapshot. |
| Aged Stock | `/api/inventory/stock-age`, `/stock-age` buckets and aging report → SQL stock/purchase/sales sources | Available as a report; no inventory mutation. Values depend on the configured lot and movement mapping. |
| Stock summary / low stock / stock status / dead stock / city / rack / movement / barcode audit | `inventorySql.routes.ts` → `InventorySqlController` and SQL report adapters | Available as SQL reads with each report's defined shop-table scope. They do not include unmodeled movements. |
| Categories | No mounted `/api/inventory/categories` SQL CRUD path. Product group tables exist, but the category UI contract is not mapped to them. | Unavailable. |
| Batches and batch-price update | Existing lot/price columns are visible in legacy tables, but no verified SQL-only write API covers the screen's lifecycle. | Unavailable. |
| Barcodes / label generation | `dbo.Barcode` exists, but no mounted SQL-only label generation/print API or lifecycle was verified. | Unavailable. |
| Combo offers | `dbo.BarcodewiseComboOffer` exists in the snapshot with zero rows; eligibility, redemption, bill linkage and reversal are not verified. | Unavailable. |
| Serial / IMEI | Existing barcode data has IMEI columns, but no active SQL-only serial lookup, sale linkage, duplicate prevention or return/reversal contract was verified. | Unavailable. |
| Damage / loss | `dbo.StockDamage` exists (3 snapshot rows); `dbo.StockMissing` exists. No mounted SQL-only entry/update/reversal route was found. | Unavailable. |
| Stock transfer | `dbo.MaterialTransfer` and `dbo.StoreTransfer` exist with zero snapshot rows and no declared primary keys; no mounted SQL-only transaction/reversal route was found. | Unavailable. |
| Import, export, reprint | No compatible mounted SQL-only operation was found for these screens. | Unavailable. |

## Catalogue and stock mapping limits

The configured catalogue view selects barcode/product fields from `dbo.stockdetails` and looks up category/unit in `dbo.newproduct`. The SQL adapter groups the lookup by product code before joining, so duplicate `newproduct.code` values do not multiply stock rows. The adapter uses barcode for the displayed item identity. Derived remaining stock subtracts non-cancelled sale-line quantities and purchase returns from stock-source quantities; the mapping does not account for damage, transfer or serial-unit movements.

The SQL-only route graph has no Mongo read fallback for item listing or barcode lookup. The old Mongo catalogue sync/mirror service, CLI, manual endpoint and restore auto-sync were removed. No DDL, database write, or test was run for this audit.

## Live value and mutation follow-up — 2026-10-02

Read-only aggregate queries were run against the configured `SSS_copy` connection using the same read-only SQL pool as the item adapter. No barcode, product name, customer, or supplier values were emitted.

- `dbo.stockdetails` has 80,997 rows; all 80,997 barcodes are nonblank and distinct. `qty`, `mrp`, and `gst_per` are nullable `varchar` columns. In the current rows, quantity and MRP are non-null, nonnegative, and parse as numbers; quantity ranges from 1 to 680 and MRP from 1 to 12,250.
- The product lookup has 224 rows and 114 distinct non-null codes. There are 110 duplicate-code groups (maximum two rows per code); duplicate rows agree on category and unit. Across the stock lookup, seven categories and two units occur: `PCS` and `MTR`. The adapter maps those unit spellings to `pcs` and `m`.
- The observed `gst_per` values are 0, 1, 2, 5 and 12; 24 rows do not parse as a numeric rate. The item transformer accepts standard slabs 0/5/12/18/28 and leaves nonstandard/unparseable values unset. Do not treat those 24 rows or the 1/2 values as verified tax rates; GST correctness needs a source rule or bill reconciliation before tax-sensitive use.
- Column names and value ranges support the current interpretation of barcode, lot quantity, MRP, cost rate, GST rate, category and unit, but they do not prove the historical business meaning of every field. In particular, no sample sale/purchase was reconciled here to establish tax or valuation semantics.
- Existing damage/missing/transfer tables and their snapshot counts are listed above. There is no mounted SQL-only mutation route for damage, loss, transfer, serial/IMEI or combo schemes. The prior barcode-cancel POST has been disabled until its cancellation/reversal lifecycle is verified. The inventory SQL router now returns an explicit `SQL_INVENTORY_OPERATION_UNAVAILABLE` response for unsupported paths and methods.
- The Items, Products and Variant Search entry points now use the read-only SQL-backed search component instead of the legacy inventory manager with Mongo-shaped write controls. Category, batch, barcode, combo, serial, damage/loss, transfer, import, reprint and export entry points remain visible as unavailable. Product Master and explicitly mounted SQL reports remain available.

No table was created or altered and no business data was written.
