# TextileSoft Module Documentation

**Source:** `TEXTILESOFT 17.07.2025`

This document describes the identified business module and its known source-level areas. It is intended as a working reference for the TextileSoft analysis and ERP migration.

> Note: TextileSoft is a legacy ASP.NET WebForms application. Some server-side business logic is compiled into `App_Web_*.dll` assemblies, so a page name alone does not prove the complete database or business logic behind that page. Exact SQL/table mappings should be validated against the application database and compiled code where required.

# Reports

Sales, purchase, stock, customer, supplier, financial, GST, commission, discount and operational reports.

## Scope
Operational and analytical reporting.

## Report families
- Sales
- Purchase
- Stock
- Customer
- Supplier
- Financial
- GST
- Commission
- Discount
- Operational/transaction reports

## Migration concern
Reports should be mapped to their underlying SQL queries/stored procedures and validated against transaction data.


## Source Trace Status

This module has been identified from the TextileSoft application structure. Exact page-to-database mappings should be added during source/database tracing.
