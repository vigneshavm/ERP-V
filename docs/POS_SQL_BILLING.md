# ERP POS bills -> Textilesoft (SQL Server)

With `ITEM_DATA_SOURCE=sql` and `TEXTILESOFT_POS_WRITE=on`, every ERP POS bill is written to the shop
database (`TEXTILESOFT_DB_NAME`, currently **SSS_copy**) the way Textilesoft bills: one row in
`dbo.sales2` + one row per line in `dbo.salsntry`. Nothing is saved to MongoDB for these bills.
Code: `backend/src/integrations/textilesoft/sqlPosWriter.ts`, `PosController.createInvoiceInSql`.

> **SSS_copy is replaced by every restore.** Bills written there are erased at the next restore.
> Use it to test; for real billing the target must be the live `SSS`.

## Numbering (per counter, from SQL)
| Field | Rule | Example |
|---|---|---|
| Counter | chosen in the POS **Terminal** box = `dbo.countername.counter_name` | `SERVER` |
| `billno` | daily sequence per counter (`MAX(billno)+1` for that counter today) | `96` |
| `mode` (printed bill no.) | `counter_mode` + billno | `A96` |
| `sysidandbill` | `sl_no` + DDMMYY + billno | `1` `290926` `96` |
| `cmny_bill` | company series (`bill_option.cmny_mode`) + next number | `DA142427` |
| `UserID` | `TEXTILESOFT_POS_USERID` (default `ERP`) — tells ERP bills apart | `ERP` |

Numbers are taken inside one transaction with row locks, so two tills can't get the same number.
**Use a counter that no Textilesoft machine bills on** (e.g. add a new `countername` row), otherwise the
ERP and Textilesoft can race for the same daily number on that counter.

## One-time setup (SSMS)
```sql
-- Login (server level; survives restores). Only this step is manual.
CREATE LOGIN erp_pos_writer WITH PASSWORD = '<strong password>', CHECK_POLICY = OFF;
```
The database user and its rights are applied by the ERP itself (`sqlDbAccess.ts`), using the admin login:
- right after every restore made from the ERP (Settings → Restore), for both `TEXTILESOFT_DB_USER` (SELECT)
  and `TEXTILESOFT_DB_WRITE_USER` (SELECT + INSERT on `dbo.sales2`, `dbo.salsntry`);
- and automatically whenever a login is refused access to the database (e.g. after a restore done in SSMS).

Needs in `backend/.env`: `TEXTILESOFT_ADMIN_USER` / `TEXTILESOFT_ADMIN_PASSWORD` (sa or another sysadmin).
Manual equivalent, if ever needed:
```sql
USE [SSS_copy];
CREATE USER erp_pos_writer FOR LOGIN erp_pos_writer;
GRANT SELECT ON SCHEMA::dbo TO erp_pos_writer;
GRANT INSERT ON dbo.sales2   TO erp_pos_writer;
GRANT INSERT ON dbo.salsntry TO erp_pos_writer;
```
`backend/.env`:
```
TEXTILESOFT_POS_WRITE=on
TEXTILESOFT_DB_WRITE_USER=erp_pos_writer
TEXTILESOFT_DB_WRITE_PASSWORD=<strong password>
TEXTILESOFT_POS_COMPANY=VIJAYALAKSHMI CLOTH STORE
TEXTILESOFT_POS_USERID=ERP
TEXTILESOFT_ADMIN_USER=sa
TEXTILESOFT_ADMIN_PASSWORD=<sa password>
```
Restart the backend.

## Verify a test bill
1. POS → pick a counter in **Terminal** (list comes from `dbo.countername`) → bill one scanned item + one Quick Entry line → Finalize. The receipt and Last Bill show the SQL number (e.g. `A96`).
2. In SSMS, compare the ERP bill with a Textilesoft bill of the same counter:
```sql
USE [SSS_copy];
SELECT TOP 5 [No], billno, mode, Lmode, sysidandbill, systemname, UserID, tot_qty, tot_netamnt, gst5,
       s_recevied_cashamt, s_card_amt, s_googlepay, s_credit_amt, [status], [datetime]
FROM dbo.sales2 ORDER BY [No] DESC;

SELECT * FROM dbo.salsntry WHERE systemidbill = '<sysidandbill of the ERP bill>' ORDER BY [No];
```
3. Open the bill in **Textilesoft** (bill view / reprint / day report / GST report) and check it looks right,
   and that the scanned lot's stock dropped.
4. In the ERP: POS "Today's bill no." box → `96` finds it; Reports → Daily Sales shows it under the counter.

Remove test bills (copy only): `DELETE FROM dbo.salsntry WHERE UserID='ERP'; DELETE FROM dbo.sales2 WHERE UserID='ERP';`

## Not covered yet
- Customer points / credit ledger, cash-book entry and bill edit/return for SQL bills (those stay MongoDB features).
- Offline: a bill made while the shop DB is unreachable keeps a provisional number (`SERVER-0001`) on its
  receipt and gets its real SQL number when it syncs.
- Running line counters `count_IDBillno`, `comp_continu_billno`, `cmy_wo_continu_billno` continue from the
  latest line (their exact Textilesoft meaning is unknown) — check them in step 2.

## Restoring SSS_copy without losing local bills
Settings → Restore (`sqlRestoreCarryover.ts`) no longer overwrites `SSS_copy` in place:
1. The backup is restored into a side copy `SSS_copy__incoming` (the live `SSS_copy` is untouched).
2. Last bill time (`sales2.[datetime]`) is compared: backup vs local.
3. `SSS_copy` is frozen (ERP logins can't write; a POS bill made now is queued and retried).
4. Local bills to keep = newer than the backup's last bill **or** written by the ERP (`UserID` =
   `TEXTILESOFT_POS_USERID`) — and **not already in the backup**, matched on `sysidandbill`.
   (ERP bills are never in the shop backup, even older ones, so time alone would lose them.)
5. They are saved to `backend/backups/restore-carryover/*.json` first, then inserted (header + lines) into the
   side copy in one transaction; `[No]` is renumbered after the backup's rows.
6. Check: every kept bill present exactly once with all its lines; latest bill ≥ local latest before.
7. Only then: `SSS_copy` → `SSS_copy__previous` (rollback copy), side copy → `SSS_copy`, ERP access re-applied.
If any step fails, the side copy is dropped and `SSS_copy` stays as it was.

A local bill whose `sysidandbill` exists in the backup with a different time is **not** copied (it's a
numbering clash); it is listed in the result and kept in the saved JSON. Using an ERP-only counter avoids this.
Restores done directly in SSMS bypass all of this — use the ERP's Restore screen.
Disk space: the side copy and `__previous` each need about the size of the database.
