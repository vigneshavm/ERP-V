# TextileSoft Module Documentation

**Source:** `TEXTILESOFT 17.07.2025`

This document describes the identified business module and its known source-level areas. It is intended as a working reference for the TextileSoft analysis and ERP migration.

> Note: TextileSoft is a legacy ASP.NET WebForms application. Some server-side business logic is compiled into `App_Web_*.dll` assemblies, so a page name alone does not prove the complete database or business logic behind that page. Exact SQL/table mappings should be validated against the application database and compiled code where required.

# Sales / Billing

Retail, wholesale, cash, credit, GST, department, gift, grocery, electrical, tea-shop, super-bill, sales-order and billing functions.

## Scope
Customer-facing sales and invoice generation.

## Identified areas
- Retail sales
- Wholesale sales
- Cash sales
- Credit sales
- GST sales
- Department sales
- Gift sales
- Grocery sales
- Electrical sales
- Tea-shop sales
- Super bill
- Sales order
- Bill reprint/view

## Barcode dependency
Barcode scanning/lookup identifies the item sold and drives stock reduction and billing values.


## Source Trace Status

This module has been identified from the TextileSoft application structure. Exact page-to-database mappings should be added during source/database tracing.
