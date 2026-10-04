# TextileSoft Module Documentation

**Source:** `TEXTILESOFT 17.07.2025`

This document describes the identified business module and its known source-level areas. It is intended as a working reference for the TextileSoft analysis and ERP migration.

> Note: TextileSoft is a legacy ASP.NET WebForms application. Some server-side business logic is compiled into `App_Web_*.dll` assemblies, so a page name alone does not prove the complete database or business logic behind that page. Exact SQL/table mappings should be validated against the application database and compiled code where required.

# Purchase

Normal purchase, GST purchase, small purchase, wholesale/retail purchase, departmental purchase, fancy purchase, appliance purchase, gift purchase and purchase variants.

## Scope
Purchase transaction entry and purchase variants.

## Identified areas
- Normal purchase
- GST purchase
- Small purchase
- Wholesale/retail purchase
- Departmental purchase
- Fancy purchase
- Appliance purchase
- Gift purchase
- Discount/no-discount variants

## Critical dependency
Purchase is one of the key starting points for barcode creation and stock entry.

## Migration questions
- When is the barcode generated?
- Which purchase line becomes the barcode source?
- Is quantity stored at batch level, barcode level, or both?


## Source Trace Status

This module has been identified from the TextileSoft application structure. Exact page-to-database mappings should be added during source/database tracing.
