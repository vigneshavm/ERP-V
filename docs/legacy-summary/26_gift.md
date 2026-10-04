# TextileSoft Module Documentation

**Source:** `TEXTILESOFT 17.07.2025`

This document describes the identified business module and its known source-level areas. It is intended as a working reference for the TextileSoft analysis and ERP migration.

> Note: TextileSoft is a legacy ASP.NET WebForms application. Some server-side business logic is compiled into `App_Web_*.dll` assemblies, so a page name alone does not prove the complete database or business logic behind that page. Exact SQL/table mappings should be validated against the application database and compiled code where required.

# Gift

Gift purchase, gift sales, gift products, gift barcode, gift billing, gift return and gift-related reports.

## Scope
Gift-specific products and transactions.

## Identified areas
- Gift purchase
- Gift sales
- Gift product
- Gift barcode
- Gift billing
- Gift return
- Gift reports
- Gift token/QR

## Migration concern
Determine whether gift items follow normal inventory/barcode rules or a separate lifecycle.


## Source Trace Status

This module has been identified from the TextileSoft application structure. Exact page-to-database mappings should be added during source/database tracing.
