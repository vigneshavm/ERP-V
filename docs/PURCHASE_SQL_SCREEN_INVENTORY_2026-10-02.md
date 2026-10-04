# Purchase screen and SQL route inventory — 2026-10-02

This is the screen/route inventory for the purchase workflow list in migration task SQL-047. It identifies mounted SQL paths only; purchase compatibility, keys, financial effects, and reversal semantics are handled by SQL-048 onward.

| Screen | UI path | UI component / module | Mounted SQL API evidence |
|---|---|---|---|
| Register / GRN detail | `/purchase/register` → `/purchase/grn/view/:id` | `PurchaseRegister` → `SqlPurchaseDetails` | `GET /api/purchases` reads register summaries; View calls `GET /api/purchase-entry/:grnNo` (`purchaseEntry.routes.ts` → `sqlPurchase.ts:getPurchase`). Reads `purgrnentry` header fields, `purentrydetails` line fields, and barcode presence in `stockdetails`. Read-only; missing stock links are shown as warnings. |
| New Entry | `/purchase/new` | `PurchaseEntry` | `GET /api/purchase-entry` remains available; POST/DELETE now return an explicit unavailable response pending stock and supplier reconciliation. |
| Express Purchase | `/purchase/express` | `PurchaseExpress` | Route renders the express form; no distinct express API is mounted. |
| Orders | `/purchase/orders` | `PurchaseOrdersModule` | No purchase-order route is mounted in `app.ts`. |
| Order List | `/purchase/orders/list` | `PurchaseOrdersModule` | No purchase-order route is mounted in `app.ts`. |
| New Order / Order Form | `/purchase/orders/new`, `/purchase/orders/:id` | `PurchaseOrdersModule` | No purchase-order route is mounted in `app.ts`. |
| GRN entry | `/purchase/grn/new`, `/purchase/new` | `SqlPurchaseUnavailable` | `POST /api/purchase-entry` remains disabled pending reconciliation; this restriction does not block existing GRN reads. |
| GRN Transfers | `/purchase/grn-transfers` | `GRNTransfer` | No GRN-transfer API is mounted in `app.ts`. |
| Bills | `/purchase/bills`, `/purchase/bills/view/:id` | `Bills` / `BillForm` | `GET /api/purchases` exposes GRN-derived entries; there is no separate supplier-bill API mounted. |
| History | `/purchase/history` | `PurchaseHistory` | No history-specific API is mounted; the purchase list is mounted at `/api/purchases`. |
| Returns | `/purchase/returns`, `/purchase/returns/new`, `/purchase/returns/view/:id` | `PurchaseReturns` / `PurchaseReturnForm` | GET list/detail is mounted; POST/DELETE return an explicit unavailable response pending reconciliation. Ambiguous/unlinked details fail with 409. |
| Debit Notes | `/purchase/debit-notes` | `DebitNotes` | No debit-note API is mounted in `app.ts`. |
| Payments | `/purchase/payments` | `SupplierPayments` | No supplier-payment API is mounted in `app.ts`. |
| Payment Out | `/purchase/payment-out`, `/purchase/payments/add`, `/purchase/payment-out/:vendorId` | `PaymentOut` | No payment-out API is mounted in `app.ts`. |
| Payables | `/purchase/payables`, `/purchase/snapshot` | `OutstandingPayables` / `PayableSnapshot` | No supplier-payables API is mounted; separate purchase list is not a payable ledger. |
| Upload | `/purchase/upload` | `PurchaseUpload` | No upload API is mounted in `app.ts`. |
| Rates | `/purchase/rate-revisions`, `/purchase/rate-revisions/new` | `RateRevisionList` / `RateRevisionForm` | No rate-revision API is mounted in `app.ts`. |
| PDC Vault | `/purchase/cheques-vault` | `UnclearedCheques` | No cheque-vault API is mounted in `app.ts`. |
| Cashflow | `/purchase/inflow-outflow` | `VendorInflowOutflow` | No supplier-cashflow API is mounted in `app.ts`. |

`app.ts` mounts the SQL purchase list (`/api/purchases`), Textilesoft purchase entry (`/api/purchase-entry`), and purchase return (`/api/purchase-returns`) route groups. The rest of the listed purchase routes are either UI-only or still rely on route groups not mounted by the SQL-only application. A rendered page or an existing SQL table does not establish that the page is SQL-backed.

## Live-data and behavior follow-up — 2026-10-02

Read-only aggregates against the configured `SSS_copy` connection showed:

- `purgrnentry`: 17,793 headers and 17,793 distinct GRN numbers; no duplicate GRN number group or blank supplier name was found.
- `purentrydetails`: 81,023 lines and 81,023 distinct barcodes; 81,020 lines have `STATUS IS NULL`, three have `STATUS = '1'`. There are 26 active purchase barcodes with no matching `stockdetails` barcode. The current source data therefore does not reconcile purchase-detail stock to the catalogue on every line.
- `PurchaseReturnHeader`: six rows with six distinct header IDs but only five distinct return numbers; one return number is duplicated. `PurchaseReturnDetails`: eight lines, four of which do not match a `purentrydetails` barcode even after trimming. The read adapter now refuses to combine duplicate-number lines or present unlinked return detail as reconciled.
- `supplierdetail`: 114 rows, no declared primary/unique index, and four duplicate supplier-name groups. The purchase header stores supplier name text; this is not a stable supplier ID.
- Existing `erp.debit_note`, `erp.rate_revision`, `erp.payment_out`, `erp.purchase_payment`, and `erp.supplier_reconciliation` tables exist in the captured schema but have zero rows. `erp.supplier_group_member` is absent. Their presence does not establish linkage to Textilesoft GRNs or account balances.

Because source counts expose stock and return-link exceptions, GRN create/delete and purchase-return create/delete remain disabled in the mounted SQL routes. The purchase register View action now opens a read-only GRN detail page using the existing detail GET route; it displays recorded lines and flags missing barcode matches in `stockdetails`. Existing purchase/return lists remain SQL reads. Purchase Order, GRN transfer, supplier bill, debit note, payment, payable, cheque, rate revision, upload, supplier ageing, and cashflow screens now show a clear unavailable state; matching `/api/purchases/*` unsupported paths return `SQL_PURCHASE_WORKFLOW_UNAVAILABLE`. No payment screen can claim a stored payment from an unmounted route.

The GRN detail read uses existing metadata-verified columns: `purgrnentry.grn_no`, `cmy_name`, `warehouse`, `suplier_name`, `Supplier_City`, `invoce_amount`, `invoce_date`, `entry_date`, `tot_qut`, `totnetamot`, `CGst`; `purentrydetails.sl_no`, `barcode`, `code`, `pname`, `hsncode`, `qty`, `mtr`, `fqty`, `prate`, `amount`, `dis_per`, `gst_per`, `gst_amount`, `net_amount`, `mrp`, `unit_details`, `brand`, `patrn`, `size`; and `stockdetails.barcode` for the link warning. No write or schema change is part of this view. The purchase-return list now labels rows as recorded SQL return records. Its payment state and supplier balance show as untracked/unreconciled; the stored `pay_type` string is not displayed as proof that cash, bank, or supplier balance changed. No SQL write or DDL was performed.

No SQL DDL or business-data write was performed for this inventory.


