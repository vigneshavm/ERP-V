# Purchase barcode creation: end-to-end validation checklist

Scope: ERP purchase entry (save GRN) -> `purgrnentry` / `purentrydetails` / `stockdetails` -> barcode labels -> sale by barcode.
Database: `SSS_copy` (copy of the shop data). Writes only through the ERP; checks only with `erp_readonly`.
Expected format (decoded from the shop's data and `grndetail`): prefix = reversed yy + reversed month + reversed day + counter serial,
then the running number of the day. 04/10/2026, serial 1 -> prefix `620141` -> `6201411`, `6201412`, ... (barLen 6).

Tester: ______  Date: ______  GRN under test: ______  Result: PASS / FAIL

## A. Before you start
- [ ] Backend restarted after the latest code (barcode settings change in `sqlPurchase.ts`).
- [ ] Frontend reloaded; logged in as owner / co-owner / manager.
- [ ] Note the last GRN for the company (VJ…) and the highest barcode of today (if any): ______ / ______.
- [ ] `grndetail` settings are the ones decoded: year_pos 1, month_pos 2, date_pos 3, reverse_con Yes, *_con No, month_gen No.
- [ ] Counter serial of SERVER (`countername.sl_no`) = 1 (so the prefix ends in 1).

## B. Create the purchase (UI)
- [ ] Open purchase entry for VIJAYALAKSHMI CLOTH STORE; choose a supplier and the date (today).
- [ ] Add 3 lines: two different product codes, one line with qty > 1. Fill size / colour / MRP / purchase rate.
- [ ] Save. The ERP shows a GRN number = last GRN + 1 and one barcode per line (no error, no partial save).
- [ ] The barcodes shown are consecutive: `<prefix>1`, `<prefix>2`, `<prefix>3` (or continue after today's earlier ones).

## C. Database checks (run `scripts/sql/readonly/READONLY_PURCHASE_BARCODE_E2E_CHECK.sql`, set `@grn`)
- [ ] 1. Header row exists for the GRN, right company and supplier.
- [ ] 2. Three lines; each has its own barcode; `orgbar` = `barcode`; `barLen` = 6.
- [ ] 3. Expected prefix printed = `620141` (for 04/10/2026).
- [ ] 4. Every barcode: prefix OK; running numbers continue the day's sequence with no repeats.
- [ ] 5. Duplicate check returns 0 rows.
- [ ] 6. `stockdetails` rows = number of purchase lines.

## D. Concurrency and repeat
- [ ] Save a second purchase the same day: barcodes continue (not restarted at 1), GRN = previous + 1.
- [ ] Two browser tabs save at nearly the same moment: no duplicate barcode or GRN (check 5 again).
- [ ] Barcode reuse guard: a barcode that exists on another day is never reused (check 5 over a few days).

## E. Settings guard
- [ ] Only if you can test on a copy: set `year_con` to Yes for one company -> saving shows "…not supported by the ERP yet" and writes nothing. Set it back.

## F. Downstream (the barcode is useful)
- [ ] Inventory search finds each new barcode; stock qty = purchased qty.
- [ ] Label print (LabelPrintModal) prints the new barcodes; the scanner reads one back to the same item.
- [ ] POS: scan a new barcode -> item, price (MRP) and GST are right; sell 1 -> stock reduces by 1.
- [ ] Bill edit / cancel: removing that line puts the stock back.

## G. Negative cases
- [ ] Missing supplier / product not set up for the company -> clear error, nothing saved (no header, no lines, no stock rows).
- [ ] Duplicate supplier invoice number (if the ERP checks it) -> refused.
- [ ] Qty 0 or blank MRP -> refused.

## H. Compare with Textilesoft (if you can open the legacy app on the same copy)
- [ ] A purchase made in Textilesoft the same day continues the ERP's running number (and the reverse).
- [ ] The ERP row and a Textilesoft row look the same in `purentrydetails` (same columns filled).

## Record (rule 6)
UI route: purchase entry. API: purchase save route. Handler: `backend/src/integrations/textilesoft/sqlPurchase.ts`.
SQL: `grndetail`, `countername`, `newproduct`, `gstgroup`, `purgrnentry`, `purentrydetails`, `stockdetails`.
Lost/kept behaviour: barcode format kept; unsupported barcode settings refused. Evidence: attach query output for C and screenshots for B, F.
