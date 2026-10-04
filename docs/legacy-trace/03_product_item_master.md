# TextileSoft 03 - Product / Item Master
## End-to-End Technical Flow

**Source:** `TEXTILESOFT 17.07.2025`  
**Application:** ASP.NET WebForms, precompiled  
**Primary page:** `newproduct.aspx`  
**Compiled page class:** `newproduct`  
**Compiled assembly:** `App_Web_wpk3movq.dll`  
**Primary table:** `newproduct`

---

# 1. Executive Summary

The TextileSoft Product Master is centered on:

```text
newproduct.aspx
        |
        v
newproduct table
```

The product record is not only a simple product name/code master. It carries several commercial, tax, organizational and presentation attributes:

```text
Product Code
Bill Code [UI field]
Product Name
Print Name
Product Name Tamil
Print Name Tamil
Unit
Group
Sub Group
Floor
GST Group
Company
Discount %
Commission
Commission %
Commission Amount
HSN Code
Product HSN Code
Entry Date
```

The most important confirmed database insert is:

```sql
insert into newproduct
(
    com_per,
    com_amt,
    commission,
    code,
    hsn_code,
    name,
    print_name,
    group_name,
    sub_group_name,
    floor_name,
    gst_group,
    cmy_name,
    discount,
    date,
    unit_de,
    PnameTamil,
    PrintNameTamil,
    ProductHSNCode
)
values
(
    @com_per,
    @com_amt,
    @commission,
    @code,
    @hsn_code,
    @name,
    @print_name,
    @group_name,
    @sub_group_name,
    @floor_name,
    @gst_group,
    @cmy_name,
    @discount,
    @date,
    @unit_de,
    @PnameTamil,
    @PrintNameTamil,
    @ProductHSNCode
)
```

This means Product Master is a **central dependency** for:

```text
Purchase
   ↓
Barcode
   ↓
Stock
   ↓
Sales
   ↓
Returns
   ↓
Discount
   ↓
Commission
   ↓
Reports
```

---

# 2. Primary Product Master Page

## Source

```text
newproduct.aspx
```

Page directive:

```text
inherits="newproduct, App_Web_wpk3movq"
```

Master page:

```text
~/MasterPage.master
```

The page title shown in the UI is:

```text
NEW PRODUCT DETAILS
```

The page also displays:

```text
USER :
COUNTER :
```

Therefore product creation happens within the authenticated ERP context.

---

# 3. Product Master UI Fields

The main entry form contains:

| UI Field | Control | Purpose |
|---|---|---|
| Product Code | `TextBox1` | Product identifier |
| Bill Code | `TextBox2` | Billing-related UI value |
| Product Name | `TextBox3` | Product name |
| Print Name | `TextBox4` | Printed product name |
| Product Name Tamil | `TextBox15` | Tamil product name |
| Print Name Tamil | `TextBox16` | Tamil printed name |
| Product Unit | DropDown | Unit |
| Group Name | DropDown | Product group |
| Sub Group Name | DropDown | Product subgroup |
| Floor Name | DropDown | Floor |
| GST Group Name | `TextBox8` | GST classification |
| Discount % | `TextBox10` | Default product discount |
| Commission | `TextBox23` etc. | Commission values |
| HSN CODE | `txtProductHSNCode` | HSN/product HSN |
| Company | `chkcmy` | Company selection |

There is also:

```text
Search By Product Name
Search By Company
Show
Delete
Print
Back
```

---

# 4. Product Code

The product code is the primary business identifier used throughout the application.

The source validates the product code with:

```sql
select *
from newproduct
where code='...'
```

If it already exists:

```text
This Product Code All Ready Saved
```

is displayed.

---

# 5. Product Code Generation

The compiled source contains:

```sql
SELECT ISNULL(
    MAX(CAST(SUBSTRING(code,0,10) AS INT)),
    0
) AS MaxProductNo
FROM newproduct
```

This is significant.

The legacy application extracts the numeric portion of the product code using:

```sql
SUBSTRING(code,0,10)
```

then converts it to:

```text
INT
```

and finds the maximum.

The application uses this value when determining the next product number.

Conceptually:

```text
Existing product codes
       |
       v
Extract numeric prefix/portion
       |
       v
MAX()
       |
       v
Next product number
```

This is different from the Company/Branch pattern where the code was explicitly shown as `MAX + 1` in the query itself.

---

# 6. Product Code Design Implication

The database stores:

```text
code
```

as a value that is converted to integer for ordering and maximum calculations.

Examples of source queries:

```sql
ORDER BY CAST(code AS int)
```

and:

```sql
ORDER BY CAST(code AS INT) asc
```

Therefore the primary product-code population is expected to be numerically sortable.

For the new ERP:

```text
product_id
```

should be the internal immutable primary key, while:

```text
product_code
```

should be a business-visible unique code.

---

# 7. Product Name Validation

The source checks:

```sql
select *
from newproduct
where name='...'
```

and displays:

```text
This Product Name All Ready Saved
```

when a duplicate product name is detected.

There is also a company-specific listing:

```sql
select *
from newproduct
where cmy_name=@cmy_name
and name=@name
ORDER BY CAST(code AS int) asc
```

This is important because the application can treat the same product name differently by company.

---

# 8. Product Name Search

The page supports product-name searching.

Confirmed query pattern:

```sql
select name
from newproduct
where name LIKE ''+@SearchEmpName+'%'
```

and company-specific:

```sql
select name
from newproduct
where name LIKE ''+@SearchEmpName+'%'
and cmy_name=@cmy_name
ORDER BY CAST(code AS int)
```

This is used by autocomplete/search controls.

---

# 9. Product Code Search

The application uses:

```sql
select *
from newproduct
where code = '...'
```

and:

```sql
select *
from newproduct
where code='...'
```

Other screens retrieve:

```sql
select unit_de,name
from newproduct
where code='...'
```

Therefore Product Code is used as a lookup key throughout the ERP.

---

# 10. Product Name → Company Resolution

The source contains:

```sql
select cmy_name
from newproduct
where name=@ProductName
```

Other compiled modules use:

```sql
select N1.cmy_name
from newproduct as N1
inner join status1 as S1
    on S1.cmy_name=N1.cmy_name
inner join welcome as w1
    on w1.status=S1.cmy_status
where N1.name=@ProductName
```

This shows that product name can be used to resolve the company context.

For the new ERP, this should preferably be reversed:

```text
product_id
    ↓
company_id
```

rather than resolving company by product name.

---

# 11. Print Name

The Product Master contains:

```text
Print Name
```

database field:

```text
print_name
```

The source retrieves it using:

```sql
SELECT distinct name,print_name
FROM newproduct
WHERE name='...'
```

The printed product name is therefore distinct from the internal product name.

---

# 12. Tamil Product Names

The product table stores:

```text
PnameTamil
PrintNameTamil
```

The UI fields are:

```text
Product Name(Tamil)
Print Name(Tamil)
```

JavaScript helpers copy values between normal and print-name fields.

This supports:

```text
Internal Product Name
        +
Printed Product Name
        +
Tamil Product Name
        +
Tamil Printed Product Name
```

The new ERP should retain these as separate fields if Tamil billing/printing remains required.

---

# 13. Unit

The Product Master loads units from:

```text
prounit
```

Confirmed:

```sql
SELECT name_eng
FROM prounit
```

The dropdown initially shows:

```text
--Select Unit--
```

The source validates:

```text
Please Select the Unit
```

before product creation.

Therefore:

```text
prounit
    |
    v
newproduct.unit_de
```

is a confirmed master-to-product relationship.

---

# 14. Product Unit Field

The Product table field is:

```text
unit_de
```

It is used by many transaction queries.

Example:

```sql
select name,code,unit_de
from newproduct
where cmy_name='...'
```

and:

```sql
select unit_de,name
from newproduct
where code='...'
```

Sales also retrieve product unit when constructing billing rows.

---

# 15. Group

The Product Master loads:

```sql
SELECT name_eng
FROM progroup
```

The dropdown shows:

```text
--Select Group Name--
```

Product table field:

```text
group_name
```

Therefore:

```text
progroup.name_eng
        ↓
newproduct.group_name
```

---

# 16. Sub Group

The Product Master loads:

```sql
SELECT name_eng
FROM prosubgroup
```

Product table field:

```text
sub_group_name
```

Therefore:

```text
prosubgroup.name_eng
        ↓
newproduct.sub_group_name
```

---

# 17. Floor

The Product Master loads:

```sql
SELECT name_eng
FROM foolerdetail
```

The UI shows:

```text
--Select Floor Name--
```

Product table field:

```text
floor_name
```

Therefore:

```text
foolerdetail.name_eng
        ↓
newproduct.floor_name
```

This is a direct confirmed relationship.

---

# 18. Floor Validation

The compiled code contains:

```sql
SELECT name_eng
FROM foolerdetail
WHERE name_eng='...'
```

So the selected floor is validated against the Floor Master.

---

# 19. GST Group

The Product Master has:

```text
GST Group Name
```

and validates it using:

```sql
select *
from gstgroup
where gst_name=@gstgroupname
```

If invalid:

```text
Please Enter the Correct GST Group Name
```

Therefore:

```text
gstgroup
   |
   v
newproduct.gst_group
```

is another confirmed master relationship.

---

# 20. HSN

The UI contains:

```text
HSN CODE
```

with:

```text
txtProductHSNCode
```

The Product table has both:

```text
hsn_code
ProductHSNCode
```

The main insert includes both:

```sql
hsn_code,
...
ProductHSNCode
```

This distinction is important.

The legacy schema has two HSN-related fields, and they should not automatically be merged during migration without checking which downstream modules use each field.

---

# 21. HSN Usage

Other application queries retrieve:

```sql
select DISTINCT(ProductHSNCode)
from newproduct
where name='...'
```

and:

```sql
select ProductHSNCode
from newproduct
where name='...'
```

The application also retrieves:

```sql
select print_name,PnameTamil,PrintNameTamil
from newproduct
where hsn_code='...'
```

Therefore both HSN fields are used in different contexts.

---

# 22. Company Selection

The Product Master contains:

```text
Company
```

as:

```text
CheckBoxList ID="chkcmy"
```

The source loads companies from:

```sql
SELECT cmy_name_eng
FROM companydetail
```

and also:

```sql
SELECT cmy_name_tam
FROM companydetail
```

Therefore Product creation depends on Company Master.

---

# 23. Company → Product

The final product record contains:

```text
cmy_name
```

The insert is:

```sql
insert into newproduct
(
    ...
    cmy_name,
    ...
)
values
(
    ...
    @cmy_name,
    ...
)
```

This means the same product-code namespace can potentially contain company-specific products.

The application commonly queries:

```sql
where cmy_name=@cmy_name
```

when listing products.

---

# 24. Product Status / Company Status

Many transaction screens join Product with:

```text
status1
```

and:

```text
welcome
```

Example:

```sql
select N1.name,N1.code,N1.unit_de
from newproduct as N1
inner join status1 as S1
    on S1.cmy_name=N1.cmy_name
inner join welcome as w1
    on w1.status=S1.cmy_status
where N1.code=@Code
```

This means product availability/visibility in some screens can depend on company status.

The Product Master itself stores:

```text
cmy_name
```

but company operational status is maintained elsewhere.

---

# 25. Discount

The Product Master contains:

```text
Discount %
```

stored as:

```text
discount
```

The insert includes:

```sql
discount=@discount
```

The field is later retrieved by sales/billing modules.

Example:

```sql
select discount
from newproduct
where name='...'
```

and:

```sql
select discount,group_name,floor_name,qty
from newproduct
where code='...'
```

Therefore Product Master can provide a default product-level discount.

---

# 26. Commission

The Product Master stores:

```text
com_per
com_amt
commission
```

The insert is:

```sql
insert into newproduct
(
    com_per,
    com_amt,
    commission,
    ...
)
```

The UI contains:

```text
Commission
%
```

and JavaScript functions:

```text
comm()
comm1()
```

calculate/display commission-related values.

The system also has separate commission modules, so these fields should be interpreted as **product-level defaults/attributes**, not necessarily the complete commission engine.

---

# 27. Brand

Brand is not part of the main `newproduct` insert.

Instead, Brand is maintained as a separate master:

```text
brand
```

and appears extensively in purchase, barcode, stock and reporting data.

This is a critical architectural point.

The Product Master itself does not insert:

```text
brand
```

into `newproduct`.

Therefore the legacy system may associate Brand at transaction/barcode level rather than strictly at Product Master level, depending on product category/workflow.

---

# 28. Pattern / Color / Size / Style

Similarly, the main `newproduct` table insert does not contain:

```text
pattern
color
size
style
```

Yet these fields are present in sales and stock transaction structures.

For example, sales rows can contain:

```text
design
brand
patrn
size
color
style
```

and stock/purchase details also contain these attributes.

This means the legacy architecture distinguishes:

```text
Product Master identity
```

from:

```text
Transaction/barcode-level textile attributes
```

This distinction is extremely important for the new ERP.

---

# 29. Product vs Barcode-Level Attributes

The architecture can be understood as:

```text
PRODUCT
 ├── Code
 ├── Name
 ├── Unit
 ├── Group
 ├── Subgroup
 ├── Floor
 ├── GST Group
 ├── Company
 ├── HSN
 ├── Discount
 └── Commission
```

while barcode/transaction records may additionally carry:

```text
Brand
Pattern
Color
Size
Style
Design
MRP
Rate
Purchase Rate
Net Rate
```

Therefore the physical sellable SKU/barcode can be richer than the basic Product Master.

---

# 30. Product Master Save Flow

The confirmed logical sequence is:

```text
Open newproduct.aspx
        |
        v
Load user + counter
        |
        v
Load Unit master
        |
        v
Load Group master
        |
        v
Load Subgroup master
        |
        v
Load Floor master
        |
        v
Load Company master
        |
        v
Enter Product Details
        |
        v
Validate required fields
        |
        v
Validate GST Group
        |
        v
Validate Product Code uniqueness
        |
        v
Validate Product Name uniqueness
        |
        v
Determine Product Code
        |
        v
INSERT newproduct
        |
        v
Refresh Product list
```

---

# 31. Product Save Validation

Confirmed validation messages include:

```text
Enter The Product Details
Please Check the Company Name
Please Select the Unit
Please Enter the GST Group Name
Please Enter the Correct GST Group Name
This Product Code All Ready Saved
This Product Name All Ready Saved
```

Therefore the save operation is not a simple insert.

---

# 32. Required Business Inputs

At minimum, the source expects:

```text
Product details
Company
Unit
GST Group
Product Code
Product Name
```

Group/Subgroup/Floor are also part of the product record.

The exact required/optional status of every field should be confirmed by executing the original UI or decompiling `save_Click`.

---

# 33. Product Insert

The definitive insert is:

```sql
insert into newproduct
(
    com_per,
    com_amt,
    commission,
    code,
    hsn_code,
    name,
    print_name,
    group_name,
    sub_group_name,
    floor_name,
    gst_group,
    cmy_name,
    discount,
    date,
    unit_de,
    PnameTamil,
    PrintNameTamil,
    ProductHSNCode
)
values
(
    @com_per,
    @com_amt,
    @commission,
    @code,
    @hsn_code,
    @name,
    @print_name,
    @group_name,
    @sub_group_name,
    @floor_name,
    @gst_group,
    @cmy_name,
    @discount,
    @date,
    @unit_de,
    @PnameTamil,
    @PrintNameTamil,
    @ProductHSNCode
)
```

---

# 34. Product Record After Save

The resulting logical record is:

```text
newproduct
│
├── code
├── name
├── print_name
├── PnameTamil
├── PrintNameTamil
├── unit_de
├── group_name
├── sub_group_name
├── floor_name
├── gst_group
├── cmy_name
├── hsn_code
├── ProductHSNCode
├── discount
├── com_per
├── com_amt
├── commission
└── date
```

---

# 35. Product Update Flow

The page supports:

```text
Search
   ↓
Load product
   ↓
Edit
   ↓
Update
```

The confirmed update is:

```sql
update newproduct
set
    com_per=@com_per,
    com_amt=@com_amt,
    commission=@commission,
    code=@code,
    hsn_code=@hsn_code,
    name=@name,
    print_name=@print_name,
    group_name=@group_name,
    sub_group_name=@sub_group_name,
    floor_name=@floor_name,
    gst_group=@gst_group,
    cmy_name=@cmy_name,
    discount=@discount,
    date=@date,
    unit_de=@unit_de,
    PnameTamil=@PnameTamil,
    PrintNameTamil=@PrintnameTamil,
    ProductHSNCode=@ProductHSNCode
where code=@code
and cmy_name=@cmy_name
```

The update key is therefore:

```text
code + cmy_name
```

not just Product Code.

---

# 36. Product Delete

The source has:

```sql
delete from newproduct
where code=@code
and cmy_name=@cmy_name
```

However, the application first checks whether the product has already been purchased.

Confirmed query:

```sql
select top(1) *
from purentrydetails
where code=@code
```

If a purchase exists:

```text
This Product Name is Already Purchase.So Not Deleted
```

is displayed.

This is an important business rule.

---

# 37. Product Delete Business Rule

The effective rule is:

```text
Product
   |
   v
Check purentrydetails
   |
   +-- purchase exists --> DELETE BLOCKED
   |
   +-- no purchase -----> delete newproduct
```

This protects historical transaction references.

For the new ERP, this should become:

```text
is_active = false
```

rather than physical deletion.

---

# 38. Product Search / View

The main list uses:

```sql
select *
from newproduct
ORDER BY CAST(code AS int) asc
```

Company-filtered:

```sql
select *
from newproduct
where cmy_name=@cmy_name
ORDER BY CAST(code AS int) asc
```

This means the Product Master is primarily displayed by numeric Product Code.

---

# 39. Product Count / Code Context

The UI contains:

```text
ProductCount
```

and code-generation SQL:

```sql
SELECT ISNULL(
    MAX(CAST(SUBSTRING(code,0,10) AS INT)),
    0
) AS MaxProductNo
FROM newproduct
```

This is likely used to show or calculate product numbering.

The exact displayed counter behavior should be verified from the compiled `save_Click`/page-load methods.

---

# 40. Product Master → Purchase

Purchase screens retrieve Product Master records using:

```sql
select name,code,unit_de
from newproduct
where cmy_name='...'
```

and:

```sql
select code,name,unit_de
from newproduct
where cmy_name='...'
```

Therefore Product Master is the source for:

```text
Product Code
Product Name
Unit
Company
```

during purchase entry.

---

# 41. Product Master → Purchase Detail

Purchase detail rows contain Product Code and Product-related fields.

The legacy purchase detail structure can carry:

```text
code
product name
unit
brand
pattern
size
color
style
rackno
model
fashion
```

Therefore Product Master supplies the core identity while purchase entry can enrich the transaction with textile-specific attributes.

---

# 42. Product Master → Barcode

Barcode workflows use Product Code/Product Name as core lookup information.

Typical relationship:

```text
newproduct
   |
   +-- code
   +-- name
   +-- unit
   +-- company
   +-- group
   +-- floor
   |
   v
Purchase / Barcode Creation
   |
   v
Barcode record
```

The detailed barcode lifecycle is documented separately in:

```text
11_barcode.md
```

and:

```text
13_barcode_printing.md
```

---

# 43. Product Master → Stock

Stock queries use Product Code and Product Name.

The stock system can additionally hold:

```text
brand
pattern
size
color
style
rackno
model
fashion
```

Therefore:

```text
Product Master
      |
      v
Stock transaction
      |
      +--> Product identity
      +--> Location attributes
      +--> Textile attributes
      +--> Barcode
```

---

# 44. Product Master → Sales

Sales lookup uses:

```sql
select *
from newproduct
where code='...'
```

and:

```sql
select *
from newproduct
where name='...'
```

The billing record then stores a snapshot of Product information.

Confirmed sales insert patterns include:

```sql
insert into salbill
(
    unit,
    sn,
    slman,
    barcode,
    code,
    p_name,
    mrp,
    rate,
    ...
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
    ...
)
values (...)
```

Therefore the sales transaction stores Product Master values plus barcode/textile attributes.

---

# 45. Product Master → Sales Snapshot

This is important for historical transactions.

A sale stores:

```text
code
p_name
unit
mrp
rate
prate
nrate
gst
discount
brand
pattern
size
color
style
```

Therefore changing Product Master later does not necessarily mean the historical sale will automatically change.

This is the correct behavior to preserve in the new ERP.

---

# 46. Product Master → Discount

Product-level default discount comes from:

```text
newproduct.discount
```

Separate discount modules can then apply:

```text
Product Discount
Barcode Discount
Date-wise Discount
Offer Discount
Bill Discount
```

The Product Master should therefore be considered the **base/default product discount**, not the complete discount engine.

---

# 47. Product Master → Commission

Product Master has:

```text
com_per
com_amt
commission
```

but the system also contains separate:

```text
ProductWiseCommission
BarcodeWiseCommission
RangeWiseCommission
Salesman Commission
```

Therefore the full commission calculation is distributed across multiple modules.

---

# 48. Product Master → Reports

Product attributes are used in reports for:

```text
Product
Group
Subgroup
Floor
Company
Unit
HSN
Brand
Pattern
Size
Color
Style
```

Examples of report families in the archive include:

```text
ProductBrandWise
PatternAndSizeWiseStockReportQty
PatternAndSizeWiseSalesReport
FloorWiseCurrentStock
SupplierPatternandSizeWiseStockReportQty
```

Therefore Product Master is one of the primary dimensions of the reporting layer.

---

# 49. Product Master → Product-Wise Rack

Rack is maintained separately through:

```text
ProductWiseRack.aspx
```

and:

```text
productwiserackno
```

The rack record contains:

```text
pcode
pname
rackname
```

So:

```text
newproduct.code
        |
        v
productwiserackno.pcode
```

is the logical relationship.

Rack is therefore not stored directly in the main `newproduct` insert.

---

# 50. Product Name With Rate

The archive contains:

```text
ProductNameWithRateEntry.aspx
```

This is a separate product/rate workflow.

It should not be confused with:

```text
newproduct.aspx
```

The main Product Master defines identity and base attributes.

The Product Name With Rate screen is an additional commercial/rate maintenance function.

---

# 51. Product Rate

The archive also contains:

```text
newproductRateEntry.aspx
```

Therefore rate maintenance is separated from the core Product Master.

This is important because:

```text
Product Master
```

and:

```text
Product Rate
```

are not necessarily the same business object in TextileSoft.

Purchase rate, MRP, net rate and barcode rate are handled by other modules.

---

# 52. Specialized Product Masters

The archive contains variants:

```text
Retailnewproduct.aspx
GroceryNewProductEntry.aspx
giftnewproduct.aspx
newProductCommission.aspx
newProductWithoutCommission.aspx
```

These are specialized product workflows built around the same general concept.

They should not automatically be merged into one new ERP screen without checking their table/field differences.

---

# 53. Product Master Relationship Diagram

```text
                         COMPANY
                            |
                            v
                       newproduct
                            |
       +--------------------+---------------------+
       |          |         |          |           |
       v          v         v          v           v
     UNIT       GROUP    SUBGROUP    FLOOR       GST GROUP
       |          |         |          |           |
       +----------+---------+----------+-----------+
                            |
                            v
                       PRODUCT CODE
                            |
              +-------------+-------------+
              |                           |
              v                           v
          PURCHASE                     BARCODE
              |                           |
              v                           v
         STOCK DETAILS                LABEL
              |                           |
              +-------------+-------------+
                            |
                            v
                           SALES
                            |
                            v
                         REPORTS
```

---

# 54. More Detailed End-to-End Flow

```text
USER LOGIN
   |
   v
COUNTER CONTEXT
   |
   v
newproduct.aspx
   |
   +--> Load Company
   +--> Load Unit
   +--> Load Group
   +--> Load Subgroup
   +--> Load Floor
   +--> GST Group validation source
   |
   v
USER ENTERS PRODUCT
   |
   +--> Product Code
   +--> Product Name
   +--> Print Name
   +--> Tamil Names
   +--> Unit
   +--> Group
   +--> Subgroup
   +--> Floor
   +--> GST Group
   +--> HSN
   +--> Discount
   +--> Commission
   +--> Company
   |
   v
VALIDATION
   |
   +--> Product details
   +--> Company
   +--> Unit
   +--> GST group
   +--> Product code duplicate
   +--> Product name duplicate
   |
   v
PRODUCT CODE DETERMINATION
   |
   v
INSERT newproduct
   |
   v
PRODUCT MASTER
   |
   +--> Purchase
   |
   +--> Barcode
   |
   +--> Stock
   |
   +--> Sales
   |
   +--> Discount
   |
   +--> Commission
   |
   +--> Rack
   |
   +--> Reports
```

---

# 55. Product Lifecycle

A product does not end at creation.

The practical lifecycle is:

```text
CREATE
  ↓
MASTER DATA
  ↓
PURCHASE
  ↓
BARCODE / SKU
  ↓
STOCK
  ↓
TRANSFER
  ↓
SALE
  ↓
RETURN
  ↓
REPORTING
```

Product Master is therefore the **root identity layer**.

---

# 56. Critical Product Identity Rule

The legacy system uses:

```text
code + cmy_name
```

for important Product Master operations.

Update:

```sql
where code=@code
and cmy_name=@cmy_name
```

Delete:

```sql
where code=@code
and cmy_name=@cmy_name
```

This means Product Code alone should not be assumed globally unique across all companies.

For migration:

```text
UNIQUE(company_id, product_code)
```

should be considered if the business rules confirm company-specific numbering.

---

# 57. Product Name Uniqueness

The legacy application checks:

```text
name
```

and also:

```text
cmy_name + name
```

in different contexts.

Therefore the new ERP should decide explicitly whether:

```text
Product Name
```

must be globally unique or only unique within:

```text
Company
```

The source does not consistently enforce this at database-constraint level.

---

# 58. Hard Delete Protection

The product cannot be deleted once it appears in:

```text
purentrydetails
```

The check is:

```sql
select top(1) *
from purentrydetails
where code=@code
```

Then:

```text
This Product Name is Already Purchase.So Not Deleted
```

This is a business-protection rule.

---

# 59. Recommended New ERP Delete Rule

Do not physically delete a product.

Use:

```text
products.is_active = 0
```

and preserve:

```text
created_at
updated_at
deactivated_at
deactivated_by
```

This is safer for:

```text
Purchase history
Sales history
Barcode history
Stock history
Reports
Audit
```

---

# 60. Legacy Code Generation Risk

The source uses:

```sql
MAX(...)
```

to derive product numbering.

This can create race conditions:

```text
User A                  User B
   |                       |
MAX(code) = 100         MAX(code) = 100
   |                       |
next = 101              next = 101
   |                       |
INSERT 101              INSERT 101
```

The new ERP should use:

```text
IDENTITY
```

or:

```text
SEQUENCE
```

or a transaction-safe number generator.

---

# 61. SQL Injection Risk

Some legacy Product Master queries are constructed using string concatenation.

Examples include patterns like:

```sql
select *
from newproduct
where name LIKE ''+@SearchEmpName+'%'
```

and:

```sql
select *
from newproduct
where code='...'
```

The new ERP should use parameterized SQL exclusively.

---

# 62. Product Master Data Model for New ERP

A normalized design can be:

```text
products
├── id
├── company_id
├── product_code
├── product_name
├── print_name
├── product_name_tamil
├── print_name_tamil
├── unit_id
├── group_id
├── subgroup_id
├── floor_id
├── gst_group_id
├── hsn_code
├── product_hsn_code
├── default_discount_percent
├── commission_percent
├── commission_amount
├── commission_type
├── is_active
├── created_at
└── updated_at
```

---

# 63. Separate Textile Attributes

Because the legacy Product Master does not directly store Brand/Pattern/Color/Size/Style, the new ERP should consider:

```text
product_attributes
```

or:

```text
product_variants
```

for:

```text
Brand
Pattern
Color
Size
Style
Design
Model
```

A possible structure:

```text
product_variants
├── id
├── product_id
├── brand_id
├── pattern_id
├── color_id
├── size_id
├── style_id
├── design_id
└── sku/barcode relationship
```

---

# 64. Product vs SKU vs Barcode

The legacy system makes it useful to distinguish three levels:

```text
PRODUCT
    |
    | basic identity
    v
SKU / Variant
    |
    | textile attributes
    v
BARCODE / Physical Piece
```

For example:

```text
Product:
    Saree

Variant:
    Brand = X
    Pattern = Y
    Color = Red
    Size = Free

Physical barcode:
    890xxxxxxxx
```

The exact legacy barcode relationship should be taken from the barcode module, but this separation is important for migration analysis.

---

# 65. Product Master and Barcode Creation

The Product Master does **not itself generate the physical barcode**.

Instead:

```text
Product Master
      |
      v
Purchase / Barcode workflow
      |
      v
Barcode creation
      |
      v
Barcode label
```

Therefore barcode creation should not be embedded into the new Product Master service.

---

# 66. Product Master and Stock

Product Master establishes:

```text
What is the item?
```

Stock establishes:

```text
How much exists?
Where is it?
Which barcode?
Which purchase?
```

So:

```text
Product Master
≠
Stock
```

The new ERP should maintain this separation.

---

# 67. Product Master and Purchase

Purchase establishes:

```text
When/where/how was the product acquired?
```

Product Master establishes:

```text
What is the product?
```

Therefore:

```text
Product
    |
    +--> Purchase lines
    |
    +--> Barcode
    |
    +--> Stock
```

---

# 68. Product Master and Sales

Sales should normally snapshot transaction-relevant values:

```text
Product Name
Rate
MRP
GST
Discount
Barcode
```

This prevents historical invoices from changing when Product Master is later edited.

The legacy `salbill` insert demonstrates this snapshot-like design.

---

# 69. Product Master and Reports

The report architecture depends heavily on Product Master fields.

The following dimensions are represented:

```text
Product Code
Product Name
Group
Subgroup
Floor
Company
Unit
HSN
```

Additional transaction/barcode dimensions include:

```text
Brand
Pattern
Color
Size
Style
Rack
```

Therefore reporting is effectively:

```text
Product Master dimensions
+
Transaction/SKU dimensions
```

---

# 70. Source Files / Assemblies Traced

## Main Product Master

```text
newproduct.aspx
```

Compiled as:

```text
App_Web_wpk3movq.dll
```

## Related product pages

```text
Retailnewproduct.aspx
GroceryNewProductEntry.aspx
giftnewproduct.aspx
newproductRateEntry.aspx
ProductNameWithRateEntry.aspx
newProductCommission.aspx
newProductWithoutCommission.aspx
ProductWiseRack.aspx
```

## Product master dependencies

```text
companydetail
prounit
progroup
prosubgroup
foolerdetail
gstgroup
brand
productwiserackno
status1
welcome
```

## Major downstream tables

```text
purentrydetails
stockdetails
salbill
```

---

# 71. Confirmed vs Inferred

## Confirmed directly

| Area | Evidence |
|---|---|
| Main Product Master page | `newproduct.aspx` |
| Compiled class | `newproduct` |
| Assembly | `App_Web_wpk3movq.dll` |
| Main table | `newproduct` |
| Product insert | Confirmed SQL |
| Product update | Confirmed SQL |
| Product delete | Confirmed SQL |
| Product code validation | Confirmed |
| Product name validation | Confirmed |
| Unit master | `prounit` |
| Group master | `progroup` |
| Subgroup master | `prosubgroup` |
| Floor master | `foolerdetail` |
| GST group validation | `gstgroup` |
| Company source | `companydetail` |
| Product delete protection | `purentrydetails` |
| Product-to-rack mechanism | `productwiserackno` |
| Sales Product lookup | `newproduct` |
| Purchase Product lookup | `newproduct` |

## Requires deeper tracing

| Area | Status |
|---|---|
| Exact `save_Click` C# control flow | Compiled |
| Exact product-code assignment after `MaxProductNo` | Compiled |
| Exact behavior of Bill Code `TextBox2` | UI confirmed, not part of main insert |
| Complete database schema | Not included |
| Exact Product → Barcode foreign key | Separate barcode tracing required |
| Exact Product → Stock posting logic | Separate stock tracing required |
| Exact Brand/Pattern/Size ownership | Distributed across transaction/barcode modules |

---

# 72. Final End-to-End Architecture

```text
                    COMPANY MASTER
                         |
                         v
                  newproduct.aspx
                         |
          +--------------+--------------+
          |              |              |
          v              v              v
        UNIT           GROUP         SUBGROUP
          |              |              |
          +--------------+--------------+
                         |
              +----------+----------+
              |                     |
              v                     v
            FLOOR               GST GROUP
              |                     |
              +----------+----------+
                         |
                         v
                 PRODUCT MASTER
                  newproduct
                         |
       +-----------------+------------------+
       |                 |                  |
       v                 v                  v
   PURCHASE           BARCODE             RACK
       |                 |                  |
       v                 v                  v
  purentrydetails   Barcode/SKU       productwiserackno
       |                 |                  |
       +-----------------+------------------+
                         |
                         v
                    STOCK DETAILS
                         |
                         v
                       SALES
                         |
                         v
                      salbill
                         |
                         v
                       REPORTS
```

---

# 73. Final Conclusion

The TextileSoft Product Master is the **root item identity layer**, but it is deliberately narrower than the complete sellable SKU/barcode record.

The confirmed Product Master stores:

```text
Code
Name
Print Name
Tamil Names
Unit
Group
Subgroup
Floor
GST Group
Company
HSN
Discount
Commission
Date
```

The richer textile attributes:

```text
Brand
Pattern
Color
Size
Style
Design
Model
Rack
```

are distributed into other modules and transaction/barcode structures.

The most important end-to-end relationship is:

```text
COMPANY
   ↓
PRODUCT MASTER
   ↓
PURCHASE
   ↓
BARCODE / SKU
   ↓
STOCK
   ↓
SALES
   ↓
RETURN / TRANSFER
   ↓
REPORTING
```

For the new SQL ERP, Product Master should therefore be designed as a stable master entity, while **SKU/variant, barcode, stock and transaction records should remain separate entities**.

The legacy `newproduct` table should not simply be copied as the final new ERP product schema.
