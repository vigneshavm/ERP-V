# 10. GST - End-to-End Flow

## 1. Purpose

This document describes the GST architecture and end-to-end data flow identified in the TextileSoft source:

```text
GST Group Master
      |
      +----> Product Master
      |        |
      |        +----> HSN / Product HSN
      |
      +----> Purchase
      |        |
      |        +----> Purchase GST snapshot
      |
      +----> Sales Billing
      |        |
      |        +----> GST / CGST / SGST / IGST snapshot
      |
      +----> Purchase Return
      |
      +----> Sales Return
      |
      +----> GST / Sales / Purchase Reports
```

The key architectural principle is that TextileSoft does not treat GST as only a report-time calculation. GST-related values are carried into transaction records so historical transactions can retain the tax context that existed when the transaction was posted.

---

# 2. Executive Summary

The confirmed GST-related objects and fields identified in the source include:

- `gstgroup`
- `gst_group` in `newproduct`
- `hsn_code` in `newproduct`
- `ProductHSNCode` in `newproduct`
- `gst_per` in sales transaction data
- CGST/SGST/IGST-related transaction fields
- GST-related fields in purchase transaction flows
- HSN-related report queries
- Company/tax context used by purchase and sales

The main Product Master GST flow is:

```text
Product Master
    |
    +-- GST Group Name
    |      |
    |      +--> gstgroup
    |
    +-- HSN CODE
    |      |
    |      +--> newproduct.hsn_code
    |
    +-- Product HSN Code
           |
           +--> newproduct.ProductHSNCode
```

At sales time, the product GST/HSN information is resolved and transaction-level GST values are stored with the sale.

At purchase time, GST is similarly part of the purchase calculation and transaction persistence.

Returns must reverse the corresponding taxable transaction without recomputing historical tax using today's master configuration.

---

# 3. GST Business Objects

## 3.1 GST Group

Primary master table:

```text
gstgroup
```

The Product Master validates the selected GST group against this table.

Confirmed query pattern:

```sql
select *
from gstgroup
where gst_name = @gstgroupname
```

Therefore the GST group is a controlled master value rather than unrestricted text.

---

## 3.2 Product GST Group

The Product Master stores:

```text
newproduct.gst_group
```

This links the product to the GST group concept.

The product insert contains:

```sql
gst_group
```

and the product update also persists:

```sql
gst_group = @gst_group
```

---

## 3.3 HSN Code

The Product Master contains:

```text
newproduct.hsn_code
```

This is one HSN-related field used by the legacy application.

---

## 3.4 Product HSN Code

The same Product Master also contains:

```text
newproduct.ProductHSNCode
```

This is separately queried in downstream code.

Examples of confirmed query patterns include:

```sql
select DISTINCT(ProductHSNCode)
from newproduct
where name = @ProductName
```

and:

```sql
select ProductHSNCode
from newproduct
where name = @ProductName
```

The application also uses:

```sql
select print_name,
       PnameTamil,
       PrintNameTamil
from newproduct
where hsn_code = @hsn_code
```

### Migration warning

Do not automatically merge:

```text
hsn_code
ProductHSNCode
```

into one new column.

Their exact historical semantic distinction should be confirmed from live data and all report queries before migration.

---

# 4. GST Master Dependency

The core dependency is:

```text
gstgroup
    |
    +---- gst_name
             |
             v
        newproduct.gst_group
```

The Product Master validates the GST group before saving.

Known validation messages include:

```text
Please Enter the GST Group Name
Please Enter the Correct GST Group Name
```

This means Product creation is dependent on a valid GST master entry.

---

# 5. Product Creation GST Flow

The Product Master page is:

```text
newproduct.aspx
```

Relevant UI:

```text
GST Group Name
HSN CODE
```

The product save flow is:

```text
User enters product
        |
        +--> selects company
        |
        +--> selects GST Group
        |
        +--> enters HSN
        |
        +--> enters Product HSN
        |
        v
GST group validation
        |
        v
newproduct INSERT
```

The confirmed Product INSERT contains:

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
values(
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

Therefore GST group and HSN are part of the persistent Product Master identity/configuration.

---

# 6. Product Update GST Flow

The Product Master update contains:

```sql
update newproduct
set
    ...
    hsn_code = @hsn_code,
    ...
    gst_group = @gst_group,
    ...
    ProductHSNCode = @ProductHSNCode
where code = @code
and cmy_name = @cmy_name
```

This means GST configuration can change at Product Master level.

## Historical implication

A later Product Master update must not silently change the tax basis of an already-posted invoice.

Recommended ERP rule:

```text
Product GST Master
       |
       | current/default configuration
       v
Transaction GST Snapshot
       |
       +--> never recalculated from current master for historical bills
```

---

# 7. GST Validation

The confirmed Product Master validations include:

```text
Please Enter the GST Group Name
Please Enter the Correct GST Group Name
```

The second validation is backed by the GST group lookup.

Conceptually:

```text
GST Group entered
       |
       v
gstgroup lookup
       |
   +---+---+
   |       |
 valid   invalid
   |       |
 save    reject
```

---

# 8. GST and HSN Relationship

GST and HSN are related but not identical.

```text
GST Group
    |
    +--> determines/represents tax classification
    |
HSN Code
    |
    +--> identifies goods classification
```

In the legacy Product Master:

```text
newproduct
    |
    +-- gst_group
    +-- hsn_code
    +-- ProductHSNCode
```

Do not model HSN as a substitute for GST Group.

---

# 9. Purchase GST Flow

Purchase begins with:

```text
Purchase Entry
```

The purchase transaction uses:

```text
Product
Company
Supplier
Warehouse
Quantity
Rate
GST
HSN
```

The purchase line is the point where the tax context becomes part of the financial/inventory transaction.

General flow:

```text
Product Master
    |
    +--> GST Group
    +--> HSN
    |
    v
Purchase Entry
    |
    +--> taxable value
    +--> GST %
    +--> tax amount
    |
    v
purgrnentry
purentrydetails
```

The purchase documentation should be treated as the authoritative transaction flow for purchase GST.

---

# 10. Purchase Tax Calculation Model

The generic taxable calculation is:

```text
Taxable Amount
    = Quantity × Purchase Rate
      adjusted for applicable discount/less rules
```

Then:

```text
GST Amount
    = Taxable Amount × GST Rate / 100
```

For intra-state transactions:

```text
GST
 |
 +-- CGST
 |
 +-- SGST
```

Typically:

```text
CGST = GST / 2
SGST = GST / 2
```

For inter-state transactions:

```text
IGST
```

The exact legacy branching condition for intra-state/inter-state determination must be validated against the production company/state configuration before migration.

This document does not assume a state comparison that was not proven by the source.

---

# 11. Purchase GST Persistence

The purchase transaction must retain enough information to reconstruct the original tax calculation.

Conceptually:

```text
Purchase Header
    |
    +-- supplier
    +-- company
    +-- warehouse
    +-- invoice
    |
Purchase Detail
    |
    +-- product
    +-- HSN
    +-- taxable rate
    +-- quantity
    +-- GST %
    +-- tax amount
```

The new ERP should preserve the GST snapshot at transaction time.

---

# 12. Sales GST Flow

The confirmed sales line structure includes:

```text
gst_per
```

The sales line also contains:

```text
code
p_name
unit
rate
qty
amt
cmy_name
cmy_bill
gst_per
...
```

The sales insert pattern therefore stores GST information together with the line item.

General flow:

```text
Product
   |
   +--> GST Group
   +--> HSN
   |
   v
Barcode / SKU
   |
   v
Sales Billing
   |
   +--> taxable value
   +--> GST %
   +--> CGST/SGST/IGST
   |
   v
SALBILL
```

---

# 13. Sales Line GST Snapshot

The sales line contains:

```text
gst_per
```

This is important because it means the sales transaction retains the GST percentage used during billing.

Recommended migration model:

```text
product.gst_group_id
        |
        v
billing calculation
        |
        +--> gst_rate_snapshot
        +--> cgst_rate_snapshot
        +--> sgst_rate_snapshot
        +--> igst_rate_snapshot
        +--> hsn_snapshot
```

Do not calculate historical invoice GST from today's Product Master.

---

# 14. Sales GST Calculation

General retail sales calculation:

```text
Gross Line Amount
    =
Selling Rate × Quantity
```

Then apply the applicable product/bill discount rules.

```text
Taxable Value
    =
Gross Value
    - applicable discount/less
```

Then:

```text
GST Amount
    =
Taxable Value × GST % / 100
```

For intra-state:

```text
CGST + SGST
```

For inter-state:

```text
IGST
```

The exact order of every discount/less/rounding operation varies by billing variant and should be retained from the existing billing calculation rather than replaced by a generic formula.

---

# 15. GST Rates Observed in Sales/Purchase Documentation

The billing flows contain references to:

```text
5%
12%
18%
28%
```

These should be treated as transaction tax-rate values used by the application, not as a hardcoded master design requirement for the new ERP.

Recommended:

```text
gst_rates
```

as configurable master data.

Example:

```text
5
12
18
28
```

But the database should support future rates without schema changes.

---

# 16. CGST / SGST / IGST

The sales architecture distinguishes:

```text
CGST
SGST
IGST
```

Conceptually:

```text
GST
 |
 +---- Intra-state
 |       |
 |       +-- CGST
 |       +-- SGST
 |
 +---- Inter-state
         |
         +-- IGST
```

The transaction must store the resulting amounts, not only the GST percentage.

Recommended fields:

```text
cgst_rate
cgst_amount
sgst_rate
sgst_amount
igst_rate
igst_amount
```

---

# 17. HSN on Invoice

HSN belongs to the product classification layer but should be copied into the invoice line.

Recommended:

```text
product.hsn_code
       |
       v
sales_line.hsn_code_snapshot
```

Reason:

```text
Product HSN can change later.
Historical invoice HSN must remain unchanged.
```

---

# 18. GST and Barcode

Barcode is not itself the tax master.

The relationship is:

```text
Product
   |
   +--> GST Group
   +--> HSN
   |
   v
Product Variant / SKU
   |
   v
Barcode
   |
   v
Sale
   |
   +--> GST snapshot
```

Therefore:

```text
Barcode != GST configuration
```

Barcode identifies the sellable physical item/SKU.

Product GST classification supplies the default tax configuration.

---

# 19. GST and Product Attributes

The following are separate dimensions:

```text
GST
HSN
Brand
Pattern
Color
Size
Style
Design
Rack
```

GST should not be embedded into:

```text
Brand
Pattern
Size
Color
Style
```

The recommended model is:

```text
Product
 |
 +-- Tax classification
 |      +-- GST Group
 |      +-- HSN
 |
 +-- Variant attributes
        +-- Brand
        +-- Pattern
        +-- Size
        +-- Color
        +-- Style
```

---

# 20. Purchase Return GST Flow

Purchase return reverses an earlier purchase.

Correct conceptual lineage:

```text
Original Purchase
      |
      +--> original taxable value
      +--> original GST
      |
      v
Purchase Return
      |
      +--> returned taxable value
      +--> GST reversal
```

The return should use the original transaction's tax context whenever possible.

Do not calculate a historical return using a newly changed Product GST Group.

Recommended:

```text
original_purchase_line.gst_snapshot
              |
              v
purchase_return_line
              |
              +--> returned taxable amount
              +--> returned GST
```

---

# 21. Sales Return GST Flow

Sales Return follows the same historical principle:

```text
Original Sale
     |
     +--> GST snapshot
     |
     v
Sales Return
     |
     +--> taxable reversal
     +--> CGST reversal
     +--> SGST reversal
     +--> IGST reversal
```

The return must reference the original bill/line/barcode wherever the source supports it.

---

# 22. Full GST Lifecycle

```text
GST Master
    |
    v
gstgroup
    |
    v
Product Master
    |
    +--> gst_group
    +--> hsn_code
    +--> ProductHSNCode
    |
    +-------------------+
    |                   |
    v                   v
Purchase             Sales
    |                   |
    v                   v
Purchase Lines       Sales Lines
    |                   |
    +--> GST snapshot   +--> GST snapshot
    |                   |
    v                   v
Purchase Return      Sales Return
    |                   |
    +--> tax reversal   +--> tax reversal
    |
    +-------------------+
              |
              v
         GST Reports
```

---

# 23. GST Reporting

GST-related reporting requires at least:

```text
Company
Date
Invoice
Product
HSN
GST Rate
Taxable Amount
CGST
SGST
IGST
Total GST
```

Useful reporting dimensions:

```text
HSN-wise
GST-rate-wise
Company-wise
Date-wise
Sales-wise
Purchase-wise
Return-wise
```

The legacy application has HSN and GST-related report/query usage.

---

# 24. GST Reconciliation

The recommended reconciliation model is:

```text
Sales Taxable Amount
        +
Purchase Taxable Amount
        -
Sales Returns
        -
Purchase Returns
```

with separate reconciliation for:

```text
CGST
SGST
IGST
```

The new ERP should never reconcile only on invoice totals.

It should reconcile:

```text
Invoice Header
    ↕
Invoice Lines
    ↕
GST Lines
    ↕
Ledger / Tax Summary
```

---

# 25. GST Transaction Snapshot

A robust new ERP should use a dedicated tax snapshot.

Recommended:

```text
transaction_tax
-----------------------------
id
document_type
document_id
document_line_id
hsn_code
gst_group_id
gst_rate
taxable_amount
cgst_rate
cgst_amount
sgst_rate
sgst_amount
igst_rate
igst_amount
cess_rate
cess_amount
created_at
```

This prevents the historical document from depending on current master data.

---

# 26. Recommended Product Tax Structure

Recommended Product fields:

```text
products
-----------------------------
id
company_id
product_code
product_name
gst_group_id
hsn_code
product_hsn_code
is_taxable
created_at
updated_at
```

GST master:

```text
gst_groups
-----------------------------
id
gst_name
description
is_active
created_at
updated_at
```

Rate master:

```text
gst_rates
-----------------------------
id
rate
effective_from
effective_to
is_active
```

---

# 27. Recommended Tax Determination Flow

```text
Transaction
    |
    v
Product
    |
    v
GST Group
    |
    v
GST Rate
    |
    +--> transaction type
    |
    +--> supply state
    |
    +--> customer/supplier state
    |
    v
Tax Determination
    |
    +--> CGST + SGST
    |
    OR
    |
    +--> IGST
    |
    v
Tax Snapshot
```

The state-based branch must be implemented only after confirming the actual company/customer/supplier state fields used by the deployed system.

---

# 28. GST Calculation vs GST Master

These are two different responsibilities.

### GST Master

Answers:

```text
What tax classification applies?
```

### GST Calculation

Answers:

```text
How much tax applies to this transaction?
```

### Transaction Tax Snapshot

Answers:

```text
What tax was actually posted?
```

Recommended architecture:

```text
Master
  |
  v
Determination
  |
  v
Calculation
  |
  v
Snapshot
  |
  v
Ledger / Report
```

---

# 29. GST and Discounts

The sales system supports multiple discount concepts.

Potential calculation stages include:

```text
MRP
  |
  v
Selling Rate
  |
  v
Product Discount
  |
  v
Bill Discount / Less
  |
  v
Taxable Amount
  |
  v
GST
```

The exact sequence must follow the billing variant's existing implementation.

Do not globally assume:

```text
GST = MRP × GST%
```

The taxable base is the transaction's final taxable value.

---

# 30. GST and Round Off

Billing may contain:

```text
Round Off
```

Recommended separation:

```text
Tax calculation
      |
      v
Invoice total
      |
      v
Round off
```

Round-off should not alter the GST rate or HSN.

---

# 31. GST and Free Quantity

Purchase transactions may include:

```text
quantity
free_quantity
```

The treatment of free goods for GST depends on the actual billing/business rule.

The new ERP should not automatically assume that:

```text
free quantity = zero taxable value
```

or:

```text
free quantity = normal taxable quantity
```

without confirming the legacy implementation and statutory business requirement.

---

# 32. GST and Purchase Charges

Purchase may contain additional charges.

Potential taxable treatment:

```text
Product taxable value
        +
eligible charges
        |
        v
GST taxable base
```

The exact inclusion rules should be preserved from the existing purchase calculation.

Charges should therefore be represented separately rather than folded permanently into the product rate.

---

# 33. GST and Company

GST configuration can be company-specific in a multi-company TextileSoft deployment.

Recommended:

```text
company
   |
   +--> GST registration
   +--> state
   +--> GSTIN
   |
   +--> products
   +--> transactions
```

Do not assume one GST registration for all companies.

---

# 34. GSTIN

GSTIN is a registration identity and should be separate from:

```text
GST rate
GST group
HSN
```

Recommended:

```text
company_tax_registration
-----------------------------
id
company_id
gstin
state_code
registration_type
effective_from
effective_to
is_active
```

For supplier/customer:

```text
supplier_tax_registration
customer_tax_registration
```

if the business requires multi-registration support.

---

# 35. GST State Determination

The conceptual rule is:

```text
Supplier State
Customer/Company State
        |
        v
Supply Type
        |
   +----+----+
   |         |
intra      inter
   |         |
CGST+SGST   IGST
```

The source evidence must be checked against the deployed configuration before enforcing this as a universal rule.

---

# 36. GST Return Posting

## Purchase Return

```text
Original Purchase
      |
      v
Return quantity
      |
      v
Original taxable amount proportion
      |
      v
GST reversal
      |
      +--> CGST reversal
      +--> SGST reversal
      +--> IGST reversal
```

## Sales Return

```text
Original Sale
      |
      v
Returned quantity
      |
      v
Original taxable amount
      |
      v
GST reversal
```

The return should preserve the original tax classification.

---

# 37. GST and Credit Notes

A sales return can have a financial representation equivalent to a credit-note event.

Recommended document model:

```text
Sales Invoice
     |
     +--> Sales Return / Credit Note
```

The tax reversal should be tied to the original invoice.

---

# 38. GST Audit Trail

Every tax-bearing document should record:

```text
Created By
Created At
Updated By
Updated At
Company
Document Number
Document Date
Tax Classification
Tax Rate
Taxable Value
Tax Amount
```

Do not allow historical GST amounts to be silently recalculated during editing.

---

# 39. GST Edit Rules

Recommended:

### Before posting

Allow:

```text
GST group
HSN
rate
quantity
discount
```

subject to permissions.

### After posting

Do not directly mutate the tax history.

Use:

```text
cancel
reverse
credit note
reissue
```

depending on the business process.

---

# 40. GST Delete Rules

GST master records should not be physically deleted when referenced by transactions.

Instead:

```text
is_active = false
```

Recommended:

```text
gst_groups
    |
    +--> referenced by products
    |
    +--> referenced by transactions
```

A referenced GST group should be deactivated rather than deleted.

---

# 41. GST Master Versioning

For future-safe tax handling:

```text
gst_rates
-----------------------------
rate
effective_from
effective_to
```

Example:

```text
5%
effective_from = ...
effective_to = ...
```

This allows:

```text
old invoice -> old rate
new invoice -> new rate
```

without rewriting history.

---

# 42. GST Database Relationships

Recommended:

```text
company
   |
   +---- gst_registration
   |
product
   |
   +---- gst_group
   |
   +---- hsn
   |
sales_invoice
   |
   +---- sales_line
           |
           +---- tax_snapshot
```

Purchase:

```text
supplier
   |
purchase_invoice
   |
purchase_line
   |
tax_snapshot
```

Returns:

```text
original_document
        |
        v
return_document
        |
        v
return_line
        |
        v
tax_reversal
```

---

# 43. GST SQL Indexing

Recommended indexes:

```sql
gst_groups(gst_name)

products(gst_group_id)
products(hsn_code)
products(ProductHSNCode)

sales_lines(invoice_id)
sales_lines(gst_rate)

purchase_lines(invoice_id)
purchase_lines(gst_rate)

tax_lines(document_type, document_id)
tax_lines(hsn_code)
```

For reporting:

```sql
tax_lines(document_date, gst_rate)
tax_lines(hsn_code, document_date)
```

---

# 44. GST Data Integrity

Required constraints:

```text
GST Group must exist
HSN format must be valid for configured business rules
GST rate must be non-negative
Tax amount must match taxable value and rate within rounding tolerance
CGST + SGST must equal GST for intra-state transactions
IGST must be used instead of CGST/SGST for inter-state transactions where applicable
```

These should be validated at service/database transaction boundaries.

---

# 45. GST Rounding

Tax calculations require explicit rounding rules.

Recommended:

```text
Calculate at line level
Round according to configured currency precision
Store rounded transaction tax
Reconcile header total from stored line values
```

Do not repeatedly recompute tax from floating-point values during reporting.

---

# 46. GST and Currency

The TextileSoft environment appears primarily rupee-based.

Recommended new ERP should still store:

```text
currency_code
exchange_rate
```

if multi-currency purchase is required.

GST should be calculated using the transaction's taxable amount in the accounting currency according to the configured tax/accounting rules.

---

# 47. GST Report Flow

```text
Transaction tables
       |
       +--> Sales
       +--> Purchase
       +--> Sales Return
       +--> Purchase Return
       |
       v
Tax aggregation
       |
       +--> HSN
       +--> GST rate
       +--> CGST
       +--> SGST
       +--> IGST
       |
       v
GST reports/export
```

Reports should use posted transaction/tax snapshots rather than current Product Master GST configuration.

---

# 48. GST Reconciliation Checks

Recommended daily checks:

```text
Sales invoice GST
+
Sales return GST reversal
=
Net sales GST
```

and:

```text
Purchase GST
-
Purchase return GST
=
Net purchase GST
```

Then:

```text
Tax report
=
Transaction ledger
=
Invoice totals
```

Differences should be identified by:

```text
company
date
invoice
HSN
GST rate
tax type
```

---

# 49. Common GST Failure Scenarios

## Invalid GST Group

```text
Product save
   |
   v
gstgroup lookup fails
   |
   v
reject product
```

## Missing HSN

```text
Product
   |
   v
invoice
   |
   v
HSN missing
```

Must be caught before posting where required.

## Changed GST Master

```text
Product GST changed
   |
   v
old invoice
```

Old invoice must remain unchanged.

## Return using current rate

Incorrect:

```text
Current GST rate × return quantity
```

Correct:

```text
Original transaction GST snapshot
```

where historical linkage is available.

---

# 50. Migration Mapping

Legacy:

```text
gstgroup
```

New:

```text
gst_groups
```

Legacy Product:

```text
newproduct.gst_group
```

New:

```text
products.gst_group_id
```

Legacy:

```text
newproduct.hsn_code
```

New:

```text
products.hsn_code
```

Legacy:

```text
newproduct.ProductHSNCode
```

New:

```text
products.product_hsn_code
```

Legacy sales:

```text
salbill.gst_per
```

New:

```text
sales_tax.gst_rate
```

Legacy purchase:

```text
purchase GST fields
```

New:

```text
purchase_tax
```

Legacy returns:

```text
return GST fields
```

New:

```text
return_tax_reversal
```

---

# 51. Migration Warning: HSN Dual Fields

The two Product fields:

```text
hsn_code
ProductHSNCode
```

must be profiled before migration.

Required analysis:

```sql
select
    count(*) as total_rows,
    count(hsn_code) as hsn_code_count,
    count(ProductHSNCode) as product_hsn_count
from newproduct;
```

Then:

```sql
select
    hsn_code,
    ProductHSNCode,
    count(*) as product_count
from newproduct
group by hsn_code, ProductHSNCode;
```

This identifies:

```text
same value
different values
one populated
both missing
```

Do not merge blindly.

---

# 52. GST Master Duplicate Analysis

Before migration:

```sql
select
    gst_name,
    count(*) as duplicate_count
from gstgroup
group by gst_name
having count(*) > 1;
```

Normalize only after checking whether duplicates represent:

```text
different company
different effective period
accidental duplicates
```

---

# 53. GST Product Mapping Validation

After migration:

```text
legacy product
      |
      +--> gst_group
      +--> hsn_code
      +--> ProductHSNCode
```

must equal:

```text
new product
      |
      +--> gst_group_id
      +--> hsn_code
      +--> product_hsn_code
```

No tax-bearing product should lose its GST classification during migration.

---

# 54. Transaction Reconciliation

For every migrated sales invoice:

```text
Legacy:
salbill
sales2
```

compare against:

```text
New:
sales_invoice
sales_line
sales_tax
```

Compare:

```text
invoice number
date
product
quantity
taxable value
GST rate
CGST
SGST
IGST
total
```

Purchase:

```text
purgrnentry
purentrydetails
```

versus:

```text
purchase_invoice
purchase_line
purchase_tax
```

Returns must be reconciled separately.

---

# 55. SQL Transaction Atomicity

GST posting must be atomic with the invoice.

Recommended:

```text
BEGIN TRANSACTION

insert invoice
insert invoice lines
insert tax lines
insert payment/ledger
update stock

COMMIT
```

On failure:

```text
ROLLBACK
```

Never leave:

```text
invoice exists
but tax does not exist
```

or:

```text
tax exists
but invoice does not exist
```

---

# 56. SQL Security

All new GST SQL must use parameters.

Correct:

```sql
where gst_name = @gstName
```

Avoid:

```sql
where gst_name = ' + userInput + '
```

The legacy source contains string-concatenated query patterns in several areas, so the new ERP should not reproduce that pattern.

---

# 57. API Layer

Recommended API separation:

```text
GET  /api/gst/groups
GET  /api/gst/rates
GET  /api/gst/hsn/:code
POST /api/gst/groups
PUT  /api/gst/groups/:id
PATCH /api/gst/groups/:id/status
```

Tax calculation:

```text
POST /api/tax/calculate
```

Transaction tax should normally be calculated server-side, not trusted from the browser.

---

# 58. UI Flow

GST configuration:

```text
GST Settings
    |
    +--> GST Groups
    +--> GST Rates
```

Product:

```text
Product Master
    |
    +--> GST Group
    +--> HSN
```

Purchase:

```text
Purchase Entry
    |
    +--> Product
    +--> GST
    +--> Taxable
    +--> Tax
```

Sales:

```text
Sales Billing
    |
    +--> Product/Barcode
    +--> GST
    +--> Taxable
    +--> CGST/SGST/IGST
```

Invoice:

```text
Invoice
    |
    +--> HSN
    +--> GST rate
    +--> Tax values
```

---

# 59. Recommended GST Service

A dedicated service is preferable:

```text
TaxService
```

Responsibilities:

```text
resolveTaxClassification()
resolveTaxRate()
calculateTax()
splitCgstSgst()
calculateIgst()
roundTax()
createTaxSnapshot()
reverseTax()
```

It should not directly own Product Master CRUD.

---

# 60. Recommended Calculation Object

Conceptually:

```text
TaxCalculationInput
-----------------------------
companyId
productId
hsnCode
gstGroupId
taxableAmount
supplierState
customerState
companyState
transactionType
transactionDate
```

Output:

```text
TaxCalculationResult
-----------------------------
gstRate
cgstRate
cgstAmount
sgstRate
sgstAmount
igstRate
igstAmount
totalTax
```

This makes purchase, sales and returns use the same tax engine.

---

# 61. GST State Machine

Master:

```text
DRAFT
  |
  v
ACTIVE
  |
  v
INACTIVE
```

Transaction:

```text
DRAFT
  |
  v
CALCULATED
  |
  v
POSTED
  |
  +----> CANCELLED
  |
  +----> RETURNED/REVERSED
```

Tax snapshot must remain immutable after POSTED.

---

# 62. What Is Confirmed from TextileSoft

Confirmed:

- `gstgroup` exists.
- Product Master uses `gst_group`.
- Product Master uses `hsn_code`.
- Product Master uses `ProductHSNCode`.
- Product save validates GST group.
- Product INSERT persists GST group and HSN fields.
- Product UPDATE persists GST group and HSN fields.
- Sales transaction data contains `gst_per`.
- Sales architecture carries GST alongside product/bill data.
- Purchase documentation includes GST-related transaction handling.
- Sales and purchase returns are separate transaction flows.
- HSN is used by downstream queries/reports.

---

# 63. What Is Not Safe to Assume

The source should not be treated as proving:

- One universal GST rate table for every transaction.
- One universal intra-state/inter-state algorithm across every billing variant.
- That `hsn_code` and `ProductHSNCode` are semantically identical.
- That every sales variant stores tax using exactly the same columns.
- That every purchase variant calculates GST in exactly the same sequence.
- That free quantity has one universal tax treatment.
- That every additional purchase charge is taxable in exactly the same way.
- That stock posting and GST posting are implemented by one universal procedure.
- That all GST reports use the same underlying transaction tables.

These must be verified against the relevant source/production data before consolidation.

---

# 64. Recommended New ERP GST Architecture

```text
                         +----------------+
                         |   gst_groups   |
                         +-------+--------+
                                 |
                                 v
                         +---------------+
                         |    products   |
                         | gst_group_id  |
                         | hsn_code      |
                         +-------+-------+
                                 |
                    +------------+------------+
                    |                         |
                    v                         v
             +-------------+           +-------------+
             |   Purchase  |           |    Sales    |
             +------+------+           +------+------+
                    |                         |
                    v                         v
             +-------------+           +-------------+
             | purchase_tax|           |  sales_tax  |
             +------+------+           +------+------+
                    |                         |
                    +------------+------------+
                                 |
                                 v
                         +---------------+
                         | GST Reporting |
                         +---------------+
```

Returns:

```text
Purchase
   |
   v
Purchase Return
   |
   v
Purchase Tax Reversal

Sales
   |
   v
Sales Return
   |
   v
Sales Tax Reversal
```

---

# 65. Final End-to-End GST Flow

```text
1. Create GST Group
        |
        v
2. Configure GST Rate
        |
        v
3. Create Product
        |
        +--> GST Group
        +--> HSN
        +--> Product HSN
        |
        v
4. Purchase Product
        |
        +--> Resolve GST
        +--> Calculate purchase tax
        +--> Store transaction tax
        |
        v
5. Barcode / Stock
        |
        v
6. Sell Product
        |
        +--> Resolve original/current tax configuration
        +--> Calculate taxable value
        +--> Calculate GST
        +--> CGST/SGST or IGST
        +--> Store tax snapshot
        |
        v
7. Sales Return
        |
        +--> Link original sale
        +--> Reverse taxable value
        +--> Reverse GST
        |
        v
8. Purchase Return
        |
        +--> Link original purchase
        +--> Reverse taxable value
        +--> Reverse GST
        |
        v
9. GST Reports
        |
        +--> HSN
        +--> GST rate
        +--> Taxable
        +--> CGST
        +--> SGST
        +--> IGST
        +--> Returns
        |
        v
10. Reconciliation
```

---

# 66. Final Architecture Rule

The most important rule for the new ERP is:

```text
GST Master
    !=
Transaction GST
```

Master data determines the default tax classification.

The transaction stores the actual tax determination used at posting time.

Therefore:

```text
Current Product GST
```

must never overwrite:

```text
Historical Invoice GST
```

This is critical for:

- invoice reprinting
- GST reports
- returns
- audit
- financial reconciliation
- migration
- historical tax reporting.

---

# 67. Final Conclusion

TextileSoft's GST architecture is centered on the `gstgroup` master and Product Master GST/HSN fields, with GST values flowing into purchase and sales transactions.

The correct migration architecture is therefore:

```text
GST Group Master
       |
       v
Product Tax Classification
       |
       v
Transaction Tax Determination
       |
       v
Immutable Tax Snapshot
       |
       +----> Sales
       +----> Purchase
       +----> Sales Return
       +----> Purchase Return
       |
       v
GST Reports / Reconciliation
```

The new ERP should preserve the legacy tax information for historical accuracy while separating:

```text
GST Master
GST Rate Master
Product Tax Classification
Transaction Tax Calculation
Transaction Tax Snapshot
Tax Reversal
GST Reporting
```

This provides a safer foundation than recalculating GST directly from the current Product Master during reporting or returns.
