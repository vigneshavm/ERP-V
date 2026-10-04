# Legacy Textilesoft SQL recovered from the compiled site (TEXTILESOFT 17.07.2025/bin/App_Web_*.dll)
Read-only extraction of the SQL strings in the compiled pages. These are the legacy rules to copy; nothing here has been run.

## Customer changes (tables newcustomer, sales2)
- Mobile no change (CustomerMobileNoUpdate): `UPDATE newcustomer SET mobile_nu=@mobile_nu WHERE card_number=@card_number AND eng_name=@eng_name`
- Card no change (CustomerCardNoUpdate): `UPDATE newcustomer SET card_number=@card_number WHERE mobile_nu=...` and `UPDATE sales2 SET cus_card=@cus_card WHERE mbl_no=@mbl_no AND cus_name=@cus_name`
- Name change (CustomerNameUpdate): `UPDATE newcustomer SET eng_name=@eng_name WHERE mobile_nu=@mobile_nu AND card_number=@card_number` and `UPDATE sales2 SET cus_name=@cus_name WHERE cus_card=@cus_card AND mbl_no=@mbl_no`
- Legacy ALSO rewrites old bills (sales2) when the card or name changes. The mobile change does not touch sales2.
- newcustomer columns used: sl_nu, card_number, eng_name, mobile_nu, points, creditbalance.
- BLOCKER: the ERP write login has no grant on newcustomer (WRITE_TABLES in sqlDbAccess.ts has sales2 only). Needs the owner's OK to grant, and the ERP reads customers from customercmyname -- confirm how it relates to newcustomer.

## Barcode cancel (barcoderatecancelchange page)
- `update purentrydetails set STATUS='1' where barcode=...` (matches the ERP's cancel endpoint); the same page also has `UPDATE purgrnentry SET sstatus='1' ... WHERE grn_no=` (whole-GRN cancel, not built).

## Barcode rate change (barcoderatechange page)
- `update purentrydetails set sr_per,mrp,sr_rate,mrpdisper,mrpdisamt,cr_per,cr_rate,code,pname,unit_details,brand,patrn,color,size,style where barcode=@barcode`, the same on `stockdetails`, then a history row: `insert into mrpratechange (grn_no, barcode, old_*, new_* ... entry_date, modified_date)`.
- Also `psam3_samebarcode` / `ratecha` temp tables for label reprint (not needed).
- BLOCKER for history: mrpratechange is not in WRITE_TABLES and its existence/columns are unverified.

## Barcode wise discount
- Page BarcodeWiseDiscount; table not yet identified (productwisediscount is a guess) -- run scripts/sql/readonly/READONLY_SCHEMA_CHECK_2.sql.

## Bill cancel (PendingCancelCashBillView.aspx, assembly App_Web_03y033l5) -- read 2026-10-04
- Page needs a login only: `CurrentUserID` missing -> redirect to `~/login.aspx`. No rights/role string (`newuser.rights` is only PURCHASE/SALES; `newuser.mode` is the bill-series letter) was found in this page.
- Lists live bills: `select sysidandbill,crs_amount,tot_netamnt,bill_disc1,bill_less,pdisamtot from sales2 where NOT sysidandbill IN (select cash_barcode from cash_collection_2) and systemname=@systemname and date=@date and status='0'` -- bills already in `cash_collection_2` (cash collected / day closed) are NOT offered for cancel.
- Cancel: `update sales2 set status='1', cancel_bilno=<n>, date1='<yyyy-MM-dd hh:mm:ss>' where sysidandbill='<id>' and date='<date>'` then `update salsntry set status='1' where systemname='...'` (the rest of the WHERE is built in code). Message: "Cancel Bill Sucessful".
- Nothing in this routine touches `newcustomer.points`, payments or a stock table (stock is computed from salsntry status). Day close (`closepattycash.totalcancelbill/totalcancelamt`) counts cancelled bills.
- Other cancel variants use the same pattern on other head tables: CatCreditSalesHead, Giftsales2, tblElecSalesHead, sales3 (`status='1', cancel_bilno=`).
- Related: `CashBillWise.aspx` has its own Cancel button; `CashSalesBillView.aspx` has "Cancel this Bill"; cancelled bills show "This Is Canceled Bill!".

## Bill cancel verified; bill edit built (2026-10-04)

**Cancel, verified on SSS_copy:** bill A2 (sysidandbill 10410262) after Cancel Bill: sales2.status='1', cancel_bilno='1', date1=today; all 4 salsntry lines status='1'. (READONLY_BILL_EDIT_CHECK.sql output.)

**Edit (BarcodeGstSalesentryNewsaleAllEdit.aspx, App_Web_tmontxrn):** the legacy screen copies lines to salbilledit, DELETEs the bill's sales2/salsntry rows and re-inserts them, sets editbillno, and updates newcustomer.points / creditbalance.
ERP version (`backend/src/integrations/textilesoft/sqlBillEdit.ts`, `POST /api/sales-invoice/invoice/:id/edit`, owner/co-owner/manager): edits in place -- removed line = salsntry.status='1'; added line = new salsntry row priced by the POS rules (item selling price, GST group, calcBill legacy rounding); sales2 header totals/GST/payment split rewritten. Refused (409 EDIT_UNSUPPORTED): bill discount/less, item discounts, returned lines, metre items, customer points, self/advance payment, stored total != recomputed total; credit amount cannot change; only today's live bills with cash not collected. Not done: editbillno marker, newcustomer points/creditbalance (columns exist: points, creditbalance; semantics not verified).
