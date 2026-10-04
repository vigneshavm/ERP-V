# 05 - Purchase / GRN Entry - End-to-End Flow

## 1. Purpose

This document traces the TextileSoft purchase process from purchase-entry UI through database persistence and downstream inventory usage.

The primary purchase flow is implemented around two core SQL Server tables:

```text
purgrnentry
    |
    | 1 : many by grn_no
    v
purentrydetails
```

`purgrnentry` stores the purchase/GRN header and invoice-level commercial information. `purentrydetails` stores the purchased product lines, including product identity, barcode, quantity, purchase rate, tax, selling rates, and textile/item attributes.

The purchase transaction then becomes the source for:

```text
Purchase / GRN
      |
      +--> Product / Product Master lookup
      |
      +--> Barcode / SKU identity
      |
      +--> Stock
      |
      +--> Sales lookup
      |
      +--> Purchase reports
      |
      +--> Purchase returns
      |
      +--> Rate changes / barcode operations
      |
      +--> Supplier and purchase analysis
```

---

## 2. Source Scope Traced

The primary source implementation examined is the standard purchase-entry flow and its related variants.

### Main pages

```text
NewPurchaseentry.aspx
NewPurchaseentryAdd.aspx
NewPurchaseUpdate.aspx
NewPurchaseentryView.aspx
```

### Main compiled assemblies

The standard pages point to compiled ASP.NET Web Forms assemblies, including:

```text
NewPurchaseentry.aspx
    inherits="NewPurchaseentry, App_Web_nalpgtdn"

NewPurchaseentryAdd.aspx
    inherits="NewPurchaseentryAdd, App_Web_233xmhxc"

NewPurchaseUpdate.aspx
    inherits="NewPurchaseUpdate, App_Web_k4gmbnkg"

NewPurchaseentryView.aspx
    inherits="NewPurchaseentryView, App_Web_2rhddzjw"
```

The archive also contains multiple customized/duplicated purchase implementations under `CustomizeEntry` and several purchase-entry variants.

### Main client-side JavaScript

```text
NewPurchaseentryJS/Calc.js
NewPurchaseentryJS/Calc-min.js
NewPurchaseentryJS/calculation.js
NewPurchaseentryJS/update.js
NewPurchaseentryJS/grn.js
NewPurchaseentryJS/arrow-table.js
```

The standard page uses `Calc.js` and related JavaScript for interactive purchase calculations before the values are persisted by the server-side compiled code.

---

## 3. Purchase Module Family

The archive contains more than one purchase-entry screen because TextileSoft supports different business flows.

Important examples include:

```text
NewPurchaseentry.aspx
GSTNewPurchaseEntry.aspx
AllGSTPurchaseEntry.aspx
AllGSTNewPurchaseEntry.aspx
GSTSmallPurchaseEntry.aspx
SmallPurchaseEntry.aspx
FancyPurchaseEntry.aspx
WRPurchaseEntry.aspx
WRPurchaseEntryNew.aspx
NewWithoutDiscountPurchaseEntry1.aspx
NewWithoutDiscountPurchaseEntry2.aspx
NewPurchaseDiscountEntry1.aspx
NewPurchaseDiscountEntry2.aspx
NewPurchaseDiscountWSREntry2.aspx
DepartmentalPurchaseEntry.aspx
ApplianceCategoryPurchaseEntry.aspx
GiftNewPurchaseDiscountSchemaEntry2.aspx
```

These variants share the same conceptual purchase architecture but may use different header/detail tables or additional columns.

For the standard textile purchase flow, the principal tables are:

```text
purgrnentry
purentrydetails
```

---

# 4. Business Meaning of a Purchase Transaction

A purchase transaction represents stock received from a supplier into a company/warehouse.

At a high level:

```text
Supplier Invoice
      |
      v
Purchase Entry
      |
      +--> GRN number
      +--> Company
      +--> Warehouse
      +--> Supplier
      +--> Agent
      +--> Incharge
      +--> Invoice number/date
      +--> Purchase totals
      +--> Tax / discount / charges
      |
      v
Purchase Lines
      |
      +--> Product Code
      +--> Product Name
      +--> Barcode
      +--> Design
      +--> Brand
      +--> Pattern
      +--> Size
      +--> Color
      +--> Style
      +--> Model
      +--> Fashion
      +--> Rack
      +--> Quantity
      +--> Meter
      +--> Purchase Rate
      +--> MRP
      +--> GST
      +--> Net Amount
      |
      v
Stock becomes available
```

The purchase header identifies the commercial transaction. The detail rows identify the actual inventory received.

---

# 5. Header and Detail Data Model

## 5.1 Header

Primary table:

```text
purgrnentry
```

Logical role:

```text
One GRN / purchase invoice
        |
        +-- supplier
        +-- company
        +-- warehouse
        +-- invoice
        +-- totals
        +-- tax
        +-- charges
        +-- payment information
        +-- purchase metadata
```

## 5.2 Detail

Primary table:

```text
purentrydetails
```

Logical role:

```text
One purchased inventory line / barcode-level record
```

The relationship is principally:

```text
purgrnentry.grn_no
          |
          +------< purentrydetails.grn_no
```

This is the main purchase relationship used throughout the application.

---

# 6. Purchase Header UI

The main `NewPurchaseentry.aspx` screen exposes the following major areas.

## 6.1 Context

The screen displays purchase-entry context such as:

- Counter
- Login/user
- Date
- Time in some variants

The page title is:

```text
PURCHASE ENTRY
```

## 6.2 Location and ownership

Header fields include:

```text
WAREHOUSE NAME
COMPANY
SUPPLIER NAME
AGENT NAME
INCHARGE
```

The corresponding source lookups include:

```sql
SELECT cmy_name_eng FROM companydetail

SELECT ware_name_eng FROM warehousedetail

SELECT sup_name FROM supplierdetail

SELECT eng_name FROM agentdetail
```

Supplier city is also retrieved from `supplierdetail` in the purchase flow:

```sql
select city
from supplierdetail
where sup_name = @SupplierName
```

This is later persisted as `Supplier_City` in purchase-header variants.

---

# 7. GRN Number

The header contains a GRN number field.

UI labels include:

```text
GRN No
```

The GRN number is the principal transaction key connecting the header and detail rows.

Example relationship:

```text
GRN 2025/001
      |
      +--> purgrnentry row
      |
      +--> purentrydetails row 1
      +--> purentrydetails row 2
      +--> purentrydetails row 3
```

The code also validates that the GRN exists or has not unexpectedly changed during save/update operations.

A source message is:

```text
GRN No Changed, Please Click Save button again...!
```

The code checks the database using:

```sql
select grn_no
from purgrnentry
where grn_no = @grn_no
```

---

# 8. GRN Number Generation

The archive contains legacy GRN-number generation logic based on the existing maximum GRN number for a company.

A representative query is:

```sql
, 10) as int))+1 as grn
from purgrnentry
where cmy_name = @company
```

The exact prefix/format varies by implementation and customization. The important architectural finding is that the legacy implementation derives the next GRN number from existing rows.

This is a concurrency risk if multiple purchase-entry users save at the same time.

### Recommended new ERP approach

Use a database sequence or transaction-safe number generator:

```text
Company
   |
   +--> GRN Number Sequence
              |
              +--> next number allocated atomically
```

Do not use:

```sql
MAX(existing_number) + 1
```

for a concurrent ERP.

---

# 9. Invoice Information

The purchase header contains:

```text
INVOCE
INVOICE DATE
ENTRY DATE
```

The database columns are:

```text
invoce_amount
invoce_date
entry_date
```

The spelling `invoce` is part of the legacy schema and should be preserved during migration mapping rather than silently changing meaning.

A purchase may therefore have:

```text
GRN No       = internal ERP receiving identifier
Invoice No   = supplier invoice identifier
Invoice Date = supplier invoice date
Entry Date   = ERP entry/accounting date
```

These dates must not be treated as automatically identical.

---

# 10. Header Financial Inputs

The main screen contains fields related to:

```text
PNET TOTAL
AGENT COMM%
CHARGES
EXP CHARGES
PEXP%
BDIS %
GST %
IGST%
SALES %
MRP%
```

The exact visible layout differs between purchase variants, but the persisted model includes commercial calculations such as:

```text
purchase net amount
agent commission
packing charges
other charges
bill discount
GST
IGST
cross amount
MRP discount
additional charges
```

---

# 11. Purchase Header Database Fields

The standard/extended purchase-header insert found in the compiled source is:

```sql
insert into purgrnentry(
    tot_less,
    less,
    totnetamot,
    cmy_name,
    warehouse,
    suplier_name,
    agent_name,
    grn_no,
    invoce_amount,
    invoce_date,
    entry_date,
    pay_type,
    pnet_tot,
    com_per,
    com_amount,
    pack_char,
    pack_charless,
    oter_char,
    char_tot,
    tot_qut,
    char_qut_amou,
    bdis_in,
    gst_in,
    igst_in,
    incharge,
    brand,
    sales,
    cross_amount,
    date,
    gst5,
    gst12,
    gst18,
    gst28,
    mrpdisperh,
    AddchargeAmt,
    AddchargePer,
    AddcharegeGST,
    AddchargeWOGST,
    IGSTAmt,
    Supplier_City,
    CTotal,
    CQty,
    CMtr,
    CGst
)
values(
    @tot_less,
    @less,
    @totnetamot,
    @cmy_name,
    @warehouse,
    @suplier_name,
    @agent_name,
    @grn_no,
    @invoce_amount,
    @invoce_date,
    @entry_date,
    @pay_type,
    @pnet_tot,
    @com_per,
    @com_amount,
    @pack_char,
    @pack_charless,
    @oter_char,
    @char_tot,
    @tot_qut,
    @char_qut_amou,
    @bdis_in,
    @gst_in,
    @igst_in,
    @incharge,
    @brand,
    @sales,
    @cross_amount,
    @date,
    @gst5,
    @gst12,
    @gst18,
    @gst28,
    @mrpdisperh,
    @AddchargeAmt,
    @AddchargePer,
    @AddcharegeGST,
    @AddchargeWOGST,
    @IGSTAmt,
    @Supplier_City,
    @CTotal,
    @CQty,
    @CMtr,
    @CGst
)
```

This confirms that the purchase header is more than a simple supplier/invoice table. It contains both operational and calculated commercial totals.

---

# 12. Meaning of Important Header Columns

| Column | Meaning inferred from source usage |
|---|---|
| `grn_no` | Purchase/GRN transaction identifier |
| `cmy_name` | Company |
| `warehouse` | Receiving warehouse |
| `suplier_name` | Supplier |
| `agent_name` | Agent |
| `incharge` | Purchase in-charge/user responsibility |
| `invoce_amount` | Invoice amount |
| `invoce_date` | Supplier invoice date |
| `entry_date` | ERP entry date |
| `date` | Transaction/business date used by multiple reports |
| `pay_type` | Payment type |
| `pnet_tot` | Purchase net total |
| `tot_qut` | Total quantity |
| `CQty` | Calculated/summary quantity |
| `CMtr` | Calculated/summary meter |
| `tot_less` | Total less amount |
| `less` | Less value |
| `totnetamot` | Total net amount |
| `bdis_in` | Bill discount input/value |
| `gst_in` | GST input/value |
| `igst_in` | IGST input/value |
| `gst5` | GST 5% total bucket |
| `gst12` | GST 12% total bucket |
| `gst18` | GST 18% total bucket |
| `gst28` | GST 28% total bucket |
| `IGSTAmt` | IGST amount |
| `com_per` | Commission percentage |
| `com_amount` | Commission amount |
| `pack_char` | Packing charge |
| `pack_charless` | Packing-charge less/adjustment in variants |
| `oter_char` | Other charge |
| `char_tot` | Total charges |
| `char_qut_amou` | Charge-related quantity/amount field |
| `cross_amount` | Cross/derived purchase amount |
| `mrpdisperh` | Header-level MRP discount percentage |
| `AddchargeAmt` | Additional charge amount |
| `AddchargePer` | Additional charge percentage |
| `AddcharegeGST` | GST on additional charge |
| `AddchargeWOGST` | Additional charge without GST |
| `Supplier_City` | Supplier city snapshot |
| `CTotal` | Calculated total |
| `CGst` | Calculated GST |
| `PreDisamt` | Pre-discount amount |
| `brand` | Header-level brand field in some implementations |
| `sales` | Sales percentage/value used by variant logic |
| `ViewStatus` | Purchase view/workflow status in some variants |
| `billstatus` | Bill status in some variants |

Not every deployment/variant populates every column.

---

# 13. Purchase Detail Grid

The purchase-entry grid contains the actual inventory lines.

The standard screen exposes columns such as:

```text
SNO
BNO
HSN CODE
CODE
PRODUCT NAME
PRATE
MTR
QTY
FQTY
AMOUNT
PLESS
PLAMT
DIS%
DSAMT
GST%
GSAMT
PNRATE
NETAMT
SR%
MRP
MRPDISRATE
SRATE
CR%
CRATE
DESIGN
BRAND
PATRN
SIZE
COLOR
STYLE
RACK NO
MODEL NO
FASHION NAME
```

This is the most important part of the purchase flow because it converts a supplier invoice into inventory records.

---

# 14. Detail Record Identity

The primary identifiers used by the purchase detail are:

```text
grn_no
sl_no
barcode
code
```

Conceptually:

```text
GRN
 |
 +-- Line 1
 |     +-- Product Code
 |     +-- Barcode
 |
 +-- Line 2
 |     +-- Product Code
 |     +-- Barcode
 |
 +-- Line N
```

The `barcode` is particularly important because later stock and sales workflows use it as the item-level lookup key.

---

# 15. Exact Purchase Detail Insert

The standard compiled source contains the following detail insert pattern:

```sql
insert into purentrydetails(
    entry_date,
    pratecode,
    grn_no,
    sl_no,
    barcode,
    design,
    hsncode,
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
    rackno,
    model,
    fashion,
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
    billstatus
)
values(
    @entry_date,
    @pratecode,
    @grn_no,
    @sl_no,
    @barcode,
    @design,
    @hsncode,
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
    @rackno,
    @model,
    @fashion,
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
    @billstatus
)
```

Other source variants add fields such as:

```text
UpdatedOn
barLen
oldbarcode
silver
 gold
diamond
IMEI_1
IMEI_2
smpper
```

Therefore the purchase-detail schema is not identical across all specialized modules.

---

# 16. Purchase Detail Field Model

| Column | Business role |
|---|---|
| `entry_date` | ERP entry date |
| `pratecode` | Purchase-rate code/reference |
| `grn_no` | Parent purchase/GRN |
| `sl_no` | Line sequence within GRN |
| `barcode` | Item/barcode identity |
| `design` | Design number/name |
| `hsncode` | HSN snapshot at purchase |
| `code` | Product code |
| `pname` | Product name snapshot |
| `prate` | Purchase rate |
| `mtr` | Meter/unit conversion or per-unit meter value |
| `qty` | Purchased quantity |
| `amount` | Gross line amount |
| `dis_per` | Line discount percentage |
| `dis_amount` | Line discount amount |
| `gst_per` | GST percentage |
| `gst_amount` | GST amount |
| `nrate` | Net/normalized rate used downstream |
| `net_amount` | Net line amount |
| `sr_per` | Selling-rate markup percentage |
| `mrp` | MRP |
| `sr_rate` | Selling rate |
| `cr_per` | Commission percentage |
| `cr_rate` | Commission rate |
| `brand` | Brand attribute |
| `patrn` | Pattern attribute |
| `size` | Size attribute |
| `color` | Color attribute |
| `rackno` | Rack/location |
| `model` | Model number |
| `fashion` | Fashion classification |
| `style` | Style attribute |
| `fqty` | Free quantity |
| `date` | Transaction/business date |
| `pro_group_name` | Product group snapshot |
| `unit_details` | Unit snapshot |
| `orgbar` | Original barcode/reference |
| `pless` | Purchase less value |
| `plamt` | Purchase-less adjusted amount |
| `mrpdisper` | MRP discount percentage |
| `mrpdisamt` | MRP discount amount |
| `billstatus` | Bill/workflow status |
| `UpdatedOn` | Modification timestamp in updated variants |
| `barLen` | Barcode length/configuration in some variants |
| `oldbarcode` | Previous barcode in some modules |

---

# 17. Product Lookup During Purchase

The purchase grid is not an independent product-entry system. It uses Product Master data.

The product identity is principally:

```text
Product Code
Product Name
Unit
HSN
```

The purchase detail then adds transaction-specific information:

```text
Barcode
Purchase Rate
Quantity
MRP
Brand
Pattern
Size
Color
Style
Rack
Model
Fashion
```

This means:

```text
Product Master
       |
       +--> code
       +--> name
       +--> unit
       +--> HSN
       |
       v
Purchase Entry
       |
       +--> purchase-specific attributes
       +--> barcode
       +--> price
       +--> quantity
```

The detailed Product Master relationship is documented separately in `03_product_item_master.md` and `04_product_attributes.md`.

---

# 18. Product Name and Supplier Attribute History

The purchase source contains queries that retrieve previously used attributes from purchase history.

Examples:

```sql
select pb.design as design
from purgrnentry as br
inner join purentrydetails as pb
    on pb.grn_no = br.grn_no
where br.suplier_name = ...
```

Equivalent lookups exist for:

```text
model
fashion
brand
patrn
size
color
style
```

This means purchase entry is both:

1. a transaction-entry screen, and
2. a historical source for attribute suggestions/autocomplete.

That is an important legacy behavior for the new ERP migration.

---

# 19. Supplier Lookup

Supplier master table:

```text
supplierdetail
```

Representative queries include:

```sql
SELECT sup_name
FROM supplierdetail
```

and autocomplete/search patterns such as:

```sql
select ref_code, sup_name
from supplierdetail
where sup_name LIKE '%' + @empName + '%'
```

The purchase transaction stores the supplier name as a snapshot in:

```text
purgrnentry.suplier_name
```

This is a legacy denormalized relationship.

### Recommended new ERP

Use:

```text
purchase.supplier_id -> supplier.id
```

while retaining supplier name as a historical display snapshot only if required for audit.

---

# 20. Company Lookup

Company comes from:

```text
companydetail
```

Representative lookup:

```sql
SELECT cmy_name_eng
FROM companydetail
```

The purchase header stores:

```text
purgrnentry.cmy_name
```

Company is important because product codes and stock may be company-specific in the legacy system.

---

# 21. Warehouse Lookup

Warehouse comes from:

```text
warehousedetail
```

Representative query:

```sql
SELECT ware_name_eng
FROM warehousedetail
```

The purchase header stores:

```text
purgrnentry.warehouse
```

This is the receiving location for the purchase.

Recommended new ERP relationship:

```text
Company
   |
   +--> Warehouse / Store
           |
           +--> Purchase Receipt
```

---

# 22. Agent and Incharge

Agent is sourced from:

```text
agentdetail
```

Representative query:

```sql
SELECT eng_name
FROM agentdetail
```

The purchase header stores:

```text
agent_name
incharge
```

These fields represent commercial/operational responsibility rather than inventory identity.

---

# 23. Purchase Entry Calculation Flow

The client-side `Calc.js` performs important calculations as the user enters values.

The source contains logic for:

```text
Purchase Rate
Quantity
Meter
Free Quantity
Purchase Less
Discount
GST
Net Amount
MRP
Selling Rate
Commission
MRP Discount
```

The basic calculation chain is:

```text
PRATE
  x
QTY
  x
MTR
  |
  v
Gross Amount
  |
  +--> LESS
  |
  v
Purchase Less Amount
  |
  +--> Discount
  |
  v
Taxable Amount
  |
  +--> GST
  |
  v
Net Amount
```

---

# 24. Exact Calculation Logic Observed

The client JavaScript contains logic equivalent to:

```text
amt = prate * prqty * mtr
```

Then:

```text
plamt = amt - pless
```

Discount:

```text
dis_amt = plamt * (dis_per / 100)
```

GST:

```text
gst_amt = (plamt - dis_amt) * (gst_per / 100)
```

Net amount:

```text
net_amt = plamt - dis_amt + gst_amt
```

The source also handles free quantity:

```text
fqty
```

and calculates normalized purchase/selling rates accordingly.

---

# 25. Free Quantity

`fqty` is stored separately from `qty`.

Example concept:

```text
Purchased Qty = 100
Free Qty      = 5

qty  = 100
fqty = 5
```

The source calculation logic adjusts effective purchase-rate calculations when `fqty != 0`.

This distinction must be preserved in migration.

Do not simply replace:

```text
qty = qty + fqty
```

because the application uses free quantity in pricing calculations as a separate commercial dimension.

---

# 26. Meter Calculation

The source uses:

```text
mtr
qty
```

and calculates total meter-like values as:

```text
mtr * qty
```

The view query explicitly contains:

```sql
((ISNULL(CONVERT(float, mtr),0)) *
 (ISNULL(CONVERT(float, qty),0))) AS ViewTotMtr
```

Therefore textile purchases must not be modeled as quantity-only inventory.

A line can represent:

```text
Quantity
x
Meter per unit
=
Total meters
```

---

# 27. MRP Calculation

The JavaScript contains two-way MRP/selling-percentage calculations.

If `sr_per` is entered:

```text
mrp = ((sr_per + 100) / 100) * purchase_rate
```

The code validates that MRP does not fall below purchase rate.

If MRP is entered:

```text
sr_per = ((mrp * 100) / purchase_rate) - 100
```

Therefore `sr_per` and `mrp` are related, but they are not the same field.

---

# 28. MRP Discount Calculation

The purchase-entry JavaScript also calculates:

```text
mrpdisper
mrpdisamt
```

From the source:

```text
mrpdisamt = mrp * (1 - (mrpdisper / 100))
```

The reverse calculation is:

```text
mrpdisper = 100 - ((mrpdisamt / mrp) * 100)
```

The code prevents an MRP discount rate/value from producing an amount below the purchase rate.

---

# 29. Selling Rate

The purchase line contains:

```text
sr_per
sr_rate
```

The source derives selling rate from MRP and GST in part of the calculation flow.

This means the purchase record is not only a cost record. It can establish the initial retail selling-price basis for the purchased item.

---

# 30. Commission Calculation

Purchase details contain:

```text
cr_per
cr_rate
```

The header contains:

```text
com_per
com_amount
```

These represent different levels of commercial calculation:

```text
Header commission
        |
        +--> com_per
        +--> com_amount

Line commission
        |
        +--> cr_per
        +--> cr_rate
```

Migration must not merge these without tracing each downstream use.

---

# 31. Purchase Less

Line-level fields:

```text
pless
plamt
```

The source calculation is:

```text
amount = prate * qty * mtr
plamt  = amount - pless
```

This represents a purchase-level reduction before later discount/tax calculations.

---

# 32. GST and IGST

Purchase header fields include:

```text
gst_in
igst_in
gst5
gst12
gst18
gst28
IGSTAmt
```

Purchase detail fields include:

```text
gst_per
gst_amount
```

The application therefore stores both:

```text
Line-level tax
Header-level tax totals
```

This is intentional denormalization for reporting/printing and should be understood during migration.

---

# 33. Header GST Buckets

The purchase header maintains separate totals for:

```text
GST 5%
GST 12%
GST 18%
GST 28%
```

as:

```text
gst5
gst12
gst18
gst28
```

and also stores:

```text
IGSTAmt
```

The new ERP should preferably calculate these from tax lines and use materialized totals only where performance/reporting requires them.

---

# 34. Purchase Save Flow

The logical save sequence is:

```text
1. User opens Purchase Entry
        |
2. Select Company
        |
3. Select Warehouse
        |
4. Select Supplier
        |
5. Select Agent / Incharge
        |
6. Enter GRN / Invoice information
        |
7. Add product lines
        |
8. Select product
        |
9. Enter barcode / line information
        |
10. Enter quantity/meter/rate
        |
11. Enter attributes
        |
12. Calculate discount/GST/net amount
        |
13. Validate purchase
        |
14. Save purgrnentry header
        |
15. Save purentrydetails rows
        |
16. Refresh/read saved GRN
        |
17. Make stock/barcode data available to downstream modules
```

The exact transaction wrapper is not proven from the compiled legacy source. Therefore a new implementation should explicitly use a database transaction across header and details.

---

# 35. Header-First vs Detail-First

The SQL source demonstrates both header and detail persistence but does not provide enough evidence to claim that every purchase variant uses one universal database transaction.

The logical integrity requirement should be:

```text
BEGIN TRANSACTION

    Insert purchase header

    Insert all purchase details

    Validate totals

    Commit

ROLLBACK on any failure
```

This is important because an orphan header or orphan detail creates an invalid purchase.

---

# 36. Purchase Validation

The source contains validation messages including:

```text
Please Enter MRP..
Please Enter Invoice No..
Empty Purchase not allowed. Please Enter Data...
Please Enter Correct GRN NO...
GRN No Changed, Please Click Save button again...!
```

The validation behavior indicates that at least the following are required in relevant standard flows:

```text
Invoice number
At least one purchase line
MRP
Valid GRN
```

Other fields may be required depending on the purchase variant/configuration.

---

# 37. Empty Purchase Protection

The source explicitly blocks an empty purchase:

```text
Empty Purchase not allowed. Please Enter Data...
```

Therefore the new ERP should reject:

```text
Purchase Header
        |
        +--> zero purchase lines
```

A purchase cannot be considered complete without at least one valid detail line.

---

# 38. MRP Validation

The source explicitly reports:

```text
Please Enter MRP..
```

The JavaScript also prevents invalid MRP relationships, including an MRP below purchase rate in the relevant pricing flow.

Recommended new ERP validation:

```text
MRP >= Purchase Rate
```

unless a business rule explicitly allows a special exception.

---

# 39. Invoice Validation

The source contains:

```text
Please Enter Invoice No..
```

Therefore supplier invoice number should be treated as a required purchase document reference for the standard flow.

Recommended new ERP:

```text
supplier_id
invoice_number
invoice_date
```

should be mandatory for normal purchase receipts.

---

# 40. Purchase Detail Search by GRN

The purchase entry and view modules load details by:

```sql
select ...
from purentrydetails
where grn_no = @grn_no
```

The view projection includes fields such as:

```text
sl_no
hsncode
code
pname
prate
mtr
qty
amount
pless
plamt
dis_per
dis_amount
gst_per
gst_amount
nrate
net_amount
sr_per
mrp
sr_rate
cr_per
cr_rate
brand
patrn
size
color
rackno
model
fashion
style
fqty
mrpdisper
mrpdisamt
unit_details
STATUS
```

This confirms that a saved GRN is reconstructed from detail rows rather than a separate SKU table.

---

# 41. Purchase Header Search by GRN

The application reads the header with:

```sql
select *
from purgrnentry
where grn_no = @grn_no
```

Other views convert the invoice date for display:

```sql
SELECT *,
       CONVERT(VARCHAR, invoce_date, 103) AS inv_date
FROM purgrnentry
WHERE grn_no = ...
```

---

# 42. Purchase Update Flow

The update path modifies the purchase header and detail rows.

Header update example:

```sql
update purgrnentry
set
    warehouse=@warehouse,
    suplier_name=@suplier_name,
    agent_name=@agent_name,
    incharge=@incharge,
    cmy_name=@cmy_name,
    invoce_amount=@invoce_amount,
    invoce_date=@invoce_date,
    entry_date=@entry_date,
    date=@date,
    CQty=@CQty,
    CMtr=@CMtr,
    ViewStatus=@ViewStatus,
    tot_less=@tot_less,
    less=@less,
    totnetamot=@totnetamot,
    pay_type=@pay_type,
    pnet_tot=@pnet_tot,
    tot_qut=@tot_qut,
    bdis_in=@bdis_in,
    gst_in=@gst_in,
    igst_in=@igst_in,
    brand=@brand,
    sales=@sales,
    cross_amount=@cross_amount,
    gst5=@gst5,
    gst12=@gst12,
    gst18=@gst18,
    gst28=@gst28,
    mrpdisperh=@mrpdisperh,
    AddchargeAmt=@AddchargeAmt,
    AddchargePer=@AddchargePer,
    AddcharegeGST=@AddcharegeGST,
    AddchargeWOGST=@AddchargeWOGST,
    IGSTAmt=@IGSTAmt,
    Supplier_City=@Supplier_City,
    CTotal=@CTotal,
    CGst=@CGst,
    PreDisamt=@PreDisamt
where grn_no=@grn_no
```

---

# 43. Purchase Detail Update

A standard detail update is:

```sql
update purentrydetails
set
    entry_date=@entry_date,
    pratecode=@pratecode,
    grn_no=@grn_no,
    sl_no=@sl_no,
    design=@design,
    hsncode=@hsncode,
    code=@code,
    pname=@pname,
    prate=@prate,
    mtr=@mtr,
    qty=@qty,
    amount=@amount,
    dis_per=@dis_per,
    dis_amount=@dis_amount,
    gst_per=@gst_per,
    gst_amount=@gst_amount,
    nrate=@nrate,
    net_amount=@net_amount,
    sr_per=@sr_per,
    mrp=@mrp,
    sr_rate=@sr_rate,
    cr_per=@cr_per,
    cr_rate=@cr_rate,
    brand=@brand,
    patrn=@patrn,
    size=@size,
    color=@color,
    rackno=@rackno,
    model=@model,
    fashion=@fashion,
    style=@style,
    fqty=@fqty,
    date=@date,
    pro_group_name=@pro_group_name,
    unit_details=@unit_details,
    pless=@pless,
    plamt=@plamt,
    mrpdisper=@mrpdisper,
    mrpdisamt=@mrpdisamt
where barcode=@barcode
```

Other variants additionally constrain by the current GRN:

```sql
where barcode=@barcodecurrent
  and grn_no=@grn_nocurrent
```

The second pattern is safer because barcode alone may not be a sufficient business context during a historical edit.

---

# 44. Detail Delete

The compiled source contains:

```sql
delete from purentrydetails
where barcode='...'
```

This is a legacy hard-delete operation.

Because a purchase detail may already have:

```text
stock
sales
returns
adjustments
```

hard deletion is dangerous after downstream use.

### Recommended new ERP

Use:

```text
purchase_line.status
purchase_line.deleted_at
```

and preserve the audit trail.

If a posted purchase must be corrected, use an adjustment/reversal workflow rather than destructive deletion.

---

# 45. Barcode Generation During Purchase

The standard purchase code contains queries that derive the next barcode from existing purchase-detail rows.

Example:

```sql
SELECT ISNULL(
    MAX(CAST(SUBSTRING(barcode,8,10) AS INT)),
    0
) AS LastBarcodeNo
FROM purentrydetails
WHERE date = @date
```

Other variants use:

```sql
SELECT MAX(CONVERT(INT,SUBSTRING(barcode, 8, 7))) BARCODE
FROM purentrydetails
WHERE date = @date
```

This confirms that barcode generation is connected to purchase entry in the legacy system.

---

# 46. Barcode Generation Risk

The legacy pattern is effectively:

```text
read MAX barcode
      |
      v
MAX + 1
      |
      v
create next barcode
```

Two simultaneous users can obtain the same maximum value.

Recommended new ERP:

```text
Database sequence / identity
        |
        v
Atomic barcode number allocation
        |
        v
Barcode formatter
```

Do not use `MAX + 1` for concurrent barcode generation.

---

# 47. Barcode and Purchase Relationship

Purchase detail is the source of barcode information:

```text
purentrydetails.barcode
```

Downstream modules can query a barcode back to its purchase:

```sql
select *
from purentrydetails p1
left outer join purgrnentry p2
    on p1.grn_no = p2.grn_no
where barcode = @barcode
```

This provides:

```text
Barcode
   |
   +--> Product
   +--> Purchase GRN
   +--> Supplier
   +--> Company
   +--> Purchase Rate
   +--> Attributes
   +--> MRP
   +--> Stock context
```

---

# 48. Purchase and Product Attributes

Purchase is the major point where the legacy system records the detailed textile attributes.

The detail row can contain:

```text
Design
Brand
Pattern
Size
Color
Style
Rack No
Model No
Fashion Name
```

This is different from the core Product Master.

The architectural distinction is:

```text
Product Master
    = base product identity

Purchase Detail
    = purchased stock identity + transaction snapshot

Barcode
    = physical/sellable inventory identity
```

---

# 49. Purchase and HSN

The purchase detail stores:

```text
hsncode
```

The Product Master also stores HSN-related information.

Purchase should be treated as a historical snapshot:

```text
Product Master HSN
       |
       v
Purchase line HSN snapshot
```

This is important because the product master may be edited later while historical purchase documents must retain the original tax classification used at receipt.

---

# 50. Purchase and Unit

The purchase detail stores:

```text
unit_details
```

This is a snapshot of the unit associated with the purchase line.

It should not be assumed that changing the Product Master unit later automatically changes historical purchase documents.

---

# 51. Purchase and Rack

The purchase line stores:

```text
rackno
```

This is a stock-location attribute.

The logical flow is:

```text
Warehouse
   |
   +--> Floor / Rack
          |
          +--> Purchase Receipt
                  |
                  +--> rackno on detail
```

In the legacy design, rack is stored directly on purchase detail in many flows.

Recommended new ERP:

```text
purchase_line
    |
    +--> receiving_location_id

inventory_location
    |
    +--> warehouse
    +--> floor
    +--> rack
```

---

# 52. Purchase and Product Group

Purchase detail contains:

```text
pro_group_name
```

This appears to be a product-group snapshot rather than a normalized foreign key.

The Product Master itself has group/subgroup fields.

Recommended new ERP:

```text
purchase_line.product_id
purchase_line.product_group_id
```

with historical snapshots where required for reporting/audit.

---

# 53. Purchase Totals

The purchase header stores totals that can be derived from detail lines.

Important values include:

```text
tot_qut
totnetamot
tot_less
pnet_tot
CTotal
CQty
CMtr
CGst
PreDisamt
GST totals
IGSTAmt
```

The source architecture therefore contains intentional denormalization:

```text
Detail calculations
       |
       v
Header totals
```

This is useful for printing/reporting but introduces reconciliation requirements.

---

# 54. Purchase Total Reconciliation

For a new ERP, the following should be checked before posting:

```text
Header Quantity
    = SUM(detail.qty)
```

```text
Header Meter
    = SUM(detail.qty * detail.mtr)
```

```text
Header Gross
    = SUM(detail.amount)
```

```text
Header Discount
    = SUM(detail.dis_amount)
```

```text
Header GST
    = SUM(detail.gst_amount)
```

```text
Header Net
    = SUM(detail.net_amount)
        +/- documented header charges/discounts
```

The exact legacy formula can differ by purchase variant, so the new ERP should document the chosen accounting formula explicitly rather than assuming all old header totals are interchangeable.

---

# 55. Purchase Payment Type

The header stores:

```text
pay_type
```

This represents the payment method/type associated with the purchase transaction.

The source does not establish a universal normalized payment-master foreign key for this field.

Recommended new ERP:

```text
payment_type_id
```

or, if accounting integration is planned:

```text
purchase_payment_terms_id
```

with payment settlement handled separately from the purchase receipt.

---

# 56. Purchase Charges

The purchase header supports multiple charges:

```text
pack_char
pack_charless
oter_char
char_tot
AddchargeAmt
AddchargePer
AddcharegeGST
AddchargeWOGST
```

This indicates that purchase cost can be adjusted beyond simple:

```text
qty x rate
```

A new ERP should model charges as a separate collection where possible:

```text
purchase
   |
   +--> purchase_charges
          |
          +--> packing
          +--> freight
          +--> other
          +--> tax
```

rather than adding unlimited columns to the purchase header.

---

# 57. Purchase Discount Layers

The legacy purchase flow has multiple discount layers:

```text
Line discount
    |
    +--> dis_per
    +--> dis_amount

Purchase less
    |
    +--> pless
    +--> plamt

MRP discount
    |
    +--> mrpdisper
    +--> mrpdisamt

Header/bill discount
    |
    +--> bdis_in

Header-level MRP discount
    |
    +--> mrpdisperh
```

These must not be merged into one generic `discount` field during migration.

---

# 58. Purchase Variants With Discount

The archive contains dedicated discount purchase flows such as:

```text
NewPurchaseDiscountEntry1.aspx
NewPurchaseDiscountEntry2.aspx
NewPurchaseDiscountWSREntry2.aspx
```

These variants should be treated as different UI/business-rule implementations over the same purchase concept.

They may introduce additional pricing/distribution behavior while still using the core purchase tables.

---

# 59. Purchase Without Discount

The archive also contains:

```text
NewWithoutDiscountPurchaseEntry1.aspx
NewWithoutDiscountPurchaseEntry2.aspx
```

The existence of these pages is evidence that discount behavior is configurable by purchase flow.

The new ERP should therefore model discount policy rather than duplicating the entire purchase module for every discount scenario.

---

# 60. GST Purchase Variants

GST-oriented pages include:

```text
GSTNewPurchaseEntry.aspx
GSTNewPurchaseEntryAdd.aspx
AllGSTPurchaseEntry.aspx
AllGSTPurchaseEntryAdd.aspx
AllGSTNewPurchaseEntry.aspx
AllGSTNewPurchaseEntryAdd.aspx
GSTSmallPurchaseEntry.aspx
```

These flows use the purchase header/detail architecture with GST-specific fields and calculations.

The new ERP should centralize tax calculation while allowing the UI to expose the appropriate tax inputs.

---

# 61. Wholesale / Retail Purchase

The archive contains:

```text
WRPurchaseEntry.aspx
WRPurchaseEntryAdd.aspx
WRPurchaseEntryNew.aspx
WRPurchaseEntryNewAdd.aspx
WRPurchaseEntryNewUpdate.aspx
WRPurchaseEntryNewView.aspx
```

This indicates a wholesale/retail-specific purchase path.

The core data model still uses the purchase transaction concept, but specialized pricing fields may differ.

---

# 62. Small Purchase

The archive contains:

```text
SmallPurchaseEntry.aspx
SmallPurchaseEntryAdd.aspx
SmallPurchaseEntryView.aspx
SmallPurchaseUpdate.aspx
```

Small purchase flows can use simplified header/detail storage and may copy purchase data into temporary/update tables.

A source example shows:

```sql
insert into SmallPurchaseUpdateHead
select *
from purgrnentry
where grn_no = @grn_no
```

and corresponding detail copying is also present in some variants.

This is evidence that the legacy application sometimes creates working copies for specialized update workflows.

---

# 63. Purchase Order Relationship

The archive contains purchase-order pages:

```text
PurchaseOrderEntry.aspx
PurchaseOrderEdit.aspx
PurchaseOrderView.aspx
PurchaseOrderEntryReport.aspx
```

The purchase-order data uses separate tables such as:

```text
POHeader
PODetails
```

A purchase order is therefore conceptually prior to the GRN:

```text
Purchase Order
      |
      v
Goods Received / Purchase Entry
      |
      v
Stock
```

However, the inspected source does not prove a universal enforced foreign key from `purgrnentry` to `POHeader`.

Recommended new ERP:

```text
purchase_order
     |
     +--> purchase_order_line
              |
              v
purchase_receipt
     |
     +--> purchase_receipt_line
```

---

# 64. Purchase Return Relationship

Purchase returns are handled separately.

Legacy tables include:

```text
purretrun
TMP_PURCH_BACK
```

The return detail contains many of the same dimensions as purchase:

```text
barcode
code
product
purchase rate
quantity
MRP
GST
brand
pattern
color
size
style
```

A purchase return therefore reverses some quantity/value from an earlier purchase.

Conceptual flow:

```text
Original Purchase
      |
      v
Inventory Received
      |
      v
Purchase Return
      |
      +--> Reduce available inventory
      +--> Financial adjustment
      +--> Supplier return document
```

---

# 65. Purchase Return by Barcode

The source includes barcode-based purchase return workflows.

Return processing can identify the original purchase record using:

```text
barcode
```

and the purchase detail is used to retrieve original values.

This reinforces the importance of keeping the purchase barcode relationship immutable after posting.

---

# 66. Purchase and Stock

The purchase detail is the source event for inventory receipt.

Conceptually:

```text
purentrydetails
      |
      +--> barcode
      +--> code
      +--> qty
      +--> fqty
      +--> mtr
      +--> rackno
      +--> purchase rate
      |
      v
Inventory Stock
```

The stock model should not recreate purchase identity from product master alone.

It should preserve the purchase/source-lot relationship where required.

---

# 67. Purchase and Barcode Stock Identity

For textile retail, a useful identity hierarchy is:

```text
Product
   |
   +--> Variant / attributes
           |
           +--> Barcode / SKU
                    |
                    +--> Purchase receipt
                    +--> Stock
                    +--> Sale
                    +--> Return
```

The legacy system stores much of this directly in `purentrydetails` rather than through normalized variant tables.

---

# 68. Purchase and Sales

Sales can locate purchase information using barcode joins.

A source query pattern is:

```sql
select *
from salsntry s1
left join purentrydetails p1
    on p1.barcode = s1.barcode
where s1.mode = ...
```

Another source pattern joins purchase header and detail:

```sql
from purentrydetails as T1
inner join purgrnentry as T2
    on T1.grn_no = T2.grn_no
```

This means the purchase transaction remains a key historical source for sales-related analysis.

---

# 69. Purchase and Sales Price

Purchase detail stores:

```text
prate
mrp
sr_rate
nrate
```

These values can influence the sales-side price lookup and profitability calculations.

The new ERP should distinguish:

```text
Cost Price
Selling Price
MRP
Net Purchase Rate
Tax-inclusive/exclusive price
```

rather than using one generic `rate` column.

---

# 70. Purchase and Reports

The archive contains extensive purchase reporting pages and Crystal Reports.

Examples include:

```text
purchasereport.aspx
PurchaseReportPrint.aspx
Invoicepurchasereport.aspx
InvoicePurchaseTransactions.aspx
PurchaseTransactions.aspx
PurchaseSalesViewReport.aspx
purchasesalesreport.aspx
purchasesalescusreport.aspx
```

Crystal report assets include:

```text
purchasereport/NewPurchaseReport.rpt
purchasereport/NewPurchaseDetailsReport.rpt
purchasereport/Invoicepurchasereport.rpt
purchasereport/InvoicepurchaseDetail.rpt
purchasereport/FloorepurchaseDetail.rpt
purchasereport/Floorepurchasereport.rpt
purchasereport/PURSUPPLIERSUMMARY.rpt
purchasereport/DATESUPPURSUMMARY.rpt
purchasereport/PurchaseOrderEntry.rpt
purchasereport/PURCHASE_RETURN.rpt
purchasereport/PURCHASE_RETURN_INVOICE_REPORT.rpt
purchasereport/BARCODEPURCHASERETURNREPORT.rpt
```

Purchase is therefore a major reporting source rather than only a data-entry module.

---

# 71. Purchase Report Dimensions

Purchase reports can use:

```text
Date
Supplier
Company
Warehouse
Product
Product Group
Floor
Brand
Pattern
Size
Color
Style
Barcode
GRN
Invoice
```

This is why the purchase-detail record must retain attribute snapshots.

---

# 72. Purchase Search by Date

The application queries purchase records by transaction date.

Example:

```sql
select p1.grn_no as grno,
       p1.invoce_amount as invoice,
       p1.suplier_name as sup
from purgrnentry as p1
where p1.date = @date
```

Another workflow joins `grnotemp` for records with a particular workflow state:

```sql
select p1.grn_no as grno,
       p1.invoce_amount as invoice,
       p1.suplier_name as sup
from purgrnentry as p1
inner join grnotemp as gt1
    on p1.grn_no = gt1.grno
where gt1.statues = '1'
```

---

# 73. Purchase Search by Supplier

The system also searches purchase history by supplier.

Examples include:

```sql
select suplier_name
from purgrnentry
where suplier_name LIKE ...
order by suplier_name
```

and historical attribute retrieval:

```sql
select pb.brand
from purgrnentry br
inner join purentrydetails pb
    on pb.grn_no = br.grn_no
where br.suplier_name = ...
```

This makes supplier history part of the purchase-entry user experience.

---

# 74. Purchase Search by Barcode

Barcode search can reconstruct the purchase context.

Representative query:

```sql
select *
from purentrydetails p1
left outer join purgrnentry p2
    on p1.grn_no = p2.grn_no
where barcode = @barcode
```

This is used by barcode-related screens to identify:

```text
Product
Supplier
Company
GRN
Purchase rate
Attributes
```

---

# 75. Purchase Search by Product Code

The product code is stored in purchase detail:

```text
purentrydetails.code
```

This connects the purchase line to Product Master.

The relationship is logically:

```text
newproduct.code
        |
        v
purentrydetails.code
```

The legacy schema does not prove a database foreign key, so application-level consistency must be considered during migration.

---

# 76. Purchase Search by Product Name

Purchase history also carries:

```text
pname
```

This is a snapshot rather than merely a live join to Product Master.

That distinction is important:

```text
Product Master name changes
        |
        X
should not rewrite old supplier invoices
```

Historical purchase documents should retain the original purchase-line product name.

---

# 77. Purchase and Supplier Snapshot

Similarly:

```text
purgrnentry.suplier_name
```

is a transaction snapshot.

If the supplier master changes later, historical purchase documents should continue to show the supplier associated with the original transaction.

New ERP should therefore preserve:

```text
supplier_id
supplier_name_snapshot
```

where audit/legal reporting requires it.

---

# 78. Purchase Header vs Detail Responsibilities

The correct conceptual separation is:

| Header | Detail |
|---|---|
| GRN | Line number |
| Supplier | Product |
| Company | Barcode |
| Warehouse | Quantity |
| Agent | Meter |
| Incharge | Purchase rate |
| Invoice number | Discount |
| Invoice date | GST |
| Payment type | MRP |
| Header charges | Selling rate |
| Header discounts | Brand |
| Header tax totals | Pattern |
| Total quantity | Size |
| Total amount | Color |
| Total meter | Style |
| Purchase status | Rack |
| Supplier city | Model |
|  | Fashion |

This separation should be preserved in the new ERP.

---

# 79. Recommended New ERP Purchase Structure

A normalized design should be approximately:

```text
purchase_receipts
├── id
├── company_id
├── warehouse_id
├── supplier_id
├── agent_id
├── incharge_user_id
├── grn_number
├── supplier_invoice_number
├── supplier_invoice_date
├── entry_date
├── business_date
├── payment_type_id
├── subtotal
├── discount_total
├── tax_total
├── charge_total
├── net_total
├── total_qty
├── total_meter
├── status
├── created_by
├── created_at
└── updated_at
```

and:

```text
purchase_receipt_lines
├── id
├── purchase_receipt_id
├── line_no
├── product_id
├── variant_id
├── barcode_id
├── hsn_code_snapshot
├── product_name_snapshot
├── unit_snapshot
├── purchase_rate
├── meter_per_unit
├── quantity
├── free_quantity
├── gross_amount
├── purchase_less
├── purchase_less_amount
├── discount_percent
├── discount_amount
├── gst_percent
├── gst_amount
├── net_amount
├── mrp
├── mrp_discount_percent
├── mrp_discount_amount
├── selling_rate
├── commission_percent
├── commission_rate
├── rack_id
├── design
├── model
├── fashion
└── created_at
```

---

# 80. Recommended Purchase Charges Structure

Instead of columns such as:

```text
pack_char
oter_char
AddchargeAmt
AddchargePer
AddcharegeGST
```

new ERP can use:

```text
purchase_receipt_charges
├── id
├── purchase_receipt_id
├── charge_type_id
├── calculation_method
├── percentage
├── taxable_amount
├── tax_amount
├── amount
└── description
```

This allows future charge types without schema changes.

---

# 81. Recommended Tax Structure

Instead of relying primarily on:

```text
gst5
gst12
gst18
gst28
IGSTAmt
```

new ERP should have tax lines:

```text
purchase_receipt_tax_lines
├── purchase_receipt_id
├── tax_type
├── tax_rate
├── taxable_amount
├── tax_amount
└── jurisdiction
```

Then report-level totals can be generated from the tax lines.

---

# 82. Recommended Product Relationship

The new ERP should avoid duplicating Product Master as the purchase identity.

Recommended:

```text
products
   |
   +--> product_variants
             |
             +--> barcodes
                       |
                       +--> purchase_receipt_lines
```

Purchase line keeps snapshots:

```text
product_name_snapshot
hsn_code_snapshot
unit_snapshot
```

for historical correctness.

---

# 83. Recommended Stock Relationship

Purchase receipt should create inventory receipt records rather than directly changing a single stock number.

Recommended flow:

```text
purchase_receipt
      |
      v
purchase_receipt_line
      |
      v
inventory_receipt
      |
      +--> warehouse
      +--> rack
      +--> barcode/SKU
      +--> quantity
      +--> meter
      +--> cost
```

Then stock balance is derived from inventory movements.

---

# 84. Recommended Posting State

The legacy system has fields such as:

```text
ViewStatus
billstatus
STATUS
```

The exact semantics differ by module.

New ERP should consolidate this into a controlled lifecycle:

```text
DRAFT
   |
   v
VALIDATED
   |
   v
POSTED
   |
   +--> PARTIALLY_RETURNED
   |
   +--> RETURNED
   |
   v
CLOSED
```

A posted purchase should not be destructively edited.

---

# 85. Purchase Edit Safety

The legacy system permits detail updates by barcode and GRN.

For a new ERP, editing a posted purchase should require controlled behavior:

```text
Draft purchase
    |
    +--> freely editable

Posted purchase
    |
    +--> controlled adjustment

Purchase with sales/stock activity
    |
    +--> reversal/adjustment only
```

This avoids changing historical cost after inventory has already been sold.

---

# 86. Audit Requirements

New purchase architecture should capture:

```text
created_by
created_at
updated_by
updated_at
posted_by
posted_at
cancelled_by
cancelled_at
```

The legacy source has some timestamp support such as `UpdatedOn` in certain variants but does not demonstrate one consistent audit model across all purchase pages.

---

# 87. SQL Injection Risk

Some legacy purchase search patterns concatenate values into SQL strings, while save/update operations use parameters.

For example, historical source patterns include string-built searches around:

```text
supplier
product
barcode
GRN
```

The new ERP should use parameterized queries for every path:

```text
SELECT ... WHERE supplier_id = @supplier_id
```

and never construct SQL through raw concatenation of user input.

---

# 88. Purchase Number Concurrency Risk

Two number-generation patterns are particularly important:

```text
GRN number = MAX + 1
Barcode number = MAX + 1
```

These are unsafe under concurrent users.

Recommended:

```text
GRN sequence
Barcode sequence
```

with atomic allocation.

---

# 89. Header/Detail Atomicity Risk

The source demonstrates separate SQL statements for:

```text
purgrnentry
purentrydetails
```

but the compiled code inspection does not establish that every variant wraps both operations in a SQL transaction.

New ERP should guarantee:

```text
Header + all details + stock posting
```

are atomic at the posting boundary.

---

# 90. Purchase Posting Flow for New ERP

Recommended exact sequence:

```text
1. Validate user permission
        |
2. Validate company/warehouse/supplier
        |
3. Validate invoice number/date
        |
4. Validate at least one line
        |
5. Validate product/variant/barcode
        |
6. Validate quantities/rates
        |
7. Validate MRP/selling price rules
        |
8. Calculate line amounts
        |
9. Calculate tax
        |
10. Calculate charges/discounts
        |
11. Reconcile header totals
        |
12. Allocate GRN number
        |
13. Save header
        |
14. Save detail lines
        |
15. Save barcode/SKU inventory identity
        |
16. Post stock movements
        |
17. Commit transaction
        |
18. Generate/print purchase document
```

---

# 91. Purchase Posting Transaction Boundary

Recommended database transaction:

```text
BEGIN TRANSACTION

INSERT purchase_receipts

FOR each line:
    INSERT purchase_receipt_lines
    INSERT/update barcode identity if required
    INSERT inventory_receipt

Validate totals
Validate stock/location

COMMIT
```

If any operation fails:

```text
ROLLBACK
```

No partial purchase should remain.

---

# 92. End-to-End Legacy Flow

The actual legacy architecture can be represented as:

```text
                    COMPANY
                       |
                       v
                  WAREHOUSE
                       |
                       v
SUPPLIER ---> NewPurchaseentry.aspx
                       |
                       +--> Invoice
                       +--> GRN
                       +--> Agent
                       +--> Incharge
                       +--> Charges
                       +--> Taxes
                       |
                       v
                Purchase Grid
                       |
        +--------------+--------------+
        |              |              |
        v              v              v
   Product Code    Barcode       Attributes
        |              |              |
        |              |      +-------+--------+
        |              |      |       |        |
        v              v      v       v        v
    newproduct    barcode    brand  pattern  size/color/style
        |                         |
        +--> HSN                  +--> rack/model/fashion
        |                         |
        +-------------------------+
                       |
                       v
              purentrydetails
                       |
                       +--> qty/mtr
                       +--> purchase rate
                       +--> GST
                       +--> MRP
                       +--> selling rate
                       |
                       v
                 purgrnentry
                       |
                       v
               PURCHASE / GRN
                       |
       +---------------+----------------+
       |               |                |
       v               v                v
     Stock           Barcode          Reports
       |               |                |
       v               v                v
     Sales          Returns       Supplier analysis
```

---

# 93. Detailed Example

Assume the business receives:

```text
Supplier: ABC Textiles
Company: Main Company
Warehouse: Main Warehouse
Invoice: INV-1001
```

One line is:

```text
Product Code: 1201
Product Name: Cotton Saree
Barcode: 250930100001
Brand: Brand-A
Pattern: Floral
Size: Free
Color: Blue
Style: Traditional
Design: D-100
Rack: R-12
Qty: 10
Mtr: 6.3
Purchase Rate: 1000
MRP: 1500
GST: 5%
```

The logical records become:

```text
purgrnentry
--------------------------------
gr n_no        = generated GRN
cmy_name      = Main Company
warehouse     = Main Warehouse
suplier_name  = ABC Textiles
invoce_amount = calculated invoice amount
invoce_date   = supplier invoice date
```

and:

```text
purentrydetails
--------------------------------
grn_no     = same GRN
sl_no      = 1
code       = 1201
pname      = Cotton Saree
barcode    = 250930100001
brand      = Brand-A
patrn      = Floral
size       = Free
color      = Blue
style      = Traditional
design     = D-100
rackno     = R-12
qty        = 10
mtr        = 6.3
prate      = 1000
mrp        = 1500
gst_per    = 5
```

The same barcode can then be found from sales/stock workflows.

---

# 94. Purchase to Stock Lifecycle

```text
PURCHASE CREATED
      |
      v
PURCHASE VALIDATED
      |
      v
PURCHASE POSTED
      |
      v
INVENTORY RECEIVED
      |
      +--> Warehouse
      +--> Rack
      +--> Barcode
      +--> Quantity
      +--> Meter
      +--> Cost
      |
      v
AVAILABLE STOCK
      |
      +--> SALE
      +--> TRANSFER
      +--> PURCHASE RETURN
      +--> STOCK ADJUSTMENT
```

The exact stock-posting implementation varies by product/module, so purchase should be treated as the source receipt event rather than assuming one universal stock table from this document alone.

---

# 95. Purchase to Sales Lifecycle

```text
Purchase Detail
      |
      v
Barcode
      |
      v
Stock
      |
      v
Sales Entry
      |
      v
Sale by Barcode
      |
      v
Purchase history available
```

This is why the barcode should be stable and unique within the intended business scope.

---

# 96. Purchase to Return Lifecycle

```text
Purchase
   |
   v
Stock
   |
   v
Supplier Return
   |
   v
purretrun / return workflow
   |
   v
Stock reduction
```

The return should reference the original purchase/barcode whenever possible.

---

# 97. Purchase to Reporting Lifecycle

```text
purgrnentry
     |
     +--> date
     +--> supplier
     +--> company
     +--> warehouse
     +--> invoice
     |
     +------------------+
                        |
                        v
                 Purchase Reports
                        ^
                        |
                 purentrydetails
                        |
                        +--> product
                        +--> barcode
                        +--> brand
                        +--> pattern
                        +--> size
                        +--> color
                        +--> style
                        +--> rack
                        +--> rate
                        +--> qty
                        +--> meter
                        +--> tax
```

---

# 98. Data Ownership Matrix

| Data | Master/source | Purchase stores snapshot? |
|---|---|---:|
| Company | `companydetail` | Yes |
| Warehouse | `warehousedetail` | Yes |
| Supplier | `supplierdetail` | Yes |
| Agent | `agentdetail` | Yes |
| Product | `newproduct` | Yes, as code/name |
| Unit | `prounit` / Product | Yes |
| HSN | Product/GST setup | Yes |
| Brand | Attribute/history | Yes |
| Pattern | Attribute/history | Yes |
| Size | Attribute/history | Yes |
| Color | Attribute/history | Yes |
| Style | Attribute/history | Yes |
| Design | Attribute | Yes |
| Model | Attribute | Yes |
| Fashion | Attribute | Yes |
| Rack | Location | Yes |
| Purchase Rate | Purchase transaction | Yes |
| MRP | Purchase transaction | Yes |
| Selling Rate | Purchase transaction | Yes |
| GST | Tax setup + transaction | Yes |

---

# 99. Legacy Data Migration Mapping

Recommended mapping:

```text
purgrnentry
        |
        v
purchase_receipts
```

and:

```text
purentrydetails
        |
        v
purchase_receipt_lines
```

Mapping examples:

```text
purgrnentry.grn_no
    -> purchase_receipts.grn_number

purgrnentry.cmy_name
    -> purchase_receipts.company_id

purgrnentry.warehouse
    -> purchase_receipts.warehouse_id

purgrnentry.suplier_name
    -> purchase_receipts.supplier_id

purgrnentry.invoce_amount
    -> purchase_receipts.invoice_amount / gross_total

purgrnentry.invoce_date
    -> purchase_receipts.supplier_invoice_date

purgrnentry.entry_date
    -> purchase_receipts.entry_date
```

Detail mapping:

```text
purentrydetails.code
    -> purchase_receipt_lines.product_id

purentrydetails.barcode
    -> purchase_receipt_lines.barcode_id

purentrydetails.qty
    -> purchase_receipt_lines.quantity

purentrydetails.fqty
    -> purchase_receipt_lines.free_quantity

purentrydetails.mtr
    -> purchase_receipt_lines.meter_per_unit

purentrydetails.prate
    -> purchase_receipt_lines.purchase_rate

purentrydetails.mrp
    -> purchase_receipt_lines.mrp

purentrydetails.sr_rate
    -> purchase_receipt_lines.selling_rate
```

---

# 100. Migration Warning: Name-Based Relationships

Legacy purchase data contains names rather than normalized IDs in many places:

```text
cmy_name
warehouse
suplier_name
agent_name
pname
brand
patrn
size
color
style
rackno
fashion
```

Migration should first create canonical master mappings:

```text
Legacy name
    |
    v
Canonical master ID
```

Then populate new purchase records with IDs plus historical snapshots.

Do not assume exact string equality is always safe because legacy data may contain:

```text
case differences
extra spaces
spelling variants
Tamil/English variants
abbreviations
```

---

# 101. Migration Warning: Duplicate Barcodes

Before migration, validate:

```sql
SELECT barcode, COUNT(*)
FROM purentrydetails
WHERE ISNULL(barcode,'') <> ''
GROUP BY barcode
HAVING COUNT(*) > 1
```

Duplicate results must be classified.

A duplicate barcode may mean:

```text
legitimate historical reuse
bad legacy generation
returned/reissued barcode
multiple records representing one physical item
```

Do not automatically enforce a global unique constraint until the legacy data has been reconciled.

---

# 102. Migration Warning: Duplicate GRNs

Validate:

```sql
SELECT grn_no, COUNT(*)
FROM purgrnentry
GROUP BY grn_no
HAVING COUNT(*) > 1
```

If duplicates exist, determine whether they are:

```text
company-scoped
branch-scoped
historical duplicates
migration artifacts
```

The new ERP should define the exact GRN uniqueness scope.

---

# 103. Migration Warning: Header/Detail Orphans

Validate details without headers:

```sql
SELECT d.grn_no
FROM purentrydetails d
LEFT JOIN purgrnentry h
    ON h.grn_no = d.grn_no
WHERE h.grn_no IS NULL
```

These records cannot be safely migrated as complete purchase transactions without reconstruction.

Validate headers without details:

```sql
SELECT h.grn_no
FROM purgrnentry h
LEFT JOIN purentrydetails d
    ON d.grn_no = h.grn_no
WHERE d.grn_no IS NULL
```

These may represent:

```text
empty draft
cancelled purchase
partial/failed save
legacy workflow record
```

---

# 104. Migration Warning: Header Total Mismatch

Reconcile:

```text
Header quantity
vs
SUM(detail quantity)
```

and:

```text
Header net amount
vs
calculated detail net + header charges/discounts
```

Do not overwrite the original value silently.

Recommended migration fields:

```text
legacy_total
calculated_total
variance
variance_reason
```

for exceptional historical records.

---

# 105. Migration Warning: Historical Price Changes

A product's current price must not be used to rewrite historical purchase prices.

Historical purchase line must retain:

```text
prate
nrate
mrp
sr_rate
```

because these are transaction values.

---

# 106. Migration Warning: HSN Changes

Product Master HSN can change over time.

Purchase detail stores:

```text
hsncode
```

This should be retained as a historical snapshot.

Do not update all historical purchases when Product Master HSN is edited.

---

# 107. Migration Warning: Unit Changes

Likewise:

```text
unit_details
```

is a historical purchase snapshot.

If the Product Master unit is changed later, historical purchase documents must not be silently recalculated.

---

# 108. Migration Warning: Textile Attributes

Brand, pattern, size, color, style, model, fashion and design are present directly in purchase details.

Migration should normalize these into master/variant tables where appropriate while preserving the original text.

Recommended:

```text
purchase_receipt_line
    |
    +--> brand_id
    +--> pattern_id
    +--> size_id
    +--> color_id
    +--> style_id
    +--> design_id
    +--> model_id
    +--> fashion_id
```

plus snapshots where required.

---

# 109. Recommended SKU/Variant Model

For textile ERP, the best conceptual model is:

```text
Product
  |
  +-- Variant
        |
        +-- Brand
        +-- Pattern
        +-- Size
        +-- Color
        +-- Style
        +-- Design
        +-- Model
        +-- Fashion
        |
        +-- Barcode
```

Purchase then receives a quantity of a variant/barcode.

This is cleaner than treating every purchase detail as a new product.

---

# 110. Product vs Purchase Line

The following should remain separate:

```text
Product
= reusable catalog definition
```

```text
Purchase Line
= one historical receipt of that product/variant
```

For example:

```text
Product: Cotton Saree

Purchase 1:
    Brand A
    Blue
    Barcode 001
    Purchase Rate 900

Purchase 2:
    Brand A
    Blue
    Barcode 002
    Purchase Rate 950
```

Both are the same base product but different transaction/stock records.

---

# 111. Purchase and Inventory Cost

The purchase rate is the source cost for received inventory.

Recommended cost chain:

```text
Supplier Invoice
      |
      v
Purchase Line Cost
      |
      v
Inventory Cost/Lot
      |
      v
COGS when sold
```

The exact costing method used by the legacy system should be separately confirmed before implementing accounting valuation. This document establishes the purchase-record source, not a universal costing algorithm.

---

# 112. Purchase and Barcode Rate Change

The archive contains rate-change workflows such as:

```text
PurchaseRateChange.aspx
WSbarcoderatechange.aspx
```

and source logic updates purchase detail rate/commission fields.

Example:

```sql
update purentrydetails
set cr_per=@cr_per,
    cr_rate=@cr_rate
where barcode=@barcode
```

This demonstrates that barcode-level commercial values can be modified after purchase entry.

New ERP should tightly audit such changes because they can affect historical profitability.

---

# 113. Purchase and Supplier Analysis

Supplier reporting can be built from:

```text
purgrnentry.suplier_name
purgrnentry.grn_no
purgrnentry.invoce_date
purgrnentry.invoce_amount
purentrydetails.code
purentrydetails.barcode
purentrydetails.qty
purentrydetails.prate
```

and attributes:

```text
brand
pattern
size
color
style
```

This supports questions such as:

```text
Purchases by supplier
Supplier-wise product purchases
Supplier-wise brand purchases
Supplier-wise pattern purchases
Supplier-wise stock
Supplier-wise purchase returns
```

---

# 114. Purchase and Floor/Rack Reporting

Purchase detail stores rack information, and the archive contains floor-based purchase reports.

This means the receiving flow can be analyzed by physical store location.

Recommended new ERP:

```text
purchase_line.receiving_rack_id
```

and warehouse/floor/rack should be normalized separately.

---

# 115. Purchase View Flow

`NewPurchaseentryView.aspx` is responsible for retrieving saved purchase information.

The view flow is conceptually:

```text
Enter/Select GRN
       |
       v
Read purgrnentry
       |
       v
Read purentrydetails
       |
       v
Bind header
       |
       v
Bind purchase grid
       |
       v
Display totals
```

The source query returns both transaction fields and calculated display values such as total meter.

---

# 116. Purchase Update Flow

`NewPurchaseUpdate.aspx` follows the same basic model:

```text
Load GRN
   |
   +--> Load header
   |
   +--> Load details
   |
   v
User edits
   |
   +--> Recalculate
   |
   v
Validate
   |
   v
Update header
   |
   v
Update/insert/delete details
```

The new ERP should make this an explicit command-based transaction rather than multiple independent updates.

---

# 117. Recommended Command Model

Instead of exposing raw CRUD operations, new ERP can use:

```text
CreatePurchaseReceipt
UpdateDraftPurchaseReceipt
PostPurchaseReceipt
CancelPurchaseReceipt
CreatePurchaseReturn
AdjustPurchasePrice
```

This makes the lifecycle explicit.

---

# 118. Recommended API Model

Example:

```text
POST /purchase-receipts
GET  /purchase-receipts/{id}
PUT  /purchase-receipts/{id}
POST /purchase-receipts/{id}/post
POST /purchase-receipts/{id}/cancel
POST /purchase-receipts/{id}/return
```

The backend should perform all calculations and validations server-side even if the frontend performs live calculations for user convenience.

---

# 119. Frontend vs Backend Calculation Rule

Legacy TextileSoft performs significant calculations in JavaScript.

New ERP should use:

```text
Frontend
    = instant preview

Backend
    = authoritative calculation
```

The server must recalculate:

```text
amount
discount
gst
net amount
charges
totals
```

and compare/ignore client-supplied calculated totals as appropriate.

---

# 120. Purchase Validation Matrix

| Validation | Legacy evidence | New ERP recommendation |
|---|---|---|
| Supplier | Supplier lookup | Mandatory ID |
| Company | Company lookup | Mandatory ID |
| Warehouse | Warehouse lookup | Mandatory ID |
| Invoice No | Explicit error | Mandatory |
| GRN | Explicit validation | Mandatory + unique |
| Lines | Empty purchase blocked | At least 1 |
| Product | Product lookup | Mandatory |
| Barcode | Detail identity | Required where barcode flow applies |
| Quantity | Calculation validation | > 0 unless explicit return/adjustment |
| MRP | Explicit error | Validate |
| GST | Line/header calculation | Server-side tax engine |
| Totals | Header/detail values | Reconcile before posting |

---

# 121. Data Integrity Constraints for New ERP

Recommended constraints:

```text
purchase_receipt.grn_number
    UNIQUE within defined business scope
```

```text
purchase_receipt_line.purchase_receipt_id
    FOREIGN KEY purchase_receipts(id)
```

```text
purchase_receipt_line.product_id
    FOREIGN KEY products(id)
```

```text
purchase_receipt_line.barcode_id
    FOREIGN KEY barcodes(id)
```

```text
purchase_receipt_line.quantity >= 0
```

```text
purchase_receipt_line.free_quantity >= 0
```

and appropriate checks for rates/taxes.

---

# 122. Purchase Security

Purchase entry changes financial and inventory data.

Recommended permissions:

```text
purchase.create
purchase.edit_draft
purchase.post
purchase.cancel
purchase.return
purchase.rate_change
purchase.view
purchase.export
```

Rate changes should have a separate permission from normal purchase editing.

---

# 123. Purchase Audit

Every posted purchase should be auditable by:

```text
GRN
Invoice
Supplier
User
Date/time
Company
Warehouse
Original totals
Adjusted totals
Reason for adjustment
```

This is particularly important because the legacy system allows direct updates to purchase detail values.

---

# 124. Recommended Event History

New ERP can create:

```text
purchase_events
```

with:

```text
PURCHASE_CREATED
PURCHASE_UPDATED
PURCHASE_POSTED
PURCHASE_CANCELLED
PURCHASE_RETURNED
PURCHASE_RATE_CHANGED
BARCODE_CHANGED
LOCATION_CHANGED
```

This makes downstream audit and troubleshooting much easier.

---

# 125. Purchase Document Printing

The archive contains multiple Crystal reports for purchase documents.

The purchase document is therefore generated from the saved transaction, not only from the current UI state.

Recommended flow:

```text
Save/Post Purchase
       |
       v
Read canonical transaction
       |
       v
Generate invoice/GRN print
```

This avoids printing unsaved client-side values.

---

# 126. Purchase Reports and Historical Snapshot Principle

Reports should use transaction snapshots for:

```text
Product Name
Supplier Name
HSN
Unit
Brand
Pattern
Size
Color
Style
Purchase Rate
MRP
GST
```

Current master values can be used for navigation, but historical financial reports should use transaction values.

---

# 127. Legacy Naming Issues

Several legacy columns contain spelling inconsistencies:

```text
suplier_name
invoce_amount
invoce_date
oter_char
patrn
com_per
pnet_tot
```

These should be mapped to clean new names:

```text
supplier_name
invoice_amount
invoice_date
other_charge
pattern
commission_percent
purchase_net_total
```

Do not change the legacy source during migration unless the application is being migrated simultaneously. Keep a clear mapping table.

---

# 128. Recommended Legacy-to-New Mapping Table

| Legacy | New ERP |
|---|---|
| `purgrnentry.grn_no` | `purchase_receipts.grn_number` |
| `purgrnentry.cmy_name` | `purchase_receipts.company_id` |
| `purgrnentry.warehouse` | `purchase_receipts.warehouse_id` |
| `purgrnentry.suplier_name` | `purchase_receipts.supplier_id` |
| `purgrnentry.agent_name` | `purchase_receipts.agent_id` |
| `purgrnentry.incharge` | `purchase_receipts.incharge_user_id` |
| `purgrnentry.invoce_amount` | `purchase_receipts.invoice_amount` |
| `purgrnentry.invoce_date` | `purchase_receipts.supplier_invoice_date` |
| `purgrnentry.entry_date` | `purchase_receipts.entry_date` |
| `purgrnentry.pay_type` | `purchase_receipts.payment_type_id` |
| `purgrnentry.tot_qut` | `purchase_receipts.total_qty` |
| `purgrnentry.CMtr` | `purchase_receipts.total_meter` |
| `purgrnentry.totnetamot` | `purchase_receipts.net_total` |
| `purentrydetails.grn_no` | `purchase_receipt_lines.purchase_receipt_id` |
| `purentrydetails.sl_no` | `purchase_receipt_lines.line_no` |
| `purentrydetails.code` | `purchase_receipt_lines.product_id` |
| `purentrydetails.pname` | `purchase_receipt_lines.product_name_snapshot` |
| `purentrydetails.barcode` | `purchase_receipt_lines.barcode_id` |
| `purentrydetails.prate` | `purchase_receipt_lines.purchase_rate` |
| `purentrydetails.qty` | `purchase_receipt_lines.quantity` |
| `purentrydetails.fqty` | `purchase_receipt_lines.free_quantity` |
| `purentrydetails.mtr` | `purchase_receipt_lines.meter_per_unit` |
| `purentrydetails.amount` | `purchase_receipt_lines.gross_amount` |
| `purentrydetails.dis_per` | `purchase_receipt_lines.discount_percent` |
| `purentrydetails.dis_amount` | `purchase_receipt_lines.discount_amount` |
| `purentrydetails.gst_per` | `purchase_receipt_lines.tax_percent` |
| `purentrydetails.gst_amount` | `purchase_receipt_lines.tax_amount` |
| `purentrydetails.net_amount` | `purchase_receipt_lines.net_amount` |
| `purentrydetails.mrp` | `purchase_receipt_lines.mrp` |
| `purentrydetails.sr_rate` | `purchase_receipt_lines.selling_rate` |
| `purentrydetails.brand` | `purchase_receipt_lines.brand_id` |
| `purentrydetails.patrn` | `purchase_receipt_lines.pattern_id` |
| `purentrydetails.size` | `purchase_receipt_lines.size_id` |
| `purentrydetails.color` | `purchase_receipt_lines.color_id` |
| `purentrydetails.style` | `purchase_receipt_lines.style_id` |
| `purentrydetails.rackno` | `purchase_receipt_lines.rack_id` |
| `purentrydetails.design` | `purchase_receipt_lines.design_id` |
| `purentrydetails.model` | `purchase_receipt_lines.model_id` |
| `purentrydetails.fashion` | `purchase_receipt_lines.fashion_id` |
| `purentrydetails.hsncode` | `purchase_receipt_lines.hsn_code_snapshot` |
| `purentrydetails.unit_details` | `purchase_receipt_lines.unit_snapshot` |

---

# 129. Confirmed Source Facts vs Interpretation

## Confirmed

The source directly confirms:

- `purgrnentry` is used for purchase/GRN header persistence.
- `purentrydetails` is used for purchase detail persistence.
- `grn_no` connects header and detail.
- Supplier comes from `supplierdetail`.
- Company comes from `companydetail`.
- Warehouse comes from `warehousedetail`.
- Agent comes from `agentdetail`.
- Purchase detail stores product, barcode, quantity, meter, rates, taxes and textile attributes.
- Purchase detail stores `brand`, `patrn`, `size`, `color`, `style`, `rackno`, `model`, `fashion`, and `design` in the standard flow.
- The source contains purchase header/detail insert and update SQL.
- The source contains purchase validation messages.
- The source contains barcode-number generation logic based on existing purchase-detail records.
- Purchase history is used for attribute suggestions.
- Purchase return modules use purchase-related values.
- Purchase reports use the purchase tables.

## Requires separate business confirmation

The source inspection does not establish one universal rule for:

- accounting posting timing,
- exact stock valuation method,
- exact payment settlement behavior,
- universal GRN uniqueness scope across every company/customization,
- whether every purchase variant uses a SQL transaction,
- whether every purchase line represents one physical item or an aggregated quantity,
- whether every barcode is globally unique across all modules.

These should be confirmed before final ERP accounting/inventory implementation.

---

# 130. Final End-to-End Architecture

The complete legacy purchase architecture is:

```text
                         MASTER DATA
                              |
        +---------------------+---------------------+
        |          |          |          |          |
        v          v          v          v          v
     Company   Warehouse   Supplier    Agent     Product
        |          |          |          |          |
        +----------+----------+----------+----------+
                              |
                              v
                    NEW PURCHASE ENTRY
                              |
          +-------------------+-------------------+
          |                                       |
          v                                       v
       HEADER                                  DETAIL
          |                                       |
          |                                  Product Code
       GRN No                                  Product Name
       Invoice                                Barcode
       Supplier                               HSN
       Company                                Purchase Rate
       Warehouse                             Qty
       Agent                                 Free Qty
       Incharge                              Meter
       Payment                               Discount
       Charges                               GST
       Header Tax                            MRP
       Totals                                Selling Rate
                                             Commission
                                             Design
                                             Brand
                                             Pattern
                                             Size
                                             Color
                                             Style
                                             Rack
                                             Model
                                             Fashion
          |                                       |
          +-------------------+-------------------+
                              |
                              v
                         SAVE / POST
                              |
               +--------------+--------------+
               |              |              |
               v              v              v
            Purchase        Barcode        Inventory
             History          |               |
                              |               |
                              v               v
                            Sales          Stock Reports
                              |
                              v
                         Purchase Return
                              |
                              v
                         Supplier Return
```

---

# 131. Final Recommended ERP Architecture

For the new ERP, the clean architecture should be:

```text
Supplier
   |
   v
Purchase Order (optional)
   |
   v
Purchase Receipt / GRN
   |
   +--> Header
   |      |
   |      +--> Company
   |      +--> Warehouse
   |      +--> Supplier
   |      +--> Invoice
   |      +--> Dates
   |      +--> Charges
   |      +--> Tax totals
   |      +--> Totals
   |
   +--> Lines
          |
          +--> Product
          +--> Variant
          +--> Barcode
          +--> Quantity
          +--> Free Quantity
          +--> Meter
          +--> Cost
          +--> Tax
          +--> Selling Price
          +--> Location
          |
          v
       Inventory Receipt
          |
          +--> Stock
          +--> Barcode availability
          |
          +--> Sales
          |
          +--> Purchase Return
          |
          +--> Reporting
```

---

# 132. Key Rules to Preserve During Migration

1. `purgrnentry` is the purchase header.
2. `purentrydetails` is the purchase detail.
3. `grn_no` is the primary legacy header/detail relationship.
4. Product code and product name identify the base product, but the purchase detail carries transaction-specific snapshots.
5. Barcode is the key downstream inventory identity in many workflows.
6. Quantity and meter are separate dimensions.
7. Free quantity must remain separate from normal quantity.
8. Purchase rate, MRP and selling rate must remain separate.
9. Discount has multiple layers and must not be collapsed into one field.
10. GST exists at both line and header levels.
11. Brand, pattern, size, color, style, design, model and fashion are primarily purchase/SKU-level data rather than core Product Master fields.
12. Rack is a physical stock-location dimension.
13. Historical HSN and unit should be preserved as transaction snapshots.
14. Purchase header totals must be reconciled against detail lines.
15. Posted purchases should not be hard-deleted.
16. GRN generation should not use `MAX + 1` in the new ERP.
17. Barcode generation should not use `MAX + 1` in the new ERP.
18. Header and detail persistence must be atomic.
19. Purchase edits after stock/sales activity should use controlled adjustment/reversal.
20. Purchase returns should reference the original purchase/barcode wherever possible.

---

# 133. Short Business Flow

```text
Supplier Invoice
      |
      v
Purchase Entry
      |
      +--> Company
      +--> Warehouse
      +--> Supplier
      +--> Invoice
      +--> GRN
      |
      v
Add Products
      |
      +--> Product
      +--> Barcode
      +--> Qty
      +--> Meter
      +--> Purchase Rate
      +--> Attributes
      +--> Tax
      +--> Selling Price
      |
      v
Calculate
      |
      +--> Gross
      +--> Less
      +--> Discount
      +--> GST
      +--> Net
      |
      v
Validate
      |
      v
Save GRN Header
      |
      v
Save GRN Lines
      |
      v
Post Inventory
      |
      v
Available for Sale
      |
      +--> Sales
      +--> Returns
      +--> Stock Reports
      +--> Purchase Reports
```

---

# 134. Conclusion

TextileSoft's purchase module is the central receiving transaction that converts a supplier invoice into product-level and barcode-level inventory records.

The most important architectural finding is that the purchase process is not simply:

```text
Supplier -> Purchase -> Stock
```

It is actually:

```text
Supplier
   |
   v
Purchase / GRN Header
   |
   +--> Company
   +--> Warehouse
   +--> Invoice
   +--> Charges
   +--> Taxes
   +--> Totals
   |
   v
Purchase Detail
   |
   +--> Product
   +--> Barcode
   +--> Quantity
   +--> Meter
   +--> Purchase Cost
   +--> MRP
   +--> Selling Rate
   +--> GST
   +--> Brand / Pattern / Size / Color / Style
   +--> Design / Model / Fashion
   +--> Rack
   |
   v
Inventory Identity
   |
   +--> Stock
   +--> Sales
   +--> Purchase Return
   +--> Reporting
```

For the new ERP, `purgrnentry` and `purentrydetails` should be migrated into a normalized purchase-receipt model, while preserving all historical snapshots and transaction-level commercial values. The new implementation should add transactional atomicity, safe GRN/barcode number generation, normalized master IDs, audit history, controlled posting/editing, and server-side authoritative calculations.

The legacy behavior should be treated as the compatibility baseline, not as the target database design.
