# Billing / POS Module — Code Analysis

*Scope: the code behind `http://localhost:3000/pos` — `frontend/src/hooks/{usePOSLogic,usePOSCheckout,usePOSTotals,usePOSUIState,usePOSShortcuts,useBarcodeScanner,pos/*}.ts`, `redux/slices/posSlice.ts`, `redux/thunks/saleThunks.ts`, and the backend `modules/sales/{controllers,routes}` for POS and sales-invoices. Read the actual source and traced every call end-to-end rather than sampling.*

## Headline finding: the live checkout button doesn't reliably reach the backend

This is the one to act on first. Trace what actually happens when a cashier completes a sale:

1. `Pos/*` components call `handleCheckout` from **`usePOSCheckout.ts`**.
2. That builds a `Sale` object client-side and calls `dispatch(processSale(sale))` — defined in **`redux/thunks/saleThunks.ts`**.
3. `processSale` does three things: updates Redux state optimistically (`recordSale`, `deductStock`), and — only if `navigator.onLine` — fires a **fire-and-forget POST to `/sales-invoice/sync`** (i.e. `/api/sales-invoice/sync` under the app's `/api` base), with the only error handling being `console.error`.
4. I read every route file that could serve `/api/sales-invoice/*` (`sales.routes.ts`, mounted in `app.ts` at `/api/sales-invoice`) and its controller (`SalesController.ts`, DI-based via tsyringe). The registered routes are: `GET /summary`, `POST /`, `GET /invoices`, `GET /invoice/:id`, `PUT /invoice/:id/mark-paid`, `DELETE /invoice/:id`. **There is no `/sync` route.** Nothing else in `app.ts` mounts anything at that path either.

So: **every completed sale POSTs to an endpoint that doesn't exist, gets a 404, and that failure is only ever `console.error`'d — never surfaced to the cashier.** The receipt still prints (via `printSaleReceipt`, which runs regardless of whether the sync call succeeded), the cart still clears, and the UI shows a completed sale — but nothing reaches MongoDB. The only trace is Redux state in that browser tab (gone on refresh/logout) and, if the browser happened to be offline at checkout time, a Dexie `offlineSales` row that has no working sync target to reconcile against later either.

There are two backend endpoints that *would* correctly persist a sale, and neither is the one the frontend calls:
- **`POST /api/pos/invoice`** → `PosController.createInvoice` — a fully-built, transactional handler: validates stock per line (`product.stockQty < item.quantity` → 400 before anything commits), decrements stock inside a Mongo session/transaction, generates a server-side sequential invoice number, records the customer's due balance, and writes a `CashbankTransaction` (cash, bank transfer, or split payment) — genuinely solid, ERP-grade logic. Unreachable from the POS screen today.
- **`POST /api/sales-invoice`** → `SalesController.createSalesInvoice` → `SalesService.createInvoice` — the newer, service-layer/DI pattern used elsewhere in the codebase. Also unreachable from the POS screen today.

A third file, `SalesInvoiceController.ts` (12.8 KB, plain exported functions covering summary/list/get/delete/mark-paid), exists in the same folder as `SalesController.ts` but **isn't imported by `sales.routes.ts` at all** — it looks like an earlier version of the same functionality that was superseded by the DI-based `SalesController`/`SalesService` pair and never deleted.

**Net effect**: there are three different "create/sync a sale" implementations in this codebase, and the one the POS screen actually calls is the one that doesn't exist. Before anything else in this module, I'd confirm this against a live network trace (open the browser's Network tab, complete a sale, watch for the 404 on `/sales-invoice/sync`) — if confirmed, this is a same-day fix: point `saleThunks.processSale` at either `/api/pos/invoice` or `/api/sales-invoice`, whichever is meant to be canonical, and give the user a visible error/retry path when the sync fails instead of a silent console log.

## No server-side stock check on the path that's actually live

Because the live checkout path never reaches `PosController.createInvoice` (the one place stock is validated atomically), the POS screen's real safety net for overselling is just `dispatch(deductStock(...))` against client-side Redux inventory state. Two terminals or two browser tabs selling the last unit of the same item at the same moment will both succeed locally — there's no server-side race protection actually being exercised today. This compounds the finding above rather than being separate from it: fixing the sync target also fixes this, since `PosController.createInvoice` already has the right stock-check logic sitting unused.

## Client-generated, collision-prone invoice numbers

`usePOSCheckout.ts`:
```ts
const nextBillNumber = (counter?.lastBillNumber || 0) + 1;
const saleId = `${activeCounterId}-${nextBillNumber.toString().padStart(4, '0')}`;
```
This is computed from Redux-cached `counter.lastBillNumber`, then `incrementCounterBillNumber` bumps that same Redux/tenant state locally. Two devices or browser tabs assigned to the same counter, checking out within the same sync window, can compute the identical `nextBillNumber` before either one's increment propagates — producing duplicate bill/invoice IDs. `PosController.createInvoice`, by contrast, derives its invoice number server-side from the last `Invoice` document at write time inside a transaction — much safer (though even that isn't fully collision-proof under high concurrency without a unique index, worth a follow-up check). Either way, invoice numbering for a billing system should be server-authoritative, not client-computed.

## Confirmed bug: tax-exempt items get taxed anyway

`usePOSTotals.ts`, line 18:
```ts
const gstRate = (item.gstPercentage || 18) / 100;
```
`||` treats `0` as falsy. Any item that is legitimately **0% GST** (tax-exempt goods — common for certain food staples, exports, etc. under GST rules) will silently fall through to the 18% default instead of 0%. This isn't a hypothetical edge case in a billing system — it's a direct tax-calculation correctness bug that would overcharge customers and misstate tax collected. Fix is a one-line null/undefined check (`item.gstPercentage ?? 18`) instead of `||`.

## Silent-failure pattern repeats through the checkout hook

Beyond the sync call itself, `usePOSCheckout.ts` has a few smaller instances of the same "fail silently, keep going" shape:
- The 800ms `await new Promise(resolve => setTimeout(resolve, 800))` at the top of `handleCheckout` has no comment explaining it — reads like an artificial loading-spinner delay rather than anything functional. Harmless, but worth a comment or removal so a future reader doesn't wonder if it's load-bearing.
- The "CX Feedback Trigger" block is a `console.log` stub with a comment (`// In a real system: await FeedbackService.sendRequest(sale)`) — dead/aspirational code shipped inline in the hot checkout path. Low risk, but it's the same "looks done, isn't done" pattern as the sync call, just lower stakes.
- Print-with-fullscreen-restore logic is duplicated near-verbatim between `usePOSCheckout.handleCheckout` and `usePOSLogic.reprintLastBill`/`downloadLastBill` — the checkout hook's own comment acknowledges this ("we don't have direct access to `toggleFullScreen` unless passed in"). Small, but a good candidate to extract into `utils/printService.ts` once someone's in this code for the sync fix anyway.

## What's actually solid here

Worth calling out, since the module isn't all risk:
- **State architecture is cleaner than the rest of the app.** `usePOSCart` and `usePOSSession` are thin, well-scoped wrappers around `posSlice`'s Redux reducers — cart/session state has one source of truth (the Redux slice), read consistently through both hooks and `usePOSLogic`. I initially suspected a split-brain between hook state and Redux state here; tracing it through, it isn't — `setCustomer`, `addToCart`, etc. all read and write the same `state.pos.sessions[activeSessionIndex]`.
- **`usePOSCheckout`'s branch/tenant resolution** (the four-level fallback chain to find an `effectiveBranch`) is defensive in a good way — it's clearly been hardened against exactly the kind of "missing tenant/branch" bugs `docs/log.md` records elsewhere in this codebase.
- **Multi-session/held-bills, barcode scanning, and keyboard shortcuts** are each cleanly isolated into their own hooks with a sensible surface area. `usePOSShortcuts` and `useBarcodeScanner` do both attach global `keydown` listeners simultaneously, which is slightly redundant, but their filtering logic doesn't conflict (barcode buffer only accumulates single printable characters; F-keys and Ctrl-combos pass through untouched) — low-risk, not worth prioritizing.
- **`PosController.createInvoice`**, taken on its own, is genuinely good backend work — transactional, validates stock, handles split payments, updates cashbank and customer dues atomically. The problem isn't its quality, it's that the POS screen doesn't call it.

## Priority order

1. **Verify and fix the checkout sync target.** Confirm via a network trace that `/sales-invoice/sync` 404s in the running app, then point `saleThunks.processSale` at a real endpoint (`/api/pos/invoice` looks like the better-built option) and surface sync failures to the cashier instead of only logging them. This is the one finding in this report that plausibly means **sales are being lost today**, not just at risk.
2. **Fix the GST `0 || 18` fallback** in `usePOSTotals.ts` — one-line change, direct tax-correctness impact.
3. **Move invoice/bill numbering server-side**, reusing the sequencing logic already written in `PosController.createInvoice`, once the sync path is fixed.
4. **Delete or wire up `SalesInvoiceController.ts`** — it's dead code duplicating `SalesController`/`SalesService`; leaving it in place risks a future change being made to the wrong copy.
5. Lower priority: comment/remove the unexplained 800ms delay, finish or remove the feedback-trigger stub, extract the duplicated print/fullscreen logic into `printService.ts`.

---
*Method: full read of `usePOSLogic.ts`, `usePOSCheckout.ts`, `usePOSTotals.ts`, `usePOSUIState.ts`, `usePOSShortcuts.ts`, `useBarcodeScanner.ts`, `pos/usePOSCart.ts`, `pos/usePOSSession.ts`, `redux/slices/posSlice.ts`, `redux/thunks/saleThunks.ts`, `backend/src/modules/sales/controllers/{PosController,SalesController,SalesInvoiceController}.ts`, and every route file in `backend/src/modules/sales/routes/` plus `app.ts`, to trace the checkout call chain end-to-end. POS page *components* (`POSCartGrid.tsx` etc.) were sized but not read line-by-line — flag if you want that pass too.*
