# 09 — Sales Return

## End-to-End Technical and Business Flow

**Source system:** TextileSoft legacy ASP.NET / SQL Server application  
**Primary return page:** `GstReturnSalesentryNewsaleAll.aspx`  
**Compiled page assembly:** `App_Web_k5hdf11c.dll`  
**Bill view page:** `SalesReturnBillview.aspx`  
**Primary return header table:** `sales2Return`  
**Primary return line table:** `salbillReturns`  
**Return staging table:** `salsntryReturn`  
**Original sales staging/source used by return:** `salsntry`  
**Original purchase detail used for barcode/stock validation:** `purentrydetails`  
**Primary report family:** `salesreturn.rpt`, `salsreturnbill*.rpt`, `disalsreturnbill*.rpt`

---

## 1. Purpose

Sales Return reverses or partially reverses a previously sold item. In TextileSoft, the return screen is implemented as a specialized sales-entry screen rather than as a completely independent transaction engine.

The return flow carries forward much of the normal sales billing model:

```text
Original Sale
    ↓
Sales bill / sales staging
    ↓
Customer presents item / bill / barcode
    ↓
Sales Return Entry
    ↓
Validate original sale and barcode
    ↓
Build return lines in return staging
    ↓
Calculate return amount / discount / GST
    ↓
Create return line snapshot
    ↓
Create return bill header snapshot
    ↓
Persist return status
    ↓
Print return bill
    ↓
Inventory / customer / payment reconciliation
    ↓
Sales Return Reports
```

The source code shows three important return-side stores:

1. `salsntryReturn` — return sales-line staging / transaction representation.
2. `salbillReturns` — return bill line representation used by the return billing UI.
3. `sales2Return` — return bill/header summary representation.

The original sale is represented elsewhere, principally through `salsntry`, `salbill`, and `sales2` depending on the sales variant and lifecycle stage.

---

# 2. Executive Summary

The legacy sales-return architecture is best understood as a **return copy-and-recalculate process** rather than a single SQL reversal.

The application:

- identifies the original sales transaction,
- reads product/barcode information,
- validates barcode and quantity conditions,
- creates return-side staging records,
- calculates the return amount,
- stores item-level return data in `salbillReturns`,
- stores bill-level return data in `sales2Return`,
- stores detailed historical/staging data in `salsntryReturn`,
- uses `returnStatus` and other status fields to distinguish return records,
- generates return bill reports,
- and exposes the returned transaction through return-specific screens.

A critical architectural point is that **return records are not simply negative rows in `salbill` and `sales2`**. TextileSoft has dedicated return tables.

Recommended ERP architecture should retain this separation at the business-document level while using a common inventory ledger underneath.

---

# 3. Source Files Traced

## 3.1 Main Return Page

```text
GstReturnSalesentryNewsaleAll.aspx
```

Page directive:

```aspx
<%@ page language="C#"
    autoeventwireup="true"
    inherits="GstReturnSalesentryNewsaleAll, App_Web_k5hdf11c"
    maintainscrollpositiononpostback="true"
    enableEventValidation="false" %>
```

Page title:

```text
Sales Return Entry
```

---

## 3.2 Client-side scripts

The page loads:

```text
GstReturnSalesentryNewsaleAllJS/keys.js
GstReturnSalesentryNewsaleAllJS/retriveldata.js
GstReturnSalesentryNewsaleAllJS/enterkey.js
GstReturnSalesentryNewsaleAllJS/calculation.js
GstReturnSalesentryNewsaleAllJS/SaleBillCash.js
GstReturnSalesentryNewsaleAllJS/autoscrolls.js
GstReturnSalesentryNewsaleAllJS/salesscript.js
```

These indicate that the return screen reuses the sales billing interaction and calculation model.

---

## 3.3 Return bill view

```text
SalesReturnBillview.aspx
```

The page itself is thin, but the compiled assembly contains the return bill retrieval/report behavior.

---

## 3.4 Return report templates

The source contains multiple Crystal Reports including:

```text
3inchbill/salesreturn.rpt
3inchbillGST/salesreturn.rpt
4inchbill/salesreturn.rpt
4inchbillGST/salesreturn.rpt
```

There are also specialized return reports:

```text
salsreturnbill.rpt
salsreturnbillCombo.rpt
salsreturnbillOnlyNormal.rpt
salsreturnbillOnlyCombo.rpt
disalsreturnbill.rpt
disalsreturnbillonly.rpt
```

These variations correspond to different billing/combination/exchange/discount print layouts.

---

# 4. Main Return Tables

## 4.1 `sales2Return`

Bill-level/header-level return table.

Representative fields confirmed from the INSERT statements include:

```text
retstat
upsat
upnet
status
crs_amount
systemname
cus_card
cus_name
mbl_no
tmtr
bill_disc
bill_disc1
bill_less
bill_less1
roundoff
igstper
tot_qty
tot_netamnt
billno
date
notdislesamt
paymenttype
mode
sysidandbill
gst5
gst12
gst18
gst28
totnetsub
pdisamtot
SBillStatus
points
datetime
UserID
Lmode
BarcodeWiseProfit
CustomerMan
Custpointamt
Token_Dis_Gift_Amount
Gift_Amount_wiseToken
GiftValueFromDate
GiftValueToDate
GiftNoCopy
ProductToAmount
Single_Token_Amount
returnStatus
```

This table represents the return bill as a commercial document.

---

## 4.2 `salbillReturns`

Return bill line table.

The source contains several versions of the INSERT because TextileSoft has multiple billing variants.

The richer version contains:

```text
unit
sn
slman
barcode
code
p_name
pnameTamil
mrp
rate
mtr
qty
amt
pds
pamt
bdis
less
gst
cgst
sgst
netamt
billno
cmy_name
cmy_bill
gst_per
countername
design
brand
patrn
size
color
style
prate
nrate
pre_qty
CheckBarcodeBalanceStock
gstcrossamt
user_id
costatus
comp_continu_billno
cmy_wo_continu_billno
cmnyname
pgname
fname
counterID
points
c_Mrp
c_Amt
corate
corate1
corate2
corate3
corate4
cqty
status
Token_Dis_Amount
gst_group
```

This is the return equivalent of the normal sales line table `salbill`.

---

## 4.3 `salsntryReturn`

Return staging / transaction table.

Representative fields include:

```text
datetime
systemname
upmrp
upnet
upsta
daily_cmy_bill
less
pre_bill_amnt
mrp
srl_no
sls_man
barcode
p_name
rate
mtr
qty
amount
pdis
pdis_amount
net_amount
tax
cgst
sgst
dis
billno
hsncode
mode
date
amt
cmnyname
cmny_bill
status
hdnmtr
hdnunit
hdnpgrm
hdngst
company_name
bil_cl_qty
systemidbill
PrintNameEng
PrintNameTam
ProductTamil
UserID
comboname
combostatus
degin
brand
patt
size
color
style
Lmode
combobarcode
costatus1
costatus
rackno
ProGroupName
ProGroupBillNo
SystemDate
LLDate
CustomerMan
gstcrossamt
PHSN_CODE
company_billno
comp_continu_billno
cmy_wo_billno
cmy_wo_continu_billno
cmy_wo_cont_idbillno
billoption_cmy
corate1
corate2
corate3
corate4
corate
Token_Dis_Amount
Sub_Mrp
gst_group
returnStatus
```

This table preserves substantially more transaction context than the final bill-line table.

---

# 5. Original Sales Data Relationship

The return screen does not operate only against a product master.

It needs the original sale context.

A confirmed query is:

```sql
select *
from salsntry s1
left join purentrydetails p1
    on p1.barcode = s1.barcode
where s1.mode = @mode
  and s1.date = @date
  and p1.costatus = 'COF'
```

This proves that the return flow can use the original sales staging record and the purchase-detail barcode record together.

Another confirmed query is:

```sql
select *
from salsntry
where mode = @mode
  and qty <= 0
```

and:

```sql
select *
from salsntry s1
where s1.mode = @mode
  and s1.qty > 0
```

The presence of both positive and non-positive quantity checks indicates that the application distinguishes normal sales quantities from return/exchange or adjustment quantities.

---

# 6. Original Sale → Return Relationship

The logical relationship is:

```text
Original Sales Bill
    │
    ├── sales2
    │     └── bill-level sales information
    │
    ├── salbill
    │     └── finalized sales line
    │
    └── salsntry
          └── sales transaction/staging line
                    │
                    ▼
              Sales Return Entry
                    │
          ┌─────────┼─────────┐
          ▼         ▼         ▼
     salsntryReturn salbillReturns sales2Return
```

The exact foreign-key constraint is not proven by the source archive. The relationship is implemented through business identifiers such as:

```text
mode
billno
date
barcode
slman / sales person
customer
company
```

Therefore, a new ERP should use explicit document IDs rather than relying on composite text matching.

---

# 7. Return Entry Screen

## 7.1 Page

```text
GstReturnSalesentryNewsaleAll.aspx
```

The title is:

```text
Sales Return Entry
```

The page includes customer autocomplete:

```javascript
url: "GstReturnSalesentryNewsaleAll.aspx/GetCusName"
```

The returned customer object is split into:

```text
customer name
customer card
mobile number
```

Therefore customer information is part of the return document.

---

# 8. Three Working Bills

The return UI uses the same three working-bill concept found in the sales billing flow:

```text
BILL1
BILL2
BILL3
```

The return line table is queried separately for each:

```sql
select *
from salbillReturns
where billno = 'BILL1'
  and countername = @counter
```

Likewise:

```sql
select *
from salbillReturns
where billno = 'BILL2'
  and countername = @counter
```

and:

```sql
select *
from salbillReturns
where billno = 'BILL3'
  and countername = @counter
```

This is a working-session mechanism, not the final customer-facing return number.

---

# 9. Working Bill Cleanup

The compiled code contains:

```sql
delete from salbillReturns
where billno = 'BILL1'
  and countername = @counter
  and user_id = @user
```

and equivalent cleanup for `BILL2` and `BILL3`.

This means the return screen can discard unsaved working return lines without deleting the finalized return header.

This distinction is important:

```text
BILL1/BILL2/BILL3
        ↓
Temporary working return bill
        ↓
Final return document
```

---

# 10. Return Number vs Working Bill Number

Do not confuse:

```text
BILL1 / BILL2 / BILL3
```

with:

```text
mode
```

or:

```text
billno
```

The working bill number is an application-session bucket.

The final return transaction uses the business identifiers persisted into `sales2Return`, `salsntryReturn`, and `salbillReturns`.

---

# 11. Return Line Creation

A representative simple return-line INSERT is:

```sql
insert into salbillReturns(
    unit,
    sn,
    slman,
    barcode,
    code,
    p_name,
    pnameTamil,
    mrp,
    rate,
    mtr,
    qty,
    amt,
    pds,
    pamt,
    bdis,
    less,
    gst,
    cgst,
    sgst,
    netamt,
    billno,
    cmy_name,
    cmy_bill,
    gst_per,
    bdisam,
    countername,
    user_id
)
values(
    @unit,
    @sn,
    @slman,
    @barcode,
    @code,
    @p_name,
    @pnameTamil,
    @mrp,
    @rate,
    @mtr,
    @qty,
    @amt,
    @pds,
    @pamt,
    @bdis,
    @less,
    @gst,
    @cgst,
    @sgst,
    @netamt,
    @billno,
    @cmy_name,
    @cmy_bill,
    @gst_per,
    @bdisam,
    @Pcname,
    @user_id
)
```

The richer version is:

```sql
INSERT INTO salbillReturns(
    unit,
    sn,
    slman,
    barcode,
    code,
    p_name,
    pnameTamil,
    mrp,
    rate,
    mtr,
    qty,
    amt,
    pds,
    pamt,
    bdis,
    less,
    gst,
    cgst,
    sgst,
    netamt,
    billno,
    cmy_name,
    cmy_bill,
    gst_per,
    countername,
    design,
    brand,
    patrn,
    size,
    color,
    style,
    prate,
    nrate,
    CheckBarcodeBalanceStock,
    gstcrossamt,
    user_id,
    costatus,
    comp_continu_billno,
    cmy_wo_continu_billno,
    cmnyname,
    pgname,
    fname,
    counterID,
    points,
    c_Mrp,
    c_Amt,
    Token_Dis_Amount,
    gst_group
)
values(
    @unit,
    @sn,
    @slman,
    @barcode,
    @code,
    @p_name,
    @pnameTamil,
    @mrp,
    @rate,
    @mtr,
    @qty,
    @amt,
    @pds,
    @pamt,
    @bdis,
    @less,
    @gst,
    @cgst,
    @sgst,
    @netamt,
    @billno,
    @cmy_name,
    @cmy_bill,
    @gst_per,
    @Pcname,
    @Design,
    @Brand,
    @Patrn,
    @Size,
    @Color,
    @Style,
    @prate,
    @nrate,
    @CheckBarcodeBalanceStock,
    @gstcrossamt,
    @user_id,
    @costatus,
    @comp_continu_billno,
    @cmy_wo_continu_billno,
    @cmnyname,
    @pgname,
    @fname,
    @counterID,
    @points,
    @c_Mrp,
    @c_Amt,
    @Token_Dis_Amount,
    @gst_group
)
```

---

# 12. Return Line as a Snapshot

The return line stores transaction-time values rather than depending entirely on `newproduct`.

Examples:

```text
p_name
mrp
rate
prate
nrate
brand
patrn
size
color
style
gst
cgst
sgst
gst_group
```

This is correct from an accounting/history perspective because a product's master data can change after the original sale.

The new ERP should preserve these historical snapshots.

---

# 13. Return Line Product Identity

The core return item identity is:

```text
barcode
    ↓
product code
    ↓
product name
```

The barcode is the strongest item-level identifier because the source performs barcode-specific checks.

---

# 14. Barcode Validation

The return screen checks barcode-related quantities in `salbillReturns` and compares them against `purentrydetails`.

Confirmed query:

```sql
SELECT
    sb.qty,
    sb.barcode
FROM salbillReturns sb
INNER JOIN purentrydetails pd
    ON sb.barcode = pd.barcode
WHERE sb.billno = 'BILL1'
  AND sb.barcode = @barcode
```

The same logic exists for `BILL2` and `BILL3`.

---

# 15. Purchase Detail as Barcode Reference

The return flow also retrieves original purchase attributes:

```sql
select
    grn_no,
    design,
    brand,
    patrn,
    size,
    color,
    style,
    prate,
    nrate,
    mrpdisper,
    diamond
from purentrydetails
where barcode = @barcode
```

This means the return process can recover the purchase lineage for a barcode.

Logical lineage:

```text
Purchase GRN
    ↓
purentrydetails
    ↓
barcode
    ↓
Sales
    ↓
Sales Return
```

---

# 16. Barcode Return Quantity Validation

A confirmed query is:

```sql
SELECT
    s.sn
FROM salbillReturns s
INNER JOIN purentrydetails p
    ON s.barcode = p.barcode
WHERE s.billno = 'BILL1'
  AND s.qty < p.cqty
  AND s.slman = @slman
```

The equivalent checks exist for `BILL2` and `BILL3`.

The exact meaning of every `cqty` scenario depends on the deployed variant, but the source clearly uses purchase quantity as one of the constraints around barcode return quantity.

---

# 17. Return Quantity Rules

The source contains queries such as:

```sql
select qty, mtr
from salbillReturns
where barcode = @barcode
```

and:

```sql
select qty
from salbillReturns
where barcode = @barcode
```

This supports both:

```text
piece quantity
```

and:

```text
meter quantity
```

for textile products.

---

# 18. Meter-Based Return

The return line stores:

```text
mtr
```

The bill header stores:

```text
tmtr
```

Therefore:

```text
Line meter quantity
        ↓
Return total meter
        ↓
Return bill header
```

For textile goods, this must not be reduced to integer quantity alone.

---

# 19. Return Amount Calculation

The return screen reuses the sales calculation JavaScript:

```text
calculation.js
```

The return line stores:

```text
amt
pds
pamt
bdis
less
gst
cgst
sgst
netamt
gstcrossamt
```

A conceptual calculation is:

```text
Gross Line Amount
    ↓
Product Discount
    ↓
Bill Discount Allocation
    ↓
Less / Adjustment
    ↓
Taxable Amount
    ↓
GST
    ↓
Net Return Amount
```

The exact deployed calculation varies by sales mode, so migration should use the source formula rather than reconstructing it from field names alone.

---

# 20. Product Discount

Fields:

```text
pds
pamt
```

represent product-level discount percentage and amount.

The return preserves the discount context rather than simply refunding the current product price.

---

# 21. Bill Discount

Header fields:

```text
bill_disc
bill_disc1
bill_less
bill_less1
```

are stored in `sales2Return`.

Line-level bill-discount information is represented through fields such as:

```text
bdis
less
bdisam
```

The new ERP should clearly distinguish:

```text
line discount
bill discount
bill less
rounding
```

rather than storing them as ambiguous numeric fields.

---

# 22. GST

The return header stores separate tax totals:

```text
gst5
gst12
gst18
gst28
igstper
```

The return line stores:

```text
gst
gst_per
cgst
sgst
gstcrossamt
gst_group
```

Therefore a return reverses the tax classification of the original sale.

Recommended rule:

```text
Return GST = reversal of the original taxable sale allocation
```

Do not recalculate the return from today's GST master if the original sale had a different tax configuration.

---

# 23. Customer Information

`sales2Return` stores:

```text
cus_card
cus_name
mbl_no
CustomerMan
Custpointamt
points
```

This supports:

- customer identification,
- loyalty/customer points,
- customer-specific return reporting,
- refund context.

The page also exposes a customer autocomplete endpoint:

```text
GetCusName
```

---

# 24. Customer Points

Return headers include:

```text
points
Custpointamt
```

and return lines can include:

```text
points
```

This indicates that customer loyalty value is part of the return document.

The exact point reversal algorithm is not proven solely by the extracted SQL strings.

New ERP should model:

```text
points earned
points redeemed
points reversed
return adjustment
```

as separate ledger events.

---

# 25. Gift / Token Reversal

`sales2Return` contains:

```text
Token_Dis_Gift_Amount
Gift_Amount_wiseToken
GiftValueFromDate
GiftValueToDate
GiftNoCopy
ProductToAmount
Single_Token_Amount
```

Return-line records contain:

```text
Token_Dis_Amount
```

This indicates that the return calculation can carry gift/token discount information.

The new ERP should not silently refund the gross price when a promotional benefit affected the original sale.

---

# 26. Exchange and Combo Context

The return line supports:

```text
comboname
combostatus
combobarcode
costatus
costatus1
corate
corate1
corate2
corate3
corate4
cqty
```

This indicates that return handling supports more than a simple one-product refund.

Possible business scenarios include:

```text
Normal product return
Combo return
Exchange-related return
Promotional return
Partial combo return
```

The exact business rule for each combination must remain aligned with the deployed billing variant.

---

# 27. Return Line Attributes

Return lines can preserve:

```text
Design
Brand
Patrn
Size
Color
Style
```

These are the same product/SKU dimensions used by sales and purchase.

Therefore:

```text
Purchase attribute snapshot
        ↓
Sales attribute snapshot
        ↓
Return attribute snapshot
```

is the correct historical chain.

---

# 28. Rack

`salsntryReturn` contains:

```text
rackno
```

This indicates that the return transaction can preserve the physical-location context.

However, the source does not prove a single universal stock-rack update statement in the return page.

Therefore rack restoration should be treated as an inventory-posting responsibility rather than inferred solely from the return insert.

---

# 29. Company Context

Return lines contain:

```text
cmy_name
cmy_bill
cmnyname
company_name
company_billno
comp_continu_billno
cmy_wo_billno
cmy_wo_continu_billno
cmy_wo_cont_idbillno
billoption_cmy
```

The system therefore supports multi-company billing context.

The new ERP should use a real foreign key:

```text
company_id
```

and separate document numbering per company where required.

---

# 30. Counter Context

Return line contains:

```text
countername
counterID
systemname
```

The header contains:

```text
systemname
```

This allows counter-wise return reporting.

---

# 31. User Context

Return tables store:

```text
UserID
user_id
```

This provides an operator/audit trail.

New ERP should preserve:

```text
created_by
approved_by
posted_by
cancelled_by
```

rather than a single generic user field.

---

# 32. Return Status

The return header explicitly contains:

```text
returnStatus
```

The compiled code also queries:

```sql
select mode,
       CONVERT(VARCHAR(10), date, 120) AS date,
       cus_card,
       cus_name,
       mbl_no,
       tot_netamnt
from sales2Return
where mode LIKE '' + @SearchEmpName + '%'
  and returnStatus = '1'
ORDER BY date
```

This proves that `returnStatus` is used to identify active/final return documents.

---

# 33. Return Status Transition

The code contains:

```sql
update sales2Return
set returnStatus = '0'
where returnStatus = '1'
  and mode = @mode
```

This means the system can deactivate an existing return transaction.

Logical interpretation:

```text
returnStatus = 1
    ↓
active return

returnStatus = 0
    ↓
deactivated / cancelled / no longer active
```

The exact UI label for status `0` is not guaranteed by the SQL alone.

---

# 34. Return Header INSERT

A confirmed full header INSERT is:

```sql
INSERT INTO sales2Return(
    tot_pdis,
    retstat,
    upsat,
    upnet,
    status,
    crs_amount,
    systemname,
    cus_card,
    cus_name,
    mbl_no,
    tmtr,
    bill_disc,
    bill_disc1,
    bill_less,
    bill_less1,
    roundoff,
    igstper,
    tot_qty,
    tot_netamnt,
    billno,
    date,
    notdislesamt,
    paymenttype,
    mode,
    sysidandbill,
    gst5,
    gst12,
    gst18,
    gst28,
    totnetsub,
    pdisamtot,
    SBillStatus,
    points,
    datetime,
    UserID,
    Lmode,
    BarcodeWiseProfit,
    CustomerMan,
    Custpointamt,
    Token_Dis_Gift_Amount,
    Gift_Amount_wiseToken,
    GiftValueFromDate,
    GiftValueToDate,
    GiftNoCopy,
    ProductToAmount,
    Single_Token_Amount,
    returnStatus
)
VALUES(
    @tot_pdis,
    @retstat,
    @upsat,
    @upnet,
    @status,
    @crs_amount,
    @systemname,
    @cus_card,
    @cus_name,
    @mbl_no,
    @tmtr,
    @bill_disc,
    @bill_disc1,
    @bill_less,
    @bill_less1,
    @roundoff,
    @igstper,
    @tot_qty,
    @tot_netamnt,
    @billno,
    @date,
    @notdislesamt,
    @paymenttype,
    @mode,
    @sysidandbill,
    @gst5,
    @gst12,
    @gst18,
    @gst28,
    @totnetsub,
    @pdisamtot,
    @SBillStatus,
    @points,
    @datetime,
    @UserID,
    @Lmode,
    @BarcodeWiseProfit,
    @CustomerMan,
    @Custpointamt,
    @Token_Dis_Gift_Amount,
    @Gift_Amount_wiseToken,
    @GiftValueFromDate,
    @GiftValueToDate,
    @GiftNoCopy,
    @ProductToAmount,
    @Single_Token_Amount,
    @returnStatus
)
```

---

# 35. Header Insert Variant

A shorter variant is also present:

```sql
Insert into sales2Return(
    datetime,
    retstat,
    upsat,
    upnet,
    status,
    crs_amount,
    systemname,
    cus_card,
    cus_name,
    mbl_no,
    tmtr,
    bill_disc,
    bill_disc1,
    bill_less,
    bill_less1,
    roundoff,
    igstper,
    tot_qty,
    tot_netamnt,
    billno,
    date,
    notdislesamt,
    paymenttype,
    mode,
    sysidandbill,
    gst5,
    gst12,
    gst18,
    gst28,
    totnetsub,
    pdisamtot,
    SBillStatus,
    UserID,
    BarcodeWiseProfit,
    returnStatus
)
values(
    @datetime,
    @retstat,
    @upsat,
    @upnet,
    @status,
    @crs_amount,
    @systemname,
    @cus_card,
    @cus_name,
    @mbl_no,
    @tmtr,
    @bill_disc,
    @bill_disc1,
    @bill_less,
    @bill_less1,
    @roundoff,
    @igstper,
    @tot_qty,
    @tot_netamnt,
    @billno,
    @date,
    @notdislesamt,
    @paymenttype,
    @mode,
    @sysidandbill,
    @gst5,
    @gst12,
    @gst18,
    @gst28,
    @totnetsub,
    @pdisamtot,
    @SBillStatus,
    @UserID,
    @BarcodeWiseProfit,
    @returnStatus
)
```

The presence of multiple variants reflects the legacy system's multiple sales modes.

---

# 36. Return Line Staging INSERT

The source contains:

```sql
Insert into salsntryReturn(
    datetime,
    systemname,
    upmrp,
    upnet,
    upsta,
    daily_cmy_bill,
    less,
    pre_bill_amnt,
    mrp,
    srl_no,
    sls_man,
    barcode,
    p_name,
    rate,
    mtr,
    qty,
    amount,
    pdis,
    pdis_amount,
    net_amount,
    tax,
    cgst,
    sgst,
    dis,
    billno,
    hsncode,
    mode,
    date,
    amt,
    cmnyname,
    cmny_bill,
    status,
    hdnmtr,
    hdnunit,
    hdnpgrm,
    hdngst,
    company_name,
    bil_cl_qty,
    UserID,
    returnStatus
)
values(
    @datetime,
    @systemname,
    @upmrp,
    @upnet,
    @upsta,
    @daily_cmy_bill,
    @less,
    @pre_bill_amnt,
    @mrp,
    @srl_no,
    @sls_man,
    @barcode,
    @p_name,
    @rate,
    @mtr,
    @qty,
    @amount,
    @pdis,
    @pdis_amount,
    @net_amount,
    @tax,
    @cgst,
    @sgst,
    @dis,
    @billno,
    @hsncode,
    @mode,
    @date,
    @amt,
    @cmnyname,
    @cmny_bill,
    @status,
    @hdnmtr,
    @hdnunit,
    @hdnpgrm,
    @hdngst,
    @company_name,
    @bil_cl_qty,
    @UserID,
    @returnStatus
)
```

The richer version adds product attributes, rack, company continuation numbers, combo data, QR/offer context and GST information.

---

# 37. Return Line Finalization from Sales Staging

A confirmed statement copies sales staging data into return billing lines:

```sql
INSERT INTO salbillReturns(
    sn,
    slman,
    barcode,
    code,
    p_name,
    mrp,
    rate,
    mtr,
    qty,
    amt,
    pds,
    pamt,
    bdis,
    less,
    gst,
    cgst,
    sgst,
    netamt,
    billno,
    cmy_name,
    cmy_bill,
    gst_per,
    bdisam,
    unit,
    countername,
    design,
    brand,
    prate,
    CheckBarcodeBalanceStock,
    gstcrossamt,
    user_id,
    comp_continu_billno,
    cmy_wo_continu_billno,
    cmnyname,
    pgname,
    fname,
    counterID,
    points,
    cusname,
    c_Mrp,
    c_Amt,
    Token_Dis_Amount,
    gst_group
)
SELECT
    slno,
    sls_man,
    barcode,
    hsncode,
    p_name,
    mrp,
    rate,
    mtr,
    qty,
    amount,
    pdis,
    pdis_amount,
    dis,
    less,
    tax,
    cgst,
    sgst,
    net_amount,
    bill_no,
    company_name,
    cmny_bill,
    hdngst,
    pre_bill_amnt,
    unit,
    systemname,
    design,
    brand,
    rate,
    balancestock,
    gstcrossamt,
    UserID,
    comp_continu_billno,
    cmy_wo_continu_billno,
    cmnyname,
    ProGroupName,
    Change1,
    count_IDBillno,
    points,
    customername,
    c_Mrp,
    c_Amt,
    Token_Dis_Amount,
    gst_group
FROM SALSNTRY1
WHERE customername = @customer
```

This proves that return billing can be built from sales staging data rather than requiring the user to manually re-enter every original value.

---

# 38. Original Bill Retrieval

The source builds return bill display data from:

```text
sales2Return
    JOIN
salsntry
    JOIN
newproduct
```

Example:

```sql
select
    S2.srl_no as sn,
    S2.sls_man as slman,
    S2.barcode,
    S2.hsncode as code,
    S2.p_name,
    S2.ProductTamil,
    S2.mrp,
    S2.rate,
    S2.mtr,
    S2.qty,
    S2.amt,
    S2.pdis as pds,
    S2.pdis_amount as pamt,
    S2.dis as bdis,
    S1.bill_less as less,
    S2.tax as gst,
    S2.cgst,
    S2.sgst,
    S2.net_amount as netamt,
    'BILL1' as billno,
    S2.cmnyname as cmy_name,
    S2.cmny_bill as cmy_bill,
    S2.hdngst as gst_per,
    S2.pre_bill_amnt as bdisam,
    s3.unit_de as unit,
    S1.cus_card,
    S1.cus_name,
    S1.mbl_no,
    S1.points,
    S1.bill_disc,
    S1.bill_disc1,
    S1.bill_less
from sales2Return as S1
inner join salsntry as S2
    on S1.mode = S2.mode
inner join newproduct as s3
    on s3.code = S2.hsncode
where S1.mode = @mode
```

Equivalent statements exist for `BILL2` and `BILL3`.

---

# 39. Return from Original Sales Mode

The return document uses:

```text
sales2Return.mode
```

as the major business identifier.

The original sales staging table also uses:

```text
salsntry.mode
```

Therefore the legacy relationship is commonly:

```text
sales2Return.mode
        =
salsntry.mode
```

combined with date and line-level identifiers.

---

# 40. Return Date

The return header has:

```text
date
datetime
```

The staging line also has:

```text
date
SystemDate
LLDate
```

This distinction is important.

Recommended interpretation:

```text
business date
    = accounting/reporting date

created timestamp
    = exact transaction creation time
```

The new ERP should preserve both explicitly.

---

# 41. Account Date

The compiled source references:

```sql
select modifieddate
from accountdate
where currentdate = @date
```

This indicates that the return process participates in the application's business/accounting-date framework.

New ERP should use a centralized business-date service rather than letting individual screens decide the accounting date independently.

---

# 42. Return Print Flow

Return reports include:

```text
salesreturn.rpt
```

and multiple specialized layouts.

The return print flow therefore consumes finalized return data rather than treating the UI grid as the official document.

Logical flow:

```text
Return saved
    ↓
sales2Return + salbillReturns
    ↓
Report parameter: return bill / mode
    ↓
Crystal Report
    ↓
Printed return document
```

---

# 43. QR Code Data

The source explicitly updates QR images on `sales2Return`:

```sql
UPDATE sales2Return
SET QrImage = @QrImage
WHERE sysidandbill = @sysidandbill
  AND mode = @mode
  AND date = @date
```

Bill QR:

```sql
UPDATE sales2Return
SET BillQrImage = @BillQrImage
WHERE sysidandbill = @sysidandbill
  AND mode = @mode
  AND date = @date
```

Gift-token QR:

```sql
UPDATE sales2Return
SET GiftTokenQrImage = @GiftTokenQrImage
WHERE sysidandbill = @sysidandbill
  AND mode = @mode
  AND date = @date
```

Therefore the return document can have QR-code artifacts associated with the header.

---

# 44. Working Return Bill Search

The return line table uses:

```sql
select TOP 1 *
from salbillReturns
where billno = 'BILL1'
  and countername = @counter
```

This is used to determine whether a working return bill exists.

The same mechanism exists for `BILL2` and `BILL3`.

---

# 45. Working Line Number

The source generates the next working line number using:

```sql
select coalesce(
    MAX(cast(sn as int)) + 1,
    '1'
) as max_sl
from salbillReturns
where billno = 'BILL1'
  and countername = @counter
```

Equivalent logic exists for `BILL2` and `BILL3`.

This is a legacy concurrency risk.

Recommended ERP:

```text
identity / sequence / transaction-safe line numbering
```

---

# 46. Return Line Edit

The source updates return lines using a composite predicate including:

```text
sn
barcode
slman
code
p_name
mrp
billno
countername
user_id
```

Example:

```sql
update salbillReturns
set
    pamt = @disaa,
    qty = @qty,
    amt = @totnet,
    gst = @totgst,
    cgst = @scgst,
    sgst = @scgst,
    netamt = @rttnet,
    CheckBarcodeBalanceStock = @resCheckBarcodeBalanceStock,
    gstcrossamt = @netamt,
    pds = @totper01,
    c_Mrp = @c_Mrp,
    c_Amt = @c_Amt,
    mrp = @mrp,
    Token_Dis_Amount = @Token_Dis_Amount,
    rate = @rate1
where sn = @label32
  and barcode = @TextBox8
  and slman = @TextBox7
  and code = @code
  and p_name = @pname
  and mrp = @rate
  and billno = @billno
  and qty >= '0'
  and countername = @Label5
  and user_id = @Label3
```

This demonstrates that a working return line can be edited before final posting.

---

# 47. Negative / Positive Return Quantity Modes

The code contains separate update paths for:

```text
qty >= 0
```

and:

```text
qty <= 0
```

This is important because the legacy billing engine can represent exchange/adjustment scenarios using signed quantities.

The new ERP should not allow arbitrary negative quantity entry without a defined document type.

Recommended model:

```text
Return
Exchange
Correction
Cancellation
```

should be separate transaction types even if the legacy system uses signed quantities.

---

# 48. Return Status on Line

`salbillReturns` contains:

```text
status
costatus
```

and `salsntryReturn` contains:

```text
status
returnStatus
```

Therefore there are multiple state dimensions.

Do not map all of them into one `status` column during migration without tracing the business meaning of each deployed variant.

---

# 49. Return Status vs Billing Status

Conceptually:

```text
returnStatus
    = return-document lifecycle

status
    = line/document operational state

costatus
    = combo/company/transaction processing state in some variants
```

The exact semantic values are variant-specific.

The source proves usage, but not a complete formal enum.

---

# 50. Stock Validation Flag

Return lines contain:

```text
CheckBarcodeBalanceStock
```

The UI uses this value in validation and update statements.

The source also contains the user-facing message:

```text
Do Not Sale The Barcode ...
```

This shows that barcode balance is treated as a business rule in the sales/return engine.

---

# 51. Stock Effect — Confirmed vs Not Proven

The source proves:

- barcode validation occurs,
- `CheckBarcodeBalanceStock` is stored,
- purchase detail is consulted,
- return line records are created,
- return header records are created.

The extracted return-page SQL does **not** prove one universal statement such as:

```sql
UPDATE stockdetails SET qty = qty + @returnQty ...
```

for every sales-return variant.

Therefore the safe conclusion is:

> The return transaction records the reversal and carries stock-validation context, but the exact physical stock-posting mechanism must be traced in the deployed stock/inventory module before migration.

This distinction is important for the ERP rewrite.

---

# 52. Recommended Stock Posting

For the new ERP, the return should create an inventory ledger event:

```text
SALE_RETURN
```

with:

```text
+ quantity
+ meter quantity
```

against the returned barcode/SKU/location.

Example:

```text
Original sale:
barcode 12345
qty -1

Sales return:
barcode 12345
qty +1
```

The stock ledger should become:

```text
Purchase +1
Sale     -1
Return   +1
----------------
Balance  +1
```

---

# 53. Barcode Return Effect

For a unique textile barcode:

```text
Barcode sold
    ↓
barcode unavailable / reduced stock
    ↓
customer returns barcode
    ↓
barcode becomes sellable again
```

The exact legacy mechanism should be reconciled against the stock module.

Do not simply delete the original `salbill` row.

The sale remains historical.

The return is a separate business event.

---

# 54. Sale Must Remain Historical

Incorrect migration:

```text
Delete original sale
```

Correct migration:

```text
Original Sale
    remains immutable

Sales Return
    references Original Sale
```

This preserves:

- audit history,
- customer history,
- sales reports,
- tax history,
- return history,
- margin history.

---

# 55. Partial Return

A customer may return only part of a bill.

Example:

```text
Original bill:
Product A qty 2
Product B qty 1
Product C qty 3

Return:
Product A qty 1
Product C qty 1
```

The return document should contain only the returned quantities.

The original sale remains unchanged.

---

# 56. Full Return

For a complete return:

```text
Original bill total quantity
        =
Returned quantity
```

The return amount should correspond to the original transaction's refundable value after applicable discounts, taxes and adjustments.

---

# 57. Return Over-Quantity Protection

The source compares return quantities against purchase-detail quantities and existing return-side quantities.

New ERP should additionally enforce:

```text
Returnable Qty
=
Original Sold Qty
-
Previously Returned Qty
-
Other Disallowed Adjustments
```

For a barcode-based product:

```text
Returnable Barcode
=
Original Sold Barcode
AND
Not Already Fully Returned
```

---

# 58. Customer Refund Amount

The return header stores:

```text
tot_netamnt
paymenttype
```

but the extracted page does not prove one universal refund-payment posting table for every return mode.

Therefore distinguish:

```text
Return document amount
```

from:

```text
Refund settlement
```

New ERP should create a separate refund/payment transaction linked to the return document.

---

# 59. Refund Methods

Possible refund methods inherited from the sales model include:

```text
Cash
Card
Credit adjustment
UPI / Google Pay
Advance adjustment
Exchange value
```

The exact return payment behavior must be mapped to the deployed billing variant.

---

# 60. Credit Sale Return

For a credit sale:

```text
Original sale
    ↓
Customer receivable increased

Return
    ↓
Receivable should decrease
```

This is not necessarily the same as paying cash to the customer.

Recommended ERP:

```text
Return
    → Credit Note / Sales Return
    → Customer Receivable Adjustment
```

or:

```text
Return
    → Refund Payment
```

depending on settlement choice.

---

# 61. Tax Effect

For a GST sale return:

```text
Original Sale
    taxable amount + GST

Sales Return
    taxable reversal + GST reversal
```

The return header stores:

```text
gst5
gst12
gst18
gst28
igstper
```

The line stores:

```text
gst
cgst
sgst
gst_per
```

The ERP should create a tax reversal ledger rather than merely changing the original invoice.

---

# 62. HSN Effect

The return line uses:

```text
hsncode
PHSN_CODE
```

and `salbillReturns` uses:

```text
code
```

The original product master provides the HSN context.

The ERP should preserve the HSN snapshot from the original sale.

---

# 63. Product Master Lookup

The return bill display joins:

```text
salsntry.hsncode
        ↓
newproduct.code
        ↓
newproduct.unit_de
```

This is a legacy lookup pattern.

For migration, product identity should be converted to:

```text
product_id
sku_id
barcode_id
```

with historical display values retained separately.

---

# 64. Purchase Lineage

A return line can trace:

```text
Return barcode
    ↓
purentrydetails.barcode
    ↓
GRN
    ↓
Supplier
```

This is useful for:

- warranty,
- supplier claims,
- defective goods,
- supplier return decisions,
- purchase-cost analysis.

---

# 65. Sales Lineage

A return line can trace:

```text
Return barcode
    ↓
Original sales staging line
    ↓
Original sales bill
    ↓
Customer
```

This should be a first-class foreign-key relationship in the new ERP.

---

# 66. Complete Document Lineage

```text
Supplier
   ↓
Purchase GRN
   ↓
purentrydetails
   ↓
Barcode
   ↓
Stock
   ↓
Sales Bill
   ↓
salbill / sales2
   ↓
Customer
   ↓
Sales Return
   ↓
sales2Return
salbillReturns
salsntryReturn
   ↓
Stock Restoration
   ↓
Refund / Credit Adjustment
```

---

# 67. Return Bill Header vs Line

Use:

```text
sales2Return
```

for:

- customer,
- bill total,
- date,
- payment type,
- GST totals,
- points,
- return status,
- system/counter context.

Use:

```text
salbillReturns
```

for:

- barcode,
- product,
- quantity,
- meter,
- rate,
- discount,
- tax,
- product attributes.

Use:

```text
salsntryReturn
```

for:

- detailed staging/history,
- source sales context,
- company/continuation numbering,
- combo/offer context,
- operational state.

---

# 68. Return Search

The source searches active returns using:

```sql
select
    mode,
    CONVERT(VARCHAR(10), date, 120) AS date,
    cus_card,
    cus_name,
    mbl_no,
    tot_netamnt
from sales2Return
where mode LIKE '' + @SearchEmpName + '%'
  and returnStatus = '1'
ORDER BY date
```

This provides return-bill search by `mode`.

---

# 69. Return Search Fields

The return header search exposes:

```text
Return/Bill identifier
Date
Customer card
Customer name
Mobile number
Net return amount
```

New ERP should index:

```text
return_number
original_invoice_number
customer_id
barcode
return_date
```

---

# 70. Return Date Reports

The source queries:

```sql
select *
from sales2Return
where date = @date
```

and:

```sql
select *
from sales2Return
where MONTH(date) = @month
```

and:

```sql
select *
from sales2Return
where YEAR(date) = @year
```

This supports day/month/year return reporting.

---

# 71. Daily Return Summary

The source calculates daily return totals using:

```sql
select
    (
        sum(ISNULL(CONVERT(FLOAT,notdislesamt),0))
        - sum(ISNULL(CONVERT(FLOAT,bill_disc1),0))
    ) as TotalCounterSalesAmount,
    sum(ISNULL(CONVERT(FLOAT,bill_less),0)) as TotalLessAmt,
    sum(ISNULL(CONVERT(FLOAT,tot_netamnt),0)) as MainTotalAmt
from sales2Return
where date = @DateToday
```

This proves that return totals are used in daily counter-level reporting.

---

# 72. Counter-wise Return Summary

The source contains:

```sql
select
    systemname as CounterName,
    sum(ISNULL(CONVERT(FLOAT,tot_netamnt),0)) as TotalSalesAmount
from sales2Return
where date = @DateToday
group by systemname
```

Although the alias says `TotalSalesAmount`, the source table is `sales2Return`; this is a legacy naming issue.

The new ERP should name this metric explicitly:

```text
TotalSalesReturnAmount
```

---

# 73. Return Report Families

Confirmed report families include:

```text
salesreturn.rpt
salsreturnbill.rpt
salsreturnbillCombo.rpt
salsreturnbillOnlyCombo.rpt
salsreturnbillOnlyNormal.rpt
salsreturnbillComboWithCombo.rpt
salsreturnbillComboWithNormal.rpt
salsreturnbillComboWithExch.rpt
salsreturnbillComboWithExchNormal.rpt
disalsreturnbill.rpt
disalsreturnbillonly.rpt
```

This shows the legacy system has several return print variants.

---

# 74. Return Report Data Model

The report layer generally needs:

```text
Return Header
    ↓
Return Lines
    ↓
Product
    ↓
Customer
    ↓
Company
    ↓
Counter
```

and, where required:

```text
Original Sale
Barcode
Purchase lineage
Combo information
```

---

# 75. Return Bill Printing

The printed document should display at minimum:

```text
Return Number
Original Bill Number
Date
Customer
Product
Barcode
Qty
Meter
Rate
Discount
GST
Net Return Amount
Refund/Adjustment method
```

The legacy report variants may contain more or fewer fields depending on store configuration.

---

# 76. Return Cancellation

The source proves a status update:

```sql
update sales2Return
set returnStatus = '0'
where returnStatus = '1'
  and mode = @mode
```

This is a logical deactivation rather than a physical deletion of the return header.

Recommended ERP behavior:

```text
Posted Return
    ↓
Cancellation request
    ↓
Authorization
    ↓
Cancellation document
    ↓
Reverse inventory ledger event
    ↓
Reverse refund/credit adjustment
```

Do not hard-delete posted returns.

---

# 77. Working-Line Deletion vs Final Return Cancellation

These are different operations.

### Working line deletion

```sql
delete from salbillReturns
where billno = 'BILL1'
  and countername = @counter
```

This removes unsaved working data.

### Final return cancellation

```sql
update sales2Return
set returnStatus = '0'
where mode = @mode
```

This changes the lifecycle state of a saved return.

The distinction must be preserved in the new ERP.

---

# 78. Return Editing

The source allows return-line updates before finalization.

The line update changes:

```text
quantity
amount
GST
CGST
SGST
net amount
discount
MRP
rate
barcode stock-check flag
token discount
```

New ERP should only allow editing while the return is in:

```text
DRAFT
```

After posting:

```text
CANCEL + RECREATE
```

should be preferred over destructive editing.

---

# 79. Return Transaction Atomicity

Legacy code is distributed across multiple INSERT statements.

Conceptually, a return posting contains:

```text
1. validate original sale
2. validate barcode
3. validate return quantity
4. calculate refund
5. create return lines
6. create return header
7. update inventory
8. update customer/refund ledger
9. update loyalty/offer state
10. generate document artifacts
```

These should be one database transaction in the new ERP.

---

# 80. Recommended ERP Posting Transaction

```text
BEGIN TRANSACTION

1. Lock original sale line
2. Lock barcode/SKU stock record
3. Calculate already-returned quantity
4. Validate requested return quantity
5. Validate customer and original invoice
6. Create sales_return_header
7. Create sales_return_lines
8. Create inventory_ledger SALE_RETURN
9. Create refund/credit ledger
10. Create tax reversal
11. Create loyalty reversal if applicable
12. Create promotion reversal if applicable
13. Mark return POSTED
14. Commit

COMMIT
```

On any error:

```text
ROLLBACK
```

---

# 81. Return Quantity Reconciliation

For every returned line:

```text
Original Sold Qty
    - Previous Returned Qty
    = Remaining Returnable Qty
```

Validation:

```text
Requested Return Qty
    <= Remaining Returnable Qty
```

For meters:

```text
Requested Return Meter
    <= Remaining Returnable Meter
```

For unique barcodes:

```text
Returned Barcode
    must belong to original sale
```

---

# 82. Return Amount Reconciliation

For each line:

```text
Line Gross
- Product Discount
- Allocated Bill Discount
- Less
+/- Tax treatment
= Refundable Net
```

Header:

```text
Σ Return Line Net
- Additional return adjustment
+/- Roundoff
= Return Total
```

The exact legacy formula should be preserved during migration by testing against historical bills.

---

# 83. GST Reconciliation

For each returned line:

```text
Taxable Return Amount
× Original GST Rate
= Tax Reversal
```

For intra-state:

```text
CGST reversal
+
SGST reversal
```

For inter-state:

```text
IGST reversal
```

Do not change tax jurisdiction simply because the current company master differs from the original sale.

---

# 84. Customer Ledger Reconciliation

For cash refund:

```text
Customer payable
    ↓
Cash/bank outflow
```

For credit adjustment:

```text
Customer receivable
    ↓
Reduced by return amount
```

For exchange:

```text
Returned item value
    ↓
Offset against new sale
```

The new ERP should record the chosen settlement explicitly.

---

# 85. Inventory Reconciliation

A posted return should create:

```text
Inventory +Qty
Inventory +Meter
```

for the returned SKU/barcode.

If the item is defective and not resalable, the inventory event should instead route it to a quarantine/damaged location.

Recommended:

```text
RETURN_TO_STOCK
RETURN_TO_DAMAGED
RETURN_TO_QUARANTINE
```

rather than assuming every customer return is immediately sellable.

---

# 86. Original Sale Must Not Be Deleted

Never migrate the return as:

```sql
delete from salbill ...
```

The original sale is historical evidence.

The return should be an additional transaction.

---

# 87. Return vs Sale Cancellation

These are different business events.

### Sale Return

```text
Customer keeps transaction history
Item comes back
Inventory increases
Refund/credit issued
```

### Sale Cancellation

```text
Original transaction is voided
Usually before settlement/posting finalization
```

Legacy status fields can blur these concepts.

New ERP should separate them.

---

# 88. Return vs Exchange

Exchange should be modeled as:

```text
Return old item
+
New sale of replacement item
```

rather than changing the original sale line.

This preserves:

- revenue,
- tax,
- inventory,
- customer history.

---

# 89. Combo Return

Combo-related fields include:

```text
comboname
combostatus
combobarcode
costatus
cqty
corate
corate1
corate2
corate3
corate4
```

A combo return must define whether:

```text
whole combo
```

or:

```text
individual component
```

is being returned.

The legacy source supports both specialized report variants, but a single universal combo-return rule is not proven from the source alone.

---

# 90. Promotion Return

Fields such as:

```text
Token_Dis_Amount
Token_Dis_Gift_Amount
Gift_Amount_wiseToken
GiftValueFromDate
GiftValueToDate
GiftNoCopy
ProductToAmount
Single_Token_Amount
```

indicate promotion-aware returns.

New ERP should store the original promotion allocation on the sale line and reverse it during return.

---

# 91. Loyalty Return

If the original sale generated points:

```text
Sale
 ↓
Points earned
```

A return should normally generate:

```text
Return
 ↓
Points reversal
```

If points were redeemed on the original sale, the return policy may differ.

The exact legacy points algorithm is not completely proven from the return page source.

---

# 92. Supplier vs Customer Return

Do not confuse:

```text
Purchase Return
```

with:

```text
Sales Return
```

Purchase return:

```text
Store → Supplier
```

Sales return:

```text
Customer → Store
```

They have opposite commercial directions and different accounting effects.

---

# 93. Purchase Return vs Sales Return Inventory Direction

```text
Purchase Return
    Inventory -
    Supplier payable -

Sales Return
    Inventory +
    Customer refund / receivable adjustment
```

This is a critical migration rule.

---

# 94. Sales Return and Purchase Cost

Return lines preserve:

```text
prate
nrate
```

This is useful for margin reconstruction.

A return should reverse the appropriate cost/margin effect of the original sale.

New ERP should record cost snapshot on the original sale and use that snapshot when calculating return margin impact.

---

# 95. Barcode Cost Lineage

The source retrieves:

```sql
select
    grn_no,
    design,
    brand,
    patrn,
    size,
    color,
    style,
    prate,
    nrate,
    mrpdisper,
    diamond
from purentrydetails
where barcode = @barcode
```

Therefore the return engine can connect a returned barcode to its purchase cost lineage.

This is important for:

```text
COGS reversal
Margin reversal
Supplier analysis
Stock valuation
```

---

# 96. Return Profit Reversal

`sales2Return` contains:

```text
BarcodeWiseProfit
```

Therefore return reporting can preserve profit impact.

Recommended ERP:

```text
Original sale profit
        ↓
Sales return reversal
        ↓
Net profit impact
```

Do not recompute historical profit from today's cost.

---

# 97. Return Bill Identifier

The source uses:

```text
mode
billno
sysidandbill
```

These have different purposes.

Recommended normalized model:

```text
return_id              internal UUID/identity
return_number          customer-facing number
original_sale_id       FK
original_invoice_no    display reference
```

---

# 98. `sysidandbill`

`sales2Return` contains:

```text
sysidandbill
```

This is used when updating QR images.

Therefore it participates in document identity.

New ERP should replace such compound identifiers with:

```text
return_id
```

and store human-readable numbers separately.

---

# 99. Return Bill Date + Mode Lookup

QR updates use:

```sql
WHERE sysidandbill = @sysidandbill
  AND mode = @mode
  AND date = @date
```

This indicates that the legacy system relies on a multi-column document lookup.

Recommended ERP:

```text
return_id
```

should be sufficient for updates.

---

# 100. SQL Injection Risk

Some legacy query patterns concatenate identifiers directly into SQL.

Example patterns include:

```text
where mode=' + value
```

and:

```text
where barcode=' + value
```

New ERP should use parameterized SQL everywhere.

---

# 101. Concurrency Risk

Working-line numbering uses:

```sql
MAX(CAST(sn AS int)) + 1
```

This can produce duplicates under concurrent users.

New ERP should use:

```text
identity
sequence
or transaction-safe counter
```

---

# 102. Hard Delete Risk

Working records may be physically deleted:

```sql
delete from salbillReturns
where billno = 'BILL1'
```

That is acceptable for an unsaved working bill.

A posted return should never be physically deleted.

Use:

```text
CANCELLED
```

plus reversal entries.

---

# 103. Return Audit Requirements

New ERP should record:

```text
Return created by
Return created at
Return approved by
Return approved at
Return posted by
Return posted at
Return cancelled by
Return cancelled at
Cancellation reason
Refund method
Original invoice
Original sale line
```

The legacy system has partial equivalents but not a single normalized audit model.

---

# 104. Recommended New ERP Return Header

```text
sales_return_header
-------------------
id
return_number
original_sale_id
original_invoice_no
customer_id
company_id
branch_id
store_id
counter_id
return_date
business_date
return_type
settlement_type
subtotal
discount_amount
bill_discount_amount
less_amount
taxable_amount
cgst_amount
sgst_amount
igst_amount
tax_amount
roundoff_amount
net_return_amount
refund_amount
credit_amount
points_reversed
status
created_by
created_at
approved_by
approved_at
posted_by
posted_at
cancelled_by
cancelled_at
cancellation_reason
```

---

# 105. Recommended New ERP Return Line

```text
sales_return_line
-----------------
id
return_id
original_sale_line_id
original_barcode_id
product_id
sku_id
barcode
product_code
product_name_snapshot
unit_snapshot
mrp_snapshot
sale_rate_snapshot
purchase_rate_snapshot
qty
meter_qty
line_amount
product_discount_percent
product_discount_amount
allocated_bill_discount
less_amount
taxable_amount
cgst_percent
cgst_amount
sgst_percent
sgst_amount
igst_percent
igst_amount
tax_amount
net_return_amount
brand_snapshot
pattern_snapshot
size_snapshot
color_snapshot
style_snapshot
design_snapshot
rack_id
return_condition
return_destination
created_at
```

---

# 106. Recommended Return Inventory Ledger

```text
inventory_ledger
----------------
id
transaction_type = SALE_RETURN
reference_type = SALES_RETURN
reference_id
product_id
sku_id
barcode_id
store_id
rack_id
qty_delta
meter_delta
cost_rate
sale_rate
business_date
created_at
created_by
```

Example:

```text
transaction_type: SALE_RETURN
qty_delta: +1
```

---

# 107. Recommended Refund Ledger

```text
return_settlement
-----------------
id
return_id
method
amount
reference_no
bank_or_provider
customer_id
created_at
created_by
```

This keeps the commercial return document separate from payment settlement.

---

# 108. Recommended Tax Reversal

```text
return_tax_line
---------------
id
return_id
return_line_id
tax_type
rate
taxable_amount
tax_amount
jurisdiction
created_at
```

This makes GST reconciliation auditable.

---

# 109. Recommended Return State Machine

```text
DRAFT
  ↓
VALIDATED
  ↓
APPROVED
  ↓
POSTED
  ↓
SETTLED
```

Cancellation:

```text
POSTED
  ↓
CANCELLED
  ↓
REVERSAL POSTED
```

The legacy `returnStatus` can be mapped into this model after reviewing actual status values in the database.

---

# 110. Return Validation Checklist

Before posting:

```text
[ ] Original sale exists
[ ] Original sale is not cancelled
[ ] Customer is identified when required
[ ] Barcode belongs to original sale
[ ] Barcode has remaining returnable quantity
[ ] Return quantity > 0
[ ] Return meter <= remaining meter
[ ] Product/company is valid
[ ] Tax snapshot is available
[ ] Return price is valid
[ ] Discount allocation is valid
[ ] GST calculation balances
[ ] Net return total balances
[ ] Refund method is valid
[ ] Counter is valid
[ ] User is authorized
```

---

# 111. Return Posting Checklist

```text
[ ] Create return header
[ ] Create return lines
[ ] Link original sale lines
[ ] Post inventory +qty
[ ] Post meter +qty where applicable
[ ] Post GST reversal
[ ] Post customer ledger adjustment
[ ] Post refund if applicable
[ ] Reverse loyalty points if applicable
[ ] Reverse promotion benefits if applicable
[ ] Mark return POSTED
[ ] Generate return number
[ ] Generate QR/report artifact
```

---

# 112. Return Cancellation Checklist

```text
[ ] Verify return is posted
[ ] Verify no downstream dependency blocks cancellation
[ ] Authorize cancellation
[ ] Create inventory reversal
[ ] Reverse refund/ledger effect
[ ] Reverse tax effect
[ ] Reverse loyalty effect
[ ] Set return status cancelled
[ ] Record cancellation reason
[ ] Record cancelling user/time
```

---

# 113. Migration Mapping: Legacy → New ERP

| Legacy | New ERP |
|---|---|
| `sales2Return` | `sales_return_header` |
| `salbillReturns` | `sales_return_line` |
| `salsntryReturn` | `sales_return_staging` / migration history |
| `mode` | `return_number` / legacy reference |
| `sysidandbill` | `return_id` / legacy key |
| `billno` | working bill number |
| `cus_name` | customer snapshot / customer_id |
| `cus_card` | customer_id/card reference |
| `barcode` | barcode_id |
| `code` | product_code / product_id |
| `qty` | qty |
| `mtr` | meter_qty |
| `rate` | sale_rate_snapshot |
| `prate` | purchase_rate_snapshot |
| `mrp` | mrp_snapshot |
| `pds` | line_discount_percent |
| `pamt` | line_discount_amount |
| `bdis` | bill_discount allocation |
| `less` | less_amount |
| `gst` | tax_amount |
| `cgst` | cgst_amount |
| `sgst` | sgst_amount |
| `gst_per` | tax_rate |
| `gst_group` | tax_group_id/snapshot |
| `returnStatus` | return status |
| `UserID` | created_by/posted_by |
| `systemname` | counter/store reference |
| `counterID` | counter_id |
| `brand` | brand snapshot |
| `patrn` | pattern snapshot |
| `size` | size snapshot |
| `color` | color snapshot |
| `style` | style snapshot |
| `design` | design snapshot |
| `rackno` | rack_id |
| `Token_Dis_Amount` | promotion allocation |
| `points` | loyalty transaction |

---

# 114. Migration Rule: Preserve Original Sale

During migration:

```text
Original Sale
    ↓
legacy sales2/salbill/salsntry
    ↓
new sales_invoice_header/line
```

Then:

```text
Legacy Return
    ↓
new sales_return_header/line
    ↓
original_sale_id
```

Do not create a return without linking it to the original sale when the legacy data provides enough information to do so.

---

# 115. Migration Rule: Barcode Reconciliation

For each return line:

```text
legacy barcode
    ↓
find barcode master
    ↓
find original sale line
    ↓
verify product/SKU
    ↓
verify original quantity
    ↓
verify previously returned quantity
```

Exceptions should be placed into a reconciliation queue.

---

# 116. Migration Rule: Return Amount Reconciliation

For each return document:

```text
Σ migrated return lines
    = legacy tot_netamnt
```

Allow only documented differences due to:

```text
roundoff
legacy rounding
known tax conversion
```

Do not silently adjust migrated amounts.

---

# 117. Migration Rule: Tax Reconciliation

For each return:

```text
legacy gst5
legacy gst12
legacy gst18
legacy gst28
```

must reconcile to the migrated tax lines.

For state tax:

```text
CGST + SGST
```

For inter-state:

```text
IGST
```

---

# 118. Migration Rule: Status Reconciliation

Do not map:

```text
returnStatus = 0
```

blindly to `DELETED`.

First establish whether the record means:

```text
Cancelled
Voided
Inactive
Reversed
```

The source proves deactivation but not the complete business enum.

---

# 119. Migration Rule: Working Records

Rows with:

```text
BILL1
BILL2
BILL3
```

may be unsaved working records.

Migration should distinguish:

```text
final posted return
```

from:

```text
working/draft return
```

Do not migrate abandoned working bills as posted returns.

---

# 120. Return Reconciliation Queries

### Return header count

```sql
select count(*)
from sales2Return
where date between @from and @to
```

### Active returns

```sql
select count(*)
from sales2Return
where returnStatus = '1'
  and date between @from and @to
```

### Return amount

```sql
select sum(convert(float,tot_netamnt))
from sales2Return
where date between @from and @to
```

### Return lines

```sql
select count(*)
from salbillReturns
where billno not in ('BILL1','BILL2','BILL3')
```

The exact exclusion rule should be adjusted to the production database's final-document conventions.

---

# 121. Return-to-Sale Reconciliation

Recommended validation query concept:

```sql
select
    r.mode,
    r.date,
    r.tot_qty,
    r.tot_netamnt,
    count(l.barcode) as return_lines
from sales2Return r
left join salbillReturns l
    on l.billno = r.billno
where r.date between @from and @to
group by
    r.mode,
    r.date,
    r.tot_qty,
    r.tot_netamnt
```

Because the exact legacy bill-number relationship varies by variant, the production reconciliation query must be validated before use.

---

# 122. Return Barcode Reconciliation

For each barcode:

```text
Original Sale Qty
        -
Previous Returns
        =
Remaining Returnable Qty
```

Then:

```text
New Return Qty
<= Remaining Returnable Qty
```

This should be a hard posting rule in the new ERP.

---

# 123. Return and Stock Audit

Recommended report:

| Barcode | Sold Qty | Returned Qty | Net Sold Qty | Current Stock |
|---|---:|---:|---:|---:|
| B001 | 1 | 1 | 0 | 1 |
| B002 | 3 | 1 | 2 | 2 |

This catches duplicate return postings.

---

# 124. Return and Customer Audit

Recommended:

```text
Customer
    ↓
Original Sales
    ↓
Sales Returns
    ↓
Refunds / Credits
    ↓
Outstanding Balance
```

The return document should never be treated as proof that the refund was paid.

---

# 125. Return and Cash Audit

For cash refunds:

```text
Return total
    =
Cash refund
```

unless part of the return is:

```text
credit
exchange
advance adjustment
```

The settlement ledger must explain the difference.

---

# 126. Return and GST Audit

Recommended report:

```text
Return Number
Original Invoice
Taxable Amount
CGST Reversal
SGST Reversal
IGST Reversal
Total Return
```

This should reconcile to `sales2Return` tax totals.

---

# 127. Return and Profit Audit

Recommended:

```text
Original Sale Revenue
Original Cost
Original Profit
        ↓
Return Revenue Reversal
Cost Reversal
Profit Reversal
        ↓
Net Revenue
Net Cost
Net Profit
```

Use the original cost snapshot rather than today's purchase rate.

---

# 128. Return Condition

Legacy return tables do not expose a clearly standardized condition enum such as:

```text
GOOD
DAMAGED
DEFECTIVE
OPENED
```

New ERP should add:

```text
return_condition
```

because stock disposition depends on it.

---

# 129. Return Destination

Recommended:

```text
RETURN_TO_SELLABLE_STOCK
RETURN_TO_QUARANTINE
RETURN_TO_DAMAGED
RETURN_TO_SUPPLIER
```

This is particularly important for textile goods with packaging, tailoring, damage or quality issues.

---

# 130. Authorization

The source stores the user ID but does not prove a normalized approval workflow.

New ERP should support configurable authorization:

```text
Return <= threshold
    → counter user

Return > threshold
    → supervisor approval

High-value / repeated return
    → manager approval
```

The thresholds are business-policy decisions, not inferred from the legacy source.

---

# 131. Return Number Generation

The legacy source uses multiple numbering mechanisms inherited from the sales engine.

Because the exact production numbering formula can vary by company/counter configuration, the new ERP should use:

```text
Company + Fiscal Year + Return Sequence
```

or another explicitly configured sequence.

Avoid `MAX + 1`.

---

# 132. Fiscal Year

The legacy return tables store `date` but do not demonstrate a modern fiscal-year sequence key.

New ERP should maintain:

```text
financial_year_id
```

and generate return numbers within the correct sequence.

---

# 133. Multi-Company Return

The return line stores multiple company-related values.

New ERP should make company identity explicit:

```text
company_id
branch_id
store_id
counter_id
```

and validate that the original sale belongs to the same business context unless an authorized inter-company process exists.

---

# 134. Multi-Counter Return

A return may be entered from a counter other than the original sale counter depending on business policy.

The ERP should store:

```text
original_counter_id
return_counter_id
```

rather than overwriting the original context.

---

# 135. Return from Another Store

If allowed:

```text
Original Store
    ↓
Original Sale
    ↓
Return Store
```

Inventory should be restored to the actual return destination.

The legacy source does not prove a formal cross-store return workflow, so this should be treated as a configurable ERP requirement.

---

# 136. Sales Return End-to-End Flow

```text
1. Customer presents sold item
        ↓
2. User selects Sales Return
        ↓
3. Identify original invoice / mode
        ↓
4. Retrieve original sales lines
        ↓
5. Identify barcode/product
        ↓
6. Retrieve purchase/barcode context
        ↓
7. Validate returnable quantity
        ↓
8. Load product attributes
        ↓
9. Load original price/discount/tax
        ↓
10. Create working return line
        ↓
11. Calculate line return amount
        ↓
12. Calculate GST reversal
        ↓
13. Calculate bill-level return adjustment
        ↓
14. Calculate total return amount
        ↓
15. Create return staging record
        ↓
16. Create return line record
        ↓
17. Create return header
        ↓
18. Mark return active/posted
        ↓
19. Post inventory restoration
        ↓
20. Post refund/credit adjustment
        ↓
21. Reverse points/promotions where required
        ↓
22. Generate QR/report artifact
        ↓
23. Print return document
        ↓
24. Reconcile return against original sale
```

---

# 137. Simplified Architecture

```text
                  PRODUCT MASTER
                       │
                       ▼
                    BARCODE
                       │
            ┌──────────┴──────────┐
            ▼                     ▼
        PURCHASE                 SALES
            │                     │
   purentrydetails          salbill / salsntry
            │                     │
            └──────────┬──────────┘
                       ▼
                SALES RETURN
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
 salsntryReturn  salbillReturns  sales2Return
        │              │              │
        └──────────────┼──────────────┘
                       ▼
               STOCK RESTORATION
                       │
                       ▼
              REFUND / CREDIT NOTE
```

---

# 138. Recommended New ERP Architecture

```text
sales_invoice_header
        │
        └── sales_invoice_line
                 │
                 └── barcode_id

sales_return_header
        │
        └── sales_return_line
                 │
                 ├── original_sale_line_id
                 ├── barcode_id
                 └── inventory disposition

inventory_ledger
        │
        ├── SALE
        └── SALE_RETURN

customer_ledger
        │
        ├── SALE_RECEIVABLE
        └── SALES_RETURN_CREDIT

payment_ledger
        │
        └── RETURN_REFUND

tax_ledger
        │
        └── SALES_RETURN_TAX_REVERSAL
```

---

# 139. What Should Be Preserved Exactly

For migration, preserve:

```text
Original invoice reference
Original sales line
Barcode
Product code
Product name snapshot
Quantity
Meter
MRP
Sale rate
Purchase rate
Discount
Bill discount
Less
GST
CGST
SGST
IGST where applicable
Customer
Company
Counter
Return date
Return status
User
Promotion/token values
Loyalty values
```

---

# 140. What Should Be Normalized

Normalize:

```text
customer_id
product_id
sku_id
barcode_id
company_id
branch_id
store_id
counter_id
user_id
original_sale_id
original_sale_line_id
tax_code
promotion_id
loyalty_account_id
```

---

# 141. What Should Not Be Used as Primary Keys

Avoid using:

```text
product name
customer name
barcode text alone
mode alone
billno alone
counter name
systemname
```

as relational primary keys.

Use surrogate/identity IDs and retain legacy keys for migration traceability.

---

# 142. Legacy Return Data Quality Risks

Potential issues include:

```text
Multiple return tables
Multiple billing variants
Compound identifiers
MAX + 1 numbering
Working BILL1/BILL2/BILL3 rows
String-concatenated SQL
Signed quantity semantics
Ambiguous status values
Duplicated snapshots
Missing explicit original-sale FK
Stock-posting logic distributed across modules
```

---

# 143. High-Risk Migration Area: Original Sale Matching

Matching should prioritize:

```text
1. Barcode
2. Original invoice/mode
3. Original date
4. Original line number
5. Product code
6. Customer/company context
```

Do not match only by product name.

---

# 144. High-Risk Migration Area: Duplicate Returns

A duplicate return can occur if:

```text
same barcode
same original sale
same quantity
```

is imported twice.

The migration process should maintain an idempotency key:

```text
legacy_return_key
```

and reject duplicate imports.

---

# 145. High-Risk Migration Area: Cancelled Returns

Cancelled/inactive return records should not affect:

```text
stock
customer balance
refunds
GST
profit
```

unless the legacy system's accounting treatment explicitly requires it.

---

# 146. High-Risk Migration Area: Working Returns

Do not post:

```text
BILL1
BILL2
BILL3
```

as final returns without evidence of finalization.

---

# 147. High-Risk Migration Area: Return Amount

Do not recompute all historical returns from current price masters.

Use stored transaction values:

```text
rate
pamt
bdis
less
gst
netamt
```

where available.

---

# 148. High-Risk Migration Area: Tax

Do not apply today's GST rate to old returns.

Use:

```text
original tax snapshot
```

and migrate tax totals exactly.

---

# 149. High-Risk Migration Area: Loyalty

Do not simply delete points when a return exists.

Create an auditable reversal:

```text
POINT_EARN
POINT_REVERSE
```

---

# 150. High-Risk Migration Area: Promotion

A returned promotional item may affect eligibility for the original promotion.

The legacy fields indicate promotion/token support, but the complete rule is variant-specific.

New ERP should store:

```text
promotion allocation per original sale line
```

and reverse it deterministically.

---

# 151. Operational Reports Required in New ERP

### Return Register

```text
Return No
Date
Original Invoice
Customer
Counter
Total
Status
```

### Return Item Report

```text
Return No
Barcode
Product
Qty
Rate
Net Return
```

### Barcode Return History

```text
Barcode
Original Sale
Return No
Sold Qty
Returned Qty
Remaining Qty
```

### Customer Return History

```text
Customer
Invoice
Return
Amount
Refund Method
```

### Tax Return Report

```text
GST Rate
Taxable
CGST
SGST
IGST
Total
```

### Counter Return Report

```text
Counter
Return Qty
Return Amount
```

---

# 152. Daily Close Reconciliation

At day close:

```text
Sales Return Header Total
        =
Sales Return Line Total
```

Then:

```text
Return Amount
        =
Refund + Credit + Exchange Adjustment
```

Then:

```text
Inventory Return Qty
        =
Posted Return Qty
```

Then:

```text
GST Reversal
        =
Return Tax Ledger
```

---

# 153. Month-End Reconciliation

Month-end should reconcile:

```text
Sales
- Sales Returns
= Net Sales
```

and:

```text
Sales GST
- Sales Return GST
= Net Output GST
```

and:

```text
Sales COGS
- Return COGS Reversal
= Net COGS
```

---

# 154. Accounting Interpretation

Conceptually:

### Original sale

```text
Dr Customer / Cash
Cr Sales Revenue
Cr Output GST
```

### Sales return

```text
Dr Sales Return / Revenue Reversal
Dr Output GST Reversal
Cr Customer / Cash
```

Inventory side:

```text
Dr Inventory
Cr COGS
```

The exact accounting chart must follow the new ERP's finance configuration.

---

# 155. Return and Customer Credit

For a credit customer:

```text
Original receivable
    + Sale
    - Return
    - Payment
    = Outstanding
```

The return should therefore reduce the customer balance.

---

# 156. Return and Cash Refund

For a cash refund:

```text
Return posted
    ↓
Cash payment
```

The cash transaction must reference the return number.

---

# 157. Return and Exchange

For exchange:

```text
Return old item
    ↓
Credit old item value
    ↓
Sell replacement item
    ↓
Collect/pay difference
```

This should produce two auditable documents/events.

---

# 158. Return and Stock Location

If the returned barcode goes back to the same rack:

```text
SALE_RETURN
store = same
rack = same
```

If moved to a return/quarantine area:

```text
SALE_RETURN
store = return store
rack = quarantine rack
```

This is preferable to silently changing the old sale line.

---

# 159. Return and Barcode State

Recommended barcode state machine:

```text
IN_STOCK
   ↓
SOLD
   ↓
RETURNED
   ↓
IN_STOCK
```

Alternative defective path:

```text
SOLD
  ↓
RETURNED
  ↓
DAMAGED / QUARANTINE
```

---

# 160. Return and Serial/Unique Item

For one-piece barcode inventory:

```text
barcode_id
```

should identify exactly one inventory unit.

A return of that barcode should not create a second barcode.

---

# 161. Return and Meter Goods

For meter-based products:

```text
barcode
qty
mtr
```

must all be tracked.

Example:

```text
Original sale
qty = 1
mtr = 5.50

Return
qty = 1
mtr = 5.50
```

Do not infer meter from quantity.

---

# 162. Return and Piece Goods

For piece goods:

```text
qty = 1
mtr = 0
```

or the deployed representation should be retained.

Migration should not normalize zero/null behavior without checking production data.

---

# 163. Return and Textile Attributes

Preserve:

```text
Brand
Pattern
Size
Color
Style
Design
Model
Fashion
```

because these are used by downstream stock and sales reports.

---

# 164. Return and HSN

Preserve both legacy HSN concepts where applicable:

```text
hsncode
PHSN_CODE
```

Do not merge them without validating the downstream GST/report usage.

---

# 165. Return and Unit

The return line contains:

```text
unit
```

and the product master contains:

```text
unit_de
```

The return should preserve the original transaction unit.

---

# 166. Return and Product Name Tamil

The return line supports:

```text
pnameTamil
ProductTamil
PrintNameTam
```

This enables Tamil billing/report output.

The ERP should preserve historical display names separately from the current product master.

---

# 167. Return and Print Name

The customer-facing return document should use the original transaction display name when available.

Do not replace historical print names with today's product print name during migration.

---

# 168. Return and Salesman

Return lines contain:

```text
slman
sls_man
```

The header can contain:

```text
CustomerMan
```

These should not be merged without understanding whether the field means:

```text
salesperson
customer representative
operator
```

---

# 169. Return and Counter

Return line:

```text
countername
counterID
```

Header:

```text
systemname
```

Recommended normalized fields:

```text
return_counter_id
```

and, where useful:

```text
original_sale_counter_id
```

---

# 170. Return and Company Bill Number

The line stores:

```text
cmy_bill
company_billno
comp_continu_billno
```

These represent different legacy company numbering contexts.

During migration, retain all as legacy references until business reconciliation confirms their exact purpose.

---

# 171. Return and QR

Return QR images are stored at header level.

This means the QR is a document artifact, not an item attribute.

New ERP should preferably store:

```text
qr_payload
qr_generated_at
```

and generate the image on demand or store it in object storage.

---

# 172. Return and Report Images

The legacy system stores QR image data directly/indirectly in the return header.

New ERP should avoid storing large binary images in the transactional header unless there is a clear requirement.

---

# 173. Return API / Web Method

The page exposes a customer lookup web method:

```text
GetCusName
```

This demonstrates that the return screen uses AJAX-assisted lookup rather than only server-side postbacks.

New ERP can replace this with:

```http
GET /customers/search?q=...
```

or an equivalent typed API.

---

# 174. Return UI Numeric Validation

The page contains client-side numeric validation for:

```text
integer
number with decimal
meter values
```

This is appropriate for quantity and meter entry but must not replace server-side validation.

---

# 175. Return UI Character Validation

The page applies regular-expression masks to selected fields.

This provides input hygiene but should not be treated as security.

New ERP should validate:

```text
server-side
DB constraints
API schema
```

as well.

---

# 176. Return UI Customer Validation

Customer lookup returns:

```text
customer name
customer card
mobile
```

The return process should use a stable customer ID after selection.

---

# 177. Return UI Bill Selection

The return flow supports bill-level context and can populate working return bills.

Recommended UX:

```text
Search Invoice
    ↓
Show original lines
    ↓
Select return lines
    ↓
Enter return qty
    ↓
Show refundable amount
    ↓
Confirm return
```

---

# 178. Return UI Barcode Selection

Recommended new flow:

```text
Scan barcode
    ↓
Find original sale
    ↓
Show product
    ↓
Show sale date
    ↓
Show original rate
    ↓
Show returnable qty
    ↓
Enter return qty
```

This is safer than allowing arbitrary product selection.

---

# 179. Return UI Error Conditions

The source includes return/balance validation paths and stock warnings.

New ERP should explicitly report:

```text
Invoice not found
Barcode not found
Barcode not sold
Return quantity exceeds sold quantity
Barcode already fully returned
Return date invalid
GST mismatch
Refund amount mismatch
Customer mismatch
Store mismatch
```

---

# 180. End-to-End Example

Assume:

```text
Original invoice: S000123
Customer: Customer A
Barcode: TX000456
Product: Cotton Saree
Qty: 1
Sale rate: ₹2,000
GST: 5%
```

Customer returns the same barcode.

Flow:

```text
1. Search S000123
2. Load barcode TX000456
3. Verify it was sold
4. Check prior returns = 0
5. Return qty = 1
6. Load original rate ₹2,000
7. Calculate taxable/discount amount
8. Calculate GST reversal
9. Create return line
10. Create return header
11. Post inventory +1
12. Create refund/credit adjustment
13. Mark return posted
14. Print return document
```

---

# 181. Partial Return Example

Original:

```text
Invoice S000124

A qty 2 × ₹500
B qty 1 × ₹1,000
```

Customer returns:

```text
A qty 1
```

Return document:

```text
Return qty = 1
Return amount = original line value for 1 unit
```

Original sale remains:

```text
A qty 2
B qty 1
```

Return ledger provides the reduction.

---

# 182. Multiple Return Example

Original:

```text
Barcode TX001
Sold qty = 3
```

First return:

```text
qty = 1
```

Second return:

```text
qty = 1
```

Remaining returnable:

```text
3 - 1 - 1 = 1
```

Third return can be:

```text
qty = 1
```

Fourth return:

```text
REJECT
```

---

# 183. Full Return Example

Original:

```text
Net sale = ₹10,500
```

Full return:

```text
Return taxable value
+ tax reversal
= refundable net value
```

Any non-refundable amount must be explicitly supported by business policy.

---

# 184. Exchange Example

Original item:

```text
₹2,000
```

Replacement item:

```text
₹2,500
```

Flow:

```text
Return old item: +₹2,000 credit
New sale: ₹2,500
Customer pays: ₹500
```

The two transactions should remain separately auditable.

---

# 185. Defective Return Example

Customer returns:

```text
Barcode TX009
```

Inspection says defective.

Flow:

```text
Sales Return
    ↓
Inventory +1
    ↓
Destination = DAMAGED
```

It should not automatically appear as sellable stock.

---

# 186. Recommended Document Relationship

```text
sales_invoice_header
        1
        │
        ├───────────────< sales_invoice_line
        │
        │
        └───────────────< sales_return_header
                              │
                              └────────< sales_return_line
                                             │
                                             ├── original_sale_line_id
                                             └── barcode_id
```

---

# 187. Recommended Inventory Relationship

```text
sales_return_line
       │
       ▼
inventory_ledger
       │
       └── SALE_RETURN
```

The inventory ledger becomes the authoritative stock movement history.

---

# 188. Recommended Financial Relationship

```text
sales_return_header
       │
       ├── customer_ledger
       ├── payment_ledger
       └── tax_ledger
```

This avoids embedding all accounting behavior in the sales-return screen.

---

# 189. Recommended Audit Relationship

```text
sales_return_header
       │
       └── audit_log
            ├── CREATED
            ├── APPROVED
            ├── POSTED
            └── CANCELLED
```

---

# 190. Confirmed Source Facts

The following are directly supported by source inspection:

1. `GstReturnSalesentryNewsaleAll.aspx` is a Sales Return Entry page.
2. The page uses `GstReturnSalesentryNewsaleAllJS` scripts.
3. `salbillReturns` is used for return billing lines.
4. `sales2Return` is used for return bill/header data.
5. `salsntryReturn` is used for return staging/history.
6. `returnStatus` is stored in return records.
7. `returnStatus='1'` is used in active-return searches.
8. `returnStatus` can be changed to `0`.
9. `BILL1`, `BILL2`, `BILL3` are working return bill buckets.
10. Return line numbers use `MAX(sn)+1` in the legacy implementation.
11. Barcode quantities are checked.
12. `purentrydetails` is joined by barcode for validation/context.
13. Purchase GRN, design, brand, pattern, size, color, style and rates can be retrieved by barcode.
14. Return lines store product and transaction snapshots.
15. Return headers store GST totals.
16. Return headers store customer information.
17. Return headers store points/promotion fields.
18. QR image fields are updated on `sales2Return`.
19. Crystal Reports exist for sales return printing.
20. Daily/counter return totals are queried from `sales2Return`.

---

# 191. Not Proven from the Return Page Alone

The following require production DB / broader application tracing before being treated as confirmed:

1. The exact universal stock-decrement/increment SQL for every return variant.
2. The exact refund-payment table used by every return mode.
3. The complete meaning of every status value.
4. Whether every return must reference an original invoice.
5. The exact loyalty point reversal algorithm.
6. The exact promotion reversal algorithm.
7. Whether cross-store returns are supported in every deployment.
8. Whether all variants post inventory synchronously.
9. The exact accounting journal generated for every payment mode.
10. The complete return-number generation rule for every company/counter.

These should remain explicit migration work items rather than assumptions.

---

# 192. Final End-to-End Architecture

```text
                       CUSTOMER
                           │
                           ▼
                   ORIGINAL SALES BILL
                           │
                ┌──────────┴──────────┐
                │                     │
                ▼                     ▼
             sales2                 salbill
                │                     │
                └──────────┬──────────┘
                           ▼
                       salsntry
                           │
                           │ original sale context
                           ▼
                 SALES RETURN ENTRY
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            ▼            ▼
         Customer      Barcode      Original Qty
              │            │            │
              └────────────┼────────────┘
                           ▼
                   Return Validation
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
       Product          Purchase          Tax/Discount
       Snapshot         Barcode Data      Snapshot
          │                │                │
          └────────────────┼────────────────┘
                           ▼
                    Return Calculation
                           │
                           ▼
                    salsntryReturn
                           │
                           ▼
                    salbillReturns
                           │
                           ▼
                     sales2Return
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
       Inventory        Customer          Tax
       +Qty             Credit/Refund     Reversal
          │                │                │
          └────────────────┼────────────────┘
                           ▼
                     Return Posted
                           │
                           ▼
                     QR / Printing
                           │
                           ▼
                       Reports
```

---

# 193. Final ERP Design Recommendation

The legacy system should be migrated conceptually as:

```text
Original Sale
    ↓
Sales Return Header
    ↓
Sales Return Lines
    ↓
Inventory Ledger
    ↓
Customer/Payment Ledger
    ↓
Tax Ledger
    ↓
Promotion/Loyalty Ledger
```

Do not reproduce the legacy table structure one-to-one as the new business model.

Instead:

```text
sales2Return
salbillReturns
salsntryReturn
```

should be treated as **historical source representations of one business process**.

The new ERP should provide one normalized Sales Return document with explicit relationships.

---

# 194. Recommended Core Rule

The most important rule for the new ERP is:

```text
A sales return is an independent reversal transaction linked to the original sale.
```

It must not modify or delete the original sale merely to make current stock or customer balance look correct.

The correct model is:

```text
Original Sale
       +
Sales Return
       +
Inventory Reversal
       +
Financial Reversal
       +
Tax Reversal
       +
Optional Loyalty/Promotion Reversal
```

This gives a complete audit trail.

---

# 195. Final Migration Checklist

```text
[ ] Extract sales2Return
[ ] Extract salbillReturns
[ ] Extract salsntryReturn
[ ] Identify final vs working BILL1/BILL2/BILL3 rows
[ ] Identify active vs inactive returns
[ ] Resolve original sale
[ ] Resolve original sale line
[ ] Resolve barcode
[ ] Resolve product/SKU
[ ] Preserve product snapshots
[ ] Preserve qty
[ ] Preserve meter
[ ] Preserve sale rate
[ ] Preserve purchase rate
[ ] Preserve discount
[ ] Preserve GST
[ ] Preserve customer
[ ] Preserve company
[ ] Preserve counter
[ ] Preserve user
[ ] Preserve promotion values
[ ] Preserve loyalty values
[ ] Reconcile header totals to lines
[ ] Reconcile GST totals
[ ] Reconcile return qty to original sale qty
[ ] Reconcile inventory impact
[ ] Reconcile refund/credit impact
[ ] Reconcile cancelled returns
[ ] Reconcile QR/document references
[ ] Validate return reports
```

---

# 196. Conclusion

TextileSoft's Sales Return module is a substantial transaction flow rather than a simple negative-sale entry.

Its architecture contains:

```text
Original Sales Context
        ↓
Return Working Lines
        ↓
salsntryReturn
        ↓
salbillReturns
        ↓
sales2Return
        ↓
Return Status / QR / Reports
```

The return process preserves product, barcode, price, discount, tax, customer, company, counter, promotion, loyalty and operational information.

The strongest migration principle is to preserve the **original sale as immutable history** and represent the return as a separate, linked reversal document.

For the new ERP, the target architecture should therefore be:

```text
Sales Invoice
     │
     └── Sales Invoice Line
              │
              └── Barcode / SKU

Sales Return
     │
     └── Sales Return Line
              │
              ├── Original Sales Line
              └── Barcode / SKU

Sales Return
     ├── Inventory +Qty
     ├── Customer Credit / Refund
     ├── GST Reversal
     ├── Loyalty Reversal
     └── Promotion Reversal
```

This provides a clean, auditable and migration-safe replacement for the legacy TextileSoft return architecture.
