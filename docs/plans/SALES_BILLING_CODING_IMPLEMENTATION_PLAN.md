# Sales Billing — Coding Implementation Plan (Textilesoft → React + Node, same SQL Server DB)

**Branch:** `team/legacytomodern` (SQL Server only, `SSS_copy` / `SSS`, no MongoDB)
**Module:** Plan 08 – Sales Billing (retail cash/GST counter billing first)
**Sources read:** `TEXTILESOFT 17.07.2025` (precompiled site: `.aspx` markup + `GstSalesentryNewsaleAllJS/*.js`), `08_sales_billing.md`, `SQL_TEXTILESOFT_GAP_AUDIT_2026-09-30.md`, ERP code `sqlPosWriter.ts`, `sqlPosRules.ts`, `sqlDbAccess.ts`, `PosController.ts`.

## 0. Read this first — what the source can and cannot tell us

| Fact | Consequence |
|---|---|
| The legacy site is **precompiled**. There is no VB/C# source, only `bin/App_Web_*.dll`. | Server-side logic (bill numbers, settings, the SQL inserts) is **not readable as code**. Only the browser-side JS and the page markup are. |
| The browser JS (`calculation.js`, `retriveldata.js`, `salesscript.js`) holds the **pricing, discount, GST and total rules**. | Section 2 is extracted from it and is **verified**. Everything on persistence is **inferred** from the DB rows and the earlier analysis. |
| `calculation.js` is ~400 KB because the same code is pasted three times (BILL1, BILL2, BILL3 working bills). | One implementation covers all three. |
| Limits (max bill discount %, max less, max product discount %) are filled in by the server into hidden field `TextBox53` as `a/b/c/d/e`. | Where that setting is stored is **unknown** until the DB is inspected (V-2). |
| The sandbox cannot reach SQL Server. | Every "check against the DB" item is a script/query for **your** machine (section 9). Nothing in this plan was run against `SSS_copy`. |

**Confidence tags used below:** `[JS]` read in legacy JavaScript · `[DOC]` from `08_sales_billing.md` (compiled-SQL strings) · `[ERP]` read in current ERP code · `[ASSUME]` needs verification.

## 1. What the ERP already does (do not rebuild)

| Area | State today | Where |
|---|---|---|
| Bill write | Writes `dbo.sales2` (header) + `dbo.salsntry` (lines) in one transaction, legacy key `sysidandbill = systemidbill`, legacy numbers (`A96`, `K`+mode, counter serial + DDMMYY + billno, company series) | `sqlPosWriter.writePosBillToSql` |
| Numbering safety | `MAX(billno)+1` under `UPDLOCK,HOLDLOCK`; refuses a counter the desktop billed on today unless listed in `TEXTILESOFT_POS_SHARED_COUNTERS` | same |
| Stock | Checked as received − sold − returned-to-supplier, rows locked; **no `stockdetails` update** (stock = sum of `salsntry`) | same, `[ERP]` |
| GST | Per line from product GST group; slab groups; GST-inclusive amounts | `sqlPosRules.saleGstRate` |
| Discount | Bill discount in **rupees**, shared across new items in proportion; GST on discounted amount | `sqlPosRules.shareDiscount` |
| Tenders | cash/card/UPI/credit; split; unpaid → credit (needs customer); negative total = refund | `sqlPosRules.posTenders` |
| Exchange | Negative qty matched to the original sale by barcode | `sqlPosWriter.returnLine` |
| Counters | Read from `dbo.countername` | `sqlCounters` |
| Approvals | ₹0 / above-MRP price and large discount need manager | `PosController.createInvoiceInSql` |
| Returns | `sales2Return`, `salbillReturns`, `salsntryReturn` | `sqlSalesReturn.ts` |

**Still on MongoDB inside the SQL bill path (breaks the SQL-only branch):** customer lookup/auto-create, loyalty earn/redeem, customer dues, cash-book entries (`PosController.createInvoiceInSql`, the `mongoose.startSession()` block, ~lines 372–502), plus `Tenant.misConfig` (discount caps) and `User.maxDiscountPercent`.

## 2. Legacy billing logic extracted from the JavaScript

All amounts are rupees to 2 decimals unless stated. `mrp` is the **GST-inclusive** selling price on the line.

### 2.1 Line (`gdmtr()`, `mrp()`, `biddis()`) `[JS]`

| # | Rule |
|---|---|
| L1 | `mtrFactor` = entered metres for `MTR` items (blank → 1); `1` for `PCS`. A PCS line clears the metres field. |
| L2 | `amt = mtrFactor × qty × mrp` (gross, GST-inclusive). Zero qty/metres and empty qty are rejected; qty may be **negative** (item brought back). Metres/qty accept one decimal point only. Qty field length < 5 characters. |
| L3 | Product discount: if `pdis%` is entered → `pdisAmt = amt × pdis/100`, `net = amt − pdisAmt`. Otherwise `net = amt`. A `pdis%` above the configured max product discount (`TextBox53`, 5th value) is reset to empty. |
| L4 | Effective discount for rate/GST: `d = pdis%` if the line has one, else the **bill discount %** (only if the line is eligible, L6), else 0. |
| L5 | Ex-GST unit rate: `rate = round2( round2(mrp × (1 − d/100)) × 100 / (100 + gst%) )` — rounded to 2 decimals **before** it is multiplied by qty. |
| L6 | Bill discount % applies **only** to lines with no product discount (empty or 0) and whose combo status is not `FREE`, `COF` or `DIS`. Per-line share: `lineLess = amt × bdis%/100` (stored in `TextBox40`; negative on returned lines because `amt` is negative). |
| L7 | Taxable value `gstcrossamt = rate × qty × mtrFactor`; `gst = gstcrossamt × gst%/100`; `cgst = sgst = gst/2`. **GST is computed on the taxable value after discount, not on `net`.** |
| L8 | GST slab: if the product's GST group has price slabs (`gst`, `gst1..3` with `sales_from_amount`/`sales_to_amount` ranges), the rate is picked by comparing the **unit price including GST after the bill discount** (`SubMrp = mrp − mrp × bdis%/100`) to the slab range. `[JS]` — note the ERP's `saleGstRate` compares the ex-GST price instead (see V-3). |
| L9 | Per-line `FREE`/`COF`/`DIS` statuses (combo/offer lines) are skipped by the bill discount; `DIS` lines compute GST by extracting it from the line amount. |

### 2.2 Bill totals (`biddis()`, `cal()`) `[JS]`

| # | Rule |
|---|---|
| B1 | `gst5/gst12/gst18/gst28` = sum of line `gst` by the line's GST %. |
| B2 | `salesQty` = sum of positive qty; `returnQty` = sum of negative qty; `totalMtr` = Σ metres × qty for positive MTR lines. Net is split into positive, negative and product-discounted buckets (`pnetamt`, `nnetamt`, `pdnetamt`). |
| B3 | `bill net = Σ line net − Σ lineLess − bill less(TextBox18) − round-off(TextBox24)`; displayed with `toFixed(0)` → **whole rupees**. |
| B4 | Limits: bill discount % above max → set to 0; bill less above max → cleared. When a bill discount is entered the received/card amounts are reset to 0 (cashier re-enters payment). |
| B5 | Bill discount, product discount and "less" are **different concepts** and are stored separately (`bill_disc`, `bill_less`, `pdisamtot`, `notdislesamt`). |
| B6 | Header persisted fields `[DOC]`: `tot_qty, tot_netamnt, totnetsub, bill_disc/1, bill_less/1, roundoff, igstper, gst5/12/18/28, pdisamtot, notdislesamt, paymenttype, mode, sysidandbill, points, UserID, BarcodeWiseProfit, SBillStatus, status, retstat` and payment fields `s_recevied_cashamt, s_card_amt, s_credit_amt, s_googlepay, s_selfamt, s_card_bankname, s_googlepay_bankname, s_selfremarks, s_balance_amt, s_advance_amt, s_credit_current_balance, s_credit_preview_balance, credit_billstatus`. |

### 2.3 Screen flow and server calls `[JS]`

`GstSalesentryNewsaleAll.aspx` WebMethods: `barcodedetail` (scan → name, price, unit, combo status, **cancelled-barcode flag** — a cancelled barcode is refused), `barcodeInformation`, `BarcodeStockBalance`, `BarcodeBalStockMinQtyInsert` (logs a below-minimum-stock event), `GetEmployeeName/1/2` (salesman lookup by code/name), `cuscar`/`codeda` (customer by card/name/mobile), `addPoints`/`lessPoints`, `UpdateSalbillByGridvalue`, `EncryptBillwiseProfit`, `billnum`, `RedirectToFloorWiseMinimumQty`.

Order of entry: counter/bill context → salesman → barcode (Enter) → qty/metres → line discount → add → bill discount/less/round-off → customer/points → payment (cash, card, Google Pay, credit, self, advance) → save → print (`SaleBillCash.aspx` with the totals in the query string).

Features visible in markup that are **optional modes**, not core: combos/offers (`txtCostatus`, `txtOfferDiscounts`), gift/token, Tamil product name (`txtLanguage`), up to 3 working bills on screen, multi-company numbering.

## 3. Gap matrix: legacy vs ERP today

| # | Legacy behaviour | ERP today | Action |
|---|---|---|---|
| G1 | Line product discount % (`pdis`, `pdis_amount`) | Not supported (`salsntry.pdis*` unused) | WP3 |
| G2 | Bill discount **%** on eligible lines only; legacy lets negative lines take it | Rupee discount shared over **positive** lines only; a returned line is refunded at what was paid | **Decided (D-1):** ERP rule kept |
| G3 | `rate` rounded to 2 dp before × qty | `cross = (amount − share)/(1+g)` rounded once | WP1 parity test |
| G4 | Total rounded to whole rupee, `roundoff` stored | Total stored as-is | WP1/WP3 (V-5) |
| G5 | Metre items (`mtr`) | `qty` only | WP3 |
| G6 | Salesman per line (`sls_man`) | Hard-coded `"1"` | WP3 |
| G7 | Slab GST on incl-GST price | Slab on ex-GST price | V-3 decision |
| G8 | Payment rows `cash_collection_3`, `cashcollectiondetail`; card/GPay bank names; self amount; advance | Header tender columns only | WP4 |
| G9 | Customer card/name/mobile, points, previous/advance/credit balance on the bill | Customer in Mongo; name+phone only | WP5 |
| G10 | Bill discount / less limits and `TextBox53` settings | Mongo `Tenant.misConfig` | WP2 |
| G11 | Working bills `BILL1/2/3` (rows in `salbill`) | Held bills in browser/Mongo | WP6 (use `erp.sales_draft`, never write `BILL1..3`) |
| G12 | Cancel bill = `status='1'` | Not exposed for SQL bills | WP10 |
| G13 | Cancelled-barcode refusal, min-stock event | Not checked | WP3 |
| G14 | Barcode-wise profit (`BarcodeWiseProfit`, `prate`, `nrate`) | Not written | WP3 (V-6) |
| G15 | Print templates (3"/4"/A4) with combo variants | Generic reprint | Plan 05 dependency |

## 4. Target design

```text
POS UI (React)  ──preview──►  POST /api/pos/invoice/preview   (pure calc, no write)
       │
       └─────save──────────►  POST /api/pos/invoice           (Idempotency-Key header)
                                   │
                          SalesBillingController   (HTTP only)
                                   │
                          SalesBillingService      (rules, approvals, calc, orchestration)
                                   │  uses salesCalc.ts (pure)
                          SalesBillRepository      (all SQL; one transaction)
                                   │
        dbo.sales2 + dbo.salsntry + dbo.cash_collection_3 + dbo.cashcollectiondetail   (legacy, DML only)
        erp.sales_draft, erp.sales_bill_audit, erp.sales_idempotency                   (new, versioned migrations)
```

Rules that do not change: no DDL on `dbo`; DML only on `WRITE_TABLES`; legacy number formats; stock stays derived from `salsntry`; API keeps string ids; server is the **only** place amounts are calculated — the browser shows the preview but the save recalculates and rejects a mismatch beyond ₹0.01 per line.

### 4.1 One transaction

```text
BEGIN
  1 counter + company numbering (existing)
  2 desktop-conflict guard (existing)
  3 stock check, rows locked (existing)
  4 next billno / sysidandbill / cmny_bill under lock (existing)
  5 calcBill()  ← NEW single calculation
  6 INSERT sales2
  7 INSERT salsntry × n
  8 INSERT cash_collection_3 + cashcollectiondetail   (WP4)
  9 customer / points / balance rows                  (WP5)
 10 INSERT erp.sales_bill_audit + erp.sales_idempotency
COMMIT   (any failure → ROLLBACK, nothing partial)
```

Today steps 9–10 run **after** commit against MongoDB and only log a warning on failure. In SQL-only mode they move inside the transaction.

## 5. Work packages

Each package lists files, steps and the acceptance check. Order: WP0 → WP1 → WP3 → WP2 → WP4 → WP7/WP8 → WP5 → WP9 → WP6 → WP10 → WP12 → WP13.

### WP0 — Verify against `SSS_copy` (blocking, ½ day)
Run the queries in section 9 on the machine that has the restored DB (or run `textilesoftSchemaDiscovery.ts`). Record answers in `docs/sales-billing-decisions.md`. Nothing else is trustworthy until V-1…V-8 are answered.

### WP1 — Calculation engine (1 day)
- **Create** `backend/src/modules/sales/domain/salesCalc.ts` (code in section 6). Pure TypeScript, no imports.
- **Create** tests. `jest.config.js` only runs `.test.js` under `tests/`, so put them in `backend/tests/sales/salesCalc.test.js` (or fix the config first); a `.test.ts` file would silently never run.
- Golden vectors (section 7) become test cases; add ≥ 20 real bills from `SSS_copy` as a parity fixture (WP12 script exports them).
- **Accept:** all vectors pass; engine reproduces `sales2.tot_netamnt`, `gst5/12/18/28` and every `salsntry.gstcrossamt/tax/cgst/sgst` of the sample bills to the paisa, or each difference is listed and decided (D-1…D-4).

### WP3 — Extend line/header model and writer (2 days)
- `sqlPosWriter.ts`: extend `SqlPosLine` with `pdisPct`, `salesmanCode`, `unit`, `mtr`, `promo`; extend `SqlPosBill` with `bdisPct`, `billLess`, `roundOff`, `customerCard`, `points`.
- Replace the inline block "4b. Amounts" with `calcBill()`; keep `returnLine()` for exchange lines (price = what the customer paid) and feed its result into `calcBill` as a fixed-price line.
- New `salsntry` columns to write (only if present in `INFORMATION_SCHEMA`, as the writer already does): `pdis`, `pdis_amount`, `dis`, `less`, `mtr`, `sls_man`, `hdnmtr`, `hdnunit`, `PrintNameTam`, `ProductTamil`, `prate`, `nrate`, `Sub_Mrp`, `GSTPer`. (`ProductPoint` / `TotProductPoint` do **not** exist in `salsntry` — confirmed by V-1; they were only in the working table `salbill`.)
- New `sales2` columns: `bill_disc`, `bill_disc1`, `bill_less`, `bill_less1`, `roundoff`, `pdisamtot`, `notdislesamt`, `tot_pdis`, `tmtr`, `points`, `Custpointamt`, `cus_card`, `igstper`, `BarcodeWiseProfit`.
- Add checks: refuse a **cancelled barcode** (find the flag in V-4); write a minimum-stock event row when stock falls under the minimum (V-7).
- **Accept:** bill saved by ERP and the same bill keyed in legacy produce identical `sales2`/`salsntry` values on the compared columns; legacy bill view and reports (`GstSalesBillView.aspx`, `datewisesalesreport.aspx`) show the ERP bill correctly.

### WP2 — Settings and limits (½ day)
- Find where `TextBox53` comes from (V-2). Add `getBillingLimits(userId)` in a new `SalesSettingsRepository` reading that source; expose `{maxBillDisPct, maxBillLess, maxProdDisPct, …}`.
- Replace `Tenant.misConfig` / `User.maxDiscountPercent` use in `createInvoiceInSql` with this (Mongo removal). Keep the manager-approval flow, with the approver looked up from `dbo.newuser` rights.
- **Accept:** a user whose legacy limit is 10% cannot bill 11% in the ERP; manager approval above the limit works.

### WP4 — Payment (header columns only — see 9A-5) (½ day; the text below on `cash_collection_3` / `cashcollectiondetail` is superseded)
- Add `cash_collection_3`, `cashcollectiondetail` to `WRITE_TABLES` in `sqlDbAccess.ts` (the write login is re-granted by `ensureErpDbAccess`/`healDbAccess` after a restore).
- Repository method `insertPayment(tx, bill, tenders)` writes the summary row (`cash_bill_number, net_amount, bill_dis1/2, bill_less, net_total, receve_cashamount, card_aomunt, credit_amount, balance_amount, googlepay, cardname, googlepayname, Selfamt, SelfRemarks, PreviousBalance, AdvancedAmount, CurrentBalance, cashier_name, login_name, cashier_billmode, bil_date, date …`) and the detail row (`statues, cashbar, amount, bill_dis, bill_less, pr_dis, rount_off, tot_amt, cash_bill, date, bil_date …`). Column list **confirmed by V-1** (`cash_collection_3`: 62 columns incl. `sysbillid`, `cash_bill_number`, `rount_off`, `Total_Cash_Amt`; `cashcollectiondetail`: 17 columns).
- Extend `posTenders` with `self`, `advance`, `cardBank`, `upiBank`, `selfRemarks`; keep the existing rules (card+UPI ≤ total; unpaid → credit needs a customer).
- Remove the Mongo `CashbankTransaction` write from the SQL path. The cash book is then read from these tables by the Finance plan.
- **Accept:** day-end cash report in legacy (`DateDepositCash.aspx`, `CashInOutBillwiseReport.aspx`) matches ERP totals for a test day.

### WP7 — Controller → Service → Repository split (1 day)
- New `backend/src/modules/sales/services/SalesBillingService.ts` (validation, approvals, calc, orchestration), `repositories/SalesBillRepository.ts` (move SQL from `sqlPosWriter.ts`; keep that file as a thin re-export until callers are migrated), `controllers/SalesBillingController.ts` (HTTP only, response shape `{ success, data }`).
- Delete the `isSqlItemSource()` fork in `createInvoice` on this branch: one path.
- **Accept:** `PosController.createInvoice` has no `mongoose` import; unit tests call the service without HTTP.

### WP8 — API contract (½ day)
```http
POST /api/pos/invoice/preview   → { lines[], totals{gross,productDiscount,billDiscount,billLess,roundOff,payable}, gstByRate, warnings[] }
POST /api/pos/invoice           → 201 { data: { invoiceNo:"A96", billNo, sysidandbill, total, createdAt } }
GET  /api/pos/lookup/barcode/:code     → name, unit, mrp, gstRate, stockLeft, cancelled, comboStatus
GET  /api/pos/lookup/salesman?q=       → code, name
GET  /api/pos/limits                   → billing limits for the logged-in user
```
`Idempotency-Key` on save; same key returns the original bill (needed by the offline retry queue `POSFailedBills`). Request carries `bdisPct`, `billLess`, `roundOff`, per-line `pdisPct`, `salesmanCode`, tenders `{cash, card, cardBank, upi, upiBank, self, selfRemarks, credit, advance}`.

### WP5 — Customer, points, credit/advance in SQL (2 days, depends on Plan 18A)
- Customer lookup by card/name/mobile from the Textilesoft customer table (name found by V-1/`CONCEPTS.md`); add it to `WRITE_TABLES` only after confirming column names.
- Points: earn/redeem written to the legacy points columns on the bill and the customer row (rule `addPoints`/`lessPoints` from `retriveldata.js` — read those two functions before coding; **not yet transcribed**).
- Credit/advance: write `s_credit_amt`, `s_credit_preview_balance`, `s_credit_current_balance`, `s_advance_amt` and update the customer balance in the same transaction.
- Interim (until 18A ships): keep name + phone on the bill only; block credit sales without a customer (already enforced).
- **Accept:** credit bill raises the customer's balance in the legacy customer-credit report; redeemed points reduce the bill total and the points balance exactly once.

### WP9 — Frontend POS (3 days)
Files: `frontend/src/features/pos/` — `POSCartGrid.tsx`, `POSFooter.tsx`, `POSCustomerPanel.tsx`, `POSModule.tsx`.
- Cart uses `/pos/invoice/preview` (debounced 150 ms) for every total; remove duplicated client-side GST math.
- Grid columns as legacy: Salesman, Barcode, Name, Qty, Metres (MTR only), MRP, Product Disc %, Gross, GST %, Net. Keyboard: Enter on barcode adds the line, Enter on qty moves to discount, F-keys as in `keys.js` (read it before assigning).
- Footer: bill discount %, bill less, round-off, payable (whole rupees), tender entry with change/balance, bank-name fields for card/UPI, self amount, advance.
- Show server warnings (limit exceeded, cancelled barcode, low stock) inline; approval modal for over-limit discount and ₹0 / above-MRP lines (existing).
- **Accept:** Playwright script bills 10 scenarios (section 8) and the printed totals equal the preview.

### WP6 — Held bills (1 day)
- New `erp` migration `V__sales_draft.sql`: `erp.sales_draft(id, counter, user_id, slot tinyint(1–3), payload nvarchar(max), updated_at)` unique `(counter, user_id, slot)`. Replaces `BILL1/2/3`; **never** insert `BILL1..3` into `salsntry`/`salbill`.
- Endpoints `GET/PUT/DELETE /api/pos/drafts/:slot`.
- **Accept:** a held bill survives a browser refresh and a login on another PC; a SQL restore does not lose it (add `erp.sales_draft` to `sqlRestoreCarryover.ts`).

### WP10 — View, edit, cancel (1½ days)
- Bill view by `sysidandbill` (header + lines + payment) — read-only reuse of `sqlSales.ts`.
- Cancel: set `status='1'` on header and lines inside a transaction, write `erp.sales_bill_audit` (who, why, before/after); stock returns automatically because stock is derived from non-cancelled `salsntry`. **No physical delete.**
- Edit of a posted bill: not allowed. Correct via exchange/return bill (existing return flow) — matches the rule in `08_sales_billing.md` §44–45.
- **Accept:** cancelled bill disappears from legacy sales reports and its stock is available again.

### WP12 — Parity and reconciliation (1 day)
- Script `backend/src/scripts/salesParityCheck.ts`: pick N bills from `SSS_copy` (legacy-made), rebuild each through `calcBill` from its lines, diff every amount column; print a table of mismatches by rule (G2, G3, G4, G7).
- Nightly job during parallel run: compare ERP-made bills against legacy reports for the day (count, total, GST by rate, tender totals).

### WP13 — Rollout
1. Flags: `SALES_BILLING_V2=on` per counter; old path stays until parity passes.
2. One counter pilot for a week; legacy desktop must not bill on that counter (guard already refuses).
3. Roll to other counters; keep the legacy app running read-only for reports.
4. Restore drill: restore `SSS_copy` from BAK, confirm `erp.*` carryover brings back drafts/audit and that the write login is re-granted.

## 6. Calculation engine — reference implementation (WP1)

File: `backend/src/modules/sales/domain/salesCalc.ts`

```ts
/**
 * Textilesoft sales-bill arithmetic (pure, no I/O). Mirrors the legacy billing page's JavaScript
 * (GstSalesentryNewsaleAllJS/calculation.js: gdmtr(), biddis(), cal()). MRP is GST-inclusive.
 */
export type PromoStatus = "" | "FREE" | "COF" | "DIS";

export interface CalcLineInput {
  qty: number;                 // negative = item brought back (exchange)
  mrp: number;                 // unit price incl. GST
  gstRate: number;             // already resolved (flat or slab)
  unit?: "PCS" | "MTR";
  mtr?: number;                // metres per qty, MTR items only
  pdisPct?: number;            // product discount %
  promo?: PromoStatus;         // FREE / COF / DIS lines never take the bill discount
}

export interface CalcLimits {
  maxBillDisPct: number;       // TextBox53 1st value
  maxBillLess: number;         // TextBox53 2nd value
  maxProdDisPct: number;       // TextBox53 5th value
}

export interface CalcBillInput {
  lines: CalcLineInput[];
  bdisPct?: number;            // bill discount %, applies to lines without a product discount
  billLess?: number;           // flat rupees off the bill
  manualRoundOff?: number;     // cashier-typed round-off (TextBox24)
  limits?: CalcLimits;
}

export interface CalcLine {
  amt: number; pdisPct: number; pdisAmt: number; bdisPct: number; billDisAmt: number;
  net: number; rate: number; gstcrossamt: number; gstRate: number;
  gst: number; cgst: number; sgst: number; payable: number;
}

export interface CalcBill {
  lines: CalcLine[];
  grossAmt: number; productDiscount: number; billDiscount: number; billLess: number;
  netBeforeRound: number; payable: number; roundOff: number;
  gstByRate: Record<string, number>; salesQty: number; returnQty: number; totalMtr: number;
  warnings: string[];
}

export const r2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;
/** Legacy toFixed(0): half rounds up (away from zero for the positive totals the till shows). */
export const roundRupee = (n: number): number => (n < 0 ? -Math.round(-n) : Math.round(n));

export function calcBill(input: CalcBillInput): CalcBill {
  const warnings: string[] = [];
  const lim = input.limits;
  let bdis = Math.max(0, Number(input.bdisPct) || 0);
  if (lim && bdis > lim.maxBillDisPct) { warnings.push(`Bill discount ${bdis}% above limit ${lim.maxBillDisPct}%: ignored`); bdis = 0; }
  let less = Math.max(0, Number(input.billLess) || 0);
  if (lim && less > lim.maxBillLess) { warnings.push(`Bill less ${less} above limit ${lim.maxBillLess}: cleared`); less = 0; }

  const out: CalcLine[] = [];
  for (const l of input.lines) {
    const mtrF = l.unit === "MTR" ? (l.mtr && l.mtr > 0 ? l.mtr : 1) : 1;
    let pdis = Math.max(0, Number(l.pdisPct) || 0);
    if (lim && pdis > lim.maxProdDisPct) { warnings.push(`Product discount ${pdis}% above limit ${lim.maxProdDisPct}%: ignored`); pdis = 0; }
    const amt = r2(mtrF * l.qty * l.mrp);
    const pdisAmt = pdis > 0 ? r2((amt * pdis) / 100) : 0;
    const net = r2(amt - pdisAmt);
    const promo = l.promo ?? "";
    const takesBillDis = pdis === 0 && promo === "" && bdis > 0;
    const d = pdis > 0 ? pdis : takesBillDis ? bdis : 0;
    const billDisAmt = takesBillDis ? r2((amt * bdis) / 100) : 0;
    const priceAfter = r2(l.mrp - (l.mrp * d) / 100);
    const rate = r2((priceAfter * 100) / (100 + l.gstRate));
    const gstcrossamt = r2(rate * l.qty * mtrF);
    const gst = r2((gstcrossamt * l.gstRate) / 100);
    const half = r2(gst / 2);
    out.push({
      amt, pdisPct: pdis, pdisAmt, bdisPct: takesBillDis ? bdis : 0, billDisAmt, net, rate, gstcrossamt,
      gstRate: l.gstRate, gst, cgst: half, sgst: r2(gst - half), payable: r2(net - billDisAmt),
    });
  }
  const sum = (f: (x: CalcLine) => number) => r2(out.reduce((s, x) => s + f(x), 0));
  const netSum = sum((x) => x.net);
  const billDiscount = sum((x) => x.billDisAmt);
  const netBeforeRound = r2(netSum - billDiscount - less - (Number(input.manualRoundOff) || 0));
  const payable = roundRupee(netBeforeRound);
  const gstByRate: Record<string, number> = {};
  for (const x of out) gstByRate[String(x.gstRate)] = r2((gstByRate[String(x.gstRate)] ?? 0) + x.gst);
  return {
    lines: out, grossAmt: sum((x) => x.amt), productDiscount: sum((x) => x.pdisAmt), billDiscount, billLess: less,
    netBeforeRound, payable, roundOff: r2(netBeforeRound - payable), gstByRate,
    salesQty: input.lines.reduce((s, l) => s + Math.max(0, l.qty), 0),
    returnQty: input.lines.reduce((s, l) => s + Math.min(0, l.qty), 0),
    totalMtr: r2(input.lines.reduce((s, l) => s + (l.unit === "MTR" && l.qty > 0 ? (l.mtr || 1) * l.qty : 0), 0)),
    warnings,
  };
}

export interface GstGroupRow { [k: string]: unknown }
/** Slab GST from a dbo.gstgroup row. Legacy compares the unit price INCLUDING GST (SubMrp); the ERP's
 *  current rule compares the price without GST. `basis` makes the choice explicit (decision V-3). */
export function resolveSlabGst(group: GstGroupRow, unitPriceIncl: number, basis: "legacy-incl" | "ex-gst"): number {
  const s = (v: unknown) => (v === null || v === undefined ? "" : String(v).trim());
  const slabs = ["", "1", "2", "3"].map((k) => ({
    gst: s(group[`gst${k}`]), from: Number(s(group[`sales_from_amount${k}`] ?? group[`from_amount${k}`]) || 0),
    to: Number(s(group[`sales_to_amount${k}`] ?? group[`to_amount${k}`]) || Infinity),
  })).filter((x) => x.gst !== "" && Number.isFinite(Number(x.gst)));
  if (slabs.length <= 1) return Number(slabs[0]?.gst ?? 0) || 0;
  for (const x of slabs) {
    const g = Number(x.gst);
    const v = basis === "legacy-incl" ? unitPriceIncl : unitPriceIncl / (1 + g / 100);
    if (v >= x.from - 0.005 && v <= x.to + 0.005) return g;
  }
  return Number(slabs[slabs.length - 1].gst) || 0;
}
```

## 7. Golden test vectors (run today against the engine above — all pass)

| ID | Input | Expected |
|---|---|---|
| V1 | 1 line, MRP 1000, GST 5%, qty 2, bill discount 10% | amt 2000, lineLess 200, rate 857.14, taxable 1714.28, GST 85.71 (CGST 42.86 / SGST 42.85), payable **1800** |
| V2 | MRP 500, GST 12%, qty 1, product discount 20% | pdisAmt 100, net 400, rate 357.14, GST 42.86, payable **400** |
| V3 | V2 line + plain MRP 1000 GST 5% line + exchange line qty −1 **paid ₹300** (GST 5%), bill discount 10% | bill discount **100** (only the plain 1000 line is eligible; the product-discount line and the returned line take none), payable 400 + 900 − 300 = **1000**, qtyOut 2, qtyBack −1. The refund is exactly ₹300, whatever the new bill's discount. |
| V4 | MRP 1000, bill discount 30%, limit 20% | discount ignored, one warning |
| V5 | MTR item MRP 200, 2.5 m, qty 1 | amt **500**, payable 500 |
| V6 | `FREE` line 3 × 333.33, bill discount 10%, bill less 0.40 | no bill discount, netBeforeRound 999.59, payable **1000**, roundOff −0.41 |

Slab check: group 5% up to 1000 / 12% above → price 1050 incl. GST gives 12 (legacy basis) but 5 (ex-GST basis) — exactly the case V-3 must settle with real bills.

## 8. Scenario checklist for UI / integration tests

1. Cash bill, single barcode, exact cash. 2. Cash with change (cash column keeps only the amount needed). 3. Card + cash split. 4. UPI with bank name. 5. Credit sale with customer; credit with no customer is refused. 6. Product discount line + bill discount line together. 7. Bill discount above limit refused / approved by manager. 8. Metre item. 9. Exchange (negative qty) smaller and larger than new items (refund). 10. Last piece sold twice from two tills → second refused. 11. Cancelled barcode refused. 12. Counter used by the desktop today → refused. 13. Same `Idempotency-Key` sent twice → one bill. 14. Network drop after commit → retry returns the same bill. 15. Cancel bill → stock back. 16. Restore `SSS_copy` and re-apply newer local bills without duplicates (carryover).

## 9. Verification queries to run on `SSS_copy` (WP0)

```sql
-- V-1 exact columns of the tables we write
SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME IN ('sales2','salsntry','cash_collection_3','cashcollectiondetail')
ORDER BY TABLE_NAME, ORDINAL_POSITION;

-- V-2 where do the discount limits live (TextBox53 = a/b/c/d/e)?
SELECT TABLE_NAME, COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
WHERE COLUMN_NAME LIKE '%dis%' OR COLUMN_NAME LIKE '%less%' OR COLUMN_NAME LIKE '%limit%'
ORDER BY TABLE_NAME;
SELECT TOP 5 * FROM dbo.newuser;          -- per-user rights/limits?
SELECT TOP 5 * FROM dbo.CommonSettings;   -- shop-wide settings?

-- V-3 slab GST: which basis do real bills follow? (bills whose rate flips near a slab edge)
SELECT g.gst_name, g.gst, g.gst1, g.sales_from_amount, g.sales_to_amount,
       g.sales_from_amount1, g.sales_to_amount1
FROM dbo.gstgroup g WHERE NULLIF(LTRIM(RTRIM(g.gst1)),'') IS NOT NULL;
SELECT TOP 200 l.gst_group, l.hdngst, l.mrp, l.rate, l.qty, l.amount
FROM dbo.salsntry l WHERE l.gst_group IN (SELECT gst_name FROM dbo.gstgroup WHERE NULLIF(LTRIM(RTRIM(gst1)),'') IS NOT NULL)
ORDER BY l.[No] DESC;

-- V-4 cancelled-barcode flag
SELECT TABLE_NAME, COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE COLUMN_NAME LIKE '%cancel%';

-- V-5 round-off: stored? sign? manual or automatic?
SELECT TOP 50 billno, tot_netamnt, roundoff, notdislesamt, bill_less, bill_disc, totnetsub
FROM dbo.sales2 WHERE NULLIF(LTRIM(RTRIM(roundoff)),'') IS NOT NULL ORDER BY [No] DESC;

-- V-6 profit fields filled?
SELECT TOP 20 BarcodeWiseProfit, tot_netamnt FROM dbo.sales2 WHERE BarcodeWiseProfit IS NOT NULL ORDER BY [No] DESC;

-- V-7 minimum-stock event table
SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME LIKE '%min%' OR TABLE_NAME LIKE '%BarcodeBal%';

-- V-8 does a legacy sale change dbo.stockdetails? (pick a barcode sold in the last week)
SELECT TOP 1 barcode FROM dbo.salsntry WHERE CAST([date] AS date) >= DATEADD(day,-7,GETDATE()) ORDER BY [No] DESC;
-- then compare stockdetails.qty for that barcode with purentrydetails qty − SUM(salsntry.qty)
```

## 9A. Results from `SSS_copy` (run 2026-10-01, 503 tables)

| Query | Finding | Effect on the plan |
|---|---|---|
| V-1 | `sales2` 106 cols, `salsntry` 136, `cash_collection_3` 62, `cashcollectiondetail` 17 — every column named in WP3/WP4 exists, **except** `ProductPoint`/`TotProductPoint` (not in `salsntry`). `sales2` also has `cancel_bilno`, `bill_status`, `exchange`, `bilcles_per`, `billcls_amt`. `cash_collection_3` is keyed by `sysbillid` and `cash_bill_number`. | WP3/WP4 column lists corrected. Use `cancel_bilno`/`status` for cancel (WP10). |
| V-2 | Discount limits are **not** in `newuser`. `CommonSettings` is **one row per counter** (SERVER, USER1, USER2 …) holding YES/NO switches (`BillAmtDis`, `BarProDis`, `offerDiscount`, `BarcodeDiscountAdj`, `CashPointLess`, `ProductDisToken`, `BarcodeStockBalance`, `BillwiseProfit`…). The `a/b/c/d/e` limit string is not in these. Candidates: `userper`, `specialcondion`, `salessetting`, `shop_settings`. | Answered by V-9, see 9A-2. |
| V-2 (users) | Table is `NewUser_ID` (columns `user_id, pass, re_pass, counter_name, mode, rights, statues`). **Passwords are stored in plain text** (and were pasted in chat). | Security note below. Not used by billing. |
| V-3 | `gstgroup`: `NEWGST18` = **5% for 1–2500, 18% for 2501–100000**, columns are `sales_from_amount`, `sales_to_amount`, `sales_from_amount1`… The second query (bills in slab groups) returned nothing, so real bills are not yet compared. | Slab basis (D-4) still open → V-10. **Possible bug:** `sqlPosRules.saleGstRate` reads `from_amount` / `to_amount`, not `sales_from_amount`. If `gstgroup` has no such columns, the slab loop always takes the first slab (5%) and a ₹3,000 piece would be billed at 5% instead of 18%. Check V-9 first. |
| V-4 | No cancel flag on `purentrydetails` or `stockdetails`. Cancel columns exist only on bill headers (`sales2.cancel_bilno`, `sales2Return`, …). | The "cancelled barcode" check most likely uses `purentrydetails.STATUS` (the ERP's stock query already filters `STATUS IS NULL`) → V-11 to confirm. |
| V-5, V-6 | Returned **no rows**: `sales2.roundoff` and `BarcodeWiseProfit` are blank on every bill in this copy (if the grids were simply not copied, tell me). | D-3 settled: do **not** invent a stored round-off; whole-rupee total only, leave `roundoff` blank. Profit: leave blank. |
| V-7 | Table `BarcodeBalStockMinQtyInsert` exists (plus `Brandwiseminimumqty`). | WP3 low-stock event can write there once V-12 shows its columns. |
| V-8 | No sale in the last 7 days in this copy, so no barcode returned. | Re-run V-13 with the latest sold barcode. |


### 9A-2. Results of V-9 (2026-10-01)

| Finding | Effect |
|---|---|
| **Discount limits are in `dbo.specialcondion`, one row per `user_id`** (+ `CounterName`): permission flags `bill_discount`, `bill_less`, `pdis`, `bill_cancel`, `last_bill`, `dup_bill`, `ProductLess` (Yes/No) and caps `dis_per` (max bill discount %), `less_rang` (max bill less ₹), `pdis_per` (max product discount %), `ProdLessAmt`, `cashDisPer`. Sample: SRI 60% / ₹100 / 100%; ADMIN 20% / ₹100 / 20%; BILL2 50% / ₹100 / 50%. `userper` is empty; `salessetting` holds offer/commission switches (`dis_to_select = "Product Discount"`). | **WP2 unblocked.** `TextBox53` (`a/b/c/d/e`) is built from these columns; the 1st value is `dis_per`, the 2nd `less_rang`, the 5th is the product-discount cap (`pdis_per`) — the exact order of the middle values is still inferred, not read. A permission flag of `No` means the cap is 0. |
| `gstgroup` has **two sets of slab columns**: `from_amount…3` / `to_amount…3` (purchase side) and `sales_from_amount…3` / `sales_to_amount…3` (sales side). | The ERP's `saleGstRate` reads the **purchase** columns for sales. Whether that is wrong depends on whether the two sets hold the same numbers → V-14. |

**WP2 design now:** `SalesSettingsRepository.getBillingLimits(userId, counter)` = `SELECT … FROM dbo.specialcondion WHERE user_id=@u` (prefer the row with matching `CounterName`, else the row with NULL), returns
`{ canBillDiscount: bill_discount='Yes', maxBillDisPct: dis_per, canLess: bill_less='Yes', maxBillLess: less_rang, canProductDiscount: pdis='Yes', maxProdDisPct: pdis_per, canCancelBill: bill_cancel='Yes' }`. Values are `varchar`, so parse with `TRY_CAST`. Read-only: the ERP never writes `specialcondion`. This replaces `Tenant.misConfig` / `User.maxDiscountPercent` on this branch.

```sql
-- V-14 purchase vs sales slabs: are they the same?
SELECT gst_name, gst, from_amount, to_amount, sales_from_amount, sales_to_amount,
       gst1, from_amount1, to_amount1, sales_from_amount1, sales_to_amount1
FROM dbo.gstgroup WHERE NULLIF(LTRIM(RTRIM(gst1)),'') IS NOT NULL;
```

### 9A-3. Results of V-10 … V-13 (2026-10-01)

| Query | Finding | Effect on the plan |
|---|---|---|
| V-10 | **No rows**: no bill in this copy has a `NEWGST…` group item priced ₹2,000–₹3,200. | There is no real bill to decide the slab basis (D-4). Run V-15 instead; until then use the legacy rule (price incl. GST after bill discount) and keep it behind the `basis` switch. |
| V-11 | `purentrydetails.STATUS`: NULL = 81,020 rows, `'1'` = 3 rows. | Cancelled barcode = `STATUS = '1'` (consistent with the ERP stock query, which only counts `STATUS IS NULL`). WP3: refuse a barcode whose lot has `STATUS='1'`. |
| V-12 | Customer master is `newcustomer` (`card_number, eng_name, mobile_nu, points, SaleBalance, creditbalance, discount, gst_no, Token_no` …). Points rules: `custpoint` (`strt_point, end_point, billdis_point, toamount, custPointPercent`), `Cus_points`, `customerLessPoints` (`lessPoints, lessAmount, minPoints`). Low-stock log `BarcodeBalStockMinQtyInsert` = `Barcode, MRP, ProductName, LoginName, Systemname, UpdatedOn`. | WP5 target tables named. WP3 low-stock row can be written with exactly these 6 columns. All of these must be added to `WRITE_TABLES` before use. |
| V-13 | Barcode 62872122: received 11, sold 3 (from `salsntry`), but `stockdetails.qty` is still **11**. | **Confirmed: a legacy sale does not change `dbo.stockdetails`.** Stock = received − sold − returned, exactly what the ERP already computes. Do not decrement `stockdetails` in billing. `stockdetails` also carries the cost snapshot (`prate` 400, `nrate` 420, `mrp` 510) — source for `salsntry.prate` / `nrate`. |

```sql
-- V-15 what price range does each GST group really bill at?
SELECT gst_group, hdngst, COUNT(*) AS n,
       MIN(TRY_CAST(mrp AS float)) AS min_mrp, MAX(TRY_CAST(mrp AS float)) AS max_mrp
FROM dbo.salsntry WHERE ISNULL(status,'')<>'1'
GROUP BY gst_group, hdngst ORDER BY n DESC;
```

### 9A-4. Results of V-15 and V-14 — slab GST (2026-10-01) — **earlier reading withdrawn**

V-15 (`salsntry` grouped by `gst_group`, `hdngst`): `NULL`/5% 603,514 lines (MRP 1–7,000); `GST5`/5% 293,781 (1–21,000); `NULL`/12% 2,095 (810–4,080); `GST12`/12% 458 (1,050–2,225); `GST12`/5% 5 (1,050–1,150); `GST18`/18% 1 (2,550).

V-14 (`gstgroup` rows that have a second slab): **only `NEWGST18` has slabs** — 5% for ₹1–2,500 and 18% for ₹2,501–100,000, and the purchase-side and sales-side columns hold **identical values**.

What this means:
- An earlier draft of this section read the `GST12` / `GST18` rows as evidence for the "price including GST" slab rule. That was wrong: `GST12` and `GST18` are flat groups (no slabs), and no bill carries `NEWGST18`. **The data does not decide the slab basis (D-4).** Keep the legacy rule from the JavaScript (unit price including GST, after bill discount) as the default because it is what the shop's software executes; revisit only if a real slab-group bill appears.
- The ERP's `saleGstRate` reading the purchase columns is **harmless today** (same numbers). It is still worth reading the `sales_*` columns for the day the two sets differ.
- `salsntry.gst_group` is not reliable for deciding which group a product belongs to (the ERP itself writes `GST<rate>` when it has no group). Do not infer group membership from it.
- Slab pricing affects a handful of products at most, so it is **low priority**.

### HF-1 (optional hardening, ¼ day — not a hotfix)
`sqlPosRules.ts` → `saleGstRate`: read `sales_from_amount[n]` / `sales_to_amount[n]` first (fall back to `from_amount[n]`), and delegate to `resolveSlabGst(…, "legacy-incl")`. Tests: group 5% to 2500 / 18% above → 2,550 → 18; 2,500 → 5; with a 10% bill discount a ₹2,700 piece (→ 2,430) → 5. **Before changing it, check which products actually use `NEWGST18`:** `SELECT code, p_name FROM dbo.newproduct WHERE gst_group='NEWGST18'`. If none, skip HF-1.

### 9A-5. Payment storage (counts run 2026-10-01)

`cash_collection_1/2/3` and `cashcollectiondetail` hold **0 rows**; `sales2` has 252,996 bills, 81,360 of them with a tender amount in the header. The last legacy bills (`UserID = INV`, 26 Sep) carry the whole amount in `s_recevied_cashamt`, with card/UPI/credit/self = 0.

**Decision (WP4 reduced):** payment is stored in the `sales2` header columns (`s_recevied_cashamt, s_card_amt, s_googlepay, s_credit_amt, s_selfamt, s_balance_amt`, bank names, remarks), which the ERP already writes. **Do not write `cash_collection_3` / `cashcollectiondetail`** and do not add them to `WRITE_TABLES`. Remaining WP4 work: write `s_card_bankname`, `s_googlepay_bankname`, `s_selfamt`, `s_selfremarks`, `s_advance_amt`, `s_credit_*` and handle refunds. Caveat: those tables may be emptied by the legacy day-closing screen (`ClosingSales.aspx` / cash closing), so empty in a copy does not prove they are unused on a live day — confirm with the shop whether the closing screen is used, and re-check on a live-day backup.

**Security:** `NewUser_ID.pass` is plain text and the ADMIN/SRI passwords were pasted into this chat. Treat them as exposed: change them in Textilesoft. The ERP login should never copy or log these values.

## 9B. Next round of queries (V-9 … V-13)

```sql
USE SSS_copy; GO
-- V-9 limits source + gstgroup columns
SELECT TABLE_NAME, COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
 WHERE TABLE_NAME IN ('userper','specialcondion','salessetting','shop_settings','gstgroup') ORDER BY TABLE_NAME, ORDINAL_POSITION;
SELECT TOP 5 * FROM dbo.userper;
SELECT TOP 5 * FROM dbo.specialcondion;
SELECT TOP 5 * FROM dbo.salessetting;

-- V-10 slab GST on real bills: pieces near the 2500 edge
SELECT TOP 100 [No], billno, gst_group, hdngst, mrp, Sub_Mrp, rate, qty, amount, gstcrossamt, tax
FROM dbo.salsntry
WHERE gst_group LIKE 'NEWGST%' AND TRY_CAST(mrp AS float) BETWEEN 2000 AND 3200
ORDER BY [No] DESC;

-- V-11 is "cancelled barcode" purentrydetails.STATUS?
SELECT STATUS, COUNT(*) AS n FROM dbo.purentrydetails GROUP BY STATUS;

-- V-12 min-stock event table + customer/points tables
SELECT TABLE_NAME, COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
 WHERE TABLE_NAME IN ('BarcodeBalStockMinQtyInsert','newcustomer','custpoint','Cus_points','customerLessPoints')
 ORDER BY TABLE_NAME, ORDINAL_POSITION;

-- V-13 does a legacy sale change stockdetails? (latest sold barcode, any date)
DECLARE @b varchar(100) = (SELECT TOP 1 barcode FROM dbo.salsntry WHERE NULLIF(barcode,'') IS NOT NULL ORDER BY [No] DESC);
SELECT @b AS barcode,
  (SELECT SUM(TRY_CAST(qty AS float)) FROM dbo.purentrydetails WHERE barcode=@b AND STATUS IS NULL) AS received,
  (SELECT SUM(TRY_CAST(qty AS float)) FROM dbo.salsntry WHERE barcode=@b AND ISNULL(status,'')<>'1') AS sold,
  (SELECT TOP 1 * FROM dbo.stockdetails WHERE barcode=@b FOR JSON AUTO) AS stockdetails_row;
```

## 10. Decisions to take (with a recommendation)

| ID | Question | Recommendation |
|---|---|---|
| D-1 | **Decided.** A returned item is refunded **exactly what the customer paid for that sale line**: the line's taxable value + GST (`gstcrossamt + tax`), which already carry its product discount and the bill-discount share given at sale time; at that sale's GST rate. The current bill's discount never touches a returned line. Rupee bill discount is shared over new, discount-free items only. | Implemented in `sqlPosWriter.returnLine`. Old Textilesoft bills with a flat post-GST "bill less" are shared by amount. Same barcode sold at different prices: the cashier must name the bill (`returnFromBill`), otherwise 409. Earlier returns aren't linked to a sale line in the data, so they are taken off the oldest sales first. `sqlSalesReturn` legacy flow stays disabled. |
| D-2 | Rate rounding (round before × qty, L5) vs round once. | Follow legacy so printed rate × qty matches bills the shop already issued. |
| D-3 | Round-off. | **Settled by V-5:** `roundoff` is blank on all existing bills. Total is a whole rupee; do not write a round-off value. |
| D-4 | Slab GST basis. | **Open, low impact (9A-4).** Default to the legacy rule from the JavaScript; only `NEWGST18` has slabs and no bill uses it. |
| D-5 | Optional modes in v1: combos/offers, gift/token, Tamil names, wholesale/credit variants. | Out of v1; each becomes its own package after cash-retail parity. |
| D-6 | Customers and loyalty before Plan 18A is done. | Name + phone only on the bill; credit needs a customer record from SQL. |

## 11. Effort and order

| Package | Days | Depends on |
|---|---|---|
| WP0 verify | 0.5 | restored DB |
| WP1 engine + tests | 1 | — |
| WP3 writer extension | 2 | WP0, WP1 |
| WP2 limits | 0.5 | WP0 |
| WP4 payments | 1.5 | WP0 |
| WP7 + WP8 service/API | 1.5 | WP3 |
| WP5 customer/points | 2 | Plan 18A |
| WP9 frontend | 3 | WP8 |
| WP6 held bills | 1 | migration framework |
| WP10 view/cancel | 1.5 | WP3 |
| WP12 parity | 1 | WP1 |
| WP13 rollout | 1 + pilot week | all |
| **Total** | **≈ 17 working days** plus the pilot | |

## 12. Not yet done / limits of this plan

- Not run against `SSS_copy`; all DB column names outside `sales2`/`salsntry` come from the earlier analysis of compiled SQL strings and must pass V-1.
- `addPoints` / `lessPoints` (`retriveldata.js`), the `keys.js` shortcuts and the other billing pages (credit, wholesale, invoice, department, gift) were **not** transcribed here. This plan covers the standard GST counter bill (`GstSalesentryNewsaleAll`).
- The engine and its six vectors were run in a sandbox, but the engine has not been compared to real legacy bills yet (WP12).


## 13. Implemented so far (2026-10-01)

- `salesCalc.ts` engine (product discount, bill discount ₹/%, metres, limits, whole-rupee total; ERP rounding order kept pending a parity check, D-2) with unit tests.
- `sqlPosWriter`: uses the engine; writes `pdis`, `pdis_amount`, `pdisamtot`, `tmtr`; refuses cancelled barcodes (`purentrydetails.STATUS='1'`); `limits` from `dbo.specialcondion` via `sqlBillingLimits.ts`; per-line `discountPercent` accepted by `PosController` (frontend doesn't send it yet).
- Returns: see D-1 above; tests in `sqlSales.test.ts` cover multi-item bill discount, product-discounted line, same barcode at different prices, wrong bill.
- Corrections to earlier text: jest **does** run `src/**/*.test.ts` (project "unit (ts)", needs `NODE_OPTIONS=--experimental-vm-modules`); the user table is `newuser` with column `NewUser_ID`.
- Till screen: `GET /api/pos/return-sources?item=<id>` lists the bills an item was sold on (newest first, with the amount paid per piece); each RETURN line in the POS cart shows a "bought on bill" dropdown (`ReturnBillPicker`), stored on the cart line as `returnFromBill` and sent by `posInvoiceMapper`. Required when the prices differ (the dropdown turns red); optional otherwise.
- Still open: parity script vs real legacy bills (D-2, D-4), frontend `discountPercent` (no product-discount box on the till yet), held bills, bill cancel, customers and points (deferred), full-project `tsc`.

## 14. Step 3 — slab GST chosen after discounts (implementation plan)

**Problem.** `sqlPosWriter` picks a line's GST rate with `saleGstRate(group, unitPriceIncl)` *before* `calcBill`, using the list price and an ex-GST basis. Legacy compares the **unit price including GST after the bill discount** (`SubMrp`). Only group `NEWGST18` has slabs (5% for 1–2500, 18% for 2501–100000), so today this changes nothing; it matters the first time a slab item is sold with a discount near 2500.

**Key fact that makes it simple.** In `calcBill` the bill-discount share of each line depends only on gross amounts, product discounts and limits, **not on the GST rate**. So the rate can be chosen after the shares are known, with two passes and no circular dependency.

**Changes**
1. `sqlPosRules.saleGstRate`: add `basis: "legacy"` (compare the unit price **incl. GST**, after product and bill discount, against `sales_from_amount*` / `sales_to_amount*`); keep the old ex-GST behaviour behind `basis: "exGst"` until the shop confirms with real bills (decision D-4). Default stays `exGst` until then.
2. `sqlPosWriter` step 4a/4b: pass 1 = `calcBill` with provisional rates (the current rate) to get each line's bill-discount share; for each slab-group line compute `subMrpEach = (amount − pdisAmt − share) / qty` and re-pick the rate; pass 2 = `calcBill` with the final rates. Lines with a single-rate group, Quick Entry lines and returned lines (rate taken from the original sale) are untouched.
3. Persist the chosen rate on the line (`hdngst`, `gst_group`) as now; nothing else in the saved bill changes.
4. Config: `TEXTILESOFT_SLAB_BASIS=legacy|exGst` (default `exGst`) so the switch is reversible without a deploy.

**Tests** (`sqlSales.test.ts`, `sqlPosRules` unit tests)
- NEWGST18 item MRP 2600, qty 1: no discount → 18%; 10% product discount (2340) → 5% under `legacy`, 18% under `exGst`.
- Same item with a ₹300 bill discount over two lines: each line re-picked on its own share.
- Qty 2 of a 1300 item (unit price, not line total, decides).
- Exactly at the boundary 2500 and 2501.
- Returned slab item keeps the original sale's rate whatever the basis.
- Totals still equal the sum of line payables; GST header buckets match.

**Verification before switching the default to `legacy`:** run the parity script (WP12) over real bills in `NEWGST18` (the earlier query found none, so ask the shop for one test bill each side of 2500 from the desktop app and compare line `hdngst`, `gstcrossamt`, `tax`).

**Effort / risk.** About half a day. Risk is low while the default is `exGst`; the change is invisible until the config flips.
