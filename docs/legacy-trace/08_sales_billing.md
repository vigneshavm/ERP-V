# 08 - Sales Billing - End-to-End Flow

## 1. Purpose

This document traces the TextileSoft sales and billing process from the billing screen through temporary sales-entry data, final sales-line persistence, sales-header persistence, payment/cash collection, barcode/product validation, reporting, sales returns, and downstream inventory effects.

The main sales architecture found in the source is not a single-table invoice model. The application uses multiple representations for the same business transaction:

```text
Sales Billing UI
      |
      +--> Product / Barcode lookup
      |
      +--> Temporary sales-entry rows
      |       SALSNTRY1 / SALSNTRY2 / related temporary structures
      |
      +--> Final sales detail
      |       SALBILL
      |
      +--> Final sales header / bill summary
      |       SALES2 / SALES3 variants
      |
      +--> Payment / cash collection
      |       cash_collection_3
      |       cashcollectiondetail
      |
      +--> Sales return / exchange
      |
      +--> Sales reports / bill printing
```

The exact implementation varies by billing mode. The archive contains standard cash billing, GST billing, wholesale/retail billing, invoice billing, credit billing, gift billing, department billing, order-delivery billing and other specialized screens.

The core architectural fact is:

```text
SALBILL = line-level finalized sales transaction
SALES2/SALES3 = bill-level summary/header transaction variants
SALSNTRY* = staging / working sales-entry representation used before final posting
cash_collection_3 = payment / cash collection representation
```

---

## 2. Source Scope Traced

### 2.1 Main sales-entry pages

The archive contains several production sales entry implementations:

```text
SalesentryNewsaleAll.aspx
GstSalesentryNewsaleAll.aspx
GstSalesentryNewsaleAllEdit.aspx
BarcodeGstSalesentryNewsaleAllEdit.aspx
RetailGstSaleCashBillEntryNewAll.aspx
CreditGstWholeSalesRetailSalesEntryNewJS/
WRSalesentry.aspx
WRSalesEntryNew.aspx
WholeSaleRetailEntry.aspx
WholeSaleRetailEntryAdd.aspx
WholeSaleRetailEntryUpdate.aspx
DepartmentGstSaleCashBillEntryNewAll.aspx
DepartmentWSRGstSaleCashBillEntryNewAll.aspx
InvoiceBillEntry.aspx
InvoiceBillEdit.aspx
MRPInvoiceBillEntry.aspx
OrderDeliverySalesentryNewsaleAll.aspx
GiftGstSalesentryNew.aspx
GrocerySalesEntry.aspx
TeaShopSalesEntry.aspx
ElectricalSalesEntry.aspx
SaleCashBillEntry.aspx
salesentry.aspx
```

### 2.2 Main sales edit/view pages

```text
SalesEntryEdit.aspx
SalesBillView.aspx
GstSalesBillView.aspx
WholeSaleRetailEntryView.aspx
InvoiceEntryView.aspx
InvoiceBillEdit.aspx
SalesReturnBillview.aspx
```

### 2.3 Main JavaScript groups

```text
GstSaleCashBillEntryNewJS/
CreditGstWholeSalesRetailSalesEntryNewJS/
RetailGstSaleCashBillEntryNewAllJS/
samplesalesenteryJS/
InvoiceBillEntryJS/
InvBillEntryJS/
```

Important calculation and interaction files include:

```text
calculation.js
calculation credit.js
SaleBillCash.js
salesscript.js
retriveldata.js
enterkey.js
keys.js
```

### 2.4 Compiled code

The ASP.NET pages are Web Forms pages backed by compiled `App_Web_*.dll` assemblies under `bin`.

The compiled assemblies contain the SQL statements used by the sales implementation. This is important because the `.aspx` page frequently exposes only the UI and JavaScript while the actual database persistence logic is compiled.

---

# 3. Sales Billing Business Object Model

The legacy sales transaction can be represented as:

```text
                    SALE BILL
                       |
          +------------+------------+
          |                         |
      SALES2/3                  SALBILL
     Bill Header             Bill Lines
          |                         |
          |              +----------+----------+
          |              |          |          |
      customer       product      barcode    pricing
      payment        quantity     SKU attrs   GST
      totals         amount       brand       discount
      GST summary    tax          size        profit data
```

In some flows an intermediate staging layer exists:

```text
SALSNTRY1 / SALSNTRY2
          |
          | finalize
          v
      SALBILL
          +
       SALES2
```

The application also has a payment layer:

```text
SALES2
   |
   +--> cash amount
   +--> card amount
   +--> credit amount
   +--> Google Pay amount
   +--> self/other payment amount
   +--> advance/current balance
   |
   v
cash_collection_3
```

This is not a clean modern relational model, but it is the structure that must be understood before migration.

---

# 4. Sales Product Identity

The sales screen can work from either product identity or barcode identity.

The primary lookup dimensions are:

```text
Product Code
Product Name
Barcode
Company
Unit
MRP
Selling Rate
```

For textile products the sales line can also carry:

```text
Design
Brand
Pattern
Size
Color
Style
Rack
Product Group
Sub Group
```

The product master remains `newproduct`.

The barcode/SKU layer is separate and carries the physical sellable item information.

Therefore:

```text
newproduct
    |
    | product identity
    v
barcode / stock identity
    |
    | physical quantity
    v
SALBILL sales line
```

---

# 5. Main Sales UI Flow

A standard billing sequence is:

```text
Open Sales Entry
      |
      v
Resolve company / counter / user
      |
      v
Create or obtain bill number
      |
      v
Select customer if required
      |
      v
Scan barcode / enter product
      |
      v
Validate stock / barcode balance
      |
      v
Load product and pricing
      |
      v
Enter quantity / meter
      |
      v
Apply item discount / product less
      |
      v
Calculate GST
      |
      v
Add line to working bill
      |
      v
Calculate bill-level discount / less / round-off
      |
      v
Calculate final net amount
      |
      v
Select payment mode
      |
      v
Save/finalize bill
      |
      +--> SALBILL lines
      |
      +--> SALES2/SALES3 header
      |
      +--> payment/cash collection
      |
      +--> downstream stock/accounting operations
      |
      v
Print bill / complete transaction
```

---

# 6. Company, Counter and User Context

Sales is strongly tied to operational context.

The source contains fields such as:

```text
company_name
company_bill
countername
counterID
UserID
systemname
company_code
comp_continu_billno
cmy_wo_continu_billno
counter_Billno
count_IDBillno
counter_mode
company_billmode
```

This means the bill number cannot be treated as a globally unique integer without considering the legacy numbering context.

A new ERP should define an explicit bill identity:

```text
company_id
branch_id
store_id
counter_id
financial_year
bill_series
bill_number
```

with a unique constraint on the appropriate numbering scope.

---

# 7. Bill Number Generation

The source has several bill-number concepts because different billing modes use different numbering schemes.

Observed fields include:

```text
billno
counter_Billno
company_billno
comp_continu_billno
cmy_wo_continu_billno
cmy_wo_billno
cmy_wo_continu_billno
cmy_wo_continu_billno
count_IDBillno
```

The sales screen also has separate working bills such as:

```text
BILL1
BILL2
BILL3
```

The compiled code contains direct queries against these working bill identifiers.

For example, the source contains patterns such as:

```sql
select *
from salbill
where billno='BILL1'
  and countername='...'
```

and equivalent queries for `BILL2` and `BILL3`.

This indicates that a single UI session can maintain multiple billing buckets/working bills.

### New ERP recommendation

Do not reproduce `BILL1/BILL2/BILL3` as actual invoice numbers.

Use:

```text
sales_draft
sales_draft_lines
```

and assign the permanent invoice number only at posting time.

---

# 8. Customer Flow

The standard sales screen contains customer-related AJAX methods such as:

```text
GetCusName
CustomerNameData
CustomerData
MobileData
CardData
```

The customer context can include:

```text
Customer Card
Customer Name
Mobile Number
Customer Man / Customer Representative
Customer Points
Previous Balance
Advance
Credit Balance
```

The sales header fields prove this through `sales2` inserts.

Representative fields include:

```text
cus_card
cus_name
mbl_no
CustomerMan
points
s_advance_amt
s_credit_current_balance
s_credit_preview_balance
Custpointamt
```

The sales line may also store `cusname` in some `SALBILL` variants.

---

# 9. Barcode Entry

Barcode is a primary sales-entry mechanism.

The standard sales page contains:

```text
barcode input
barcode button/action
barcode stock balance
barcode purchase rate
barcode bill-wise profit
sales barcode quantity
temporary barcode stock balance
```

The source UI exposes hidden fields including:

```text
txtBarcodeStockBalance
txtBarcodeBillwiseProfit
txtSalesBarcodeQty
txtTempBarcodStockBalance
txtBarcodePurrateVisible
txtCheckBarcodeBalanceStock
```

These fields show that barcode availability is actively considered before final posting.

The source also contains:

```text
select * from salbill where barcode='...'
```

and barcode-aware return methods.

---

# 10. Barcode Stock Validation

The sales page contains a `CheckBarcodeBalanceStock` value.

It is persisted in several `SALBILL` variants:

```sql
CheckBarcodeBalanceStock
```

The application also maintains:

```text
Barcode stock balance
Temporary barcode stock balance
Sales barcode quantity
Barcode-wise profit
```

Therefore the intended business flow is:

```text
Scan Barcode
    |
    v
Find barcode
    |
    v
Determine available balance
    |
    +--> insufficient -> block / warn
    |
    v
Determine sale quantity
    |
    v
Calculate remaining balance
    |
    v
Persist sales line
```

### Important source limitation

The source clearly proves barcode balance checking and persistence of `CheckBarcodeBalanceStock`, but the compiled archive does not provide one single obvious universal `UPDATE stockdetails SET qty = ...` statement tied to every sales variant.

Therefore the documentation must not claim that one specific stock mutation statement is universally used by all sales screens.

The migration should trace the actual stock-posting implementation for the production billing mode before replacing it.

---

# 11. Product Lookup

Sales can resolve a product through `newproduct`.

The established product-master relationships are:

```text
Product Code
Product Name
Unit
Company
GST Group
HSN
```

For a barcode-driven transaction, the barcode/SKU layer supplies additional data.

The sales line ultimately snapshots product information into `SALBILL`.

This is important because historical bills should not change simply because the current Product Master is edited later.

---

# 12. Sales Line Data Model

The core `SALBILL` line is very wide.

A representative compiled SQL statement is:

```sql
insert into salbill
(
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
    netamt,
    bdis,
    less,
    gst,
    cgst,
    sgst,
    billno,
    cmy_name,
    cmy_bill,
    gst_per,
    countername,
    Design,
    Brand,
    Patrn,
    Size,
    Color,
    Style,
    prate,
    nrate,
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
    c_Mrp,
    c_Amt,
    Token_Dis_Amount,
    gst_group
)
values
(
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
    @netamt,
    @bdis,
    @less,
    @gst,
    @cgst,
    @sgst,
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

This is one representative variant. Other variants add fields such as:

```text
Print_Sales
TotalQty
sub_group_name
BsTotQty
ProductPoint
TotProductPoint
SchemaDiscount
SchemaDisAmount
SchemaDisGrossAmt
disgrossamt
sgstnrate
```

---

# 13. SALBILL Field Semantics

The important groups are:

| Field group | Examples | Purpose |
|---|---|---|
| Line identity | `sn` | Sales line sequence |
| Product | `code`, `p_name`, `pnameTamil` | Product identity snapshot |
| Barcode | `barcode` | Physical SKU/barcode identity |
| Quantity | `qty`, `mtr` | Quantity / meter sold |
| Price | `mrp`, `rate` | Customer-facing price |
| Cost | `prate`, `nrate` | Purchase/normal-rate snapshot |
| Gross | `amt` | Line gross amount |
| Product discount | `pds`, `pamt` | Product-level discount representation |
| Bill discount | `bdis`, `less` | Bill/item discount and less |
| Tax | `gst`, `cgst`, `sgst`, `gst_per` | GST values |
| Net | `netamt` | Final line amount |
| Textile attributes | `Design`, `Brand`, `Patrn`, `Size`, `Color`, `Style` | SKU/transaction dimensions |
| Organization | `cmy_name`, `cmy_bill`, `countername`, `counterID` | Company/counter context |
| User | `user_id`, `slman` | User/salesman |
| Stock | `CheckBarcodeBalanceStock` | Barcode stock check/result |
| GST | `gst_group`, `gstcrossamt` | GST grouping/cross amount |
| Customer | `cusname`, `points` in variants | Customer/loyalty context |
```

---

# 14. Quantity and Meter Handling

TextileSoft supports both quantity and meter-based sales.

Relevant fields:

```text
qty
mtr
TotalQty
BsTotQty
```

The sales UI contains meter and quantity-related fields.

The basic conceptual calculation is:

```text
Line Quantity = qty
Line Meter    = mtr

Gross Amount = quantity/meter basis × selling rate
```

The exact basis depends on the product unit and the billing variant.

A new ERP should explicitly store:

```text
quantity
meter_quantity
unit_id
pricing_unit
```

rather than relying on a single overloaded numeric field.

---

# 15. Gross Amount

The line contains:

```text
amt
```

which represents the gross line amount before all subsequent discounts/less/tax adjustments depending on the billing variant.

The staging table uses equivalent fields:

```text
amount
pdis
pdis_amount
dis
less
net_amount
```

A conceptual line calculation is:

```text
Gross
  - product discount
  - applicable less
  - bill/product discount allocations
  + GST
  +/- rounding or cross adjustment
  = net amount
```

The exact legacy calculation differs by billing mode and JavaScript implementation.

---

# 16. Product Discount

The sales screen contains product-level discount handling.

Important UI/script fields include:

```text
txtpdis
txtpdis_per
txtProductLess
txtProdLessAmt
```

The final line stores:

```text
pds
pamt
```

The staging `SALSNTRY1` representation uses:

```text
pdis
pdis_amount
```

The distinction is:

```text
pdis / pds
    = product discount representation

pdis_amount / pamt
    = product discount amount representation
```

---

# 17. Bill-Level Discount

The sales UI contains bill-level discount fields and customer-point adjustments.

Examples:

```text
txtBillAmtDis
txtbilldiscount
txtTotalBillDisAmount
```

The sales header stores:

```text
bill_disc
bill_disc1
bill_less
bill_less1
```

and the final net amount is stored in:

```text
tot_netamnt
```

The system also stores:

```text
notdislesamt
pdisamtot
```

which participate in the final billing calculation/reporting model.

---

# 18. Less / Purchase Less

Sales supports `less` at line and bill levels.

The line-level `SALBILL` fields include:

```text
less
```

The staging representation includes:

```text
less
```

The bill header includes:

```text
bill_less
bill_less1
```

This means the migration must not collapse all discount concepts into one `discount_amount` field without preserving their original business semantics.

Recommended new ERP representation:

```text
line_discount_percent
line_discount_amount
line_less_amount
bill_discount_amount
bill_less_amount
rounding_amount
```

---

# 19. GST Calculation

GST is a first-class part of the sales transaction.

The standard sales page exposes:

```text
GST 5%
CGST 2.5%
SGST 2.5%

GST 12%
CGST 6%
SGST 6%

GST 18%
CGST 9%
SGST 9%

GST 28%
CGST 14%
SGST 14%

IGST
```

The final line stores:

```text
gst
gst_per
cgst
sgst
gstcrossamt
```

The bill header stores GST summaries such as:

```text
gst5
gst12
gst18
gst28
igstper
```

and the total bill amount:

```text
tot_netamnt
totnetsub
```

---

# 20. CGST / SGST

For intra-state GST sales, the source supports split tax:

```text
GST rate
    |
    +--> CGST
    |
    +--> SGST
```

Examples shown by the UI:

```text
GST 5%  -> CGST 2.5% + SGST 2.5%
GST 12% -> CGST 6%   + SGST 6%
GST 18% -> CGST 9%   + SGST 9%
GST 28% -> CGST 14%  + SGST 14%
```

The actual monetary values are persisted on each line.

---

# 21. IGST

The header contains:

```text
igstper
```

and the UI contains an IGST section.

The application therefore supports an interstate tax mode.

A new ERP should store tax mode explicitly:

```text
INTRA_STATE
INTER_STATE
EXEMPT
ZERO_RATED
```

rather than inferring tax mode solely from whether CGST/SGST values are zero.

---

# 22. GST Group and HSN

The Product Master supplies GST and HSN context, but the sales transaction snapshots HSN-related information.

The staging `SALSNTRY` includes:

```text
hsncode
PHSN_CODE
```

The `SALBILL` variants contain:

```text
gst_group
```

and the product code/name remain in the sales line.

The important migration principle is:

```text
Current Product Master HSN
          !=
Historical Bill HSN
```

A posted invoice should preserve the HSN/GST context that was actually used at posting time.

---

# 23. Textile Sales Attributes

The sales transaction snapshots textile dimensions.

Observed `SALBILL` fields:

```text
Design
Brand
Patrn
Size
Color
Style
```

The staging table uses equivalent fields:

```text
degin
brand
patt
size
color
style
```

The stock/barcode side can also contain:

```text
rackno
model
fashion
```

The final sales line therefore preserves the sellable SKU attributes rather than depending exclusively on the current Product Master.

---

# 24. Purchase Rate and Profit

The sales line stores:

```text
prate
nrate
```

The UI also exposes:

```text
Barcode purchase rate
Barcode bill-wise profit
```

The sales system therefore has enough information to calculate or report gross profit at barcode/line level.

The header `sales2` also has:

```text
BarcodeWiseProfit
```

in multiple variants.

Conceptually:

```text
Sales Value
    - Purchase/Cost Value
    = Gross Profit
```

However, the exact cost basis can differ depending on how `prate`, `nrate`, barcode balance and rate-change history are populated.

Do not assume FIFO unless separately proven by the source.

---

# 25. Working Sales Entry / Staging

The source uses `SALSNTRY1` and `salsntry2` in some billing flows.

A representative finalization query is:

```sql
INSERT INTO SALBILL
(
    sn,
    slman,
    barcode,
    code,
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
    ...
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
    ...
FROM SALSNTRY1
WHERE customername='...'
```

This proves that at least one production flow stages line data before moving it into `SALBILL`.

---

# 26. SALSNTRY Purpose

`SALSNTRY` contains a much broader operational snapshot than a simple temporary cart.

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
counter_ID
counter_Billno
count_IDBillno
counter_mode
company_billno
company_billmode
comp_continu_billno
company_code
cmy_wo_billno
cmy_wo_continu_billno
cmy_wo_cont_idbillno
billoption_cmy
```

This indicates that staging carries both line-level and bill-context data.

---

# 27. Sales Header - SALES2

The main bill-summary table found in the compiled code is `sales2`.

A representative insert is:

```sql
Insert into sales2
(
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
    points,
    UserID,
    BarcodeWiseProfit
)
values
(
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
    @points,
    @UserID,
    @BarcodeWiseProfit
)
```

Later variants add payment fields and customer-credit information.

---

# 28. SALES2 Header Field Groups

### Bill totals

```text
tot_qty
tot_netamnt
totnetsub
upsat
upnet
```

### Discounts

```text
tot_pdis
bill_disc
bill_disc1
bill_less
bill_less1
pdisamtot
notdislesamt
roundoff
```

### Tax

```text
five_per
twl_per
gst5
gst12
gst18
gst28
igstper
```

### Customer

```text
cus_card
cus_name
mbl_no
CustomerMan
points
Custpointamt
```

### Payment

```text
paymenttype
s_recevied_cashamt
s_card_amt
s_credit_amt
s_googlepay
s_selfamt
s_card_bankname
s_googlepay_bankname
s_selfremarks
s_balance_amt
s_advance_amt
s_credit_current_balance
s_credit_preview_balance
credit_billstatus
```

### Control/status

```text
retstat
status
SBillStatus
mode
sysidandbill
UserID
Lmode
```

### Profit

```text
BarcodeWiseProfit
```

---

# 29. Sales Status Fields

The source has several status concepts.

Observed fields include:

```text
status
SBillStatus
retstat
costatus
costatus1
upsta
```

These should not automatically be collapsed into one status column during migration.

Some statuses relate to:

```text
bill posting
return status
combo status
counter/order status
```

A new ERP should normalize these into explicit status domains.

---

# 30. Payment Type

The sales header stores:

```text
paymenttype
```

The payment UI supports multiple tender types.

Confirmed fields include:

```text
cash
card
credit
Google Pay
self/other amount
advance
balance
```

The compiled code also persists bank names and remarks:

```text
s_card_bankname
s_googlepay_bankname
s_selfremarks
```

---

# 31. Cash Collection

The source contains `cash_collection_3` as a payment/cash summary structure.

A representative insert contains:

```text
statues
cus_card
cus_name
mbl_no
net_amount
bill_dis1
bill_dis2
bill_less
net_total
receve_cashamount
card_aomunt
credit_amount
balance_amount
cash_bill_number
date
bil_date
cashier_name
login_name
cashier_billmode
googlepay
cardname
googlepayname
Selfamt
SelfRemarks
bill_selectdate
GiftAmount
GiftRemarks
PreviousBalance
AdvancedAmount
CurrentBalance
systemname
cash_barcode
cashamount
cashdatetime
IMEI1
IMEI2
points
less_Points
GiftVoucherAmount
GiftVoucherDisPer
GiftCus_Card
GiftCus_Name
GiftCus_Mode
GiftCus_From_Date
GiftCus_To_Date
Gift_Amount
Gift_To_Amount
Gift_No_Copies
```

This demonstrates that payment collection is a separate persistence concern from the `SALBILL` line.

---

# 32. Cash Collection Detail

The source also contains `cashcollectiondetail`.

Representative insert:

```sql
insert into cashcollectiondetail
(
    statues,
    cashbar,
    amount,
    bill_dis,
    bill_less,
    pr_dis,
    rount_off,
    tot_amt,
    cash_bill,
    date,
    bil_date
)
values
(
    @statues,
    @cashbar,
    @amount,
    @bill_dis,
    @bill_less,
    @pr_dis,
    @rount_off,
    @tot_amt,
    @cash_bill,
    @date,
    @billdate
)
```

Later variants add:

```text
selectdate
cashsystem
cashiername
cashiermode
bill_mode
cadatetime
```

Therefore payment has both summary and detail layers.

---

# 33. Payment Reconciliation

The intended relationship is:

```text
Sales Bill
   |
   | billno
   v
Payment / Cash Collection
```

A new ERP should enforce:

```text
sales_invoice.id
      |
      +--> payment allocations
      |
      +--> payment transactions
```

rather than relying only on text `cash_bill_number` / `billno` joins.

---

# 34. Cash Sale Flow

A cash transaction conceptually follows:

```text
Scan items
    |
    v
Calculate invoice
    |
    v
Receive cash
    |
    v
Calculate balance/change
    |
    v
Post sales lines
    |
    v
Post sales header
    |
    v
Post cash collection
    |
    v
Print bill
```

Relevant header fields include:

```text
s_recevied_cashamt
s_balance_amt
```

and payment records include:

```text
receve_cashamount
cashamount
balance_amount
```

---

# 35. Card Sale Flow

The source supports card payments.

Relevant fields:

```text
s_card_amt
s_card_bankname
card_aomunt
cardname
```

The billing header and cash collection layer both preserve card information.

A new ERP should normalize:

```text
payment_method = CARD
amount
provider/bank
reference_number
payment_datetime
```

---

# 36. Google Pay / Digital Payment

The source contains:

```text
s_googlepay
s_googlepay_bankname
googlepay
googlepayname
```

This indicates digital-payment tender is separately tracked.

A new ERP should store a generic payment table:

```text
payment_method
payment_amount
provider
reference_no
remarks
```

rather than adding a new database column for every future payment provider.

---

# 37. Credit Sale

The source supports credit billing.

Header fields include:

```text
s_credit_amt
s_credit_current_balance
s_credit_preview_balance
credit_billstatus
```

Customer fields include:

```text
cus_card
cus_name
mbl_no
```

Conceptual flow:

```text
Invoice
   |
   v
Credit amount
   |
   v
Customer account balance
   |
   v
Customer payment / collection later
```

Credit sales therefore affect both sales and receivable/customer-balance processes.

---

# 38. Advance Amount

The sales header supports:

```text
s_advance_amt
```

and payment collection supports:

```text
AdvancedAmount
PreviousBalance
CurrentBalance
```

This suggests the system can apply customer advance balances during billing.

Migration must distinguish:

```text
new payment received
customer advance consumed
customer outstanding created
```

rather than treating the final net amount as a single cash receipt.

---

# 39. Customer Points

The UI has explicit point controls:

```text
txtAddPoints
txtAddPoints1
txtAddPoints2
txtCustomerPoint
txtSubCustomerPoint
```

The sales header stores:

```text
points
Custpointamt
```

The sales line variants can also store:

```text
ProductPoint
TotProductPoint
```

The source therefore supports both product-level and bill/customer-level loyalty calculations in some implementations.

---

# 40. Gift / Token Features

Some sales variants support gift/token features.

Observed fields include:

```text
Token_Dis_Amount
GiftAmount
GiftRemarks
GiftVoucherAmount
GiftVoucherDisPer
GiftCus_Card
GiftCus_Name
GiftCus_Mode
Gift_Amount
Gift_To_Amount
Gift_No_Copies
Token_Dis_Gift_Amount
Gift_Amount_wiseToken
GiftValueFromDate
GiftValueToDate
GiftNoCopy
Single_Token_Amount
ProductToAmount
```

These are optional specialized billing features and should not be embedded into the core invoice table in a new ERP.

Recommended model:

```text
sales_invoice
sales_invoice_lines
promotion_application
coupon/token/gift transaction
```

---

# 41. Schema / Promotional Discounts

Some `SALBILL` variants contain:

```text
SchemaDiscount
SchemaDisAmount
SchemaDisGrossAmt
disgrossamt
```

This indicates a promotional/schema discount engine exists in some billing modes.

The new ERP should preserve the difference between:

```text
standard line discount
bill discount
promotion discount
coupon discount
loyalty discount
```

---

# 42. Combo Sales

The source contains combo-related fields:

```text
comboname
combostatus
combobarcode
costatus
costatus1
```

There are also dedicated combo billing/reporting pages and Crystal reports.

Therefore a combo sale is not necessarily a simple product line.

Conceptual model:

```text
Combo Offer
   |
   +--> parent/combo item
   |
   +--> component products
   |
   +--> combo price/discount
```

A new ERP should model combo definitions separately from normal product master.

---

# 43. Multiple Working Bills

The source explicitly contains `BILL1`, `BILL2`, and `BILL3` operations.

The compiled SQL contains:

```sql
select * from salbill where billno='BILL1' and countername='...'
select * from salbill where billno='BILL2' and countername='...'
select * from salbill where billno='BILL3' and countername='...'
```

It also contains deletion logic for these working bills.

Example pattern:

```sql
delete from salbill
where billno='BILL1'
and countername='...'
```

This is evidence of multi-bill workspace functionality.

---

# 44. Sales Line Edit

The compiled source contains updates such as:

```sql
update salbill
set sn='...'
where ...
```

and:

```sql
update salbill
set pamt='...'
where ...
```

and:

```sql
update salbill
set CheckBarcodeBalanceStock='...'
where ...
```

This means the system allows post-entry modification of selected line fields before/around bill finalization.

A new ERP should distinguish:

```text
Draft edit
Posted invoice amendment
Credit/debit adjustment
```

Posted invoices should not be modified directly.

---

# 45. Sales Bill Deletion

The source contains:

```sql
delete from salbill
where billno='BILL1'
and countername='...'
```

and equivalent operations for `BILL2` and `BILL3`.

It also contains:

```sql
delete from salbilledit
where billno='BILL1'
and countername='...'
```

This appears to be working/draft bill cleanup rather than a controlled posted-invoice cancellation model.

### New ERP rule

Do not physically delete posted sales invoices.

Use:

```text
DRAFT
POSTED
CANCELLED
RETURNED
PARTIALLY_RETURNED
```

with an audit trail.

---

# 46. SALBILLEDIT

The archive contains a separate `salbilledit` structure.

It has a similar line schema to `SALBILL`, including:

```text
unit
sn
slman
barcode
code
p_name
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
user_id
```

Some variants include:

```text
Design
Brand
Patrn
Size
Color
Style
prate
nrate
CheckBarcodeBalanceStock
gstcrossamt
```

This table should be investigated before migration as either:

```text
editable working lines
edit history
alternate billing storage
```

The source proves it is used by sales editing logic, but does not establish a clean immutable audit-history design.

---

# 47. Bill Finalization

A typical finalization architecture is:

```text
Working/staging lines
       |
       +--> validate bill
       |
       +--> calculate totals
       |
       +--> persist SALBILL
       |
       +--> persist SALES2/SALES3
       |
       +--> persist payment
       |
       +--> finalize staging status
       |
       +--> print
```

The source contains:

```sql
update salsntry
set status='1'
where systemname='...'
```

This is evidence that staging rows have a completion/finalization status.

---

# 48. Finalization State

The source uses status values such as:

```text
status = '1'
```

for finalized `salsntry` rows in at least one flow.

The bill header has:

```text
SBillStatus
status
retstat
```

Therefore finalization is status-driven.

A new ERP should replace opaque values with enumerated states:

```text
DRAFT
POSTING
POSTED
CANCELLED
RETURNED
```

---

# 49. Stock Impact

Sales obviously consumes sellable stock from the business process, and the UI actively checks barcode stock before billing.

Confirmed source evidence includes:

```text
Barcode stock balance
CheckBarcodeBalanceStock
Sales barcode quantity
Barcode-wise profit
```

The sales line snapshots barcode and product information.

However, the source archive does not expose one single universal stock mutation statement shared by all billing variants.

Therefore the safe source-level conclusion is:

```text
Sales validates stock availability and records the sold quantity/barcode.
The exact stock mutation implementation varies by billing flow and must be traced before migration.
```

Do not implement a new stock decrement solely from the existence of `SALBILL`.

---

# 50. Stock Conceptual Flow

For the new ERP, the desired flow should be:

```text
Stock balance
    |
    | reserve/check
    v
Sales Draft
    |
    | post
    v
Sales Invoice
    |
    | inventory transaction
    v
Stock OUT
    |
    v
Available Stock decreases
```

For barcode-tracked items:

```text
Barcode
   |
   v
Available quantity
   |
   - sold quantity
   |
   v
Remaining quantity
```

---

# 51. Sale Against Purchase Batch

The sales line stores `prate` and `nrate`, while the purchase layer stores purchase-rate information.

This indicates that sales can retain a cost/rate snapshot.

However, the source does not prove a universal FIFO allocation engine.

Therefore migration should not introduce FIFO/LIFO assumptions unless the production database and business process confirm them.

Recommended ERP model:

```text
inventory_lot / barcode
       |
       +--> cost snapshot
       |
       +--> sale allocation
```

---

# 52. Salesman

The sales line contains:

```text
slman
```

The staging table contains:

```text
sls_man
```

Reports include salesman-wise sales.

Therefore the salesman is an important sales dimension.

New ERP:

```text
sales_invoice.salesman_id
sales_invoice_line.salesman_id
```

or a commission allocation table if multiple salesmen can share a bill.

---

# 53. Counter

Sales lines contain:

```text
countername
counterID
```

The source also has counter-level bill numbers and reports.

Therefore:

```text
Company
   |
   +--> Store/Warehouse
   |
   +--> Counter
           |
           +--> Sales Invoice
```

The counter should be an explicit foreign key in a new ERP.

---

# 54. Sales Company

Sales lines contain:

```text
cmy_name
cmy_bill
```

The staging table contains:

```text
company_name
cmnyname
cmny_bill
company_billno
company_code
```

This indicates company-specific numbering and reporting.

The Product Master itself is also company-aware through:

```text
newproduct.cmy_name
```

---

# 55. Product Group / Subgroup

Some `SALBILL` variants include:

```text
pgname
sub_group_name
```

The staging table includes:

```text
ProGroupName
ProGroupBillNo
```

This supports group/subgroup reporting and promotional logic.

The new ERP should use IDs rather than storing only descriptive names on transactional records, while preserving historical names as snapshots if legally/business required.

---

# 56. Sales Bill Printing

The archive contains numerous Crystal Reports for sales billing.

Examples include:

```text
3inchbill/salsbill.rpt
3inchbill/salsbillCombo.rpt
3inchbill/salsbillOnlyCombo.rpt
3inchbill/salsbillComboExch.rpt
3inchbill/salsbillGiftToken.rpt
4inchbill/salsbill.rpt
4inchbill/salsbillCombo.rpt
4inchbill/salsbillOnlyCombo.rpt
```

There are also return bill reports.

This demonstrates that printed bill output is strongly dependent on billing mode.

A new ERP should separate:

```text
invoice data
invoice template
print configuration
```

rather than encoding print behavior in transaction storage.

---

# 57. Sales Bill View

Primary bill-view pages include:

```text
SalesBillView.aspx
GstSalesBillView.aspx
CashBillView.aspx
InvoiceEntryView.aspx
WholeSaleRetailEntryView.aspx
CustomerPaymentBillView.aspx
CustomerSalesPaymentBillView.aspx
```

These screens query the persisted sales data by bill number/date/customer/company/counter depending on the report.

---

# 58. Sales Reports

The archive contains a broad sales reporting layer.

Examples:

```text
InvoicewisesalesReport.aspx
CustomerWiseSalesReport.aspx
CustomerWiseSalesSubReport.aspx
salesmanwisereport.aspx
newsalesmanwisereport.aspx
RateWiseSalesReport.aspx
PatternAndSizeWiseSalesReportQty.aspx
SectionWiseSalesReport.aspx
WholeSaleSummaryReport.aspx
CustomerCreditWiseSalesReport.aspx
CustomerCreditWiseSalesSubReport.aspx
GRNwisesalesReport.aspx
MissingSalesReport.aspx
datewisesalesreport.aspx
SalesClosingReport.aspx
LoginWiseSalesSummaryReport.aspx
```

This confirms that the sales model supports analysis by:

```text
Date
Invoice
Customer
Salesman
Rate
Pattern
Size
Section
Wholesale/Retail
Credit
GRN
User/Login
```

---

# 59. Sales by Barcode

`BarcodeWiseSales.aspx` is a dedicated report/page.

This is important because barcode is not merely a printing identifier. It is a sales analysis dimension.

New ERP should support:

```text
barcode_id
product_variant_id
invoice_line_id
sold_qty
sold_amount
cost_amount
profit_amount
```

---

# 60. Sales by Pattern / Size

`PatternAndSizeWiseSalesReportQty.aspx` demonstrates that the transaction-level attributes are reportable.

Therefore:

```text
Brand
Pattern
Size
Color
Style
Design
```

should remain available on the transaction or be reliably derivable from immutable SKU history.

---

# 61. Sales by GRN

`GRNwisesalesReport.aspx` exists.

This is significant because sales can be analyzed back to purchase/GRN information.

The source line carries:

```text
barcode
prate
```

and the inventory layer connects barcode to purchase GRN.

Conceptual lineage:

```text
Purchase GRN
    |
    v
Barcode / Stock
    |
    v
Sales Bill
```

A new ERP should retain this lineage through explicit inventory-lot/barcode allocations rather than relying only on denormalized text fields.

---

# 62. Customer Sales

Customer reporting is extensive:

```text
CustomerWiseSalesReport.aspx
CustomerWiseSalesSubReport.aspx
CustomerCreditWiseSalesReport.aspx
CustomerCreditWiseSalesSubReport.aspx
CustomerSalesPaymentBillView.aspx
CustomerPaymentBillView.aspx
```

The customer relationship therefore affects:

```text
Sales
Credit
Payment
Outstanding
Customer history
```

---

# 63. Sales Return Relationship

The sales entry UI itself contains return-related AJAX calls:

```text
GetDataReturnSales1
InsertReturnSalesToSalbill
```

This is important because the billing screen can participate in sales-return processing.

Separate return pages include:

```text
GstReturnSalesentryNewsaleAll.aspx
InvoiceReturnEntry.aspx
SalesReturnBillview.aspx
InvocieReturnBillView.aspx
```

The return flow should therefore be documented separately as the next module, but its relationship to the original invoice must be preserved.

---

# 64. Sales Return Conceptual Flow

```text
Original Sales Invoice
       |
       v
Return selection
       |
       v
Original barcode/product validation
       |
       v
Return quantity
       |
       v
Sales Return transaction
       |
       +--> stock IN / restoration
       |
       +--> customer refund / credit
       |
       +--> tax reversal
       |
       +--> return report
```

The exact stock and financial posting must be traced from the return-specific implementation before migration.

---

# 65. Invoice Edit

The archive contains:

```text
InvoiceEntryEdit.aspx
InvoiceBillEdit.aspx
GstSalesentryNewsaleAllEdit.aspx
BarcodeGstSalesentryNewsaleAllEdit.aspx
```

This indicates that the legacy system allows editing sales transactions after initial entry.

Migration should separate:

```text
Draft invoice editing
Posted invoice correction
```

A posted invoice should use a controlled correction document or cancellation/reissue process rather than arbitrary line updates.

---

# 66. Wholesale / Retail Sales

The archive contains:

```text
WRSalesentry.aspx
WRSalesEntryNew.aspx
WholeSaleRetailEntry.aspx
WholeSaleRetailEntryAdd.aspx
WholeSaleRetailEntryUpdate.aspx
WholeSaleRetailEntryView.aspx
```

These flows share the core sales concepts but can have different:

```text
pricing
customer
payment
GST
bill numbering
reporting
```

New ERP should model:

```text
sales_channel
pricing_profile
customer_type
```

instead of duplicating the entire sales engine.

---

# 67. GST Sales

GST-specific pages include:

```text
GstSalesentryNewsaleAll.aspx
GstSaleCashBillEntryNew.aspx
GstSaleCashBillEntryTamilNew.aspx
GstSalesBillView.aspx
GstSalesentryEditNew.aspx
```

These use the same broad `SALBILL`/`SALES2` architecture but expose more explicit GST calculations and reporting.

---

# 68. Retail GST Sales

Retail GST pages include:

```text
RetailGstSaleCashBillEntryNewAll.aspx
RetailGstSaleCashBillEntryNewTamil2023.aspx
```

These should be treated as billing-mode variants rather than completely separate product/sales domains.

---

# 69. Credit GST / Wholesale Retail

The archive includes:

```text
CreditGstWholeSalesRetailSalesEntryNewJS/
```

with:

```text
calculation credit.js
```

This is direct evidence that credit calculation is implemented as a specialized billing path.

---

# 70. Order Delivery Sales

The archive contains:

```text
OrderDeliverySalesentryNewsaleAll.aspx
```

The page also exposes:

```text
InsertReturnSalesToSalbill
```

and the same core billing structure.

This indicates sales can be created from an order/delivery-oriented flow while still ending in sales transaction persistence.

A new ERP should use:

```text
Sales Order
    |
    v
Delivery
    |
    v
Sales Invoice
```

rather than duplicating invoice tables for each process.

---

# 71. Invoice vs Counter Bill

The archive contains both:

```text
InvoiceBillEntry.aspx
SaleCashBillEntry.aspx
SalesentryNewsaleAll.aspx
```

These should not be assumed to represent different accounting concepts.

They are different UI/billing modes that may ultimately persist into overlapping transaction tables.

Migration should classify them by business meaning:

```text
invoice type
sales channel
customer type
tax mode
payment mode
```

---

# 72. Sale Bill Data Lineage

A complete lineage is:

```text
Product Master
    |
    +--> Product code/name/unit/GST/HSN
    |
    v
Barcode / Stock
    |
    +--> Barcode
    +--> MRP
    +--> Purchase rate
    +--> textile attributes
    +--> stock balance
    |
    v
Sales Entry UI
    |
    +--> customer
    +--> salesman
    +--> counter
    +--> quantity
    +--> selling rate
    +--> discounts
    +--> GST
    +--> payment
    |
    v
SALSNTRY*
    |
    v
SALBILL
    |
    +--> SALES2 / SALES3
    |
    +--> cash_collection_3
    |
    +--> cashcollectiondetail
    |
    +--> invoice print
    |
    +--> sales reports
    |
    +--> sales return
```

---

# 73. Exact Core Sales Detail Fields

The broadest `SALBILL` variants observed include these field groups:

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
netamt
bdis
less
gst
cgst
sgst
billno
cmy_name
cmy_bill
gst_per
countername
Design
Brand
Patrn
Size
Color
Style
prate
nrate
CheckBarcodeBalanceStock
gstcrossamt
user_id
comp_continu_billno
cmy_wo_continu_billno
cmnyname
pgname
fname
counterID
points
c_Mrp
c_Amt
Token_Dis_Amount
gst_group
Print_Sales
TotalQty
sub_group_name
BsTotQty
ProductPoint
TotProductPoint
```

Not every billing variant writes every field.

This is a major migration consideration.

---

# 74. Historical Snapshot Principle

A posted sales line should preserve the commercial values used at the time of sale.

For example:

```text
Product Master rate today
        !=
Rate used on old invoice
```

Therefore the sales line should retain:

```text
product code
product name
barcode
MRP
selling rate
purchase/cost rate
GST rate
GST amount
HSN
unit
brand/pattern/size/color/style
```

where applicable.

---

# 75. Why SALBILL Should Not Be Replaced by a Product Join

It would be incorrect to reconstruct historical invoices entirely from current `newproduct` values.

Example:

```text
2024 invoice
Product HSN = old value

2026 Product Master
Product HSN = new value
```

A report joining only current Product Master could incorrectly show the 2026 HSN against a 2024 invoice.

New ERP should store immutable transaction snapshots.

---

# 76. Sales Cost / Profit Data

The line stores:

```text
prate
nrate
```

and the header can store:

```text
BarcodeWiseProfit
```

This supports gross-profit reporting.

The source also exposes a barcode-wise profit value in the UI:

```text
lblBarcodeBillwiseProfit
```

Therefore sales profitability is a first-class operational concern.

---

# 77. Product Rate Change Impact

Because `prate` and `nrate` are stored in the sales line, later changes to Product Master pricing do not necessarily change historical invoice values.

This is desirable.

The new ERP should explicitly preserve:

```text
cost_at_sale
sale_rate
mrp_at_sale
```

---

# 78. Bill-Level Profit

A bill-level profit can conceptually be derived from:

```text
sum(line selling value)
    -
    sum(line cost value)
```

but the legacy system may use `BarcodeWiseProfit` and rate snapshots.

The migration should reproduce the legacy report logic first before replacing it with a new accounting definition.

---

# 79. Sales Bill Validation

The UI contains several validation-oriented fields and AJAX calls.

Examples include:

```text
stock balance
credit bill allowed
customer point allowed
brand minimum quantity
product token
offer discount
```

Hidden controls include:

```text
txt_CreditbillAllowed
txt_CustPointAllowed
txtCustPointCheck
txtBarProDis
txtBarProFree
txtBarProCombo
txtProductToken
txtGiftProductToken
txtOfferDiscounts
```

This means billing validation extends beyond product/quantity/tax.

---

# 80. Brand Minimum Quantity

The page exposes:

```text
GetDataBrandMINIUMQTY
```

This indicates brand-level minimum-quantity logic exists in at least some billing modes.

Do not assume it is a universal sales rule.

For migration:

```text
identify the billing mode
identify the configuration source
identify whether the rule blocks posting or only warns
```

---

# 81. Credit Bill Permission

The UI contains:

```text
txt_CreditbillAllowed
```

This indicates credit billing can be controlled by configuration or permission.

New ERP should make this an explicit authorization rule:

```text
User / Role
   |
   +--> credit sales permission
   +--> maximum credit amount
   +--> customer eligibility
```

---

# 82. Customer Point Permission

The UI contains:

```text
txt_CustPointAllowed
```

and:

```text
txtCustPointCheck
```

Therefore loyalty points can be conditionally enabled.

New ERP should separate:

```text
loyalty configuration
loyalty eligibility
points earned
points redeemed
```

---

# 83. Bill-Level Round-Off

`SALES2` stores:

```text
roundoff
```

The final net amount therefore includes rounding behavior.

New ERP should store the rounding amount explicitly instead of recomputing it from a rounded total.

---

# 84. Total Quantity and Total Net Amount

The sales header stores:

```text
tot_qty
tot_netamnt
totnetsub
```

Conceptually:

```text
Total Quantity = sum(line quantities)
Total Net = sum(line net amounts) +/− bill-level adjustments
```

The exact legacy formula must be preserved during migration testing.

---

# 85. Bill Status and Return Status

`retstat` exists in `sales2`.

This should not be interpreted automatically as the complete sales-return status model.

The archive also contains dedicated return screens and reports.

Recommended new ERP:

```text
invoice_status
return_status
payment_status
inventory_status
```

as separate concepts.

---

# 86. Sales Cancellation

The legacy system uses deletion for working bill cleanup.

For posted billing, cancellation behavior must be traced by production screen and database status because multiple variants exist.

New ERP should use:

```text
Invoice cancellation
    |
    +--> cancellation reason
    +--> authorized user
    +--> timestamp
    +--> inventory reversal
    +--> tax reversal
    +--> payment reversal
```

Never physically delete a posted invoice.

---

# 87. Sales Audit Requirements for New ERP

A posted invoice should capture:

```text
created_by
posted_by
created_at
posted_at
counter_id
company_id
store_id
financial_year
invoice_series
invoice_number
```

Line audit should capture:

```text
product_id
variant_id
barcode_id
quantity
rate
cost
GST
discount
```

---

# 88. Recommended New ERP Sales Schema

```text
sales_invoice
├── id
├── company_id
├── branch_id
├── store_id
├── counter_id
├── financial_year_id
├── invoice_series_id
├── invoice_number
├── invoice_datetime
├── customer_id
├── salesman_id
├── sales_channel_id
├── tax_mode
├── subtotal
├── line_discount_amount
├── bill_discount_amount
├── bill_less_amount
├── tax_amount
├── round_off
├── grand_total
├── paid_amount
├── credit_amount
├── balance_amount
├── status
├── created_by
├── posted_by
├── created_at
└── posted_at
```

---

# 89. Recommended New ERP Sales Lines

```text
sales_invoice_line
├── id
├── sales_invoice_id
├── product_id
├── product_variant_id
├── barcode_id
├── product_code_snapshot
├── product_name_snapshot
├── unit_id
├── hsn_code_snapshot
├── gst_rate_snapshot
├── mrp
├── selling_rate
├── cost_rate
├── quantity
├── meter_quantity
├── gross_amount
├── discount_amount
├── less_amount
├── taxable_amount
├── cgst_amount
├── sgst_amount
├── igst_amount
├── total_tax_amount
├── net_amount
├── salesman_id
├── brand_snapshot
├── pattern_snapshot
├── size_snapshot
├── color_snapshot
├── style_snapshot
└── created_at
```

---

# 90. Recommended Payment Schema

```text
sales_payment
├── id
├── sales_invoice_id
├── payment_method
├── amount
├── reference_no
├── bank_name
├── remarks
├── payment_datetime
├── received_by
└── status
```

For credit:

```text
customer_receivable
├── id
├── customer_id
├── sales_invoice_id
├── debit_amount
├── credit_amount
├── outstanding_amount
└── status
```

---

# 91. Recommended Inventory Posting

```text
sales_invoice POSTED
       |
       v
inventory_transaction
       |
       +--> OUT
       +--> barcode_id
       +--> quantity
       +--> cost
       +--> store_id
       +--> counter_id
       +--> reference_invoice_id
```

This provides a clean audit trail instead of relying on implicit changes across multiple legacy tables.

---

# 92. Recommended Sales Lifecycle

```text
DRAFT
  |
  v
VALIDATED
  |
  v
POSTING
  |
  +--> invoice line persistence
  +--> tax calculation
  +--> inventory posting
  +--> payment posting
  |
  v
POSTED
  |
  +--> PRINTED
  |
  +--> PARTIALLY_RETURNED
  |
  +--> FULLY_RETURNED
  |
  +--> CANCELLED
```

---

# 93. Legacy-to-New ERP Mapping

| Legacy object | New ERP target |
|---|---|
| `SALBILL` | `sales_invoice_line` |
| `SALES2` | `sales_invoice` |
| `SALES3` | `sales_invoice` / specialized snapshot |
| `SALSNTRY1` | `sales_draft_line` / staging |
| `salsntry2` | `sales_draft_line` / staging |
| `salbilledit` | draft/edit history |
| `cash_collection_3` | `sales_payment` / cash receipt |
| `cashcollectiondetail` | `sales_payment_detail` |
| `newproduct` | `product` |
| barcode/stock layer | `product_variant` + `barcode` + `inventory_balance` |
| `slman` | `salesman_id` |
| `countername` | `counter_id` |
| `counterID` | `counter_id` |
| `cmy_name` | `company_id` |
| `billno` | `invoice_number` |
| `paymenttype` | `payment_method` / payment allocation |
| `gst5/gst12/gst18/gst28` | tax summary / tax lines |
| `BarcodeWiseProfit` | derived profit/reporting metric |
```

---

# 94. Data Migration Order

Recommended migration order:

```text
1. Company / Branch / Store / Counter
2. Users / Salesmen
3. Customers
4. Product Master
5. Product variants / attributes
6. Barcode master
7. Purchase / GRN
8. Stock opening / inventory lots
9. Sales header
10. Sales lines
11. Payments
12. Customer receivables
13. Sales returns
14. Loyalty points
15. Reports / reconciliation
```

Do not migrate `SALBILL` before the barcode/product and company/counter reference data is available.

---

# 95. Sales Migration Key

The minimum safe identity for a legacy sales line is:

```text
billno
sn
countername
cmy_name
```

For barcode-level reconciliation:

```text
billno
sn
barcode
code
qty
```

For multi-company environments, include company identity explicitly.

---

# 96. Sales Duplicate Detection

Before migration, detect duplicates using:

```text
company
counter
billno
sn
barcode
```

Potential duplicate cases:

```text
same bill number in different counters
same bill number across companies
staged row + final row
replayed import
edited bill copy
```

Do not assume `billno` alone is unique.

---

# 97. Sales Header/Line Reconciliation

For every bill:

```text
SALES2.tot_qty
        = sum(SALBILL.qty)
```

and:

```text
SALES2.tot_netamnt
        ≈ sum(SALBILL.netamt)
          +/− bill-level discount/less/rounding
```

The exact formula must be validated against the production database because the legacy system stores multiple overlapping totals.

---

# 98. Payment Reconciliation

For each finalized bill:

```text
Grand Total
    = cash
    + card
    + digital payment
    + credit
    + advance applied
    +/- rounding
```

The actual legacy formula should be tested against:

```text
SALES2
cash_collection_3
cashcollectiondetail
```

before migration sign-off.

---

# 99. GST Reconciliation

For each bill:

```text
Line taxable values
      |
      +--> GST 5
      +--> GST 12
      +--> GST 18
      +--> GST 28
      +--> IGST
      |
      v
Bill GST summary
```

Validate:

```text
sum(line GST)
      =
header GST totals
```

within the system's rounding rules.

---

# 100. Stock Reconciliation

For barcode-tracked items:

```text
Opening stock
 + Purchases
 + Sales returns
 - Sales
 - Purchase returns
 +/- adjustments
 = Closing stock
```

The sales side should be reconciled against:

```text
SALBILL
barcode stock balance logic
stockdetails / barcode layer
sales return tables
```

The archive does not establish one universal stock update statement for all sales screens, so production verification is mandatory.

---

# 101. Sales Report Reconciliation

A migrated bill must appear consistently in:

```text
Invoice-wise sales
Date-wise sales
Customer-wise sales
Salesman-wise sales
Barcode-wise sales
Pattern/Size sales
Wholesale/Retail sales
Credit sales
GST sales
GRN-wise sales
Counter-wise sales
```

A migration should compare report totals before and after migration.

---

# 102. Major Legacy Risks

## 102.1 Multiple billing implementations

The archive contains many duplicated/variant sales pages.

Risk:

```text
same business operation
+ different code path
+ different field subset
= inconsistent historical data
```

---

## 102.2 Wide denormalized SALBILL

`SALBILL` mixes:

```text
product
barcode
pricing
tax
customer
company
counter
loyalty
promotion
profit
```

This makes migration difficult and increases coupling.

---

## 102.3 Working bill deletion

Legacy code physically deletes `BILL1/BILL2/BILL3` rows.

New ERP should use draft lifecycle states.

---

## 102.4 String-based bill identity

Bill numbers and counter/company values are frequently embedded in SQL strings.

New ERP should use numeric IDs and parameterized SQL.

---

## 102.5 SQL injection risk

The compiled SQL contains string-concatenated values in several sales operations.

New ERP should use parameterized queries / ORM parameters.

---

## 102.6 Status ambiguity

Fields such as:

```text
status
SBillStatus
retstat
costatus
```

have different meanings in different modules.

New ERP should normalize status domains.

---

## 102.7 Staging/final duplication

The same sale can exist in:

```text
SALSNTRY*
SALBILL
SALES2
cash_collection_3
```

Migration must avoid importing the same business transaction twice.

---

# 103. Sales End-to-End Diagram

```text
                  PRODUCT MASTER
                       |
                       v
                BARCODE / STOCK
                       |
             +---------+---------+
             |                   |
             v                   v
       Product lookup       Barcode scan
             |                   |
             +---------+---------+
                       |
                       v
                SALES ENTRY UI
                       |
          +------------+-------------+
          |            |             |
          v            v             v
      Customer      Pricing        Tax/GST
          |            |             |
          +------------+-------------+
                       |
                       v
                  SALES DRAFT
                       |
                       v
                 SALSNTRY*
                       |
                       v
                   VALIDATE
                       |
        +--------------+--------------+
        |              |              |
        v              v              v
    SALBILL         SALES2/3     PAYMENT DATA
    Lines           Header       Cash/Card/Credit
        |              |              |
        +--------------+--------------+
                       |
                       v
                    POSTED
                       |
          +------------+-------------+
          |            |             |
          v            v             v
       Inventory     Customer       Reports
         OUT         Balance        / Print
          |
          v
     Sales Return
       / Exchange
```

---

# 104. Complete Operational Flow

```text
1. User logs in.
2. System establishes company/counter/user context.
3. Sales screen opens.
4. Bill workspace is created or loaded.
5. Bill number context is resolved.
6. Customer is selected when required.
7. Barcode or product is entered.
8. Product master data is resolved.
9. Barcode stock balance is checked.
10. Product price/MRP/cost information is loaded.
11. Textile attributes are loaded.
12. Quantity/meter is entered.
13. Gross amount is calculated.
14. Product discount is calculated.
15. Product less is calculated.
16. GST is calculated.
17. CGST/SGST or IGST is determined.
18. Line net amount is calculated.
19. Line is added to the working bill.
20. Additional products are entered.
21. Bill-level discount is calculated.
22. Bill-level less is calculated.
23. Loyalty points/promotions are applied if enabled.
24. Round-off is calculated.
25. Final bill total is calculated.
26. Payment mode is selected.
27. Cash/card/digital/credit amounts are captured.
28. Customer advance/credit balance is applied if relevant.
29. Working sales rows are validated.
30. Final SALBILL rows are persisted.
31. SALES2/SALES3 header is persisted.
32. Payment/cash collection is persisted.
33. Staging rows are marked finalized where applicable.
34. Inventory/sales stock posting occurs according to the billing implementation.
35. Bill is printed/displayed.
36. Sales reports can query the finalized transaction.
37. Later sales return references the original sale.
```

---

# 105. Product-to-Sale Lineage

```text
newproduct
    |
    | code/name/unit/GST/HSN
    v
barcode / inventory
    |
    | barcode/MRP/prate/attributes
    v
sales line
    |
    +--> SALBILL
    +--> invoice print
    +--> profit
    +--> sales reports
    +--> sales return
```

---

# 106. Purchase-to-Sale Lineage

```text
Purchase GRN
    |
    v
purentrydetails
    |
    v
stockdetails / barcode
    |
    v
SALBILL
    |
    v
Sales
```

This lineage is important for margin and inventory analysis.

---

# 107. Sale-to-Return Lineage

```text
SALBILL
   |
   | billno / barcode / product
   v
Sales Return Entry
   |
   +--> returned quantity
   +--> tax reversal
   +--> customer adjustment
   +--> inventory restoration
```

The return must never exceed the eligible sold quantity after previous returns.

---

# 108. New ERP Architecture Recommendation

The clean architecture should be:

```text
Product
   |
Product Variant
   |
Barcode / Inventory Lot
   |
Sales Invoice
   |
Sales Invoice Line
   |
Payment
   |
Inventory Transaction
```

with supporting modules:

```text
Customer
Salesman
Counter
Company
Store
Tax
Discount/Promotion
Loyalty
Sales Return
```

---

# 109. Recommended Posting Transaction

For a new ERP, invoice posting should be atomic:

```text
BEGIN TRANSACTION

1. Validate invoice
2. Validate barcode/stock
3. Validate customer credit
4. Calculate tax
5. Generate invoice number
6. Insert sales header
7. Insert sales lines
8. Insert payment records
9. Insert inventory OUT transactions
10. Update inventory balances
11. Insert receivable if credit
12. Insert loyalty transactions
13. Mark invoice POSTED

COMMIT
```

On failure:

```text
ROLLBACK
```

This prevents a posted invoice with missing stock/payment/header records.

---

# 110. What Should Not Be Copied to New ERP

Avoid reproducing these legacy patterns:

```text
BILL1/BILL2/BILL3 as real invoice numbers
Physical deletion of posted invoices
One giant SALBILL table for every concern
Payment columns for every payment provider
Ambiguous status strings
String-concatenated SQL
Duplicated sales pages for every billing mode
Implicit stock mutation
Current Product Master joins for historical invoice values
```

---

# 111. What Should Be Preserved

Preserve the business capabilities represented by the legacy system:

```text
Barcode billing
Product billing
Multiple units
Meter-based sales
MRP
Selling rate
Purchase/cost snapshot
GST 5/12/18/28
CGST/SGST
IGST
Product discount
Bill discount
Less
Round-off
Cash
Card
Digital payment
Credit sales
Customer advance
Customer points
Salesman
Counter
Company-specific numbering
Wholesale/Retail
Invoice billing
Combo billing
Gift/token billing
Sales returns
Barcode-wise profit
Pattern/Size/Brand reports
Customer-wise reports
GRN-wise sales analysis
```

---

# 112. Confirmed vs Inferred Findings

## Confirmed from source

```text
SALBILL is used for finalized sales lines.
SALES2 is used for bill-level sales summaries in multiple implementations.
SALES3 also exists as a sales-header variant.
SALSNTRY1 / salsntry2 are used in staging/finalization flows.
salbilledit exists for sales editing.
cash_collection_3 stores payment/cash information.
cashcollectiondetail stores payment/cash detail.
Barcode stock balance is checked in the UI.
SALBILL stores barcode, product, pricing, GST and textile attributes.
SALES2 stores totals, customer, GST and payment information.
Sales reports query these transaction dimensions.
Sales returns have dedicated pages and APIs.
```

## Requires production validation

```text
Exact stock decrement SQL used by every billing variant.
Exact final accounting posting for every payment mode.
Exact meaning of every legacy status code.
Whether SALES2 or SALES3 is authoritative for each billing mode.
Whether salbilledit is audit history or only working/edit storage.
Exact invoice numbering scope for every company/counter mode.
Exact loyalty accounting treatment.
Exact cost allocation rule used for profit.
Exact behavior for posted bill cancellation.
```

---

# 113. Final Conclusion

TextileSoft sales billing is a multi-layer transaction process rather than a single `SALBILL` insert.

The practical end-to-end model is:

```text
PRODUCT
   |
   v
BARCODE / STOCK
   |
   v
SALES ENTRY
   |
   +--> customer
   +--> salesman
   +--> counter
   +--> quantity/meter
   +--> rate/MRP
   +--> discount/less
   +--> GST
   +--> loyalty/promotion
   |
   v
SALSNTRY / WORKING DATA
   |
   v
SALBILL + SALES2/SALES3
   |
   +--> PAYMENT / CASH COLLECTION
   |
   +--> INVENTORY OUT
   |
   +--> PRINT / REPORTS
   |
   +--> SALES RETURN
```

The key migration principle is to separate the legacy storage representation from the business transaction itself.

The new ERP should have one authoritative sales invoice model with:

```text
Invoice Header
Invoice Lines
Payments
Inventory Transactions
Receivables
Returns
Audit Trail
```

while preserving the historical values from the legacy `SALBILL`/`SALES2` records as immutable transaction snapshots.

This provides a clean foundation for the next modules in the ERP documentation sequence: sales returns, customer credit/collections, inventory posting, and sales reporting.
