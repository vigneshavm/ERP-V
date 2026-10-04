# POS SQL path audit — 2026-10-02

## Screen-to-storage path

| Layer | Current path |
|---|---|
| UI | `frontend/src/features/pos/POSModule.tsx` renders POS templates and uses `frontend/src/hooks/usePOSLogic.ts`. |
| Counter and billing limits | `GET /api/pos/counters` → `PosSqlController.getPosCounters` → `sqlCounters()` reads `dbo.countername`; `GET /api/pos/billing-limits` → `getBillingLimits()` reads Textilesoft discount controls. |
| Barcode lookup | `usePOSLogic.handleBarcodeScan` checks the loaded catalogue first, then calls `GET /api/inventory/barcode/:barcode` → `InventorySqlController.getItemByBarcode` → read-only Textilesoft item source. The SQL writer resolves the barcode again with `findByKeyDirect` before saving. |
| Server preview | `usePOSCheckout` posts to `POST /api/pos/invoice/preview` → `PosSqlController.previewInvoice` → shared `writePosBillToSql(... previewOnly: true)` calculation. The cashier confirms a server total that differs from the local estimate. |
| Checkout | `usePOSCheckout` builds an idempotency key and expected total, then dispatches `processSale`; `saleThunks.ts` posts `POST /api/pos/invoice` with `Idempotency-Key`. |
| API and writer | `posSql.routes.ts` protects routes; `PosSqlController.createInvoice` validates cart lines, resolves product attributes, applies billing limits/approvals and calls `writePosBillToSql`. |
| SQL transaction | `sqlPosWriter.ts` opens a transaction and inserts one header in `dbo.sales2` plus one line per item in `dbo.salsntry`. It reads counter/company configuration, GST groups, bill history, purchases and sales to number bills, calculate tax and validate stock. |

## Observed existing tables and behavior

- Header/line writes: `dbo.sales2`, `dbo.salsntry`.
- Counter/company values: `dbo.countername`, `dbo.bill_option`.
- Barcode/product/GST resolution: `dbo.purentrydetails`, `dbo.newproduct`, `dbo.gstgroup`.
- Stock availability: aggregates non-cancelled purchase quantities from `dbo.purentrydetails`, sold quantities from `dbo.salsntry`, and supplier returns from `dbo.PurchaseReturnDetails` / `dbo.purretrun`; locks relevant sale rows while the transaction is open. It does not directly decrement a separate stock table.
- Discount controls: `dbo.specialcondion` and configured limits; the writer rechecks limits before commit.
- A successful write returns the Textilesoft bill number and total. Permission and SQL errors roll back and return a failure response.
- Quick Entry has no barcode and bypasses item stock validation. Return mode requires a barcode/source sale and uses the original paid unit value.

## Offline, retry, and duplicate protection

- The SQL checkout path refuses to proceed when the browser is already offline; it asks the cashier to reconnect and preview again.
- If the browser was online but an invoice request fails transiently, `saleThunks.ts` saves the sale to browser IndexedDB `offlineSales` and shows that the bill did not save. `SyncManager` later replays it to the same SQL endpoint.
- The API requires an idempotency key and a confirmed preview total. However, this deployment does not have `erp.sales_idempotency`; `sqlPosWriter` detects that absence and disables durable server-side replay deduplication. If SQL committed but the response was lost, a queued retry can create a duplicate bill. This blocks the exactly-once acceptance criterion.
- `erp.sales_return_allocation` is also absent. The writer can record a negative return line in `dbo.sales2` / `dbo.salsntry`, but it cannot durably link or limit returned quantity by original sale line. Return-allocation accuracy is not proven.
- The frontend updates Redux inventory and finance state and keeps last-bill data locally. Those changes do not establish persistent SQL cash-book or finance entries.

## Retained, simplified, unavailable

**Retained in the SQL POS scope:** barcode sale, counter selection, server-side preview, line and bill discounts subject to SQL limits, supported cash/card/UPI tender fields, GST group resolution, bill numbering, stock validation, SQL bill header/line persistence, and returned bill number.

**Simplified or local-only:** held bills/session state, offline queue, failed-bill list, last-bill details, and Redux inventory/finance updates remain browser-side. Offline-before-checkout fails closed; transient post-submit failures may queue for replay.

**Unavailable or not persisted by the SQL writer:** customer-linked credit, loyalty earning/redemption, cash-book side effects, payment allocation, durable retry idempotency, and return-to-sale allocation. The controller ignores customer/loyalty fields for this initial SQL scope. Wholesale channel and MRP-pending fields sent by some callers are not consumed by this SQL controller.

## Conclusion

The POS has an active SQL write path and is not Mongo-backed along the mounted `/api/pos` invoice route. It is **SQL partial / blocked for full acceptance**: `erp.sales_idempotency` and `erp.sales_return_allocation` are missing, and the persistent effects listed above are outside this writer. No live bill was written during this audit; no SQL DDL or test was run.

## Follow-up checks — 2026-10-02

- **Existing schema compatibility:** the read-only `SSS_copy` snapshot contains the columns referenced by the POS writer in `dbo.sales2` and `dbo.salsntry`, and the lookup/configuration columns used from `dbo.purentrydetails`, `dbo.newproduct`, `dbo.countername`, `dbo.bill_option`, `dbo.gstgroup`, and `dbo.specialcondion`. Barcode stock-source columns are present in `dbo.stockdetails`, `dbo.purentrydetails`, `dbo.salsntry`, `dbo.PurchaseReturnDetails`, and `dbo.purretrun`. Header/line insert code filters optional fields against discovered table columns. This confirms column presence only; it does not prove live bill values or accounting totals are correct.
- **No Mongo catalogue dependency on the active path:** the mounted SQL POS controller resolves barcode products through `findByKeyDirect` in `sqlItemSource.ts`; the read API uses `InventorySqlController.getItemByBarcode`. Static inspection of the active POS route, controller, item source, and writer found no Mongoose model read/write, Mongo `ObjectId`, Mongo mirror, or Mongo fallback. A comment mentioning Mongo ObjectId documents that it is deliberately not used.
- **Checkout side effects:** the controller explicitly sets `hasCustomer = false`, ignores customer/loyalty fields, and routes the tender through `posTenders`; customer credit therefore is not a supported/persisted checkout mode. Redux finance updates and local inventory updates are client state only. The SQL response says the bill is saved to the shop database; it does not claim customer points or cash-book entries were persisted.
- **Representative bill reconciliation remains unverified:** no production/sample bill rows were read or written for this follow-up. Therefore bill total/GST/discount and stock reconciliation against existing bills is not accepted. Retries also cannot be reconciled to exactly-once behavior while `erp.sales_idempotency` is absent, and return quantity linkage remains unverified without `erp.sales_return_allocation`. No DDL or tests were run.

## Sales register and invoice detail follow-up — 2026-10-02

- `/api/sales-invoice` is mounted to `salesSql.routes.ts` in the SQL-only app. The register list, invoice detail, and summary read `dbo.sales2` / `dbo.salsntry`; SQL identifiers use `sql:<sysidandbill>`. The list now returns a SQL page envelope with bounded page size, total count, search, payment-status, and customer filters. Payment status is derived from the legacy bill total and `s_credit_amt`; customer filtering uses `sales2.cus_card` against the SQL customer card-number ID. Cross-checking historical `cus_card` values against customer master rows remains outstanding, especially legacy IDs that fall back to `sl_nu`.
- Invoice detail maps sale lines by `salsntry.systemidbill = sales2.sysidandbill` and returns GST, quantities, rates, discounts, and line totals. The SQL endpoint uses the `{ success, data }` shape expected by frontend reducers; summary data is unwrapped by the Redux thunk. Customer dues are not represented by this summary and now display as unavailable instead of a fabricated ₹0.
- Receipt reprint now reloads by the saved SQL invoice `_id` (the SQL bill key) rather than the printed invoice number. Business profile and branch context continue to come from the mounted SQL-only endpoints.
- SQL invoice rows are read-only in the register/detail UI: delete, mark-paid, and edit are unavailable because the SQL route group exposes no corresponding safe reversal/payment-allocation transaction. `/sales/new` now explains that free-form customer-credit invoice entry is unavailable and directs users to POS for supported counter billing; the old Mongo-shaped form was removed from the route registry. The POS route does not claim customer credit or allocation support.
- No representative bill records were reconciled in this pass, so financial totals and the `cus_card` relationship still require live-data verification. No database writes, DDL, or tests were run.

## Estimates, sales orders and delivery challans — 2026-10-02

- The `SSS_copy` schema snapshot contains `erp.estimate`, `erp.sales_order` and `erp.delivery_challan`; all have primary keys and each reported zero rows. The legacy candidate tables `dbo.salesOrder2`, `dbo.SALESORDER_SALBILL`, `dbo.SALESORDER_HEADER` and `dbo.SALESORDER_DETAILS` also reported zero rows.
- Estimate fields include `estimate_no`, `customer_id`, `items`, subtotal/discount/total, status and validity date. Sales orders contain `customer_id`, dates, `items`, subtotal/tax/discount/total, status flags, `delivery_challan_ids` and `invoice_ids`. Challans contain `customer_id`, dates, `items`, `sales_order_id`, delivery details, status, `converted_to_invoice_id` and `converted_at`.
- These document lines and order document links are JSON fields, not relational line/link tables. The only declared FK among the three tables is `delivery_challan.sales_order_id -> sales_order.id`; there are no declared customer, item, estimate conversion, or invoice-link FKs. Empty snapshots also prevent verifying how the existing records use these fields, item/customer key compatibility, partial fulfillment, conversion, and reversal.
- The former create/register/detail screens used controllers that mixed those ERP tables with Mongo-backed item/customer/invoice models. They were not mounted by the SQL-only app. Their direct routes and module-renderer entries now show an unavailable state, and the unmounted Mongo-mixed controllers, routes, adapters, and UI components have been removed after reference searches found no other callers. No substitute SQL writer was enabled because field presence alone does not establish safe lifecycle behavior.
- Estimates, sales orders and challans remain explicitly unavailable pending populated data and end-to-end lifecycle reconciliation. No SQL table was created or altered, no business records were written, and no tests were run.

## Receipts, customer credit and sales report sources — 2026-10-02

- The SQL customer directory adapter exposes `card_number` as the customer ID and falls back to `sl_nu`; sales invoice filtering compares `dbo.sales2.cus_card` with that ID. The schema snapshot declares no FK between bills and customer master and does not establish uniqueness/immutability across the primary and fallback keys. No live join sample was inspected, so customer-linked collection and credit allocation remain blocked.
- `erp.payment_in` exists with `customer_id`, JSON `payment_methods` and `allocated_invoices`, credit/excess amounts, and `deposit_account`, but had zero rows in the snapshot and no declared FKs. The old payment-in controller also queried Mongo Customer, Invoice, CashbankTransaction and BankAccount models. This cannot establish a reconciled SQL receipt, partial allocation, account ledger effect, or reversal.
- Existing sales headers expose `WholeSaleStatus` and `SBillStatus`, and legacy `InvoiceMRPMainTemp` / `InvoiceMRPSubTemp` objects exist. However, the active SQL writer and read route do not implement a verified MRP-pending lifecycle; there is no verified link from those temporary rows to persisted sales bills. Customer receipts, credit, dues mutation, and MRP finalization therefore render unavailable in SQL-only mode.
- SQL sales report routes read `dbo.sales2` headers for day-bill, daily trend, sales intelligence, tender split and finance sales reports; product/category/brand/counter/hour breakdowns read `dbo.salsntry`, with product/brand labels supplemented from `dbo.stockdetails`. They use the bill/line `date` fields, and hourly grouping uses `datetime`. The report SQL excludes rows with `status = '1'` as cancelled. Several `status <> '1'` predicates also omit NULL status rows under SQL Server semantics; the diagnostic `sqlStatusDebug` exists to inspect this before correcting the scope. Report code does not explicitly link return lines back to original sales, so net return treatment and return reconciliation are not proven. These limitations are now recorded as part of the SQL report scope; no representative report totals were reconciled in this pass.
- Menu and route entry points for payment-in, customer credit, dues, and MRP pending now show an explicit unavailable state. They do not call the dormant Mongo-backed payment forms or MRP finalizer. No SQL table was created or altered and no data was written.

## Wholesale billing and inventory catalogue — 2026-10-02

- The existing SQL bill schema has `sales2.WholeSaleStatus`, but the active POS writer does not set it or apply `newproduct.WR_Rate`. The SQL invoice mapper currently labels rows as `RETAIL`; the separate wholesale bill and report endpoints are from the unmounted Mongo sales router. Therefore the old wholesale sales form could save through POS while silently losing its channel and wholesale pricing semantics. Wholesale counter-to-sale entry, bill view and sales/stock reports now render unavailable. The menu's wholesale purchase-entry path is separate and was not changed in this pass.
- The complete inventory screen/API disposition is recorded in `INVENTORY_SQL_SCREEN_AUDIT_2026-10-02.md`. Supported SQL reads include the item catalogue, barcode lookup, stock summaries/movements/ageing and low/dead-stock reports. Product Master writes existing `dbo.newproduct` and existing Textilesoft product masters. Category CRUD, batch expiry/price changes, barcode label persistence, combo offers, serialized units, damage/loss entry, stock transfer, import/export and reprint have no verified mounted SQL-only transaction routes and are visibly unavailable.
- The configured item reader resolves catalogue/stock from `dbo.stockdetails`, joins product category/unit from `dbo.newproduct`, and derives remaining quantity from `dbo.salsntry` (status filter), `dbo.purretrun` and `dbo.PurchaseReturnDetails`. IDs in this read view use barcode. The read-only schema snapshot shows `stockdetails` and `newproduct` have no declared primary keys, so the adapter's business-key behavior still needs representative-row validation; stock adjustments outside the listed source rows are not covered.
- Removed the SQL-to-Mongo item mirror/sync service, CLI, manual sync endpoint and restore-triggered catalogue sync. The SQL-only app mounts `InventorySqlController`, which reads Textilesoft SQL directly; the unused mirrored-item lookup helper is removed. Existing SQL schemas and data were not changed.

## Invoice entry and returns follow-up — 2026-10-02

- **General invoice entry:** the form has customer-linked dues, due dates, free-form product lines, shipping and invoice-number behavior that the existing POS SQL contract does not provide. The form was removed from the route/module registry; `/sales/new` now states the limitation and links to counter POS. The active SQL-only app mounts `salesSql.routes.ts` (GET only) and the POS SQL writer; the Mongo invoice POST route is not mounted or allowed by the SQL-only route gate.
- **Enabled POS fields:** the schema snapshot contains the existing `sales2` bill number, total, bill discount/less, GST buckets, counter, user, customer and payment columns; `salsntry` contains line barcode, qty, amount, line discount, GST, source bill key and product fields. The writer uses those existing columns for supported counter sales and derives stock from existing purchase/sales/return rows. It deliberately does not enable customer credit, loyalty, payment allocation or free-form item entry. Field presence is verified; live sample bill values and exact business reconciliation remain covered by SQL-017.
- **Return screens:** removed the Mongo-backed return-entry/history components from active routes and module registry. Those screens now state that SQL return history/entry is unavailable. POS Return mode's existing `ReturnBillPicker` already calls `GET /api/pos/return-sources`; the SQL writer checks barcode sales, remaining aggregate quantity, original paid unit value and GST. It fails closed because it also requires verified `erp.sales_return_allocation` columns, which are absent from the current schema snapshot.
- **Return allocation:** source-line linkage and return history cannot be completed without the existing allocation table. `erp.sales_return_allocation` is absent from the 2026-10-02 snapshot, so SQL-026 and SQL-027 remain blocked. No table was created or altered; no bill/return transaction or tests were run.
