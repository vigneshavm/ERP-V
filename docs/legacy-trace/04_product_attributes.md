# TextileSoft Module Documentation

**Source:** `TEXTILESOFT 17.07.2025`  
**Module:** Product Attributes / Product Classification / Product-Wise Location  
**Primary application:** Legacy ASP.NET WebForms application  
**Purpose:** End-to-end trace of Brand, Pattern, Size, Color, Style, Design, Model, Fashion, Rack, Floor and related product classification attributes.

> **Trace note:** TextileSoft is a legacy ASP.NET WebForms application. A significant amount of server-side logic is compiled into `App_Web_*.dll` assemblies. Therefore, this document distinguishes **confirmed source-level behavior** from **inferred business relationships**. Where the uploaded source does not expose an exact SQL statement or table definition, that is stated explicitly instead of inventing a mapping.

---

# 1. Executive Summary

The TextileSoft product model has two different layers that must not be confused during ERP migration:

1. **Product Master identity** in `newproduct`.
2. **Product attributes / sellable-detail dimensions** used mainly by purchase, barcode, stock, sales and reports.

The core `newproduct` table stores the product identity and general classification such as:

- Product Code
- Product Name
- Print Name
- Tamil Product Name
- Unit
- Group
- Sub Group
- Floor Name
- GST Group
- Company
- HSN
- Discount
- Commission

However, the main `newproduct` INSERT traced from `App_Web_wpk3movq.dll` does **not** insert the following textile attributes:

- Brand
- Pattern
- Color
- Size
- Style
- Design
- Model
- Fashion
- Rack

Those attributes appear in purchase-entry grids and downstream transaction structures. The purchase UI explicitly contains fields for:

```text
brand
patrn       -> Pattern
size
color
style
design
model
rackno
fashion
```

The same purchase screens provide autocomplete/search behavior for Brand, Pattern, Size, Color, Style, Design, Model, Rack and Fashion.

This means the legacy architecture is closer to:

```text
Product Master
    |
    | product code + product name
    v
Purchase line / barcode / stock detail
    |
    +-- Brand
    +-- Pattern
    +-- Size
    +-- Color
    +-- Style
    +-- Design
    +-- Model
    +-- Fashion
    +-- Rack
    |
    v
Sales / Stock / Reports
```

The migration implication is important: **these attributes should not automatically be added as columns to the new `products` table.** They should normally be modeled as controlled dimensions or SKU/variant attributes, depending on whether the attribute identifies the sellable item.

---

# 2. Scope of This Module

This document covers the identified product-related dimensions and their end-to-end movement through the application.

| Attribute | Legacy representation | Main usage | Product Master column? |
|---|---|---|---|
| Brand | `brand` | Purchase, sales, stock, reports | No in core insert |
| Pattern | `patrn` / `pattern` | Purchase, sales, stock, reports | No |
| Size | `size` | Purchase, sales, stock, reports | No |
| Color | `color` | Purchase, sales, stock, reports | No |
| Style | `style` | Purchase, sales, stock, reports | No |
| Design | `design` | Purchase, sales, stock, reports | No |
| Model | `model` | Purchase / specialized product detail | No |
| Fashion | `fashion` | Purchase / product-wise classification | No |
| Rack | `rackno` / `rackname` | Stock location / product-wise rack | No |
| Floor | `floor_name` | Product classification and stock/reporting | Yes, in legacy `newproduct` |
| Design Model | Separate design-model area | Design classification | No in core `newproduct` insert |
| Design Model Group | Separate master | Design grouping | No in core `newproduct` insert |

---

# 3. Core Architectural Distinction

## 3.1 Product identity

The Product Master defines the reusable product identity:

```text
Company
   + Product Code
   + Product Name
   + Unit
   + Group
   + Sub Group
   + GST / HSN
   + pricing / discount / commission defaults
```

## 3.2 Product attributes

The transaction layer adds physical/commercial characteristics:

```text
Product Code
    + Brand
    + Pattern
    + Size
    + Color
    + Style
    + Design
    + Model
    + Fashion
    + Rack
```

## 3.3 Sellable SKU / barcode

A barcode-level item can therefore represent a more specific combination than the Product Master.

Example:

```text
Product:
  Saree - Cotton Printed

Transaction/SKU detail:
  Brand   = ABC
  Pattern = Floral
  Color   = Blue
  Size    = 6.30 M
  Style   = Printed
  Design  = D102
  Rack    = R-04
  Barcode = 890xxxx
```

This is why attributes must be traced separately from `03_product_item_master.md`.

---

# 4. Attribute Master Pages Identified

The archive contains dedicated master pages for several attributes.

## 4.1 Brand

Page:

```text
purbrand.aspx
```

Compiled class:

```text
purbrand, App_Web_wpk3movq
```

UI title:

```text
Brand Detail
```

Visible concepts include:

- Brand Code
- Brand Name
- Print Name
- Commission
- Discount %
- Save
- Update
- Search
- View
- Delete
- Print

The grid uses fields such as:

```text
group_cd
name_eng
name_tam
prin_name_eng
prin_name_tam
com_per
com_pic
commission / amount-related fields
discount
```

The exact backend table name is not safely exposed in the page markup and was not present as a matching table definition in the supplied `table.sql`; therefore the master table name should be confirmed against the live database before migration.

---

# 5. Pattern Master

Page:

```text
purpattern.aspx
```

Compiled class:

```text
purpattern, App_Web_tw3vpscp
```

UI title:

```text
Pattern Detail
```

The page exposes:

- Pattern Code
- Pattern Name
- Print Name
- Save
- Update
- Search
- View
- Delete
- Print

Grid fields include:

```text
group_cd
name_eng
name_tam
prin_name_eng
prin_name_tam
```

The purchase screen uses the transaction field:

```text
patrn
```

and displays it to the user as:

```text
PATTERN
```

Therefore:

```text
Pattern Master
      |
      v
Purchase row field: patrn
      |
      v
Stock / Sales / Reports
```

---

# 6. Size Master

Page:

```text
pursize.aspx
```

Compiled class:

```text
pursize, App_Web_4qyf2ren
```

UI title:

```text
Size Detail
```

The page is structured similarly to the Pattern master and exposes:

- Size Code
- Size Name
- Print Name
- Save
- Update
- Search
- View
- Delete
- Print

The supplied markup contains a label typo where the code/name captions refer to Color, but the page itself is explicitly titled `Size Detail`. The application should therefore treat the page as the Size master, while migration validation should use actual database values rather than only captions.

The purchase transaction field is:

```text
size
```

---

# 7. Color Master

Page:

```text
purcolor.aspx
```

Compiled class:

```text
purcolor, App_Web_4qyf2ren
```

UI title:

```text
Color Detail
```

The page provides:

- Color Code
- Color Name
- Print Name
- Save
- Update
- Search
- View
- Delete
- Print

The transaction field used by purchase/sales is:

```text
color
```

The purchase page explicitly invokes:

```text
SearchColor(...)
```

for this field.

---

# 8. Style Master

Page:

```text
Purstyle.aspx
```

Compiled class:

```text
Purstyle, App_Web_4qyf2ren
```

UI title:

```text
Style Detail
```

The page provides the same master lifecycle:

```text
Create
  -> Update
  -> Search
  -> View
  -> Delete
  -> Print
```

The purchase transaction field is:

```text
style
```

and the purchase page calls:

```text
SearchStyle(...)
```

---

# 9. Design

Design is present directly in the purchase-entry transaction grid.

The purchase page defines:

```text
TemplateField HeaderText="DESIGN"
SortExpression="design"
```

and the row field is:

```text
ID="design"
name="design"
Bind("design")
```

The UI invokes:

```text
SearchDesign(...)
```

The source also contains a dedicated Design Model module:

```text
DesignModelEntry.aspx
DesignModelView.aspx
DesignModelGroupName.aspx
```

Therefore the application has both a simple transaction-level `design` field and a more specialized Design Model classification area.

The exact database normalization between `design`, Design Model and Design Model Group is not completely exposed by the markup supplied and should be validated before creating migration foreign keys.

---

# 10. Design Model

Page:

```text
DesignModelEntry.aspx
```

Title:

```text
DESIGN MODEL ENTRY
```

Related page:

```text
DesignModelView.aspx
```

This indicates a separate design-model master/maintenance workflow rather than a simple free-text field only.

The migration should therefore check whether existing data uses:

```text
Product -> Design Model
```

or:

```text
Purchase/SKU -> Design Model
```

before deciding whether `design_model_id` belongs on `products` or `product_variants`.

---

# 11. Design Model Group

Page:

```text
DesignModelGroupName.aspx
```

The page exposes fields including:

```text
code
groupName
ID
```

and supports deletion and maintenance.

This establishes a separate grouping concept for design models.

Recommended logical relationship for the new ERP:

```text
Design Model Group
        |
        +---- Design Model
                    |
                    +---- Product Variant / SKU
```

This is a migration recommendation, not a claim that the legacy database already uses these exact foreign keys.

---

# 12. Model Number

The purchase-entry pages explicitly contain a hidden transaction field:

```text
HeaderText="MODEL"
SortExpression="model"
```

with:

```text
ID="model"
name="model"
Bind("model")
```

and JavaScript search:

```text
SearchModel()
```

The field is marked as a hidden grid column in the source UI.

This is significant because the field exists in the transaction model even though the operator may not see it in the normal purchase grid.

Migration decision:

- If Model identifies a product variant, keep it at SKU/variant level.
- If Model is a product-wide classification, it may be a Product Master dimension.
- Do not assume either case without checking the data distribution.

---

# 13. Fashion Name

The purchase-entry pages contain:

```text
HeaderText="FASHION"
SortExpression="fashion"
```

and:

```text
ID="fashion"
name="fashion"
Bind("fashion")
```

The field is hidden in the standard purchase grid but is populated through search behavior.

The source includes a dedicated page:

```text
ProductWiseFashionName.aspx
```

This page is especially important because it associates Fashion Name with a Product.

The page fields are:

```text
Code
Product Name
Fashion Name
```

and the grid fields are:

```text
pcode
pname
fashionname
```

This is evidence of a product-wise mapping layer rather than merely a transaction-only free-text value.

Logical legacy relationship:

```text
Product Code
    |
    v
ProductWiseFashionName
    |
    +-- Fashion Name
```

This is different from Brand/Pattern/Color/Size/Style, which are visibly entered directly on purchase rows.

---

# 14. Rack Master

Page:

```text
RackNo.aspx
```

UI title:

```text
RackNo Detail
```

The page contains:

- RackNo Code
- RackName Name
- Print Name
- Save
- Update
- Search
- View
- Delete
- Print

The grid fields include:

```text
group_cd
name_eng
name_tam
prin_name_eng
prin_name_tam
```

The purchase transaction field is:

```text
rackno
```

with UI search:

```text
SearchRackno()
```

---

# 15. Product-Wise Rack Mapping

Page:

```text
ProductWiseRack.aspx
```

UI title:

```text
Product Wise RackNo
```

This is not the same thing as the Rack master.

The Product-Wise Rack page contains:

```text
Code
Product Name
Rack No
```

and a Rack checkbox list.

The result grid uses:

```text
pcode
pname
rackname
```

This establishes a product-to-rack mapping concept.

The previously traced source identifies the underlying logical table as:

```text
productwiserackno
```

with fields:

```text
pcode
pname
rackname
```

Logical relationship:

```text
newproduct.code
      |
      v
productwiserackno.pcode
      |
      +---- rackname
```

This should be treated as a location mapping, not as a core Product Master attribute.

---

# 16. Floor

Floor is different from the other attributes because it is directly stored in the core Product Master.

Product Master field:

```text
floor_name
```

Master page:

```text
foolerdetail
```

The exact floor page is part of the company/store/location master area documented in `02_company_branch_store.md`.

Because Floor is stored on `newproduct`, legacy TextileSoft currently treats it more like product classification than the transaction-level Brand/Pattern/Color/Size/Style dimensions.

However, stock/reporting also uses physical location concepts. In the new ERP, Floor should normally be modeled as a location dimension rather than duplicated as arbitrary product text.

---

# 17. Purchase Entry: Attribute Entry Point

The clearest end-to-end entry point for the attributes is the purchase module.

Main source pages include:

```text
NewPurchaseentry.aspx
NewPurchaseentryAdd.aspx
AllGSTNewPurchaseEntry.aspx
AllGSTNewPurchaseEntryAdd.aspx
WRPurchaseEntryNew.aspx
WRPurchaseEntryNewAdd.aspx
WRPurchaseEntryNewUpdate.aspx
```

The same attribute design is repeated across several purchase variants.

The purchase page exposes the following row-level fields:

```text
Product
Product Code
Brand
Pattern
Size
Color
Style
Design
Model
Rack No
Fashion
```

The source markup confirms that these fields are bound to row data rather than only being visual labels.

---

# 18. Purchase Row Attribute Fields

A representative purchase row contains:

```text
brand
patrn
size
color
style
design
model
rackno
fashion
```

The source binding pattern is:

```text
Text='<%# Bind("brand") %>'
Text='<%# Bind("patrn") %>'
Text='<%# Bind("size") %>'
Text='<%# Bind("color") %>'
Text='<%# Bind("style") %>'
Text='<%# Bind("design") %>'
Text='<%# Bind("model") %>'
Text='<%# Bind("rackno") %>'
Text='<%# Bind("fashion") %>'
```

This confirms that the attributes are part of the purchase row data structure.

---

# 19. Purchase UI Search / Autocomplete Flow

The purchase page links directly to the attribute master pages:

```javascript
purbrand.aspx
purpattern.aspx
pursize.aspx
purcolor.aspx
Purstyle.aspx
```

The source uses functions such as:

```text
SearchBrand
SearchPattern
SearchSize
SearchColor
SearchStyle
SearchDesign
SearchModel
SearchRackno
SearchFashion
```

Therefore the normal operator flow is:

```text
Open Purchase Entry
        |
        v
Enter/select Product
        |
        +--> Search Brand
        +--> Search Pattern
        +--> Search Size
        +--> Search Color
        +--> Search Style
        +--> Search Design
        +--> Search Model
        +--> Search Rack
        +--> Search Fashion
        |
        v
Save Purchase Row
```

---

# 20. Attribute Master vs Free Text

The legacy application mixes controlled-master behavior and text-entry behavior.

For Brand/Pattern/Size/Color/Style, dedicated maintenance pages exist. The purchase grid still uses text boxes with autocomplete/search.

Therefore the effective legacy pattern is:

```text
Master value
    |
    v
Autocomplete/search
    |
    v
Text field in transaction row
    |
    v
Transaction snapshot
```

This is not necessarily a foreign-key relationship.

For the new ERP, this should be strengthened to:

```text
brand_id
pattern_id
size_id
color_id
style_id
```

with actual FK constraints where the business requires controlled values.

---

# 21. Product-Wise Fashion Flow

Fashion is a special case because the source contains a dedicated product-wise mapping page.

Flow:

```text
Product Master
    |
    | product code
    v
ProductWiseFashionName
    |
    +---- Fashion Name(s)
    |
    v
Purchase / Product lookup
```

The mapping screen allows multiple selections through a checkbox list.

This suggests that one product can be associated with more than one Fashion Name.

Recommended new ERP structure:

```text
fashion
-----
 id
 name
 is_active

product_fashion
-----
 product_id
 fashion_id
```

Do not collapse this into a single `fashion` text column if the business requires multiple Fashion classifications per product.

---

# 22. Product-Wise Rack Flow

Rack follows a similar but physical-location-oriented pattern.

```text
Rack Master
    |
    +---- Rack definitions
    |
    v
ProductWiseRack
    |
    +---- Product Code
    +---- Rack Name
    |
    v
Stock / Purchase / Location reporting
```

The ProductWiseRack UI also uses a checkbox list, so a product can be mapped to multiple racks.

Recommended new ERP structure:

```text
racks
-----
 id
 store_id
 floor_id
 rack_code
 rack_name
 is_active

product_rack
-----
 product_id
 rack_id
```

For a multi-store ERP, the relationship should be scoped to the store/warehouse rather than making a global product-to-rack mapping.

---

# 23. Brand Flow Through the System

```text
Brand Master
    |
    v
Purchase Entry
    |
    | brand
    v
Purchase Detail / SKU
    |
    +------> Barcode
    |
    +------> Stock
    |
    +------> Sales
    |
    +------> Brand-wise Reports
```

The application contains a report page:

```text
ProductBrandWise.aspx
```

which confirms Brand is a reporting dimension.

Brand is therefore not only a display field. It contributes to operational analysis.

---

# 24. Pattern Flow Through the System

```text
Pattern Master
    |
    v
Purchase Entry
    |
    | patrn
    v
Purchase Detail
    |
    +------> Barcode / Stock
    |
    +------> Sales
    |
    +------> Pattern-wise Reports
```

Confirmed report pages include:

```text
PatternAndSizeWiseStockReportQty.aspx
PatternAndSizeWiseSalesReportQty.aspx
SupplierPatternandSizeWiseStockReportQty.aspx
SupplierPatternBrandandSizeWiseStockReportQty.aspx
PatternBrandandSizeWiseStockReportQty.aspx
```

This demonstrates that Pattern is a core reporting dimension.

---

# 25. Size Flow Through the System

Size follows the same transaction path:

```text
Size Master
    |
    v
Purchase Entry
    |
    | size
    v
Purchase Detail / SKU
    |
    +------> Stock
    +------> Sales
    +------> Pattern + Size reports
```

Size is especially important for textile inventory because a product name alone may not identify the exact sellable variation.

---

# 26. Color Flow Through the System

```text
Color Master
    |
    v
Purchase Entry
    |
    | color
    v
Purchase Detail / SKU
    |
    +------> Stock
    +------> Barcode
    +------> Sales
    +------> Reports
```

The source uses `color` as the transaction field.

---

# 27. Style Flow Through the System

```text
Style Master
    |
    v
Purchase Entry
    |
    | style
    v
Purchase Detail / SKU
    |
    +------> Stock
    +------> Sales
    +------> Reports
```

Style is a dimension rather than a core `newproduct` field in the traced Product Master insert.

---

# 28. Design Flow Through the System

```text
Design / Design Model
       |
       v
Purchase Entry
       |
       | design
       v
Purchase Detail / SKU
       |
       +------> Barcode
       +------> Stock
       +------> Sales
       +------> Reports
```

Design therefore participates in item-level differentiation.

---

# 29. Model Flow

```text
Model Master / Model Search
       |
       v
Purchase Entry
       |
       | model
       v
Purchase Detail
       |
       +------> downstream item identification
```

Because the `model` field is hidden in the purchase grid, it may be intended as an auxiliary attribute rather than the primary operator-facing dimension.

Migration should preserve it even if it is not initially displayed in the new UI.

---

# 30. Rack Flow

Rack has two separate concepts:

### 30.1 Rack master

```text
RackNo.aspx
```

defines the rack itself.

### 30.2 Product-to-rack mapping

```text
ProductWiseRack.aspx
```

maps a product to one or more rack names.

### 30.3 Purchase row rack

Purchase contains:

```text
rackno
```

which allows the rack to be associated with a transaction row.

Therefore:

```text
Rack Master
      |
      +------------------+
      |                  |
      v                  v
ProductWiseRack       Purchase Row rackno
      |                  |
      +--------+---------+
               |
               v
             Stock
```

---

# 31. Attribute Persistence Model

The legacy system appears to use two persistence patterns.

## Pattern A: Master value

Example:

```text
Brand Master
Pattern Master
Size Master
Color Master
Style Master
Rack Master
```

The master contains the reusable name/code.

## Pattern B: Transaction snapshot

Purchase rows contain the actual attribute value:

```text
brand
patrn
size
color
style
design
model
rackno
fashion
```

This is important for historical reporting.

A historical purchase should not change merely because a master name is later edited.

If the legacy database stores text snapshots, the new ERP should preserve that historical behavior while adding normalized IDs where possible.

---

# 32. Why Attributes Are Not Product Master Fields

The source provides strong evidence that Brand, Pattern, Size, Color and Style are not part of the core Product Master insert.

The Product Master insert traced from the compiled application is:

```sql
insert into newproduct(
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
values(...)
```

There is no:

```text
brand
pattern
patrn
size
color
style
design
model
rackno
fashion
```

in this core insert.

This is one of the most important findings for ERP redesign.

---

# 33. Product vs Variant Decision

A useful migration rule is:

### Keep at Product Master level when:

The value is common to every sellable occurrence of the product.

Examples:

```text
Product Name
Unit
Group
Subgroup
GST Group
HSN
Company
```

### Keep at Variant/SKU level when:

The value can change between sellable variants of the same product.

Examples:

```text
Brand
Pattern
Color
Size
Style
Design
Model
```

### Keep at Location level when:

The value describes where inventory is stored.

Examples:

```text
Store
Warehouse
Floor
Rack
```

### Keep as Product mapping when:

The product can have multiple classifications.

Example:

```text
Fashion
```

---

# 34. Recommended New ERP Attribute Model

A normalized model can be structured as follows.

```text
products
--------
id
company_id
product_code
product_name
print_name
unit_id
group_id
subgroup_id
gst_group_id
hsn_code
product_hsn_code
floor_id
...

brands
------
id
code
name
print_name
is_active

patterns
--------
id
code
name
print_name
is_active

sizes
-----
id
code
name
print_name
is_active

colors
------
id
code
name
print_name
is_active

styles
------
id
code
name
print_name
is_active

designs
-------
id
code
name
is_active

design_models
------------
id
group_id
code
name
is_active

design_model_groups
-------------------
id
code
name
is_active

fashions
--------
id
name
is_active

racks
-----
id
store_id
floor_id
code
name
is_active
```

Then the sellable SKU/variant can contain:

```text
product_variants
----------------
id
product_id
brand_id
pattern_id
size_id
color_id
style_id
design_id
design_model_id
model_no
...
```

---

# 35. Product-Fashion Mapping in New ERP

Because `ProductWiseFashionName.aspx` allows product-wise Fashion selection, use a junction table:

```text
product_fashion
---------------
product_id
fashion_id
```

Do not force a single Fashion value onto the Product table unless the business confirms only one Fashion is permitted.

---

# 36. Product-Rack Mapping in New ERP

Because `ProductWiseRack.aspx` supports Rack selection, use:

```text
product_rack
------------
product_id
rack_id
```

For a multi-location ERP, include location scope:

```text
product_rack
------------
product_id
store_id
rack_id
```

or derive store from Rack if Rack is already location-owned.

---

# 37. Attribute Entry: Detailed End-to-End Flow

The operational flow can be represented as follows.

```text
[1] Create Attribute Master
        |
        +-- Brand
        +-- Pattern
        +-- Size
        +-- Color
        +-- Style
        +-- Design
        +-- Model
        +-- Rack
        +-- Fashion
        |
        v
[2] Create Product Master
        |
        +-- Product Code
        +-- Product Name
        +-- Unit
        +-- Group
        +-- Subgroup
        +-- GST / HSN
        +-- Company
        |
        v
[3] Open Purchase Entry
        |
        v
[4] Select Product
        |
        v
[5] Enter / Search Attributes
        |
        +-- Brand
        +-- Pattern
        +-- Size
        +-- Color
        +-- Style
        +-- Design
        +-- Model
        +-- Rack
        +-- Fashion
        |
        v
[6] Save Purchase Detail
        |
        v
[7] Generate / Associate Barcode
        |
        v
[8] Inventory Stock
        |
        v
[9] Sales Billing
        |
        v
[10] Stock / Sales / Attribute Reports
```

---

# 38. Product Selection Before Attributes

The purchase page first establishes the Product context.

Previously traced Product Master lookups include queries such as:

```sql
select name,code,unit_de
from newproduct
where cmy_name=@Company
```

and:

```sql
select code,name,unit_de
from newproduct
where cmy_name=@Company
```

The transaction then adds attribute information to the selected product row.

Therefore the logical key progression is:

```text
Company
  -> Product Code
      -> Product Name / Unit
          -> Attribute combination
```

---

# 39. Attribute Combination as Item Identity

For textile inventory, the actual operational identity can be more specific than Product Code.

Example:

```text
Product Code = 1050
Product Name = Shirt

Variant A:
Brand=ABC
Pattern=Checks
Size=M
Color=Blue
Style=Formal

Variant B:
Brand=ABC
Pattern=Checks
Size=L
Color=Blue
Style=Formal
```

The Product Master is the same, but the stock/SKU identity differs.

This is why reports such as Pattern + Size and Brand + Pattern + Size exist.

---

# 40. Barcode Relationship

The barcode layer consumes the product and its transaction attributes.

The broader application structure identifies barcode workflows for:

- Barcode generation
- Barcode taking
- Barcode view
- Barcode printing
- Barcode sales
- Barcode stock
- Barcode transfer

The attribute-aware conceptual flow is:

```text
Product
  + Attribute Combination
          |
          v
      Barcode/SKU
          |
          v
        Stock
```

The exact barcode table and exact attribute-column persistence should be validated against the barcode SQL implementation before migration.

---

# 41. Stock Relationship

Stock reporting uses attribute dimensions such as:

```text
Product
Brand
Pattern
Size
Color
Style
Design
Rack
Floor
```

Confirmed report families include:

```text
ProductBrandWise.aspx
PatternAndSizeWiseStockReportQty.aspx
PatternBrandandSizeWiseStockReportQty.aspx
SupplierPatternandSizeWiseStockReportQty.aspx
SupplierPatternBrandandSizeWiseStockReportQty.aspx
FloorWiseCurrentStockDetail.aspx
FloorRackNowiseStockReport.aspx
```

This establishes that attributes are first-class inventory analysis dimensions.

---

# 42. Sales Relationship

The traced sales UI contains row-level fields including:

```text
brand
patrn
pattern
design
```

The previously traced sales insert into `salbill` includes snapshot columns such as:

```text
code
p_name
barcode
...
design
brand
patrn
size
color
style
prate
nrate
```

This is strong evidence that attribute values are carried into the sales transaction rather than being calculated only from the Product Master.

Conceptual flow:

```text
Purchase / Stock SKU
       |
       v
Barcode / Product Selection
       |
       v
Sales Row
       |
       +-- Brand
       +-- Pattern
       +-- Size
       +-- Color
       +-- Style
       +-- Design
       |
       v
Sales Bill Snapshot
```

---

# 43. Why Sales Stores Attribute Snapshots

Suppose a Brand master name is changed after a sale.

If the sales record only referenced the current master value, historical reports could change unexpectedly.

The legacy sales structure instead includes direct transaction fields such as:

```text
brand
patrn
size
color
style
```

This provides a historical snapshot.

The new ERP can improve this by storing both:

```text
brand_id
brand_name_snapshot
```

if audit/history requirements demand immutable historical display.

---

# 44. Reporting Flow

Attributes are used in multiple reporting dimensions.

```text
Transaction Data
      |
      +---- Product
      +---- Brand
      +---- Pattern
      +---- Size
      +---- Color
      +---- Style
      +---- Design
      +---- Rack
      |
      v
Reporting Engine
      |
      +---- Brand-wise Stock
      +---- Pattern-wise Stock
      +---- Pattern + Size Stock
      +---- Pattern + Brand + Size Stock
      +---- Supplier + Pattern + Size
      +---- Supplier + Pattern + Brand + Size
      +---- Floor / Rack Stock
      +---- Product-wise reports
```

---

# 45. Attribute Search Flow

The purchase page is designed for keyboard-driven entry.

Representative flow:

```text
User types attribute
       |
       v
SearchXxx()
       |
       v
Autocomplete / matching values
       |
       v
User selects value
       |
       v
Transaction row field populated
```

Functions confirmed from the source include:

```text
SearchBrand
SearchPattern
SearchSize
SearchColor
SearchStyle
SearchDesign
SearchModel
SearchRackno
SearchFashion
```

This behavior should be preserved in the new ERP because textile purchase entry depends heavily on fast attribute selection.

---

# 46. Attribute Codes and Print Names

The dedicated master pages show a common pattern:

```text
Code
Name
Print Name
```

For Brand and Pattern, the markup also exposes English/Tamil name fields in the grid.

This suggests the new ERP should distinguish:

```text
internal code
operational name
print/display name
localized name(s)
```

rather than storing only one string.

---

# 47. Brand Commercial Defaults

The Brand page also contains fields related to:

```text
Commission
Discount Per%
```

This means Brand is not purely descriptive in the legacy application.

However, the Product Master also contains discount and commission values.

Therefore migration must determine precedence:

```text
Brand default
      vs
Product default
      vs
Transaction override
```

Do not automatically merge these values into one Product Attribute table.

---

# 48. Attribute Master Lifecycle

The identified attribute master pages generally follow this lifecycle:

```text
Create
  |
  v
Save
  |
  v
Search / View
  |
  +---- Update
  |
  +---- Print
  |
  +---- Delete
```

The new ERP should additionally introduce:

```text
Active / Inactive
Created By
Created At
Updated By
Updated At
```

instead of hard deletion where historical transactions reference the attribute.

---

# 49. Legacy Hard Delete Risk

Because Brand/Pattern/Size/Color/Style/Rack masters expose Delete actions, legacy data may permit physical deletion.

That is risky when transactions reference the old value.

Recommended new ERP rule:

```text
If attribute has transaction usage:
    do not physically delete
    mark inactive
else:
    delete may be permitted if business policy allows
```

This is especially important for:

```text
Brand
Pattern
Size
Color
Style
Design
Rack
```

---

# 50. Attribute Uniqueness

The legacy master pages contain code/name fields and validation behavior in the client UI.

The new ERP should enforce database-level uniqueness where appropriate.

Recommended examples:

```text
brand.code
pattern.code
size.code
color.code
style.code
rack.code per store
```

For names, uniqueness should be scoped according to business requirements rather than globally assumed.

---

# 51. Attribute Value vs Attribute ID

Legacy transactions appear to use text values:

```text
brand
patrn
size
color
style
```

A new ERP should prefer:

```text
brand_id
pattern_id
size_id
color_id
style_id
```

but should also preserve the original text during migration where historical reconciliation requires it.

Recommended migration fields:

```text
legacy_brand_name
legacy_pattern_name
legacy_size_name
legacy_color_name
legacy_style_name
```

These can be temporary reconciliation fields or retained snapshots depending on audit requirements.

---

# 52. Attribute Mapping During Migration

Migration should use a staged mapping process.

```text
Legacy Attribute
      |
      v
Normalize case / whitespace
      |
      v
Match existing master
      |
      +---- Exact code match
      |
      +---- Exact name match
      |
      +---- Manual mapping queue
      |
      v
New Attribute ID
      |
      v
Transaction / SKU migration
```

Do not map only by display name if codes are available.

---

# 53. Duplicate Attribute Risk

Legacy text-entry systems can produce values such as:

```text
BLUE
Blue
 blue
BLUE 
BLU
```

These may represent the same business value but different text strings.

Before migration, normalize:

- Leading/trailing spaces
- Case
- Duplicate spelling
- Abbreviations
- Tamil/English equivalent values
- Print names vs operational names

The final mapping should retain the original legacy value for audit.

---

# 54. Attribute Combination Uniqueness

The new ERP should decide what makes a variant unique.

A possible textile SKU key is:

```text
product_id
+
brand_id
+
pattern_id
+
size_id
+
color_id
+
style_id
+
 design_id
+
model_no
```

However, this must not be blindly imposed on the legacy data.

Some attributes may be optional and some may be transaction-specific.

A safer migration approach is:

```text
Product
   |
   v
Observed attribute combinations from historical transactions
   |
   v
Generate variants only for combinations actually used
```

---

# 55. Rack Is Not a SKU Attribute

Rack requires special treatment.

A SKU can move from:

```text
Rack A
```

to:

```text
Rack B
```

without becoming a different product.

Therefore:

```text
Brand / Pattern / Size / Color / Style / Design
    -> item identity dimensions

Rack
    -> physical inventory location
```

This distinction should be maintained in the new ERP.

---

# 56. Floor Is Also a Location Dimension

Although legacy `newproduct` contains:

```text
floor_name
```

Floor is physically a location dimension.

Recommended new ERP model:

```text
Store / Warehouse
      |
      v
Floor
      |
      v
Rack
```

Inventory then references the actual location.

Do not rely on `product.floor_id` alone to determine current stock location.

---

# 57. Recommended New ERP Inventory Location Model

```text
company
  |
  +-- branch
        |
        +-- store / warehouse
              |
              +-- floor
                    |
                    +-- rack
```

Inventory:

```text
stock
-----
product_variant_id
location_id
qty
```

where location resolves to:

```text
store + floor + rack
```

This is more accurate than keeping Rack/Floor permanently on Product.

---

# 58. Attribute Relationship Diagram

```text
                         +----------------+
                         | Product Master |
                         | newproduct     |
                         +-------+--------+
                                 |
                         product_code
                                 |
                                 v
                     +-----------------------+
                     | Purchase / SKU Detail |
                     +-----------------------+
                       |   |   |   |   |   |
                       |   |   |   |   |   +---- Fashion
                       |   |   |   |   +-------- Model
                       |   |   |   +------------ Design
                       |   |   +---------------- Style
                       |   +-------------------- Color
                       +------------------------ Size
                       
                      Additional dimensions:
                      Brand / Pattern / Rack
                              |
                              v
                       +---------------+
                       | Barcode / SKU |
                       +-------+-------+
                               |
                               v
                          +---------+
                          |  Stock  |
                          +----+----+
                               |
                               v
                          +---------+
                          |  Sales  |
                          +----+----+
                               |
                               v
                          +---------+
                          | Reports |
                          +---------+
```

---

# 59. Full End-to-End Business Flow

## Step 1: Create attribute masters

Administrator/operator creates:

```text
Brand
Pattern
Size
Color
Style
Design
Model
Rack
Fashion
```

## Step 2: Create Product Master

Product is created in `newproduct`.

Core identity is established:

```text
Company
Product Code
Product Name
Unit
Group
Subgroup
GST / HSN
```

## Step 3: Optional product-wise mappings

Product is mapped to:

```text
Fashion
Rack
```

using dedicated mapping pages.

## Step 4: Purchase

Operator selects Product and enters:

```text
Brand
Pattern
Size
Color
Style
Design
Model
Rack
Fashion
```

## Step 5: Purchase persistence

The values become part of the purchase detail/SKU-level data.

## Step 6: Barcode

Barcode workflow identifies the purchased item/SKU.

## Step 7: Stock

Inventory is represented using Product + attribute dimensions + location.

## Step 8: Sale

Sales row carries attribute snapshots including:

```text
brand
patrn
size
color
style
design
```

## Step 9: Reporting

Reports group/filter by:

```text
Brand
Pattern
Size
Color
Style
Design
Product
Floor
Rack
Supplier
```

---

# 60. Example: Textile Saree

Suppose Product Master contains:

```text
Product Code: 10025
Product Name: COTTON SAREE
Unit: PCS
Group: SAREE
Subgroup: COTTON
Company: MAIN COMPANY
```

Purchase row:

```text
Brand   = ABC
Pattern = FLORAL
Size    = 6.30M
Color   = BLUE
Style   = PRINTED
Design  = D102
Model   = M55
Rack    = R04
Fashion = DAILY WEAR
```

The Product Master remains:

```text
10025 / COTTON SAREE
```

The stock/SKU detail becomes:

```text
10025 + ABC + FLORAL + 6.30M + BLUE + PRINTED + D102
```

This is the correct conceptual separation for migration.

---

# 61. Example: Same Product, Multiple Sizes

Product:

```text
SHIRT-100
```

Purchase records:

```text
SHIRT-100 / ABC / CHECK / M / BLUE
SHIRT-100 / ABC / CHECK / L / BLUE
SHIRT-100 / ABC / CHECK / XL / BLUE
```

Do not create three unrelated Products simply because Size differs.

Recommended:

```text
Product = SHIRT-100
Variants = M / L / XL
```

---

# 62. Example: Same Product, Multiple Racks

Product:

```text
SAREE-10025
```

Product-to-rack mapping:

```text
R01
R03
R08
```

Current stock:

```text
R01 = 5
R03 = 8
R08 = 2
```

This should be represented by stock location balances, not by three product records.

---

# 63. Example: Same Product, Multiple Fashion Classifications

`ProductWiseFashionName.aspx` supports product-wise Fashion selection.

Example:

```text
Product: SAREE-10025

Fashion:
- DAILY WEAR
- FESTIVE
- OFFICE WEAR
```

Recommended representation:

```text
product_fashion
----------------
10025 -> DAILY WEAR
10025 -> FESTIVE
10025 -> OFFICE WEAR
```

---

# 64. Attribute Reporting Matrix

| Attribute | Stock | Sales | Purchase | Barcode/SKU | Product Mapping | Reporting |
|---|---:|---:|---:|---:|---:|---:|
| Brand | Yes | Yes | Yes | Yes/likely | No | Yes |
| Pattern | Yes | Yes | Yes | Yes/likely | No | Yes |
| Size | Yes | Yes | Yes | Yes/likely | No | Yes |
| Color | Yes | Yes | Yes | Yes/likely | No | Yes |
| Style | Yes | Yes | Yes | Yes/likely | No | Yes |
| Design | Yes | Yes | Yes | Yes/likely | No | Yes |
| Model | Yes/likely | Possible | Yes | Possible | No | Possible |
| Fashion | Yes/likely | Possible | Yes | Possible | Yes | Possible |
| Rack | Yes | Indirect | Yes | Indirect | Yes | Yes |
| Floor | Yes | Indirect | Yes/lookup | Indirect | Product master | Yes |

`Yes/likely` means the application structure strongly indicates downstream usage, but the exact persistence path should be validated from the corresponding compiled SQL before migration.

---

# 65. Legacy Data Risks

## 65.1 Text instead of foreign keys

Transaction fields appear to use text values.

Risk:

```text
Brand ID cannot be trusted from transaction text alone.
```

## 65.2 Duplicate spellings

Risk:

```text
BLUE
Blue
BLUE 
```

becoming separate values.

## 65.3 Deleted masters

Historical transactions may contain values whose current master record no longer exists.

## 65.4 Attribute drift

An attribute name can change while old transaction text remains unchanged.

## 65.5 Mixed concepts

Rack/Floor may be stored or reported alongside product attributes even though they are actually locations.

---

# 66. Migration Strategy

Recommended sequence:

```text
1. Extract attribute masters
2. Normalize names/codes
3. Deduplicate
4. Create new master IDs
5. Build legacy-value -> new-ID mapping
6. Extract Product Master
7. Extract purchase detail
8. Build SKU/variant combinations
9. Map attribute IDs
10. Map rack/location IDs
11. Load stock
12. Load sales history
13. Reconcile attribute-wise quantities
14. Reconcile reports
```

---

# 67. Attribute Migration Reconciliation

For every attribute, compare:

```text
Legacy distinct values
vs
New ERP distinct values
```

Example:

```text
Brand
Legacy count = 145
New count    = 145
Unmapped     = 0
```

For transactions:

```text
Legacy Brand-wise Stock Qty
        vs
New ERP Brand-wise Stock Qty
```

Do the same for:

```text
Pattern
Size
Color
Style
Design
Rack
```

---

# 68. SKU Migration Reconciliation

A particularly important reconciliation is the distinct attribute combination.

Legacy:

```sql
DISTINCT(
    product_code,
    brand,
    pattern,
    size,
    color,
    style,
    design
)
```

New ERP:

```text
product_variant_id
```

Compare:

```text
Legacy combination count
        vs
New variant count
```

Any mismatch must be investigated before stock migration is accepted.

---

# 69. Barcode Reconciliation

For every barcode:

```text
Legacy Barcode
 -> Product Code
 -> Brand
 -> Pattern
 -> Size
 -> Color
 -> Style
 -> Design
 -> Rack
```

must map to exactly one new ERP SKU/variant and one current location state where applicable.

---

# 70. Stock Reconciliation

For each Product + Attribute combination:

```text
Opening Qty
+ Purchase Qty
+ Transfer In
- Sales Qty
- Purchase Return
- Sales Return
- Transfer Out
= Closing Qty
```

Then group by:

```text
Brand
Pattern
Size
Color
Style
Rack
```

and compare against legacy reports.

---

# 71. Report Compatibility Requirement

Because TextileSoft has dedicated attribute reports, the new ERP must not remove these dimensions simply because Product Master is normalized.

The reporting layer must expose:

```text
Product
Brand
Pattern
Size
Color
Style
Design
Model
Fashion
Floor
Rack
Supplier
```

as applicable.

---

# 72. Recommended Database Constraints

For new master tables:

```text
UNIQUE(code)
UNIQUE(normalized_name)
```

where business scope permits.

For variant:

```text
UNIQUE(
    product_id,
    brand_id,
    pattern_id,
    size_id,
    color_id,
    style_id,
    design_id,
    design_model_id,
    model_no
)
```

Only apply this after confirming which attributes actually define uniqueness in the business.

For product-rack:

```text
UNIQUE(product_id, rack_id)
```

For product-fashion:

```text
UNIQUE(product_id, fashion_id)
```

---

# 73. Recommended API Flow in New ERP

```text
GET /attributes/brands
GET /attributes/patterns
GET /attributes/sizes
GET /attributes/colors
GET /attributes/styles
GET /attributes/designs
GET /attributes/models
GET /attributes/fashions
GET /locations/racks
```

Purchase:

```text
POST /purchases
```

with line-level data:

```json
{
  "productId": 10025,
  "brandId": 4,
  "patternId": 12,
  "sizeId": 6,
  "colorId": 8,
  "styleId": 3,
  "designId": 102,
  "modelNo": "M55",
  "rackId": 41,
  "fashionId": 7
}
```

The exact API shape is a recommended design, not a legacy implementation claim.

---

# 74. Recommended UI Flow in New ERP

```text
Product Search
      |
      v
Product selected
      |
      v
Attribute panel
      |
      +-- Brand autocomplete
      +-- Pattern autocomplete
      +-- Size autocomplete
      +-- Color autocomplete
      +-- Style autocomplete
      +-- Design autocomplete
      +-- Model input/search
      +-- Fashion selection
      +-- Rack/location selection
      |
      v
Variant / SKU resolution
      |
      v
Purchase quantity / rate
      |
      v
Save
```

This preserves the keyboard-friendly legacy behavior while introducing normalized IDs.

---

# 75. Confirmed Source Evidence

The following findings are directly confirmed from the supplied source archive.

### Product Master

`newproduct.aspx` and `App_Web_wpk3movq.dll` establish the core Product Master fields and the fact that the main insert does not include Brand/Pattern/Size/Color/Style/Design/Model/Rack/Fashion.

### Purchase

The purchase pages explicitly contain:

```text
brand
patrn
size
color
style
design
model
rackno
fashion
```

and search functions for these dimensions.

### Brand

`purbrand.aspx` exists as a dedicated Brand master.

### Pattern

`purpattern.aspx` exists as a dedicated Pattern master.

### Size

`pursize.aspx` exists as a dedicated Size master.

### Color

`purcolor.aspx` exists as a dedicated Color master.

### Style

`Purstyle.aspx` exists as a dedicated Style master.

### Design

Purchase has a direct `design` field and the archive also contains Design Model pages.

### Model

Purchase contains a `model` field.

### Fashion

`ProductWiseFashionName.aspx` maps product code/product name to Fashion Name.

### Rack

`RackNo.aspx` provides Rack master maintenance and `ProductWiseRack.aspx` provides Product-to-Rack mapping.

### Reports

The archive contains attribute-specific stock/sales report pages, confirming these are operational reporting dimensions.

---

# 76. Inferred / Needs Database Confirmation

The following should be confirmed against the live SQL database before final migration schema is frozen:

1. Exact physical table names for Brand, Pattern, Size, Color and Style masters.
2. Exact physical columns and primary keys of those masters.
3. Exact foreign-key relationships, if any.
4. Exact SQL used by autocomplete/search endpoints.
5. Exact persistence table for each purchase attribute.
6. Exact barcode table and attribute snapshot columns.
7. Exact stock table and whether all attributes are physically stored there or derived from purchase/barcode.
8. Exact Design Model to Design relationship.
9. Exact Model master, if separate from free-text Model.
10. Exact Fashion master table behind `ProductWiseFashionName.aspx`.
11. Exact physical table and keys behind `productwiserackno`.
12. Whether Floor is copied into stock rows or resolved from product/location data.

These items should be resolved from the database schema and compiled SQL before migration coding begins.

---

# 77. Final Recommended Architecture

The clean new ERP architecture should be:

```text
                         PRODUCT
                            |
                            v
                    +---------------+
                    | Product Master |
                    +---------------+
                            |
                            v
                    +---------------+
                    | Product SKU /  |
                    | Variant        |
                    +---------------+
                     /   /  |  \   \
                    /   /   |   \   \
                 Brand Pattern Size Color
                    |     |    |     |
                    +-----+----+-----+
                              |
                           Style
                              |
                           Design
                              |
                        Design Model
                              |
                           Model No
                              |
                              v
                         BARCODE / SKU
                              |
                              v
                           INVENTORY
                              |
                  +-----------+-----------+
                  |                       |
                Store                   Rack
                  |                       |
                Floor                     |
                  |                       |
                  +-----------+-----------+
                              |
                              v
                            SALES
                              |
                              v
                           REPORTS
```

Fashion is separately mapped:

```text
Product
   |
   +---- Product Fashion Mapping ---- Fashion Master
```

Rack is location-based:

```text
Store -> Floor -> Rack
                  |
                  +---- Product Stock
```

---

# 78. Final Conclusion

The TextileSoft source shows that **Product Master and Product Attributes are deliberately different layers**, even though the legacy UI makes them appear close together.

The core `newproduct` table defines the product identity and general classification. Brand, Pattern, Size, Color, Style, Design, Model, Fashion and Rack are introduced mainly through purchase/detail workflows and specialized mapping screens. These values then participate in barcode, stock, sales and attribute-wise reporting.

The most important migration rule is therefore:

```text
Do NOT put every legacy attribute into products.
```

Instead:

```text
Product Master
    -> stable product identity

Product Variant / SKU
    -> Brand
    -> Pattern
    -> Size
    -> Color
    -> Style
    -> Design
    -> Model

Product Classification Mapping
    -> Fashion

Inventory Location
    -> Store
    -> Floor
    -> Rack
```

This structure preserves the behavior evidenced in TextileSoft while making the new ERP suitable for normalized SQL, barcode-level inventory, attribute-wise reporting, multi-location stock and future product variants.

---

# 79. Source Files Traced

Primary source pages:

```text
newproduct.aspx
purbrand.aspx
purpattern.aspx
pursize.aspx
purcolor.aspx
Purstyle.aspx
DesignModelEntry.aspx
DesignModelView.aspx
DesignModelGroupName.aspx
ProductWiseFashionName.aspx
RackNo.aspx
ProductWiseRack.aspx
NewPurchaseentry.aspx
NewPurchaseentryAdd.aspx
AllGSTNewPurchaseEntry.aspx
AllGSTNewPurchaseEntryAdd.aspx
WRPurchaseEntryNew.aspx
WRPurchaseEntryNewAdd.aspx
WRPurchaseEntryNewUpdate.aspx
SalesentryNewsaleAll.aspx
ProductBrandWise.aspx
PatternAndSizeWiseStockReportQty.aspx
PatternAndSizeWiseSalesReportQty.aspx
PatternBrandandSizeWiseStockReportQty.aspx
SupplierPatternandSizeWiseStockReportQty.aspx
SupplierPatternBrandandSizeWiseStockReportQty.aspx
FloorWiseCurrentStockDetail.aspx
FloorRackNowiseStockReport.aspx
```

Compiled assemblies specifically observed for the attribute pages include:

```text
App_Web_wpk3movq.dll
App_Web_tw3vpscp.dll
App_Web_4qyf2ren.dll
App_Web_yu53m2vu.dll
```

---

# 80. Dependency on Other Module Documents

This document should be read together with:

```text
02_company_branch_store.md
03_product_item_master.md
05_purchase.md
08_sales_billing.md
11_barcode.md
16_inventory_stock.md
28_reports.md
```

The most important dependency chain is:

```text
Company / Store / Location
        |
        v
Product Master
        |
        v
Product Attributes / Variant
        |
        v
Purchase
        |
        v
Barcode
        |
        v
Stock
        |
        v
Sales
        |
        v
Reports
```

