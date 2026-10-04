# Vikki's checklist — what you need to do (as of 2 Oct 2026)

Tick items as you finish them. Files named below are in the ERP folder.

## A. Do first (needed before the new features work)
- [ ] **Restart the backend** so it picks up all the new code (duplicate-bill guard, barcode cancel, customer edits, Quick Entry, no-pre-selected-customer).
- [ ] **Hard-refresh the POS page** (Ctrl+F5) so the new frontend loads.
- [ ] **Run `scripts/sql/grants/GRANT_CUSTOMER_EDIT_FOR_ERP.sql` in SSMS** (database `SSS_copy`, as an admin). It lets the ERP update `dbo.newcustomer`. Permission only, no table changes.
  - [ ] Note: after any database restore this grant has to be run again (unless you ask me to add `newcustomer` to the ERP's access list).

## B. Test these now (a real bill and a few edits)
- [ ] Open POS → **Finalize Bill** with one item. It should save, print, and show in the **Daily report**.
  - [ ] If it fails, copy me the **red message** on screen and the first red line in the browser console (F12).
  - [ ] Tell me if you open the POS as `localhost` or by an IP address.
- [ ] Click Finalize Bill **twice quickly** (or retry after a slow save): only **one** bill should be saved.
- [ ] POS customer box is **empty** ("Unidentified Customer") until you pick a customer — no SRI by default.
- [ ] **Quick Entry**: type a product **code** → name fills; the product/type list shows all products; GST % looks right for a few products (tell me if a rate is wrong — I assumed `gstgroup.gst` is the plain percentage).
- [ ] **Customer edits** (after the grant in A): change a test customer's mobile, then card, then name. Check the old bills show the new card/name. (The edit screens in the frontend may still need wiring — tell me if they don't call the new routes.)
- [ ] **Barcode cancel** (backend only, no button yet): try on an unsold test barcode, then on a sold one (should be refused).

## C. Decisions I need from you
- [ ] **Duplicate-bill protection:** the `erp.sales_idempotency` table doesn't exist, so protection is in-memory only (lost on server restart). Accept this, or approve creating the table (that breaks your "no DB changes" rule)?
- [ ] **Barcode rate change:** allow the ERP to write the rate-change **history** table `mrpratechange` (run `GRANT INSERT ON dbo.mrpratechange TO erp_pos_writer;`)? Or skip history?
- [ ] **Role checks:** restrict **creating purchases / purchase returns** to owner/co-owner/manager? (Your inventory staff INV / INVBILL would lose access.)
- [ ] **Which customer table is right?** I switched the ERP to `newcustomer` (VIGNESH, no card). `customercmyname` has SRI (card 1001). Confirm `newcustomer` is the real one, or tell me about SRI.
- [ ] **Backup / restore:** allow me to open the backup and restore screens (restore can overwrite a database)?
- [ ] **Expense entry, agent / salesman create:** do you want these built? (Expense entry has a legacy table `expenseentry` already writable.)

## D. Information I need from you (to unblock gaps)
- [ ] Legacy answers for the formulas/fields: what **PDS%, PAMT, BDIS, PO/BAL, PF, CMAmt** mean on the legacy bill screen; the formulas for **CR%, MRP%, WSR%, WS RATE**.
- [ ] A few **real legacy bills** (bill no. + all amounts) to compare tax/discount/rounding with the ERP.
- [ ] How the **old Barcode Wise Discount** screen works (the `BarcodeWiseDiscount` table only holds GRN-level records; `productwisediscount` has the percentages).
- [ ] What legacy **Super Purchase**, **Purchase Split** and **Combo** do (a short description or a screenshot of each).
- [ ] Whether the **desktop Textilesoft** still bills on the same database at the same time (the ERP refuses a counter the desktop billed on today).
- [ ] Your **accountant's tax fixtures** (sample GST outputs) for sign-off.

## E. Optional checks (read-only SQL, safe)
- [ ] Re-run `scripts/sql/readonly/READONLY_SCHEMA_CHECK_3.sql` after the grant to confirm `erp_pos_writer` shows UPDATE on `newcustomer`.
- [ ] Check whether the `erp_admin` login (named in `.env`) has the rights to restore grants after a restore.

## F. Not built yet (waiting on C / D)
- [ ] Barcode **rate change** (R03, R04) — needs decision in C.
- [ ] Barcode-wise **discount** (R05) — needs info in D.
- [ ] Purchase **update / add line / split / super purchase** (P04–P09, P12).
- [ ] Label **printing / reprint** (B11–B13, B16).
- [ ] **Customer points** earn/redeem (REP10).
- [ ] **Backup / restore** screens (BK01–BK07).
- [ ] **Audit trail** (X06) — needs a table.
- [ ] Missing reports: company-wise and supplier-wise sales, pattern/size, missing bills, barcode stock check, purchase rate check.
- [ ] Frontend type-check of recent edits (it kept timing out on the device). Run `cd frontend && npx tsc --noEmit` yourself and send me any errors.

## Reference files
`docs/audits/LEGACY_SQL_FINDINGS_2026-10-02.md` (legacy SQL recovered), `scripts/sql/readonly/READONLY_SCHEMA_CHECK_2.sql`, `scripts/sql/readonly/READONLY_SCHEMA_CHECK_3.sql`, `scripts/sql/grants/GRANT_CUSTOMER_EDIT_FOR_ERP.sql`.
