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
