# TextileSoft Module Documentation

**Source:** `TEXTILESOFT 17.07.2025`

This document describes the identified business module and its known source-level areas. It is intended as a working reference for the TextileSoft analysis and ERP migration.

> Note: TextileSoft is a legacy ASP.NET WebForms application. Some server-side business logic is compiled into `App_Web_*.dll` assemblies, so a page name alone does not prove the complete database or business logic behind that page. Exact SQL/table mappings should be validated against the application database and compiled code where required.

# Inventory / Stock

Current stock, stock reports, product/group/brand/category/supplier/city/floor/rack/section/pattern/size/model stock, minimum quantity, missing and damaged stock.

## Scope
Stock visibility and stock reporting.

## Identified areas
- Current stock
- Stock detail/summary
- Product/group/brand/category stock
- Supplier stock
- City/floor/rack/section stock
- Pattern/size/model stock
- Minimum quantity
- Missing stock
- Damaged stock

## Migration dependency
Stock must reconcile with purchase, barcode, sales, return and transfer transactions.


## Source Trace Status

This module has been identified from the TextileSoft application structure. Exact page-to-database mappings should be added during source/database tracing.
