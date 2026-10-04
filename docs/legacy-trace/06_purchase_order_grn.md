# 06. Purchase Order and GRN - End-to-End Flow

## 1. Purpose

This document describes the complete Purchase Order (PO) and Goods Receipt / GRN flow found in the TextileSoft source archive.

The analysis is source-driven and separates three concepts that are easy to confuse in the legacy application:

1. **Purchase Order** - a planned/ordered quantity recorded in `POHeader` and `PODetails`.
2. **PO receipt tracking** - receipt, return, shortage and excess quantities recorded back against `PODetails` by `PurchaseReceivedEntry.aspx`.
3. **Actual Purchase / GRN posting** - the financial and inventory purchase transaction recorded in `purgrnentry` and `purentrydetails` by the purchase-entry modules documented in `05_purchase.md`.

A particularly important legacy characteristic is that the PO table column is named `grn_no`. In the PO screens this value is displayed as **PO NO**, so `POHeader.grn_no` should be interpreted as the PO identifier in this module, not automatically as the posted purchase GRN number.

---

## 2. Executive Summary

The core PO architecture is:

```text
PurchaseOrderEntry.aspx
        |
        +--> POHeader
        |      PO number = grn_no
        |      supplier
        |      salesman
        |      supervisor/agent
        |      incharge
        |      company
        |      PO dates
        |      PO status
        |      overall qty
        |      overall meter
        |
        +--> PODetails
               one row per ordered product/design combination
               product code/name
               ordered qty
               meter
               free qty
               rate
               amount
               discounts
               GST
               net amount
               selling/commission fields
               Brand / Pattern / Size / Color / Style
               unit
               total meter
```

The receipt-tracking architecture is:

```text
PurchaseReceivedEntry.aspx
        |
        +--> select POHeader + PODetails by PO number
        |
        +--> user enters / verifies
        |       received-entry quantity
        |       received quantity
        |       return quantity
        |       shortage quantity
        |       excess quantity
        |       received date
        |       receipt reference number
        |       checked by
        |
        +--> UPDATE PODetails
               returnqty
               receivqty
               receivdate
               receivrefno
               receiventryqty
               shortqty
               excessqty
               checkedby
```

Actual inventory purchase posting is a separate path:

```text
Purchase Entry
      |
      +--> purgrnentry          Purchase / GRN header
      |
      +--> purentrydetails      Purchase / GRN detail
      |
      +--> Barcode / SKU flow
      |
      +--> Stock
      |
      +--> Sales availability
      |
      +--> Purchase reports / accounting / returns
```

Therefore the safest migration model is:

```text
PO
  -> PO receipt tracking
  -> optional actual Purchase/GRN document
  -> inventory
```

not:

```text
PO = GRN = Stock
```

---

# 3. Source Files Traced

## 3.1 Main Purchase Order page

```text
PurchaseOrderEntry.aspx
```

Page directive:

```text
inherits="PurchaseOrderEntry, App_Web_1y0qyu0x"
```

Main JavaScript directory:

```text
PurchaseOrderEntryJS/
```

Important scripts:

```text
PurchaseOrderEntryJS/grn.js
PurchaseOrderEntryJS/saveData.js
PurchaseOrderEntryJS/viewdetails.js
PurchaseOrderEntryJS/calculation.js
PurchaseOrderEntryJS/addrow1.js
PurchaseOrderEntryJS/design.js
PurchaseOrderEntryJS/brand.js
PurchaseOrderEntryJS/sizerate.js
PurchaseOrderEntryJS/PurchReceqty.js
PurchaseOrderEntryJS/delete.js
PurchaseOrderEntryJS/update.js
```

Compiled code:

```text
bin/App_Web_1y0qyu0x.dll
```

---

## 3.2 Purchase Order view

```text
PurchaseOrderView.aspx
```

This page displays the saved PO list and detail information.

The page loads several PO-related JavaScript files, including design, brand, calculation, save/update, row handling and size/rate logic.

---

## 3.3 Purchase Order report

```text
PurchaseOrderEntryReport.aspx
```

Compiled code:

```text
bin/App_Web_pfz2ph2q.dll
```

The report exposes both ordered and received quantities.

---

## 3.4 Purchase receiving page

```text
PurchaseReceivedEntry.aspx
```

Compiled code:

```text
bin/App_Web_rtqwvufe.dll
```

This page is the explicit PO receiving/verification workflow.

---

## 3.5 Actual purchase entry

The archive contains multiple purchase entry variants, including:

```text
purchaseentry.aspx
NewPurchaseentry.aspx
NewPurchaseDiscountEntry1.aspx
NewPurchaseDiscountEntry2.aspx
NewWithoutDiscountPurchaseEntry1.aspx
NewWithoutDiscountPurchaseEntry2.aspx
WRPurchaseEntryNew.aspx
FancyPurchaseEntry.aspx
```

These modules ultimately work with:

```text
purgrnentry
purentrydetails
```

The exact purchase posting flow is documented separately in:

```text
05_purchase.md
```

---

# 4. Core Database Tables

## 4.1 POHeader

Main Purchase Order header table:

```text
POHeader
```

Confirmed insert statement:

```sql
insert into POHeader(
    suplier_name,
    SalesMan,
    agent_name,
    incharge,
    cmy_name,
    grn_no,
    invoce_date,
    entry_date,
    date,
    POStatus,
    OverAllQty,
    OverAllMtr
)
values(
    @suplier_name,
    @SalesMan,
    @agent_name,
    @incharge,
    @cmy_name,
    @grn_no,
    @invoce_date,
    @entry_date,
    @date,
    @POStatus,
    @OverAllQty,
    @OverAllMtr
)
```

Important observation:

```text
grn_no
```

is the identifier used by the PO screen and is displayed as:

```text
PO NO
```

Therefore it is a legacy naming mismatch.

---

## 4.2 PODetails

Main Purchase Order line table:

```text
PODetails
```

Confirmed insert statement:

```sql
insert into PODetails(
    entry_date,
    pratecode,
    grn_no,
    sl_no,
    barcode,
    design,
    code,
    pname,
    prate,
    mtr,
    qty,
    amount,
    dis_per,
    dis_amount,
    gst_per,
    gst_amount,
    nrate,
    net_amount,
    sr_per,
    mrp,
    sr_rate,
    cr_per,
    cr_rate,
    brand,
    patrn,
    size,
    color,
    style,
    fqty,
    date,
    pro_group_name,
    unit_details,
    orgbar,
    pless,
    plamt,
    mrpdisper,
    mrpdisamt,
    FromMRP,
    ToMRP,
    billstatus,
    TotalMeter
)
values(
    @entry_date,
    @pratecode,
    @grn_no,
    @sl_no,
    @barcode,
    @design,
    @code,
    @pname,
    @prate,
    @mtr,
    @qty,
    @amount,
    @dis_per,
    @dis_amount,
    @gst_per,
    @gst_amount,
    @nrate,
    @net_amount,
    @sr_per,
    @mrp,
    @sr_rate,
    @cr_per,
    @cr_rate,
    @brand,
    @patrn,
    @size,
    @color,
    @style,
    @fqty,
    @date,
    @pro_group_name,
    @unit_details,
    @orgbar,
    @pless,
    @plamt,
    @mrpdisper,
    @mrpdisamt,
    @FromMRP,
    @ToMRP,
    @billstatus,
    @TotalMeter
)
```

This table contains substantially more commercial and item-level information than `POHeader`.

---

## 4.3 GRN / purchase header

Actual purchase header table:

```text
purgrnentry
```

The PO module itself does not use this table for its main PO insert.

Actual purchase entry uses it for the posted purchase/GRN transaction.

Examples of fields seen in the purchase code include:

```text
warehouse
invoce_amount
suplier_name
invoce_date
pay_type
pnet_tot
com_per
com_amount
pack_char
oter_char
char_tot
incharge
sales
cross_amount
mrpdisperh
gst5
gst12
gst18
gst28
```

---

## 4.4 Actual GRN detail

Actual purchase detail table:

```text
purentrydetails
```

It carries purchase/barcode-level information including:

```text
sl_no
design
barcode
code
pname
mtr
qty
fqty
mrp
prate
nrate
sr_per
sr_rate
cr_per
cr_rate
brand
patrn
size
color
style
pratecode
mrpdisper
mrpdisamt
```

The purchase detail may also carry additional operational fields depending on the purchase variant.

---

# 5. Purchase Order UI

## 5.1 Page title

The main page displays:

```text
PURCHASE ORDER ENTRY
```

The top section also displays runtime context such as:

```text
COUNTER NAME
LOGIN NAME
DATE
```

---

## 5.2 Header fields

Confirmed PO header inputs include:

| UI concept | Source control | Saved field |
|---|---|---|
| Company | `cmbx5` | `cmy_name` |
| Warehouse | `ComboBox1_TextBox` | captured in head payload |
| Supplier | `ComboBox2_TextBox` | `suplier_name` |
| Supervisor / Agent | `ComboBox3_TextBox` | `agent_name` |
| Incharge | `ComboBox5_TextBox` | `incharge` |
| Salesman | `cmbSalesman_TextBox` | `SalesMan` |
| PO number | `TextBox1` | `grn_no` |
| Invoice / reference no | `TextBox26` | captured in client payload |
| Invoice date | `TextBox6` | `invoce_date` |
| Entry date | `TextBox13` | `entry_date` |
| Payment type | `ComboBox4_TextBox` | captured in client payload |
| Net total | `TextBox3` | captured in client payload |
| Agent commission % | `TextBox8` | captured in client payload |
| Agent commission | `TextBox11` | captured in client payload |
| Packing charges | `TextBox15` | captured in client payload |
| Other charges | `TextBox21` | captured in client payload |
| Total charges | `TextBox2` | captured in client payload |
| Total quantity | `TextBox4` / calculated | captured in client payload |
| Expense/extra amount | `TextBox25` | captured in client payload |
| Bill discount % | `TextBox9` | captured in client payload |
| GST % | `TextBox17` | captured in client payload |
| IGST % | `TextBox22` | captured in client payload |
| Brand header | `ComboBox6_TextBox` | captured in client payload |
| Sales % | `TextBox19` | captured in client payload |
| MRP % | `txtMRPPer` | captured in client payload |
| CR % | `TextBox24` | captured in client payload |
| Less | `TextBox5` | captured in client payload |
| Total net amount | `Label64` | captured in client payload |
| Total less | `TextBox37` | captured in client payload |
| Overall quantity | `lblTotalQty` | `OverAllQty` |
| Overall meter | `lblTotalMtr` | `OverAllMtr` |
```

Important migration note:

The browser-side `head` payload contains more fields than the confirmed `POHeader` insert statement. This indicates that some header values may be calculated, used transiently, or persisted by additional code paths. They must not automatically be assumed to be POHeader columns without database verification.

---

# 6. PO Number Generation

The PO page invokes:

```text
PurchaseOrderEntry.aspx/PopulateCountries
```

through `PurchaseOrderEntryJS/grn.js`.

The returned value is placed into:

```text
TextBox1
```

and also into each row's hidden `grno` field.

Example client logic:

```javascript
url: "PurchaseOrderEntry.aspx/PopulateCountries"
```

with company and counter context.

The resulting value is therefore propagated to both:

```text
POHeader.grn_no
PODetails.grn_no
```

This is the logical PO key.

---

# 7. PO Number Naming Problem

The legacy naming is confusing:

```text
POHeader.grn_no
PODetails.grn_no
```

while the UI calls it:

```text
PO NO
```

Actual purchase/GRN tables also have:

```text
purgrnentry.grn_no
purentrydetails.grn_no
```

Therefore the same column name is reused across two business documents.

## Recommended new ERP terminology

Use explicit names:

```text
purchase_orders.po_no
purchase_order_lines.po_id
purchase_receipts.grn_no
purchase_receipt_lines.grn_id
```

Do not retain `grn_no` as the PO identifier in a new normalized schema.

---

# 8. Product Selection in PO

The PO row supports product selection through:

```text
code
pname
```

The source performs Product Master lookups such as:

```sql
select name,code,unit_de
from newproduct
where cmy_name=@company
and name LIKE ''+@SearchEmpName+'%'
order by code
```

and:

```sql
select code,name,unit_de
from newproduct
where cmy_name=@company
and code=@code
```

The product name is therefore derived from Product Master rather than being an independent PO product master.

---

# 9. PO Detail Row

A new PO row contains the following main client-side fields:

```text
serial
bar
design
code
pname
prate
mtr
prqty
fqty
amount
pless
plamt
dis
dsamt
gst
gsamt
nrates
netamt
srs
mrp
srate
crs
crrate
totalmeter
brand
patrn
size
color
style
unit
pcname
grno
bilslcon
bilsl
```

Not all of these fields are necessarily stored in `PODetails`; some are temporary UI/calculation values.

---

# 10. Product / Item Identity in PO

The main product identity is:

```text
code
pname
```

with:

```text
design
```

as an additional item/design dimension.

Textile attributes are:

```text
brand
patrn
size
color
style
```

Commercial attributes include:

```text
prate
mrp
nrate
sr_per
sr_rate
cr_per
cr_rate
```

Quantity attributes include:

```text
qty
fqty
mtr
TotalMeter
```

---

# 11. Quantity and Meter Logic

The PO calculation JavaScript explicitly calculates total meter using meter per item and quantity.

Core calculation:

```text
TotalMeter = MTR × Quantity
```

The source initializes meter to `1` in some empty/default cases so that quantity-based items can still calculate.

The overall total meter is accumulated into:

```text
lblTotalMtr
```

The overall quantity is accumulated into:

```text
lblTotalQty
```

These values are sent to the server as:

```text
OverAllQty
OverAllMtr
```

and stored in `POHeader`.

---

# 12. Free Quantity

The PO detail supports:

```text
fqty
```

which is shown as:

```text
FQTY
```

This is separate from ordered quantity:

```text
qty
```

Therefore a PO line can represent:

```text
Commercial Qty = qty
Free Qty       = fqty
```

Migration must preserve these separately.

Do not simply add free quantity into ordered quantity unless business rules explicitly require that interpretation.

---

# 13. Amount Calculation

The PO calculation JavaScript derives amount from rate, meter and quantity.

The source contains logic equivalent to:

```text
TotalMeter = MTR × Quantity
Amount ≈ PurchaseRate × MTR × Quantity
```

The code also separately evaluates the free quantity when deriving effective amounts.

This means the following fields should be retained as historical snapshots:

```text
prate
mtr
qty
fqty
amount
```

rather than recalculating old POs later from current Product Master rates.

---

# 14. Purchase Less

PO detail contains:

```text
pless
plamt
```

The UI labels these as:

```text
PLESS
PLAMOUNT
```

They participate in the purchase amount calculation.

Because the exact business interpretation depends on the implementation variant, migration should preserve both percentage/value and calculated amount rather than collapsing them.

---

# 15. Discount

PO detail supports:

```text
dis
 dsamt
```

which map to:

```text
dis_per
dis_amount
```

The header also has a bill-level discount input:

```text
BDIS %
```

represented by:

```text
TextBox9
```

Therefore there are at least two discount layers:

```text
Line discount
Bill/header discount
```

A new ERP should model them separately.

---

# 16. GST

PO detail stores:

```text
gst_per
gst_amount
```

The UI has GST and IGST controls.

The source also calculates totals for:

```text
GST 5%
GST 12%
GST 18%
GST 28%
IGST
```

The header payload includes:

```text
gst5
gst12
gst18
gst28
igst
```

This is useful for tax reporting and reconciliation.

---

# 17. Net Amount

PO detail stores:

```text
net_amount
```

The calculation sequence is conceptually:

```text
Base amount
  -> purchase less
  -> line discount
  -> taxable amount
  -> GST / IGST
  -> net amount
```

Exact calculation order varies across legacy purchase variants, so migration should retain the stored historical amounts rather than recompute them from a simplified formula.

---

# 18. Rate Fields

The PO detail contains multiple rate concepts:

```text
prate
nrate
mrp
sr_rate
cr_rate
```

and percentage fields:

```text
sr_per
cr_per
mrpdisper
```

Interpretation:

| Field | Legacy meaning |
|---|---|
| `prate` | Purchase rate |
| `nrate` | Net / derived rate |
| `mrp` | MRP |
| `sr_per` | Sales-rate percentage / margin parameter |
| `sr_rate` | Sales rate |
| `cr_per` | Commission-related percentage |
| `cr_rate` | Commission-related rate |
| `mrpdisper` | MRP discount percentage |
| `mrpdisamt` | MRP discount amount |

Exact business formula should be preserved from the transaction version being migrated.

---

# 19. Textile Attributes in PO

PO detail stores:

```text
brand
patrn
size
color
style
```

These are the same major attributes used downstream by purchase, barcode, stock and sales.

Example downstream sale fields include:

```text
design
brand
patrn
size
color
style
```

Therefore the PO is an early source of intended SKU characteristics.

---

# 20. Brand Master

The PO page contains Brand support through:

```text
PurchaseOrderEntryJS/brand.js
```

The source queries:

```sql
select * from brand
```

and:

```sql
select *
from brand
where name_eng=@name
```

Brand creation is supported with a structure including:

```sql
insert into brand(
    group_cd,
    name_eng,
    prin_name_eng,
    date
)
values(
    @group_cd,
    @name_eng,
    @prin_name_eng,
    @date
)
```

The selected brand is then saved into the PO line as:

```text
PODetails.brand
```

---

# 21. Pattern Master

Pattern is stored as:

```text
PODetails.patrn
```

The source has a separate `pattern` master.

Creation pattern:

```sql
insert into pattern(
    group_cd,
    name_eng,
    prin_name_eng,
    date
)
values(
    @group_cd,
    @name_eng,
    @prin_name_eng,
    @date
)
```

---

# 22. Size Master

Size is stored as:

```text
PODetails.size
```

Separate master:

```text
size
```

Creation pattern:

```sql
insert into size(
    group_cd,
    name_eng,
    prin_name_eng,
    date
)
values(
    @group_cd,
    @name_eng,
    @prin_name_eng,
    @date
)
```

---

# 23. Color Master

Color is stored as:

```text
PODetails.color
```

Separate master:

```text
color
```

Creation pattern:

```sql
insert into color(
    group_cd,
    name_eng,
    prin_name_eng,
    date
)
values(
    @group_cd,
    @name_eng,
    @prin_name_eng,
    @date
)
```

---

# 24. Style Master

Style is stored as:

```text
PODetails.style
```

Separate master:

```text
style
```

Creation pattern:

```sql
insert into style(
    group_cd,
    name_eng,
    prin_name_eng,
    date
)
values(
    @group_cd,
    @name_eng,
    @prin_name_eng,
    @date
)
```

---

# 25. Design

The PO line contains:

```text
design
```

The source also has a separate `design` master.

Creation pattern:

```sql
insert into design(
    group_cd,
    name_eng,
    prin_name_eng,
    date
)
values(
    @group_cd,
    @name_eng,
    @prin_name_eng,
    @date
)
```

Design is therefore distinct from Product Code.

Recommended conceptual hierarchy:

```text
Product
  |
  +-- Design
       |
       +-- Brand
       +-- Pattern
       +-- Size
       +-- Color
       +-- Style
```

However, the legacy database does not enforce this as a normalized relational hierarchy.

---

# 26. PO Save Flow

The save flow is implemented in:

```text
PurchaseOrderEntryJS/saveData.js
```

The save operation has two major AJAX calls.

## Step 1 - Validate empty PO

The client checks:

```text
lblTotalQty
lblTotalMtr
```

If both are zero:

```text
Empty Data. Not Allowed to Save...
```

is displayed and saving stops.

---

## Step 2 - Build header object

The JavaScript builds:

```javascript
head = {}
```

with company, warehouse, supplier, agent, PO number, dates, charges, tax, salesman, totals and other values.

---

## Step 3 - Save header

AJAX call:

```text
PurchaseOrderEntry.aspx/Savehead
```

Payload contains the header object.

The source then calls:

```text
SaveData
```

for the detail rows.

---

## Step 4 - Build detail collection

`PrepareInputData()` loops through:

```text
#tbldata tr:not(:first-child)
```

and reads all input fields by their HTML `name` attributes.

The resulting object contains:

```text
Rows
UserProfiles[]
```

---

## Step 5 - Save detail rows

AJAX call:

```text
PurchaseOrderEntry.aspx/SaveData
```

The detail collection is sent as JSON.

---

## Step 6 - Redirect to PO view

On successful detail save:

```text
PurchaseOrderView.aspx?ID=<CurrentUserID>
```

is opened.

---

# 27. Important Save Architecture Issue

The client performs:

```text
Savehead
    -> success
SaveData
    -> success
redirect
```

The source does not demonstrate a client-visible database transaction spanning both operations.

This creates a potential partial-save scenario:

```text
POHeader saved
PODetails failed
```

or:

```text
POHeader saved
PODetails partially saved
```

A new ERP should save the header and all lines in one database transaction.

Recommended:

```text
BEGIN TRANSACTION
    insert PO header
    insert all PO lines
    validate totals
COMMIT
```

On any error:

```text
ROLLBACK
```

---

# 28. PO Detail Save Relationship

Every detail row carries:

```text
grno
```

which is populated from the generated PO number.

Therefore:

```text
POHeader.grn_no
        |
        +---- PODetails.grn_no
        +---- PODetails.grn_no
        +---- PODetails.grn_no
```

is the parent-child relationship.

There is no evidence in the examined code that `PODetails.grn_no` is a proper SQL foreign key.

The relationship is application-enforced.

---

# 29. PO Detail Sequence

The UI uses:

```text
serial
sl_no / bilsl
```

for line ordering.

The saved database field is:

```text
sl_no
```

Reports and receiving operations use `sl_no` to identify the specific PO line.

This becomes important when receiving quantities are updated:

```sql
where grn_no=@PONO
and sl_no=@SLNO
```

---

# 30. PO View Flow

`PurchaseOrderView.aspx` displays PO records.

The view/report filters by:

```text
From date
To date
Company
Supplier
```

The PO list displays:

```text
SL No
PO No
PO Date
Supplier Name
Incharge Name
Supervisor Name
Salesman Name
Status
```

The source query pattern is:

```sql
select
    ROW_NUMBER() OVER(ORDER BY grn_no ASC) AS slno,
    grn_no,
    entry_date,
    suplier_name,
    incharge,
    agent_name,
    SalesMan,
    CASE
        WHEN POStatus=1 THEN 'Cancel'
        WHEN POStatus=2 THEN 'Edit'
        ELSE 'Active'
    END AS POStatus
from POHeader
where date between @From and @To
```

Optional filters are applied for company and supplier.

---

# 31. PO Status

The source explicitly maps:

```text
POStatus = 0 or other
    -> Active

POStatus = 1
    -> Cancel

POStatus = 2
    -> Edit
```

The exact lifecycle semantics should be verified against all edit paths before migration, but these display meanings are confirmed by the source query.

---

# 32. PO Cancellation

The receiving/view code contains:

```sql
update POHeader
set POStatus='1'
where grn_no=@PONO
```

This is the confirmed cancellation operation.

Important:

```text
POStatus = 1
```

does not physically delete the PO.

It marks the PO as cancelled.

This is preferable to physical deletion for auditability.

---

# 33. Cancelled PO Protection

When a cancelled PO is opened for receiving, the source displays:

```text
This is Cancel PO
```

Therefore the receiving flow recognizes the status and blocks normal processing.

---

# 34. PO Edit

The source contains edit-related JavaScript and a PO edit page:

```text
PurchaseOrderEdit.aspx
PurchaseOrderEditJS/
```

The edit workflow reuses the PO line structure and receiving quantity helpers.

The view can load an existing PO by:

```text
PONO
```

and rebuild the detail grid from `PODetails`.

---

# 35. PO Detail Reload

`PurchaseOrderEntryJS/viewdetails.js` calls:

```text
PurchaseOrderEntry.aspx/headtit
```

and:

```text
PurchaseOrderEntry.aspx/GetAllEmployee
```

The first call retrieves PO header information.

The second call retrieves detail rows.

The returned values include:

```text
Barcode
Design
Code
Pname
Prate
Mtr
Qty
TotalMeter
Brand
Patrn
Size
Color
Style
UnitDetails
```

This confirms that the PO edit/view model is a header-detail document.

---

# 36. PO Header Reload Data

The header reload parser expects values in this sequence:

```text
supplier
salesman
supervisor
incharge
company
grnno
podate
overallqty
overallmtr
```

This directly maps to the PO header view model.

---

# 37. PO Detail Reload Data

The detail reload reads values including:

```text
Slno
Barcode
Design
Code
Pname
Prate
Mtr
Qty
TotalMeter
Brand
Patrn
Size
Color
Style
UnitDetails
```

and reconstructs the editable HTML row.

This is important for migration because the application expects the PO line to be reconstructible from database values.

---

# 38. Purchase Received Entry

The PO receiving page is:

```text
PurchaseReceivedEntry.aspx
```

The purpose is not to create a normal purchase invoice directly.

It retrieves an existing PO and records what was actually received against the order.

---

# 39. Receiving Header Selection

The receiving page supports filters for:

```text
Company
Supplier
From date
To date
```

The PO list is populated from `POHeader`.

The query maps `POStatus` to:

```text
Cancel
Edit
Active
```

---

# 40. Loading a PO for Receipt

The source uses:

```sql
select *
from PODetails P2
left outer join POHeader P1
    on P1.grn_no=P2.grn_no
where P2.grn_no=@PONO
```

This is the explicit PO-to-receiving join.

Relationship:

```text
PONO
  |
  +--> POHeader
  |
  +--> PODetails
```

---

# 41. Receiving Quantity Fields

The receiving UI contains:

```text
RECEIVENTRYQTY
RETURNQTY
RECEIVQTY
```

and additional fields:

```text
RECEIVEDATE
RECEIVREFNO
SHORTQTY
EXCESSQTY
CHECKEDBY
```

These values are stored back on `PODetails`.

---

# 42. Receipt Update SQL

Confirmed source SQL:

```sql
update PODetails
set
    returnqty=@RETURNQTY,
    receivqty=@RECEQTY,
    receivdate=@RECEDATE,
    receivrefno=@RECEREFNO,
    receiventryqty=@RECEENTQTY,
    shortqty=@SHORTQTY,
    excessqty=@EXCESSQTY,
    checkedby=@checkedby
where grn_no=@PONO
and sl_no=@SLNO
```

This is one of the most important PO/receiving rules in the legacy system.

---

# 43. Meaning of Receipt Quantities

The source exposes three separate quantity concepts:

```text
qty
receiventryqty
receivqty
```

and return/variance quantities:

```text
returnqty
shortqty
excessqty
```

A safe migration should not collapse these columns without validating their operational meaning.

A practical interpretation is:

```text
PO Qty          = ordered quantity
Receipt Entry   = quantity entered/declared as received
Received Qty    = accepted/confirmed received quantity
Return Qty      = quantity returned
Short Qty       = quantity received below expected
Excess Qty      = quantity received above expected
```

The exact distinction between `receiventryqty` and `receivqty` is application-specific and should be preserved as separate fields.

---

# 44. PO Receiving Reconciliation

At line level, the core reconciliation is:

```text
Ordered Qty
    |
    +-- Received Qty
    +-- Return Qty
    +-- Short Qty
    +-- Excess Qty
```

However, the legacy system does not expose enough source evidence to assert a single universal mathematical formula between these fields.

Therefore the migration should retain all original values first.

A reporting layer can later derive:

```text
Open Qty
Received Qty
Returned Qty
Short Qty
Excess Qty
```

after business confirmation.

---

# 45. PO Report

`PurchaseOrderEntryReport.aspx` exposes PO line-level reconciliation.

Confirmed columns include:

```text
PO No
Design
Code
Product Name
POQty
ReceEntryQty
ReturnQty
ReceivQty
ShortQty
ExcessQty
Brand
Pattern
Size
Color
Style
```

This makes the report a useful operational document for open/received PO tracking.

---

# 46. PO Report Business View

A user can therefore compare:

```text
POQty
vs
ReceivQty
```

and inspect:

```text
ReturnQty
ShortQty
ExcessQty
```

along with the item attributes.

This means PO reporting is not only header-level; it is product/line-level.

---

# 47. Supplier-Specific PO Attribute Queries

The compiled PO code includes queries such as:

```sql
select pb.brand as brand
from POHeader as br
inner join PODetails as pb
    on pb.grn_no=br.grn_no
where br.suplier_name='...'
```

Equivalent queries exist for:

```text
pattern
size
color
style
```

This indicates that the PO module uses historical supplier PO lines to populate/filter attribute choices.

---

# 48. PO and Supplier

Supplier is a header-level business party:

```text
POHeader.suplier_name
```

The PO detail does not repeat supplier as its primary relationship.

Therefore:

```text
POHeader
   |
   +-- Supplier
   |
   +-- many PODetails
```

is the correct conceptual structure.

---

# 49. PO and Company

Company is stored at header level:

```text
POHeader.cmy_name
```

Product lookup is company-aware:

```text
newproduct.cmy_name
```

Therefore a PO should be scoped to a company.

Recommended new ERP foreign key:

```text
purchase_orders.company_id
```

rather than storing company name text.

---

# 50. PO and Warehouse

The PO client payload includes:

```text
warehouse
```

through:

```text
ComboBox1_TextBox
```

The confirmed `POHeader` insert statement does not contain a `warehouse` column.

Therefore one of the following may be true:

1. Warehouse is persisted by another code path/table.
2. Warehouse is used transiently.
3. The compiled code/database schema contains additional handling not visible in the insert statement.
4. The field is legacy UI state.

This must be checked before migration.

Do not invent a `POHeader.warehouse` mapping solely from the client payload.

---

# 51. PO and Counter/User

The PO page displays:

```text
COUNTER NAME
LOGIN NAME
```

and has:

```text
txtCurrentUserID
```

The current PO header insert does not explicitly include user/counter columns.

Therefore runtime identity and audit context may be managed elsewhere.

A new ERP should explicitly store:

```text
created_by
created_at
updated_by
updated_at
cancelled_by
cancelled_at
```

and, where relevant:

```text
counter_id
branch_id
store_id
```

---

# 52. PO and Salesman

POHeader stores:

```text
SalesMan
```

This is a header-level responsibility/relationship.

It is displayed in the PO list and report.

---

# 53. PO and Agent/Supervisor

POHeader stores:

```text
agent_name
```

The UI labels this area as:

```text
SUPERVISOR
```

and the save payload uses:

```text
head.age
```

Therefore the legacy naming is mixed between agent and supervisor terminology.

New ERP should use a proper employee/agent foreign key.

---

# 54. PO and Incharge

POHeader stores:

```text
incharge
```

This identifies the operational person responsible for the PO.

It should be normalized to an employee/user ID in the new ERP.

---

# 55. PO Dates

The PO contains multiple dates:

```text
invoce_date
entry_date
date
```

These should not be collapsed without understanding their purpose.

Likely concepts include:

```text
Invoice / document date
PO entry date
System/business date
```

The legacy source uses `date` for filtering PO lists.

---

# 56. PO Status Lifecycle

Confirmed display lifecycle:

```text
Active
Edit
Cancel
```

A new ERP should use a proper enum/state model such as:

```text
DRAFT
OPEN
PARTIALLY_RECEIVED
FULLY_RECEIVED
CLOSED
CANCELLED
```

But this is a recommended modernization model, not a statement that the legacy application implements all these states.

---

# 57. PO Receipt State Is Not Fully Normalized

Legacy receiving information is stored directly in `PODetails`.

Example:

```text
PODetails.receivqty
PODetails.receiventryqty
PODetails.returnqty
PODetails.shortqty
PODetails.excessqty
```

This means the system does not have a separate normalized receipt-line history in the examined receiving path.

Consequences:

```text
one current receipt state
```

is easier to represent than:

```text
multiple receipts over time
```

If multiple deliveries can occur against one PO line, a new ERP should use a separate receipt document/receipt-line table.

---

# 58. Recommended PO Receipt Model

Recommended new ERP:

```text
purchase_orders
    |
    +-- purchase_order_lines
            |
            +-- purchase_receipt_lines
                    |
                    +-- purchase_receipts
```

Example:

```text
PO-1001
  |
  +-- Product A Qty 100
        |
        +-- GRN-5001 Qty 40
        +-- GRN-5012 Qty 60
```

This supports partial delivery correctly.

---

# 59. Actual GRN / Purchase Posting

The actual purchase entry flow is separate from the PO receiving page.

The purchase module writes to:

```text
purgrnentry
purentrydetails
```

The source also contains explicit queries joining these tables.

Example:

```sql
select
    t1.cmy_name as [CompanyName],
    t1.suplier_name as [SupplierName]
from purgrnentry as T1
inner join purentrydetails as T2
    on T1.grn_no=t2.grn_no
where t2.barcode=@barcode
```

This is the actual purchase/GRN document relationship.

---

# 60. PO Versus Actual GRN

The two structures are:

### Purchase Order

```text
POHeader
PODetails
```

Key:

```text
POHeader.grn_no
PODetails.grn_no
```

UI label:

```text
PO NO
```

### Actual Purchase / GRN

```text
purgrnentry
purentrydetails
```

Key:

```text
purgrnentry.grn_no
purentrydetails.grn_no
```

UI meaning:

```text
GRN / Purchase document
```

This is a critical migration distinction.

---

# 61. Is There a Confirmed PO -> GRN Foreign Key?

The examined source confirms:

```text
POHeader.grn_no -> PODetails.grn_no
```

and separately:

```text
purgrnentry.grn_no -> purentrydetails.grn_no
```

The examined PO receiving source does **not** show a direct insert/update that writes a PO number into `purgrnentry` as a formal foreign key.

Therefore a direct normalized relationship:

```text
purchase_receipts.po_id
```

is not confirmed in the legacy schema.

This must be treated as a migration gap rather than guessed.

---

# 62. Possible Operational Relationship

Operationally the business flow can still be:

```text
PO
  |
  +--> Supplier receives order
  |
  +--> Goods arrive
  |
  +--> PO receiving verification
  |
  +--> Actual Purchase/GRN entry
  |
  +--> Barcode / stock
```

But the legacy database may connect the documents through:

```text
supplier
product
quantity
business date
reference number
manual user selection
```

rather than a formal PO ID.

This is an area requiring transaction-level reconciliation during migration.

---

# 63. Actual Purchase GRN Header

The actual purchase header contains fields such as:

```text
company
warehouse
supplier
invoice amount
invoice date
payment type
net total
commission
packing charges
other charges
charge total
quantity
incharge
salesman
cross amount
MRP discount
GST 5
GST 12
GST 18
GST 28
```

These are financially stronger than the basic PO header.

---

# 64. Actual Purchase GRN Detail

The actual purchase detail contains:

```text
barcode
product code
product name
purchase rate
meter
quantity
free quantity
MRP
net rate
GST
commission/sales rates
brand
pattern
size
color
style
```

This is the record that feeds the actual inventory/barcode lifecycle.

---

# 65. PO -> Actual Purchase Mapping

A practical migration mapping is:

| PO | Actual Purchase / GRN |
|---|---|
| `POHeader.grn_no` | `purgrnentry.grn_no` only if a business link is confirmed |
| `POHeader.cmy_name` | purchase company |
| `POHeader.suplier_name` | `purgrnentry.suplier_name` |
| `POHeader.SalesMan` | purchase salesman where used |
| `POHeader.agent_name` | purchase agent/supervisor where used |
| `POHeader.incharge` | purchase incharge |
| `PODetails.code` | `purentrydetails.code` |
| `PODetails.pname` | `purentrydetails.pname` |
| `PODetails.qty` | purchase qty |
| `PODetails.fqty` | purchase free qty |
| `PODetails.prate` | purchase rate |
| `PODetails.mrp` | purchase MRP |
| `PODetails.brand` | purchase brand |
| `PODetails.patrn` | purchase pattern |
| `PODetails.size` | purchase size |
| `PODetails.color` | purchase color |
| `PODetails.style` | purchase style |
```

This is a candidate mapping, not proof that every PO becomes a purchase.

---

# 66. Partial PO Receipt

The PO receiving model supports quantities smaller than the original order.

Example:

```text
PO Qty = 100
Receipt Entry Qty = 40
Received Qty = 40
```

The remaining order can conceptually be:

```text
60
```

However, because the legacy source stores receipt quantities directly on the PO line, a full historical receipt ledger is not guaranteed.

A new ERP should support multiple receipts explicitly.

---

# 67. Excess Receipt

The receiving screen contains:

```text
excessqty
```

This allows the system to capture a receipt greater than the ordered quantity.

Example:

```text
PO Qty = 100
Received Qty = 105
Excess Qty = 5
```

Do not automatically convert excess quantity into a new PO line during migration.

Preserve it as a receiving variance.

---

# 68. Short Receipt

The receiving screen contains:

```text
shortqty
```

Example:

```text
PO Qty = 100
Received Qty = 95
Short Qty = 5
```

This should remain separate from supplier return quantity.

---

# 69. Return Against PO

The receiving screen contains:

```text
returnqty
```

This represents a different event from shortage.

Example:

```text
Ordered = 100
Delivered = 100
Accepted = 95
Returned = 5
```

versus:

```text
Ordered = 100
Delivered = 95
Short = 5
```

These are operationally different and must not be merged.

---

# 70. Receipt Reference

The receiving update stores:

```text
receivrefno
```

This should be retained as the external/internal receiving reference.

New ERP recommendation:

```text
receipt_reference_no
```

and, where applicable:

```text
supplier_delivery_note_no
supplier_invoice_no
```

---

# 71. Receipt Date

The receiving update stores:

```text
receivdate
```

This should be separate from:

```text
PO date
invoice date
purchase posting date
```

because the operational receipt date can differ from the document date.

---

# 72. Checked By

The receiving update stores:

```text
checkedby
```

This is an operational control/audit field.

New ERP should preferably store:

```text
checked_by_user_id
checked_at
```

instead of free text only.

---

# 73. PO Product Attributes and Barcode

The PO can contain a `barcode` field in `PODetails`, but this does not mean every PO line is already a finalized inventory barcode.

The actual purchase entry and barcode workflow can generate/assign the barcode used for stock.

Therefore distinguish:

```text
PO barcode/reference
```

from:

```text
final inventory barcode/SKU
```

unless source-level reconciliation proves they are identical for a specific installation.

---

# 74. PO and Product Master

PO product lookup is based on:

```text
newproduct
```

with:

```text
code
name
unit_de
cmy_name
```

Therefore:

```text
Product Master
      |
      +--> Purchase Order line
      |
      +--> Actual Purchase line
      |
      +--> Barcode
      |
      +--> Stock
      |
      +--> Sales
```

The PO does not replace the Product Master.

---

# 75. PO and Product Attributes

The PO line stores snapshots of:

```text
Brand
Pattern
Size
Color
Style
Design
```

These values can be different for two lines with the same Product Code.

Example:

```text
Product Code: 1001

PO line 1:
Brand = A
Color = Red
Size = L

PO line 2:
Brand = A
Color = Blue
Size = L
```

Therefore a new ERP should not make these attributes columns of the Product Master itself.

They belong at variant/SKU/line level depending on the business model.

---

# 76. PO Line as a Commercial Snapshot

A PO line should be treated as a historical commercial snapshot.

It records:

```text
what was ordered
at what rate
with what tax
with what discount
for what attributes
in what quantity
```

Future Product Master changes should not rewrite historical PO values.

---

# 77. PO and Purchase Rate

PO rate:

```text
PODetails.prate
```

Actual purchase rate:

```text
purentrydetails.prate
```

These can differ if supplier billing changes between order and actual receipt.

Therefore migration should not force:

```text
PO rate = GRN rate
```

unless the source records prove it.

---

# 78. PO and MRP

PO line stores:

```text
mrp
```

Actual purchase line also stores MRP.

This is important because supplier may deliver a different MRP from what was expected on the PO.

Therefore MRP should be copied/snapshotted at receipt time rather than treated as a mutable Product Master property.

---

# 79. PO and GST

PO line stores expected GST:

```text
gst_per
gst_amount
```

Actual purchase stores posted GST.

These values may differ due to invoice/tax corrections.

Therefore:

```text
PO GST = expected/commercial order value
GRN GST = actual posted tax
```

should remain conceptually separate.

---

# 80. PO and Bill Status

`PODetails` contains:

```text
billstatus
```

The exact lifecycle semantics require broader source tracing, but it is part of the PO detail schema and must be preserved during migration.

Do not map it blindly to `POStatus` because:

```text
POStatus
```

is header-level while:

```text
billstatus
```

is detail-level.

---

# 81. PO and Unit

PO detail stores:

```text
unit_details
```

Product Master provides:

```text
unit_de
```

The PO line therefore carries a historical unit snapshot.

This is important because unit configuration can change later.

---

# 82. PO and Product Group

PO detail stores:

```text
pro_group_name
```

This is a snapshot of the product grouping used at PO time.

It should not be replaced by the current Product Master group during historical migration.

---

# 83. Original Barcode / Reference

PO detail contains:

```text
orgbar
```

This suggests an original barcode/reference value separate from the current `barcode` field.

Both should be preserved until their exact operational usage is confirmed.

---

# 84. MRP Range Fields

The PO detail schema contains:

```text
FromMRP
ToMRP
```

These fields are not always visible in the active UI and some UI sections are commented out.

Nevertheless, they are part of the database insert and must be migrated if populated.

---

# 85. Total Meter

PO detail stores:

```text
TotalMeter
```

while the row also has:

```text
mtr
qty
```

This means:

```text
TotalMeter
```

should normally reconcile to the quantity/meter calculation.

Recommended migration validation:

```text
expected_total_meter = qty × mtr
```

Compare with stored `TotalMeter` and flag differences rather than silently rewriting them.

---

# 86. PO Reconciliation Checks

For each PO line, migration should validate:

```text
POHeader.grn_no = PODetails.grn_no
PODetails.sl_no is unique within PO
qty >= 0
fqty >= 0
mtr >= 0 where meter-based
TotalMeter matches expected calculation where applicable
```

Also validate:

```text
code exists in newproduct
supplier exists
company exists
attribute values are preserved
```

---

# 87. Header/Detail Total Reconciliation

For every PO:

```text
SUM(PODetails.qty)
```

should be compared with:

```text
POHeader.OverAllQty
```

Likewise:

```text
SUM(PODetails.TotalMeter)
```

should be compared with:

```text
POHeader.OverAllMtr
```

Differences should be reported before migration completion.

---

# 88. PO Number Uniqueness

Recommended new ERP constraint:

```text
UNIQUE(company_id, po_no)
```

Legacy code uses company/counter context in PO number generation, so a global uniqueness rule may not match every installation.

The exact uniqueness scope must be confirmed from live data.

---

# 89. PO Number Generation Risk

The legacy system generates sequential document numbers through application code.

Other modules in the application also use `MAX + 1` patterns for transaction identifiers.

This creates a concurrency risk:

```text
User A -> calculates next number
User B -> calculates same next number
User A -> saves
User B -> attempts same number
```

New ERP should use:

```text
SQL SEQUENCE
identity-backed document number table
or transactional number generator
```

---

# 90. SQL Injection Risk

Some legacy product and PO queries use string concatenation, for example:

```sql
name LIKE ''+@SearchEmpName+'%'
```

The new ERP should use parameterized queries consistently.

---

# 91. PO Save Concurrency

The current client flow disables the Save button after click:

```javascript
$(this).prop('disabled', true)
```

This protects only the browser session.

It does not replace database uniqueness/transaction controls.

New ERP should enforce concurrency at the database layer.

---

# 92. PO Cancellation Safety

Legacy cancellation changes:

```text
POStatus = 1
```

Recommended new ERP behavior:

```text
CANCELLED
```

with:

```text
cancelled_by
cancelled_at
cancel_reason
```

Physical deletion should be avoided once a PO has receiving or purchase references.

---

# 93. PO Edit Safety

If a PO has already been partially or fully received, unrestricted editing can create reconciliation problems.

Recommended new ERP rule:

```text
Draft/Open PO
    -> editable

Partially received PO
    -> restrict quantity/rate changes

Fully received/closed PO
    -> read-only

Cancelled PO
    -> read-only
```

This is a modernization recommendation, not a statement of the legacy behavior.

---

# 94. PO to GRN Control

A new ERP should explicitly record:

```text
purchase_order_id
```

on every purchase receipt/GRN.

This enables:

```text
PO ordered qty
PO received qty
PO pending qty
PO returned qty
PO variance qty
```

without relying on supplier/product/date inference.

---

# 95. Recommended New ERP Purchase Order Tables

```text
purchase_orders
----------------
id
po_no
company_id
branch_id
warehouse_id
supplier_id
salesman_id
agent_id
incharge_id
po_date
expected_date
status
currency_id
subtotal
discount_total
tax_total
charge_total
net_total
total_qty
total_meter
created_by
created_at
updated_by
updated_at
cancelled_by
cancelled_at
cancel_reason
```

---

# 96. Recommended Purchase Order Lines

```text
purchase_order_lines
--------------------
id
purchase_order_id
line_no
product_id
product_code_snapshot
product_name_snapshot
design_id
brand_id
pattern_id
size_id
color_id
style_id
unit_id
ordered_qty
free_qty
meter_per_unit
total_meter
purchase_rate
mrp
net_rate
discount_percent
discount_amount
gst_percent
gst_amount
net_amount
sales_percent
sales_rate
commission_percent
commission_rate
from_mrp
to_mrp
original_barcode
status
created_at
updated_at
```

---

# 97. Recommended Purchase Receipts

```text
purchase_receipts
-----------------
id
grn_no
purchase_order_id
company_id
branch_id
warehouse_id
supplier_id
supplier_invoice_no
supplier_invoice_date
receipt_date
status
subtotal
discount_total
tax_total
charge_total
net_total
created_by
created_at
```

---

# 98. Recommended Purchase Receipt Lines

```text
purchase_receipt_lines
----------------------
id
purchase_receipt_id
purchase_order_line_id
line_no
product_id
barcode_id
brand_id
pattern_id
size_id
color_id
style_id
received_qty
free_qty
meter
purchase_rate
mrp
discount_percent
discount_amount
gst_percent
gst_amount
net_amount
short_qty
excess_qty
return_qty
```

This creates a real PO -> GRN relationship.

---

# 99. Recommended PO Status Calculation

Instead of storing only one ambiguous status, derive the operational state from ordered and received quantities.

Example:

```text
DRAFT
OPEN
PARTIALLY_RECEIVED
FULLY_RECEIVED
CANCELLED
CLOSED
```

Conceptually:

```text
received = 0
    -> OPEN

0 < received < ordered
    -> PARTIALLY_RECEIVED

received >= ordered
    -> FULLY_RECEIVED
```

Return/short/excess should be separate variance dimensions.

---

# 100. End-to-End Legacy Flow

The complete legacy flow can be represented as:

```text
1. User opens Purchase Order Entry
        |
        v
2. Company selected
        |
        v
3. Supplier selected
        |
        v
4. Salesman / Supervisor / Incharge selected
        |
        v
5. PO number generated
        |
        v
6. Product selected from newproduct
        |
        v
7. Design selected
        |
        v
8. Brand / Pattern / Size / Color / Style entered
        |
        v
9. Qty / Free Qty / Meter entered
        |
        v
10. Purchase rate / MRP / discounts / GST calculated
        |
        v
11. Line amount and net amount calculated
        |
        v
12. Overall Qty / Overall Meter calculated
        |
        v
13. Savehead()
        |
        v
14. POHeader inserted
        |
        v
15. SaveData()
        |
        v
16. PODetails rows inserted
        |
        v
17. PO View / Report
        |
        v
18. Supplier delivers goods
        |
        v
19. PurchaseReceivedEntry loads PO
        |
        v
20. User records received / return / short / excess quantities
        |
        v
21. PODetails receipt fields updated
        |
        v
22. Actual Purchase Entry may be posted separately
        |
        v
23. purgrnentry inserted
        |
        v
24. purentrydetails inserted
        |
        v
25. Barcode / SKU processing
        |
        v
26. Stock updated
        |
        v
27. Goods become available for sales/reporting
```

---

# 101. PO to Inventory Flow

```text
                    PRODUCT MASTER
                         |
                         v
                 PURCHASE ORDER
                 POHeader/PODetails
                         |
                         v
                 PO RECEIVING
              PurchaseReceivedEntry
                         |
                         v
                 ACTUAL PURCHASE
                 purgrnentry/details
                         |
                         v
                    BARCODE/SKU
                         |
                         v
                       STOCK
                         |
                         v
                       SALES
```

The important separation is:

```text
PO = intention/order
Receipt = physical receiving verification
GRN/Purchase = posted commercial purchase
Stock = inventory result
```

---

# 102. PO to GRN Migration Decision

During migration, each PO should be classified.

### Case A - PO with no receipt

Migrate:

```text
POHeader
PODetails
```

Do not create a GRN.

---

### Case B - PO with receipt tracking but no actual purchase record

Migrate:

```text
PO
PO receipt state
```

Do not invent an actual GRN.

Flag for business reconciliation if the source indicates goods were physically received.

---

### Case C - PO with actual purchase/GRN

Migrate:

```text
PO
PO receipt state
Actual GRN
Actual GRN lines
```

Link them using a confirmed business relationship where possible.

---

### Case D - Actual GRN without PO

This is a valid legacy possibility because actual purchase entry can operate independently.

Migrate:

```text
GRN
GRN lines
```

with:

```text
purchase_order_id = NULL
```

unless source reconciliation proves a PO relationship.

---

# 103. PO Reconciliation Dataset

For migration, create a temporary reconciliation dataset containing:

```text
company
po_no
po_date
supplier
po_line_no
product_code
product_name
po_qty
po_free_qty
po_meter
po_total_meter
received_entry_qty
received_qty
return_qty
short_qty
excess_qty
actual_grn_no
actual_grn_qty
actual_grn_rate
barcode
```

This allows the legacy PO and actual purchase data to be compared before loading the new ERP.

---

# 104. Recommended PO Reconciliation Rules

Flag:

```text
PO without details
PO details without header
Duplicate PO number within uniqueness scope
Negative quantities
Invalid product code
Invalid company
Invalid supplier
Receipt greater than order without excess value
Return without receipt
Actual GRN with no matching PO when a match is expected
Actual GRN quantity materially different from PO received quantity
```

---

# 105. Header/Detail Integrity

Legacy relationship:

```text
POHeader.grn_no = PODetails.grn_no
```

Recommended database constraint:

```text
FOREIGN KEY (purchase_order_id)
REFERENCES purchase_orders(id)
```

This removes the need for string-based document joins.

---

# 106. Supplier Integrity

Legacy stores supplier names as text.

Recommended:

```text
supplier_id
```

and retain:

```text
supplier_name_snapshot
```

on historical documents if supplier names can change.

---

# 107. Product Integrity

Legacy stores:

```text
code
pname
```

Recommended:

```text
product_id
product_code_snapshot
product_name_snapshot
```

This preserves historical document text while maintaining a proper master relationship.

---

# 108. Attribute Integrity

Legacy stores attribute names directly on PO detail:

```text
brand
patrn
size
color
style
```

Recommended:

```text
brand_id
pattern_id
size_id
color_id
style_id
```

plus optional snapshots:

```text
brand_name_snapshot
pattern_name_snapshot
...
```

---

# 109. Barcode Integrity

Do not assume:

```text
PO barcode = inventory barcode
```

unless verified.

The actual purchase/barcode flow can generate or assign barcodes after purchase entry.

New ERP should explicitly model:

```text
product_variant
barcode
purchase_receipt_line
```

relationships.

---

# 110. PO Audit Trail

Recommended audit events:

```text
PO_CREATED
PO_UPDATED
PO_CANCELLED
PO_RECEIPT_ENTERED
PO_RECEIPT_UPDATED
PO_RECEIPT_CONFIRMED
PO_CLOSED
```

Legacy fields such as:

```text
checkedby
```

should be preserved but strengthened with user/time metadata in the new system.

---

# 111. Financial Snapshot Rule

The following PO values should be immutable historical snapshots after posting/approval:

```text
purchase_rate
MRP
GST rate
GST amount
discount percent
discount amount
net rate
net amount
```

Changing the Product Master must not rewrite old POs.

---

# 112. Inventory Posting Rule

A PO should not automatically increase physical stock.

Recommended:

```text
PO creation
    -> no stock increase

Receipt/GRN posting
    -> stock increase
```

This is a key ERP accounting/inventory control.

---

# 113. Legacy Interpretation

The source architecture supports the following practical interpretation:

```text
POHeader/PODetails
    = ordered commitment

PODetails.receiv*
    = receipt tracking

purgrnentry/purentrydetails
    = actual purchase posting

barcode / stock tables
    = inventory realization
```

This should be the baseline interpretation for migration until live transaction evidence proves otherwise.

---

# 114. Important Legacy Risks

## 114.1 PO/GRN naming collision

Both PO and actual GRN use `grn_no`.

Risk:

```text
wrong joins
wrong migration mapping
wrong reports
```

---

## 114.2 No confirmed PO foreign key in GRN

The examined source does not prove a direct:

```text
purgrnentry -> POHeader
```

foreign key.

Risk:

```text
cannot safely infer which GRN belongs to which PO
```

---

## 114.3 Receipt state stored on PO line

Risk:

```text
multiple receipt history may be lost
```

---

## 114.4 Two-step client save

Risk:

```text
header saved
line save fails
```

---

## 114.5 Text-based master references

Risk:

```text
supplier rename
product rename
attribute rename
```

can affect joins and reporting.

---

## 114.6 No database-level relationship evidence

The source relies heavily on application queries using:

```text
grn_no
sl_no
name
code
supplier name
company name
```

New ERP should use IDs and foreign keys.

---

# 115. Recommended New ERP End-to-End Flow

```text
Create PO
   |
   +-- Header
   |    supplier
   |    company
   |    warehouse
   |    salesman
   |    expected date
   |
   +-- Lines
        product
        variant
        qty
        free qty
        rate
        discount
        GST
        MRP
        attributes
        meter
   |
   v
Approve PO
   |
   v
Open PO
   |
   v
Receive Goods
   |
   +-- create GRN
   |      receipt date
   |      supplier invoice
   |      accepted qty
   |      short/excess
   |
   v
Post GRN
   |
   +-- purchase accounting
   +-- barcode generation/assignment
   +-- stock increase
   |
   v
Close PO when fulfilled
```

---

# 116. Recommended State Machine

```text
DRAFT
  |
  v
OPEN
  |
  +--------------------+
  |                    |
  v                    v
PARTIALLY_RECEIVED   CANCELLED
  |
  v
FULLY_RECEIVED
  |
  v
CLOSED
```

Actual state transitions should be controlled by receipt quantities and authorization rules.

---

# 117. PO and GRN Document Numbering

New ERP should use separate sequences:

```text
PO-2026-000001
GRN-2026-000001
```

Do not reuse the same sequence namespace.

This eliminates the legacy ambiguity between:

```text
POHeader.grn_no
purgrnentry.grn_no
```

---

# 118. Recommended Business Rules

1. PO number must be unique within its company/document scope.
2. PO line must reference a valid product.
3. PO cannot be posted with zero total quantity.
4. Cancelled PO cannot receive goods.
5. Posted GRN must reference the PO when the purchase originated from a PO.
6. One PO can have many GRNs.
7. One GRN can contain many PO lines.
8. Receipt quantities cannot be silently overwritten when historical audit is required.
9. Short/excess/return quantities must remain distinct.
10. PO values should be historical snapshots.
11. Actual stock increases only on GRN/purchase posting.
12. Physical deletion of posted PO/GRN documents should be prohibited.
13. Corrections should use reversal/adjustment documents.

---

# 119. Recommended Relationship Diagram

```text
                    COMPANY
                       |
                       |
                  PURCHASE ORDER
                    POHeader
                       |
             1         |        N
                       |
                  PODetails
                       |
             1         |        N
                       |
              PO RECEIPT LINES
                       |
                       v
                PURCHASE GRN
                purgrnentry
                       |
             1         |        N
                       |
             purentrydetails
                       |
                       v
                    BARCODE
                       |
                       v
                     STOCK
                       |
                       v
                     SALES
```

Legacy caveat:

```text
PO receipt -> actual GRN
```

is a recommended normalized relationship and is not fully confirmed as a physical foreign key in the examined legacy database.

---

# 120. PO / GRN / Stock Boundary

The correct accounting boundary for the new ERP should be:

```text
Purchase Order
    = commitment

Goods Receipt / GRN
    = physical receipt + commercial posting

Stock
    = inventory balance after posting
```

This separation is essential for accurate stock, supplier liability and open-PO reporting.

---

# 121. Open PO Reporting

Recommended calculation:

```text
Ordered Qty
- Received Qty
= Pending Qty
```

subject to explicit treatment of:

```text
returns
shortages
excess
free qty
```

Do not hard-code a formula until the legacy business interpretation is confirmed.

---

# 122. PO Aging

New ERP can calculate:

```text
Today - PO Date
```

and classify:

```text
0-7 days
8-30 days
31-60 days
61-90 days
90+ days
```

This is a reporting enhancement, not a legacy behavior claim.

---

# 123. Supplier Performance

The PO/receipt model enables:

```text
ordered qty
received qty
short qty
excess qty
return qty
on-time receipt
```

and supplier-level reporting.

The legacy source already queries PO lines by supplier and attributes, which provides a basis for these reports.

---

# 124. PO Attribute Reporting

The PO report can analyze:

```text
Supplier
Product
Design
Brand
Pattern
Size
Color
Style
```

combined with:

```text
Ordered Qty
Received Qty
Return Qty
Short Qty
Excess Qty
```

This should become a normalized reporting fact model in the new ERP.

---

# 125. Migration Checklist

## PO Header

- [ ] Extract all `POHeader` rows.
- [ ] Map `grn_no` to new `po_no`.
- [ ] Map supplier.
- [ ] Map company.
- [ ] Map salesman.
- [ ] Map agent/supervisor.
- [ ] Map incharge.
- [ ] Map PO dates.
- [ ] Map status.
- [ ] Map overall quantity.
- [ ] Map overall meter.

## PO Lines

- [ ] Extract all `PODetails` rows.
- [ ] Map PO parent.
- [ ] Preserve `sl_no`.
- [ ] Map product code/name.
- [ ] Map design.
- [ ] Map brand.
- [ ] Map pattern.
- [ ] Map size.
- [ ] Map color.
- [ ] Map style.
- [ ] Map unit.
- [ ] Map quantity.
- [ ] Map free quantity.
- [ ] Map meter.
- [ ] Map total meter.
- [ ] Map rate fields.
- [ ] Map discount fields.
- [ ] Map GST fields.
- [ ] Map MRP fields.
- [ ] Map original barcode.
- [ ] Map bill status.

## Receipt State

- [ ] Preserve `receiventryqty`.
- [ ] Preserve `receivqty`.
- [ ] Preserve `returnqty`.
- [ ] Preserve `shortqty`.
- [ ] Preserve `excessqty`.
- [ ] Preserve `receivdate`.
- [ ] Preserve `receivrefno`.
- [ ] Preserve `checkedby`.

## Actual GRN

- [ ] Extract `purgrnentry`.
- [ ] Extract `purentrydetails`.
- [ ] Reconcile supplier.
- [ ] Reconcile company.
- [ ] Reconcile product.
- [ ] Reconcile quantity.
- [ ] Reconcile barcode.
- [ ] Determine PO relationship where possible.
- [ ] Do not invent PO links.

---

# 126. Final End-to-End Data Flow

```text
                    MASTER DATA
                        |
        +---------------+----------------+
        |               |                |
        v               v                v
     Product         Supplier        Attributes
     Master                           Brand
                                      Pattern
                                      Size
                                      Color
                                      Style
        |               |                |
        +---------------+----------------+
                        |
                        v
                PURCHASE ORDER
                        |
              +---------+---------+
              |                   |
              v                   v
          POHeader            PODetails
              |                   |
              |            product / qty / rate
              |            tax / discount
              |            attributes
              |                   |
              +---------+---------+
                        |
                        v
                PO RECEIVING
                        |
              PurchaseReceivedEntry
                        |
             +----------+----------+
             |          |          |
             v          v          v
          Received    Return    Short/Excess
                        |
                        v
                 ACTUAL PURCHASE
                        |
              +---------+---------+
              |                   |
              v                   v
          purgrnentry       purentrydetails
                                  |
                                  v
                              BARCODE/SKU
                                  |
                                  v
                                STOCK
                                  |
                                  v
                                SALES
                                  |
                                  v
                               REPORTS
```

---

# 127. Confirmed Source Facts

The following are directly confirmed by source inspection:

1. `PurchaseOrderEntry.aspx` is the main PO entry page.
2. `POHeader` is the PO header table.
3. `PODetails` is the PO detail table.
4. `POHeader.grn_no` is displayed as PO number in PO screens.
5. `PODetails.grn_no` links detail rows to the PO header.
6. `POHeader` stores supplier, salesman, agent, incharge, company, dates, status, overall quantity and overall meter.
7. `PODetails` stores product, quantity, rate, discount, GST, MRP and textile attributes.
8. `PurchaseReceivedEntry.aspx` loads POHeader/PODetails by PO number.
9. Receiving updates `PODetails` with receipt, return, short and excess quantities.
10. PO cancellation updates `POHeader.POStatus` to `1`.
11. `POStatus=1` is displayed as Cancel.
12. `POStatus=2` is displayed as Edit.
13. `purgrnentry` and `purentrydetails` are separate actual purchase/GRN tables.
14. The examined PO receiving code does not prove a direct PO foreign key in `purgrnentry`.
15. Product attributes Brand/Pattern/Size/Color/Style are stored in PO detail.
16. Product Master lookup uses `newproduct`.
17. The PO calculation code calculates total meter from meter and quantity.
18. The PO save flow calls `Savehead` and then `SaveData`.

---

# 128. Items Requiring Live-Database Confirmation

The following should be verified against the live database before migration finalization:

1. Exact data types and nullability of all PO columns.
2. Primary keys of `POHeader` and `PODetails`.
3. Whether a database FK exists between POHeader and PODetails.
4. Exact meaning of `POStatus=2`.
5. Exact meaning of `receiventryqty` versus `receivqty`.
6. Whether `warehouse` is persisted elsewhere for PO.
7. Whether any additional PO header columns are populated by compiled server code.
8. Whether `billstatus` drives downstream processing.
9. Whether PO barcodes are temporary references or final barcodes.
10. Whether actual GRNs are manually linked to PO numbers in business practice.
11. Whether multiple receipts against one PO line are possible in live operations.
12. Whether `OverAllQty` includes free quantity.
13. Whether `OverAllMtr` includes free quantity.
14. Exact tax calculation order in every purchase variant.
15. Whether PO cancellation is reversible.

---

# 129. Final Conclusion

TextileSoft implements Purchase Order and actual Purchase/GRN as related but distinct document concepts.

The PO layer is:

```text
POHeader + PODetails
```

The PO receipt-tracking layer is implemented by updating receipt/variance fields directly on `PODetails`.

The actual posted purchase/GRN layer is:

```text
purgrnentry + purentrydetails
```

The most important legacy characteristic is the reuse of:

```text
grn_no
```

for the identifier of both PO and actual GRN structures. In the PO module, the UI clearly calls this value `PO NO`, so migration must rename it conceptually to `po_no`.

The recommended new ERP architecture is therefore:

```text
Product Master
      |
      v
Purchase Order
      |
      +--> Purchase Order Lines
      |
      v
Purchase Receipt / GRN
      |
      +--> Purchase Receipt Lines
      |
      v
Barcode / SKU
      |
      v
Stock
      |
      v
Sales
```

The strongest migration rule is:

> **Do not assume every Purchase Order becomes a GRN, and do not assume every GRN came from a Purchase Order. Establish the relationship from source evidence and preserve unmatched documents independently.**

This keeps the migrated ERP factually faithful to the legacy data while providing a normalized PO-to-GRN relationship for future transactions.
