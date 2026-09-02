# End-to-End Flow: B2B Procurement & B2C Billing

*Companion report to the [Procurement & Billing Flow diagram]. Traces both flows the user described — purchase from vendor → receive → track purchase date → check credit → pay vendor (B2B), and select product → bill → reduce stock (B2C) — against the actual source, file by file.*

## B2B — purchase from a vendor

### The working path: Direct Purchase Entry

`frontend/src/hooks/usePurchaseOrders.ts` → `POST /api/purchases` → `backend/src/modules/purchase/controllers/PurchaseController.ts::createPurchase`. When the purchase is submitted with `status: 'COMPLETED'`, one transactional handler does all of the following in a single Mongo session:

1. **Credit gate, before anything is written.** Unless the user is an owner/co-owner/admin or a `paymentPromiseDate` override is given, it blocks the purchase with HTTP 403 if the supplier has any overdue `Bill`, or if outstanding balance plus this purchase would exceed `supplier.creditLimit`.
2. **Items added to inventory** via `InventoryService.addStock()` — this recalculates weighted-average cost, appends a batch record (batch number, expiry, supplier), and writes a `StockLog` entry of type `PURCHASE`. This is the real, audited stock-in path, and the B2B side uses it correctly.
3. **A `Bill` is opened** with `dueDate = purchase.date + supplier.creditPeriod` — this is where "check credit date" actually lives: the due date is derived per-supplier, not hardcoded, and every future purchase re-checks against outstanding bills past that date.
4. **A double-entry `JournalEntry`** is posted (Purchase Account debited, supplier credited, CGST/SGST or IGST split by comparing tenant state to supplier state) — wrapped in its own try/catch that logs but doesn't roll back the purchase if ledger posting fails, which is worth tightening later but isn't the priority.

Purchase-date tracking per item is a separate, working read endpoint: `GET /api/purchases/history/item/:itemId` returns the last 10 completed purchases of that item with date, vendor, quantity, and rate — exactly the "track purchase date from vendor" requirement.

### Paying the vendor

`PaymentOutController.createPayment` (backend) is solid: it allocates one payment across specific bills (partial or full), updates each `Bill.paidAmount`/`paymentStatus`, and — unless the payment is a future-dated cheque — immediately posts a `CashbankTransaction` (money out) and decrements the bank account balance. Cheques start `pending` and only move money when `updatePaymentStatus` clears them; a bounced cheque correctly reverses its bill allocations. This is the best-built corner of the whole B2B/B2C trace.

### Where it breaks: the PO → GRN → Bill pipeline isn't real

The frontend sitemap implies a three-stage flow — Purchase Order, then a separate Goods Received Note when stock physically arrives, then a Bill. The backend doesn't support that:

- The `Purchase` Mongoose schema's `status` enum is only `DRAFT | COMPLETED | CANCELLED | RECEIVED`. The frontend's `PurchaseOrder` type carries an entirely different vocabulary — `Draft, Pending, Approved, Partial Receipt, Fully Received, Converted` (see `usePurchaseOrders.ts`, `useGRNForm.ts`) — that has no mapping onto the backend enum at all.
- `updatePurchase` (the handler behind editing/approving a PO) is a bare `Purchase.findByIdAndUpdate(req.params.id, req.body, { new: true })` — no `runValidators`, no re-run of the stock/bill/credit logic that lives only inside `createPurchase`. Approving a PO, or moving it through "Partial Receipt," changes a field in MongoDB and nothing else.
- **The GRN screen doesn't call the backend at all.** `useGRNForm.saveGRN()` does `dispatch(addGRN(finalGRN))` and navigates away — no `api.post(...)` anywhere in the hook. `useGRNData.ts` reads `state.purchase.grns`, which only that same in-memory dispatch ever populates. Receiving goods against a PO through the dedicated GRN screen never calls `InventoryService.addStock()`, never touches `Item.stockQty`, and disappears on refresh.
- The list that's supposed to hydrate available POs on page load, `usePurchaseSync.ts`, calls `getTable('purchase_orders', ...)` — and the generic data-source layer's endpoint map has no `'purchase_orders'` key, so it silently returns `[]` with a console warning rather than the working `GET /api/purchases`.

Net effect: the only way a purchase reliably reaches inventory and opens a bill is the single-step "Direct Purchase Entry" screen, which is really `createPurchase` called once with `status='COMPLETED'`. The separate PO-approval and GRN screens exist, look complete, and don't move any of this data.

## B2C — customer buys, stock should reduce

Traced in full in the earlier billing-specific pass; summarized here against the flow the user described.

- **Select product → bill**: works. `usePOSLogic`/`usePOSCheckout` build the cart and totals correctly (aside from the `item.gstPercentage || 18` bug that mis-taxes 0%-GST items) and the receipt prints regardless of what happens next.
- **After billing, stock should reduce**: this is where it breaks. `usePOSCheckout` dispatches `processSale` (`redux/thunks/saleThunks.ts`), which does two things: `dispatch(deductStock(...))` — Redux-only, visible on screen, gone on refresh — and `api.post('/sales-invoice/sync', ...)`, fire-and-forget. No route named `/sync` exists under `/api/sales-invoice` (confirmed by reading every file `sales.routes.ts` imports and the full `app.ts` mount list) — the call 404s and the only handling is `console.error`.
- **The correct endpoint exists and isn't called.** `PosController.createInvoice` (`POST /api/pos/invoice`) validates stock per line, decrements it inside a Mongo transaction, and posts a cashbank entry — but does the decrement with a raw `product.stockQty -= item.quantity` rather than going through the same `InventoryService` the purchase side uses, so it skips batch/FIFO tracking and doesn't write a `StockLog` entry.
- **The properly-built stock-reduction method is an orphan.** `InventoryService.reduceStock()` — FIFO batch consumption, insufficient-stock check, `StockLog` entry of type `SALES` — is exactly the sales-side counterpart to the purchase side's `addStock()`. Nothing calls it. Neither `PosController.createInvoice` nor `SalesService.createInvoice` (the other real, DI-based invoice endpoint at `POST /api/sales-invoice`) uses it — and `SalesService.createInvoice` doesn't touch inventory at all, it only saves the invoice with GST breakdown.

## What this means practically

The B2B side has one real structural gap (the GRN screen is disconnected) sitting on top of otherwise well-built, transactional logic. The B2C side has a more urgent problem: the path the checkout button actually calls doesn't reach the database at all, and even the two paths that do work don't reduce stock the same correct way the purchase side adds it. Fixing B2C is the higher priority — it's revenue-affecting and currently silent; the diagram's closing panel has the one-line fix for each side.
