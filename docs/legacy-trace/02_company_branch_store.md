# TextileSoft 02 - Company, Branch, Store, Warehouse & Counter
## End-to-End Technical Flow

**Source:** `TEXTILESOFT 17.07.2025`  
**Application:** ASP.NET WebForms, precompiled  
**Database:** SQL Server `SSS`  
**Primary concern:** How organizational masters are created and how Company, Branch/Warehouse, Counter, Floor, Rack and transaction context flow into purchase, sales, stock and reports.

---

# 1. Executive Summary

TextileSoft does **not** implement Company, Branch, Warehouse, Store, Counter, Floor and Rack as one clean hierarchical master structure.

Instead, the legacy system has several independent masters and transaction-level fields:

```text
Company
   |
   +--> companydetail
   |
   +--> referenced as cmy_name / CompanyName
   |
   +--> used by Product, Purchase, Sales and Reports

Branch
   |
   +--> branchdetail
   |
   +--> branch/company identity information
   |
   +--> separate from warehouse detail

Warehouse / Store
   |
   +--> warehousedetail
   |
   +--> selected as warehouse in Purchase/GRN

Counter
   |
   +--> countername
   |
   +--> CommonSettings
   |
   +--> LoginOpen / AccountDate
   |
   +--> Sales / Cash / Billing context

Floor
   |
   +--> foolerdetail
   |
   +--> stored in product master and used by stock/reporting

Rack
   |
   +--> productwiserackno
   |
   +--> transaction-level rackno
   |
   +--> stock/reporting dimension

Section
   |
   +--> used heavily in stock/reporting and employee context
   |
   +--> no dedicated physical-store section master was conclusively
        identified in this archive
```

The most important conclusion is:

> **Company and Warehouse are explicit master entities. Counter is a transactional operating context. Floor and Rack are inventory-location attributes. Branch exists as a separate master, but the archive does not demonstrate a clean Branch → Warehouse → Counter foreign-key hierarchy.**

---

# 2. Core Organizational Objects

| Object | Main table | Main page | Primary purpose |
|---|---|---|---|
| Company | `companydetail` | `company detail.aspx` | Legal/business company identity |
| Branch | `branchdetail` | `branchdetail.aspx` | Branch identity/details |
| Warehouse / Store | `warehousedetail` | `NewCounterSetting.aspx` class flow | Warehouse/store identity |
| Counter | `countername` | `counternameentry.aspx` | Billing/operational counter |
| Counter Configuration | `CommonSettings` | `commonsettings.aspx` | Counter-specific behavior |
| Account Date | `AccountDate` | Login/account-date flow | Business date by user/counter |
| Login Context | `LoginOpen` | Login flow | User/counter runtime context |
| Floor | `foolerdetail` | `foolerdetail.aspx` | Product/store floor |
| Rack | `productwiserackno` | `RackNo.aspx` | Product-to-rack mapping |
| Section | `empolyeesectionentry` / transaction fields | section-related screens | Section reporting/employee classification |

---

# 3. Company Master

## Source page

```text
company detail.aspx
```

## Compiled class

```text
company_detail
```

## Assembly

```text
App_Web_okdk43vd.dll
```

The UI title is:

```text
COMPANY DETAILS
```

The page displays the current:

```text
USER
COUNTER
```

This is important because Company Master is still operated inside a logged-in counter/user context.

---

# 4. Company Fields

The page exposes the following business fields.

## Identity

```text
Company Code
Company Name
Print Name
```

## English address

```text
Address1
Address2
Address3
Address4
City
Pin Code
```

## Contact

```text
Phone No
Mobile Number
Email Id
```

## Tax

```text
TIN Number
CST Number
GST Number
PAN Card Number
CGST
SGST
```

## Bank

```text
Bank Name
Account Holder Name
Account Number
Branch Name
IFSC Code
```

## Tamil

```text
Company Name
Print Name
Address Detail
City
Account Holder Name
Branch Name
```

## Additional fields

```text
print_eng
print_tam
acc_name
acc_tam
date
cmp_address1
cmp_address2
cmp_address3
cmp_cgstno
```

---

# 5. Company Table

The confirmed table is:

```text
companydetail
```

The GridView binds these fields:

```text
cmy_cd
cmy_name_eng
cmy_name_tam
address_eng
address_tam
city_eng
city_tam
pin_cd
ph_nu
mb_nu
e_id
tin_nu
cgst
sgst
bank_name
ac_nu
branch_name_eng
branch_name_tam
ifsc_nu
pan_nu
print_eng
print_tam
acc_name
acc_tam
date
cmp_address1
cmp_address2
...
```

---

# 6. Company Code Generation

The compiled Company Master code contains:

```sql
SELECT COALESCE(MAX(CONVERT(INT,CMY_CD))+1, '1')
FROM companydetail
```

Therefore Company Code is generated as:

```text
MAX(existing numeric Company Code) + 1
```

If there is no existing company:

```text
1
```

is generated.

## Important

This is **not a SQL IDENTITY-based design**.

It is application-generated numbering.

---

# 7. Company Duplicate Validation

The source contains:

```sql
select cmy_name_eng
from companydetail
where cmy_name_eng=@cmy_name_eng
```

There is also:

```text
Please Check the Company Name
```

Therefore Company Name is validated before insertion.

The application also searches by:

```sql
select cmy_name_eng
from companydetail
where cmy_name_eng LIKE ''+@SearchEmpName+'%'
```

---

# 8. Company Insert

The confirmed insert statement is:

```sql
insert into companydetail
(
    cmy_cd,
    cmy_name_eng,
    cmy_name_tam,
    address_eng,
    address_tam,
    city_eng,
    city_tam,
    pin_cd,
    ph_nu,
    mb_nu,
    e_id,
    tin_nu,
    bank_name,
    ac_nu,
    branch_name_eng,
    branch_name_tam,
    ifsc_nu,
    pan_nu,
    date,
    print_eng,
    print_tam,
    acc_name,
    acc_tam,
    cgst,
    sgst,
    cmp_address1,
    cmp_address2,
    cmp_address3,
    cmp_cgstno
)
values
(
    @cmy_cd,
    @cmy_name_eng,
    @cmy_name_tam,
    @address_eng,
    @address_tam,
    @city_eng,
    @city_tam,
    @pin_cd,
    @ph_nu,
    @mb_nu,
    @e_id,
    @tin_nu,
    @bank_name,
    @ac_nu,
    @branch_name_eng,
    @branch_name_tam,
    @ifsc_nu,
    @pan_nu,
    @date,
    @print_eng,
    @print_tam,
    @acc_name,
    @acc_tam,
    @cgst,
    @sgst,
    @ccaddress1,
    @ccaddress2,
    @ccaddress3,
    @cgst
)
```

---

# 9. Company Delete

The confirmed delete statement is:

```sql
delete from companydetail
where cmy_cd=@cmy_cd
```

This is a direct hard delete.

There is no evidence in this archive that Company Master uses a universal soft-delete flag.

That is important for the new ERP.

A new system should normally prefer:

```text
is_active
```

and preserve historical references.

---

# 10. Company Usage in Product Master

Company is a major product dimension.

The Product Master uses:

```text
cmy_name
```

The compiled product code contains:

```sql
select * from newproduct
where cmy_name=@cmy_name
ORDER BY CAST(code AS int) asc
```

Product insertion includes:

```sql
insert into newproduct
(
    ...
    floor_name,
    gst_group,
    cmy_name,
    ...
)
```

Therefore:

```text
Company
   |
   +--> Product
```

is a real relationship at the application/data level.

---

# 11. Company Usage in Sales

Sales rows contain:

```text
cmy_name
cmy_bill
```

Example recovered SQL:

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
    mtr,
    qty,
    amt,
    ...
    billno,
    cmy_name,
    cmy_bill,
    gst_per,
    countername,
    ...
)
values (...)
```

Therefore every sale can carry both:

```text
Company
Counter
```

context.

---

# 12. Company Usage in Purchase

Purchase/GRN headers use:

```text
cmy_name
```

and:

```text
warehouse
```

The confirmed insert pattern is:

```sql
insert into purgrnentry
(
    ...
    cmy_name,
    warehouse,
    ...
)
values
(
    ...
    @cmy_name,
    @warehouse,
    ...
)
```

Therefore:

```text
Purchase/GRN
   |
   +--> Company
   |
   +--> Warehouse
```

are both transaction dimensions.

---

# 13. Branch Master

## Source

```text
branchdetail.aspx
```

## Compiled class

```text
brachdetal
```

Note the class name is misspelled:

```text
brachdetal
```

even though the page is:

```text
branchdetail.aspx
```

This is a legacy naming detail.

---

# 14. Branch UI

The page title is:

```text
BRANCH DETAILS
```

Fields include:

```text
Branch Code
Branch Name
Address Detail
City
Phone No
Mobile Number
Email Id
TIN Number
CST Number
GST Number
Bank Name
Account Number
Branch Name
IFSC Code
PAN Card Number
Land Mark
```

The page also supports:

```text
Save
Update
Search
Delete
View
Print
```

---

# 15. Important Finding: Branch Table

The compiled code confirms:

```text
branchdetail
```

as a database table.

The insert is:

```sql
insert into branchdetail
(
    ware_cd,
    ware_name_eng,
    address_eng,
    city_eng,
    ph_nu,
    mb_nu,
    e_id,
    tin_nu,
    cst_nu,
    gst_nu,
    bank_name,
    ac_nu,
    branch_name_eng,
    ifsc_cd,
    pan_cd,
    date,
    land_mark
)
values
(
    @ware_cd,
    @ware_name_eng,
    @address_eng,
    @city_eng,
    @ph_nu,
    @mb_nu,
    @e_id,
    @tin_nu,
    @cst_nu,
    @gst_nu,
    @bank_name,
    @ac_nu,
    @branch_name_eng,
    @ifsc_cd,
    @pan_cd,
    @date,
    @land_mark
)
```

---

# 16. Branch Code Generation

The branch code is application generated:

```sql
SELECT COALESCE(MAX(CONVERT(INT,ware_cd))+1, '1')
FROM branchdetail
```

Therefore:

```text
Branch Code = MAX(ware_cd) + 1
```

---

# 17. Branch Search

Confirmed queries include:

```sql
select * from branchdetail
ORDER BY CAST(ware_cd AS int)
```

```sql
select ware_cd
from branchdetail
```

```sql
select ware_cd
from branchdetail
where ware_cd='...'
```

```sql
select * from branchdetail
where ware_name_eng='...'
```

```sql
select ware_name_eng
from branchdetail
where ware_name_eng LIKE ''+@SearchEmpName+'%'
```

---

# 18. Branch Delete

Confirmed:

```sql
delete from branchdetail
where ware_cd=@ware_cd
```

Again, this is a direct delete.

---

# 19. Warehouse / Store Master

The archive contains another organizational table:

```text
warehousedetail
```

This is distinct from:

```text
branchdetail
```

Both have nearly identical identity/address/bank structures.

The warehouse table has:

```text
ware_cd
ware_name_eng
address_eng
city_eng
ph_nu
mb_nu
e_id
tin_nu
cst_nu
gst_nu
bank_name
ac_nu
branch_name_eng
ifsc_cd
pan_cd
date
land_mark
```

---

# 20. Warehouse Code Generation

Confirmed:

```sql
SELECT COALESCE(MAX(CONVERT(INT,ware_cd))+1, '1')
FROM warehousedetail
```

So the legacy system uses the same application-generated numeric code pattern as Branch.

---

# 21. Warehouse Insert

Confirmed:

```sql
insert into warehousedetail
(
    ware_cd,
    ware_name_eng,
    address_eng,
    city_eng,
    ph_nu,
    mb_nu,
    e_id,
    tin_nu,
    cst_nu,
    gst_nu,
    bank_name,
    ac_nu,
    branch_name_eng,
    ifsc_cd,
    pan_cd,
    date,
    land_mark
)
values
(
    @ware_cd,
    @ware_name_eng,
    @address_eng,
    @city_eng,
    @ph_nu,
    @mb_nu,
    @e_id,
    @tin_nu,
    @cst_nu,
    @gst_nu,
    @bank_name,
    @ac_nu,
    @branch_name_eng,
    @ifsc_cd,
    @pan_cd,
    @date,
    @land_mark
)
```

---

# 22. Warehouse Update

Confirmed:

```sql
update warehousedetail
set
    ware_cd=@ware_cd,
    ware_name_eng=@ware_name_eng,
    address_eng=@address_eng,
    city_eng=@city_eng,
    ph_nu=@ph_nu,
    mb_nu=@mb_nu,
    e_id=@e_id,
    tin_nu=@tin_nu,
    cst_nu=@cst_nu,
    gst_nu=@gst_nu,
    bank_name=@bank_name,
    ac_nu=@ac_nu,
    branch_name_eng=@branch_name_eng,
    ifsc_cd=@ifsc_cd,
    pan_cd=@pan_cd,
    date=@date,
    land_mark=@land_mark
where ware_cd=@ware_cd
```

---

# 23. Warehouse Delete

Confirmed:

```sql
delete from warehousedetail
where ware_cd=@ware_cd
```

---

# 24. Warehouse Usage in Purchase

This is one of the most important relationships.

Purchase GRN uses:

```text
warehouse
```

The source loads warehouse names using:

```sql
SELECT ware_name_eng
FROM warehousedetail
```

Then stores the selected warehouse in:

```text
purgrnentry.warehouse
```

Confirmed insert:

```sql
insert into purgrnentry
(
    warehouse,
    suplier_name,
    agent_name,
    incharge,
    cmy_name,
    grn_no,
    ...
)
values
(
    @warehouse,
    @suplier_name,
    @agent_name,
    @incharge,
    @cmy_name,
    @grn_no,
    ...
)
```

Therefore:

```text
Warehouse Master
       |
       v
Purchase/GRN
       |
       v
purgrnentry.warehouse
```

This is a direct business dependency.

---

# 25. Small Purchase Warehouse Context

The small purchase workflow stores:

```text
warehouse_name
```

in:

```text
SmallPurchaseEntryMainHeadTemp
```

Confirmed:

```sql
insert into SmallPurchaseEntryMainHeadTemp
(
    grn_no,
    companyName,
    invoice_no,
    invoice_date,
    entry_date,
    warehouse_name,
    supplier_name,
    agent_name,
    incharge,
    ...
    userName,
    counterName
)
values (...)
```

So a purchase workflow can simultaneously have:

```text
Company
Warehouse
Counter
User
```

---

# 26. Counter Master

## Source

```text
counternameentry.aspx
```

## Class

```text
counternameentry
```

## Assembly

```text
App_Web_n5bh3be3.dll
```

The UI has:

```text
Sl.No
Counter Name
Counter Mode
```

and:

```text
Save
Edit
Update
Delete
Search
```

---

# 27. Counter Table

Confirmed:

```text
countername
```

Fields identified:

```text
sl_no
counter_name
date
counter_mode
```

The GridView binds:

```text
sl_no
counter_name
counter_mode
```

---

# 28. Counter Number Generation

The application uses:

```sql
SELECT COALESCE(MAX(CONVERT(INT,sl_no))+1, '1')
FROM countername
```

Therefore:

```text
Counter Sl.No = MAX(existing Sl.No) + 1
```

---

# 29. Counter Insert

Confirmed:

```sql
insert into countername
(
    sl_no,
    counter_name,
    date,
    counter_mode
)
values
(
    @sl_no,
    @counter_name,
    @date,
    @counter_mode
)
```

---

# 30. Counter Delete

Confirmed:

```sql
delete from countername
where counter_name=@counter_name
```

This means the operational identifier used for deletion is:

```text
counter_name
```

rather than the numeric `sl_no`.

---

# 31. Counter Search

The application uses:

```sql
select * from countername
```

and:

```sql
select counter_name
from countername
where counter_name LIKE ''+@SearchEmpName+'%'
GROUP BY counter_name
```

It also retrieves:

```sql
select counter_name
from countername
where year_to is null
group by counter_name
```

and:

```sql
select counter_name
from countername
where year_to is not null
group by counter_name
```

This indicates that counter records may also carry a lifecycle/year concept in the actual database, even though the basic entry page exposes only the core fields.

---

# 32. Counter and Company

The application frequently loads both:

```sql
SELECT counter_name
FROM countername
```

and:

```sql
SELECT cmy_name_eng
FROM companydetail
```

The application then uses both values in transaction screens.

There is **no confirmed foreign-key relationship in the archive** showing:

```text
countername.company_id
```

Instead, Company and Counter are carried independently into transaction records.

---

# 33. Counter and Sales

Sales rows contain:

```text
countername
user_id
cmy_name
cmy_bill
```

Example:

```sql
insert into salbill
(
    ...
    cmy_name,
    cmy_bill,
    gst_per,
    countername,
    ...
    user_id
)
values (...)
```

This gives the effective transaction context:

```text
Sale
 ├── Company
 ├── Counter
 └── User
```

---

# 34. Counter and Purchase

Purchase temporary tables contain:

```text
UserName
CounterName
```

Example:

```sql
Insert into PurchaseEntrySubTemp
(
    ...
    UserName,
    CounterName,
    ...
)
values (...)
```

and:

```sql
Insert into PurchaseUpdateMainTemp
(
    ...
    UserName,
    CounterName,
    ...
)
values (...)
```

Therefore the counter is also part of the purchase-entry session/workflow.

---

# 35. Counter and Account Date

The application links counter to business date through:

```text
AccountDate
```

Confirmed:

```sql
SELECT TOP 1 ModifiedDate
FROM AccountDate
WHERE User_Id = '{0}'
AND CurrentDate ='{1}'
AND CounterName = '{2}'
```

And:

```sql
select Top 1 CurrentDate
from AccountDate
WHERE User_Id = '{0}'
AND CounterName = '{1}'
order by ID desc
```

So:

```text
User
 +
Counter
 +
Business Date
```

forms an important operating context.

---

# 36. Counter and LoginOpen

Confirmed:

```sql
select *
from LoginOpen
where UserName=@UserName
and CounterName=@CounterName
and LoginFileName=@LoginFileName
```

Therefore Counter is part of login/runtime state.

---

# 37. Counter Configuration

## Source

```text
commonsettings.aspx
```

## Table

```text
CommonSettings
```

The page validates:

```text
Please Select the CounterName
Please Check the Counter Name
This Counter Already Exists..
```

It is therefore a **counter configuration master**, not merely a counter-name table.

---

# 38. CommonSettings Insert

The confirmed insert contains many counter-level configuration fields:

```sql
insert into CommonSettings
(
    Counter,
    DateOption,
    SalesBarcodeOption,
    SalesBarcodeQty,
    EXPMRPPER,
    AsalPer,
    PurNetTotal,
    DateOn,
    SameCodeAddQty,
    SameBarCodeAddQty,
    BarcodeDiscountAdj,
    PnrateMrp,
    PnrateMrpRange,
    BarcodePurrateVisible,
    BarcodeStockBalance,
    BillwiseProfit,
    SalesProfitEncryptCode,
    PrintBarcodeNetRate,
    PrinterSelect,
    CustomerMan,
    CounterSalesReport,
    CompanySalesReport,
    BrandMiniumSalesReport,
    sr_negative,
    CreditbillAllowed,
    CustPointAllowed,
    CustPointCheck,
    AllowWholeSale,
    PrintPRATE,
    DesignOrColor,
    CrossRight,
    CrossLeft,
    InvoiceNo,
    SalemanReadonly,
    SeasonDate,
    CategoryPrint,
    CreditBillShow,
    PurchaseEntry,
    PRB,
    offDA,
    cashtype
)
values (...)
```

This proves that **counter configuration controls major ERP behavior**.

---

# 39. Counter Configuration Categories

`CommonSettings` controls:

## Barcode

```text
SalesBarcodeOption
SalesBarcodeQty
BarcodeDiscountAdj
PnrateMrp
PnrateMrpRange
BarcodePurrateVisible
BarcodeStockBalance
PrintBarcodeNetRate
```

## Profit

```text
BillwiseProfit
SalesProfitEncryptCode
```

## Printer

```text
PrinterSelect
```

## Customer

```text
CustomerMan
CustPointAllowed
CustPointCheck
```

## Sales

```text
CounterSalesReport
CompanySalesReport
AllowWholeSale
CreditbillAllowed
InvoiceNo
SalemanReadonly
```

## Product/Display

```text
DesignOrColor
CategoryPrint
PrintPRATE
```

## Purchase

```text
PurchaseEntry
PRB
```

## Date

```text
DateOption
DateOn
SeasonDate
```

Therefore Counter is effectively a **configuration boundary**.

---

# 40. CommonSettings Lookup During Transactions

The application repeatedly executes:

```sql
select *
from CommonSettings
where Counter=@CounterName
```

and:

```sql
SELECT TOP 1
    T1.ModifiedDate,
    T2.DateOption
FROM AccountDate AS T1
INNER JOIN CommonSettings AS T2
    ON T1.Countername = T2.Counter
WHERE ...
```

This shows that transaction behavior can depend on the current counter configuration.

---

# 41. Counter-Specific Barcode Settings

The source also has:

```text
NewCounterBarcodeSetting.aspx
NewCounterCommBarcodeSetting.aspx
NewCounterGRNsetting.aspx
NewCounterPrintSetting.aspx
NewCounterSalesIDsetting.aspx
```

These pages use:

```text
From Counter
To Counter
```

and allow settings to be copied/managed between counters.

The barcode settings page has:

```text
ddlFromcounter
ddlTocounter
CheckBoxList1
Counter Name
Save
Update
Search
Delete
View
Print
```

This reinforces that the system treats Counter as an operational configuration unit.

---

# 42. Counter → Barcode Settings

The compiled code contains:

```sql
select BarcodePrinter
from BarcodeSetting
where UserName=@UserName
and CounterName=@CounterName
group by BarcodePrinter
```

and:

```sql
select BarcodeSettingName
from BarcodeSetting
where UserName=@UserName
and CounterName=@CounterName
group by BarcodeSettingName
```

Therefore barcode printing is also contextualized by:

```text
User
+
Counter
```

---

# 43. Floor Master

## Source

```text
foolerdetail.aspx
```

The class name is:

```text
foolerdetail
```

The UI title is:

```text
FLOOR DETAILS
```

The spelling `foolerdetail` is a legacy filename/class convention.

---

# 44. Floor Fields

The page contains:

```text
Floor Code
Floor Name
Print Floor Name
Tamil Name
Tamil Print Name
```

The GridView binds:

```text
group_cd
name_eng
name_tam
prin_name_eng
prin_name_tam
```

---

# 45. Floor Table

Confirmed:

```text
foolerdetail
```

Fields:

```text
group_cd
name_eng
name_tam
date
prin_name_eng
prin_name_tam
```

---

# 46. Floor Code Generation

Confirmed:

```sql
SELECT COALESCE(MAX(CONVERT(INT,group_cd))+1, '1')
FROM foolerdetail
```

---

# 47. Floor Insert

Confirmed:

```sql
insert into foolerdetail
(
    group_cd,
    name_eng,
    name_tam,
    date,
    prin_name_eng,
    prin_name_tam
)
values
(
    @group_cd,
    @name_eng,
    @name_tam,
    @date,
    @prin_name_eng,
    @prin_name_tam
)
```

---

# 48. Floor Update

Confirmed:

```sql
update foolerdetail
set
    group_cd=@group_cd,
    name_eng=@name_eng,
    name_tam=@name_tam,
    date=@date,
    prin_name_eng=@prin_name_eng,
    prin_name_tam=@prin_name_eng
where group_cd=@group_cd
```

Note the legacy update uses:

```text
@prin_name_eng
```

for `prin_name_tam`.

This appears to be a legacy implementation defect or intentional behavior and should be verified before migration.

---

# 49. Floor Delete

Confirmed:

```sql
delete from foolerdetail
where group_cd=@group_cd
```

---

# 50. Floor → Product

Product Master explicitly references:

```text
floor_name
```

The product insert contains:

```sql
insert into newproduct
(
    ...
    floor_name,
    gst_group,
    cmy_name,
    ...
)
values (...)
```

The product page also loads:

```sql
SELECT name_eng
FROM foolerdetail
```

with UI text:

```text
--Select Floor Name--
```

Therefore:

```text
foolerdetail.name_eng
        |
        v
newproduct.floor_name
```

is a real application-level relationship.

---

# 51. Floor → Stock

The archive contains multiple reports:

```text
FloorWiseCurrentStockDetail.aspx
FloorWiseCurrentStockSummary.aspx
FloorWiseMinimumQty.aspx
FloorRackNowiseStockReport.aspx
```

and Crystal Reports such as:

```text
FloorWiseCurrentStockDetail.rpt
FloorWiseCurrentStockSummary.rpt
```

There are also:

```text
FloorWiseItemDetail
FloorWiseItemSummary
FloorWiseSalesRateDetail
FloorWiseSaleSummary
```

Therefore Floor is a major reporting dimension.

---

# 52. Rack Master

## Source

```text
RackNo.aspx
```

## Class

```text
RackNo
```

The page title is:

```text
RackNo Detail
```

The page uses:

```text
Save
Update
Search
Delete
View
Print
```

---

# 53. Rack Table

The confirmed table is:

```text
productwiserackno
```

This is important because Rack is not a simple global rack master.

It is explicitly **product-wise**.

Confirmed insert:

```sql
insert into productwiserackno
(
    pcode,
    pname,
    rackname
)
values
(
    @pcode,
    @pname,
    @rack
)
```

---

# 54. Rack Data Model

The logical structure is:

```text
Product Code
Product Name
Rack Name
```

Therefore:

```text
Product
   |
   +--> Rack assignment
```

rather than:

```text
Rack
   |
   +--> independent location master
```

---

# 55. Rack Duplicate Check

Confirmed:

```sql
select *
from productwiserackno
where pcode=@pcode
and pname=@pname
and rackname=@rack
```

This is the duplicate combination:

```text
Product Code
+
Product Name
+
Rack Name
```

---

# 56. Rack Search

The application uses:

```sql
select * from productwiserackno
```

```sql
select * from productwiserackno
ORDER BY CAST(pcode AS int)
```

```sql
select rackname
from productwiserackno
where pcode='...'
```

```sql
select distinct(pname)
from productwiserackno
where pname LIKE ''+@SearchEmpName+'%'
```

---

# 57. Rack Lookup During Product/Stock Operations

The application frequently executes:

```sql
select distinct(rackname) as rackno
from productwiserackno
where pname=@pname
and rackname LIKE ''+@rackno+'%'
group by rackname
```

Therefore when a product is selected, the system can dynamically suggest/search its configured racks.

---

# 58. Rack in Purchase/Stock Data

The source contains:

```text
rackno
```

inside purchase detail and stock detail structures.

Confirmed purchase insert:

```sql
insert into purentrydetails
(
    ...
    color,
    rackno,
    model,
    fashion,
    style,
    ...
)
values (...)
```

Confirmed stock insert:

```sql
insert into stockdetails
(
    ...
    color,
    rackno,
    model,
    fashion,
    style,
    ...
)
values (...)
```

Therefore:

```text
Product Rack Assignment
        |
        v
Purchase Detail
        |
        v
Stock Detail
```

---

# 59. Rack and Stock Reports

The archive includes:

```text
FloorRackNowiseStockReport.aspx
```

and report outputs such as:

```text
FloorWiseRackno
```

Therefore the system uses Rack as an inventory-location reporting dimension.

---

# 60. Section

A dedicated physical-store Section Master was **not conclusively identified** in the archive under a simple `sectiondetail.aspx` type page.

However, Section is heavily used in the application.

The source confirms:

```text
section
floor
```

as transaction/reporting fields.

For example:

```sql
insert into TMP_CLIENT_ENTRY_PURCH_BACK
(
    ...
    section,
    floor
)
values (...)
```

This means Section can be stored against purchase-related temporary data.

---

# 61. Employee Section

There is a separate confirmed table:

```text
empolyeesectionentry
```

The compiled code contains:

```sql
insert into empolyeesectionentry
(
    section_cd,
    name_eng,
    name_tam,
    date,
    prin_name_eng,
    prin_name_tam
)
values (...)
```

This appears to be an **employee section master**, not necessarily the physical inventory section.

Therefore it should not automatically be mapped to store-location Section without additional database evidence.

---

# 62. Incharge

Purchase/GRN records explicitly carry:

```text
incharge
```

Confirmed:

```sql
insert into purgrnentry
(
    warehouse,
    suplier_name,
    agent_name,
    incharge,
    cmy_name,
    ...
)
values (...)
```

Incharge also appears in reports.

Example:

```text
inchargewisereport.aspx
```

with filters:

```text
Company Name
Counter Name
Supplier Name
Incharge Name
Salesman Name
Item Name
```

Therefore Incharge is a business/reporting dimension associated with transactions, but the archive does not establish it as a strict child of Warehouse or Branch.

---

# 63. Complete Transaction Context

A typical purchase transaction can carry:

```text
Company
Warehouse
Counter
User
Incharge
Supplier
Product
Floor
Rack
```

The major header flow is:

```text
Company
   |
   +----------------------+
                          |
Warehouse                Counter
   |                       |
   +-----------+-----------+
               |
              User
               |
               v
          Purchase / GRN
               |
       +-------+-------+
       |               |
    Incharge        Supplier
       |
       v
   Purchase Lines
       |
       +--> Product
       +--> Floor
       +--> Rack
       +--> Barcode
```

---

# 64. Complete Sales Context

A sales record contains at least:

```text
Company
Counter
User
Product
Barcode
Salesman
Customer
```

Example:

```text
salbill
 ├── cmy_name
 ├── cmy_bill
 ├── countername
 ├── user_id
 ├── barcode
 ├── code
 ├── p_name
 ├── slman
 └── transaction values
```

Therefore:

```text
Company + Counter + User
```

is the operational identity of the sale.

---

# 65. Complete Stock Context

Stock carries product/location attributes such as:

```text
Product
Company-related product identity
Rack
Floor-related reporting
Barcode
GRN
Supplier
```

The source explicitly writes:

```text
rackno
```

into:

```text
stockdetails
```

while Floor is strongly represented in product master and reporting.

---

# 66. Company vs Branch vs Warehouse

This is an important distinction.

## Company

```text
companydetail
```

represents:

```text
business/legal entity
```

and is referenced as:

```text
cmy_name
```

throughout transactions.

## Branch

```text
branchdetail
```

represents:

```text
branch/location/business identity
```

with its own address/tax/bank information.

## Warehouse

```text
warehousedetail
```

represents:

```text
warehouse/store location
```

and is directly selected in Purchase/GRN through:

```text
purgrnentry.warehouse
```

The archive does **not** prove that:

```text
branchdetail
    |
    +--> warehousedetail
```

is enforced by a foreign key.

---

# 67. Company vs Counter

Counter is not the same as Company.

```text
Company
   = business identity
```

while:

```text
Counter
   = operating/billing terminal
```

The evidence is clear because a sale can contain both:

```text
cmy_name
countername
```

and the Counter has its own:

```text
CommonSettings
BarcodeSetting
AccountDate
LoginOpen
```

---

# 68. Counter vs Warehouse

The archive does not show a clean database FK:

```text
countername.warehouse_id
```

Instead:

```text
Counter
   |
   +--> CommonSettings
   +--> AccountDate
   +--> LoginOpen
   +--> Sales
   +--> Purchase temporary records
```

while:

```text
Warehouse
   |
   +--> Purchase/GRN
```

So the two are related operationally but not demonstrably through a direct master relationship.

---

# 69. Store/Location Model Actually Present

The safest representation of the legacy system is:

```text
                    COMPANY
                       |
          +------------+-------------+
          |                          |
       PRODUCTS                 TRANSACTIONS
          |                          |
          |             +------------+-------------+
          |             |            |             |
          |          WAREHOUSE     COUNTER        USER
          |             |            |             |
          |             |            +------+------+
          |             |                   |
          |             +-------------------+
          |                         |
          |                       SALES
          |                       PURCHASE
          |
       FLOOR
          |
       PRODUCT
          |
        RACK
          |
   productwiserackno
```

---

# 70. End-to-End Purchase Example

A typical purchase flow can be represented as:

```text
1. User logs in
       |
2. User operates under Counter
       |
3. AccountDate is resolved
       |
4. Company is selected
       |
5. Warehouse is selected
       |
6. Supplier is selected
       |
7. Incharge/Agent selected
       |
8. Product selected
       |
9. Product already carries Company/Floor
       |
10. Rack selected/configured
       |
11. Purchase header written to purgrnentry
       |
12. Purchase lines written to purentrydetails
       |
13. Stock written to stockdetails
       |
14. Barcode may be generated/linked
```

The exact barcode generation step is documented separately in:

```text
11_barcode.md
```

---

# 71. End-to-End Sales Example

```text
User Login
   |
   v
Counter
   |
   v
CommonSettings
   |
   v
Company
   |
   v
Sales Screen
   |
   v
Scan Barcode
   |
   v
Product / Stock
   |
   v
salbill
   |
   +--> cmy_name
   +--> countername
   +--> user_id
   +--> barcode
   |
   v
Stock reduction
```

---

# 72. End-to-End Location Reporting

The reporting system combines:

```text
Company
Counter
Warehouse
Floor
Rack
Section
Incharge
Supplier
Product
```

Examples from the archive include:

```text
Company-wise reports
Counter-wise sales
Floor-wise stock
Rack-wise stock
Floor + Rack stock
Section-wise reports
Incharge-wise reports
Supplier + Floor/Section reports
```

This demonstrates that these fields are primarily **reporting dimensions**, even where they are not enforced as relational foreign keys.

---

# 73. Master Numbering Pattern

Several legacy masters use the same pattern:

```sql
SELECT COALESCE(MAX(CONVERT(INT,Code))+1, '1')
FROM Table
```

Confirmed for:

```text
Company Code
Branch Code
Warehouse Code
Counter Sl.No
Floor Code
```

This means the application uses **manual/application-side sequence generation** rather than database identity/sequences.

---

# 74. Consequences of the Legacy Numbering Design

Potential issues:

```text
Concurrent users
      |
      v
MAX(Code) + 1
      |
      +--> collision risk
```

The new ERP should use:

```text
SQL IDENTITY
```

or:

```text
SEQUENCE
```

or:

```text
UUID + human-readable code
```

depending on business requirements.

---

# 75. What Is Confirmed

## Confirmed

### Company

```text
companydetail
company detail.aspx
```

### Branch

```text
branchdetail
branchdetail.aspx
```

### Warehouse

```text
warehousedetail
```

### Counter

```text
countername
counternameentry.aspx
```

### Counter configuration

```text
CommonSettings
commonsettings.aspx
```

### Floor

```text
foolerdetail
foolerdetail.aspx
```

### Rack

```text
productwiserackno
RackNo.aspx
```

### Business date

```text
AccountDate
```

### Runtime login context

```text
LoginOpen
```

---

# 76. What Is Not Confirmed

The archive does **not** conclusively prove:

```text
Company -> Branch foreign key
Branch -> Warehouse foreign key
Warehouse -> Counter foreign key
Counter -> Floor foreign key
Floor -> Rack foreign key
```

The current system frequently passes these values by name/string.

Therefore the new ERP should not reproduce the legacy structure blindly.

---

# 77. Recommended New ERP Structure

A cleaner relational model would be:

```text
companies
    |
    +--> branches
             |
             +--> stores / warehouses
                     |
                     +--> floors
                             |
                             +--> racks
                                     |
                                     +--> stock locations

companies
    |
    +--> counters

counters
    |
    +--> counter_settings

users
    |
    +--> allowed_companies
    +--> allowed_branches
    +--> allowed_stores
    +--> allowed_counters
```

This separates:

```text
Legal entity
Physical location
Inventory location
Billing terminal
User context
```

---

# 78. Recommended New ERP Transaction Model

Instead of storing only names:

```text
cmy_name
warehouse
countername
rackno
floor_name
```

use stable IDs:

```text
company_id
branch_id
warehouse_id
counter_id
floor_id
rack_id
```

Example:

```text
purchase_header
 ├── company_id
 ├── branch_id
 ├── warehouse_id
 ├── counter_id
 ├── user_id
 ├── supplier_id
 └── business_date

purchase_detail
 ├── product_id
 ├── barcode_id
 ├── floor_id
 └── rack_id
```

---

# 79. Critical Migration Rule

Do not assume:

```text
Warehouse = Branch
```

or:

```text
Counter = Store
```

from the legacy names.

The source demonstrates that they have different operational roles.

Use the following interpretation:

```text
Company
    Legal/business identity

Branch
    Business/location identity

Warehouse / Store
    Inventory receiving/storage location

Counter
    Sales/billing operating point

Floor
    Product/store display or inventory dimension

Rack
    Product-specific physical placement

Section
    Reporting/organizational dimension, with exact physical meaning
    requiring further database validation
```

---

# 80. Final End-to-End Architecture

```text
                         COMPANY
                            |
             +--------------+--------------+
             |                             |
          BRANCH                       PRODUCTS
             |                             |
        WAREHOUSE                         FLOOR
             |                             |
             |                            RACK
             |                             |
             +--------------+--------------+
                            |
                       INVENTORY
                            |
             +--------------+--------------+
             |                             |
         PURCHASE                        SALES
             |                             |
       purgrnentry                      salbill
             |                             |
         warehouse                     countername
         cmy_name                      cmy_name
         incharge                      user_id
             |                             |
             +-------------+---------------+
                           |
                        COUNTER
                           |
                  +--------+--------+
                  |                 |
            CommonSettings      LoginOpen
                  |
              AccountDate
                  |
                 USER
```

---

# 81. Migration Priority

## Preserve exactly

1. Company identity and code
2. Company legal/tax details
3. Branch identity
4. Warehouse/store identity
5. Counter identity
6. Counter-specific configuration
7. Business date by counter/user
8. Product-to-floor relationship
9. Product-to-rack relationship
10. Company/counter/user transaction context
11. Warehouse on purchase/GRN
12. Rack on purchase/stock where present

## Redesign

1. Foreign-key relationships
2. Code generation
3. Soft delete
4. Store hierarchy
5. Counter-to-store relationship
6. Location IDs
7. User-to-location permissions
8. Audit history

---

# 82. Source Files / Assemblies Traced

```text
company detail.aspx
branchdetail.aspx
counternameentry.aspx
NewCounterSetting.aspx
NewCounterBarcodeSetting.aspx
NewCounterCommBarcodeSetting.aspx
NewCounterGRNsetting.aspx
NewCounterPrintSetting.aspx
NewCounterSalesIDsetting.aspx
commonsettings.aspx
foolerdetail.aspx
RackNo.aspx
FloorWiseCurrentStockDetail.aspx
FloorWiseCurrentStockSummary.aspx
FloorWiseMinimumQty.aspx
FloorRackNowiseStockReport.aspx
inchargewisereport.aspx
```

Relevant compiled assemblies:

```text
App_Web_okdk43vd.dll
App_Web_3o5ctsin.dll
App_Web_fjjpcsjn.dll
App_Web_n5bh3be3.dll
App_Web_tw3vpscp.dll
App_Web_4qyf2ren.dll
```

Relevant database objects:

```text
companydetail
branchdetail
warehousedetail
countername
CommonSettings
AccountDate
LoginOpen
foolerdetail
productwiserackno
purgrnentry
purentrydetails
stockdetails
salbill
PurchaseEntrySubTemp
PurchaseUpdateMainTemp
SmallPurchaseEntryMainHeadTemp
empolyeesectionentry
```

---

# 83. Final Conclusion

TextileSoft has **multiple location and organizational concepts**, but they are not implemented as a clean hierarchy.

The strongest confirmed data relationships are:

```text
COMPANY
  ↓
newproduct.cmy_name
  ↓
purchase/sales/report transactions
```

```text
WAREHOUSE
  ↓
purgrnentry.warehouse
  ↓
purchase/GRN
```

```text
COUNTER
  ↓
CommonSettings
  ↓
AccountDate / LoginOpen
  ↓
Sales / Purchase / Cash / Barcode configuration
```

```text
FLOOR
  ↓
newproduct.floor_name
  ↓
floor-wise stock/reporting
```

```text
PRODUCT
  ↓
productwiserackno
  ↓
rackno in purchase/stock
  ↓
rack-wise reporting
```

The most important migration point is that **Company, Warehouse and Counter must remain separate concepts**. They happen to travel together through many transactions, but the source does not demonstrate a normalized foreign-key hierarchy between them.

For the new SQL ERP, the correct target is therefore a normalized:

```text
Company
  → Branch
    → Store/Warehouse
      → Floor
        → Rack

Company
  → Counter

User
  → Company / Branch / Store / Counter permissions
```

with transactions referencing IDs rather than legacy text names.
